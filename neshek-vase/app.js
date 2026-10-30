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
    if (!s || (s.role === 'parent' && !Store.parent(s.pid))) {
      if (s) Store.logout();
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
    const tab = viewState.loginTab || 'parent';
    return `<div class="login">
      <div class="login-hero">
        <img class="logo-big" src="icons/icon.svg" alt="">
        <h1 class="login-title"><span class="a">נשק</span> <span class="b">וסע</span></h1>
        <svg class="login-underline" viewBox="0 0 220 14"><path d="M4 10 Q110 0 216 8" stroke="#f7c51e" stroke-width="6" fill="none" stroke-linecap="round"/></svg>
        <div class="login-sub">מיזם של הנהגת ההורים · בית הספר ״${esc(Store.settings.schoolName)}״</div>
        <div class="login-tag"><span class="brush yellow hand">יחד למען בטחון הילדים שלנו! ♥</span></div>
      </div>
      <div class="tabs">
        <button data-a="login-tab" data-v="parent" class="${tab === 'parent' ? 'on' : ''}">${ic('users')} הורה</button>
        <button data-a="login-tab" data-v="admin" class="${tab === 'admin' ? 'on' : ''}">${ic('shield')} ועד הורים</button>
      </div>
      <div class="card">
        ${tab === 'parent' ? `
          <div class="card-title"><h3>מי את/ה?</h3><span class="small muted">בחרו את שמכם</span></div>
          <div class="search">${ic('search')}<input class="input" id="psearch" placeholder="חיפוש לפי שם הורה או ילד/ה" autocomplete="off"></div>
          <div class="picker" id="plist"></div>
          <div id="pinbox" class="hidden" style="margin-top:12px">
            <label class="field"><span>קוד אישי</span><input class="input pin-input" id="ppin" inputmode="numeric" maxlength="6" type="password"></label>
          </div>
          <button class="btn green block" id="plogin" disabled style="margin-top:12px">${ic('car')} כניסה</button>
        ` : `
          <div class="card-title"><h3>כניסת ועד</h3></div>
          <p class="small muted mt0">מעקב, שיבוץ ועריכה – לחברי הועד בלבד.</p>
          <label class="field"><span>קוד ועד</span><input class="input pin-input" id="acode" inputmode="numeric" type="password" maxlength="8" autocomplete="off"></label>
          <button class="btn block" id="alogin">${ic('shield')} כניסה לממשק הועד</button>
          <p class="small muted center" style="margin-bottom:0">גרסת הדגמה: הקוד הוא <b>1234</b></p>
        `}
      </div>
      <div class="login-foot">סע לשלום = חיים 💚 · ביחד ניצור סביבה בטוחה יותר</div>
    </div>`;
  }
  function mountLogin() {
    const tab = viewState.loginTab || 'parent';
    if (tab === 'admin') {
      const inp = document.getElementById('acode');
      const doIt = () => {
        if (inp.value === String(Store.settings.adminCode)) { Store.login({ role: 'admin' }); toast('ברוכים הבאים לממשק הועד', 'ok'); go('admin/today'); }
        else { toast('קוד שגוי', 'err'); inp.value = ''; inp.focus(); }
      };
      document.getElementById('alogin').onclick = doIt;
      inp.onkeydown = (e) => { if (e.key === 'Enter') doIt(); };
      return;
    }
    let sel = null;
    const list = document.getElementById('plist');
    const search = document.getElementById('psearch');
    const btn = document.getElementById('plogin');
    const pinbox = document.getElementById('pinbox');
    const pin = document.getElementById('ppin');
    const draw = () => {
      const q = search.value.trim();
      const ps = Store.parents.filter((p) => p.active && (!q || p.name.includes(q) || (p.child || '').includes(q)));
      list.innerHTML = ps.map((p) => `<button class="pick ${sel === p.id ? 'on' : ''}" data-id="${p.id}">
        ${avatar(p, true)}<div class="who"><b>${esc(p.name)}</b><span>${esc(p.child || '')}${p.cls ? ' · ' + esc(p.cls) : ''}</span></div>
        <div class="check">${sel === p.id ? ic('check') : ''}</div></button>`).join('') || '<div class="empty">לא נמצאו הורים</div>';
    };
    draw();
    search.oninput = draw;
    list.onclick = (e) => {
      const b = e.target.closest('.pick'); if (!b) return;
      sel = b.dataset.id; draw(); btn.disabled = false;
      const p = Store.parent(sel);
      pinbox.classList.toggle('hidden', !p.pin);
      if (p.pin) pin.focus();
    };
    const doIt = () => {
      const p = Store.parent(sel); if (!p) return;
      if (p.pin && pin.value !== p.pin) { toast('קוד אישי שגוי', 'err'); pin.value = ''; return; }
      Store.login({ role: 'parent', pid: p.id });
      toast(`שלום ${first(p.name)}! 👋`, 'ok'); go('home');
    };
    btn.onclick = doIt;
    pin.onkeydown = (e) => { if (e.key === 'Enter') doIt(); };
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
            ${set.committeePhone ? `<a class="btn ghost sm" href="https://wa.me/${esc(set.committeePhone.replace(/\D/g, '').replace(/^0/, '972'))}?text=${encodeURIComponent('היי, אני ' + p.name + ' וצריך/ה החלפה למשמרת ב-' + fmtFull(next))}" target="_blank" rel="noopener">${ic('swap')} בקשת החלפה</a>` : ''}
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
          <div>🔔 הוסיפו את המשמרות ליומן בטלפון כדי לקבל תזכורת.</div>
        </div>
        <div class="btn-row" style="margin-top:14px"><button class="btn green sm" data-a="ics">${ic('cal')} כל המשמרות שלי ליומן</button>
        ${!isStandalone() ? `<button class="btn ghost sm" data-a="install">${ic('download')} התקנה על הטלפון</button>` : ''}</div>
      </div>
      <div class="card"><div class="partner">${avatar(p)}<div class="who"><b>${esc(p.name)}</b><span>${esc(p.child || '')}${p.cls ? ' · ' + esc(p.cls) : ''}</span></div>
        <button class="btn ghost sm" data-a="logout">${ic('logout')} החלפת משתמש</button></div></div>`;
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
          ${r.note ? `<div class="small muted" style="margin-top:6px">📝 ${esc(r.note)}</div>` : ''}
          <div class="acts">
            ${!r.in && st !== 'excused' ? `<button class="btn green sm" data-a="adm-in" data-d="${d}" data-id="${id}">${ic('check')} כניסה</button>` : ''}
            ${r.in && !r.out ? `<button class="btn sm" data-a="adm-out" data-d="${d}" data-id="${id}">${ic('door')} יציאה</button>` : ''}
            <button class="btn ghost sm" data-a="edit-rec" data-d="${d}" data-id="${id}">${ic('edit')} עריכה</button>
            ${q.phone ? `<a class="btn ghost sm" href="tel:${esc(q.phone)}">${ic('phone')}</a>` : ''}
          </div></div>`;
      }).join('') || '<div class="card empty">לא שובצו הורים ליום זה</div>'}</div>
      <div class="btn-row" style="margin-top:12px"><button class="btn ghost sm" data-a="day" data-d="${d}">${ic('swap')} שינוי שיבוץ ליום זה</button></div>`}
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
        <div class="btn-row"><button class="btn green sm" data-a="parent-edit">${ic('plus')} הורה חדש</button><button class="btn ghost sm" data-a="parent-import">${ic('upload')} ייבוא רשימה</button></div>
      </div>
      <div class="search" style="margin-bottom:14px">${ic('search')}<input class="input" id="pq" placeholder="חיפוש הורה, ילד/ה או טלפון" value="${esc(q)}"></div>
      <div class="card"><div class="list">${ps.map((p) => {
        const all = Store.shiftsOf(p.id);
        const past = all.filter((d) => d <= t);
        const done = past.filter((d) => Store.status(d, p.id) === 'done').length;
        return `<div class="row clickable" data-a="parent-edit" data-id="${p.id}" style="${p.active ? '' : 'opacity:.5'}">
          ${avatar(p, true)}<div class="who"><b>${esc(p.name)}</b><span>${esc(p.child || '')}${p.cls ? ' · ' + esc(p.cls) : ''}${p.phone ? ' · ' + esc(p.phone) : ''}</span></div>
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
        <label class="field"><span>טלפון רכז/ת הועד (לבקשות החלפה בוואטסאפ)</span><input class="input" id="sPhone" inputmode="tel" value="${esc(s.committeePhone)}" placeholder="050-0000000"></label>
        <label class="field"><span>קוד כניסת ועד</span><input class="input" id="sCode" inputmode="numeric" value="${esc(s.adminCode)}"></label>
      </div>
      <button class="btn green block" data-a="save-settings">${ic('check')} שמירת הגדרות</button>
      <div class="section-label">גיבוי נתונים</div>
      <div class="card"><p class="small muted mt0">הורדת קובץ גיבוי מלא או שחזור ממנו.</p>
        <div class="btn-row"><button class="btn ghost sm" data-a="backup">${ic('download')} הורדת גיבוי</button>
        <label class="btn ghost sm">${ic('upload')} שחזור מגיבוי<input type="file" accept=".json,application/json" id="restore" hidden></label>
        <button class="btn red sm" data-a="reset">${ic('trash')} איפוס לנתוני הדגמה</button></div></div>
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
    const p = id ? { ...Store.parent(id) } : { name: '', phone: '', child: '', cls: '', pin: '', active: true };
    openModal(`<h2>${id ? 'עריכת הורה' : 'הורה חדש'}</h2>
      <div class="card">
        <label class="field"><span>שם ההורה *</span><input class="input" id="fn" value="${esc(p.name)}"></label>
        <label class="field"><span>טלפון</span><input class="input" id="fp" inputmode="tel" value="${esc(p.phone)}"></label>
        <div class="grid2">
          <label class="field"><span>שם הילד/ה</span><input class="input" id="fc" value="${esc(p.child)}"></label>
          <label class="field"><span>כיתה</span><input class="input" id="fk" value="${esc(p.cls)}"></label>
        </div>
        <label class="field"><span>קוד אישי לכניסה (לא חובה)</span><input class="input" id="fpin" inputmode="numeric" maxlength="6" value="${esc(p.pin)}" placeholder="ריק = כניסה ללא קוד"></label>
        <label class="pick ${p.active ? 'on' : ''}" id="fact" style="cursor:pointer"><div class="check">${p.active ? ic('check') : ''}</div><div class="who"><b>פעיל/ה</b><span>משתתף/ת בשיבוץ האוטומטי</span></div></label>
      </div>
      ${id ? `<div class="card"><div class="small muted">${Store.shiftsOf(id).length} משמרות בסך הכל</div></div>` : ''}
      <div class="btn-row"><button class="btn green" id="fsave" style="flex:1">${ic('check')} שמירה</button>
      ${id ? `<button class="btn red" id="fdel">${ic('trash')}</button>` : ''}<button class="btn ghost" data-dismiss>ביטול</button></div>`, (root) => {
      const act = root.querySelector('#fact');
      act.onclick = () => { p.active = !p.active; act.classList.toggle('on', p.active); act.querySelector('.check').innerHTML = p.active ? ic('check') : ''; };
      root.querySelector('#fsave').onclick = () => {
        p.name = root.querySelector('#fn').value.trim();
        if (!p.name) { toast('נא להזין שם', 'err'); return; }
        p.phone = root.querySelector('#fp').value.trim();
        p.child = root.querySelector('#fc').value.trim();
        p.cls = root.querySelector('#fk').value.trim();
        p.pin = root.querySelector('#fpin').value.trim();
        Store.saveParent(p); closeModal(); toast('נשמר', 'ok');
      };
      const del = root.querySelector('#fdel');
      if (del) del.onclick = () => {
        askConfirm(`למחוק את ${p.name}? ההורה יוסר גם מכל השיבוצים.`, 'מחיקה', () => { Store.removeParent(id); toast('ההורה נמחק'); });
      };
    });
  }

  function importModal() {
    openModal(`<h2>ייבוא רשימת הורים</h2>
      <p class="small muted mt0">שורה לכל הורה, בפורמט: <b>שם, טלפון, שם הילד/ה, כיתה</b><br>אפשר להעתיק עמודות ישירות מאקסל.</p>
      <textarea class="input" id="imp" rows="8" placeholder="רונית כהן, 050-1234567, נועם, ב׳2"></textarea>
      <div class="spacer"></div>
      <div class="btn-row"><button class="btn green" id="impgo" style="flex:1">${ic('upload')} ייבוא</button><button class="btn ghost" data-dismiss>ביטול</button></div>`, (root) => {
      root.querySelector('#impgo').onclick = () => {
        const lines = root.querySelector('#imp').value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        let n = 0;
        lines.forEach((l) => {
          const [name, phone, child, cls] = l.split(/\t|,/).map((x) => (x || '').trim());
          if (!name) return;
          Store.saveParent({ name, phone: phone || '', child: child || '', cls: cls || '', pin: '', active: true }); n++;
        });
        closeModal(); toast(`יובאו ${n} הורים`, 'ok');
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
      root.querySelector('#ago').onclick = () => {
        const from = root.querySelector('#af').value, to = root.querySelector('#at').value;
        if (!from || !to || from > to) { toast('טווח תאריכים לא תקין', 'err'); return; }
        const n = Store.rotate(from, to, ov); closeModal(); toast(`שובצו ${n} ימים ✨`, 'ok');
      };
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
      'login-tab': () => { viewState.loginTab = v; render(); },
      logout: () => { Store.logout(); viewState = {}; go('login'); },
      install: async () => {
        if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; render(); }
        else installHelp();
      },
      'hide-install': () => { try { localStorage.setItem('nv-hide-install', '1'); } catch (x) { /* ignore */ } render(); },
      checkin: () => {
        Store.checkIn(today(), s.pid); navigator.vibrate && navigator.vibrate(60); confetti();
        toast(Store.isLate(today(), s.pid) ? 'נרשמה כניסה – תודה שהגעת!' : 'נרשמה כניסה – משמרת מוצלחת! 💪', 'ok');
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
      'save-settings': () => {
        const g = (id) => document.getElementById(id).value;
        const days = [...document.querySelectorAll('.sDay:checked')].map((x) => +x.value);
        if (!g('sCode').trim()) { toast('קוד ועד לא יכול להיות ריק', 'err'); return; }
        if (g('sStart') >= g('sEnd')) { toast('שעת הסיום חייבת להיות אחרי ההתחלה', 'err'); return; }
        Store.saveSettings({ shiftStart: g('sStart'), shiftEnd: g('sEnd'), perShift: Math.max(1, +g('sPer') || 2), lateGraceMin: Math.max(0, +g('sGrace') || 0), schoolDays: days, schoolName: g('sSchool').trim() || 'מישור הנוף', committeePhone: g('sPhone').trim(), adminCode: g('sCode').trim() });
        toast('ההגדרות נשמרו', 'ok');
      },
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

  Store.subscribe(render);
  window.addEventListener('hashchange', () => { closeModal(); render(); });
  // re-render when the app comes back to the foreground (status may have changed)
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
  render();
})();
