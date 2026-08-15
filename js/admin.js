(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function esc(s) { if (s === undefined || s === null) return ''; return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function getSec() { try { return JSON.parse(localStorage.getItem('rb_sec_v1') || 'null') || { attempts: 0, banned: false }; } catch (e) { return { attempts: 0, banned: false }; } }
  function setSec(s) { try { localStorage.setItem('rb_sec_v1', JSON.stringify(s)); } catch (e) {} }
  function getDeviceId() { var id = localStorage.getItem('rb_device_id'); if (!id) { id = 'd-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10); localStorage.setItem('rb_device_id', id); } return id; }
  function show404() { fetch('404.html').then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (h) { document.open(); document.write(h); document.close(); }).catch(function () { document.body.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;background:#050507;color:#fff;font-family:sans-serif"><h1 style="font-size:6rem;margin:0">404</h1><p style="color:#9ca3af">Page Not Found</p><a href="index.html" style="color:#06b6d4;margin-top:16px">← Back to Home</a></div>'; }); }
  function toast(msg, type) { type = type || 'success'; var ic = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' }; var el = document.createElement('div'); el.className = 'toast toast-' + type; el.innerHTML = '<i class="fa-solid ' + (ic[type] || 'fa-circle-info') + '"></i><span>' + msg + '</span>'; var w = $('#toast-wrap'); if (w) w.appendChild(el); requestAnimationFrame(function () { el.classList.add('show'); }); setTimeout(function () { el.classList.remove('show'); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 350); }, 4200); }
  var tok = sessionStorage.getItem('rb_admin_token');
  var tim = parseInt(sessionStorage.getItem('rb_admin_time') || '0', 10);
  if (!(tok && (Date.now() - tim < 15 * 60 * 1000))) { show404(); return; }
  var ADMIN_UID = 'oblLBCNGXEYF8plKq8KUr3m6o4f1';
  var db = null, auth = null, fconf = window.firebaseConfig || null;
  if (window.firebase && fconf && fconf.projectId) { try { if (!firebase.apps.length) firebase.initializeApp(fconf); auth = firebase.auth(); db = firebase.firestore(); } catch (e) { db = null; } }
  if (!db || !auth) { show404(); return; }
  var DEVICE_ID = getDeviceId();
  var config = {}, products = [], faqs = [], features = [], translations = { en: {}, tr: {} }, banner = {}, messages = [], logs = [], currentIconInput = null;
  function logAction(a, d) { db.collection('activity').add({ action: a, detail: d || '', createdAt: firebase.firestore.FieldValue.serverTimestamp() }).catch(function () {}); }
  function failAttempt(email) {
    var s = getSec(); s.attempts = (s.attempts || 0) + 1;
    if (s.attempts >= 3) {
      s.banned = true; setSec(s);
      sessionStorage.removeItem('rb_admin_token'); sessionStorage.removeItem('rb_admin_time');
      db.collection('bans').doc(DEVICE_ID).set({ email: email || 'bilinmiyor', deviceId: DEVICE_ID, attempts: s.attempts, banned: true, createdAt: firebase.firestore.FieldValue.serverTimestamp() }).catch(function () {});
      show404(); return;
    }
    setSec(s); toast('Hatalı giriş! Kalan deneme: ' + (3 - s.attempts), 'error');
  }
  function showLogin() { var a = $('#auth-screen'); if (a) a.hidden = false; var p = $('#panel'); if (p) p.hidden = true; }
  function showPanel() { var a = $('#auth-screen'); if (a) a.hidden = true; var p = $('#panel'); if (p) p.hidden = false; loadAll(); }
  function boot() {
    auth.onAuthStateChanged(function (user) {
      if (user && user.uid !== ADMIN_UID) { auth.signOut(); show404(); return; }
      if (!user) { showLogin(); return; }
      sessionStorage.setItem('rb_admin_time', String(Date.now()));
      var e = $('#user-email'); if (e) e.textContent = user.email || '';
      showPanel();
    });
    var lf = $('#login-form');
    if (lf) lf.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = $('#login-email').value.trim().toLowerCase();
      auth.signInWithEmailAndPassword(email, $('#login-pass').value).then(function (r) {
        if (r.user.uid !== ADMIN_UID) { auth.signOut(); failAttempt(email); return; }
        setSec({ attempts: 0, banned: false });
        toast('Giriş başarılı', 'success'); logAction('login', 'Admin giriş yaptı');
      }).catch(function () { failAttempt(email); });
    });
    var lo = $('#btn-logout');
    if (lo) lo.addEventListener('click', function () { sessionStorage.removeItem('rb_admin_token'); sessionStorage.removeItem('rb_admin_time'); auth.signOut().then(function () { window.location.replace('index.html'); }); });
    $$('.tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('.tab').forEach(function (x) { x.classList.remove('active});
      });
    });
    var ap = $('#btn-add-product');
    if (ap) ap.addEventListener('click', function () {
      var name = prompt('Yeni ürün adı:'); if (!name) return;
      var id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
      db.collection('products').doc(id).set({ name: name, platform: 'Platform', status: 'dev', order: products.length, image: '', download: '', color: '#06b6d4', icon: 'fa-solid fa-box', pIcon: 'fa-solid fa-box', desc: { en: '', tr: '' }, features: { en: [], tr: [] }, createdAt: firebase.firestore.FieldValue.serverTimestamp() }).then(function () { toast('Ürün oluşturuldu', 'success'); logAction('add_product', 'Yeni ürün: ' + name); loadAll(); }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
    });
  }
  function buildFAQ() {
    faqs.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    var c = $('#faq-rows'); if (!c) return;
    c.innerHTML = faqs.length === 0 ? '<p class="msg-empty">Henüz FAQ yok.</p>' : faqs.map(function (f, i) {
      return '<div class="admin-row" data-fid="' + f.id + '"><div class="row-header"><div class="row-title">Soru #' + (i + 1) + '</div><input type="number" class="f-order" value="' + (f.order || i) + '" style="width:64px"></div>' +
        '<div class="row-controls"><input type="text" class="f-q-en" value="' + esc((f.q && f.q.en) || '') + '" placeholder="Soru (EN)"><input type="text" class="f-q-tr" value="' + esc((f.q && f.q.tr) || '') + '" placeholder="Soru (TR)"></div>' +
        '<div class="row-controls" style="margin-top:8px"><textarea class="f-a-en" rows="2" placeholder="Cevap (EN)">' + esc((f.a && f.a.en) || '') + '</textarea><textarea class="f-a-tr" rows="2" placeholder="Cevap (TR)">' + esc((f.a && f.a.tr) || '') + '</textarea></div>' +
        '<div class="row-actions"><button type="button" class="btn btn-primary btn-sm f-save"><i class="fa-solid fa-floppy-disk"></i> Kaydet</button><button type="button" class="btn btn-outline btn-sm danger f-delete"><i class="fa-solid fa-trash"></i> Sil</button></div></div>';
    }).join('');
    $$('.admin-row[data-fid]').forEach(function (row) {
      row.querySelector('.f-save').addEventListener('click', function () {
        db.collection('faq').doc(row.getAttribute('data-fid')).set({ order: parseInt(row.querySelector('.f-order').value, 10) || 0, q: { en: row.querySelector('.f-q-en').value, tr: row.querySelector('.f-q-tr').value }, a: { en: row.querySelector('.f-a-en').value, tr: row.querySelector('.f-a-tr').value }, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }).then(function () { toast('FAQ kaydedildi', 'success'); logAction('update_faq', 'FAQ güncellendi'); loadAll(); }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
      });
      row.querySelector('.f-delete').addEventListener('click', function () {
        if (!confirm('Silinsin mi?')) return;
        db.collection('faq').doc(row.getAttribute('data-fid')).delete().then(function () { toast('Silindi', 'success'); logAction('delete_faq', 'FAQ silindi'); loadAll(); }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
      });
    });
    var af = $('#btn-add-faq');
    if (af) af.addEventListener('click', function () {
      var id = 'f-' + Date.now().toString(36);
      db.collection('faq').doc(id).set({ order: faqs.length, q: { en: '', tr: '' }, a: { en: '', tr: '' }, createdAt: firebase.firestore.FieldValue.serverTimestamp() }).then(function () { toast('Yeni FAQ eklendi', 'success'); logAction('add_faq', 'Yeni FAQ'); loadAll(); }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
    });
  }
  function buildFeatures() {
    features.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    var c = $('#feature-rows'); if (!c) return;
    c.innerHTML = features.length === 0 ? '<p class="msg-empty">Henüz özellik yok.</p>' : features.map(function (f, i) {
      return '<div class="admin-row" data-vid="' + f.id + '"><div class="row-header"><div class="row-title">Özellik #' + (i + 1) + '</div><input type="number" class="v-order" value="' + (f.order || i) + '" style="width:64px"></div>' +
        '<div class="row-controls" style="grid-template-columns:1fr auto"><input type="text" class="v-icon" value="' + esc(f.icon || 'fa-solid fa-star') + '" readonly><button type="button" class="btn btn-glow btn-sm v-pick-icon"><i class="fa-solid fa-palette"></i> İkon Seç</button></div>' +
        '<input type="hidden" class="v-color" value="' + esc(f.color || '') + '">' + colorRowHTML(f.color) +
        '<div class="row-controls" style="margin-top:8px"><input type="text" class="v-t-en" value="' + esc((f.title && f.title.en) || '') + '" placeholder="Başlık (EN)"><input type="text" class="v-t-tr" value="' + esc((f.title && f.title.tr) || '') + '" placeholder="Başlık (TR)"></div>' +
        '<div class="row-controls" style="margin-top:8px"><textarea class="v-d-en" rows="2" placeholder="Açıklama (EN)">' + esc((f.desc && f.desc.en) || '') + '</textarea><textarea class="v-d-tr" rows="2" placeholder="Açıklama (TR)">' + esc((f.desc && f.desc.tr) || '') + '</textarea></div>' +
        '<div class="row-actions"><button type="button" class="btn btn-primary btn-sm v-save"><i class="fa-solid fa-floppy-disk"></i> Kaydet</button><button type="button" class="btn btn-outline btn-sm danger v-delete"><i class="fa-solid fa-trash"></i> Sil</button></div></div>';
    }).join('');
    $$('.admin-row[data-vid]').forEach(function (row) {
      row.querySelector('.v-pick-icon').addEventListener('click', function () { currentIconInput = row.querySelector('.v-icon'); openIconPicker(); });
      bindColor(row);
      row.querySelector('.v-save').addEventListener('click', function () {
        db.collection('features').doc(row.getAttribute('data-vid')).set({ order: parseInt(row.querySelector('.v-order').value, 10) || 0, icon: row.querySelector('.v-icon').value.trim() || 'fa-solid fa-star', color: row.querySelector('.v-color').value || '#06b6d4', title: { en: row.querySelector('.v-t-en').value, tr: row.querySelector('.v-t-tr').value }, desc: { en: row.querySelector('.v-d-en').value, tr: row.querySelector('.v-d-tr').value }, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }).then(function () { toast('Özellik kaydedildi', 'success'); logAction('update_feature', 'Özellik güncellendi'); loadAll(); }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
      });
      row.querySelector('.v-delete').addEventListener('click', function () {
        if (!confirm('Silinsin mi?')) return;
        db.collection('features').doc(row.getAttribute('data-vid')).delete().then(function () { toast('Silindi', 'success'); logAction('delete_feature', 'Özellik silindi'); loadAll(); }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
      });
    });
    var av = $('#btn-add-feature');
    if (av) av.addEventListener('click', function () {
      var id = 'v-' + Date.now().toString(36);
      db.collection('features').doc(id).set({ order: features.length, icon: 'fa-solid fa-star', color: '#06b6d4', title: { en: '', tr: '' }, desc: { en: '', tr: '' }, createdAt: firebase.firestore.FieldValue.serverTimestamp() }).then(function () { toast('Yeni özellik eklendi', 'success'); logAction('add_feature', 'Yeni özellik'); loadAll(); }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
    });
  }
  function buildBanner() {
    $('#banner-enabled').checked = !!banner.enabled;
    $('#banner-type').value = banner.type || 'info';
    $('#banner-en').value = (banner.text && banner.text.en) || '';
    $('#banner-tr').value = (banner.text && banner.text.tr) || '';
    $('#banner-link').value = banner.link || '';
  }
  var sb = $('#btn-save-banner');
  if (sb) sb.addEventListener('click', function () {
    banner = { enabled: $('#banner-enabled').checked, type: $('#banner-type').value, text: { en: $('#banner-en').value, tr: $('#banner-tr').value }, link: $('#banner-link').value.trim(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    db.collection('banner').doc('main').set(banner).then(function () { toast('Banner kaydedildi', 'success'); logAction('update_banner', 'Banner güncellendi'); }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
  });
  var TRANS_KEYS = ['nav_home', 'nav_products', 'nav_about', 'nav_faq', 'nav_contact', 'hero_badge', 'hero_title', 'hero_sub', 'hero_desc', 'btn_explore', 'btn_learn', 'prod_title', 'prod_sub', 'view_details', 'status_dev', 'status_project', 'status_active', 'feat_title', 'feat_sub', 'about_title', 'about_p1', 'about_p2', 'eco_title', 'eco_sub', 'faq_title', 'contact_title', 'contact_sub', 'discord_title', 'discord_desc', 'lbl_name', 'lbl_email', 'lbl_subject', 'lbl_message', 'ph_name', 'ph_email', 'ph_subject', 'ph_message', 'btn_send', 'btn_sending', 'form_success', 'form_mailto', 'form_note', 'footer_slogan', 'footer_nav', 'footer_legal', 'footer_contact', 'privacy', 'terms', 'copyright', 'modal_features', 'btn_community', 'btn_download', 'btn_download_now', 'stat_cycle', 'stat_free', 'stat_excuses', 'stat_ideas'];
  function buildTranslations() {
    if (!translations.en) translations.en = {}; if (!translations.tr) translations.tr = {};
    var g = $('#trans-grid'); if (!g) return;
    g.innerHTML = TRANS_KEYS.map(function (k) {
      return '<div class="trans-key">' + k + '</div><div class="trans-row"><textarea rows="2" class="tr-en" data-key="' + k + '" placeholder="English">' + esc(translations.en[k] || '') + '</textarea><textarea rows="2" class="tr-tr" data-key="' + k + '" placeholder="Türkçe">' + esc(translations.tr[k] || '') + '</textarea></div>';
    }).join('');
  }
  var st2 = $('#btn-save-trans');
  if (st2) st2.addEventListener('click', function () {
    var en = {}, tr = {};
    $$('.tr-en').forEach(function (el) { var v = el.value.trim(); if (v) en[el.getAttribute('data-key')] = v; });
    $$('.tr-tr').forEach(function (el) { var v = el.value.trim(); if (v) tr[el.getAttribute('data-key')] = v; });
    translations = { en: en, tr: tr };
    db.collection('translations').doc('site').set(translations).then(function () { toast('Çeviriler kaydedildi', 'success'); logAction('update_translations', 'Çeviriler güncellendi'); }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
  });
  function loadMessages() {
    var l = $('#messages-list'); if (!l) return;
    l.innerHTML = '<div class="msg-empty">Yükleniyor...</div>';
    db.collection('messages').orderBy('createdAt', 'desc').limit(100).get().then(function (snap) {
      messages = []; snap.forEach(function (d) { var m = d.data(); m.id = d.id; messages.push(m); });
      if (messages.length === 0) { l.innerHTML = '<div class="msg-empty">Henüz mesaj yok.</div>'; return; }
      l.innerHTML = messages.map(function (m) {
        var dt = new Date(m.createdAt || 0);
        return '<div class="msg-item"><div class="msg-header"><span class="msg-sender">' + esc(m.name || '?') + ' &lt;' + esc(m.email || '?') + '&gt;</span><span class="msg-date">' + dt.toLocaleString('tr-TR') + '</span></div><div class="msg-subject">' + esc(m.subject || '(konu yok)') + '</div><div class="msg-body">' + esc(m.message || '') + '</div><div class="row-actions" style="margin-top:10px"><button type="button" class="btn btn-outline btn-sm danger msg-del" data-mid="' + m.id + '"><i class="fa-solid fa-trash"></i> Sil</button></div></div>';
      }).join('');
      $$('.msg-del').forEach(function (b) {
        b.addEventListener('click', function () {
          if (!confirm('Mesaj silinsin mi?')) return;
          db.collection('messages').doc(b.getAttribute('data-mid')).delete().then(function () { toast('Silindi', 'success'); loadMessages(); }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
        });
      });
    }).catch(function (e) { l.innerHTML = '<div class="msg-empty">Mesajlar yüklenemedi: ' + esc(e.message) + '</div>'; });
  }
  function loadBans() {
    var l = $('#bans-list'); if (!l) return;
    l.innerHTML = '<div class="msg-empty">Yükleniyor...</div>';
    db.collection('bans').get().then(function (snap) {
      if (snap.empty) { l.innerHTML = '<div class="msg-empty">Banlı kullanıcı yok 🎉</div>'; return; }
      var rows = []; snap.forEach(function (d) { var b = d.data(); b.id = d.id; rows.push(b); });
      rows.sort(function (a, b) { var ta = (a.createdAt && a.createdAt.toMillis) ? a.createdAt.toMillis() : 0; var tb = (b.createdAt && b.createdAt.toMillis) ? b.createdAt.toMillis() : 0; return tb - ta; });
      l.innerHTML = rows.map(function (b) {
        var dt = (b.createdAt && b.createdAt.toDate) ? b.createdAt.toDate().toLocaleString('tr-TR') : '-';
        return '<div class="msg-item"><div class="msg-header"><span class="msg-sender"><i class="fa-solid fa-user-slash" style="color:var(--err)"></i> ' + esc(b.email || 'bilinmiyor') + '</span><span class="msg-date">' + dt + '</span></div><div class="msg-subject">Cihaz ID: ' + esc(b.deviceId || b.id) + '</div><div class="msg-body">Hatalı deneme: ' + (b.attempts || 3) + ' — Durum: BANLI</div><div class="row-actions" style="margin-top:10px"><button type="button" class="btn btn-primary btn-sm ban-unban" data-bid="' + b.id + '"><i class="fa-solid fa-user-check"></i> Banı Kaldır</button></div></div>';
      }).join('');
      $$('.ban-unban').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!confirm('Emin misiniz? Bu kullanıcının banı kaldırılacak.')) return;
          db.collection('bans').doc(btn.getAttribute('data-bid')).delete().then(function () { toast('Ban kaldırıldı ✅', 'success'); logAction('unban', 'Ban kaldırıldı: ' + btn.getAttribute('data-bid')); loadBans(); }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
        });
      });
    }).catch(function (e) { l.innerHTML = '<div class="msg-empty">Banlar yüklenemedi: ' + esc(e.message) + '</div>'; });
  }
  function loadLogs() {
    var l = $('#logs-list'); if (!l) return;
    l.innerHTML = '<div class="log-empty">Yükleniyor...</div>';
    db.collection('activity').orderBy('createdAt', 'desc').limit(100).get().then(function (snap) {
      logs = []; snap.forEach(function (d) { var x = d.data(); x.id = d.id; logs.push(x); });
      if (logs.length === 0) { l.innerHTML = '<div class="log-empty">Aktivite yok.</div>'; return; }
      var icons = { login: 'fa-right-to-bracket', update_general: 'fa-sliders', update_product: 'fa-box', add_product: 'fa-box-open', delete_product: 'fa-trash', update_faq: 'fa-circle-question', add_faq: 'fa-plus', delete_faq: 'fa-trash', update_feature: 'fa-star', add_feature: 'fa-plus', delete_feature: 'fa-trash', update_banner: 'fa-bullhorn', update_translations: 'fa-language', unban: 'fa-user-check' };
      l.innerHTML = logs.map(function (x) {
        var d = (x.createdAt && x.createdAt.toDate) ? x.createdAt.toDate() : new Date();
        return '<div class="log-item"><i class="fa-solid ' + (icons[x.action] || 'fa-circle') + '"></i><span><b>' + esc(x.action) + '</b>: ' + esc(x.detail || '') + '</span><span class="log-date">' + d.toLocaleString('tr-TR') + '</span></div>';
      }).join('');
    }).catch(function (e) { l.innerHTML = '<div class="log-empty">Log yüklenemedi: ' + esc(e.message) + '</div>'; });
  }
  var cl = $('#btn-clear-logs');
  if (cl) cl.addEventListener('click', function () {
    if (!confirm('Tüm log silinsin mi?')) return;
    db.collection('activity').get().then(function (snap) { var batch = db.batch(); snap.forEach(function (d) { batch.delete(d.ref); }); return batch.commit(); }).then(function () { toast('Log temizlendi', 'success'); loadLogs(); }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
  });
  function loadDashboard() {
    var p = $('#stat-products'); if (p) p.textContent = products.length;
    var f = $('#stat-faq'); if (f) f.textContent = faqs.length;
    var ft = $('#stat-features'); if (ft) ft.textContent = features.length;
    db.collection('messages').get().then(function (snap) { var m = $('#stat-messages'); if (m) m.textContent = snap.size; }).catch(function () { var m = $('#stat-messages'); if (m) m.textContent = '?'; });
    db.collection('activity').orderBy('createdAt', 'desc').limit(5).get().then(function (snap) {
      var items = []; snap.forEach(function (d) { items.push(d.data()); });
      var icons = { login: 'fa-right-to-bracket', update_product: 'fa-box', add_product: 'fa-box-open', delete_product: 'fa-trash', update_faq: 'fa-circle-question', update_feature: 'fa-star', update_banner: 'fa-bullhorn', update_general: 'fa-sliders', update_translations: 'fa-language', unban: 'fa-user-check' };
      var r = $('#recent-logs'); if (!r) return;
      r.innerHTML = items.length === 0 ? '<div class="log-empty">Aktivite yok.</div>' : items.map(function (x) { var d = (x.createdAt && x.createdAt.toDate) ? x.createdAt.toDate() : new Date(); return '<div class="log-item"><i class="fa-solid ' + (icons[x.action] || 'fa-circle') + '"></i><span>' + esc(x.detail || x.action) + '</span><span class="log-date">' + d.toLocaleString('tr-TR') + '</span></div>'; }).join('');
    }).catch(function () { var r = $('#recent-logs'); if (r) r.innerHTML = '<div class="log-empty">Aktivite yüklenemedi.</div>'; });
  }
})();


                                                  
