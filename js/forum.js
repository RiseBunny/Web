/*! RiseBunny Forum — Compat SPA | Admin: footer 5-tık ŞART */

const L = {
  tr:{ login:"Giriş / Kayıt", logout:"Çıkış", ident:"Kullanıcı adı",
    pass:"Şifre", enter:"Giriş Yap", cats:"Kategoriler", newThread:"＋ Yeni Konu", title:"Konu başlığı",
    content:"Mesajın...", send:"Gönder", reply:"Yanıt yaz...", replies:"yanıt", views:"görüntülenme",
    locked:"🔒 Yoruma kapalı", pinned:"📌 Sabit", admin:"⚙️ Yetkili Paneli", users:"Kullanıcılar",
    threads:"Konular", ban:"BAN", unban:"BAN Kaldır", del:"Sil", lock:"Kilitle", unlock:"Kilidi Aç",
    pin:"Sabitle", unpin:"Sabitleme", noPerm:"🚫 Bu bölüme erişim yetkin yok.", notFound:"404 — Sayfa Bulunamadı",
    empty:"Henüz konu yok. İlk konuyu sen aç! 🐰", vip:"VIP Forum", back:"← Geri" },
  en:{ login:"Login / Register", logout:"Logout", ident:"Username",
    pass:"Password", enter:"Sign in", cats:"Categories", newThread:"＋ New Thread", title:"Thread title",
    content:"Your message...", send:"Send", reply:"Write a reply...", replies:"replies", views:"views",
    locked:"🔒 Locked", pinned:"📌 Pinned", admin:"⚙️ Staff Panel", users:"Users",
    threads:"Threads", ban:"BAN", unban:"Unban", del:"Delete", lock:"Lock", unlock:"Unlock",
    pin:"Pin", unpin:"Unpin", noPerm:"🚫 You lack permission.", notFound:"404 — Not Found",
    empty:"No threads yet. Start the first! 🐰", vip:"VIP Forum", back:"← Back" }
};
let lang = localStorage.getItem("rb-lang") || "tr";
const t = k => (L[lang] && L[lang][k]) || L.tr[k] || k;
window.rbSetLang = l => { lang = l; localStorage.setItem("rb-lang", l); route(); };

const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const badge = r => { const b = RBAuth.BADGE[r] || RBAuth.BADGE.member;
  return `<span class="rb-badge" data-role="${r}">${b.icon} ${esc(b[lang]||b.tr)}</span>`; };
const fmt = ts => ts && ts.seconds ? new Date(ts.seconds*1000)
  .toLocaleString(lang=="tr"?"tr-TR":"en-GB",{day:"numeric",month:"short",hour:"2d",minute:"2d"}) : "—";
const secs = ts => (ts && ts.seconds) || 0;
const view = () => document.getElementById("view");
const CUR = () => RBAuth.CURRENT();
const myW = () => RBAuth.myWeight();
const adminUnlocked = () => sessionStorage.getItem("rb_fadmin") === "1";

/* ── HATALARI EKRANA YAZ ── */
function showErr(e) { const v = document.getElementById("view");
  if (v) v.innerHTML = '<div class="rb-empty">⚠️ Hata: ' + (e && e.message ? e.message : e) + '</div>'; }
window.addEventListener("error", e => showErr(e.message || e.error));
window.addEventListener("unhandledrejection", e => showErr(e.reason));

/* ── Navbar ── */
function nav() {
  const u = CUR();
  const box = document.getElementById("rb-nav-user"); if (!box) return;
  box.innerHTML = u
    ? `${myW()>=2 ? `<a class="rb-vipbtn" href="#/c/vip">⭐ ${t("vip")}</a>` : ""}
       <a class="rb-userchip" href="#/u/${esc(u.username)}">${badge(u.role)} ${esc(u.username)}</a>
       ${myW()>=3 && adminUnlocked() ? `<a class="rb-adminbtn" href="#/admin">${t("admin")}</a>` : ""}
       <button class="rb-ghost" onclick="RB.logout()">${t("logout")}</button>`
    : `<a class="rb-userchip" href="#/login">🐰 ${t("login")}</a>`;
}

/* ── Router ─ */
function route() {
  try {
    nav();
    const h = (location.hash || "#/").split("/");
    const page = h[1] || "", arg = decodeURIComponent(h[2] || "");
    if (page === "")      return renderHome();
    if (page === "c")     return renderCategory(arg);
    if (page === "t")     return renderThread(arg);
    if (page === "u")     return renderProfile(arg);
    if (page === "new")   return renderNew(arg);
    if (page === "login") return renderLogin();
    if (page === "admin") {
      if (!adminUnlocked() || myW() < 3)
        return view().innerHTML = `<div class="rb-empty">${t("notFound")}</div>`;
      return renderAdmin();
    }
    view().innerHTML = `<div class="rb-empty">${t("notFound")}</div>`;
  } catch (e) { showErr(e); }
}

/* ── Kategoriler ── */
async function renderHome() {
  const snap = await db.collection("categories").get();
  const cats = []; snap.forEach(d => cats.push({ slug: d.id, ...d.data() }));
  cats.sort((a,b) => (a.order||0) - (b.order||0));
  let cards = "";
  cats.forEach(c => {
    if ((c.minWeight||0) > myW()) return;
    cards += `<a class="rb-card" href="#/c/${esc(c.slug)}">
      <div class="rb-icon">${esc(c.icon||"💬")}</div>
      <div class="rb-info"><h3>${esc((c.name&&c.name[lang])||(c.name&&c.name.tr)||c.slug)} ${(c.minWeight||0)>=2?"🔒":""}</h3>
        <p>${esc((c.desc&&c.desc[lang])||(c.desc&&c.desc.tr)||"")}</p></div>
      <div class="rb-stats"><div class="rb-stat"><b>${(c.stats&&c.stats.threads)||0}</b><span>${t("threads")}</span></div></div></a>`;
  });
  view().innerHTML = `<div class="forum-wrap"><h2 class="rb-h2">${t("cats")}</h2>
    ${cards || `<div class="rb-empty">${t("empty")}</div>`}</div>`;
}

/* ── Konu listesi ── */
async function renderCategory(slug) {
  const cd = await db.collection("categories").doc(slug).get();
  if (!cd.exists || (cd.data().minWeight||0) > myW())
    return view().innerHTML = `<div class="rb-empty">${t("noPerm")}</div>`;
  const c = cd.data();
  const snap = await db.collection("threads").where("categoryId","==",slug).get();
  const list = []; snap.forEach(d => list.push({ id: d.id, ...d.data() }));
  list.sort((a,b) => (b.pinned?1:0)-(a.pinned?1:0) || secs(b.lastPostAt)-secs(a.lastPostAt));
  view().innerHTML = `<div class="forum-wrap">
    <a class="rb-back" href="#/">${t("back")}</a>
    <div class="rb-cathead"><span class="rb-icon">${esc(c.icon||"💬")}</span>
      <h2>${esc((c.name&&c.name[lang])||c.slug)}</h2>
      <a class="rb-btn" href="${CUR() ? `#/new/${esc(slug)}` : "#/login"}">${t("newThread")}</a></div>
    ${list.map(th => `<a class="rb-card" href="#/t/${th.id}">
      <div class="rb-info"><h3>${th.pinned?`<em class="rb-pin">${t("pinned")}</em> `:""}${th.locked?`<em class="rb-lock">${t("locked")}</em> `:""}${esc(th.title)}</h3>
        <p>${badge(th.authorRole||"member")} <b>${esc(th.authorName)}</b> · ${fmt(th.createdAt)}</p></div>
      <div class="rb-stats"><div class="rb-stat"><b>${th.replies||0}</b><span>${t("replies")}</span></div>
      <div class="rb-stat"><b>${th.views||0}</b><span>${t("views")}</span></div></div></a>`).join("") || `<div class="rb-empty">${t("empty")}</div>`}
  </div>`;
}

/* ── Konu + yanıtlar ── */
async function renderThread(id) {
  const td = await db.collection("threads").doc(id).get();
  if (!td.exists) return view().innerHTML = `<div class="rb-empty">${t("notFound")}</div>`;
  const th = td.data();
  if ((th.minWeight||0) > myW()) return view().innerHTML = `<div class="rb-empty">${t("noPerm")}</div>`;
  db.collection("threads").doc(id).update({ views: firebase.firestore.FieldValue.increment(1) }).catch(()=>{});
  const ps = await db.collection("posts").where("threadId","==",id).get();
  const arr = []; ps.forEach(d => arr.push({ id: d.id, ...d.data() }));
  arr.sort((a,b) => secs(a.createdAt) - secs(b.createdAt));
  let posts = ""; arr.forEach(p => {
    posts += `<div class="rb-post"><div class="rb-posthead">${badge(p.authorRole||"member")}
      <b>${esc(p.authorName)}</b><span class="rb-time">${fmt(p.createdAt)}${p.edited?" ✏️":""}</span></div>
      <div class="rb-postbody">${esc(p.content).replace(/\n/g,"<br>")}</div>
      ${myW()>=3 ? `<button class="rb-ghost" onclick="RB.delPost('${p.id}')">${t("del")}</button>` : ""}</div>`;
  });
  const canReply = (CUR() && !th.locked) || myW() >= 3;
  view().innerHTML = `<div class="forum-wrap">
    <a class="rb-back" href="#/c/${esc(th.categoryId)}">${t("back")}</a>
    <div class="rb-threadhead"><h2>${esc(th.title)}</h2>
      <p>${badge(th.authorRole||"member")} <b>${esc(th.authorName)}</b> · ${fmt(th.createdAt)}
      ${th.locked ? ` · <em class="rb-lock">${t("locked")}</em>` : ""}</p>
      ${myW()>=3 ? `<div class="rb-modbar">
        <button class="rb-ghost" onclick="RB.lock('${id}',${!th.locked})">${th.locked?t("unlock"):t("lock")}</button>
        <button class="rb-ghost" onclick="RB.pin('${id}',${!th.pinned})">${th.pinned?t("unpin"):t("pin")}</button>
        <button class="rb-ghost rb-danger" onclick="RB.delThread('${id}')">${t("del")}</button></div>` : ""}</div>
    <div class="rb-post rb-op"><div class="rb-postbody">${esc(th.content).replace(/\n/g,"<br>")}</div></div>
    ${posts}
    ${CUR() && canReply ? `<div class="rb-replybox"><textarea id="replyBox" placeholder="${t("reply")}"></textarea>
      <button class="rb-btn" onclick="RB.reply('${id}','${esc(th.categoryId)}',${th.minWeight||0})">${t("send")}</button></div>`
    : CUR() ? `<div class="rb-empty">${t("locked")}</div>`
    : `<a class="rb-btn" href="#/login">${t("login")}</a>`}
  </div>`;
}

/* ── Yeni konu ── */
async function renderNew(slug) {
  if (!CUR()) return renderLogin();
  view().innerHTML = `<div class="forum-wrap"><a class="rb-back" href="#/c/${esc(slug)}">${t("back")}</a>
    <div class="rb-form"><input id="ntTitle" placeholder="${t("title")}" maxlength="90">
    <textarea id="ntBody" placeholder="${t("content")}"></textarea>
    <button class="rb-btn" onclick="RB.newThread('${esc(slug)}')">${t("send")}</button></div></div>`;
}

/* ── Profil ── */
async function renderProfile(username) {
  const s = await db.collection("users").where("username","==",username).get();
  if (s.empty) return view().innerHTML = `<div class="rb-empty">${t("notFound")}</div>`;
  let u = null, uid = ""; s.forEach(d => { u = d.data(); uid = d.id; });
  view().innerHTML = `<div class="forum-wrap"><div class="rb-profile">
    <div class="rb-avatar">${esc((u.username||"?")[0].toUpperCase())}</div>
    <h2>${esc(u.username)} ${badge(u.role)}</h2><p>${esc(u.bio||"")}</p>
    <div class="rb-stats"><div class="rb-stat"><b>${(u.stats&&u.stats.threads)||0}</b><span>${t("threads")}</span></div>
    <div class="rb-stat"><b>${(u.stats&&u.stats.posts)||0}</b><span>${t("replies")}</span></div></div>
    ${myW()>=3 && uid !== (CUR()&&CUR().uid) ? `<div class="rb-modbar">
      <select onchange="RB.setRole('${uid}',this.value)">${Object.keys(RBAuth.WEIGHT).map(r=>`<option ${r===u.role?"selected":""}>${r}</option>`).join("")}</select>
      <button class="rb-ghost rb-danger" onclick="RB.ban('${uid}',${!u.banned})">${u.banned?t("unban"):t("ban")}</button></div>` : ""}
  </div></div>`;
}

/* ── Giriş ── */
function renderLogin() {
  view().innerHTML = `<div class="forum-wrap"><div class="rb-form rb-auth">
    <h2>🐰 ${t("login")}</h2>
    <input id="authId" placeholder="${t("ident")}" autocomplete="username">
    <input id="authPw" type="password" placeholder="${t("pass")}" autocomplete="current-password">
    <button class="rb-btn" onclick="RB.doLogin()">${t("enter")}</button>
    <p id="authMsg" class="rb-msg"></p></div></div>`;
  document.getElementById("authPw").addEventListener("keydown", e => { if (e.key==="Enter") RB.doLogin(); });
}

/* ── Forum Admin ── */
async function renderAdmin() {
  const us = await db.collection("users").get();
  let rows = ""; us.forEach(d => { const u = d.data();
    rows += `<div class="rb-row"><b>${esc(u.username)}</b> ${badge(u.role)}
      <select onchange="RB.setRole('${d.id}',this.value)">${Object.keys(RBAuth.WEIGHT).map(r=>`<option ${r===u.role?"selected":""}>${r}</option>`).join("")}</select>
      <button class="rb-ghost rb-danger" onclick="RB.ban('${d.id}',${!u.banned})">${u.banned?t("unban"):t("ban")}</button></div>`;
  });
  const th = await db.collection("threads").get();
  let trows = ""; th.forEach(d => { const x = d.data();
    trows += `<div class="rb-row"><b>${esc(x.title)}</b>
      <button class="rb-ghost" onclick="RB.lock('${d.id}',${!x.locked})">${x.locked?t("unlock"):t("lock")}</button>
      <button class="rb-ghost" onclick="RB.pin('${d.id}',${!x.pinned})">${x.pinned?t("unpin"):t("pin")}</button>
      <button class="rb-ghost rb-danger" onclick="RB.delThread('${d.id}')">${t("del")}</button></div>`;
  });
  view().innerHTML = `<div class="forum-wrap"><h2 class="rb-h2">${t("admin")}</h2>
    <h3>${t("users")}</h3>${rows}<h3>${t("threads")}</h3>${trows||`<div class="rb-empty">—</div>`}</div>`;
}

/* ══════════ AKSİYONLAR ══════════ */
const RB = {};
RB.logout = async () => { sessionStorage.removeItem("rb_fadmin"); await RBAuth.logout(); location.hash = "#/"; };
RB.doLogin = async () => {
  const m = document.getElementById("authMsg");
  try {
    await RBAuth.smartLogin(document.getElementById("authId").value, document.getElementById("authPw").value);
    const u = CUR();
    if (u && myW() >= 3 && sessionStorage.getItem("rb_ftap") === "1") {
      sessionStorage.removeItem("rb_ftap");
      sessionStorage.setItem("rb_fadmin", "1");
      location.hash = "#/admin";
      return;
    }
    location.hash = "#/";
  } catch (e) { m.textContent = typeof e === "string" ? e : (e.message || "Hata!"); }
};
RB.reply = async (tid, cat, mw) => {
  const txt = (document.getElementById("replyBox").value || "").trim();
  if (!txt) return;
  const u = CUR();
  await db.collection("posts").add({ threadId:tid, categoryId:cat, minWeight:mw,
    content:txt, authorId:u.uid, authorName:u.username, authorRole:u.role,
    edited:false, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  await db.collection("threads").doc(tid).update({
    replies: firebase.firestore.FieldValue.increment(1),
    lastPostAt: firebase.firestore.FieldValue.serverTimestamp() });
  db.collection("users").doc(u.uid).update({ "stats.posts": firebase.firestore.FieldValue.increment(1) }).catch(()=>{});
  route();
};
RB.newThread = async slug => {
  const title = (document.getElementById("ntTitle").value || "").trim();
  const body  = (document.getElementById("ntBody").value || "").trim();
  if (!title || !body) return;
  const cd = await db.collection("categories").doc(slug).get();
  const cat = cd.exists ? cd.data() : {};
  const u = CUR();
  await db.collection("threads").add({ title, content:body, categoryId:slug,
    minWeight:(cat&&cat.minWeight)||0, authorId:u.uid, authorName:u.username, authorRole:u.role,
    locked:false, pinned:false, views:0, replies:0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastPostAt: firebase.firestore.FieldValue.serverTimestamp() });
  db.collection("users").doc(u.uid).update({ "stats.threads": firebase.firestore.FieldValue.increment(1) }).catch(()=>{});
  db.collection("categories").doc(slug).update({ "stats.threads": firebase.firestore.FieldValue.increment(1) }).catch(()=>{});
  location.hash = "#/c/" + slug;
};
RB.lock = (id,v) => db.collection("threads").doc(id).update({ locked:v }).then(route);
RB.pin  = (id,v) => db.collection("threads").doc(id).update({ pinned:v }).then(route);
RB.delThread = async id => { if (!confirm("?")) return;
  const ps = await db.collection("posts").where("threadId","==",id).get();
  const b = db.batch(); ps.forEach(p => b.delete(p.ref)); b.delete(db.collection("threads").doc(id));
  await b.commit(); location.hash = "#/"; };
RB.delPost = id => db.collection("posts").doc(id).delete().then(route);
RB.setRole = (uid,role) => db.collection("users").doc(uid).update({ role }).then(route);
RB.ban = (uid,banned) => db.collection("users").doc(uid).update({ banned }).then(route);
window.RB = RB;

/* ── Footer 5-tık (tek yol) ── */
function setupFooterTap() {
  const f = document.querySelector(".rb-footer");
  if (!f) return;
  let taps = 0, timer = null;
  f.addEventListener("click", () => {
    taps++; clearTimeout(timer);
    timer = setTimeout(() => taps = 0, 2000);
    if (taps >= 5) {
      taps = 0;
      const u = CUR();
      if (u && myW() >= 3) {
        sessionStorage.setItem("rb_fadmin", "1");
        location.hash = "#/admin";
      } else {
        sessionStorage.setItem("rb_ftap", "1");
        location.hash = "#/login";
      }
    }
  });
}

/* ── Başlat (savunmalı) ── */
function boot() {
  try {
    if (typeof db === 'undefined' || typeof RBAuth === 'undefined') {
      boot.n = (boot.n || 0) + 1;
      if (boot.n > 50) { view().innerHTML = '<div class="rb-empty">⚠️ Firebase yüklenemedi!<br>forum.html: SDK script etiketleri + firebase-config.js + forum-auth.js sıralamasını kontrol et.</div>'; return; }
      return setTimeout(boot, 100);
    }
    RBAuth.onAuth(function () { route(); });
    window.addEventListener("hashchange", route);
    setupFooterTap();
    route();
  } catch (e) { showErr(e); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
