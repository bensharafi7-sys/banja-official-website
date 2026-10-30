/* =========================================================
   נשק וסע – app (vanilla JS, hash routing, no build step)
   ========================================================= */
(function () {
  const { pad, isoDate, parseDate, addDays, nowHM, toMin } = Store.util;
  const $app = document.getElementById('app');
  const $modal = document.getElementById('modal-root');
  const $toast = document.getElementById('toast');

  /* ---------- icons ---------- */
  const P = {
    home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    car: '<path d="M5 16h14M3 16v-3l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v3a1 1 0 0 1-1 1h-1M3 16a1 1 0 0 0 1 1h1"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    logout: '<path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M14 17l5-5-5-5M19 12H8"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.5.5 4 2.7 4 6"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    gear: '<circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    upload: '<path d="M12 15V3M7 8l5-5 5 5M4 21h16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    right: '<path d="M9 6l6 6-6 6"/>',
    left: '<path d="M15 6l-6 6 6 6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    door: '<path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M3 21h18M14 12h.01"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    book: '<path d="M3 5a2 2 0 0 1 2-2h6v18H5a2 2 0 0 1-2-2zM21 5a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 0 2-2z"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    share: '<path d="M12 3v13M7 8l5-5 5 5M5 14v6h14v-6"/>',
    heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
    swap: '<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>'
  };
  const ic = (n, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${P[n]}</svg>`;
  const sunSvg = `<svg class="sun" viewBox="0 0 100 100"><g fill="none" stroke="#f7c51e" stroke-width="6" stroke-linecap="round" opacity=".55"><circle cx="50" cy="50" r="18" fill="#f7c51e"/><path d="M50 18V6M50 94V82M18 50H6M94 50H82M27 27l-8-8M81 81l-8-8M27 73l-8 8M81 19l-8 8"/></g></svg>`;

  /* ---------- helpers ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => isoDate(new Date());
  const DOW = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  const DOW_LONG = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const fmtLong = (d) => new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }).format(parseDate(d));
  const fmtMonth = (d) => new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(parseDate(d));
  const fmtDM = (d) => { const x = parseDate(d); return `${x.getDate()}.${x.getMonth() + 1}`; };
  const fmtFull = (d) => { const x = parseDate(d); return `${pad(x.getDate())}/${pad(x.getMonth() + 1)}/${x.getFullYear()}`; };
  const dow = (d) => parseDate(d).getDay();
  const initials = (n) => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join('');
  const first = (n) => n.split(/\s+/)[0];
  const COLORS = ['#13386b', '#1e7b3c', '#c8202f', '#b07d00', '#6b3fb8', '#0b6aa8', '#d0562a', '#2f7d7a'];
  const colorOf = (id) => COLORS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
  const avatar = (p, sm) => `<div class="avatar ${sm ? 'sm' : ''}" style="background:${colorOf(p.id)}">${esc(initials(p.name))}</div>`;
  const isSchoolDay = (d) => Store.settings.schoolDays.includes(dow(d));
  const weekStart = (d) => addDays(d, -dow(d));
  const daysUntil = (d) => Math.round((parseDate(d) - parseDate(today())) / 864e5);
  const STATUS = {
    future: 'מתוכנן', pending: 'ממתין', active: 'בפס עכשיו', done: 'נכח/ה', missed: 'לא הגיע/ה', excused: 'מוצדק'
  };
  const chip = (st, late) => `<span class="chip st-${st}">${STATUS[st]}</span>${late ? ' <span class="chip st-late">איחור</span>' : ''}`;
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

  function toast(msg, kind) {
    $toast.textContent = msg; $toast.className = 'show ' + (kind || '');
    clearTimeout(toast.t); toast.t = setTimeout(() => { $toast.className = ''; }, 2600);
  }
  function confetti() {
    const box = document.createElement('div'); box.className = 'confetti';
    const cols = ['#1e7b3c', '#f7c51e', '#13386b', '#c8202f', '#fff'];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement('i');
      c.style.left = Math.random() * 100 + '%';
      c.style.background = cols[i % cols.length];
      c.style.animationDuration = 1.6 + Math.random() * 1.8 + 's';
      c.style.animationDelay = Math.random() * .4 + 's';
      c.style.transform = `rotate(${Math.random() * 360}deg)`;
      box.appendChild(c);
    }
    document.body.appendChild(box); setTimeout(() => box.remove(), 4000);
  }
  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const toCSV = (rows) => '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');

  /* ---------- modal ---------- */
  function openModal(html, onMount) {
    $modal.innerHTML = `<div class="modal-back" data-close><div class="modal" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div></div>`;
    const back = $modal.firstElementChild;
    back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-dismiss]')) closeModal(); });
    onMount && onMount($modal.querySelector('.modal'));
  }
  function closeModal() { $modal.innerHTML = ''; }
  // in-page confirmation (native confirm() is blocked in some embedded views)
  function askConfirm(msg, label, onYes) {
    openModal(`<h2>רגע, לוודא</h2><p>${esc(msg)}</p>
      <div class="btn-row"><button class="btn red" id="cyes" style="flex:1">${esc(label)}</button><button class="btn ghost" data-dismiss>ביטול</button></div>`, (root) => {
      root.querySelector('#cyes').onclick = () => { closeModal(); onYes(); };
    });
  }

  /* ---------- PWA install ---------- */
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; render(); });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; toast('האפליקציה הותקנה 🎉', 'ok'); render(); });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  function installBanner() {
    if (isStandalone()) return '';
    let hidden = false; try { hidden = localStorage.getItem('nv-hide-install') === '1'; } catch (e) { /* ignore */ }
    if (hidden || (!deferredPrompt && !isIOS())) return '';
    return `<div class="install">
      <img src="icons/icon-192.png" alt="">
      <div><b>התקינו את האפליקציה</b>גישה מהירה מהמסך הראשי, כמו אפליקציה רגילה</div>
      <button class="btn yellow sm" data-a="install">התקנה</button>
      <button class="icon-btn" style="width:34px;height:34px;background:transparent;box-shadow:none;color:#fff" data-a="hide-install" aria-label="סגירה">${ic('x')}</button>
    </div>`;
  }
  function installHelp() {
    openModal(`<h2>התקנה על הטלפון</h2>
      <div class="card"><div class="card-title"><h3>📱 אייפון (Safari)</h3></div>
        <ol class="small" style="margin:0;padding-inline-start:20px">
          <li>לחצו על כפתור השיתוף ${ic('share', 'style="width:16px;height:16px;vertical-align:-3px"')} בתחתית המסך</li>
          <li>גללו ובחרו <b>״הוספה למסך הבית״</b></li>
          <li>לחצו <b>״הוסף״</b> – וזהו!</li>
        </ol></div>
      <div class="card"><div class="card-title"><h3>🤖 אנדרואיד (Chrome)</h3></div>
        <ol class="small" style="margin:0;padding-inline-start:20px">
          <li>לחצו על תפריט ⋮ בפינה העליונה</li>
          <li>בחרו <b>״התקנת אפליקציה״</b> או <b>״הוספה למסך הבית״</b></li>
        </ol></div>
      <button class="btn block" data-dismiss>הבנתי</button>`);
  }

  /* ---------- routing ---------- */
  // plain #name hashes (e.g. #admin-today) so links work in any host
  const route = () => (location.hash.replace(/^#\/?/, '') || '').split(/[-/]/);
  const go = (h) => { location.hash = '#' + h.replace('/', '-'); };
  let viewState = {};

  function render() {
    const s = Store.session();
    let [a, b] = route();
    if (!s || !Store.me()) {
      if (s) { Store.logout(); return; }
      if (a !== 'login') return go('login');
      $app.innerHTML = viewLogin(); return mountLogin();
    }
    if (a === 'login' || !a) return go(s.role === 'admin' ? 'admin/today' : 'home');
    if (s.role === 'admin' && a !== 'admin') return go('admin/today');
    if (s.role === 'parent' && a === 'admin') return go('home');

    let html;
    if (s.role === 'admin') {
      const views = { today: viewAdminToday, calendar: viewAdminCalendar, parents: viewAdminParents, reports: viewAdminReports, settings: viewAdminSettings };
      if (!views[b]) return go('admin/today');
      html = `<div class="shell wide">${topbar('ממשק ועד ההורים')}${installBanner()}${views[b]()}</div>${adminNav(b)}`;
    } else {
      const views = { home: viewHome, schedule: viewSchedule, history: viewHistory, info: viewInfo };
      if (!views[a]) return go('home');
      html = `<div class="shell">${topbar()}${installBanner()}${views[a](s.pid)}</div>${parentNav(a)}`;
    }
    $app.innerHTML = html;
    tick();
  }

  function topbar(sub) {
    return `<header class="topbar">
      <a class="brand" href="#">
        <img class="brand-mark" src="icons/icon.svg" alt="">
        <div class="brand-text"><div class="brand-title"><span class="a">נשק</span> <span class="b">וסע</span></div>
        <div class="brand-sub">${esc(sub || 'סע לשלום · ' + Store.settings.schoolName)}</div></div>
      </a>
      <button class="icon-btn" data-a="logout" aria-label="יציאה מהחשבון" title="יציאה">${ic('logout')}</button>
    </header>`;
  }
  const navLink = (h, icon, label, on) => `<a href="#${h.replace('/', '-')}" class="${on ? 'on' : ''}">${ic(icon)}<span>${label}</span></a>`;
  const parentNav = (a) => `<nav class="nav">${navLink('home', 'home', 'בית', a === 'home')}${navLink('schedule', 'cal', 'לוח משמרות', a === 'schedule')}${navLink('history', 'history', 'הנוכחות שלי', a === 'history')}${navLink('info', 'info', 'מידע', a === 'info')}</nav>`;
  const adminNav = (b) => `<nav class="nav">${navLink('admin/today', 'bolt', 'היום', b === 'today')}${navLink('admin/calendar', 'cal', 'שיבוץ', b === 'calendar')}${navLink('admin/parents', 'users', 'הורים', b === 'parents')}${navLink('admin/reports', 'chart', 'דוחות', b === 'reports')}${navLink('admin/settings', 'gear', 'הגדרות', b === 'settings')}</nav>`;

  /* =========================================================
     LOGIN
     ========================================================= */
  function viewLogin() {
    const setup = Store.needsSetup;
    const demo = Store.mode === 'local';
    const t = today();
    const demoParent = demo && Store.team(t)[0] ? Store.parent(Store.team(t)[0]) : Store.parents[0];
    return `<div class="login">
      <div class="login-hero">
        <img class="logo-big" src="icons/icon.svg" alt="">
        <h1 class="login-title"><span class="a">נשק</span> <span class="b">וסע</span></h1>
        <svg class="login-underline" viewBox="0 0 220 14"><path d="M4 10 Q110 0 216 8" stroke="#f7c51e" stroke-width="6" fill="none" stroke-linecap="round"/></svg>
        <div class="login-school"><img src="icons/school-logo.jpg" alt="סמל בית הספר מישור הנוף"><div class="login-sub">מיזם של הנהגת ההורים<br>בית הספר ״${esc(Store.settings.schoolName)}״</div></div>
        <div class="login-tag"><span class="brush yellow hand">יחד למען בטחון הילדים שלנו! ♥</span></div>
      </div>
      ${setup ? `
      <form class="card" id="lform">
        <div class="card-title"><h3>הגדרה ראשונה</h3><span class="chip st-future">חד-פעמי</span></div>
        <p class="small muted mt0">יוצרים את החשבון הראשון של ועד ההורים. בהמשך תוכלו להוסיף חברי ועד נוספים והורים מתוך האפליקציה.</p>
        <label class="field"><span>שם מלא</span><input class="input" id="lname" autocomplete="name" required></label>
        <label class="field"><span>מספר טלפון</span><input class="input" id="lphone" type="tel" inputmode="tel" autocomplete="tel" placeholder="050-0000000" required></label>
        <label class="field"><span>בחרו קוד אישי (6 ספרות)</span><input class="input pin-input" id="lcode" inputmode="numeric" maxlength="6" type="password" autocomplete="new-password" required></label>
        <button class="btn green block" id="lgo">${ic('shield')} יצירת חשבון ועד</button>
      </form>` : `
      <form class="card" id="lform">
        <div class="card-title"><h3>כניסה</h3><span class="small muted">להורים ולחברי הועד</span></div>
        <label class="field"><span>מספר טלפון</span><input class="input" id="lphone" type="tel" inputmode="tel" autocomplete="tel" placeholder="050-0000000" required></label>
        <label class="field"><span>קוד אישי</span><input class="input pin-input" id="lcode" inputmode="numeric" maxlength="6" type="password" autocomplete="current-password" required></label>
        <button class="btn green block" id="lgo">${ic('car')} כניסה</button>
        <p class="small muted center" style="margin-bottom:0">את הקוד האישי מקבלים מוועד ההורים. שכחתם? פנו לוועד.</p>
      </form>
      ${demo ? `<div class="card demo-box">
        <div class="card-title"><h3>גרסת הדגמה</h3><span class="chip st-pending">נתונים לדוגמה</span></div>
        <p class="small muted mt0">הנתונים נשמרים רק במכשיר הזה. כניסה מהירה:</p>
        <div class="btn-row">
          ${demoParent ? `<button class="btn sm" data-a="demo-login" data-phone="${esc(demoParent.phone)}">${ic('users')} הורה (${esc(first(demoParent.name))})</button>` : ''}
          <button class="btn yellow sm" data-a="demo-login" data-phone="0500000000">${ic('shield')} ועד הורים</button>
        </div>
        <p class="small muted" style="margin-bottom:0">בדמו הקוד של כולם הוא <b>123456</b></p>
      </div>` : ''}`}
      <div class="login-foot">סע לשלום = חיים 💚 · ביחד ניצור סביבה בטוחה יותר</div>
    </div>`;
  }
  function mountLogin() {
    const form = document.getElementById('lform');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const phone = document.getElementById('lphone').value;
      const code = document.getElementById('lcode').value.trim();
      const nameEl = document.getElementById('lname');
      if (Store.util.normPhone(phone).length < 9) { toast('מספר טלפון לא תקין', 'err'); return; }
      if (!/^\d{6}$/.test(code)) { toast('הקוד האישי הוא 6 ספרות', 'err'); return; }
      const btn = document.getElementById('lgo');
      btn.disabled = true; btn.textContent = 'רגע…';
      try {
        if (nameEl) await Store.setup(nameEl.value.trim(), phone, code);
        else await Store.login(phone, code);
        const me = Store.me();
        toast(`שלום ${me ? first(me.name) : ''}! 👋`, 'ok');
        render();
      } catch (err) {
        if (err.message !== 'bad-code') console.error(err);
        toast(err.message === 'bad-code' ? 'מספר הטלפון או הקוד שגויים' : err.code === 'auth/network-request-failed' ? 'אין חיבור לאינטרנט' : err.code === 'auth/too-many-requests' ? 'יותר מדי ניסיונות. נסו שוב בעוד כמה דקות' : 'הכניסה נכשלה. נסו שוב', 'err');
        btn.disabled = false; btn.innerHTML = `${ic('car')} כניסה`;
      }
    };
  }

  /* =========================================================
     PARENT
     ========================================================= */
  function viewHome(pid) {
    const p = Store.parent(pid);
    const t = today();
    const team = Store.team(t);
    const set = Store.settings;
    const greeting = (() => { const h = new Date().getHours(); return h < 12 ? 'בוקר טוב' : h < 17 ? 'צהריים טובים' : 'ערב טוב'; })();
    let hero = '';

    if (team.includes(pid)) {
      const st = Store.status(t, pid);
      const r = Store.rec(t, pid) || {};
      const partners = team.filter((x) => x !== pid).map(Store.parent).filter(Boolean);
      const partnerTxt = partners.length ? 'יחד עם ' + partners.map((x) => esc(first(x.name))).join(' ו') : '';
      let body;
      if (st === 'pending' || st === 'missed') {
        body = `<div class="checkin-wrap"><button class="checkin" data-a="checkin">${ic('car')}הגעתי!<small>סימון כניסה</small></button></div>
          <div class="timer" data-countdown="${t}T${set.shiftStart}"></div>`;
      } else if (st === 'active') {
        body = `<div class="checkin-wrap"><button class="checkin out" data-a="checkout">${ic('door')}סיימתי<small>סימון יציאה</small></button></div>
          <div class="times"><div class="t"><b>${esc(r.in)}</b><span>כניסה</span></div><div class="t"><b data-elapsed="${esc(r.in)}">–</b><span>זמן בפס</span></div></div>`;
      } else if (st === 'excused') {
        body = `<p style="margin-top:14px;position:relative;z-index:1">המשמרת סומנה כמוצדקת על ידי הועד${r.note ? ' – ' + esc(r.note) : ''}.</p>`;
      } else {
        body = `<div class="checkin-wrap"><div class="checkin done">${ic('heart')}תודה!<small>המשמרת הושלמה</small></div></div>
          <div class="times"><div class="t"><b>${esc(r.in)}</b><span>כניסה</span></div><div class="t"><b>${esc(r.out || '—')}</b><span>יציאה</span></div></div>
          <div class="thanks hand">הצלת חיים היום 💚</div>`;
      }
      hero = `<section class="hero">${sunSvg}
        <div class="hero-kicker">${ic('bolt', 'style="width:16px;height:16px"')} המשמרת שלך – היום!</div>
        <h1>${greeting}, ${esc(first(p.name))}</h1>
        <p>${fmtLong(t)}</p>
        <div class="meta"><span class="pill">${ic('clock')} <bdi dir="ltr">${set.shiftStart}–${set.shiftEnd}</bdi></span>${partnerTxt ? `<span class="pill">${ic('users')} ${partnerTxt}</span>` : ''}</div>
        ${body}
      </section>`;
    } else {
      const next = Store.shiftsOf(pid).find((d) => d > t);
      if (next) {
        const n = daysUntil(next);
        const partners = Store.team(next).filter((x) => x !== pid).map(Store.parent).filter(Boolean);
        hero = `<section class="hero navy">${sunSvg}
          <div class="hero-kicker">${greeting}, ${esc(first(p.name))} 👋</div>
          <h1>המשמרת הבאה שלך</h1>
          <p style="font-size:20px;font-weight:800">${fmtLong(next)}</p>
          <div class="meta">
            <span class="pill">${ic('clock')} <bdi dir="ltr">${set.shiftStart}–${set.shiftEnd}</bdi></span>
            <span class="pill">${ic('cal')} ${n === 1 ? 'מחר!' : 'בעוד ' + n + ' ימים'}</span>
            ${partners.length ? `<span class="pill">${ic('users')} עם ${partners.map((x) => esc(first(x.name))).join(' ו')}</span>` : ''}
          </div>
          <div class="btn-row" style="margin-top:16px;position:relative;z-index:1">
            <button class="btn yellow sm" data-a="ics">${ic('cal')} הוספה ליומן</button>
            <button class="btn ghost sm" data-a="swap-req" data-d="${next}">${ic('swap')} בקשת החלפה</button>
          </div>
        </section>`;
      } else {
        hero = `<section class="hero gold">${sunSvg}<div class="hero-kicker">${greeting}, ${esc(first(p.name))}</div>
          <h1>אין משמרות מתוכננות</h1><p>הועד יעדכן כשתשובצו. תודה שאתם חלק מהמיזם!</p></section>`;
      }
    }

    // stats
    const mine = Store.shiftsOf(pid).filter((d) => d <= t);
    const attended = mine.filter((d) => Store.status(d, pid) === 'done').length;
    const mins = mine.reduce((a, d) => a + Store.minutes(d, pid), 0);
    const upcoming = Store.shiftsOf(pid).filter((d) => d > t).slice(0, 4);

    // who's on today
    const todayCard = isSchoolDay(t) ? `<div class="card"><div class="card-title"><h3>מי בפס היום?</h3><span class="small muted"><bdi dir="ltr">${set.shiftStart}–${set.shiftEnd}</bdi></span></div>
      <div class="team">${team.length ? team.map((id) => { const q = Store.parent(id); return q ? `<div class="tm">${avatar(q, true)}<div class="who"><b>${esc(q.name)}${id === pid ? ' (את/ה)' : ''}</b></div>${chip(Store.status(t, id), Store.isLate(t, id))}</div>` : ''; }).join('') : '<div class="empty">לא שובצו הורים להיום</div>'}</div></div>` : '';

    return `${hero}
      <div class="stats">
        <div class="stat g"><b>${attended}</b><span>משמרות שבוצעו</span></div>
        <div class="stat"><b>${mins}</b><span>דקות בפס</span></div>
        <div class="stat y"><b>${upcoming.length ? Store.shiftsOf(pid).filter((d) => d > t).length : 0}</b><span>משמרות קרובות</span></div>
      </div>
      ${Store.requests.filter((r) => r.pid === pid && r.status === 'open').map((r) => `<div class="card notice"><b>${ic('swap', 'style="width:16px;height:16px;vertical-align:-3px"')} בקשת ההחלפה ל${fmtLong(r.date)} נשלחה לוועד.</b> <span class="small">נעדכן את הלוח כשיימצא/תימצא מחליף/ה.</span></div>`).join('')}
      ${pushNudge()}
      ${todayCard}
      ${upcoming.length ? `<div class="card"><div class="card-title"><h3>המשמרות הבאות שלי</h3><a class="small" href="#schedule">ללוח המלא</a></div>
        <div class="list">${upcoming.map((d) => `<div class="row"><div class="date-badge"><b>${parseDate(d).getDate()}</b><span>${DOW[dow(d)]}</span></div>
          <div class="who"><b>${fmtLong(d)}</b><span>עם ${Store.team(d).filter((x) => x !== pid).map((x) => esc(Store.parent(x)?.name || '')).join(', ') || '—'}</span></div>${chip('future')}</div>`).join('')}</div></div>` : ''}
      <div class="flyer-strip"><div style="flex:1"><b>סע לשלום</b><div class="small">ביחד ניצור סביבה בטוחה יותר</div></div><span class="eq">= חיים</span></div>`;
  }

  function viewSchedule(pid) {
    const t = today();
    const ws = viewState.week || weekStart(t);
    const days = [...Array(7)].map((_, i) => addDays(ws, i)).filter(isSchoolDay);
    return `<div class="section-label mt0" style="margin-top:0">לוח משמרות</div>
      <div class="weekbar">
        <button class="icon-btn" data-a="week" data-v="-7" aria-label="שבוע קודם">${ic('right')}</button>
        <div class="center"><b>${fmtDM(ws)} – ${fmtDM(addDays(ws, 6))}</b><div class="small muted">${ws <= t && t <= addDays(ws, 6) ? 'השבוע' : fmtMonth(ws)}</div></div>
        <button class="icon-btn" data-a="week" data-v="7" aria-label="שבוע הבא">${ic('left')}</button>
      </div>
      ${ws > t || addDays(ws, 6) < t ? `<div class="center" style="margin-bottom:12px"><button class="btn ghost sm" data-a="week" data-v="0">חזרה להשבוע</button></div>` : ''}
      ${days.map((d) => {
        const team = Store.team(d);
        return `<div class="day-card ${d === t ? 'today' : ''} ${team.includes(pid) ? 'mine' : ''}">
          <div class="day-head"><b>יום ${DOW_LONG[dow(d)]} · ${fmtDM(d)}</b><span>${d === t ? '<span class="chip st-pending">היום</span>' : ''}${team.includes(pid) ? ' <span class="chip st-done">המשמרת שלי</span>' : ''}</span></div>
          <div class="team">${team.length ? team.map((id) => { const q = Store.parent(id); return q ? `<div class="tm">${avatar(q, true)}<div class="who"><b>${esc(q.name)}</b><span>${esc(q.child || '')}${q.cls ? ' · ' + esc(q.cls) : ''}</span></div>${chip(Store.status(d, id), Store.isLate(d, id))}</div>` : ''; }).join('') : '<div class="small muted">טרם שובצו הורים</div>'}</div>
        </div>`;
      }).join('')}`;
  }

  function viewHistory(pid) {
    const t = today();
    const past = Store.shiftsOf(pid).filter((d) => d <= t).reverse();
    const cnt = (s) => past.filter((d) => Store.status(d, pid) === s).length;
    const done = cnt('done');
    const pct = past.length ? Math.round((done / past.length) * 100) : 0;
    return `<div class="section-label" style="margin-top:0">הנוכחות שלי</div>
      <div class="stats">
        <div class="stat g"><b>${done}</b><span>נכחתי</span></div>
        <div class="stat r"><b>${cnt('missed')}</b><span>לא הגעתי</span></div>
        <div class="stat"><b>${pct}%</b><span>התייצבות</span></div>
      </div>
      <div class="card"><div class="list">${past.length ? past.map((d) => {
        const r = Store.rec(d, pid) || {};
        const st = Store.status(d, pid);
        return `<div class="row"><div class="date-badge"><b>${parseDate(d).getDate()}</b><span>${DOW[dow(d)]} ${parseDate(d).getMonth() + 1}/</span></div>
          <div class="who"><b>${r.in ? `${esc(r.in)} ← ${esc(r.out || '—')}` : fmtLong(d)}</b><span>${r.in ? Store.minutes(d, pid) + ' דקות' : ''}${r.note ? ' · ' + esc(r.note) : ''}${r.by === 'admin' ? ' · עודכן ע״י הועד' : ''}</span></div>
          ${chip(st, Store.isLate(d, pid))}</div>`;
      }).join('') : '<div class="empty"><span class="big">🚗</span>עוד אין משמרות בהיסטוריה</div>'}</div></div>`;
  }

  function viewInfo(pid) {
    const p = Store.parent(pid);
    const set = Store.settings;
    return `<div class="card" style="background:linear-gradient(160deg,#fff,#fff8e0)">
        <div class="center"><span class="brush red" style="font-size:22px">זה לא צריך להיות ככה!</span></div>
        <p class="center" style="margin:14px 0 4px">תאונות דרכים באזור בית הספר הן מציאות מצערת, אך ניתנות למניעה.</p>
        <div class="center"><span class="brush" style="font-size:20px">המיזם שלנו – מציל חיים! ♥</span></div>
      </div>
      <div class="card"><div class="card-title"><h3>איך זה עובד?</h3></div>
        <div class="how">
          <div class="step"><div class="ic" style="background:var(--green)">${ic('clock')}</div><div><b>2 הורים עומדים</b><div class="small muted">בפס הירוק של הורדת התלמידים בבית הספר, למשך חצי שעה בלבד בבוקר (<bdi dir="ltr">${set.shiftStart}–${set.shiftEnd}</bdi>).</div></div></div>
          <div class="step"><div class="ic" style="background:var(--navy)">${ic('car')}</div><div><b>דואגים לפתוח להורים את דלת הרכב</b><div class="small muted">שהילד ירד במהירות, ויוכלו להמשיך לנסוע.</div></div></div>
          <div class="step"><div class="ic" style="background:var(--green)">${ic('book')}</div><div><b>למידה ערכית וחוויה</b><div class="small muted">לילדים השותפים.</div></div></div>
        </div></div>
      <div class="card"><div class="card-title"><h3>באפליקציה</h3></div>
        <div class="how small">
          <div>✅ ביום המשמרת לחצו <b>״הגעתי!״</b> כשאתם מגיעים לפס, ו<b>״סיימתי״</b> בסוף.</div>
          <div>📅 ב״לוח משמרות״ רואים מי משובץ בכל יום.</div>
          <div>🔔 הפעילו התראות כדי לקבל תזכורת יום לפני המשמרת.</div>
          <div>📍 ״הגעתי!״ עובד רק ליד בית הספר, לכן צריך לאשר גישה למיקום.</div>
          <div>🔄 לא יכולים להגיע? שלחו ״בקשת החלפה״ לוועד.</div>
        </div>
        <div class="btn-row" style="margin-top:14px"><button class="btn green sm" data-a="ics">${ic('cal')} כל המשמרות שלי ליומן</button>
        ${!isStandalone() ? `<button class="btn ghost sm" data-a="install">${ic('download')} התקנה על הטלפון</button>` : ''}</div>
      </div>
      ${Store.mode === 'firebase' && (self.NV_CONFIG || {}).vapidKey ? `<div class="card split"><div style="flex:1;min-width:0"><b>🔔 התראות</b><div class="small muted">${'Notification' in window && Notification.permission === 'granted' ? 'פעילות. תקבלו תזכורת בערב שלפני המשמרת.' : 'תזכורת בערב שלפני המשמרת.'}</div></div>
        ${'Notification' in window && Notification.permission === 'granted' ? '<span class="chip st-done">פעיל</span>' : '<button class="btn yellow sm" data-a="push">הפעלה</button>'}</div>` : ''}
      <div class="card"><div class="partner">${avatar(p)}<div class="who"><b>${esc(p.name)}</b><span>${esc(p.child || '')}${p.cls ? ' · ' + esc(p.cls) : ''}</span></div>
        <button class="btn ghost sm" data-a="logout">${ic('logout')} החלפת משתמש</button></div></div>
      <div class="school-foot"><img src="icons/school-logo.jpg" alt=""><div>בית הספר הממלכתי ״${esc(set.schoolName)}״<br><span class="hand" style="font-size:22px">להקשיב, להבין, לאהוב</span></div></div>`;
  }

  /* =========================================================
     ADMIN
     ========================================================= */
  function viewAdminToday() {
    const t = today();
    let d = viewState.boardDate || t;
    const team = Store.team(d);
    const sts = team.map((id) => Store.status(d, id));
    const c = (s) => sts.filter((x) => x === s).length;
    // gaps in the next 14 days
    const gaps = [];
    for (let i = 0; i < 14; i++) {
      const x = addDays(t, i);
      if (isSchoolDay(x) && Store.team(x).length < Store.settings.perShift) gaps.push(x);
    }
    return `<div class="split" style="margin-bottom:14px">
        <div><div class="section-label" style="margin:0">לוח בקרה</div><h2 style="margin:2px 0 0;color:var(--navy)">${fmtLong(d)}</h2></div>
        <div class="btn-row">
          <button class="icon-btn" data-a="board-day" data-v="-1" aria-label="יום קודם">${ic('right')}</button>
          ${d !== t ? `<button class="btn ghost sm" data-a="board-day" data-v="0">היום</button>` : ''}
          <button class="icon-btn" data-a="board-day" data-v="1" aria-label="יום הבא">${ic('left')}</button>
        </div>
      </div>
      <div class="stats four">
        <div class="stat"><b>${team.length}</b><span>משובצים</span></div>
        <div class="stat g"><b>${c('done') + c('active')}</b><span>הגיעו</span></div>
        <div class="stat y"><b>${c('pending') + c('future')}</b><span>ממתינים</span></div>
        <div class="stat r"><b>${c('missed')}</b><span>לא הגיעו</span></div>
      </div>
      ${!isSchoolDay(d) ? '<div class="card empty"><span class="big">🌤️</span>אין לימודים ביום זה</div>' : `
      <div class="board">${team.map((id) => {
        const q = Store.parent(id); if (!q) return '';
        const st = Store.status(d, id); const r = Store.rec(d, id) || {};
        return `<div class="slot st-b-${st}">
          <div class="partner">${avatar(q)}<div class="who"><b>${esc(q.name)}</b><span>${esc(q.child || '')}${q.cls ? ' · ' + esc(q.cls) : ''}</span></div></div>
          <div class="split" style="margin-top:10px">${chip(st, Store.isLate(d, id))}<span class="small muted">${r.in ? 'כניסה ' + esc(r.in) : ''}${r.out ? ' · יציאה ' + esc(r.out) : ''}</span></div>
          ${r.in && r.geoOk !== undefined ? `<div style="margin-top:6px">${geoChip(r)}</div>` : ''}
          ${r.note ? `<div class="small muted" style="margin-top:6px">📝 ${esc(r.note)}</div>` : ''}
          <div class="acts">
            ${!r.in && st !== 'excused' ? `<button class="btn green sm" data-a="adm-in" data-d="${d}" data-id="${id}">${ic('check')} כניסה</button>` : ''}
            ${r.in && !r.out ? `<button class="btn sm" data-a="adm-out" data-d="${d}" data-id="${id}">${ic('door')} יציאה</button>` : ''}
            <button class="btn ghost sm" data-a="edit-rec" data-d="${d}" data-id="${id}">${ic('edit')} עריכה</button>
            ${q.phone ? `<a class="btn ghost sm" href="tel:${esc(q.phone)}">${ic('phone')}</a>` : ''}
          </div></div>`;
      }).join('') || '<div class="card empty">לא שובצו הורים ליום זה</div>'}</div>
      <div class="btn-row" style="margin-top:12px"><button class="btn ghost sm" data-a="day" data-d="${d}">${ic('swap')} שינוי שיבוץ ליום זה</button></div>`}
      ${requestsCard()}
      ${remindersCard()}
      <div class="section-label">שבועיים קרובים</div>
      <div class="card">${gaps.length ? `<div class="card-title"><h3>⚠️ ימים חסרים</h3><span class="chip st-missed">${gaps.length}</span></div>
        <div class="btn-row">${gaps.map((x) => `<button class="btn ghost sm" data-a="day" data-d="${x}">${DOW[dow(x)]} ${fmtDM(x)} · ${Store.team(x).length}/${Store.settings.perShift}</button>`).join('')}</div>`
        : '<div class="center"><b style="color:var(--green)">✔ כל הימים בשבועיים הקרובים מאוישים</b></div>'}</div>
      <div class="section-label">פעילות אחרונה</div>
      <div class="card">${Store.log.slice(0, 8).map((l) => `<div class="log-row"><time>${new Date(l.t).toLocaleString('he-IL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}</time><div><b>${esc(l.action)}</b> · ${esc(l.detail)} <span class="muted">(${esc(l.who)})</span></div></div>`).join('') || '<div class="empty">אין פעילות עדיין</div>'}</div>`;
  }

  function viewAdminCalendar() {
    const t = today();
    const m = viewState.month || t.slice(0, 8) + '01';
    const m0 = parseDate(m);
    const daysInMonth = new Date(m0.getFullYear(), m0.getMonth() + 1, 0).getDate();
    const lead = m0.getDay();
    let cells = '';
    for (let i = 0; i < lead; i++) cells += '<div class="cell out"></div>';
    for (let i = 1; i <= daysInMonth; i++) {
      const d = m.slice(0, 8) + pad(i);
      if (!isSchoolDay(d)) { cells += `<div class="cell off"><span class="num">${i}</span></div>`; continue; }
      const team = Store.team(d);
      const short = team.length < Store.settings.perShift;
      cells += `<button class="cell ${d === t ? 'today' : ''}" data-a="day" data-d="${d}">
        <span class="num">${i}</span>
        ${team.map((id) => { const q = Store.parent(id); return q ? `<span class="nm chip-like st-${Store.status(d, id)}">${esc(first(q.name))}</span>` : ''; }).join('')}
        ${short ? `<span class="add" style="color:var(--red)">+ חסר ${Store.settings.perShift - team.length}</span>` : ''}
      </button>`;
    }
    const prev = isoDate(new Date(m0.getFullYear(), m0.getMonth() - 1, 1));
    const next = isoDate(new Date(m0.getFullYear(), m0.getMonth() + 1, 1));
    return `<div class="split" style="margin-bottom:14px">
        <div class="btn-row" style="align-items:center">
          <button class="icon-btn" data-a="month" data-v="${prev}" aria-label="חודש קודם">${ic('right')}</button>
          <h2 style="margin:0 6px;color:var(--navy);min-width:140px;text-align:center">${fmtMonth(m)}</h2>
          <button class="icon-btn" data-a="month" data-v="${next}" aria-label="חודש הבא">${ic('left')}</button>
        </div>
        <div class="btn-row">
          <button class="btn green sm" data-a="auto">${ic('bolt')} שיבוץ אוטומטי</button>
          <button class="btn ghost sm" data-a="clear-month" data-v="${m}">${ic('trash')} ניקוי החודש</button>
        </div>
      </div>
      <div class="cal">${DOW.map((x) => `<div class="dow">${x}</div>`).join('')}${cells}</div>
      <p class="small muted center">לחצו על יום כדי לשבץ הורים, להחליף ולערוך נוכחות</p>`;
  }

  function viewAdminParents() {
    const q = viewState.pq || '';
    const t = today();
    const ps = Store.parents.filter((p) => !q || p.name.includes(q) || (p.child || '').includes(q) || (p.phone || '').includes(q));
    return `<div class="split" style="margin-bottom:14px">
        <h2 style="margin:0;color:var(--navy)">הורים <span class="chip st-future">${Store.parents.filter((p) => p.active).length} פעילים</span></h2>
        <div class="btn-row"><button class="btn green sm" data-a="parent-edit">${ic('plus')} הורה חדש</button><button class="btn ghost sm" data-a="parent-import">${ic('upload')} ייבוא מאקסל</button><button class="btn ghost sm" data-a="csv-codes">${ic('download')} רשימת קודים</button></div>
      </div>
      ${Store.mode === 'firebase' && Store.parents.some((p) => p.active && !p.uid) ? `<div class="card notice"><b>${Store.parents.filter((p) => p.active && !p.uid).length} הורים עוד לא נכנסו לאפליקציה.</b> <span class="small">פתחו הורה ולחצו ״שליחה בוואטסאפ״ כדי לשלוח לו/ה את הקישור והקוד.</span></div>` : ''}
      <div class="search" style="margin-bottom:14px">${ic('search')}<input class="input" id="pq" placeholder="חיפוש הורה, ילד/ה או טלפון" value="${esc(q)}"></div>
      <div class="card"><div class="list">${ps.map((p) => {
        const all = Store.shiftsOf(p.id);
        const past = all.filter((d) => d <= t);
        const done = past.filter((d) => Store.status(d, p.id) === 'done').length;
        return `<div class="row clickable" data-a="parent-edit" data-id="${p.id}" style="${p.active ? '' : 'opacity:.5'}">
          ${avatar(p, true)}<div class="who"><b>${esc(p.name)}</b><span>${esc(p.child || '')}${p.cls ? ' · ' + esc(p.cls) : ''}${p.phone ? ' · ' + esc(p.phone) : ''}</span></div>
          ${Store.mode === 'firebase' ? (p.uid ? '<span class="chip st-done">מחובר/ת</span>' : '<span class="chip st-pending">לא נכנס/ה</span>') : ''}
          <span class="small muted" style="text-align:left">${done}/${past.length} נוכחות<br>${all.length - past.length} עתידיות</span>
        </div>`;
      }).join('') || '<div class="empty">לא נמצאו הורים</div>'}</div></div>`;
  }

  function reportRange() {
    const t = today();
    return { from: viewState.rFrom || t.slice(0, 8) + '01', to: viewState.rTo || t };
  }
  function reportData() {
    const { from, to } = reportRange();
    const days = Object.keys(Store.shifts).filter((d) => d >= from && d <= to).sort();
    const per = {};
    const records = [];
    days.forEach((d) => Store.team(d).forEach((id) => {
      const st = Store.status(d, id);
      const r = Store.rec(d, id) || {};
      const o = per[id] || (per[id] = { id, assigned: 0, done: 0, missed: 0, excused: 0, late: 0, mins: 0 });
      if (st === 'future' || st === 'pending') return;
      o.assigned++;
      if (st === 'done' || st === 'active') o.done++;
      if (st === 'missed') o.missed++;
      if (st === 'excused') o.excused++;
      if (Store.isLate(d, id)) o.late++;
      o.mins += Store.minutes(d, id);
      records.push({ d, id, st, r });
    }));
    return { from, to, per: Object.values(per), records };
  }

  function viewAdminReports() {
    const { from, to, per, records } = reportData();
    const sortBy = viewState.rSort || 'missed';
    per.sort((a, b) => b[sortBy] - a[sortBy] || (Store.parent(a.id)?.name || '').localeCompare(Store.parent(b.id)?.name || ''));
    const tot = per.reduce((a, o) => ({ assigned: a.assigned + o.assigned, done: a.done + o.done, missed: a.missed + o.missed, mins: a.mins + o.mins }), { assigned: 0, done: 0, missed: 0, mins: 0 });
    const rate = tot.assigned ? Math.round((tot.done / tot.assigned) * 100) : 0;
    const th = (k, label) => `<th><a href="#" data-a="rsort" data-v="${k}" style="text-decoration:none;color:inherit">${label}${sortBy === k ? ' ▾' : ''}</a></th>`;
    return `<div class="split" style="margin-bottom:14px">
        <h2 style="margin:0;color:var(--navy)">דוחות נוכחות</h2>
        <div class="btn-row"><button class="btn green sm" data-a="csv-summary">${ic('download')} סיכום (Excel)</button><button class="btn ghost sm" data-a="csv-records">${ic('download')} כל הרשומות</button></div>
      </div>
      <div class="card"><div class="grid2">
        <label class="field" style="margin:0"><span>מתאריך</span><input class="input" type="date" id="rFrom" value="${from}"></label>
        <label class="field" style="margin:0"><span>עד תאריך</span><input class="input" type="date" id="rTo" value="${to}"></label>
      </div></div>
      <div class="stats four">
        <div class="stat"><b>${tot.assigned}</b><span>משמרות שעברו</span></div>
        <div class="stat g"><b>${rate}%</b><span>התייצבות</span></div>
        <div class="stat r"><b>${tot.missed}</b><span>היעדרויות</span></div>
        <div class="stat y"><b>${Math.round(tot.mins / 60)}</b><span>שעות התנדבות</span></div>
      </div>
      <div class="card"><div class="card-title"><h3>לפי הורה</h3></div><div class="table-wrap"><table class="t">
        <thead><tr><th>הורה</th>${th('assigned', 'שובץ')}${th('done', 'נכח')}${th('missed', 'נעדר')}${th('excused', 'מוצדק')}${th('late', 'איחור')}${th('mins', 'דקות')}<th>התייצבות</th></tr></thead>
        <tbody>${per.map((o) => {
          const p = Store.parent(o.id); const pc = o.assigned ? Math.round((o.done / o.assigned) * 100) : 0;
          return `<tr><td><b>${esc(p?.name || '—')}</b></td><td>${o.assigned}</td><td style="color:var(--green);font-weight:700">${o.done}</td><td style="color:var(--red);font-weight:700">${o.missed || ''}</td><td>${o.excused || ''}</td><td>${o.late || ''}</td><td>${o.mins}</td>
            <td><div class="split" style="flex-wrap:nowrap"><div class="bar" style="flex:1"><i style="width:${pc}%;${pc < 70 ? 'background:var(--red)' : ''}"></i></div><span class="small">${pc}%</span></div></td></tr>`;
        }).join('') || '<tr><td colspan="8" class="empty">אין נתונים בטווח</td></tr>'}</tbody></table></div></div>
      <div class="card"><div class="card-title"><h3>היעדרויות בטווח</h3></div><div class="list">${records.filter((x) => x.st === 'missed').reverse().map((x) => `<div class="row clickable" data-a="edit-rec" data-d="${x.d}" data-id="${x.id}">
        <div class="date-badge"><b>${parseDate(x.d).getDate()}</b><span>${DOW[dow(x.d)]} ${parseDate(x.d).getMonth() + 1}/</span></div>
        <div class="who"><b>${esc(Store.parent(x.id)?.name || '')}</b><span>${fmtLong(x.d)}</span></div>${chip('missed')}</div>`).join('') || '<div class="empty">אין היעדרויות 🎉</div>'}</div></div>`;
  }

  function viewAdminSettings() {
    const s = Store.settings;
    return `<h2 style="margin:0 0 14px;color:var(--navy)">הגדרות</h2>
      <div class="card"><div class="card-title"><h3>משמרת</h3></div>
        <div class="grid2">
          <label class="field"><span>שעת התחלה</span><input class="input" type="time" id="sStart" value="${s.shiftStart}"></label>
          <label class="field"><span>שעת סיום</span><input class="input" type="time" id="sEnd" value="${s.shiftEnd}"></label>
          <label class="field"><span>הורים במשמרת</span><input class="input" type="number" min="1" max="6" id="sPer" value="${s.perShift}"></label>
          <label class="field"><span>איחור אחרי (דקות)</span><input class="input" type="number" min="0" max="30" id="sGrace" value="${s.lateGraceMin}"></label>
        </div>
        <div class="field"><span>ימי פעילות</span><div class="days-picker">${DOW.map((x, i) => `<label><input type="checkbox" class="sDay" value="${i}" ${s.schoolDays.includes(i) ? 'checked' : ''}><span>${x}</span></label>`).join('')}</div></div>
      </div>
      <div class="card"><div class="card-title"><h3>בית הספר והועד</h3></div>
        <label class="field"><span>שם בית הספר</span><input class="input" id="sSchool" value="${esc(s.schoolName)}"></label>
        <label class="field" style="margin-bottom:0"><span>טלפון רכז/ת הועד (לפניות דחופות בוואטסאפ)</span><input class="input" id="sPhone" type="tel" inputmode="tel" value="${esc(s.committeePhone)}" placeholder="050-0000000"></label>
      </div>
      <div class="card"><div class="card-title"><h3>📍 אימות מיקום בהגעה</h3></div>
        <label class="field"><span>מצב</span><select class="input" id="gMode">
          <option value="block" ${s.geoMode === 'block' ? 'selected' : ''}>חובה – אי אפשר לסמן הגעה רחוק מבית הספר</option>
          <option value="flag" ${s.geoMode === 'flag' ? 'selected' : ''}>גמיש – מאפשר, אבל מסמן לוועד ״לא אומת״</option>
          <option value="off" ${s.geoMode === 'off' ? 'selected' : ''}>כבוי</option>
        </select></label>
        <div class="grid2">
          <label class="field"><span>קו רוחב</span><input class="input" id="gLat" inputmode="decimal" dir="ltr" value="${esc(s.geoLat ?? '')}" placeholder="31.7…"></label>
          <label class="field"><span>קו אורך</span><input class="input" id="gLng" inputmode="decimal" dir="ltr" value="${esc(s.geoLng ?? '')}" placeholder="35.2…"></label>
        </div>
        <label class="field"><span>רדיוס מותר (מטרים)</span><input class="input" type="number" min="30" max="2000" id="gRad" value="${s.geoRadius}"></label>
        <div class="btn-row"><button class="btn ghost sm" data-a="geo-here">${ic('bolt')} המיקום שלי עכשיו</button>
        ${s.geoLat ? `<a class="btn ghost sm" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${esc(s.geoLat)},${esc(s.geoLng)}">הצגה במפה</a>` : ''}</div>
        <p class="small muted" style="margin-bottom:0">הכי פשוט: לעמוד ליד הפס הירוק, ללחוץ ״המיקום שלי עכשיו״ ואז ״שמירת הגדרות״.${!s.geoLat ? ' <b>כל עוד לא הוגדר מיקום, הבדיקה לא פעילה.</b>' : ''}</p>
      </div>
      <button class="btn green block" data-a="save-settings">${ic('check')} שמירת הגדרות</button>
      <div class="section-label">חברי ועד</div>
      <div class="card"><div class="list">${Store.committee.map((c) => `<div class="row clickable" data-a="committee-edit" data-id="${c.id}">${avatar(c, true)}<div class="who"><b>${esc(c.name)}${c.id === Store.session().cid ? ' (את/ה)' : ''}</b><span dir="ltr">${esc(c.phone)}</span></div>${Store.mode === 'firebase' ? (c.uid ? '<span class="chip st-done">מחובר/ת</span>' : '<span class="chip st-pending">לא נכנס/ה</span>') : ''}</div>`).join('')}</div>
        <button class="btn ghost sm" data-a="committee-edit" style="margin-top:10px">${ic('plus')} הוספת חבר/ת ועד</button></div>
      <div class="section-label">גיבוי נתונים</div>
      <div class="card"><p class="small muted mt0">${Store.mode === 'firebase' ? 'הנתונים נשמרים בענן (Firebase). אפשר להוריד עותק לגיבוי.' : 'גרסת הדגמה: הנתונים נשמרים רק במכשיר הזה.'}</p>
        <div class="btn-row"><button class="btn ghost sm" data-a="backup">${ic('download')} הורדת גיבוי</button>
        ${Store.mode === 'local' ? `<label class="btn ghost sm">${ic('upload')} שחזור מגיבוי<input type="file" accept=".json,application/json" id="restore" hidden></label>
        <button class="btn red sm" data-a="reset">${ic('trash')} איפוס לנתוני הדגמה</button>` : ''}</div></div>
      <div class="section-label">יומן פעולות</div>
      <div class="card" style="max-height:320px;overflow:auto">${Store.log.map((l) => `<div class="log-row"><time>${new Date(l.t).toLocaleString('he-IL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}</time><div><b>${esc(l.action)}</b> · ${esc(l.detail)} <span class="muted">(${esc(l.who)})</span></div></div>`).join('') || '<div class="empty">ריק</div>'}</div>`;
  }

  /* ---------- admin modals ---------- */
  function dayModal(d) {
    let sel = [...Store.team(d)];
    const isPast = d <= today();
    const draw = (root) => {
      const q = root.querySelector('#dq').value.trim();
      const ps = Store.parents.filter((p) => p.active || sel.includes(p.id)).filter((p) => !q || p.name.includes(q) || (p.child || '').includes(q));
      ps.sort((a, b) => (sel.includes(b.id) - sel.includes(a.id)));
      root.querySelector('#dlist').innerHTML = ps.map((p) => `<button class="pick ${sel.includes(p.id) ? 'on' : ''}" data-id="${p.id}">
        ${avatar(p, true)}<div class="who"><b>${esc(p.name)}</b><span>${Store.shiftsOf(p.id).filter((x) => x >= today()).length} משמרות עתידיות</span></div>
        <div class="check">${sel.includes(p.id) ? ic('check') : ''}</div></button>`).join('');
      root.querySelector('#dcount').textContent = `${sel.length}/${Store.settings.perShift}`;
    };
    openModal(`<h2>${fmtLong(d)}</h2>
      <div class="card"><div class="card-title"><h3>שיבוץ</h3><span class="chip st-future" id="dcount"></span></div>
        <div class="search">${ic('search')}<input class="input" id="dq" placeholder="חיפוש הורה"></div>
        <div class="picker" id="dlist"></div></div>
      ${isPast && sel.length ? `<div class="card"><div class="card-title"><h3>נוכחות</h3></div><div class="list">${sel.map((id) => `<div class="row clickable" data-rec="${id}">${avatar(Store.parent(id), true)}<div class="who"><b>${esc(Store.parent(id)?.name)}</b></div>${chip(Store.status(d, id), Store.isLate(d, id))}<span class="muted">${ic('edit', 'style="width:16px;height:16px"')}</span></div>`).join('')}</div></div>` : ''}
      <div class="btn-row"><button class="btn green" id="dsave" style="flex:1">${ic('check')} שמירה</button><button class="btn ghost" data-dismiss>ביטול</button></div>`, (root) => {
      draw(root);
      root.querySelector('#dq').oninput = () => draw(root);
      root.querySelector('#dlist').onclick = (e) => {
        const b = e.target.closest('.pick'); if (!b) return;
        const id = b.dataset.id;
        sel = sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id];
        draw(root);
      };
      root.querySelectorAll('[data-rec]').forEach((el) => { el.onclick = () => recModal(d, el.dataset.rec); });
      root.querySelector('#dsave').onclick = () => { Store.setTeam(d, sel); closeModal(); toast('השיבוץ נשמר', 'ok'); };
    });
  }

  function recModal(d, id) {
    const p = Store.parent(id);
    const r = Store.rec(d, id) || {};
    const mode = r.status || 'auto';
    openModal(`<h2>${esc(p?.name)} · ${fmtDM(d)}</h2>
      <div class="card">
        <label class="field"><span>סטטוס</span><select class="input" id="rs">
          <option value="present" ${mode === 'present' ? 'selected' : ''}>נכח/ה</option>
          <option value="absent" ${mode === 'absent' ? 'selected' : ''}>לא הגיע/ה</option>
          <option value="excused" ${mode === 'excused' ? 'selected' : ''}>מוצדק (החלפה/מחלה)</option>
          <option value="auto" ${mode === 'auto' ? 'selected' : ''}>ללא דיווח</option>
        </select></label>
        <div class="grid2" id="rtimes">
          <label class="field"><span>כניסה</span><input class="input" type="time" id="rin" value="${esc(r.in || '')}"></label>
          <label class="field"><span>יציאה</span><input class="input" type="time" id="rout" value="${esc(r.out || '')}"></label>
        </div>
        <label class="field"><span>הערה</span><input class="input" id="rnote" value="${esc(r.note || '')}" placeholder="לדוגמה: הוחלף/ה ע״י..."></label>
        ${r.by ? `<div class="small muted">דווח ע״י: ${r.by === 'admin' ? 'הועד' : 'ההורה'}</div>` : ''}
      </div>
      <div class="btn-row"><button class="btn green" id="rsave" style="flex:1">${ic('check')} שמירה</button><button class="btn ghost" data-dismiss>ביטול</button></div>`, (root) => {
      const sync = () => { root.querySelector('#rtimes').style.display = root.querySelector('#rs').value === 'present' ? '' : 'none'; };
      root.querySelector('#rs').onchange = () => {
        if (root.querySelector('#rs').value === 'present' && !root.querySelector('#rin').value) root.querySelector('#rin').value = Store.settings.shiftStart;
        sync();
      };
      sync();
      root.querySelector('#rsave').onclick = () => {
        const s = root.querySelector('#rs').value;
        const note = root.querySelector('#rnote').value.trim();
        if (s === 'auto') Store.setRec(d, id, note ? { status: 'none', note } : null, 'admin');
        else if (s === 'present') {
          const inn = root.querySelector('#rin').value;
          if (!inn) { toast('יש להזין שעת כניסה', 'err'); return; }
          Store.setRec(d, id, { status: 'present', in: inn, out: root.querySelector('#rout').value, note }, 'admin');
        } else Store.setRec(d, id, { status: s, note }, 'admin');
        closeModal(); toast('הנוכחות עודכנה', 'ok');
      };
    });
  }

  function parentModal(id) {
    const p = id ? { ...Store.parent(id) } : { name: '', phone: '', child: '', cls: '', active: true };
    openModal(`<h2>${id ? 'עריכת הורה' : 'הורה חדש'}</h2>
      <div class="card">
        <label class="field"><span>שם ההורה *</span><input class="input" id="fn" value="${esc(p.name)}"></label>
        <label class="field"><span>טלפון * (משמש לכניסה)</span><input class="input" id="fp" type="tel" inputmode="tel" value="${esc(p.phone)}"></label>
        <div class="grid2">
          <label class="field"><span>שם הילד/ה</span><input class="input" id="fc" value="${esc(p.child)}"></label>
          <label class="field"><span>כיתה</span><input class="input" id="fk" value="${esc(p.cls)}"></label>
        </div>
        <label class="pick ${p.active ? 'on' : ''}" id="fact" style="cursor:pointer"><div class="check">${p.active ? ic('check') : ''}</div><div class="who"><b>פעיל/ה</b><span>משתתף/ת בשיבוץ האוטומטי</span></div></label>
      </div>
      ${id ? codeCard('parent', id) + `<p class="small muted">${Store.shiftsOf(id).length} משמרות בסך הכל השנה</p>` : '<p class="small muted">אחרי השמירה ייווצר קוד אישי שאפשר לשלוח להורה בוואטסאפ.</p>'}
      <div class="btn-row"><button class="btn green" id="fsave" style="flex:1">${ic('check')} שמירה</button>
      ${id ? `<button class="btn red" id="fdel" aria-label="מחיקה">${ic('trash')}</button>` : ''}<button class="btn ghost" data-dismiss>ביטול</button></div>`, (root) => {
      if (id) mountCodeCard(root, 'parent', id, parentModal);
      const act = root.querySelector('#fact');
      act.onclick = () => { p.active = !p.active; act.classList.toggle('on', p.active); act.querySelector('.check').innerHTML = p.active ? ic('check') : ''; };
      root.querySelector('#fsave').onclick = async () => {
        const name = root.querySelector('#fn').value.trim();
        const phone = Store.util.normPhone(root.querySelector('#fp').value);
        if (!name) { toast('נא להזין שם', 'err'); return; }
        if (phone.length < 9) { toast('נא להזין טלפון תקין', 'err'); return; }
        if (Store.parents.some((x) => x.id !== id && Store.util.normPhone(x.phone) === phone)) { toast('כבר יש הורה עם הטלפון הזה', 'err'); return; }
        const saved = await Store.saveParent({ id: p.id, name, phone, child: root.querySelector('#fc').value.trim(), cls: root.querySelector('#fk').value.trim(), active: p.active });
        toast('נשמר', 'ok');
        if (!id) parentModal(saved.id); else closeModal();
      };
      const del = root.querySelector('#fdel');
      if (del) del.onclick = () => askConfirm(`למחוק את ${p.name}? ההורה יוסר גם מכל השיבוצים.`, 'מחיקה', async () => { await Store.removeParent(id); toast('ההורה נמחק'); });
    });
  }

  /* ---------- import from Excel / CSV / pasted text ---------- */
  const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  function rowsToParents(rows) {
    rows = rows.map((r) => r.map((c) => String(c ?? '').trim())).filter((r) => r.some(Boolean));
    if (!rows.length) return [];
    // find columns by header names; otherwise assume name, phone, child, class
    const h = rows[0];
    const col = (re) => h.findIndex((c) => re.test(c));
    let idx = { name: col(/שם.*(הורה|מלא)|^שם$|^הורה/), phone: col(/טל|נייד|פלאפון|phone/i), child: col(/ילד|תלמיד|בן|בת/), cls: col(/כית|class/i) };
    const hasHeader = idx.phone >= 0 && idx.name >= 0;
    if (!hasHeader) idx = { name: 0, phone: 1, child: 2, cls: 3 };
    else if (idx.child === idx.name) idx.child = -1;
    return rows.slice(hasHeader ? 1 : 0).map((r) => ({
      name: r[idx.name] || '', phone: Store.util.normPhone(r[idx.phone]), child: idx.child >= 0 ? r[idx.child] || '' : '', cls: idx.cls >= 0 ? r[idx.cls] || '' : ''
    }));
  }
  function importModal() {
    let parsed = [];
    openModal(`<h2>ייבוא רשימת הורים</h2>
      <div class="card">
        <label class="btn ghost block">${ic('upload')} בחירת קובץ אקסל / CSV<input type="file" id="impf" accept=".xlsx,.xls,.csv" hidden></label>
        <p class="small muted">עמודות: <b>שם ההורה, טלפון, שם הילד/ה, כיתה</b>. שורת כותרות תזוהה אוטומטית.</p>
        <label class="field" style="margin-bottom:0"><span>או הדביקו שורות (מאקסל או מופרדות בפסיקים)</span><textarea class="input" id="imp" rows="5" placeholder="רונית כהן, 050-1234567, נועם, ב׳2"></textarea></label>
      </div>
      <div id="impprev"></div>
      <div class="btn-row"><button class="btn green" id="impgo" style="flex:1" disabled>${ic('upload')} ייבוא</button><button class="btn ghost" data-dismiss>ביטול</button></div>`, (root) => {
      const prev = root.querySelector('#impprev'), go = root.querySelector('#impgo');
      const show = (rows) => {
        const existing = new Set(Store.parents.map((x) => Store.util.normPhone(x.phone)));
        const seen = new Set();
        parsed = [];
        let bad = 0, dup = 0;
        rows.forEach((r) => {
          if (!r.name || r.phone.length < 9) { bad++; return; }
          if (existing.has(r.phone) || seen.has(r.phone)) { dup++; return; }
          seen.add(r.phone); parsed.push(r);
        });
        go.disabled = !parsed.length;
        go.innerHTML = `${ic('upload')} ייבוא ${parsed.length} הורים`;
        prev.innerHTML = `<div class="card"><div class="card-title"><h3>תצוגה מקדימה</h3><span class="chip st-done">${parsed.length} תקינים</span></div>
          ${bad || dup ? `<p class="small muted mt0">${bad ? `${bad} שורות בלי שם או טלפון תקין ידולגו. ` : ''}${dup ? `${dup} טלפונים כבר קיימים ידולגו.` : ''}</p>` : ''}
          <div class="table-wrap"><table class="t"><thead><tr><th>שם</th><th>טלפון</th><th>ילד/ה</th><th>כיתה</th></tr></thead><tbody>
          ${parsed.slice(0, 8).map((r) => `<tr><td>${esc(r.name)}</td><td dir="ltr">${esc(r.phone)}</td><td>${esc(r.child)}</td><td>${esc(r.cls)}</td></tr>`).join('')}
          </tbody></table></div>${parsed.length > 8 ? `<p class="small muted center" style="margin-bottom:0">ועוד ${parsed.length - 8}…</p>` : ''}</div>`;
      };
      root.querySelector('#imp').oninput = (e) => show(rowsToParents(e.target.value.split(/\r?\n/).map((l) => l.split(/\t|,/))));
      root.querySelector('#impf').onchange = async (e) => {
        const f = e.target.files[0]; if (!f) return;
        try {
          if (/\.csv$/i.test(f.name)) {
            show(rowsToParents((await f.text()).replace(/^﻿/, '').split(/\r?\n/).map((l) => l.split(/,|\t/).map((c) => c.replace(/^"|"$/g, '')))));
          } else {
            if (!window.XLSX) await new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = XLSX_URL; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); });
            const wb = XLSX.read(await f.arrayBuffer());
            show(rowsToParents(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false })));
          }
        } catch (x) { console.error(x); toast('לא הצלחנו לקרוא את הקובץ', 'err'); }
      };
      go.onclick = async () => {
        go.disabled = true; go.textContent = 'מייבא…';
        await Store.importParents(parsed);
        closeModal(); toast(`יובאו ${parsed.length} הורים. הקודים האישיים מוכנים לשליחה`, 'ok');
      };
    });
  }

  function autoModal() {
    const t = today();
    const m = viewState.month || t.slice(0, 8) + '01';
    const f = m < t ? t : m;
    const last = (() => { const x = parseDate(m); return isoDate(new Date(x.getFullYear(), x.getMonth() + 1, 0)); })();
    openModal(`<h2>שיבוץ אוטומטי</h2>
      <p class="small muted mt0">הורים פעילים ישובצו בסבב הוגן (${Store.settings.perShift} בכל יום), בהמשך לסבב הקודם.</p>
      <div class="card"><div class="grid2">
        <label class="field"><span>מתאריך</span><input class="input" type="date" id="af" value="${f}"></label>
        <label class="field"><span>עד תאריך</span><input class="input" type="date" id="at" value="${last}"></label>
      </div>
      <label class="pick" id="aov" style="cursor:pointer"><div class="check"></div><div class="who"><b>לדרוס שיבוצים קיימים</b><span>אחרת ימים שכבר שובצו יישארו כפי שהם</span></div></label></div>
      <div class="btn-row"><button class="btn green" id="ago" style="flex:1">${ic('bolt')} שבצו לי!</button><button class="btn ghost" data-dismiss>ביטול</button></div>`, (root) => {
      let ov = false;
      const el = root.querySelector('#aov');
      el.onclick = () => { ov = !ov; el.classList.toggle('on', ov); el.querySelector('.check').innerHTML = ov ? ic('check') : ''; };
      root.querySelector('#ago').onclick = async () => {
        const from = root.querySelector('#af').value, to = root.querySelector('#at').value;
        if (!from || !to || from > to) { toast('טווח תאריכים לא תקין', 'err'); return; }
        const n = await Store.rotate(from, to, ov); closeModal(); toast(`שובצו ${n} ימים ✨`, 'ok');
      };
    });
  }


  function pushNudge() {
    if (Store.mode !== 'firebase' || !(self.NV_CONFIG || {}).vapidKey || !('Notification' in window) || Notification.permission !== 'default') return '';
    return `<div class="card notice split"><div style="flex:1;min-width:0"><b>🔔 תזכורת יום לפני המשמרת</b><div class="small">נשלח לך התראה בערב שלפני.</div></div><button class="btn yellow sm" data-a="push">הפעלה</button></div>`;
  }
  function requestsCard() {
    const open = Store.requests.filter((r) => r.status === 'open');
    if (!open.length) return '';
    return `<div class="section-label">בקשות החלפה</div><div class="card"><div class="list">${open.map((r) => {
      const q = Store.parent(r.pid);
      return `<div class="row">${q ? avatar(q, true) : ''}<div class="who"><b>${esc(q ? q.name : '—')}</b><span>${fmtLong(r.date)}${r.note ? ' · ' + esc(r.note) : ''}</span></div>
        <div class="btn-row" style="flex-wrap:nowrap"><button class="btn ghost sm" data-a="day" data-d="${r.date}">${ic('swap')} שיבוץ</button><button class="btn green sm" data-a="req-done" data-id="${r.id}" aria-label="טופל">${ic('check')}</button></div></div>`;
    }).join('')}</div></div>`;
  }
  function remindersCard() {
    let d = addDays(today(), 1);
    for (let i = 0; i < 7 && !isSchoolDay(d); i++) d = addDays(d, 1);
    const team = Store.team(d).map(Store.parent).filter(Boolean);
    if (!team.length) return '';
    const set = Store.settings;
    const msg = (q) => `שלום ${first(q.name)}! 🚗\nתזכורת: ${d === addDays(today(), 1) ? 'מחר' : 'ב' + fmtLong(d)} את/ה במשמרת ״נשק וסע״ בפס הירוק, ${set.shiftStart}–${set.shiftEnd}.\nאל תשכח/י ללחוץ ״הגעתי!״ באפליקציה: ${appUrl()}\nתודה! 💚`;
    return `<div class="section-label">תזכורות</div><div class="card"><div class="card-title"><h3>במשמרת ${d === addDays(today(), 1) ? 'מחר' : fmtLong(d)}</h3><span class="small muted">שליחה ידנית בוואטסאפ</span></div>
      <div class="list">${team.map((q) => `<div class="row">${avatar(q, true)}<div class="who"><b>${esc(q.name)}</b><span dir="ltr">${esc(q.phone)}</span></div><a class="btn green sm" target="_blank" rel="noopener" href="${waLink(q.phone, msg(q))}">תזכורת בוואטסאפ</a></div>`).join('')}</div></div>`;
  }

  /* ---------- location check ---------- */
  const getPosition = () => new Promise((res, rej) => {
    if (!navigator.geolocation) return rej({ code: 2 });
    navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  });
  async function verifyLocation() {
    const st = Store.settings;
    if (st.geoMode === 'off' || st.geoLat == null || st.geoLat === '' || st.geoLng == null || st.geoLng === '') return { ok: true, rec: {} };
    try {
      const pos = await getPosition();
      const dist = Math.round(Store.util.haversine(pos.coords.latitude, pos.coords.longitude, +st.geoLat, +st.geoLng));
      // forgive part of the GPS error margin, but never more than 150 m
      const near = dist - Math.min(pos.coords.accuracy || 0, 150) <= +st.geoRadius;
      if (near) return { ok: true, rec: { geoOk: true, geoDist: dist } };
      return st.geoMode === 'block' ? { ok: false, reason: 'far', dist } : { ok: true, rec: { geoOk: false, geoDist: dist } };
    } catch (err) {
      const reason = err && err.code === 1 ? 'denied' : 'unavailable';
      return st.geoMode === 'block' ? { ok: false, reason } : { ok: true, rec: { geoOk: false, geoDist: null } };
    }
  }
  function locationProblem(g) {
    const body = {
      far: `<p>לפי המיקום שלך את/ה במרחק <b>${g.dist >= 1000 ? (g.dist / 1000).toFixed(1) + ' ק״מ' : g.dist + ' מ׳'}</b> מבית הספר.</p><p class="small muted">אפשר לסמן הגעה רק ליד הפס הירוק. אם את/ה כבר שם, חכו כמה שניות שה-GPS יתייצב ונסו שוב.</p>`,
      denied: `<p>כדי לאמת שהגעת לפס הירוק, האפליקציה צריכה גישה למיקום.</p>
        <div class="small"><b>אייפון:</b> הגדרות ← פרטיות ואבטחה ← שירותי מיקום ← Safari ← ״בזמן השימוש״.<br><b>אנדרואיד:</b> לחצו על סמל המנעול ליד הכתובת ← הרשאות ← מיקום ← ״אפשר״.</div>`,
      unavailable: '<p>לא הצלחנו לאתר את המיקום שלך.</p><p class="small muted">ודאו שה-GPS (שירותי מיקום) פועל בטלפון ונסו שוב.</p>'
    }[g.reason];
    openModal(`<h2>${g.reason === 'far' ? '📍 את/ה עדיין לא בפס' : '📍 צריך גישה למיקום'}</h2><div class="card">${body}</div>
      <div class="btn-row"><button class="btn green" data-a="checkin" data-dismiss style="flex:1">${ic('car')} לנסות שוב</button><button class="btn ghost" data-dismiss>סגירה</button></div>
      <p class="small muted center">לא מסתדר? הועד יכול לסמן את ההגעה שלך ידנית.</p>`);
  }
  const geoChip = (r) => !r || r.geoOk === undefined ? '' : r.geoOk
    ? `<span class="chip st-done" title="מיקום אומת">📍 ${r.geoDist != null ? r.geoDist + ' מ׳' : 'אומת'}</span>`
    : `<span class="chip st-late" title="ההגעה לא אומתה במיקום">📍 לא אומת${r.geoDist != null ? ' · ' + r.geoDist + ' מ׳' : ''}</span>`;

  /* ---------- WhatsApp helpers ---------- */
  const appUrl = () => location.origin + location.pathname;
  const waLink = (phone, text) => `https://wa.me/${phone ? '972' + Store.util.normPhone(phone).replace(/^0/, '') : ''}?text=${encodeURIComponent(text)}`;
  function codeMessage(kind, id) {
    const p = kind === 'admin' ? Store.committee.find((c) => c.id === id) : Store.parent(id);
    return `שלום ${p ? first(p.name) : ''}! 🚗💚\n${kind === 'admin' ? 'נוספת כחבר/ת ועד' : 'הצטרפת למיזם'} "נשק וסע" של בית הספר ${Store.settings.schoolName}.\n\nכניסה לאפליקציה: ${appUrl()}\nטלפון: ${p ? p.phone : ''}\nקוד אישי: ${Store.codeOf(id)}\n\nמומלץ להתקין את האפליקציה על מסך הבית. סע לשלום = חיים!`;
  }
  function codeCard(kind, id) {
    const p = kind === 'admin' ? Store.committee.find((c) => c.id === id) : Store.parent(id);
    const code = Store.codeOf(id);
    const signed = p && p.uid;
    return `<div class="card code-card">
      <div class="card-title"><h3>קוד אישי</h3>${Store.mode === 'firebase' ? `<span class="chip ${signed ? 'st-done' : 'st-pending'}">${signed ? 'נכנס/ה לאפליקציה' : 'עוד לא נכנס/ה'}</span>` : ''}</div>
      <div class="code-big" dir="ltr">${esc(code || '——')}</div>
      <div class="btn-row">
        <button class="btn green sm" data-a="wa-code" data-kind="${kind}" data-id="${id}" data-phone="${esc(p ? p.phone : '')}">שליחה בוואטסאפ</button>
        <button class="btn ghost sm" id="newcode">${ic('swap')} קוד חדש</button>
      </div>
      <p class="small muted" style="margin-bottom:0">קוד חדש מבטל את הקודם, וצריך להיכנס איתו מחדש.</p>
    </div>`;
  }
  function mountCodeCard(root, kind, id, reopen) {
    const b = root.querySelector('#newcode');
    if (b) b.onclick = () => askConfirm('ליצור קוד אישי חדש? הקוד הקודם יפסיק לעבוד.', 'יצירת קוד חדש', async () => {
      await Store.resetCode(kind, id); toast('נוצר קוד חדש', 'ok'); reopen(id);
    });
  }

  /* ---------- swap request (parent → committee) ---------- */
  function swapModal(pid, date) {
    const t = today();
    const future = Store.shiftsOf(pid).filter((d) => d >= t);
    if (!future.length) { toast('אין משמרות עתידיות'); return; }
    const set = Store.settings;
    openModal(`<h2>בקשת החלפה</h2>
      <p class="small muted mt0">הבקשה תגיע לוועד ההורים, והם ידאגו למחליף/ה ויעדכנו את הלוח.</p>
      <div class="card">
        <label class="field"><span>איזו משמרת?</span><select class="input" id="sw-d">${future.map((d) => `<option value="${d}" ${d === date ? 'selected' : ''}>${fmtLong(d)}</option>`).join('')}</select></label>
        <label class="field" style="margin-bottom:0"><span>הערה לוועד (לא חובה)</span><textarea class="input" id="sw-n" rows="3" placeholder="לדוגמה: אני בחו״ל באותו שבוע"></textarea></label>
      </div>
      <div class="btn-row"><button class="btn green" id="sw-go" style="flex:1">${ic('swap')} שליחת הבקשה</button><button class="btn ghost" data-dismiss>ביטול</button></div>
      ${set.committeePhone ? `<p class="small muted center">דחוף? <a href="${waLink(set.committeePhone, '')}" target="_blank" rel="noopener">כתבו לוועד בוואטסאפ</a></p>` : ''}`, (root) => {
      root.querySelector('#sw-go').onclick = async () => {
        await Store.requestSwap(pid, root.querySelector('#sw-d').value, root.querySelector('#sw-n').value.trim());
        closeModal(); toast('הבקשה נשלחה לוועד ✔', 'ok');
      };
    });
  }

  /* ---------- committee members ---------- */
  function committeeModal(id) {
    const c = id ? { ...Store.committee.find((x) => x.id === id) } : { name: '', phone: '' };
    const me = Store.session();
    openModal(`<h2>${id ? 'חבר/ת ועד' : 'חבר/ת ועד חדש/ה'}</h2>
      <div class="card">
        <label class="field"><span>שם מלא *</span><input class="input" id="cn" value="${esc(c.name)}"></label>
        <label class="field" style="margin-bottom:0"><span>טלפון *</span><input class="input" id="cp" type="tel" inputmode="tel" value="${esc(c.phone)}"></label>
      </div>
      ${id ? codeCard('admin', id) : '<p class="small muted">אחרי השמירה ייווצר קוד אישי שאפשר לשלוח בוואטסאפ.</p>'}
      <div class="btn-row"><button class="btn green" id="csave" style="flex:1">${ic('check')} שמירה</button>
      ${id && id !== me.cid ? `<button class="btn red" id="cdel" aria-label="הסרה">${ic('trash')}</button>` : ''}<button class="btn ghost" data-dismiss>ביטול</button></div>`, (root) => {
      if (id) mountCodeCard(root, 'admin', id, committeeModal);
      root.querySelector('#csave').onclick = async () => {
        c.name = root.querySelector('#cn').value.trim();
        c.phone = root.querySelector('#cp').value.trim();
        if (!c.name || Store.util.normPhone(c.phone).length < 9) { toast('נא למלא שם וטלפון תקין', 'err'); return; }
        const isNew = !id;
        const saved = await Store.saveCommittee({ id: c.id, name: c.name, phone: c.phone });
        toast('נשמר', 'ok');
        if (isNew) committeeModal(saved.id); else closeModal();
      };
      const del = root.querySelector('#cdel');
      if (del) del.onclick = () => askConfirm(`להסיר את ${c.name} מהוועד? הגישה שלו/ה לממשק הועד תיחסם מיד.`, 'הסרה', async () => { await Store.removeCommittee(id); toast('הוסר/ה מהוועד'); });
    });
  }

  /* ---------- ICS calendar export ---------- */
  function exportICS(pid) {
    const s = Store.settings;
    const t = today();
    const ds = Store.shiftsOf(pid).filter((d) => d >= t);
    if (!ds.length) { toast('אין משמרות עתידיות'); return; }
    const hm = (x) => x.replace(':', '') + '00';
    const ev = ds.map((d) => {
      const day = d.replace(/-/g, '');
      const partners = Store.team(d).filter((x) => x !== pid).map((x) => Store.parent(x)?.name).join(', ');
      return ['BEGIN:VEVENT', `UID:nv-${d}-${pid}@neshek-vase`, `DTSTAMP:${day}T000000`,
        `DTSTART;TZID=Asia/Jerusalem:${day}T${hm(s.shiftStart)}`, `DTEND;TZID=Asia/Jerusalem:${day}T${hm(s.shiftEnd)}`,
        `SUMMARY:משמרת נשק וסע 🚗`, `DESCRIPTION:פס ההורדה – ${s.schoolName}${partners ? '. יחד עם ' + partners : ''}`,
        `LOCATION:בית הספר ${s.schoolName}`,
        'BEGIN:VALARM', 'TRIGGER:-PT12H', 'ACTION:DISPLAY', 'DESCRIPTION:מחר משמרת נשק וסע', 'END:VALARM',
        'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:עוד חצי שעה משמרת נשק וסע', 'END:VALARM',
        'END:VEVENT'].join('\r\n');
    });
    download('neshek-vase.ics', ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//neshek-vase//HE', 'CALSCALE:GREGORIAN', ...ev, 'END:VCALENDAR'].join('\r\n'), 'text/calendar');
    toast(`${ds.length} משמרות נוספו לקובץ היומן`, 'ok');
  }

  /* ---------- global click handling ---------- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a]');
    if (!el || el.closest('#modal-root') && !el.closest('.modal')) return;
    const a = el.dataset.a, v = el.dataset.v, s = Store.session();
    const act = {
      'demo-login': () => { document.getElementById('lphone').value = el.dataset.phone; document.getElementById('lcode').value = '123456'; document.getElementById('lform').requestSubmit(); },
      logout: async () => { closeModal(); viewState = {}; await Store.logout(); go('login'); },
      install: async () => {
        if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; render(); }
        else installHelp();
      },
      'hide-install': () => { try { localStorage.setItem('nv-hide-install', '1'); } catch (x) { /* ignore */ } render(); },
      checkin: async () => {
        if (el.disabled) return;
        el.disabled = true;
        const small = el.querySelector('small'); if (small) small.textContent = 'בודק מיקום…';
        const geo = await verifyLocation();
        if (!geo.ok) { el.disabled = false; if (small) small.textContent = 'סימון כניסה'; return locationProblem(geo); }
        await Store.checkIn(today(), s.pid, geo.rec);
        navigator.vibrate && navigator.vibrate(60); confetti();
        toast(Store.isLate(today(), s.pid) ? 'נרשמה כניסה – תודה שהגעת!' : 'נרשמה כניסה – משמרת מוצלחת! 💪', 'ok');
      },
      'swap-req': () => swapModal(s.pid, el.dataset.d),
      'req-done': () => Store.resolveRequest(el.dataset.id).then(() => toast('הבקשה סומנה כטופלה', 'ok')),
      push: async () => {
        try { await Store.enablePush(); toast('התראות הופעלו 🔔', 'ok'); try { localStorage.setItem('nv-push', '1'); } catch (x) { /* ignore */ } render(); }
        catch (x) {
          const m = { 'push-demo': 'התראות זמינות רק בגרסה המחוברת', 'push-not-configured': 'הועד עוד לא הגדיר התראות', 'push-denied': 'ההתראות נחסמו. אפשר להפעיל אותן בהגדרות הדפדפן', 'push-unsupported': isIOS() ? 'באייפון: התקינו קודם את האפליקציה למסך הבית' : 'הדפדפן לא תומך בהתראות' };
          toast(m[x.message] || 'הפעלת ההתראות נכשלה', 'err');
        }
      },
      'wa-code': () => window.open(waLink(el.dataset.phone, codeMessage(el.dataset.kind, el.dataset.id)), '_blank', 'noopener'),
      'committee-edit': () => committeeModal(el.dataset.id),
      'geo-here': async () => {
        try {
          const pos = await getPosition();
          document.getElementById('gLat').value = pos.coords.latitude.toFixed(6);
          document.getElementById('gLng').value = pos.coords.longitude.toFixed(6);
          toast(`המיקום נקלט (דיוק ${Math.round(pos.coords.accuracy)} מ׳). לחצו שמירה`, 'ok');
        } catch (x) { toast('לא הצלחנו לקבל מיקום. אשרו גישה למיקום ונסו שוב', 'err'); }
      },
      checkout: () => { Store.checkOut(today(), s.pid); navigator.vibrate && navigator.vibrate([40, 40, 80]); confetti(); toast('תודה! הצלת חיים היום 💚', 'ok'); },
      ics: () => exportICS(s.pid),
      week: () => { viewState.week = +v === 0 ? null : addDays(viewState.week || weekStart(today()), +v); render(); },
      'board-day': () => {
        if (+v === 0) { viewState.boardDate = null; return render(); }
        let d = viewState.boardDate || today();
        do { d = addDays(d, +v); } while (!isSchoolDay(d) && Store.settings.schoolDays.length);
        viewState.boardDate = d; render();
      },
      'adm-in': () => { Store.setRec(el.dataset.d, el.dataset.id, { status: 'present', in: el.dataset.d === today() ? nowHM() : Store.settings.shiftStart, out: '' }, 'admin'); toast('נרשמה כניסה', 'ok'); },
      'adm-out': () => { const r = Store.rec(el.dataset.d, el.dataset.id); Store.setRec(el.dataset.d, el.dataset.id, { ...r, out: el.dataset.d === today() ? nowHM() : Store.settings.shiftEnd }, 'admin'); toast('נרשמה יציאה', 'ok'); },
      'edit-rec': () => recModal(el.dataset.d, el.dataset.id),
      day: () => dayModal(el.dataset.d),
      month: () => { viewState.month = v; render(); },
      auto: () => autoModal(),
      'clear-month': () => {
        const x = parseDate(v); const last = isoDate(new Date(x.getFullYear(), x.getMonth() + 1, 0));
        const from = v < today() ? addDays(today(), 1) : v;
        askConfirm(`לנקות את כל השיבוצים מ-${fmtFull(from)} עד ${fmtFull(last)}?`, 'ניקוי', () => { Store.clearRange(from, last); toast('השיבוצים נוקו'); });
      },
      'parent-edit': () => parentModal(el.dataset.id),
      'parent-import': () => importModal(),
      rsort: () => { e.preventDefault(); viewState.rSort = v; render(); },
      'csv-summary': () => {
        const { from, to, per } = reportData();
        download(`neshek-vase-summary_${from}_${to}.csv`, toCSV([['הורה', 'טלפון', 'ילד/ה', 'כיתה', 'שובץ', 'נכח', 'נעדר', 'מוצדק', 'איחורים', 'דקות', 'אחוז התייצבות'],
          ...per.map((o) => { const p = Store.parent(o.id) || {}; return [p.name, p.phone, p.child, p.cls, o.assigned, o.done, o.missed, o.excused, o.late, o.mins, (o.assigned ? Math.round((o.done / o.assigned) * 100) : 0) + '%']; })]), 'text/csv;charset=utf-8');
      },
      'csv-records': () => {
        const { from, to, records } = reportData();
        download(`neshek-vase-records_${from}_${to}.csv`, toCSV([['תאריך', 'יום', 'הורה', 'סטטוס', 'כניסה', 'יציאה', 'דקות', 'איחור', 'הערה', 'דווח ע״י'],
          ...records.map((x) => [fmtFull(x.d), DOW_LONG[dow(x.d)], Store.parent(x.id)?.name, STATUS[x.st], x.r.in || '', x.r.out || '', Store.minutes(x.d, x.id), Store.isLate(x.d, x.id) ? 'כן' : '', x.r.note || '', x.r.by === 'admin' ? 'ועד' : x.r.by ? 'הורה' : ''])]), 'text/csv;charset=utf-8');
      },
      'save-settings': async () => {
        const g = (id) => document.getElementById(id).value;
        const days = [...document.querySelectorAll('.sDay:checked')].map((x) => +x.value);
        if (g('sStart') >= g('sEnd')) { toast('שעת הסיום חייבת להיות אחרי ההתחלה', 'err'); return; }
        const lat = g('gLat').trim(), lng = g('gLng').trim();
        if ((lat || lng) && (isNaN(+lat) || isNaN(+lng) || !lat || !lng)) { toast('קואורדינטות לא תקינות', 'err'); return; }
        await Store.saveSettings({
          shiftStart: g('sStart'), shiftEnd: g('sEnd'), perShift: Math.max(1, +g('sPer') || 2), lateGraceMin: Math.max(0, +g('sGrace') || 0),
          schoolDays: days, schoolName: g('sSchool').trim() || 'מישור הנוף', committeePhone: g('sPhone').trim(),
          geoMode: g('gMode'), geoLat: lat ? +lat : null, geoLng: lng ? +lng : null, geoRadius: Math.max(30, +g('gRad') || 200)
        });
        viewState.dirty = false;
        toast('ההגדרות נשמרו', 'ok');
        render();
      },
      'csv-codes': () => download(`neshek-vase-codes_${today()}.csv`, toCSV([['שם', 'טלפון', 'ילד/ה', 'כיתה', 'קוד אישי', 'נכנס/ה לאפליקציה'],
        ...Store.parents.filter((p) => p.active).map((p) => [p.name, p.phone, p.child, p.cls, Store.codeOf(p.id), p.uid ? 'כן' : ''])]), 'text/csv;charset=utf-8'),
      backup: () => download(`neshek-vase-backup_${today()}.json`, Store.exportJSON(), 'application/json'),
      reset: () => askConfirm('לאפס את כל הנתונים לנתוני הדגמה? פעולה זו אינה הפיכה.', 'איפוס', () => { Store.resetDemo(); toast('הנתונים אופסו'); })
    };
    if (act[a]) act[a]();
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'pq') {
      viewState.pq = e.target.value; const pos = e.target.selectionStart; render();
      const el = document.getElementById('pq'); el.focus(); el.setSelectionRange(pos, pos);
    }
  });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'rFrom' || e.target.id === 'rTo') { viewState[e.target.id] = e.target.value; render(); }
    if (e.target.id === 'restore' && e.target.files[0]) {
      e.target.files[0].text().then((txt) => {
        try { Store.importJSON(txt); toast('הנתונים שוחזרו', 'ok'); } catch (x) { toast('קובץ לא תקין', 'err'); }
      });
    }
  });

  /* ---------- live timers ---------- */
  function tick() {
    document.querySelectorAll('[data-elapsed]').forEach((el) => {
      const [h, m] = el.dataset.elapsed.split(':').map(Number);
      const start = new Date(); start.setHours(h, m, 0, 0);
      const sec = Math.max(0, Math.floor((Date.now() - start) / 1000));
      el.textContent = `${Math.floor(sec / 60)}:${pad(sec % 60)}`;
    });
    document.querySelectorAll('[data-countdown]').forEach((el) => {
      const target = new Date(el.dataset.countdown);
      const diff = Math.floor((target - Date.now()) / 1000);
      el.textContent = diff > 0
        ? `המשמרת מתחילה בעוד ${diff >= 3600 ? Math.floor(diff / 3600) + ' שע׳ ו-' : ''}${Math.floor((diff % 3600) / 60)}:${pad(diff % 60)} דק׳`
        : 'המשמרת התחילה – לחצו כשאתם בפס 👆';
    });
  }
  setInterval(tick, 1000);

  // Live data can arrive at any moment. Don't redraw over a form someone is editing.
  let pending = false;
  const editing = () => {
    const a = document.activeElement;
    return viewState.dirty || (a && $app.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.id !== 'pq');
  };
  function liveRender() { if (editing()) { pending = true; return; } pending = false; render(); }
  document.addEventListener('focusout', () => setTimeout(() => { if (pending && !editing()) liveRender(); }, 50));
  document.addEventListener('input', (e) => { if (e.target.closest && e.target.closest('#app') && route()[1] === 'settings') viewState.dirty = true; }, true);

  Store.onError((e) => {
    console.error(e);
    toast(e && e.code === 'permission-denied' ? 'אין הרשאה לפעולה הזו' : 'השמירה נכשלה. בדקו את החיבור לאינטרנט', 'err');
  });
  window.addEventListener('hashchange', () => { closeModal(); viewState.dirty = false; render(); });
  // re-render when the app comes back to the foreground (status may have changed)
  document.addEventListener('visibilitychange', () => { if (!document.hidden) liveRender(); });

  $app.innerHTML = `<div class="splash"><img src="icons/icon.svg" alt=""><div class="splash-t"><span class="a">נשק</span> <span class="b">וסע</span></div><div class="spinner"></div></div>`;
  Store.ready.then(() => {
    if (Store.initError) {
      $app.innerHTML = `<div class="login"><div class="card center" style="margin-top:20vh"><h3>לא הצלחנו להתחבר</h3><p class="small muted">בדקו את החיבור לאינטרנט ונסו שוב.</p><button class="btn green" onclick="location.reload()">ניסיון נוסף</button></div></div>`;
      return;
    }
    Store.subscribe(liveRender);
    render();
  });
})();
