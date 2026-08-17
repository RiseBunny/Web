/*! RiseBunny — Admin Forum Sekmesi v4 (geniş şifre alanı + kopyala) */
(function () {
'use strict';
var tok = sessionStorage.getItem('rb_admin_token');
var tim = parseInt(sessionStorage.getItem('rb_admin_time') || '0', 10);
if (!(tok && (Date.now() - tim < 15 * 60 * 1000))) return;

function waitFB(cb, n) {
  if (window.firebase && window.firebaseConfig) return cb();
  if ((n || 0) > 100) return;
  setTimeout(function () { waitFB(cb, (n || 0) + 1); }, 100);
}

waitFB(function () {
  if (!firebase.apps.length) { try { firebase.initializeApp(window.firebaseConfig); } catch (e) { return; } }
  var db = firebase.firestore();
  var secAuth = null;
  try {
    var secApp = null;
    for (var i = 0; i < firebase.apps.length; i++) if (firebase.apps[i].name === 'rb-sec') secApp = firebase.apps[i];
    if (!secApp) secApp = firebase.initializeApp(window.firebaseConfig, 'rb-sec');
    secAuth = secApp.auth();
  } catch (e) {}

  var FU = [], PW = {};
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function inject() {
    var tabs = document.querySelectorAll('.tab');
    if (!tabs.length) return setTimeout(inject, 300);
    if (document.querySelector('[data-tab="forum"]')) return;
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'tab'; btn.setAttribute('data-tab', 'forum');
    btn.innerHTML = '<i class="fa-solid fa-users-gear"></i> Forum';
    tabs[tabs.length - 1].parentNode.appendChild(btn);
    var sec = document.createElement('section');
    sec.className = 'tab-panel'; sec.setAttribute('data-panel', 'forum');
    sec.innerHTML = '<h2>🐰 Forum Kullanıcıları</h2>' +
      '<p style="color:#9ca3af;font-size:13px">👁 şifre gör · 📋 kopyala · 🔑 şifre değiştir · 🗑 <b style="color:#ff6b6d">HESABI SİL</b> (geri alınamaz!)</p>' +
      '<input type="text" id="fu-search" placeholder="🔍 Kullanıcı ara..." style="width:100%;margin:10px 0;padding:10px 12px;border-radius:10px;border:1px solid #2a3348;background:#0e1219;color:#fff;outline:none">' +
      '<div id="forum-users"><div class="msg-empty">Yükleniyor...</div></div>';
    var panels = document.querySelectorAll('.tab-panel');
    panels[panels.length - 1].parentNode.appendChild(sec);
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(function (x) { x.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function (x) { x.classList.remove('active'); });
      btn.classList.add('active'); sec.classList.add('active');
      load();
    });
    sec.querySelector('#fu-search').addEventListener('input', function (e) { render(e.target.value); });
  }

  function load() {
    var box = document.getElementById('forum-users'); if (!box) return;
    box.innerHTML = '<div class="msg-empty">Yüklenıyor...</div>';
    Promise.all([
      db.collection('users').get(),
      db.collection('creds').get().catch(function () { return null; })
    ]).then(function (r) {
      FU = []; r[0].forEach(function (d) { var u = d.data(); u.uid = d.id; FU.push(u); });
      PW = {}; if (r[1]) r[1].forEach(function (d) { PW[d.id] = (d.data().password || null); });
      render('');
    }).catch(function (e) { box.innerHTML = '<div class="msg-empty">Hata: ' + esc(e.message) + '</div>'; });
  }

  function render(q) {
    var box = document.getElementById('forum-users'); if (!box) return;
    q = (q || '').toLowerCase();
    var list = FU.filter(function (u) { return (u.username || '').toLowerCase().indexOf(q) > -1; });
    box.innerHTML = list.length ? list.map(function (u) {
      return '<div class="admin-row" data-fuid="' + u.uid + '" style="margin-bottom:12px">' +
        '<div class="row-header"><div class="row-title"><b>👤 ' + esc(u.username) + '</b>' + (u.banned ? ' 🚫' : '') + ' <span style="opacity:.6;font-size:12px">(' + esc(u.role || 'member') + ')</span></div></div>' +
        '<div class="row-controls" style="margin-top:8px">' +
          '<select class="fu-role" style="padding:8px;border-radius:8px;background:#0e1219;color:#fff;border:1px solid #2a3348">' + ['member', 'vip', 'moderator', 'developer', 'kurucu'].map(function (r) { return '<option' + (r === u.role ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select>' +
          '<button type="button" class="btn btn-outline btn-sm fu-ban">' + (u.banned ? '✅ Ban Kaldır' : '🚫 BAN') + '</button>' +
        '</div>' +
        '<div class="row-controls" style="margin-top:8px;grid-template-columns:1fr">' +
          '<input type="text" class="fu-pw" readonly data-show="0" value="' + (PW[u.uid] ? '••••••••' : '— (kayıtlı değil)') + '" style="width:100%;box-sizing:border-box;background:#0e1219;color:#fff;border:1px solid #2a3348;border-radius:8px;padding:10px 12px;font-size:14px">' +
        '</div>' +
        '<div class="row-controls" style="margin-top:8px">' +
          '<button type="button" class="btn btn-glow btn-sm fu-show">👁 Göster</button>' +
          '<button type="button" class="btn btn-glow btn-sm fu-copy">📋 Kopyala</button>' +
          '<button type="button" class="btn btn-primary btn-sm fu-chpw">🔑 Şifre Değiştir</button>' +
          '<button type="button" class="btn btn-outline btn-sm danger fu-del">🗑 HESABI SİL</button>' +
        '</div></div>';
    }).join('') : '<div class="msg-empty">Kullanıcı yok.</div>';

    box.querySelectorAll('.admin-row[data-fuid]').forEach(function (row) {
      var uid = row.getAttribute('data-fuid');
      var u = null; FU.forEach(function (x) { if (x.uid === uid) u = x; });
      row.querySelector('.fu-role').addEventListener('change', function (e) {
        db.collection('users').doc(uid).update({ role: e.target.value }).then(function () { alert('✅ Yetki güncellendi.'); load(); });
      });
      row.querySelector('.fu-ban').addEventListener('click', function () {
        db.collection('users').doc(uid).update({ banned: !u.banned }).then(function () { alert(u.banned ? '✅ Ban kaldırıldı.' : '🚫 BANlandı.'); load(); });
      });
      row.querySelector('.fu-show').addEventListener('click', function () {
        var inp = row.querySelector('.fu-pw');
        var btn = row.querySelector('.fu-show');
        if (!PW[uid]) { alert('⚠️ Bu kullanıcının şifresi kasada yok (henüz giriş yapmadı).'); return; }
        var showing = inp.getAttribute('data-show') === '1';
        inp.value = showing ? '••••••••' : PW[uid];
        inp.setAttribute('data-show', showing ? '0' : '1');
        btn.innerHTML = showing ? '👁 Göster' : '🙈 Gizle';
        if (!showing) { try { inp.focus(); inp.select(); } catch (e) {} }
      });
      row.querySelector('.fu-copy').addEventListener('click', function () {
        if (!PW[uid]) { alert('⚠️ Kopyalanacak şifre yok.'); return; }
        var done = function () { alert('📋 Şifre panoya kopyalandı.'); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(PW[uid]).then(done).catch(function () { fallbackCopy(PW[uid]); done(); });
        else { fallbackCopy(PW[uid]); done(); }
      });
      row.querySelector('.fu-chpw').addEventListener('click', function () { changePw(uid, u.username); });
      row.querySelector('.fu-del').addEventListener('click', function () { del(uid, u.username); });
    });
  }

  function fallbackCopy(txt) {
    var ta = document.createElement('textarea');
    ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  function changePw(uid, username) {
    var np = prompt('"' + username + '" için YENİ şifre (en az 6 karakter):');
    if (!np) return;
    if (np.length < 6) return alert('⚠️ En az 6 karakter.');
    if (!PW[uid]) return alert('⚠️ Eski şifre kasada yok (kullanıcı henüz giriş yapmadı).');
    secAuth.signInWithEmailAndPassword(username + '@risebunny.app', PW[uid]).then(function (r) {
      return r.user.updatePassword(np);
    }).then(function () {
      return db.collection('creds').doc(uid).set({ password: np, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }).then(function () { return secAuth.signOut(); }).then(function () {
      db.collection('activity').add({ action: 'forum_chpw', detail: 'Şifre değişti: ' + username, createdAt: firebase.firestore.FieldValue.serverTimestamp() }).catch(function () {});
      alert('✅ Şifre değiştirildi.'); load();
    }).catch(function (e) { secAuth.signOut(); alert('⚠️ Hata: ' + e.message); });
  }

  function del(uid, username) {
    if (!confirm('"' + username + '" hesabı ve TÜM verileri silinecek. Emin misin?')) return;
    if (!confirm('SON UYARI: GERİ ALINAMAZ! Devam edilsin mi?')) return;
    var clean = function () {
      return Promise.all([
        db.collection('threads').where('authorId', '==', uid).get(),
        db.collection('posts').where('authorId', '==', uid).get()
      ]).then(function (snaps) {
        var b = db.batch();
        snaps[0].forEach(function (d) { b.delete(d.ref); });
        snaps[1].forEach(function (d) { b.delete(d.ref); });
        b.delete(db.collection('users').doc(uid));
        b.delete(db.collection('creds').doc(uid));
        return b.commit();
      });
    };
    db.collection('creds').doc(uid).get().then(function (cs) {
      var pw = cs.exists ? (cs.data().password || null) : null;
      if (pw && secAuth) return secAuth.signInWithEmailAndPassword(username + '@risebunny.app', pw)
        .then(function (r) { return r.user.delete(); }).catch(function () {});
    }).then(clean).then(function () {
      db.collection('activity').add({ action: 'forum_delete', detail: 'Hesap silindi: ' + username, createdAt: firebase.firestore.FieldValue.serverTimestamp() }).catch(function () {});
      alert('✅ Hesap tamamen silindi.'); load();
    }).catch(function (e) { alert('⚠️ Hata: ' + (e.message || e)); load(); });
  }

  inject();
});
})();
