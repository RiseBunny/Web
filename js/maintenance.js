/*! RiseBunny — Bakım Modu + Banner X Fix (tüm sayfalar, admin hariç) */
(function () {
'use strict';
var ADMIN_UID = 'oblLBCNGXEYF8plKq8KUr3m6o4f1';
var CONF = {
  apiKey: "AIzaSyAq5Nafl9aI2TabzGsj5J9ij6lNwyfTguM",
  authDomain: "gen-lang-client-0590499912.firebaseapp.com",
  projectId: "gen-lang-client-0590499912",
  storageBucket: "gen-lang-client-0590499912.firebasestorage.app",
  messagingSenderId: "203829901581",
  appId: "1:203829901581:web:66d532c52155db4aea9844"
};

/* ── Overlay ── */
var ov = document.createElement('div');
ov.id = 'rb-maintenance';
ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147483647;background:#050507;color:#fff;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:24px;font-family:system-ui,sans-serif';
ov.innerHTML = '<div style="font-size:64px;animation:rbPulse 1.6s infinite">🐰</div>' +
  '<h1 style="margin:12px 0 4px;font-size:26px">🔧 Bakım Modu</h1>' +
  '<p id="rb-mnt-msg" style="color:#9ca3af;max-width:420px;line-height:1.6"></p>' +
  '<p style="color:#4b5563;font-size:12px;margin-top:24px">© 2026 RiseBunny</p>' +
  '<style>@keyframes rbPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}</style>';
function mount() { (document.body || document.documentElement).appendChild(ov); }
if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

function showMaintenance(m) {
  var lang = localStorage.getItem('rb-lang') || 'tr';
  var msg = (m && m.message) || {};
  var el = document.getElementById('rb-mnt-msg');
  if (el) el.textContent = msg[lang] || msg.tr || msg.en || 'Site geçici olarak bakımda. / Site is under maintenance.';
  ov.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function isAdminish() {
  try {
    var tok = sessionStorage.getItem('rb_admin_token');
    var tim = parseInt(sessionStorage.getItem('rb_admin_time') || '0', 10);
    if (tok && (Date.now() - tim < 15 * 60 * 1000)) return true;
    var live = parseInt(localStorage.getItem('rb_admin_live') || '0', 10);
    if (live && (Date.now() - live < 15 * 60 * 1000)) return true;
  } catch (e) {}
  return false;
}

function loadSDK(src, cb) { var s = document.createElement('script'); s.src = src; s.onload = cb; s.onerror = cb; document.head.appendChild(s); }

function start() {
  if (!window.firebaseConfig) window.firebaseConfig = CONF;
  if (!window.firebase) {
    loadSDK('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js', function () {
      loadSDK('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js', function () {
        loadSDK('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js', run);
      });
    });
  } else run();
}

function run() {
  try {
    if (!firebase.apps.length) firebase.initializeApp(window.firebaseConfig);
    var db = firebase.firestore(), auth = firebase.auth();
    db.collection('config').doc('maintenance').get().then(function (s) {
      if (!(s.exists && s.data().active)) return;      // bakım kapalı
      if (isAdminish()) return;                        // token'lı admin
      var decided = false;
      var to = setTimeout(function () { if (!decided) { decided = true; showMaintenance(s.data()); } }, 1200);
      auth.onAuthStateChanged(function (u) {           // kalıcı oturumdan admin (tüm sekmeler)
        if (decided) return; decided = true; clearTimeout(to);
        if (u && u.uid === ADMIN_UID) return;          // admin → bakım YOK
        showMaintenance(s.data());
      });
    }).catch(function () {});
  } catch (e) {}
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

/* ══════════ BANNER X FIX — GÜVENLİ SÜRÜM ══════════ */
function findBanner(el) {
  while (el && el !== document.body) {
    var id = el.id || '', cl = (typeof el.className === 'string') ? el.className : '';
    if (/banner/i.test(id) || /banner/i.test(cl)) return el;
    el = el.parentNode;
  }
  return null;
}
function looksClose(btn) {
  var sig = (btn.className || '') + ' ' + (btn.getAttribute('aria-label') || '') + ' ' + (btn.innerHTML || '') + ' ' + (btn.textContent || '');
  return /close|times|xmark|✕|×/i.test(sig) || btn.getAttribute('data-rb-x') === '1';
}
/* X tıklamasını ÖNCE biz yakalarız → bozuk handler hiç çalışmaz → beyaz sayfa yok */
document.addEventListener('click', function (e) {
  var t = e.target; if (!t || !t.closest) return;
  var btn = t.closest('button, [class*="close" i], .fa-xmark, .fa-times');
  if (!btn || !looksClose(btn)) return;
  var ban = findBanner(btn);
  if (!ban || ban === document.body || ban.offsetHeight > 320 || ban.offsetHeight === 0) return; // GÜVENLİK: büyük blok asla gizlenmez
  e.preventDefault(); e.stopPropagation();
  if (e.stopImmediatePropagation) e.stopImmediatePropagation();
  ban.style.display = 'none';
  try { sessionStorage.setItem('rb_banner_hidden', '1'); } catch (er) {}
}, true);
/* Önce kapatıldıysa gizle + X yoksa ekle */
function patchBanner() {
  var nodes = document.querySelectorAll('[id*="banner" i], [class*="banner" i]');
  for (var i = 0; i < nodes.length; i++) {
    var el = nodes[i];
    if (el.id === 'rb-maintenance' || el.offsetHeight > 320 || el.offsetHeight === 0) continue;
    try {
      if (sessionStorage.getItem('rb_banner_hidden') === '1') { el.style.display = 'none'; continue; }
      if (!el.querySelector('button, [class*="close" i], .fa-xmark, .fa-times')) {
        var b = document.createElement('button');
        b.type = 'button'; b.innerHTML = '✕'; b.setAttribute('data-rb-x', '1');
        b.setAttribute('style', 'position:absolute;top:8px;right:10px;background:rgba(255,255,255,.15);border:none;color:#fff;width:30px;height:30px;border-radius:8px;cursor:pointer;font-size:14px;z-index:10');
        el.style.position = 'relative'; el.appendChild(b);
      }
    } catch (er) {}
  }
}
var pn = 0, pi = setInterval(function () { pn++; patchBanner(); if (pn > 10) clearInterval(pi); }, 1000);
})();
