/*! RiseBunny Admin — Forum sekmesi: Şifre Değiştir + Hesabı Sil */
(function () {
'use strict';
var tok = sessionStorage.getItem('rb_admin_token');
var tim = parseInt(sessionStorage.getItem('rb_admin_time') || '0', 10);
if (!(tok && (Date.now() - tim < 15 * 60 * 1000))) return;   // panel kilidi yoksa çalışma
function ready(cb) { if (document.readyState !== 'loading') return cb(); document.addEventListener('DOMContentLoaded', cb); }
ready(function () {
  if (typeof firebase === 'undefined' || !window.firebaseConfig) return;
  if (!firebase.apps.length) firebase.initializeApp(window.firebaseConfig);
  var db = firebase.firestore();

  /* 🔑 İkincil oturum — admin girişi BOZULMAZ */
  var secAuth = null;
  try {
    var secApp = null;
    for (var i = 0; i < firebase.apps.length; i++) if (firebase.apps[i].name === 'rb-sec') secApp = firebase.apps[i];
    if (!secApp) secApp = firebase.initializeApp(window.firebaseConfig, 'rb-sec');
    secAuth = secApp.auth();
  } catch (e) {}

  var DOMAIN = '@risebunny.app';
  var FU = [], PW = {};
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ── Sekmeyi enjekte et ── */
  function inject() {
    var tabs = document.querySelectorAll('.tab');
    if (!tabs.length) return setTimeout(inject, 300);
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'tab'; btn.setAttribute('data-tab', 'forum');
    btn.innerHTML = '<i class="fa-solid fa-users-gear"></i> Forum';
    tabs[tabs.length - 1].parentNode.appendChild(btn);
    var sec = document.createElement('section');
    sec.className = 'tab-panel'; sec.setAttribute('data-panel', 'forum');
    sec.innerHTML = '<h2>🐰 Forum Kullanıcıları</h2>' +
      '<p style="color:#9ca3af;font-size:13px">Şifre değiştirme ve hesap silme buradan yapılır. <b style="color:#ff6b6d">Hesap silme geri alınamaz!</b></p>' +
      '<input type="text" id="fu-search" placeholder="🔍 Kullanıcı ara..." style="width:100%;margin:10px 0;padding:10px 12px;border-radius:10px;border:1px solid #2a3348;background:#0e1219;color:#fff;outline:none">' +
      '<div id="forum-users"><div class="msg-empty">Yükleniyor...</div></div>';
    var panels = document.querySelectorAll('.tab-panel');
    panels[panels.length - 1].parentNode.appendChild(sec);
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(function (x) { x.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function (x) { x.classList.remove('active'); });
      btn.classList.add('active'); sec.classList.add('active');
      loadUsers();
    });
    sec.querySelector('#fu-search').addEventListener('input', function (e) { render(e.target.value); });
  }

  function loadUsers() {
    Promise.all([db.collection('users').get(), db.collection('creds').get().catch(function () { return null; })])
      .then(function (r) {
        FU = []; r[0].forEach(function (d) { FU.push({ uid: d.id, ...d.data() }); });
        PW = {}; if (r[1]) r[1].forEach(function (d) { PW[d.id] = (d.data().password || null); });
        render('');
      }).catch(function (e) { alert('Yükleme hatası: ' + e.message); });
  }

  function render(q) {
    q = (q || '').toLowerCase();
    var box = document.getElementById('forum-users'); if (!box) return;
    var list = FU.filter(function (u) { return (u.username || '').toLowerCase().includes(q); });
    box.innerHTML = list.map(function (u) {
      return '<div class="admin-row" style="margin-bottom:12px" data-fuid="' + u.uid + '">' +
        '<div class="row-header"><div class="row-title"><b>👤 ' + esc(u.username) + '</b>' + (u.banned ? ' 🚫' : '') +
        ' <span style="color:#8b93a7;font-size:12px">(' + esc(u.role || 'member') + ')</span></div></div>' +
        '<div class="row-controls" style="margin-top:8px">' +
          '<select class="fu-role" style="padding:8px;border-radius:8px;background:#0e1219;color:#fff;border:1px solid #2a3348">' +
          ['member', 'vip', 'moderator', 'developer', 'kurucu'].map(function (r) { return '<option' + (r === u.role ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select>' +
          '<button type="button" class="btn btn-outline btn-sm fu-ban">' + (u.banned ? '✅ Ban Kaldır' : '🚫 BAN') + '</button>' +
        '</div>' +
        '<div class="row-controls" style="margin-top:8px;grid-template-columns:1fr auto auto auto">' +
          '<input type="text" class="fu-pw" readonly value="' + (PW[u.uid] ? '••••••••' : '— (kayıtlı değil)') + '" style="background:#0e1219;color:#fff;border:1px solid #2a3348;border-radius:8px;padding:8px">' +
          '<button type="button" class="btn btn-glow btn-sm fu-show">👁</button>' +
          '<button type="button" class="btn btn-primary btn-sm fu-chpw">🔑 Şifre Değiştir</button>' +
          '<button type="button" class="btn btn-outline btn-sm danger fu-del">🗑 Hesabı Sil</button>' +
        '</div></div>';
    }).join('') || '<div class="msg-empty">Kullanıcı yok.</div>';

    box.querySelectorAll('.admin-row[data-fuid]').forEach(function (row) {
      var uid = row.getAttribute('data-fuid');
      var u = FU.find(function (x) { return x.uid === uid; });
      row.querySelector('.fu-role').addEventListener('change', function (e) {
        db.collection('users').doc(uid).update({ role: e.target.value }).then(function () { alert('✅ Yetki güncellendi.'); loadUsers(); });
      });
      row.querySelector('.fu-ban').addEventListener('click', function () {
        db.collection('users').doc(uid).update({ banned: !u.banned }).then(function () { alert(u.banned ? '✅ Ban kaldırıldı.' : '🚫 BANlandı.'); loadUsers(); });
      });
      row.querySelector('.fu-show').addEventListener('click', function () {
        var inp = row.querySelector('.fu-pw');
        if (!PW[uid]) return;
        inp.value = (inp.dataset.show === '1') ? '••••••••' : PW[uid];
        inp.dataset.show = (inp.dataset.show === '1') ? '0' : '1';
      });
      row.querySelector('.fu-chpw').addEventListener('click', function () { changePw(uid, u.username); });
      row.querySelector('.fu-del').addEventListener('click', function () { deleteAccount(uid, u.username); });
    });
  }

  /* ── 🔑 Şifre değiştir (ikincil oturumla) ── */
  function changePw(uid, username) {
    var np = prompt('"' + username + '" için YENİ şifre (en az 6 karakter):');
    if (!np) return;
    if (np.length < 6) return alert('⚠️ Şifre en az 6 karakter olmalı.');
    if (!PW[uid]) return alert('⚠️ Eski şifre kasada kayıtlı değil (kullanıcı v14 sonrası hiç giriş yapmadı). Şifre değiştirilemez.');
    if (!secAuth) return alert('⚠️ İkincil oturum açılamadı.');
    secAuth.signInWithEmailAndPassword(username + DOMAIN, PW[uid]).then(function (r) {
      return r.user.updatePassword(np);
    }).then(function () {
      return db.collection('creds').doc(uid).set({ password: np, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }).then(function () { return secAuth.signOut(); })
      .then(function () { alert('✅ Şifre değiştirildi.'); loadUsers(); })
      .catch(function (e) { secAuth.signOut(); alert('⚠️ Hata: ' + e.message); });
  }

  /* ── 🗑 Hesabı sil (Auth + users + creds + konu + yorumlar) ── */
  function deleteAccount(uid, username) {
    if (!confirm('"' + username + '" hesabı ve TÜM verileri silinecek. Emin misin?')) return;
    if (!confirm('SON UYARI: Bu işlem GERİ ALINAMAZ. Devam edilsin mi?')) return;
    var doFirestore = function () {
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
    if (PW[uid] && secAuth) {
      secAuth.signInWithEmailAndPassword(username + DOMAIN, PW[uid]).then(function (r) {
        return r.user.delete();
      }).catch(function () { /* Auth silinemezse bile Firestore temizlenir */ })
        .then(doFirestore)
        .then(function () { alert('✅ Hesap tamamen silindi.'); loadUsers(); })
        .catch(function (e) { alert('⚠️ Kısmi hata: ' + e.message); loadUsers(); });
    } else {
      doFirestore().then(function () { alert('✅ Hesap verileri silindi. (Eski şifre kaydı olmadığı için Auth kaydı kalıntı olabilir.)'); loadUsers(); })
        .catch(function (e) { alert('⚠️ Hata: ' + e.message); });
    }
  }

  inject();
});
})();
