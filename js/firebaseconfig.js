/*! RiseBunny Firebase Config — compat mod */
window.firebaseConfig = {
  apiKey: "AIzaSyAq5Nafl9aI2TabzGsj5J9ij6lNwyfTguM",
  authDomain: "gen-lang-client-0590499912.firebaseapp.com",
  projectId: "gen-lang-client-0590499912",
  storageBucket: "gen-lang-client-0590499912.firebasestorage.app",
  messagingSenderId: "203829901581",
  appId: "1:203829901581:web:66d532c52155db4aea9844"
};

// 🔑 KODA GÖMÜLÜ YÖNETİCİ UID
window.ADMIN_UID = "oblLBCNGXEYF8plKq8KUr3m6o4f1";

// Firebase SDK'ları yükle ve başlat (eğer admin.js yapmadıysa)
(function () {
  function loadSDK(src) {
    return new Promise(res => {
      if (document.querySelector('script[src="' + src + '"]')) return res();
      const s = document.createElement("script");
      s.src = src; s.onload = res; document.head.appendChild(s);
    });
  }
  (async () => {
    await loadSDK("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
    await loadSDK("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js");
    await loadSDK("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js");
    if (!firebase.apps.length) firebase.initializeApp(window.firebaseConfig);
    window.db = firebase.firestore();
    window.auth = firebase.auth();
    document.dispatchEvent(new Event("rbFirebaseReady"));
  })();
})();
