/*! RiseBunny Forum Patch v9 */
(function () {
'use strict';
console.log('[RB] forum-patch v9 ✓');
function stamp() {
  var f = document.querySelector('.rb-footer');
  if (f && !f.getAttribute('data-v')) { f.setAttribute('data-v', '9'); f.innerHTML += ' · <b style="color:#8b5cf6">v9</b>'; }
}
setTimeout(stamp, 800);

var bn = 0;
function ensureBtn() {
  bn++;
  document.querySelectorAll('.rb-cathead').forEach(function (ch) {
    if (ch.querySelector('.rb-fab') || ch.querySelector('.rb-btn')) return;
    var slug = decodeURIComponent((location.hash.split('/')[2] || ''));
    var u = window.RBAuth && RBAuth.CURRENT();
    var a = document.createElement('a');
    a.className = 'rb-btn';
    a.href = u ? '#/new/' + encodeURIComponent(slug) : '#/login';
    a.textContent = '＋ Yeni Konu';
    ch.appendChild(a);
  });
  if (bn < 20) setTimeout(ensureBtn, 1200);
}
ensureBtn();

function heal() {
  if (typeof db === 'undefined' || typeof auth === 'undefined') return setTimeout(heal, 300);
  auth.onAuthStateChanged(async function (u) {
    if (!u) return;
    try {
      var ref = db.collection("users").doc(u.uid);
      var s = await ref.get();
      if (!s.exists) {
        var uname = (u.email || ("uye" + u.uid.slice(0, 6))).split("@")[0];
        try {
          await ref.set({ username: uname, role: (u.uid === window.ADMIN_UID) ? "kurucu" : "member",
            bio: "", avatar: "", banned: false, stats: { threads: 0, posts: 0, likes: 0 },
            createdAt: firebase.firestore.FieldValue.serverTimestamp(), lastLogin: firebase.firestore.FieldValue.serverTimestamp() });
        } catch (e1) {
          await ref.set({ username: uname + Math.floor(Math.random() * 90 + 10), role: "member",
            bio: "", avatar: "", banned: false, stats: { threads: 0, posts: 0, likes: 0 },
            createdAt: firebase.firestore.FieldValue.serverTimestamp(), lastLogin: firebase.firestore.FieldValue.serverTimestamp() });
        }
        location.reload();
      }
    } catch (e) {}
  });
}
heal();

function patchRB() {
  if (!window.RB) return setTimeout(patchRB, 300);
  var origNew = window.RB.newThread, origReply = window.RB.reply;
  window.RB.newThread = async function (slug) {
    try { await origNew(slug); }
    catch (e) { alert("⚠️ Konu açılamadı:\n" + ((e && e.message) || e)); }
  };
  window.RB.reply = async function (a, b, c) {
    try { await origReply(a, b, c); }
    catch (e) { alert("⚠️ Yanıt gönderilemedi:\n" + ((e && e.message) || e)); }
  };
}
patchRB();
})();
