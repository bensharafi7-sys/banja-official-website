/* =========================================================
   נשק וסע – data layer
   All reads/writes go through `Store`. Today the data lives in
   localStorage (demo mode, single device). Swapping to a shared
   cloud backend means re-implementing load()/persist() only.
   ========================================================= */
(function () {
  const KEY = 'nv-data-v1';
  const SESSION_KEY = 'nv-session';

  const pad = (n) => String(n).padStart(2, '0');
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parseDate(s); d.setDate(d.getDate() + n); return isoDate(d); };
  const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const toMin = (hm) => { if (!hm) return null; const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
  const uid = () => Math.random().toString(36).slice(2, 9);

  const DEFAULT_SETTINGS = {
    schoolName: 'מישור הנוף',
    shiftStart: '07:30',
    shiftEnd: '08:00',
    perShift: 2,
    lateGraceMin: 5,
    schoolDays: [0, 1, 2, 3, 4, 5], // Sun–Fri
    adminCode: '1234',
    committeePhone: ''
  };

  /* ---------- demo seed ---------- */
  function seed() {
    const names = [
      ['מיכל לוי', 'נועה', 'ב׳1'], ['אבי כהן', 'איתי', 'ג׳2'], ['שירן מזרחי', 'יעל', 'א׳3'],
      ['רונן פרץ', 'עומר', 'ד׳1'], ['דנה אברהם', 'תמר', 'ה׳2'], ['יוסי ביטון', 'אורי', 'ב׳2'],
      ['ליאת דהן', 'מאיה', 'ו׳1'], ['עמית שגיא', 'רועי', 'א׳1'], ['הילה גבאי', 'שירה', 'ג׳1'],
      ['משה אזולאי', 'דניאל', 'ד׳3'], ['קרן חדד', 'אלה', 'ה׳1'], ['גיל רוזן', 'נדב', 'ב׳3'],
      ['אורית סויסה', 'ליה', 'א׳2'], ['תומר וקנין', 'יונתן', 'ו׳2'], ['סיגל עמר', 'הדר', 'ג׳3'],
      ['אלון בן דוד', 'איתמר', 'ד׳2']
    ];
    const parents = names.map(([name, child, cls], i) => ({
      id: 'p' + (i + 1), name, child, cls,
      phone: '05' + (2 + (i % 6)) + '-' + String(1000000 + i * 734251).slice(0, 7),
      pin: '', active: true
    }));
    const data = { version: 1, settings: { ...DEFAULT_SETTINGS }, parents, shifts: {}, attendance: {}, log: [] };

    // rotation from ~3 weeks ago to ~5 weeks ahead
    const today = isoDate(new Date());
    generateRotation(data, addDays(today, -21), addDays(today, 35), false);

    // fake past attendance
    Object.keys(data.shifts).filter((d) => d < today).forEach((d) => {
      data.shifts[d].forEach((pid, i) => {
        const r = Math.random();
        if (r < 0.08) return; // no-show
        if (r < 0.12) { data.attendance[d + '|' + pid] = { status: 'excused', note: 'החלפה בתיאום', by: 'admin' }; return; }
        const inM = 7 * 60 + 22 + Math.floor(Math.random() * 14) + (i ? 1 : 0);
        const outM = 8 * 60 + Math.floor(Math.random() * 6);
        data.attendance[d + '|' + pid] = {
          status: 'present', in: `${pad(Math.floor(inM / 60))}:${pad(inM % 60)}`,
          out: `${pad(Math.floor(outM / 60))}:${pad(outM % 60)}`, by: 'self'
        };
      });
    });
    return data;
  }

  function generateRotation(data, from, to, overwrite, startAfter) {
    const active = data.parents.filter((p) => p.active);
    if (!active.length) return 0;
    let idx = 0;
    if (startAfter) {
      const i = active.findIndex((p) => p.id === startAfter);
      if (i >= 0) idx = i + 1;
    }
    let count = 0;
    for (let d = from; d <= to; d = addDays(d, 1)) {
      if (!data.settings.schoolDays.includes(parseDate(d).getDay())) continue;
      if (data.shifts[d] && data.shifts[d].length && !overwrite) continue;
      const team = [];
      for (let k = 0; k < Math.min(data.settings.perShift, active.length); k++) {
        team.push(active[idx % active.length].id); idx++;
      }
      data.shifts[d] = team; count++;
    }
    return count;
  }

  /* ---------- Store ---------- */
  const listeners = new Set();
  let data = null;

  function load() {
    try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) { data = null; }
    if (!data || !data.parents) { data = seed(); persist(); }
    data.settings = { ...DEFAULT_SETTINGS, ...data.settings };
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* storage full / blocked */ }
    listeners.forEach((fn) => fn());
  }
  function log(action, detail) {
    const s = Store.session();
    data.log.unshift({ t: new Date().toISOString(), who: s ? (s.role === 'admin' ? 'ועד' : Store.parent(s.pid)?.name || '') : '', action, detail });
    data.log = data.log.slice(0, 300);
  }

  const Store = {
    util: { pad, isoDate, parseDate, addDays, nowHM, toMin, uid },
    get settings() { return data.settings; },
    get parents() { return data.parents; },
    get shifts() { return data.shifts; },
    get log() { return data.log; },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    /* session */
    session() { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; } },
    login(s) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) { /* blocked */ } },
    logout() { try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* blocked */ } },

    /* parents */
    parent(id) { return data.parents.find((p) => p.id === id); },
    saveParent(p) {
      const i = data.parents.findIndex((x) => x.id === p.id);
      if (i >= 0) { data.parents[i] = p; log('עריכת הורה', p.name); }
      else { p.id = 'p' + uid(); data.parents.push(p); log('הוספת הורה', p.name); }
      persist(); return p;
    },
    removeParent(id) {
      const p = Store.parent(id);
      data.parents = data.parents.filter((x) => x.id !== id);
      Object.keys(data.shifts).forEach((d) => { data.shifts[d] = data.shifts[d].filter((x) => x !== id); });
      log('מחיקת הורה', p ? p.name : id); persist();
    },

    /* shifts */
    team(date) { return data.shifts[date] || []; },
    setTeam(date, ids) {
      data.shifts[date] = ids; log('עדכון שיבוץ', date + ': ' + ids.map((i) => Store.parent(i)?.name).join(', '));
      persist();
    },
    shiftsOf(pid) { return Object.keys(data.shifts).filter((d) => data.shifts[d].includes(pid)).sort(); },
    rotate(from, to, overwrite) {
      // continue the round-robin from whoever served last before `from`
      const before = Object.keys(data.shifts).filter((d) => d < from && data.shifts[d].length).sort().pop();
      const last = before ? data.shifts[before][data.shifts[before].length - 1] : null;
      const n = generateRotation(data, from, to, overwrite, last);
      log('שיבוץ אוטומטי', `${from} → ${to} (${n} ימים)`); persist(); return n;
    },
    clearRange(from, to) {
      Object.keys(data.shifts).forEach((d) => { if (d >= from && d <= to) delete data.shifts[d]; });
      log('ניקוי שיבוץ', `${from} → ${to}`); persist();
    },

    /* attendance */
    rec(date, pid) { return data.attendance[date + '|' + pid] || null; },
    setRec(date, pid, rec, by) {
      const k = date + '|' + pid;
      if (!rec) delete data.attendance[k];
      else data.attendance[k] = { ...rec, by: by || rec.by };
      log(by === 'admin' ? 'עריכת נוכחות' : 'דיווח נוכחות', `${Store.parent(pid)?.name} · ${date}`);
      persist();
    },
    checkIn(date, pid) { Store.setRec(date, pid, { status: 'present', in: nowHM(), out: '' }, 'self'); },
    checkOut(date, pid) {
      const r = Store.rec(date, pid) || { status: 'present', in: '' };
      Store.setRec(date, pid, { ...r, out: nowHM() }, 'self');
    },

    /** status of a parent on a date:
     *  future | pending | active | done | missed | excused */
    status(date, pid) {
      const r = Store.rec(date, pid);
      const today = isoDate(new Date());
      if (r && r.status === 'excused') return 'excused';
      if (r && r.status === 'absent') return 'missed';
      if (r && r.in) return r.out ? 'done' : (date < today ? 'done' : 'active');
      if (date > today) return 'future';
      if (date === today && toMin(nowHM()) < toMin(data.settings.shiftEnd)) return 'pending';
      return 'missed';
    },
    isLate(date, pid) {
      const r = Store.rec(date, pid);
      return !!(r && r.in && toMin(r.in) > toMin(data.settings.shiftStart) + data.settings.lateGraceMin);
    },
    minutes(date, pid) {
      const r = Store.rec(date, pid);
      if (!r || !r.in) return 0;
      const end = r.out ? toMin(r.out) : toMin(data.settings.shiftEnd);
      return Math.max(0, end - toMin(r.in));
    },

    /* settings */
    saveSettings(s) { data.settings = { ...data.settings, ...s }; log('עדכון הגדרות', ''); persist(); },

    /* backup */
    exportJSON() { return JSON.stringify(data, null, 2); },
    importJSON(text) { const d = JSON.parse(text); if (!d.parents || !d.shifts) throw new Error('bad file'); data = d; persist(); },
    resetDemo() { data = seed(); persist(); }
  };

  load();
  window.Store = Store;
})();
