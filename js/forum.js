/*! RiseBunny Forum — Compat Mode SPA */

const L = {
  tr:{ forum:"Forum", login:"Giriş / Kayıt", logout:"Çıkış", ident:"Kullanıcı adı veya admin e-posta",
    pass:"Şifre", enter:"Giriş Yap", cats:"Kategoriler", newThread:"＋ Yeni Konu", title:"Konu başlığı",
    content:"Mesajın...", send:"Gönder", reply:"Yanıt yaz...", replies:"yanıt", views:"görüntülenme",
    locked:"🔒 Yoruma kapalı", pinned:"📌 Sabit", admin:"⚙️ Yetkili Paneli", users:"Kullanıcılar",
    threads:"Konular", role:"Yetki", ban:"BAN", unban:"BAN Kaldır", del:"Sil", lock:"Kilitle",
    unlock:"Kilidi Aç", pin:"Sabitle", unpin:"Sabitleme", noPerm:"🚫 Yetkin yok.", notFound:"404",
    empty:"Henüz konu yok. İlk sen aç! 🐰", vip:"VIP Forum", back:"← Geri" },
  en:{ forum:"Forum", login:"Login / Register", logout:"Logout", ident:"Username or admin e-mail",
    pass:"Password", enter:"Sign in", cats:"Categories", newThread:"＋ New Thread", title:"Thread title",
    content:"Your message...", send:"Send", reply:"Write a reply...", replies:"replies", views:"views",
    locked:"🔒 Locked", pinned:"📌 Pinned", admin:"⚙️ Staff Panel", users:"Users",
    threads:"Threads", role:"Role", ban:"BAN", unban:"Unban", del:"Delete", lock:"Lock",
    unlock:"Unlock", pin:"Pin", unpin:"Unpin", noPerm:"🚫 No permission.", notFound:"404",
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
const view = () => document.getElementById("view");
const { CURRENT, myWeight } = (() => ({ CURRENT: () => RBAuth.CURRENT(), myWeight: RBAuth.myWeight }))();

function nav() {
  const u = CURRENT();
  document.getElementById("rb-nav-user").innerHTML = u
    ? `${myWeight()>=2 ? `<a class="rb-vipbtn" href="#/c/vip">⭐ ${t("vip")}</a>`:""}
       <a class="rb-userchip" href="#/u/${esc(u.username)}">${badge(u.role)} ${esc(u.username)}</a>
       ${myWeight()>=3 ? `<a class="rb-adminbtn" href="#/admin">${t("admin")}</a>`:""}
       <button class="rb-ghost" onclick="RB.logout()">${t("logout")}</button>`
    : `<a class="rb-userchip" href="#/login">🐰 ${t("login")}</a>`;
}

function route() {
  nav();
  const h = (location.hash || "#/").split("/");
  const page = h[1] || "", arg = decodeURIComponent(h[2] || "");
  if (page==="")      return renderHome();
  if (page==="c")     return renderCategory(arg);
  if (page==="t")     return renderThread(arg);
  if (page==="u")     return renderProfile(arg);
  if (page==="new")   return renderNew(arg);
  if (page==="login") return renderLogin();
  if (page==="admin") return renderAdmin();
  view().innerHTML = `<div class="rb-empty">${t("notFound")}</div>`;
}

async function renderHome() {
  const snap = await db.collection("categories").orderBy("order").get();
  let cards = "";
  snap.forEach(d => {
    const c = d.data();
    if ((c.minWeight||0) > myWeight()) return;
    cards += `<a class="rb-card" href="#/c/${esc(c.slug)}">
      <div class="rb-icon">${esc(c.icon||"💬")}</div>
      <div class="rb-info"><h3>${esc(c.name?.[lang]||c.name?.tr||c.slug)} ${(c.minWeight||0)>=2?"🔒":""}</h3>
        <p>${esc(c.desc?.[lang]||c.desc?.tr||"")}</p></div>
      <div class="rb-stats"><div class="rb-stat"><b>${c.stats?.threads||0}</b><span>${t("threads")}</span></div></div></a>`;
  });
  view().innerHTML = `<div class="forum-wrap"><h2 class="rb-h2">${t("cats")}</h2>
    ${cards || `<div class="rb-empty">${t("empty")}</div>`}</div>`;
}

async function renderCategory(slug) {
  const cd = await db.collection("categories").doc(slug).get();
  if (!cd.exists || (cd.data().minWeight||0) > myWeight())
    return view().innerHTML = `<div class="rb-empty">${t("noPerm")}</div>`;
  const c = cd.data();
  const snap = await db.collection("threads").where("categoryId","==",slug).get();
  const list = []; snap.forEach(d => list.push({ id:d.id, ...d.data() }));
  list.sort((a,b) => (b.pinned?1:0)-(a.pinned?1:0) || (b.lastPostAt?.seconds||0)-(a.lastPostAt?.seconds||0));
  view().innerHTML = `<div class="forum-wrap">
    <a class="rb-back" href="#/">${t("back")}</a>
    <div class="rb-cathead"><span class="rb-icon">${esc(c.icon||"💬")}</span>
      <h2>${esc(c.name?.[lang]||c.slug)}</h2>
      ${CURRENT() ? `<a class="rb-btn" href="#/new/${esc(slug)}">${t("newThread")}</a>`:""}</div>
    ${list.map(th => `<a class="rb-card rb-thread" href="#/t/${th.id}">
      <div class="rb-info"><h3>${th.pinned?`<em class="rb-pin">${t("pinned")}</em> `:""}${th.locked?`<em class="rb-lock">${t("locked")}</em> `:""}${esc(th.title)}</h3>
        <p>${badge(th.authorRole||"member")} <b>${esc(th.authorName)}</b> · ${fmt(th.createdAt)}</p></div>
      <div class="rb-stats"><div class="rb-stat"><b>${th.replies||0}</b><span>${t("replies")}</span></div>
      <div class="rb-stat"><b>${th.views||0}</b><span>${t("views")}</span></div></div></a>`).join("") || `<div class="rb-empty">${t("empty")}</div>`}
  </div>`;
}

async function renderThread(id) {
  const td = await db.collection("threads").doc(id).get();
  if (!td.exists) return view().innerHTML = `<div class="rb-empty">${t("notFound")}</div>`;
  const th = td.data();
  if ((th.minWeight||0) > myWeight()) return view().innerHTML = `<div class="rb-empty">${t("noPerm")}</div>`;
  db.collection("threads").doc(id).update({ views: firebase.firestore.FieldValue.increment(1) }).catch(()=>{});
  const ps = await db.collection("posts").where("threadId","==",id).orderBy("createdAt").get();
  let posts = ""; ps.forEach(d => { const p = d.data();
    posts += `<div class="rb-post"><div class="rb-posthead">${badge(p.authorRole||"member")}
      <b>${esc(p.authorName)}</b><span class="rb-time">${fmt(p.createdAt)}${p.edited?" ✏️":""}</span></div>
      <div class="rb-postbody">${esc(p.content).replace(/\n/g,"<br>")}</div>
      ${myWeight()>=3 ? `<button class="rb-ghost" onclick="RB.delPost('${d.id}')">${t("del")}</button>`:""}</div>`;
  });
  const canReply = CURRENT() && !th.locked || myWeight() >= 3;
  view().innerHTML = `<div class="forum-wrap">
    <a class="rb-back" href="#/c/${esc(th.categoryId)}">${t("back")}</a>
    <div class="rb-threadhead"><h2>${esc(th.title)}</h2>
      <p>${badge(th.authorRole||"member")} <b>${esc(th.authorName)}</b> · ${fmt(th.createdAt)}
      ${th.locked?` · <em class="rb-lock">${t("locked")}</em>`:""}</p>
      ${myWeight()>=3 ? `<div class="rb-modbar">
        <button class="rb-ghost" onclick="RB.lock('${id}',${!th.locked})">${th.locked?t("unlock"):t("lock")}</button>
        <button class="rb-ghost" onclick="RB.pin('${id}',${!th.pinned})">${th.pinned?t("unpin"):t("pin")}</button>
        <button class="rb-ghost rb-danger" onclick="RB.delThread('${id}')">${t("del")}</button></div>`:""}</div>
    <div class="rb-post rb-op"><div class="rb-postbody">${esc(th.content).replace(/\n/g,"<br>")}</div></div>
    ${posts}
    ${CURRENT() && canReply ? `<div class="rb-replybox"><textarea id="replyBox" placeholder="${t("reply")}"></textarea>
      <button class="rb-btn" onclick="RB.reply('${id}','${esc(th.categoryId)}',${th.minWeight||0})">${t("send")}</button></div>`
    : CURRENT() ? `<div class="rb-empty">${t("locked")}</div>`
    : `<a class="rb-btn" href="#/login">${t("login")}</a>`}
  </div>`;
}

async function renderNew(slug) {
  if (!CURRENT()) return renderLogin();
  view().innerHTML = `<div class="forum-wrap"><a class="rb-back" href="#/c/${esc(slug)}">${t("back")}</a>
    <div class="rb-form"><input id="ntTitle" placeholder="${t("title")}" maxlength="90">
    <textarea id="ntBody" placeholder="${t("content")}"></textarea>
    <button class="rb-btn" onclick="RB.newThread('${esc(slug)}')">${t("send")}</button></div></div>`;
}

async function renderProfile(username) {
  const s = await db.collection("users").where("username","==",username).get();
  if (s.empty) return view().innerHTML = `<div class="rb-empty">${t("notFound")}</div>`;
  let u = null, uid = ""; s.forEach(d => { u = d.data(); uid = d.id; });
  view().innerHTML = `<div class="forum-wrap"><div class="rb-profile">
    <div class="rb-avatar">${esc((u.username||"?")[0].toUpperCase())}</div>
    <h2>${esc(u.username)} ${badge(u.role)}</h2>
    <p>${esc(u.bio||"")}</p>
    <div class="rb-stats"><div class="rb-stat"><b>${u.stats?.threads||0}</b><span>${t("threads")}</span></div>
    <div class="rb-stat"><b>${u.stats?.posts||0}</b><span>${t("replies")}</span></div></div>
    ${myWeight()>=3 && uid!==CURRENT()?.uid ? `<div class="rb-modbar">
      <select onchange="RB.setRole('${uid}',this.value)">${Object.keys(RBAuth.WEIGHT).map(r=>`<option ${r===u.role?"selected":""}>${r}</option>`).join("")}</select>
      <button class="rb-ghost rb-danger" onclick="RB.ban('${uid}',${!u.banned})">${u.banned?t("unban"):t("ban")}</button></div>`:""}
  </div></div>`;
}

function renderLogin() {
  view().innerHTML = `<div class="forum-wrap"><div class="rb-form rb-auth">
    <h2>🐰 ${t("login")}</h2>
    <input id="authId" placeholder="${t("ident")}" autocomplete="username">
    <input id="authPw" type="password" placeholder="${t("pass")}" autocomplete="current-password">
    <button class="rb-btn" onclick="RB.doLogin()">${t("enter")}</button>
    <p id="authMsg" class="rb-msg"></p></div></div>`;
  document.getElementById("authPw").addEventListener("keydown", e => { if (e.key==="Enter") RB.doLogin(); });
}

async function renderAdmin() {
  if (myWeight() < 3) return view().innerHTML = `<div class="rb-empty">${t("noPerm")}</div>`;
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
RB.logout = async () => { await RBAuth.logout(); location.hash = "#/"; };
RB.doLogin = async () => {
  const m = document.getElementById("authMsg");
  try {
    await RBAuth.smartLogin(document.getElementById("authId").value, document.getElementById("authPw").value);
    // UID eşleşiyorsa admin panele yönlendir
    const u = RBAuth.CURRENT();
    if (u && u.uid === window.ADMIN_UID) {
      window.location.href = "admin.html";
      return;
    }
    location.hash = "#/";
  } catch (e) { m.textContent = typeof e === "string" ? e : (e.message || "Hata!"); }
};
RB.reply = async (tid, cat, mw) => {
  const box = document.getElementById("replyBox"); const txt = box.value.trim();
  if (!txt) return;
  const u = CURRENT();
  await db.collection("posts").add({ threadId:tid, categoryId:cat, minWeight:mw,
    content:txt, authorId:u.uid, authorName:u.username, authorRole:u.role,
    edited:false, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  await db.collection("threads").doc(tid).update({
    replies: firebase.firestore.FieldValue.increment(1),
    lastPostAt: firebase.firestore.FieldValue.serverTimestamp() });
  await db.collection("users").doc(u.uid).update({ "stats.posts": firebase.firestore.FieldValue.increment(1) });
  route();
};
RB.newThread = async slug => {
  const title = document.getElementById("ntTitle").value.trim();
  const body  = document.getElementById("ntBody").value.trim();
  if (!title || !body) return;
  const cat = (await db.collection("categories").doc(slug).get()).data();
  const u = CURRENT();
  await db.collection("threads").add({ title, content:body, categoryId:slug,
    minWeight: cat.minWeight||0, authorId:u.uid, authorName:u.username,
    authorRole:u.role, locked:false, pinned:false, views:0, replies:0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastPostAt: firebase.firestore.FieldValue.serverTimestamp() });
  await db.collection("users").doc(u.uid).update({ "stats.threads": firebase.firestore.FieldValue.increment(1) });
  await db.collection("categories").doc(slug).update({ "stats.threads": firebase.firestore.FieldValue.increment(1) });
  location.hash = "#/c/" + slug;
};
RB.lock = (id,v) => db.collection("threads").doc(id).update({ locked:v }).then(route);
RB.pin  = (id,v) => db.collection("threads").doc(id).update({ pinned:v }).then(route);
RB.delThread = async id => { if(!confirm("?")) return;
  const ps = await db.collection("posts").where("threadId","==",id).get();
  const b = db.batch(); ps.forEach(p => b.delete(p.ref)); b.delete(db.collection("threads").doc(id));
  await b.commit(); location.hash = "#/"; };
RB.delPost = id => db.collection("posts").doc(id).delete().then(route);
RB.setRole = (uid,role) => db.collection("users").doc(uid).update({ role }).then(route);
RB.ban = (uid,banned) => db.collection("users").doc(uid).update({ banned }).then(route);
window.RB = RB;

/* ── Footer 5-tık admin girişi ── */
function setupFooterTap() {
  const footer = document.querySelector("footer") || document.querySelector(".footer");
  if (!footer) return;
  let taps = 0, timer = null;
  footer.addEventListener("click", e => {
    // Linklere tıklanırsa sayma
    if (e.target.tagName === "A" || e.target.tagName === "BUTTON") return;
    taps++;
    clearTimeout(timer);
    timer = setTimeout(() => { taps = 0; }, 2000);
    if (taps >= 5) {
      taps = 0;
      location.href = "forum.html#/login";
    }
  });
}

/* ── Başlat (hata yakalamalı) ── */
window.addEventListener('error', function (e) {
  var v = document.getElementById('view');
  if (v) v.innerHTML = '<div class="rb-empty">⚠️ Hata: ' + (e.message || '?') + '</div>';
});
function boot() {
  try {
    if (typeof db === 'undefined' || typeof RBAuth === 'undefined') {
      boot.n = (boot.n || 0) + 1;
      if (boot.n > 50) { view().innerHTML = '<div class="rb-empty">⚠️ Firebase yüklenemedi!<br>forum.html\'de 3 SDK script etiketi + firebase-config.js + forum-auth.js sıralaması eksik olabilir.</div>'; return; }
      return setTimeout(boot, 100);
    }
    RBAuth.onAuth(function () { route(); });
    window.addEventListener('hashchange', route);
    setupFooterTap();
    route();
  } catch (e) {
    view().innerHTML = '<div class="rb-empty">⚠️ ' + (e && e.message ? e.message : e) + '</div>';
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
