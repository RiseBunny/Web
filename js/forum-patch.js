/*! RiseBunny Forum Patch — profil onarımı + hata görünürlüğü */
(function () {
'use strict';

/* ── 1) Eksik profil belgesini OTOMATİK onar ── */
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
          await ref.set({
            username: uname,
            role: (u.uid === window.ADMIN_UID) ? "kurucu" : "member",
            bio: "", avatar: "", banned: false,
            stats: { threads: 0, posts: 0, likes: 0 },
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
          });
        } catch (e1) {
          await ref.set({
            username: uname + Math.floor(Math.random() * 90 + 10),
            role: "member", bio: "", avatar: "", banned: false,
            stats: { threads: 0, posts: 0, likes: 0 },
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
        location.reload();
      }
    } catch (e) {}
  });
}
heal();

/* ── 2) Konu/yanıt hatalarını TAM sebebiyle göster ── */
function patchRB() {
  if (!window.RB) return setTimeout(patchRB, 300);
  var origNew = window.RB.newThread, origReply = window.RB.reply;
  window.RB.newThread = async function (slug) {
    try { await origNew(slug); }
    catch (e) { alert("⚠️ Konu açılamadı:\n" + ((e && e.message) || e) + "\n\nBu yazının ekran görüntüsünü at."); }
  };
  window.RB.reply = async function (a, b, c) {
    try { await origReply(a, b, c); }
    catch (e) { alert("⚠️ Yanıt gönderilemedi:\n" + ((e && e.message) || e) + "\n\nBu yazının ekran görüntüsünü at."); }
  };
}
patchRB();
})();
