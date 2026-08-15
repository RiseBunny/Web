/*! RiseBunny Admin — v1 SIFIRDAN (temiz, hatasız) */
(function () {
  'use strict';

  /* ============ YARDIMCI ============ */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function esc(s) {
    if (s === undefined || s === null) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function getSec() {
    try { return JSON.parse(localStorage.getItem('rb_sec_v1') || 'null') || { attempts: 0, banned: false }; }
    catch (e) { return { attempts: 0, banned: false }; }
  }
  function setSec(s) {
    try { localStorage.setItem('rb_sec_v1', JSON.stringify(s)); } catch (e) {}
  }

  function show404() {
    fetch('404.html').then(function (r) {
      if (!r.ok) throw 0;
      return r.text();
    }).then(function (html) {
      document.open(); document.write(html); document.close();
    }).catch(function () {
      document.body.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;background:#050507;color:#fff;font-family:sans-serif"><h1 style="font-size:6rem;margin:0">404</h1><p style="color:#9ca3af">Page Not Found</p><a href="index.html" style="color:#06b6d4;margin-top:16px">← Back to Home</a></div>';
    });
  }

  function toast(msg, type) {
    type = type || 'success';
    var icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
    var el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.innerHTML = '<i class="fa-solid ' + (icons[type] || 'fa-circle-info') + '"></i><span>' + msg + '</span>';
    var w = $('#toast-wrap');
    if (w) w.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () { el.classList.remove('show'); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 350); }, 4200);
  }

  /* ============ GÜVENLİK KAPISI ============ */
  if (getSec().banned) { show404(); return; }
  var tok = sessionStorage.getItem('rb_admin_token');
  var tim = parseInt(sessionStorage.getItem('rb_admin_time') || '0', 10);
  if (!(tok && (Date.now() - tim < 15 * 60 * 1000))) { show404(); return; }

  /* ============ FIREBASE ============ */
  var ADMIN_UID = 'oblLBCNGXEYF8plKq8KUr3m6o4f1';
  var db = null, auth = null;
  var fconf = window.firebaseConfig || null;
  if (window.firebase && fconf && fconf.projectId) {
    try {
      if (!firebase.apps.length) firebase.initializeApp(fconf);
      auth = firebase.auth();
      db = firebase.firestore();
    } catch (e) { db = null; }
  }
  if (!db || !auth) { show404(); return; }

  /* ============ DEPOLAR ============ */
  var config = {};
  var products = [];
  var faqs = [];
  var features = [];
  var translations = { en: {}, tr: {} };
  var banner = {};
  var messages = [];
  var logs = [];
  var currentIconInput = null;

  /* ============ AUTH ============ */
  auth.onAuthStateChanged(function (user) {
    if (getSec().banned) { auth.signOut(); show404(); return; }
    if (!user) { showLogin(); return; }
    if (user.uid !== ADMIN_UID) {
      auth.signOut();
      toast('Yetkisiz UID erişimi!', 'error');
      show404();
      return;
    }
    sessionStorage.setItem('rb_admin_time', String(Date.now()));
    var emailEl = $('#user-email');
    if (emailEl) emailEl.textContent = user.email || '';
    showPanel();
  });

  function failAttempt() {
    var s = getSec();
    s.attempts = (s.attempts || 0) + 1;
    if (s.attempts >= 3) {
      s.banned = true;
      setSec(s);
      sessionStorage.removeItem('rb_admin_token');
      sessionStorage.removeItem('rb_admin_time');
      show404();
      return;
    }
    setSec(s);
    toast('Hatalı giriş! Kalan deneme: ' + (3 - s.attempts), 'error');
  }

  var loginForm = $('#login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (getSec().banned) { show404(); return; }
      var email = $('#login-email').value.trim().toLowerCase();
      var pass = $('#login-pass').value;
      auth.signInWithEmailAndPassword(email, pass)
        .then(function (result) {
          if (result.user.uid !== ADMIN_UID) {
            auth.signOut();
            failAttempt();
            return;
          }
          setSec({ attempts: 0, banned: false });
          toast('Giriş başarılı', 'success');
          logAction('login', 'Admin giriş yaptı');
        })
        .catch(function () { failAttempt(); });
    });
  }

  var logoutBtn = $('#btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      sessionStorage.removeItem('rb_admin_token');
      sessionStorage.removeItem('rb_admin_time');
      auth.signOut().then(function () { window.location.replace('index.html'); });
    });
  }

  function showLogin() {
    var a = $('#auth-screen'); if (a) a.hidden = false;
    var p = $('#panel'); if (p) p.hidden = true;
  }
  function showPanel() {
    var a = $('#auth-screen'); if (a) a.hidden = true;
    var p = $('#panel'); if (p) p.hidden = false;
    loadAll();
  }

  /* ============ TABS ============ */
  $$('.tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('.tab').forEach(function (t2) { t2.classList.remove('active'); });
      $$('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
      btn.classList.add('active');
      var panel = document.querySelector('[data-panel="' + btn.getAttribute('data-tab') + '"]');
      if (panel) panel.classList.add('active');
      var tab = btn.getAttribute('data-tab');
      if (tab === 'messages') loadMessages();
      if (tab === 'logs') loadLogs();
      if (tab === 'dashboard') loadDashboard();
    });
  });

  /* ============ LOAD ALL ============ */
  function loadAll() {
    Promise.all([
      db.collection('config').doc('site').get().catch(function () { return null; }),
      db.collection('products').get().catch(function () { return null; }),
      db.collection('faq').get().catch(function () { return null; }),
      db.collection('features').get().catch(function () { return null; }),
      db.collection('translations').doc('site').get().catch(function () { return null; }),
      db.collection('banner').doc('main').get().catch(function () { return null; }),
      db.collection('activity').orderBy('createdAt', 'desc').limit(20).get().catch(function () { return null; })
    ]).then(function (r) {
      if (r[0] && r[0].exists) config = r[0].data();
      products = [];
      if (r[1]) r[1].forEach(function (d) { var p = d.data(); p.id = d.id; products.push(p); });
      faqs = [];
      if (r[2]) r[2].forEach(function (d) { var f = d.data(); f.id = d.id; faqs.push(f); });
      features = [];
      if (r[3]) r[3].forEach(function (d) { var f = d.data(); f.id = d.id; features.push(f); });
      if (r[4] && r[4].exists) translations = r[4].data();
      if (r[5] && r[5].exists) banner = r[5].data();
      logs = [];
      if (r[6]) r[6].forEach(function (d) { var l = d.data(); l.id = d.id; logs.push(l); });
      buildAll();
    }).catch(function () { buildAll(); });
  }

  function buildAll() {
    buildGeneral();
    buildProducts();
    buildFAQ();
    buildFeatures();
    buildBanner();
    buildTranslations();
    loadDashboard();
  }

  /* ============ GENEL ============ */
  function buildGeneral() {
    $('#inp-lang').value = config.defaultLang || 'en';
    $('#inp-email').value = config.fallbackEmail || '';
    $('#inp-logo').value = config.logo || '';
   $('#soc-discord').value = (config.social && config.social.discord) || '';
    $('#soc-telegram').value = (config.social && config.social.telegram) || '';
    $('#soc-youtube').value = (config.social && config.social.youtube) || '';
    $('#soc-tiktok').value = (config.social && config.social.tiktok) || '';
  }

  var saveGeneralBtn = $('#btn-save-general');
  if (saveGeneralBtn) {
    saveGeneralBtn.addEventListener('click', function () {
      config = {
        defaultLang: $('#inp-lang').value,
        fallbackEmail: $('#inp-email').value.trim(),
        logo: $('#inp-logo').value.trim(),
        social: {
          discord: $('#soc-discord').value.trim(),
          telegram: $('#soc-telegram').value.trim(),
          youtube: $('#soc-youtube').value.trim(),
          tiktok: $('#soc-tiktok').value.trim()
        }
      };
      db.collection('config').doc('site').set(config).then(function () {
        toast('Genel ayarlar kaydedildi', 'success');
        logAction('update_general', 'Genel ayarlar güncellendi');
      }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
    });
  }

  var logoFile = $('#logo-file');
  if (logoFile) {
    logoFile.addEventListener('change', function () {
      if (!logoFile.files[0]) return;
      uploadImage(logoFile.files[0]).then(function (url) {
        $('#inp-logo').value = url;
        toast('Logo yüklendi — Kaydet’e bas', 'success');
      }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
    });
  }

  /* ============ GÖRSEL SIKIŞTIRMA ============ */
  function compressImage(file, maxDim, quality) {
    return new Promise(function (res, rej) {
      var rd = new FileReader();
      rd.onload = function () {
        var img = new Image();
        img.onload = function () {
          var scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          var c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.width * scale));
          c.height = Math.max(1, Math.round(img.height * scale));
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality));
        };
        img.onerror = rej;
        img.src = rd.result;
      };
      rd.onerror = rej;
      rd.readAsDataURL(file);
    });
  }

  function uploadImage(file) {
    toast('Görsel sıkıştırılıyor…', 'info');
    var steps = [[1200, 0.85], [900, 0.78], [700, 0.7], [520, 0.62]];
    function attempt(i) {
      return compressImage(file, steps[i][0], steps[i][1]).then(function (dataUrl) {
        if (dataUrl.length <= 900000 || i === steps.length - 1) {
          if (dataUrl.length > 950000) throw new Error('Görsel çok büyük');
          toast('Görsel hazır ✓', 'success');
          return dataUrl;
        }
        return attempt(i + 1);
      });
    }
    return attempt(0);
  }

  /* ============ RENK & İKON ============ */
  var COLORS = ['#7c3aed', '#a855f7', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  function colorRowHTML(cur) {
    return '<div class="color-row"><span class="color-label">Renk:</span>' +
      COLORS.map(function (c) {
        return '<button type="button" class="swatch' + ((cur || '') === c ? ' sel' : '') + '" data-color="' + c + '" style="background:' + c + '"></button>';
      }).join('') +
      '<input type="color" class="color-custom" value="' + (cur || '#06b6d4') + '"></div>';
  }

  function bindColor(row) {
    var hidden = row.querySelector('.p-color, .v-color');
    if (!hidden) return;
    row.querySelectorAll('.swatch').forEach(function (sw) {
      sw.addEventListener('click', function () {
        row.querySelectorAll('.swatch').forEach(function (x) { x.classList.remove('sel'); });
        sw.classList.add('sel');
        hidden.value = sw.getAttribute('data-color');
        var cust = row.querySelector('.color-custom');
        if (cust) cust.value = sw.getAttribute('data-color');
      });
    });
    var cust = row.querySelector('.color-custom');
    if (cust) cust.addEventListener('change', function () {
      row.querySelectorAll('.swatch').forEach(function (x) { x.classList.remove('sel'); });
      hidden.value = cust.value;
    });
  }

  var ICON_LIST = [
    'fa-solid fa-cube', 'fa-solid fa-box', 'fa-solid fa-gem', 'fa-solid fa-star', 'fa-solid fa-heart',
    'fa-solid fa-bolt', 'fa-solid fa-lightbulb', 'fa-solid fa-rocket', 'fa-solid fa-flame', 'fa-solid fa-crown',
    'fa-solid fa-shield-halved', 'fa-solid fa-layer-group', 'fa-solid fa-users', 'fa-solid fa-gamepad', 'fa-solid fa-robot',
    'fa-solid fa-code', 'fa-solid fa-terminal', 'fa-solid fa-server', 'fa-solid fa-database', 'fa-solid fa-cloud',
    'fa-solid fa-globe', 'fa-solid fa-chart-line', 'fa-solid fa-gauge-high', 'fa-solid fa-wand-magic-sparkles', 'fa-solid fa-palette',
    'fa-brands fa-discord', 'fa-brands fa-github', 'fa-brands fa-youtube', 'fa-brands fa-x-twitter', 'fa-brands fa-instagram',
    'fa-brands fa-apple', 'fa-brands fa-android', 'fa-brands fa-java', 'fa-brands fa-python'
  ];

  function openIconPicker() {
    var modal = $('#icon-picker');
    var grid = $('#icon-grid');
    if (!modal || !grid) return;
    grid.innerHTML = ICON_LIST.map(function (ic, idx) {
      var c = COLORS[idx % COLORS.length];
      return '<button type="button" class="icon-item" data-icon="' + ic + '" style="--c:' + c + '"><i class="' + ic + '"></i><span>' + ic.replace(/^fa-(solid|brands)\s/, '') + '</span></button>';
    }).join('');
    modal.classList.add('open');
    grid.querySelectorAll('.icon-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (currentIconInput) currentIconInput.value = btn.getAttribute('data-icon');
        modal.classList.remove('open');
        toast('İkon seçildi — Kaydet’e bas', 'info');
      });
    });
  }

  var ipClose = $('#icon-picker-close');
  if (ipClose) ipClose.addEventListener('click', function () { $('#icon-picker').classList.remove('open'); });
  var ipModal = $('#icon-picker');
  if (ipModal) ipModal.addEventListener('click', function (e) {
    if (e.target === ipModal) ipModal.classList.remove('open');
  });

  /* ============ ÜRÜNLER ============ */
  function buildProducts() {
    products.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    var container = $('#product-rows');
    if (!container) return;
    container.innerHTML = products.length === 0
      ? '<p class="msg-empty">Henüz ürün yok.</p>'
      : products.map(productRow).join('');
    bindProductEvents();
  }

  function productRow(p) {
    var st = [['dev', 'Geliştirmede'], ['project', 'Proje'], ['active', 'Aktif']].map(function (s) {
      return '<option value="' + s[0] + '"' + (p.status === s[0] ? ' selected' : '') + '>' + s[1] + '</option>';
    }).join('');
    return '<div class="admin-row" data-pid="' + p.id + '">' +
      '<div class="row-header"><div class="row-title"><input type="text" class="p-name" value="' + esc(p.name || '') + '" placeholder="Ürün adı"></div><input type="number" class="p-order" value="' + (p.order || 0) + '" style="width:64px"></div>' +
      '<div class="row-controls"><input type="text" class="p-platform" value="' + esc(p.platform || '') + '" placeholder="Platform"><select class="p-status">' + st + '</select></div>' +
      '<div class="row-controls" style="margin-top:8px"><label class="btn btn-glow btn-sm" style="justify-content:center"><i class="fa-solid fa-upload"></i> Görsel Yükle<input type="file" class="p-file" accept="image/*" hidden></label><input type="text" class="p-image" value="' + esc(p.image || '') + '" placeholder="Görsel (yükleyince otomatik dolar)" readonly></div>' +
      '<div class="row-controls full" style="margin-top:8px"><input type="text" class="p-download" value="' + esc(p.download || '') + '" placeholder="İndirme linki"></div>' +
      '<div class="row-controls" style="margin-top:8px;grid-template-columns:1fr auto"><input type="text" class="p-icon" value="' + esc(p.icon || 'fa-solid fa-box') + '" readonly><button type="button" class="btn btn-glow btn-sm p-pick-icon"><i class="fa-solid fa-palette"></i> İkon Seç</button></div>' +
      '<input type="hidden" class="p-color" value="' + esc(p.color || '') + '">' + colorRowHTML(p.color) +
      '<div class="row-controls" style="margin-top:8px"><textarea class="p-desc-en" rows="2" placeholder="Açıklama (EN)">' + esc((p.desc && p.desc.en) || '') + '</textarea><textarea class="p-desc-tr" rows="2" placeholder="Açıklama (TR)">' + esc((p.desc && p.desc.tr) || '') + '</textarea></div>' +
      '<div class="row-controls" style="margin-top:8px"><textarea class="p-feat-en" rows="3" placeholder="Özellikler (EN) — her satır bir tane">' + esc(((p.features && p.features.en) || []).join('\n')) + '</textarea><textarea class="p-feat-tr" rows="3" placeholder="Özellikler (TR) — her satır bir tane">' + esc(((p.features && p.features.tr) || []).join('\n')) + '</textarea></div>' +
      '<div class="row-actions"><button type="button" class="btn btn-primary btn-sm p-save"><i class="fa-solid fa-floppy-disk"></i> Kaydet</button><button type="button" class="btn btn-outline btn-sm danger p-delete"><i class="fa-solid fa-trash"></i> Sil</button></div>' +
      '</div>';
  }

  function bindProductEvents() {
    $$('.admin-row[data-pid]').forEach(function (row) {
      row.querySelector('.p-file').addEventListener('change', function () {
        var f = row.querySelector('.p-file').files[0];
        if (!f) return;
        uploadImage(f).then(function (url) { row.querySelector('.p-image').value = url; })
          .catch(function (e) { toast('Hata: ' + e.message, 'error'); });
      });
      row.querySelector('.p-pick-icon').addEventListener('click', function () {
        currentIconInput = row.querySelector('.p-icon');
        openIconPicker();
      });
      bindColor(row);
      row.querySelector('.p-save').addEventListener('click', function () {
        var pid = row.getAttribute('data-pid');
        var iconVal = row.querySelector('.p-icon').value.trim() || 'fa-solid fa-box';
        db.collection('products').doc(pid).set({
          name: row.querySelector('.p-name').value.trim(),
          platform: row.querySelector('.p-platform').value.trim(),
          status: row.querySelector('.p-status').value,
          order: parseInt(row.querySelector('.p-order').value, 10) || 0,
          image: row.querySelector('.p-image').value.trim(),
          download: row.querySelector('.p-download').value.trim(),
          color: row.querySelector('.p-color').value || '#06b6d4',
          icon: iconVal,
          pIcon: iconVal,
          desc: { en: row.querySelector('.p-desc-en').value, tr: row.querySelector('.p-desc-tr').value },
          features: {
            en: row.querySelector('.p-feat-en').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean),
            tr: row.querySelector('.p-feat-tr').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean)
          },
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function () {
          toast('Ürün kaydedildi', 'success');
          logAction('update_product', 'Ürün güncellendi: ' + row.querySelector('.p-name').value);
          loadAll();
        }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
      });
      row.querySelector('.p-delete').addEventListener('click', function () {
        if (!confirm('Ürün silinsin mi?')) return;
        db.collection('products').doc(row.getAttribute('data-pid')).delete().then(function () {
          toast('Ürün silindi', 'success');
          logAction('delete_product', 'Ürün silindi');
          loadAll();
        }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
      });
    });
  }

  var addProdBtn = $('#btn-add-product');
  if (addProdBtn) {
    addProdBtn.addEventListener('click', function () {
      var name = prompt('Yeni ürün adı:');
      if (!name) return;
      var id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
      db.collection('products').doc(id).set({
        name: name, platform: 'Platform', status: 'dev', order: products.length,
        image: '', download: '', color: '#06b6d4',
        icon: 'fa-solid fa-box', pIcon: 'fa-solid fa-box',
        desc: { en: '', tr: '' }, features: { en: [], tr: [] },
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function () {
        toast('Ürün oluşturuldu', 'success');
        logAction('add_product', 'Yeni ürün: ' + name);
        loadAll();
      }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
    });
  }

  /* ============ FAQ ============ */
  function buildFAQ() {
    faqs.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    var container = $('#faq-rows');
    if (!container) return;
    container.innerHTML = faqs.length === 0
      ? '<p class="msg-empty">Henüz FAQ yok.</p>'
      : faqs.map(function (f, i) {
        return '<div class="admin-row" data-fid="' + f.id + '">' +
          '<div class="row-header"><div class="row-title">Soru #' + (i + 1) + '</div><input type="number" class="f-order" value="' + (f.order || i) + '" style="width:64px"></div>' +
          '<div class="row-controls"><input type="text" class="f-q-en" value="' + esc((f.q && f.q.en) || '') + '" placeholder="Soru (EN)"><input type="text" class="f-q-tr" value="' + esc((f.q && f.q.tr) || '') + '" placeholder="Soru (TR)"></div>' +
          '<div class="row-controls" style="margin-top:8px"><textarea class="f-a-en" rows="2" placeholder="Cevap (EN)">' + esc((f.a && f.a.en) || '') + '</textarea><textarea class="f-a-tr" rows="2" placeholder="Cevap (TR)">' + esc((f.a && f.a.tr) || '') + '</textarea></div>' +
          '<div class="row-actions"><button type="button" class="btn btn-primary btn-sm f-save"><i class="fa-solid fa-floppy-disk"></i> Kaydet</button><button type="button" class="btn btn-outline btn-sm danger f-delete"><i class="fa-solid fa-trash"></i> Sil</button></div></div>';
      }).join('');
    $$('.admin-row[data-fid]').forEach(function (row) {
      row.querySelector('.f-save').addEventListener('click', function () {
        db.collection('faq').doc(row.getAttribute('data-fid')).set({
          order: parseInt(row.querySelector('.f-order').value, 10) || 0,
          q: { en: row.querySelector('.f-q-en').value, tr: row.querySelector('.f-q-tr').value },
          a: { en: row.querySelector('.f-a-en').value, tr: row.querySelector('.f-a-tr').value },
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function () {
          toast('FAQ kaydedildi', 'success');
          logAction('update_faq', 'FAQ güncellendi');
          loadAll();
        }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
      });
      row.querySelector('.f-delete').addEventListener('click', function () {
        if (!confirm('Silinsin mi?')) return;
        db.collection('faq').doc(row.getAttribute('data-fid')).delete().then(function () {
          toast('Silindi', 'success');
          logAction('delete_faq', 'FAQ silindi');
          loadAll();
        }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
      });
    });
  }

  var addFaqBtn = $('#btn-add-faq');
  if (addFaqBtn) {
    addFaqBtn.addEventListener('click', function () {
      var id = 'f-' + Date.now().toString(36);
      db.collection('faq').doc(id).set({
        order: faqs.length, q: { en: '', tr: '' }, a: { en: '', tr: '' },
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function () {
        toast('Yeni FAQ eklendi', 'success');
        logAction('add_faq', 'Yeni FAQ');
        loadAll();
      }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
    });
  }

  /* ============ FEATURES ============ */
  function buildFeatures() {
    features.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    var container = $('#feature-rows');
    if (!container) return;
    container.innerHTML = features.length === 0
      ? '<p class="msg-empty">Henüz özellik yok.</p>'
      : features.map(function (f, i) {
        return '<div class="admin-row" data-vid="' + f.id + '">' +
          '<div class="row-header"><div class="row-title">Özellik #' + (i + 1) + '</div><input type="number" class="v-order" value="' + (f.order || i) + '" style="width:64px"></div>' +
          '<div class="row-controls" style="grid-template-columns:1fr auto"><input type="text" class="v-icon" value="' + esc(f.icon || 'fa-solid fa-star') + '" readonly><button type="button" class="btn btn-glow btn-sm v-pick-icon"><i class="fa-solid fa-palette"></i> İkon Seç</button></div>' +
          '<input type="hidden" class="v-color" value="' + esc(f.color || '') + '">' + colorRowHTML(f.color) +
          '<div class="row-controls" style="margin-top:8px"><input type="text" class="v-t-en" value="' + esc((f.title && f.title.en) || '') + '" placeholder="Başlık (EN)"><input type="text" class="v-t-tr" value="' + esc((f.title && f.title.tr) || '') + '" placeholder="Başlık (TR)"></div>' +
          '<div class="row-controls" style="margin-top:8px"><textarea class="v-d-en" rows="2" placeholder="Açıklama (EN)">' + esc((f.desc && f.desc.en) || '') + '</textarea><textarea class="v-d-tr" rows="2" placeholder="Açıklama (TR)">' + esc((f.desc && f.desc.tr) || '') + '</textarea></div>' +
          '<div class="row-actions"><button type="button" class="btn btn-primary btn-sm v-save"><i class="fa-solid fa-floppy-disk"></i> Kaydet</button><button type="button" class="btn btn-outline btn-sm danger v-delete"><i class="fa-solid fa-trash"></i> Sil</button></div></div>';
      }).join('');
    $$('.admin-row[data-vid]').forEach(function (row) {
      row.querySelector('.v-pick-icon').addEventListener('click', function () {
        currentIconInput = row.querySelector('.v-icon');
        openIconPicker();
      });
      bindColor(row);
      row.querySelector('.v-save').addEventListener('click', function () {
        db.collection('features').doc(row.getAttribute('data-vid')).set({
          order: parseInt(row.querySelector('.v-order').value, 10) || 0,
          icon: row.querySelector('.v-icon').value.trim() || 'fa-solid fa-star',
          color: row.querySelector('.v-color').value || '#06b6d4',
          title: { en: row.querySelector('.v-t-en').value, tr: row.querySelector('.v-t-tr').value },
          desc: { en: row.querySelector('.v-d-en').value, tr: row.querySelector('.v-d-tr').value },
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function () {
          toast('Özellik kaydedildi', 'success');
          logAction('update_feature', 'Özellik güncellendi');
          loadAll();
        }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
      });
      row.querySelector('.v-delete').addEventListener('click', function () {
        if (!confirm('Silinsin mi?')) return;
        db.collection('features').doc(row.getAttribute('data-vid')).delete().then(function () {
          toast('Silindi', 'success');
          logAction('delete_feature', 'Özellik silindi');
          loadAll();
        }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
      });
    });
  }

  var addFeatureBtn = $('#btn-add-feature');
  if (addFeatureBtn) {
    addFeatureBtn.addEventListener('click', function () {
      var id = 'v-' + Date.now().toString(36);
      db.collection('features').doc(id).set({
        order: features.length, icon: 'fa-solid fa-star', color: '#06b6d4',
        title: { en: '', tr: '' }, desc: { en: '', tr: '' },
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function () {
        toast('Yeni özellik eklendi', 'success');
        logAction('add_feature', 'Yeni özellik');
        loadAll();
      }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
    });
  }

  /* ============ BANNER ============ */
  function buildBanner() {
    $('#banner-enabled').checked = !!banner.enabled;
    $('#banner-type').value = banner.type || 'info';
    $('#banner-en').value = (banner.text && banner.text.en) || '';
    $('#banner-tr').value = (banner.text && banner.text.tr) || '';
    $('#banner-link').value = banner.link || '';
  }

  var saveBannerBtn = $('#btn-save-banner');
  if (saveBannerBtn) {
    saveBannerBtn.addEventListener('click', function () {
      banner = {
        enabled: $('#banner-enabled').checked,
        type: $('#banner-type').value,
        text: { en: $('#banner-en').value, tr: $('#banner-tr').value },
        link: $('#banner-link').value.trim(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      db.collection('banner').doc('main').set(banner).then(function () {
        toast('Banner kaydedildi', 'success');
        logAction('update_banner', 'Banner güncellendi');
      }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
    });
  }

  /* ============ ÇEVİRİLER ============ */
  var TRANS_KEYS = [
    'nav_home', 'nav_products', 'nav_about', 'nav_faq', 'nav_contact',
    'hero_badge', 'hero_title', 'hero_sub', 'hero_desc', 'btn_explore', 'btn_learn',
    'prod_title', 'prod_sub', 'view_details', 'status_dev', 'status_project', 'status_active',
    'feat_title', 'feat_sub', 'about_title', 'about_p1', 'about_p2',
    'eco_title', 'eco_sub', 'faq_title', 'contact_title', 'contact_sub',
    'discord_title', 'discord_desc', 'lbl_name', 'lbl_email', 'lbl_subject', 'lbl_message',
    'ph_name', 'ph_email', 'ph_subject', 'ph_message',
    'btn_send', 'btn_sending', 'form_success', 'form_mailto', 'form_note',
    'footer_slogan', 'footer_nav', 'footer_legal', 'footer_contact', 'privacy', 'terms', 'copyright',
    'modal_features', 'btn_community', 'btn_download', 'btn_download_now'
  ];

  function buildTranslations() {
    if (!translations.en) translations.en = {};
    if (!translations.tr) translations.tr = {};
    var grid = $('#trans-grid');
    if (!grid) return;
    grid.innerHTML = TRANS_KEYS.map(function (k) {
      return '<div class="trans-key">' + k + '</div>' +
        '<div class="trans-row">' +
        '<textarea rows="2" class="tr-en" data-key="' + k + '" placeholder="English">' + esc(translations.en[k] || '') + '</textarea>' +
        '<textarea rows="2" class="tr-tr" data-key="' + k + '" placeholder="Türkçe">' + esc(translations.tr[k] || '') + '</textarea>' +
        '</div>';
    }).join('');
  }

  var saveTransBtn = $('#btn-save-trans');
  if (saveTransBtn) {
    saveTransBtn.addEventListener('click', function () {
      var en = {}, tr = {};
      $$('.tr-en').forEach(function (el) { en[el.getAttribute('data-key')] = el.value; });
      $$('.tr-tr').forEach(function (el) { tr[el.getAttribute('data-key')] = el.value; });
      translations = { en: en, tr: tr };
      db.collection('translations').doc('site').set(translations).then(function () {
        toast('Çeviriler kaydedildi', 'success');
        logAction('update_translations', 'Çeviriler güncellendi');
      }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
    });
  }

  /* ============ MESAJLAR ============ */
  function loadMessages() {
    var list = $('#messages-list');
    if (!list) return;
    list.innerHTML = '<div class="msg-empty">Yükleniyor...</div>';
    db.collection('messages').orderBy('createdAt', 'desc').limit(100).get().then(function (snap) {
      messages = [];
      snap.forEach(function (d) { var m = d.data(); m.id = d.id; messages.push(m); });
      renderMessages();
    }).catch(function (e) {
      list.innerHTML = '<div class="msg-empty">Mesajlar yüklenemedi: ' + esc(e.message) + '</div>';
    });
  }

  function renderMessages() {
    var list = $('#messages-list');
    if (!list) return;
    if (messages.length === 0) { list.innerHTML = '<div class="msg-empty">Henüz mesaj yok.</div>'; return; }
    list.innerHTML = messages.map(function (m) {
      var d = new Date(m.createdAt || 0);
      return '<div class="msg-item"><div class="msg-header"><span class="msg-sender">' + esc(m.name || '?') + ' &lt;' + esc(m.email || '?') + '&gt;</span><span class="msg-date">' + d.toLocaleString('tr-TR') + '</span></div>' +
        '<div class="msg-subject">' + esc(m.subject || '(konu yok)') + '</div>' +
        '<div class="msg-body">' + esc(m.message || '') + '</div>' +
        '<div class="row-actions" style="margin-top:10px"><button type="button" class="btn btn-outline btn-sm danger msg-del" data-mid="' + m.id + '"><i class="fa-solid fa-trash"></i> Sil</button></div></div>';
    }).join('');
    $$('.msg-del').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirm('Mesaj silinsin mi?')) return;
        db.collection('messages').doc(b.getAttribute('data-mid')).delete().then(function () {
          toast('Silindi', 'success');
          loadMessages();
        }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
      });
    });
  }

  var bRef = $('#btn-refresh-messages');
  if (bRef) bRef.addEventListener('click', loadMessages);

  /* ============ LOG ============ */
  function logAction(action, detail) {
    if (!db) return;
    db.collection('activity').add({
      action: action, detail: detail || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function () {});
  }

  function loadLogs() {
    var list = $('#logs-list');
    if (!list) return;
    list.innerHTML = '<div class="log-empty">Yükleniyor...</div>';
    db.collection('activity').orderBy('createdAt', 'desc').limit(100).get().then(function (snap) {
      logs = [];
      snap.forEach(function (d) { var l = d.data(); l.id = d.id; logs.push(l); });
      renderLogs();
    }).catch(function (e) {
      list.innerHTML = '<div class="log-empty">Log yüklenemedi: ' + esc(e.message) + '</div>';
    });
  }

  function renderLogs() {
    var list = $('#logs-list');
    if (!list) return;
    if (logs.length === 0) { list.innerHTML = '<div class="log-empty">Aktivite yok.</div>'; return; }
    var icons = {
      login: 'fa-right-to-bracket',
      update_general: 'fa-sliders', update_product: 'fa-box', add_product: 'fa-box-open', delete_product: 'fa-trash',
      update_faq: 'fa-circle-question', add_faq: 'fa-plus', delete_faq: 'fa-trash',
      update_feature: 'fa-star', add_feature: 'fa-plus', delete_feature: 'fa-trash',
      update_banner: 'fa-bullhorn', update_translations: 'fa-language'
    };
    list.innerHTML = logs.map(function (l) {
      var d = (l.createdAt && l.createdAt.toDate) ? l.createdAt.toDate() : new Date();
      return '<div class="log-item"><i class="fa-solid ' + (icons[l.action] || 'fa-circle') + '"></i><span><b>' + esc(l.action) + '</b>: ' + esc(l.detail || '') + '</span><span class="log-date">' + d.toLocaleString('tr-TR') + '</span></div>';
    }).join('');
  }

  var bClear = $('#btn-clear-logs');
  if (bClear) {
    bClear.addEventListener('click', function () {
      if (!confirm('Tüm log silinsin mi?')) return;
      db.collection('activity').get().then(function (snap) {
        var batch = db.batch();
        snap.forEach(function (d) { batch.delete(d.ref); });
        return batch.commit();
      }).then(function () { toast('Log temizlendi', 'success'); loadLogs(); })
        .catch(function (e) { toast('Hata: ' + e.message, 'error'); });
    });
  }

  /* ============ DASHBOARD ============ */
  function loadDashboard() {
    var p = $('#stat-products'); if (p) p.textContent = products.length;
    var f = $('#stat-faq'); if (f) f.textContent = faqs.length;
    var ft = $('#stat-features'); if (ft) ft.textContent = features.length;
    db.collection('messages').get().then(function (snap) {
      var m = $('#stat-messages'); if (m) m.textContent = snap.size;
    }).catch(function () {
      var m = $('#stat-messages'); if (m) m.textContent = '?';
    });
    db.collection('activity').orderBy('createdAt', 'desc').limit(5).get().then(function (snap) {
      var items = [];
      snap.forEach(function (d) { items.push(d.data()); });
      var icons = { login: 'fa-right-to-bracket', update_product: 'fa-box', add_product: 'fa-box-open', delete_product: 'fa-trash', update_faq: 'fa-circle-question', update_feature: 'fa-star', update_banner: 'fa-bullhorn', update_general: 'fa-sliders', update_translations: 'fa-language' };
      var recent = $('#recent-logs');
      if (!recent) return;
      recent.innerHTML = items.length === 0 ? '<div class="log-empty">Aktivite yok.</div>' :
        items.map(function (l) {
          var d = (l.createdAt && l.createdAt.toDate) ? l.createdAt.toDate() : new Date();
          return '<div class="log-item"><i class="fa-solid ' + (icons[l.action] || 'fa-circle') + '"></i><span>' + esc(l.detail || l.action) + '</span><span class="log-date">' + d.toLocaleString('tr-TR') + '</span></div>';
        }).join('');
    }).catch(function () {
      var recent = $('#recent-logs');
      if (recent) recent.innerHTML = '<div class="log-empty">Aktivite yüklenemedi.</div>';
    });
  }

})();