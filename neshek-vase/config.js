/* =========================================================
   נשק וסע – הגדרות חיבור
   ---------------------------------------------------------
   כל עוד `firebase` הוא null האפליקציה רצה במצב הדגמה
   (נתונים נשמרים רק במכשיר). כדי לעבור למצב אמיתי
   מדביקים כאן את ה-config מ-Firebase – ראו SETUP.md.
   ========================================================= */
self.NV_CONFIG = {
  // Firebase console → Project settings → Your apps → Web app → firebaseConfig
  firebase: null,
  /* לדוגמה:
  firebase: {
    apiKey: 'AIza...',
    authDomain: 'neshek-vase.firebaseapp.com',
    projectId: 'neshek-vase',
    storageBucket: 'neshek-vase.appspot.com',
    messagingSenderId: '1234567890',
    appId: '1:1234567890:web:abcdef'
  },
  */

  // Firebase console → Project settings → Cloud Messaging → Web Push certificates → Key pair
  vapidKey: '',

  // Firebase JS SDK location (no need to change)
  sdkBase: 'https://www.gstatic.com/firebasejs/10.12.2/'
};
