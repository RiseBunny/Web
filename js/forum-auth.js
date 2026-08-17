/*! RiseBunny Forum Auth — Compat Mode
 *  - Forum: kullanıcı adı + şifre
 *  - Admin panel: mevcut mail + şifre + UID eşleşirse
 *  - 3 yanlış şifre = ban
 *  - Footer 5 tıklama = admin login
 */

const DOMAIN = "@risebunny.app";
const WEIGHT = { member:1, vip:2, moderator:3, developer:4, kurucu:5 };
const BADGE  = {
  kurucu:    { icon:"👑", tr:"Kurucu",     en:"Founder" },
  developer: { icon:"💻", tr:"Geliştirici", en:"Developer" },
  moderator: { icon:"🛡️", tr:"Moderatör",  en:"Moderator" },
  vip:       { icon:"⭐", tr:"VIP",        en:"VIP" },
  member:    { icon:"🐰", tr:"Üye",        en:"Member" }
};
let CURRENT = null;
let failCount = 0;  // hatalı şifre sayacı

const norm  = u => (u||"").trim().toLowerCase();
const valid = u => /^[a-z0-9_]{3,20}$/.test(u);
const myWeight = () => CURRENT ? (WEIGHT[CURRENT.role] || 1) : 0;

/* ─── Kullanıcı adı DB'de var mı? ─── */
async function usernameExists(u) {
  const s = await db.collection("users").where("username","==",u).get();
  return s.size > 0;
}

/* ─── KAYIT (sadece kullanıcı adı + şifre) ─── */
async function register(username, password) {
  username = norm(username);
  if (!valid(username))      throw "3-20 karakter; sadece a-z, 0-9, _";
  if (password.length < 6)   throw "Şifre en az 6 karakter olmalı.";
  if (await usernameExists(username)) throw "Bu kullanıcı adı alınmış.";
  const cred = await auth.createUserWithEmailAndPassword(username + DOMAIN, password);
  await db.collection("users").doc(cred.user.uid).set({
    username, role:"member", bio:"", avatar:"", banned:false,
    stats:{ threads:0, posts:0, likes:0 },
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
  });
}

/* ─── BAN et ─── */
async function banDevice(email, reason) {
  try {
    await db.collection("bans").add({
      email: email || "unknown",
      reason: reason || "3 hatalı şifre",
      device: navigator.userAgent.substring(0, 200),
      banned: true,
      date: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) { /* sessiz */ }
  // localStorage'te de iz bırak
  localStorage.setItem("rb_banned", "1");
}

/* ─── AKILLI GİRİŞ ───
 *   - "@" varsa mail (admin panel girişi veya üye)
 *   - yoksa kullanıcı adı (üye)
 */
async function smartLogin(identifier, password) {
  // Önce: bu cihaz banlı mı?
  if (localStorage.getItem("rb_banned") === "1") {
    throw "Bu cihaz uzaklaştırılmış. 🚫";
  }

  const idf = identifier.trim();
  const isMail = idf.includes("@");

  try {
    let cred, email;

    if (isMail) {
      // Admin paneli mail/şifre ile giriş denemesi
      email = idf.toLowerCase();
      cred = await auth.signInWithEmailAndPassword(email, password);
    } else {
      // Kullanıcı adı ile giriş
      email = norm(idf) + DOMAIN;
      if (await usernameExists(norm(idf))) {
        cred = await auth.signInWithEmailAndPassword(email, password);
      } else {
        // Hesap yok → KAYIT
        await register(idf, password);
        cred = await auth.signInWithEmailAndPassword(email, password);
      }
    }

    // Başarılıysa sayacı sıfırla
    failCount = 0;

    // Profil oku
    const udoc = await db.collection("users").doc(cred.user.uid).get();
    if (udoc.exists && udoc.data().banned) {
      await auth.signOut();
      throw "Hesap topluluktan uzaklaştırılmış. 🚫";
    }
    // lastLogin güncelle
    if (udoc.exists) {
      db.collection("users").doc(cred.user.uid).update({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      }).catch(()=>{});
    }

    // Admin UID ise otomatik kurucu
    if (cred.user.uid === window.ADMIN_UID && (!udoc.exists || udoc.data().role !== "kurucu")) {
      await db.collection("users").doc(cred.user.uid).set({
        username:"kurucu", role:"kurucu", banned:false, bio:"RiseBunny Kurucusu",
        avatar:"", stats:{ threads:0, posts:0, likes:0 },
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    return true;
  } catch (err) {
    failCount++;
    const msg = (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential")
      ? `Şifre yanlış. (${failCount}/3)`
      : (err.code === "auth/user-not-found" ? "Hesap bulunamadı." : (err.message || err));

    if (failCount >= 3) {
      await banDevice(idf, "3 yanlış şifre");
      throw "🚫 3 hatalı deneme. Cihaz banlandı.";
    }
    throw msg;
  }
}

/* ─── Oturum Dinleyici ─── */
function onAuth(cb) {
  auth.onAuthStateChanged(async u => {
    if (!u) { CURRENT = null; return cb(null); }
    const s = await db.collection("users").doc(u.uid).get();
    CURRENT = s.exists ? { uid: u.uid, ...s.data() } : null;
    cb(CURRENT);
  });
}

const logout = () => auth.signOut();

window.RBAuth = { CURRENT: () => CURRENT, WEIGHT, BADGE, myWeight,
  smartLogin, logout, onAuth, norm };
