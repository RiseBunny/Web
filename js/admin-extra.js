/*! RiseBunny Admin Extra — Bakım Sekmesi + Görsel Silme + Admin Bypass İşareti */
(function () {
'use strict';
function ready(cb) { if (document.readyState !== 'loading') return cb(); document.addEventListener('DOMContentLoaded', cb); }
function fbReady(cb) { (function g() { try { if (window.firebase && window.firebaseConfig) { if (!firebase.apps.length) firebase.initializeApp(window.firebaseConfig); return cb(firebase.firestore()); } } catch (e) {} setTimeout(g, 150); })(); }
function toast(msg, type) {
  var el = document.createElement('div'); el.className = 'toast toast-' + (type || 'success');
  el.innerHTML = '<span>' + msg + '</span>';
  var w = document.querySelector('#toast-wrap');
  if (w) { w.appendChild(el); requestAnimationFrame(function () { el.classList.add('show'); }); setTimeout(function () { el.classList.remove('show'); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 350); }, 4200); }
  else alert(msg);
}

ready(function () {

  /* 🔑 Admin bypass işaretçisi — bakım modu admin'i yutmasın (tüm sekmeler) */
  function markLive() {
    try {
      var tok = sessionStorage.getItem('rb_admin_token');
      var tim = parseInt(sessionStorage.getItem('rb_admin_time') || '0', 10);
      if (tok && (Date.now() - tim < 15 * 60 * 1000)) localStorage.setItem('rb_admin_live', String(Date.now()));
    } catch (e) {}
  }
  markLive(); setInterval(markLive, 60000);

  /* ═══════ BAKIM SEKMESİ ═══════ */
  var tabBtn = document.createElement('button');
  tabBtn.type = 'button'; tabBtn.className = 'tab'; tabBtn.setAttribute('data-tab', 'maintenance');
  tabBtn.innerHTML = '<i class="fa-solid fa-screwdriver-wrench"></i> Bakım';
  var tabs = document.querySelectorAll('.tab');
  if (tabs.length) tabs[tabs.length - 1].parentNode.appendChild(tabBtn);

  var panel = document.createElement('section');
  panel.className = 'tab-panel'; panel.setAttribute('data-panel', 'maintenance');
  panel.innerHTML =
    '<h2>🔧 Bakım Modu</h2>' +
    '<p style="color:#9ca3af;font-size:13px">Aktifken TÜM sayfalar (index, forum, 404...) ziyaretçilere kapanır. Admin panele giriş yapmış cihaz siteyi normal görür.</p>' +
    '<label style="display:flex;gap:10px;align-items:center;margin:14px 0"><input type="checkbox" id="mnt-enabled"> <b>Bakım modu AKTİF</b></label>' +
    '<div class="row-controls"><textarea id="mnt-tr" rows="2" placeholder="Bakım mesajı (TR)"></textarea><textarea id="mnt-en" rows="2" placeholder="Maintenance message (EN)"></textarea></div>' +
    '<div class="row-actions" style="margin-top:10px"><button type="button" class="btn btn-primary btn-sm" id="btn-save-mnt"><i class="fa-solid fa-floppy-disk"></i> Kaydet</button></div>';
  var panels = document.querySelectorAll('.tab-panel');
  if (panels.length) panels[panels.length - 1].parentNode.appendChild(panel);

  tabBtn.addEventListener('click', function () {
    document.querySelectorAll('.tab').forEach(function (x) { x.classList.remove('active'); });
    document.querySelectorAll('.tab-panel').forEach(function (x) { x.classList.remove('active'); });
    tabBtn.classList.add('active'); panel.classList.add('active');
  });

  fbReady(function (db) {
    db.collection('config').doc('maintenance').get().then(function (s) {
      if (s.exists) { var d = s.data();
        document.getElementById('mnt-enabled').checked = !!d.active;
        document.getElementById('mnt-tr').value = (d.message && d.message.tr) || '';
        document.getElementById('mnt-en').value = (d.message && d.message.en) || '';
      }
    }).catch(function () {});

    document.getElementById('btn-save-mnt').addEventListener('click', function () {
      db.collection('config').doc('maintenance').set({
        active: document.getElementById('mnt-enabled').checked,
        message: { tr: document.getElementById('mnt-tr').value, en: document.getElementById('mnt-en').value },
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function () {
        markLive(); toast('Bakım modu kaydedildi ✅', 'success');
        db.collection('activity').add({ action: 'update_maintenance', detail: 'Bakım modu güncellendi', createdAt: firebase.firestore.FieldValue.serverTimestamp() }).catch(function () {});
      }).catch(function (e) { toast('Hata: ' + e.message, 'error'); });
    });

    /* ═══════ LOGO SİL ═══════ */
    var logoInput = document.querySelector('#inp-logo');
    if (logoInput && !document.querySelector('#btn-del-logo')) {
      var lb = document.createElement('button');
      lb.type = 'button'; lb.id = 'btn-del-logo'; lb.className = 'btn btn-outline btn-sm danger';
      lb.innerHTML = '<i class="fa-solid fa-trash"></i> Logoyu Sil';
      logoInput.parentNode.insertBefore(lb, logoInput.nextSibling);
      lb.addEventListener('click', function () { logoInput.value = ''; toast('Logo kaldırıldı — Kaydet ile onayla', 'info'); });
    }

    /* ═══════ ÜRÜN GÖRSELİ SİL ═══════ */
    function injectDelButtons() {
      document.querySelectorAll('.p-image').forEach(function (inp) {
        var holder = inp.parentNode; if (!holder || holder.querySelector('.p-del-image')) return;
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'btn btn-outline btn-sm danger p-del-image';
        b.innerHTML = '<i class="fa-solid fa-trash"></i> Sil';
        holder.appendChild(b);
        b.addEventListener('click', function () { inp.value = ''; toast('Görsel kaldırıldı — Kaydet ile onayla', 'info'); });
      });
    }
    var prows = document.querySelector('#product-rows');
    if (prows) { new MutationObserver(injectDelButtons).observe(prows, { childList: true, subtree: true }); injectDelButtons(); }
  });
});
})();
