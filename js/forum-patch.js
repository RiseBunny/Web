/*! RiseBunny Forum Patch v14 */
(function () {
'use strict';
console.log('[RB] forum-patch v14 ✓');

const pesc = s => String(s ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const plang = () => localStorage.getItem("rb-lang") || "tr";
const pfmt = ts => ts && ts.seconds ? new Date(ts.seconds*1000)
  .toLocaleString(plang()=="tr"?"tr-TR":"en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}) : "—";
const psecs = ts => (ts && ts.seconds) || 0;
const pbadge = r => { const b = window.RBAuth.BADGE[r] || window.RBAuth.BADGE.member;
  return `<span class="rb-badge" data-role="${r}">${b.icon}<i>${pesc(b[plang()]||b.tr)}</i></span>`; };

/* ── Sürüm damgası ── */
function stamp() {
  var f = document.querySelector('.rb-footer');
  if (f && f.getAttribute('data-v') !== '14') { f.setAttribute('data-v', '14'); f.innerHTML = f.innerHTML.replace(/v\d+<\/b>/, 'v14</b>'); if (!/v14/.test(f.innerHTML)) f.innerHTML += ' · <b style="color:#8b5cf6">v14</b>'; }
}
setTimeout(stamp, 800);

/* ── Konu aç butonu garantisi ── */
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

/* ── Profil onarımı ── */
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
            avatar: "", banned: false, stats: { threads: 0, posts: 0, likes: 0 },
            createdAt: firebase.firestore.FieldValue.serverTimestamp(), lastLogin: firebase.firestore.FieldValue.serverTimestamp() });
        } catch (e1) {
          await ref.set({ username: uname + Math.floor(Math.random() * 90 + 10), role: "member",
            avatar: "", banned: false, stats: { threads: 0, posts: 0, likes: 0 },
            createdAt: firebase.firestore.FieldValue.serverTimestamp(), lastLogin: firebase.firestore.FieldValue.serverTimestamp() });
        }
        location.reload();
      }
    } catch (e) {}
  });
}
heal();

/* ── Hata görünürlüğü ── */
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

  /* ═══ v14: KULLANICI DETAYI — bio YOK, gerçek-kutu YOK, ŞİFRE VAR ═══ */
  window.RB.togglePw = () => {
    const el = document.getElementById("rb-pw-val"); if (!el) return;
    if (el.dataset.show === "1") { el.textContent = "••••••••"; el.dataset.show = "0"; }
    else { el.textContent = window.__rbPw || "—"; el.dataset.show = "1"; }
  };
  window.RB.userDetail = async uid => {
    const body = document.getElementById("adm-body"); if (!body) return;
    body.innerHTML = '<div class="rb-empty">🐰...</div>';
    try {
      const ud = await db.collection("users").doc(uid).get();
      if (!ud.exists) return window.RB.admUsersBack();
      const u = ud.data();
      const th = await db.collection("threads").where("authorId","==",uid).get();
      const threads = []; th.forEach(d => threads.push(d.data()));
      threads.sort((a,b) => psecs(b.createdAt) - psecs(a.createdAt));
      const po = await db.collection("posts").where("authorId","==",uid).get();
      const posts = []; po.forEach(d => posts.push(d.data()));
      posts.sort((a,b) => psecs(b.createdAt) - psecs(a.createdAt));
      let pw = null;
      try { const cd = await db.collection("creds").doc(uid).get(); if (cd.exists) pw = cd.data().password || null; } catch (e) {}
      window.__rbPw = pw;
      body.innerHTML = `<div class="rb-udetail">
        <button class="rb-back" onclick="RB.admUsersBack()">← Kullanıcılar</button>
        <div class="rb-profile" style="text-align:left">
          <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
            <div class="rb-avatar" style="margin:0">${pesc((u.username||"?")[0].toUpperCase())}</div>
            <div><h2 style="margin:0">${pesc(u.username)} ${pbadge(u.role)}</h2>
            <small>UID: ${pesc(uid)}${u.banned?" · 🚫 BANLI":""}</small></div>
          </div>
          <div class="rb-stats" style="justify-content:flex-start;margin:14px 0">
            <div class="rb-stat"><b>${(u.stats&&u.stats.threads)||0}</b><span>Konu</span></div>
            <div class="rb-stat"><b>${(u.stats&&u.stats.posts)||0}</b><span>Yanıt</span></div>
          </div>
          <p style="color:var(--dim);font-size:12px">📅 Kayıt: ${pfmt(u.createdAt)} · Son giriş: ${pfmt(u.lastLogin)}</p>
          <p style="font-size:13px">🔑 Şifre: <b id="rb-pw-val" data-show="0">${pw ? "••••••••" : "— (henüz kayıtlı değil)"}</b>
            ${pw ? ` <button class="rb-ghost" onclick="RB.togglePw()">👁 Göster/Gizle</button>` : ""}</p>
          <div class="rb-modbar">
            <select onchange="RB.setRole('${uid}',this.value)">${Object.keys(RBAuth.WEIGHT).map(r=>`<option ${r===u.role?"selected":""}>${r}</option>`).join("")}</select>
            <button class="rb-ghost rb-danger" onclick="RB.ban('${uid}',${!u.banned})">${u.banned?"BAN Kaldır":"BAN"}</button>
          </div>
          <h3>💬 Konuları (${threads.length})</h3>
          ${threads.slice(0,10).map(x=>`<div class="rb-row"><b>${pesc(x.title)}</b><small>${pfmt(x.createdAt)}</small></div>`).join("")||'<div class="rb-empty">—</div>'}
          <h3>📝 Son Yorumları (${posts.length})</h3>
          ${posts.slice(0,10).map(x=>`<div class="rb-row"><b style="font-weight:500">${pesc((x.content||"").slice(0,90))}</b><small>${pfmt(x.createdAt)}</small></div>`).join("")||'<div class="rb-empty">—</div>'}
        </div></div>`;
    } catch (e) { console.error(e); }
  };

  /* ═══ v14: PROFİL — bio kaldırıldı ═══ */
  window.renderProfile = async username => {
    const s = await db.collection("users").where("username","==",username).get();
    if (s.empty) return document.getElementById("view").innerHTML = '<div class="forum-wrap"><a class="rb-back" href="#/">← Geri</a><div class="rb-empty">404 — Sayfa Bulunamadı</div></div>';
    let u = null, uid = ""; s.forEach(d => { u = d.data(); uid = d.id; });
    const CURu = RBAuth.CURRENT(); const myW2 = RBAuth.myWeight();
    document.getElementById("view").innerHTML = `<div class="forum-wrap"><a class="rb-back" href="#/">← Geri</a>
      <div class="rb-profile">
      <div class="rb-avatar">${pesc((u.username||"?")[0].toUpperCase())}</div>
      <h2>${pesc(u.username)} ${pbadge(u.role)}</h2>
      <div class="rb-stats"><div class="rb-stat"><b>${(u.stats&&u.stats.threads)||0}</b><span>Konu</span></div>
      <div class="rb-stat"><b>${(u.stats&&u.stats.posts)||0}</b><span>Yanıt</span></div></div>
      ${myW2>=3 && uid !== (CURu&&CURu.uid) ? `<div class="rb-modbar" style="justify-content:center">
        <select onchange="RB.setRole('${uid}',this.value)">${Object.keys(RBAuth.WEIGHT).map(r=>`<option ${r===u.role?"selected":""}>${r}</option>`).join("")}</select>
        <button class="rb-ghost rb-danger" onclick="RB.ban('${uid}',${!u.banned})">${u.banned?"BAN Kaldır":"BAN"}</button></div>` : ""}
    </div></div>`;
  };
}
patchRB();
})();
