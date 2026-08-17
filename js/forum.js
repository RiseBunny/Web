/*! RiseBunny Forum v10 */

const L = {
  tr:{ login:"Giriş / Kayıt", logout:"Çıkış", ident:"Kullanıcı adı", pass:"Şifre", enter:"Giriş Yap",
    cats:"Kategoriler", newThread:"＋ Yeni Konu", title:"Konu başlığı", content:"Mesajın...", send:"Gönder",
    reply:"Yanıt yaz...", replies:"yanıt", views:"görüntülenme", locked:"🔒 Yoruma kapalı", pinned:"📌 Sabit",
    admin:"⚙️ Yetkili Paneli", users:"Kullanıcılar", threads:"Konular", ban:"BAN", unban:"BAN Kaldır", del:"Sil",
    lock:"Kilitle", unlock:"Kilidi Aç", pin:"Sabitle", unpin:"Sabitleme", noPerm:"🚫 Bu bölüme erişim yetkin yok.",
    notFound:"404 — Sayfa Bulunamadı", empty:"Henüz konu yok. İlk konuyu sen aç! 🐰", vip:"VIP Forum",
    back:"← Geri", soon:"Forum çok yakında! 🐰", seed:"🌱 Varsayılan Kategorileri Tohumla",
    attach:"📷 Resim", addCat:"＋ Kategori Ekle" },
  en:{ login:"Login / Register", logout:"Logout", ident:"Username", pass:"Password", enter:"Sign in",
    cats:"Categories", newThread:"＋ New Thread", title:"Thread title", content:"Your message...", send:"Send",
    reply:"Write a reply...", replies:"replies", views:"views", locked:"🔒 Locked", pinned:"📌 Pinned",
    admin:"⚙️ Staff Panel", users:"Users", threads:"Threads", ban:"BAN", unban:"Unban", del:"Delete",
    lock:"Lock", unlock:"Unlock", pin:"Pin", unpin:"Unpin", noPerm:"🚫 You lack permission.",
    notFound:"404 — Not Found", empty:"No threads yet. Start the first! 🐰", vip:"VIP Forum",
    back:"← Back", soon:"Forum coming soon! 🐰", seed:"🌱 Seed Default Categories",
    attach:"📷 Image", addCat:"＋ Add Category" }
};
let lang = localStorage.getItem("rb-lang") || "tr";
const t = k => (L[lang] && L[lang][k]) || L.tr[k] || k;
window.rbSetLang = l => { lang = l; localStorage.setItem("rb-lang", l); route(); };

const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const badge = r => { const b = RBAuth.BADGE[r] || RBAuth.BADGE.member;
  return `<span class="rb-badge" data-role="${r}">${b.icon}<i>${esc(b[lang]||b.tr)}</i></span>`; };
const fmt = ts => ts && ts.seconds ? new Date(ts.seconds*1000)
  .toLocaleString(lang=="tr"?"tr-TR":"en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}) : "—";
const secs = ts => (ts && ts.seconds) || 0;
const view = () => document.getElementById("view");
const CUR = () => RBAuth.CURRENT();
const myW = () => RBAuth.myWeight();
const adminUnlocked = () => sessionStorage.getItem("rb_fadmin") === "1";

function showErr(e) { const v = document.getElementById("view");
  if (v) v.innerHTML = '<div class="rb-empty">⚠️ Hata: ' + (e && e.message ? e.message : e) + '</div>'; }
window.addEventListener("error", e => showErr(e.message || e.error));
window.addEventListener("unhandledrejection", e => showErr(e.reason));

function show404() {
  if (window.__rb404) return window.__rb404();
  fetch('404.html').then(r => { if (!r.ok) throw 0; return r.text(); }).then(h => { document.open(); document.write(h); document.close(); })
  .catch(() => { document.body.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;background:#050507;color:#fff"><h1 style="font-size:5rem;margin:0">404</h1><p style="color:#9ca3af">Page Not Found</p></div>'; });
}

/* ── Ek CSS (yeni bileşenler) ── */
(function injectCSS(){
  const s = document.createElement('style');
  s.textContent = '.rb-postimg{max-width:100%;border-radius:12px;margin-top:10px;border:1px solid var(--line)}' +
    '.rb-attach{display:flex;align-items:center;gap:8px}.rb-prev{width:56px;height:56px;object-fit:cover;border-radius:10px;border:1px solid var(--line)}' +
    '.rb-admtabs{display:flex;gap:8px;margin:14px 0;flex-wrap:wrap}.rb-at{padding:9px 16px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--dim);cursor:pointer;font-weight:700;font-size:13px}.rb-at.active{background:linear-gradient(135deg,var(--acc),var(--acc2));color:#fff;border-color:transparent}' +
    '.rb-admform{display:flex;flex-direction:column;gap:10px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px;margin-top:16px}' +
    '.rb-admform input,.rb-admform select{background:#0e1219;border:1px solid var(--line);border-radius:10px;color:var(--txt);padding:10px 12px;outline:none}';
  document.head.appendChild(s);
})();

/* ── Görsel sıkıştırma (yetkili eki) ── */
function compressImage(file, maxDim, q) {
  return new Promise(function (res, rej) {
    const rd = new FileReader();
    rd.onload = function () {
      const img = new Image();
      img.onload = function () {
        const sc = Math.min(1, maxDim / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * sc)); c.height = Math.max(1, Math.round(img.height * sc));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', q));
      };
      img.onerror = rej; img.src = rd.result;
    };
    rd.onerror = rej; rd.readAsDataURL(file);
  });
}
async function pickImage(file) {
  const st = [[700,0.7],[520,0.6],[420,0.5]];
  for (let i=0;i<st.length;i++){
    const d = await compressImage(file, st[i][0], st[i][1]);
    if (d.length <= 400000 || i === st.length-1) {
      if (d.length > 450000) throw new Error("Görsel çok büyük");
      return d;
    }
  }
}
function bindFile(inputId, prevId) {
  const f = document.getElementById(inputId);
  if (!f) return;
  f.addEventListener("change", async () => {
    if (!f.files[0]) return;
    try {
      window.__rbImg = await pickImage(f.files[0]);
      const pv = document.getElementById(prevId);
      if (pv) { pv.src = window.__rbImg; pv.hidden = false; }
    } catch (e) { showErr(e); }
  });
}

/* ── Navbar ── */
function nav() {
  const u = CUR();
  const box = document.getElementById("rb-nav-user"); if (!box) return;
  box.innerHTML = u
    ? `${myW()>=2 ? `<a class="rb-navvip" href="#/c/vip" title="${t("vip")}">⭐</a>` : ""}
       <a class="rb-userchip" href="#/u/${esc(u.username)}">${badge(u.role)}<b>${esc(u.username)}</b></a>
       ${myW()>=3 && adminUnlocked() ? `<a class="rb-navadmin" href="#/admin" title="${t("admin")}">⚙️</a>` : ""}
       <button class="rb-navexit" onclick="RB.logout()" title="${t("logout")}">⎋</button>`
    : `<a class="rb-loginbtn" href="#/login">🐰 ${t("login")}</a>`;
}

/* ── Router  */
function route() {
  try {
    nav();
    const cu = CUR();
    if (cu && cu.banned) { RB.logout(); return show404(); }   // 🔒 BANLI = 404
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

/* ── Kategori tohumu ── */
async function seedCats() {
  const cats = [
    { slug:"duyurular", icon:"📢", order:1, minWeight:0, name:{tr:"Duyurular",en:"Announcements"}, desc:{tr:"Resmi RiseBunny duyuruları",en:"Official RiseBunny news"} },
    { slug:"genel", icon:"🐰", order:2, minWeight:0, name:{tr:"Genel Sohbet",en:"General"}, desc:{tr:"Topluluk alanı",en:"Community space"} },
    { slug:"minecraft", icon:"⛏️", order:3, minWeight:1, name:{tr:"Minecraft",en:"Minecraft"}, desc:{tr:"Rubidium & client",en:"Rubidium & client"} },
    { slug:"vip", icon:"⭐", order:4, minWeight:2, name:{tr:"VIP Forum",en:"VIP Lounge"}, desc:{tr:"Sadece VIP+",en:"VIP+ only"} },
    { slug:"staff", icon:"🛡️", order:5, minWeight:3, name:{tr:"Yetkili Alanı",en:"Staff Area"}, desc:{tr:"Mod+",en:"Mod+ only"} }
  ];
  const b = db.batch();
  cats.forEach(c => b.set(db.collection("categories").doc(c.slug), { ...c, stats:{threads:0,posts:0} }));
  await b.commit();
}

/* ── Ana sayfa ── */
async function renderHome() {
  let snap = await db.collection("categories").get();
  let cats = []; snap.forEach(d => cats.push({ slug: d.id, ...d.data() }));
  if (!cats.length && myW() >= 5) { await seedCats();
    snap = await db.collection("categories").get(); cats = []; snap.forEach(d => cats.push({ slug: d.id, ...d.data() })); }
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
    ${cards || `<div class="rb-empty">${myW()>=5 ? t("empty") : t("soon")}</div>`}</div>`;
}

/* ── Konu listesi ── */
async function renderCategory(slug) {
  const cd = await db.collection("categories").doc(slug).get();
  if (!cd.exists || (cd.data().minWeight||0) > myW())
    return view().innerHTML = `<div class="forum-wrap"><a class="rb-back" href="#/">${t("back")}</a><div class="rb-empty">${t("noPerm")}</div></div>`;
  const c = cd.data();
  const snap = await db.collection("threads").where("categoryId","==",slug).get();
  const list = []; snap.forEach(d => list.push({ id: d.id, ...d.data() }));
  list.sort((a,b) => (b.pinned?1:0)-(a.pinned?1:0) || secs(b.lastPostAt)-secs(a.lastPostAt));
  view().innerHTML = `<div class="forum-wrap">
    <a class="rb-back" href="#/">${t("back")}</a>
    <div class="rb-cathead"><span class="rb-icon">${esc(c.icon||"💬")}</span>
      <h2>${esc((c.name&&c.name[lang])||c.slug)}</h2></div>
    ${list.map(th => `<a class="rb-card" href="#/t/${th.id}">
      <div class="rb-info"><h3>${th.pinned?`<em class="rb-pin">${t("pinned")}</em> `:""}${th.locked?`<em class="rb-lock">${t("locked")}</em> `:""}${esc(th.title)}</h3>
        <p>${badge(th.authorRole||"member")} <b>${esc(th.authorName)}</b> · ${fmt(th.createdAt)}</p></div>
      <div class="rb-stats"><div class="rb-stat"><b>${th.replies||0}</b><span>${t("replies")}</span></div>
      <div class="rb-stat"><b>${th.views||0}</b><span>${t("views")}</span></div></div></a>`).join("") || `<div class="rb-empty">${t("empty")}</div>`}
    <a class="rb-fab" href="${CUR() ? `#/new/${esc(slug)}` : "#/login"}" title="${t("newThread")}">＋</a></div>`;
}

/* ── Konu + yanıtlar ── */
async function renderThread(id) {
  const td = await db.collection("threads").doc(id).get();
  if (!td.exists) return view().innerHTML = `<div class="forum-wrap"><a class="rb-back" href="#/">${t("back")}</a><div class="rb-empty">${t("notFound")}</div></div>`;
  const th = td.data();
  if ((th.minWeight||0) > myW()) return view().innerHTML = `<div class="forum-wrap"><a class="rb-back" href="#/">${t("back")}</a><div class="rb-empty">${t("noPerm")}</div></div>`;
  db.collection("threads").doc(id).update({ views: firebase.firestore.FieldValue.increment(1) }).catch(()=>{});
  const ps = await db.collection("posts").where("threadId","==",id).get();
  const arr = []; ps.forEach(d => arr.push({ id: d.id, ...d.data() }));
  arr.sort((a,b) => secs(a.createdAt) - secs(b.createdAt));
  let posts = ""; arr.forEach(p => {
    posts += `<div class="rb-post"><div class="rb-posthead">${badge(p.authorRole||"member")}
      <b>${esc(p.authorName)}</b><span class="rb-time">${fmt(p.createdAt)}${p.edited?" ✏️":""}</span></div>
      <div class="rb-postbody">${esc(p.content).replace(/\n/g,"<br>")}</div>
      ${p.image ? `<img class="rb-postimg" src="${p.image}" alt="">` : ""}
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
    <div class="rb-post rb-op"><div class="rb-postbody">${esc(th.content).replace(/\n/g,"<br>")}</div>
      ${th.image ? `<img class="rb-postimg" src="${th.image}" alt="">` : ""}</div>
    ${posts}
    ${CUR() && canReply ? `<div class="rb-replybox"><textarea id="replyBox" placeholder="${t("reply")}"></textarea>
      ${myW()>=3 ? `<div class="rb-attach"><label class="rb-ghost">${t("attach")}<input type="file" id="replyFile" accept="image/*" hidden></label><img id="replyPrev" class="rb-prev" hidden></div>` : ""}
      <button class="rb-btn" onclick="RB.reply('${id}','${esc(th.categoryId)}',${th.minWeight||0})">${t("send")}</button></div>`
    : CUR() ? `<div class="rb-empty">${t("locked")}</div>`
    : `<div style="text-align:center"><a class="rb-btn" href="#/login">${t("login")}</a></div>`}</div>`;
  bindFile("replyFile", "replyPrev");
}

/* ── Yeni konu ── */
async function renderNew(slug) {
  if (!CUR()) return renderLogin();
  view().innerHTML = `<div class="forum-wrap"><a class="rb-back" href="#/c/${esc(slug)}">${t("back")}</a>
    <div class="rb-form"><h2>${t("newThread")}</h2><input id="ntTitle" placeholder="${t("title")}" maxlength="90">
    <textarea id="ntBody" rows="5" placeholder="${t("content")}"></textarea>
    ${myW()>=3 ? `<div class="rb-attach"><label class="rb-ghost">${t("attach")}<input type="file" id="ntFile" accept="image/*" hidden></label><img id="ntPrev" class="rb-prev" hidden></div>` : ""}
    <button class="rb-btn" onclick="RB.newThread('${esc(slug)}')">${t("send")}</button></div></div>`;
  bindFile("ntFile", "ntPrev");
}

/* ── Profil ── */
async function renderProfile(username) {
  const s = await db.collection("users").where("username","==",username).get();
  if (s.empty) return view().innerHTML = `<div class="forum-wrap"><a class="rb-back" href="#/">${t("back")}</a><div class="rb-empty">${t("notFound")}</div></div>`;
  let u = null, uid = ""; s.forEach(d => { u = d.data(); uid = d.id; });
  view().innerHTML = `<div class="forum-wrap"><a class="rb-back" href="#/">${t("back")}</a>
    <div class="rb-profile">
    <div class="rb-avatar">${esc((u.username||"?")[0].toUpperCase())}</div>
    <h2>${esc(u.username)} ${badge(u.role)}</h2><p>${esc(u.bio||"")}</p>
    <div class="rb-stats"><div class="rb-stat"><b>${(u.stats&&u.stats.threads)||0}</b><span>${t("threads")}</span></div>
    <div class="rb-stat"><b>${(u.stats&&u.stats.posts)||0}</b><span>${t("replies")}</span></div></div>
    ${myW()>=3 && uid !== (CUR()&&CUR().uid) ? `<div class="rb-modbar" style="justify-content:center">
      <select onchange="RB.setRole('${uid}',this.value)">${Object.keys(RBAuth.WEIGHT).map(r=>`<option ${r===u.role?"selected":""}>${r}</option>`).join("")}</select>
      <button class="rb-ghost rb-danger" onclick="RB.ban('${uid}',${!u.banned})">${u.banned?t("unban"):t("ban")}</button></div>` : ""}
  </div></div>`;
}

/* ── Giriş ── */
function renderLogin() {
  view().innerHTML = `<div class="forum-wrap"><div class="rb-form">
    <h2>🐰 ${t("login")}</h2>
    <input id="authId" placeholder="${t("ident")}" autocomplete="username">
    <input id="authPw" type="password" placeholder="${t("pass")}" autocomplete="current-password">
    <button class="rb-btn" onclick="RB.doLogin()">${t("enter")}</button>
    <p id="authMsg" class="rb-msg"></p></div></div>`;
  document.getElementById("authPw").addEventListener("keydown", e => { if (e.key==="Enter") RB.doLogin(); });
}

/* ── Yetkili Paneli (sekmeli) ── */
async function renderAdmin() {
  view().innerHTML = `<div class="forum-wrap"><a class="rb-back" href="#/">${t("back")}</a>
    <h2 class="rb-h2">${t("admin")}</h2>
    <div class="rb-admtabs">
      <button class="rb-at active" data-at="users">${t("users")}</button>
      <button class="rb-at" data-at="threads">${t("threads")}</button>
      <button class="rb-at" data-at="cats">${t("cats")}</button>
    </div>
    <div id="adm-body"><div class="rb-empty">🐰...</div></div></div>`;
  document.querySelectorAll(".rb-at").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll(".rb-at").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    admSection(b.getAttribute("data-at"));
  }));
  admSection("users");
}
async function admSection(kind) {
  const body = document.getElementById("adm-body"); if (!body) return;
  body.innerHTML = '<div class="rb-empty">🐰...</div>';
  if (kind === "users") {
    const us = await db.collection("users").get();
    let rows = ""; us.forEach(d => { const u = d.data();
      rows += `<div class="rb-row"><b>${esc(u.username)}${u.banned?' 🚫':''}</b> ${badge(u.role)}
        <select onchange="RB.setRole('${d.id}',this.value)">${Object.keys(RBAuth.WEIGHT).map(r=>`<option ${r===u.role?"selected":""}>${r}</option>`).join("")}</select>
        <button class="rb-ghost rb-danger" onclick="RB.ban('${d.id}',${!u.banned})">${u.banned?t("unban"):t("ban")}</button></div>`;
    });
    body.innerHTML = rows || '<div class="rb-empty">—</div>';
  }
  if (kind === "threads") {
    const th = await db.collection("threads").get();
    let rows = ""; th.forEach(d => { const x = d.data();
      rows += `<div class="rb-row"><b>${esc(x.title)}</b>
        <button class="rb-ghost" onclick="RB.lock('${d.id}',${!x.locked})">${x.locked?t("unlock"):t("lock")}</button>
        <button class="rb-ghost" onclick="RB.pin('${d.id}',${!x.pinned})">${x.pinned?t("unpin"):t("pin")}</button>
        <button class="rb-ghost rb-danger" onclick="RB.delThread('${d.id}')">${t("del")}</button></div>`;
    });
    body.innerHTML = rows || '<div class="rb-empty">—</div>';
  }
  if (kind === "cats") {
    const snap = await db.collection("categories").get();
    let rows = ""; snap.forEach(d => { const c = d.data();
      rows += `<div class="rb-row"><b>${esc(c.icon||"💬")} ${esc((c.name&&c.name.tr)||d.id)}</b>
        <span class="rb-badge" data-role="${(c.minWeight||0)>=3?"moderator":(c.minWeight||0)===2?"vip":"member"}">W:${c.minWeight||0}</span>
        <button class="rb-ghost rb-danger" onclick="RB.delCat('${esc(d.id)}')">${t("del")}</button></div>`;
    });
    body.innerHTML = rows + (myW()>=5 ? `<div class="rb-admform">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <input id="nc-slug" placeholder="slug (orn. valorant)" style="flex:1;min-width:120px">
        <input id="nc-icon" placeholder="🎮" style="width:70px">
        <select id="nc-weight"><option value="0">Herkese (0)</option><option value="1">Üye (1)</option><option value="2">VIP (2)</option><option value="3">Staff (3)</option></select>
      </div>
      <input id="nc-tr" placeholder="İsim (TR)"><input id="nc-en" placeholder="Name (EN)">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="rb-btn" onclick="RB.addCat()">${t("addCat")}</button>
        <button class="rb-ghost" onclick="RB.seed()">${t("seed")}</button>
      </div></div>` : "");
  }
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
RB.seed = async () => { await seedCats(); admSection("cats"); };
RB.addCat = async () => {
  const slug = (document.getElementById("nc-slug").value||"").trim().toLowerCase().replace(/[^a-z0-9-]+/g,"-");
  if (!slug) return;
  await db.collection("categories").doc(slug).set({
    slug, icon: document.getElementById("nc-icon").value || "💬", order: 99,
    minWeight: parseInt(document.getElementById("nc-weight").value,10) || 0,
    name: { tr: document.getElementById("nc-tr").value || slug, en: document.getElementById("nc-en").value || slug },
    desc: { tr: "", en: "" }, stats: { threads: 0, posts: 0 }
  });
  admSection("cats");
};
RB.delCat = async id => { if (!confirm("?")) return; await db.collection("categories").doc(id).delete(); admSection("cats"); };
RB.reply = async (tid, cat, mw) => {
  const txt = (document.getElementById("replyBox").value || "").trim();
  if (!txt && !window.__rbImg) return;
  const u = CUR();
  await db.collection("posts").add({ threadId:tid, categoryId:cat, minWeight:mw,
    content:txt, image: window.__rbImg || "", authorId:u.uid, authorName:u.username, authorRole:u.role,
    edited:false, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  window.__rbImg = "";
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
    image: window.__rbImg || "", minWeight:(cat&&cat.minWeight)||0, authorId:u.uid, authorName:u.username, authorRole:u.role,
    locked:false, pinned:false, views:0, replies:0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastPostAt: firebase.firestore.FieldValue.serverTimestamp() });
  window.__rbImg = "";
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

/* ── Footer 5-tık: sadece yetkili ── */
function setupFooterTap() {
  const f = document.querySelector(".rb-footer");
  if (!f) return;
  let taps = 0, timer = null;
  f.addEventListener("click", () => {
    const u = CUR();
    if (!u || myW() < 3) return;
    taps++; clearTimeout(timer);
    timer = setTimeout(() => taps = 0, 2000);
    if (taps >= 5) {
      taps = 0;
      sessionStorage.setItem("rb_fadmin", "1");
      location.hash = "#/admin";
    }
  });
}

/* ── Başlat ── */
function boot() {
  try {
    if (typeof db === 'undefined' || typeof RBAuth === 'undefined') {
      boot.n = (boot.n || 0) + 1;
      if (boot.n > 50) { view().innerHTML = '<div class="rb-empty">⚠️ Firebase yüklenemedi!</div>'; return; }
      return setTimeout(boot, 100);
    }
    RBAuth.onAuth(function () { route(); });
    window.addEventListener("hashchange", route);
    setupFooterTap();
    route();
  } catch (e) { showErr(e); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
