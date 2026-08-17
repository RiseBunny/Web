/*! RiseBunny Firebase Config + Bakım/Banner Motoru (v8) */
window.firebaseConfig = {
  apiKey: "AIzaSyAq5Nafl9aI2TabzGsj5J9ij6lNwyfTguM",
  authDomain: "gen-lang-client-0590499912.firebaseapp.com",
  projectId: "gen-lang-client-0590499912",
  storageBucket: "gen-lang-client-0590499912.firebasestorage.app",
  messagingSenderId: "203829901581",
  appId: "1:203829901581:web:66d532c52155db4aea9844"
};
window.ADMIN_UID = 'oblLBCNGXEYF8plKq8KUr3m6o4f1';

(function () {
'use strict';
if (window.__rbCoreLoaded) return; window.__rbCoreLoaded = true;
if (/admin\.html(\?|$)/.test(location.pathname)) return;
try {
console.log('[RB] çekirdek v8 ✓');
var ADMIN_UID = window.ADMIN_UID;
var FORCE = /[?&]mnt=1/.test(location.search);

var ov = document.createElement('div');
ov.id = 'rb-maintenance';
ov.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147483647;background:#050507;color:#fff;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:24px;font-family:system-ui,sans-serif';
ov.innerHTML = '<div style="font-size:64px;animation:rbPulse 1.6s infinite">🐰</div>' +
  '<h1 style="margin:12px 0 4px;font-size:26px">🔧 Bakım Modu</h1>' +
  '<p id="rb-mnt-msg" style="color:#9ca3af;max-width:420px;line-height:1.6"></p>' +
  '<p style="color:#4b5563;font-size:12px;margin-top:24px">© 2026 RiseBunny</p>' +
  '<style>@keyframes rbPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}</style>';
function mount() { if (!document.getElementById('rb-maintenance')) (document.body || document.documentElement).appendChild(ov); }
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
function loadSDK(src) { return new Promise(function (res) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = res; document.head.appendChild(s); }); }
function ownApp() {
  try { return firebase.apps.length ? firebase.app() : firebase.initializeApp(window.firebaseConfig, 'rb-mnt'); }
  catch (e) { try { return firebase.app('rb-mnt'); } catch (e2) { return null; } }
}
function run(app) {
  try {
    var db = app.firestore(), auth = app.auth();
    function decide(data) {
      if (!FORCE && isAdminish()) return;
      var decided = false;
      var to = setTimeout(function () { if (!decided) { decided = true; showMaintenance(data); } }, 1200);
      try {
        auth.onAuthStateChanged(function (u) {
          if (decided) return; decided = true; clearTimeout(to);
          if (!FORCE && u && u.uid === ADMIN_UID) return;
          showMaintenance(data);
        });
      } catch (e) { if (!decided) { decided = true; clearTimeout(to); showMaintenance(data); } }
    }
    function check(n) {
      db.collection('config').doc('maintenance').get().then(function (s) {
        if (s.exists && s.data() && s.data().active) decide(s.data());
      }).catch(function () { if (n < 3) setTimeout(function () { check(n + 1); }, 1500); });
    }
    check(0);
  } catch (e) {}
}
/* 🔑 v8 KURALI: Sayfanın kendi app'i (app.js/forum) varsa ASLA app başlatma, sadece bekle.
   Kendi init'i OLMAYAN sayfalarda (404 vb.) 4 sn sonra kendimiz açarız. */
function tick(n) {
  n = n || 0;
  var hasOwn = !!document.querySelector('script[src*="app.js"], script[src*="forum-auth.js"]');
  if (window.firebase && window.firebase.firestore) {
    if (firebase.apps.length) return run(firebase.app());
    if (!hasOwn && n >= 40) { var a = ownApp(); if (a) run(a); return; }
    if (n >= 150) return;
    return setTimeout(function () { tick(n + 1); }, 100);
  }
  if (n >= 40) {
    if (hasOwn) return setTimeout(function () { tick(n + 1); }, 100);
    return loadSDK('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js')
      .then(function () { return loadSDK('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js'); })
      .then(function () { return loadSDK('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'); })
      .then(function () { var a = ownApp(); if (a) run(a); });
  }
  setTimeout(function () { tick(n + 1); }, 100);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { tick(0); }); else tick(0);

/* ══════════ BANNER X FIX ══════════ */
function findBanner(el) {
  while (el && el !== document.body) {
    var id = el.id || '', cl = (typeof el.className === 'string') ? el.className : '';
    if (/banner|duyuru|announce/i.test(id) || /banner|duyuru|announce/i.test(cl)) return el;
    el = el.parentNode;
  }
  return null;
}
function hideBanner(ban) {
  ban.style.display = 'none';
  try { sessionStorage.setItem('rb_banner_hidden_text', (ban.textContent || '').trim().slice(0, 120)); } catch (e) {}
}
function bindClose(btn, ban) {
  if (btn.__rb) return; btn.__rb = true;
  btn.addEventListener('click', function (ev) {
    try { ev.preventDefault(); ev.stopPropagation(); if (ev.stopImmediatePropagation) ev.stopImmediatePropagation(); } catch (e) {}
    hideBanner(ban);
  }, true);
}
document.addEventListener('click', function (e) {
  var t = e.target; if (!t || !t.closest) return;
  var btn = t.closest('button, [class*="close" i], .fa-xmark, .fa-times');
  if (!btn) return;
  var sig = (btn.className || '') + ' ' + (btn.innerHTML || '') + ' ' + (btn.textContent || '');
  if (!/close|times|xmark|✕|×/i.test(sig) && btn.getAttribute('data-rb-x') !== '1') return;
  var ban = findBanner(btn);
  if (!ban || ban === document.body || ban.offsetHeight > 320 || ban.offsetHeight === 0) return;
  hideBanner(ban);
}, true);
function patchBanner() {
  var admin = isAdminish();
  var saved = null; try { saved = sessionStorage.getItem('rb_banner_hidden_text'); } catch (e) {}
  var nodes = document.querySelectorAll('[id*="banner" i], [class*="banner" i], [id*="duyuru" i], [class*="duyuru" i]');
  for (var i = 0; i < nodes.length; i++) {
    var el = nodes[i];
    if (el.id === 'rb-maintenance' || el.offsetHeight > 320 || el.offsetHeight === 0) continue;
    var txt = (el.textContent || '').trim().slice(0, 120);
    if (!txt || txt.length < 3) continue;
    try {
      if (!admin && saved && saved === txt) { el.style.display = 'none'; continue; }
      if (saved && saved !== txt) sessionStorage.removeItem('rb_banner_hidden_text');
      var btns = el.querySelectorAll('button, [class*="close" i], .fa-xmark, .fa-times');
      if (!btns.length) {
        var b = document.createElement('button');
        b.type = 'button'; b.innerHTML = '✕'; b.setAttribute('data-rb-x', '1');
        b.setAttribute('style', 'position:absolute;top:8px;right:10px;background:rgba(255,255,255,.15);border:none;color:#fff;width:30px;height:30px;border-radius:8px;cursor:pointer;font-size:14px;z-index:10');
        el.style.position = 'relative'; el.appendChild(b);
        bindClose(b, el);
      } else { for (var j = 0; j < btns.length; j++) bindClose(btns[j], el); }
    } catch (e) {}
  }
}
var pn = 0, pi = setInterval(function () { pn++; patchBanner(); if (pn > 10) clearInterval(pi); }, 1000);
} catch (e) {}
})();
