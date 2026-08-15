/*! RiseBunny Site App — v1 SIFIRDAN (temiz, hatasız) */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- FIREBASE (opsiyonel) ---------- */
  var db = null;
  var fconf = window.firebaseConfig || null;
  if (window.firebase && fconf && fconf.projectId) {
    try {
      if (!firebase.apps.length) firebase.initializeApp(fconf);
      db = firebase.firestore();
    } catch (e) { db = null; }
  }

  var FORMSPREE = 'https://formspree.io/f/mleyngol';

  /* ---------- VERİ ---------- */
  var RD = window.RB_DATA || { products: [], faqs: [], features: [], i18n: { en: {}, tr: {} } };
  var PRODUCTS = JSON.parse(JSON.stringify(RD.products || []));
  var FAQS = JSON.parse(JSON.stringify(RD.faqs || []));
  var FEATURES = JSON.parse(JSON.stringify(RD.features || []));
  var I18N = {
    en: JSON.parse(JSON.stringify((RD.i18n && RD.i18n.en) || {})),
    tr: JSON.parse(JSON.stringify((RD.i18n && RD.i18n.tr) || {}))
  };
  var DEFAULT_CONFIG = { defaultLang: 'en', fallbackEmail: 'info@risebunny.com', logo: '', social: { discord: '', telegram: '', youtube: '', tiktok: '' } };
  var CFG = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  var LANG = 'en';
  var BANNER = null;

  function t(k) {
    if (I18N[LANG] && I18N[LANG][k]) return I18N[LANG][k];
    if (I18N.en && I18N.en[k]) return I18N.en[k];
    return k;
  }

  /* ---------- DİL ---------- */
  window.RB = {
    setLang: function (l) {
      try {
        LANG = (l === 'tr') ? 'tr' : 'en';
        document.documentElement.lang = LANG;
        document.title = (LANG === 'tr') ? 'RiseBunny | Sınırların Ötesine Yüksel' : 'RiseBunny | Rise Beyond Limits';
        $$('[data-i18n]').forEach(function (el) {
          var v = t(el.getAttribute('data-i18n'));
          if (v) el.innerHTML = v;
        });
        $$('[data-i18n-ph]').forEach(function (el) {
          var v = t(el.getAttribute('data-i18n-ph'));
          if (v) el.placeholder = v;
        });
        $$('.lang-btn').forEach(function (b) {
          b.classList.toggle('active', b.getAttribute('data-lang') === LANG);
        });
        renderProducts();
        renderFeatures();
        renderFAQ();
        renderBanner();
      } catch (e) { toast('Dil hatası: ' + e.message, 'error'); }
    }
  };

  /* ---------- RENDER: ÜRÜNLER ---------- */
  function renderProducts() {
    var grid = $('#products-grid');
    if (!grid) return;
    try {
      var sorted = PRODUCTS.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
      if (!sorted.length) {
        grid.innerHTML = '<p style="text-align:center;color:var(--muted);padding:30px">—</p>';
        return;
      }
      grid.innerHTML = sorted.map(function (p, i) {
        var desc = (p.desc && (p.desc[LANG] || p.desc.en)) || '';
        return '<article class="product-card reveal" style="--d:' + (i * 70) + 'ms;--pc:' + (p.color || '#06b6d4') + '" data-id="' + p.id + '" tabindex="0" role="button">' +
          '<div class="card-banner">' +
          '<div class="banner-fallback"><i class="' + (p.icon || 'fa-solid fa-box') + '"></i></div>' +
          (p.image ? '<img src="' + p.image + '" alt="' + p.name + '" loading="lazy" onerror="this.classList.add(\'broken\')">' : '') +
          '<span class="status-badge status-' + p.status + '">' + t('status_' + p.status) + '</span>' +
          '</div>' +
          '<div class="card-body">' +
          '<div class="card-top"><h3>' + p.name + '</h3><span class="platform"><i class="' + (p.pIcon || p.icon || 'fa-solid fa-box') + '"></i>' + p.platform + '</span></div>' +
          '<p>' + desc + '</p>' +
          '<div class="card-footer"><span>' + t('view_details') + '</span><i class="fa-solid fa-arrow-right"></i></div>' +
          '</div></article>';
      }).join('');
      $$('#products-grid .product-card').forEach(function (c) {
        var open = function () { openModal(c.getAttribute('data-id')); };
        c.addEventListener('click', open);
        c.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
        });
      });
      observeReveals();
    } catch (e) { toast('Ürün hatası: ' + e.message, 'error'); }
  }

  /* ---------- RENDER: ÖZELLİKLER ---------- */
  function renderFeatures() {
    var grid = $('#features-grid');
    if (!grid) return;
    var sorted = FEATURES.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    grid.innerHTML = sorted.map(function (f, i) {
      var title = (f.title && (f.title[LANG] || f.title.en)) || '';
      var desc = (f.desc && (f.desc[LANG] || f.desc.en)) || '';
      return '<div class="feature-card reveal" style="--d:' + (i * 60) + 'ms;--fc:' + (f.color || '#06b6d4') + '">' +
        '<div class="feature-icon"><i class="' + f.icon + '"></i></div>' +
        '<h3>' + title + '</h3><p>' + desc + '</p></div>';
    }).join('');
    observeReveals();
  }

  /* ---------- RENDER: FAQ ---------- */
  function renderFAQ() {
    var list = $('#faq-list');
    if (!list) return;
    var sorted = FAQS.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    list.innerHTML = sorted.map(function (f) {
      var q = (f.q && (f.q[LANG] || f.q.en)) || '';
      var a = (f.a && (f.a[LANG] || f.a.en)) || '';
      return '<div class="faq-item">' +
        '<button type="button" class="faq-q">' + q + '<i class="fa-solid fa-chevron-down"></i></button>' +
        '<div class="faq-a"><div><p>' + a + '</p></div></div></div>';
    }).join('');
    $$('#faq-list .faq-q').forEach(function (b) {
      b.addEventListener('click', function () { b.parentElement.classList.toggle('open'); });
    });
  }

/* ---------- RENDER: SOSYAL ---------- */
  function renderSocials() {
    var el = $('#social-links');
    if (!el) return;
    var icons = {
      discord: 'fa-brands fa-discord',
      telegram: 'fa-brands fa-telegram',
      youtube: 'fa-brands fa-youtube',
      tiktok: 'fa-brands fa-tiktok',
      github: 'fa-brands fa-github',
      x: 'fa-brands fa-x-twitter',
      instagram: 'fa-brands fa-instagram'
    };
    var html = '';
    Object.keys(CFG.social || {}).forEach(function (k) {
      var url = CFG.social[k];
      var ic = icons[k];
      /* Hem link HEM ikon varsa çiz — yoksa ASLA boş kutu çıkarma */
      if (url && ic) {
        html += '<a class="social-link" href="' + url + '" target="_blank" rel="noopener" aria-label="' + k + '"><i class="' + ic + '"></i></a>';
      }
    });
    el.innerHTML = html;
  }

  /* ---------- RENDER: BANNER ---------- */
  function renderBanner() {
    var el = $('#site-banner');
    if (!el) return;
    if (!BANNER || !BANNER.enabled || sessionStorage.getItem('banner_closed') === '1') {
      el.hidden = true;
      document.body.classList.remove('has-banner');
      return;
    }
    var text = (BANNER.text && (BANNER.text[LANG] || BANNER.text.en)) || '';
    if (!text) { el.hidden = true; document.body.classList.remove('has-banner'); return; }
    el.className = 'site-banner type-' + (BANNER.type || 'info');
    el.innerHTML = '<span>' + text + '</span>' +
      (BANNER.link ? '<a href="' + BANNER.link + '" target="_blank" rel="noopener">→</a>' : '') +
      '<button type="button" class="banner-close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>';
    el.hidden = false;
    document.body.classList.add('has-banner');
    el.querySelector('.banner-close').addEventListener('click', function () {
      el.hidden = true;
      document.body.classList.remove('has-banner');
      sessionStorage.setItem('banner_closed', '1');
    });
  }

  /* ---------- MODAL ---------- */
  function openModal(id) {
    var p = null;
    for (var i = 0; i < PRODUCTS.length; i++) { if (PRODUCTS[i].id === id) { p = PRODUCTS[i]; break; } }
    if (!p) return;
    var img = $('#m-img');
    if (img) {
      img.classList.remove('broken');
      if (p.image) { img.src = p.image; img.style.display = ''; } else { img.style.display = 'none'; }
      img.alt = p.name;
    }
    var ti = $('#m-title'); if (ti) ti.textContent = p.name;
    var de = $('#m-desc'); if (de) de.textContent = (p.desc && (p.desc[LANG] || p.desc.en)) || '';
    var tg = $('#m-tags');
    if (tg) {
      tg.innerHTML = '<span class="status-badge status-' + p.status + '" style="position:static">' + t('status_' + p.status) + '</span>' +
        '<span class="tag-platform">' + p.platform + '</span>';
    }
    var feats = (p.features && (p.features[LANG] || p.features.en)) || [];
    var ft = $('#m-feat-title'); if (ft) { ft.textContent = t('modal_features'); ft.style.display = feats.length ? '' : 'none'; }
    var fe = $('#m-features');
    if (fe) {
      fe.innerHTML = feats.map(function (f) {
        return '<div class="m-feature"><i class="fa-solid fa-check"></i>' + f + '</div>';
      }).join('');
    }
    var act = $('#modal-actions');
    if (act) {
      act.innerHTML = (p.download
        ? '<a class="btn btn-primary" href="' + p.download + '" target="_blank" rel="noopener"><i class="fa-solid fa-download"></i> ' + t('btn_download_now') + '</a>'
        : '<button type="button" class="btn btn-primary" disabled><i class="fa-solid fa-clock"></i> ' + t('btn_download') + '</button>') +
        '<a href="#contact" class="btn btn-outline m-comm"><i class="fa-brands fa-discord"></i> ' + t('btn_community') + '</a>';
      var comm = act.querySelector('.m-comm');
      if (comm) comm.addEventListener('click', closeModal);
    }
    var m = $('#modal');
    if (m) { m.classList.add('open'); document.body.classList.add('no-scroll'); }
  }
  function closeModal() {
    var m = $('#modal');
    if (m) { m.classList.remove('open'); document.body.classList.remove('no-scroll'); }
  }
  var mc = $('#modal-close'); if (mc) mc.addEventListener('click', closeModal);
  var mo = $('#modal'); if (mo) mo.addEventListener('click', function (e) { if (e.target === mo) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  /* ---------- TOAST ---------- */
  function toast(msg, type) {
    type = type || 'info';
    var icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
    var el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.innerHTML = '<i class="fa-solid ' + (icons[type] || 'fa-circle-info') + '"></i><span>' + msg + '</span>';
    var w = $('#toast-wrap');
    if (w) w.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () { el.classList.remove('show'); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 350); }, 4200);
  }

  /* ---------- İLETİŞİM FORMU ---------- */
  var cform = $('#contact-form');
  if (cform) {
    cform.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!cform.checkValidity()) { cform.reportValidity(); return; }
      var btn = $('#send-btn');
      var data = new FormData(cform);
      var payload = {
        name: String(data.get('name') || ''),
        email: String(data.get('email') || ''),
        subject: String(data.get('subject') || ''),
        message: String(data.get('message') || ''),
        lang: LANG,
        createdAt: Date.now()
      };
      if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ' + t('btn_sending'); }
      var fsP = db ? db.collection('messages').add(payload).catch(function () {}) : Promise.resolve();
      Promise.all([fsP, fetch(FORMSPREE, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })])
        .then(function () { toast(t('form_success'), 'success'); cform.reset(); })
        .catch(function () {
          window.location.href = 'mailto:' + (CFG.fallbackEmail || 'info@risebunny.com') +
            '?subject=' + encodeURIComponent(payload.subject || 'RiseBunny') +
            '&body=' + encodeURIComponent(payload.message + '\n\n--\n' + payload.name + ' <' + payload.email + '>');
          toast(t('form_mailto'), 'info');
        })
        .then(function () {
          if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> ' + t('btn_send'); }
        });
    });
  }

  /* ---------- NAV / BURGER ---------- */
  var burger = $('#burger');
  var navLinks = $('#nav-links');
  if (burger && navLinks) {
    burger.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });
    $$('#nav-links a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        burger.innerHTML = '<i class="fa-solid fa-bars"></i>';
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }
  window.addEventListener('scroll', function () {
    var nav = $('#navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900 && navLinks) {
      navLinks.classList.remove('open');
      if (burger) burger.innerHTML = '<i class="fa-solid fa-bars"></i>';
    }
  });

  /* ---------- REVEAL ---------- */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 }) : null;
  function observeReveals() {
    if (!io) { $$('.reveal').forEach(function (el) { el.classList.add('visible'); }); return; }
    $$('.reveal:not(.visible)').forEach(function (el) { io.observe(el); });
  }

  /* ---------- PARTİKÜL ---------- */
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var wrap = $('#particles');
    if (wrap) {
      for (var i = 0; i < 22; i++) {
        var s = document.createElement('span');
        var size = 2 + Math.random() * 4;
        s.style.cssText = 'left:' + (Math.random() * 100) + '%;width:' + size + 'px;height:' + size + 'px;opacity:' + (0.12 + Math.random() * 0.3) + ';animation-duration:' + (9 + Math.random() * 16) + 's;animation-delay:-' + (Math.random() * 20) + 's;background:' + (Math.random() > 0.5 ? 'var(--accent)' : 'var(--primary)');
        wrap.appendChild(s);
      }
    }
  }

  /* ---------- DİL BUTONLARI ---------- */
  $$('.lang-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var l = b.getAttribute('data-lang');
      if (l && window.RB && window.RB.setLang) window.RB.setLang(l);
    });
  });

  /* ---------- GİZLİ ADMİN: 5 DOKUNUŞ ---------- */
  (function () {
    var taps = 0, timer = null;
    document.addEventListener('click', function (e) {
      var node = e.target, hit = false;
      for (var i = 0; i < 4 && node; i++) {
        if (node.classList && node.classList.contains('rb-copyright')) { hit = true; break; }
        node = node.parentElement;
      }
      if (!hit) return;
      e.preventDefault();
      taps++;
      clearTimeout(timer);
      timer = setTimeout(function () { taps = 0; }, 2500);
      if (taps >= 5) {
        taps = 0;
        sessionStorage.setItem('rb_admin_token', btoa(Date.now() + '_' + Math.random().toString(36).slice(2)));
        sessionStorage.setItem('rb_admin_time', String(Date.now()));
        window.location.href = 'admin.html';
      }
    }, true);
  })();

  /* ---------- LOGO ---------- */
  function setLogo(sel, emojiSel) {
    var el = $(sel);
    if (!el) return;
    if (CFG.logo) {
      el.onload = function () {
        el.style.display = 'inline-block';
        var em = document.querySelector(emojiSel);
        if (em) em.style.display = 'none';
      };
      el.onerror = function () { el.style.display = 'none'; };
      el.src = CFG.logo;
    } else {
      el.style.display = 'none';
    }
  }

  /* ---------- BAŞLAT ---------- */
  function startApp() {
    setLogo('#logo-img', '.logo-emoji');
    setLogo('#hero-logo-img', '.hero-emoji');
    setLogo('#footer-logo-img', '.f-emoji');
    renderSocials();
    window.RB.setLang(CFG.defaultLang || 'en');
    observeReveals();
  }

  function loadAll() {
    if (!db) { startApp(); return; }
    Promise.all([
      db.collection('config').doc('site').get().catch(function () { return null; }),
      db.collection('products').get().catch(function () { return null; }),
      db.collection('faq').get().catch(function () { return null; }),
      db.collection('features').get().catch(function () { return null; }),
      db.collection('translations').doc('site').get().catch(function () { return null; }),
      db.collection('banner').doc('main').get().catch(function () { return null; })
    ]).then(function (r) {
      if (r[0] && r[0].exists) CFG = Object.assign(JSON.parse(JSON.stringify(DEFAULT_CONFIG)), r[0].data());
      if (r[1] && r[1].size > 0) { PRODUCTS = []; r[1].forEach(function (d) { var p = d.data(); p.id = d.id; PRODUCTS.push(p); }); }
      if (r[2] && r[2].size > 0) { FAQS = []; r[2].forEach(function (d) { var f = d.data(); f.id = d.id; FAQS.push(f); }); }
      if (r[3] && r[3].size > 0) { FEATURES = []; r[3].forEach(function (d) { var f = d.data(); f.id = d.id; FEATURES.push(f); }); }
      if (r[4] && r[4].exists) {
        var tr = r[4].data();
        if (tr.en) I18N.en = Object.assign(I18N.en, tr.en);
        if (tr.tr) I18N.tr = Object.assign(I18N.tr, tr.tr);
      }
      if (r[5] && r[5].exists) BANNER = r[5].data();
      startApp();
    }).catch(function () { startApp(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAll);
  } else {
    loadAll();
  }
})();