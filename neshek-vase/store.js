/* =========================================================
   נשק וסע – data layer
   `Store` keeps an in-memory copy of everything the signed-in
   user may see, so views read synchronously. Writes go to a
   backend:
     • Local    – demo mode, whole dataset in localStorage
     • Firebase – Firestore + Auth, live updates via onSnapshot
   ========================================================= */
(function () {
  const CFG = self.NV_CONFIG || {};
  const LOGIN_DOMAIN = 'nv-login.app';
  const LS_KEY = 'nv-data-v2';
  const LS_SESSION = 'nv-session-v2';

  /* ---------- utils ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parseDate(s); d.setDate(d.getDate() + n); return isoDate(d); };
  const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const toMin = (hm) => { if (!hm) return null; const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
  const uid = () => Math.random().toString(36).slice(2, 10);
  const normPhone = (p) => { let d = String(p || '').replace(/\D/g, ''); if (d.startsWith('972')) d = '0' + d.slice(3); return d; };
  const newCode = () => {
    const a = new Uint32Array(1); (self.crypto || window.crypto).getRandomValues(a);
    return String(100000 + (a[0] % 900000));
  };
  async function loginKey(phone, code) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`nv|${normPhone(phone)}|${code}`));
    return 'k' + [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
  }
  const loginPw = (phone, code) => `nv-${code}-${normPhone(phone)}`;
  const schoolYearStart = () => { const d = new Date(); const y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1; return `${y}-08-01`; };
  const haversine = (a, b, c, d) => {
    const R = 6371000, r = Math.PI / 180;
    const x = Math.sin(((c - a) * r) / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  };

  const DEFAULT_SETTINGS = {
    schoolName: 'מישור הנוף',
    shiftStart: '07:30',
    shiftEnd: '08:00',
    perShift: 2,
    lateGraceMin: 5,
    schoolDays: [0, 1, 2, 3, 4, 5], // Sun–Fri
    committeePhone: '',
    geoMode: 'block', // block | flag | off
    geoLat: null,
    geoLng: null,
    geoRadius: 200
  };
  const empty = () => ({ settings: { ...DEFAULT_SETTINGS }, parents: [], committee: [], shifts: {}, attendance: {}, requests: [], log: [], secrets: {} });

  let data = empty();
  let session = null;
  const listeners = new Set();
  let notifyQueued = false;
  function notify() {
    if (notifyQueued) return;
    notifyQueued = true;
    Promise.resolve().then(() => { notifyQueued = false; listeners.forEach((fn) => fn()); });
  }
  let onError = (e) => console.error(e);
  const guard = (p) => Promise.resolve(p).catch((e) => { onError(e); throw e; });

  /* ---------- rotation (pure) ---------- */
  function rotation(src, from, to, overwrite, startAfter) {
    const out = {};
    const active = src.parents.filter((p) => p.active);
    if (!active.length) return out;
    let idx = 0;
    if (startAfter) { const i = active.findIndex((p) => p.id === startAfter); if (i >= 0) idx = i + 1; }
    for (let d = from; d <= to; d = addDays(d, 1)) {
      if (!src.settings.schoolDays.includes(parseDate(d).getDay())) continue;
      if (src.shifts[d] && src.shifts[d].length && !overwrite) continue;
      const team = [];
      for (let k = 0; k < Math.min(src.settings.perShift, active.length); k++) { team.push(active[idx % active.length].id); idx++; }
      out[d] = team;
    }
    return out;
  }

  /* =========================================================
     Local backend (demo)
     ========================================================= */
  function seed() {
    const names = [
      ['מיכל לוי', 'נועה', 'ב׳1'], ['אבי כהן', 'איתי', 'ג׳2'], ['שירן מזרחי', 'יעל', 'א׳3'],
      ['רונן פרץ', 'עומר', 'ד׳1'], ['דנה אברהם', 'תמר', 'ה׳2'], ['יוסי ביטון', 'אורי', 'ב׳2'],
      ['ליאת דהן', 'מאיה', 'ו׳1'], ['עמית שגיא', 'רועי', 'א׳1'], ['הילה גבאי', 'שירה', 'ג׳1'],
      ['משה אזולאי', 'דניאל', 'ד׳3'], ['קרן חדד', 'אלה', 'ה׳1'], ['גיל רוזן', 'נדב', 'ב׳3'],
      ['אורית סויסה', 'ליה', 'א׳2'], ['תומר וקנין', 'יונתן', 'ו׳2'], ['סיגל עמר', 'הדר', 'ג׳3'],
      ['אלון בן דוד', 'איתמר', 'ד׳2']
    ];
    const d = empty();
    d.settings.geoMode = 'off'; // the demo has no school location
    d.parents = names.map(([name, child, cls], i) => ({ id: 'p' + (i + 1), name, child, cls, phone: '05' + (2 + (i % 6)) + String(1000000 + i * 734251).slice(0, 7), active: true }));
    d.parents.forEach((p) => { d.secrets[p.id] = { code: '123456' }; });
    d.committee = [{ id: 'c1', name: 'ועד ההורים (דמו)', phone: '0500000000' }];
    d.secrets.c1 = { code: '123456' };
    const t = isoDate(new Date());
    Object.assign(d.shifts, rotation(d, addDays(t, -21), addDays(t, 35), false));
    Object.keys(d.shifts).filter((x) => x < t).forEach((x) => {
      d.shifts[x].forEach((pid, i) => {
        const r = Math.random();
        if (r < 0.08) return;
        if (r < 0.12) { d.attendance[x + '|' + pid] = { status: 'excused', note: 'החלפה בתיאום', by: 'admin' }; return; }
        const inM = 7 * 60 + 22 + Math.floor(Math.random() * 14) + (i ? 1 : 0);
        const outM = 8 * 60 + Math.floor(Math.random() * 6);
        d.attendance[x + '|' + pid] = { status: 'present', in: `${pad(Math.floor(inM / 60))}:${pad(inM % 60)}`, out: `${pad(Math.floor(outM / 60))}:${pad(outM % 60)}`, by: 'self', geoOk: true, geoDist: 20 + Math.floor(Math.random() * 60) };
      });
    });
    return d;
  }

  const Local = {
    mode: 'local',
    needsSetup: false,
    async init() {
      try { data = JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) { data = null; }
      if (!data || !data.parents) { data = seed(); this.save(); }
      data = { ...empty(), ...data, settings: { ...DEFAULT_SETTINGS, ...data.settings } };
      try { session = JSON.parse(localStorage.getItem(LS_SESSION)); } catch (e) { session = null; }
      if (session && !(session.role === 'admin' ? data.committee.some((c) => c.id === session.cid) : data.parents.some((p) => p.id === session.pid))) session = null;
    },
    save() { try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (e) { /* storage blocked */ } notify(); },
    setSession(s) { session = s; try { s ? localStorage.setItem(LS_SESSION, JSON.stringify(s)) : localStorage.removeItem(LS_SESSION); } catch (e) { /* ignore */ } notify(); },
    async login(phone, code) {
      const ph = normPhone(phone);
      const c = data.committee.find((x) => normPhone(x.phone) === ph && data.secrets[x.id]?.code === code);
      if (c) return this.setSession({ role: 'admin', cid: c.id });
      const p = data.parents.find((x) => normPhone(x.phone) === ph && data.secrets[x.id]?.code === code);
      if (p) return this.setSession({ role: 'parent', pid: p.id });
      throw new Error('bad-code');
    },
    async logout() { this.setSession(null); },
    async putParent(p, code) {
      const i = data.parents.findIndex((x) => x.id === p.id);
      if (i >= 0) data.parents[i] = p; else data.parents.push(p);
      if (code) data.secrets[p.id] = { code };
      this.save();
    },
    async delParent(id) {
      data.parents = data.parents.filter((x) => x.id !== id);
      Object.keys(data.shifts).forEach((d) => { data.shifts[d] = data.shifts[d].filter((x) => x !== id); });
      delete data.secrets[id]; this.save();
    },
    async putCommittee(c, code) {
      const i = data.committee.findIndex((x) => x.id === c.id);
      if (i >= 0) data.committee[i] = c; else data.committee.push(c);
      if (code) data.secrets[c.id] = { code };
      this.save();
    },
    async delCommittee(id) { data.committee = data.committee.filter((x) => x.id !== id); delete data.secrets[id]; this.save(); },
    async setCode(kind, id, code) { data.secrets[id] = { code }; this.save(); },
    async setTeams(map) { Object.entries(map).forEach(([d, t]) => { if (t && t.length) data.shifts[d] = t; else delete data.shifts[d]; }); this.save(); },
    async putRec(date, pid, rec) { const k = date + '|' + pid; if (rec) data.attendance[k] = rec; else delete data.attendance[k]; this.save(); },
    async putSettings(s) { data.settings = { ...data.settings, ...s }; this.save(); },
    async addLog(e) { data.log.unshift(e); data.log = data.log.slice(0, 300); this.save(); },
    async addRequest(r) { data.requests.unshift({ ...r, id: 'r' + uid() }); this.save(); },
    async updateRequest(id, patch) { const r = data.requests.find((x) => x.id === id); if (r) Object.assign(r, patch); this.save(); },
    async enablePush() { throw new Error('push-demo'); },
    exportJSON() { return JSON.stringify(data, null, 2); },
    importJSON(text) { const d = JSON.parse(text); if (!d.parents || !d.shifts) throw new Error('bad file'); data = { ...empty(), ...d }; this.save(); },
    resetDemo() { data = seed(); this.save(); }
  };

  /* =========================================================
     Firebase backend
     ========================================================= */
  function loadScript(src) {
    return new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) return res();
      const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('load ' + src));
      document.head.appendChild(s);
    });
  }

  const Firebase = {
    mode: 'firebase',
    needsSetup: false,
    claiming: false,
    unsubs: [],
    async init() {
      const base = CFG.sdkBase || 'https://www.gstatic.com/firebasejs/10.12.2/';
      await loadScript(base + 'firebase-app-compat.js');
      await Promise.all(['firebase-auth-compat.js', 'firebase-firestore-compat.js'].map((f) => loadScript(base + f)));
      firebase.initializeApp(CFG.firebase);
      this.auth = firebase.auth();
      this.db = firebase.firestore();
      if (CFG.emulator) { // local testing only
        this.auth.useEmulator(CFG.emulator.auth, { disableWarnings: true });
        this.db.useEmulator(CFG.emulator.host, CFG.emulator.firestorePort);
      } else {
        try { await this.db.enablePersistence({ synchronizeTabs: true }); } catch (e) { /* another tab / unsupported */ }
      }
      this.FV = firebase.firestore.FieldValue;
      try { const s = await this.db.doc('meta/setup').get(); this.needsSetup = !s.exists; } catch (e) { this.needsSetup = false; }
      await new Promise((resolve) => {
        let first = true;
        this.auth.onAuthStateChanged(async (u) => {
          if (this.claiming) return;
          await this.resolve(u);
          if (first) { first = false; resolve(); }
        });
      });
    },

    stop() { this.unsubs.forEach((f) => f()); this.unsubs = []; },

    /** figure out who the signed-in user is and start live listeners */
    async resolve(u) {
      this.stop();
      data = empty();
      session = null;
      if (!u) { notify(); return; }
      try {
        const a = await this.db.doc('admins/' + u.uid).get();
        if (a.exists) session = { role: 'admin', uid: u.uid, cid: a.data().cid };
        else {
          const q = await this.db.collection('parents').where('uid', '==', u.uid).limit(1).get();
          if (!q.empty) session = { role: 'parent', uid: u.uid, pid: q.docs[0].id };
        }
      } catch (e) { console.error(e); }
      if (!session) { await this.auth.signOut(); notify(); return; }
      await this.listen();
      notify();
    },

    async listen() {
      const db = this.db, admin = session.role === 'admin';
      const from = schoolYearStart();
      const firsts = [];
      // no redraws until every first snapshot is in – a half-loaded state looks like a deleted user
      let loading = true;
      const watch = (ref, apply) => {
        let done; firsts.push(new Promise((r) => { done = r; }));
        this.unsubs.push(ref.onSnapshot((snap) => { apply(snap); done(); if (!loading) notify(); }, (e) => {
          console.error(e); done();
          // access revoked while signed in (e.g. removed from the committee) → work out the role again
          if (!loading && e.code === 'permission-denied' && !this.rechecking) {
            this.rechecking = true;
            this.resolve(this.auth.currentUser).finally(() => { this.rechecking = false; });
          }
        }));
      };
      watch(db.doc('settings/main'), (s) => { data.settings = { ...DEFAULT_SETTINGS, ...(s.exists ? s.data() : {}) }; });
      watch(db.collection('parents'), (s) => { data.parents = s.docs.map((d) => ({ id: d.id, ...d.data() })); });
      watch(db.collection('shifts').where(firebase.firestore.FieldPath.documentId(), '>=', from), (s) => {
        data.shifts = {}; s.docs.forEach((d) => { data.shifts[d.id] = d.data().team || []; });
      });
      watch(db.collection('attendance').where('date', '>=', from), (s) => {
        data.attendance = {}; s.docs.forEach((d) => { const r = d.data(); data.attendance[r.date + '|' + r.pid] = r; });
      });
      watch(admin ? db.collection('requests').where('status', '==', 'open') : db.collection('requests').where('pid', '==', session.pid), (s) => {
        data.requests = s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.t || '').localeCompare(a.t || ''));
      });
      if (admin) {
        watch(db.collection('committee'), (s) => { data.committee = s.docs.map((d) => ({ id: d.id, ...d.data() })); });
        watch(db.collection('secrets'), (s) => { data.secrets = {}; s.docs.forEach((d) => { data.secrets[d.id] = d.data(); }); });
        watch(db.collection('log').orderBy('t', 'desc').limit(200), (s) => { data.log = s.docs.map((d) => d.data()); });
      }
      await Promise.all(firsts);
      loading = false;
    },

    /** sign in to the account derived from phone+code; create it on first use */
    async account(phone, code) {
      const key = await loginKey(phone, code);
      const email = key + '@' + LOGIN_DOMAIN, pw = loginPw(phone, code);
      try {
        return { key, user: (await this.auth.signInWithEmailAndPassword(email, pw)).user, created: false };
      } catch (e) {
        if (!['auth/user-not-found', 'auth/invalid-credential', 'auth/invalid-login-credentials', 'auth/wrong-password'].includes(e.code)) throw e;
        return { key, user: (await this.auth.createUserWithEmailAndPassword(email, pw)).user, created: true };
      }
    },

    async login(phone, code) {
      this.claiming = true;
      try {
        const { key, user, created } = await this.account(phone, code);
        const cl = await this.db.doc('claims/' + key).get();
        if (!cl.exists) {
          if (created) await user.delete().catch(() => {});
          await this.auth.signOut();
          throw new Error('bad-code');
        }
        const c = cl.data();
        if (c.kind === 'parent') {
          const p = await this.db.doc('parents/' + c.id).get();
          if (!p.exists) { await this.auth.signOut(); throw new Error('bad-code'); }
          if (p.data().uid !== user.uid) await this.db.doc('parents/' + c.id).update({ uid: user.uid, claimKey: key });
        } else {
          const a = await this.db.doc('admins/' + user.uid).get();
          if (!a.exists) {
            const b = this.db.batch();
            b.set(this.db.doc('admins/' + user.uid), { cid: c.id, claimKey: key });
            b.update(this.db.doc('committee/' + c.id), { uid: user.uid, claimKey: key });
            await b.commit();
          }
        }
        this.claiming = false;
        await this.resolve(user);
      } finally { this.claiming = false; }
    },

    /** first committee account – only possible while meta/setup does not exist */
    async setup(name, phone, code) {
      this.claiming = true;
      try {
        const { key, user } = await this.account(phone, code);
        const cid = 'c' + uid();
        const b = this.db.batch();
        b.set(this.db.doc('meta/setup'), { owner: user.uid, at: this.FV.serverTimestamp() });
        b.set(this.db.doc('admins/' + user.uid), { cid, claimKey: key });
        b.set(this.db.doc('committee/' + cid), { name, phone: normPhone(phone), uid: user.uid, claimKey: key });
        b.set(this.db.doc('claims/' + key), { kind: 'admin', id: cid });
        b.set(this.db.doc('secrets/' + cid), { code, key });
        b.set(this.db.doc('settings/main'), DEFAULT_SETTINGS);
        await b.commit();
        this.needsSetup = false;
        this.claiming = false;
        await this.resolve(user);
      } finally { this.claiming = false; }
    },

    async logout() { await this.auth.signOut(); },

    /** writes the claim (phone+code → person) and the code itself */
    async writeClaim(b, kind, id, phone, code) {
      const old = data.secrets[id];
      const key = await loginKey(phone, code);
      if (old && old.key && old.key !== key) b.delete(this.db.doc('claims/' + old.key));
      b.set(this.db.doc('claims/' + key), { kind, id });
      b.set(this.db.doc('secrets/' + id), { code, key });
    },
    async putParent(p, code) {
      const b = this.db.batch();
      const { id, ...rest } = p;
      b.set(this.db.doc('parents/' + id), rest, { merge: true });
      const prev = data.parents.find((x) => x.id === id);
      const c = code || (prev && normPhone(prev.phone) !== normPhone(p.phone) ? data.secrets[id]?.code : null);
      if (c) await this.writeClaim(b, 'parent', id, p.phone, c);
      await b.commit();
    },
    async delParent(id) {
      const b = this.db.batch();
      b.delete(this.db.doc('parents/' + id));
      const s = data.secrets[id];
      if (s && s.key) b.delete(this.db.doc('claims/' + s.key));
      b.delete(this.db.doc('secrets/' + id));
      Object.keys(data.shifts).filter((d) => data.shifts[d].includes(id)).forEach((d) => {
        b.set(this.db.doc('shifts/' + d), { team: data.shifts[d].filter((x) => x !== id) });
      });
      await b.commit();
    },
    async putCommittee(c, code) {
      const b = this.db.batch();
      const { id, ...rest } = c;
      b.set(this.db.doc('committee/' + id), rest, { merge: true });
      const prev = data.committee.find((x) => x.id === id);
      const k = code || (prev && normPhone(prev.phone) !== normPhone(c.phone) ? data.secrets[id]?.code : null);
      if (k) await this.writeClaim(b, 'admin', id, c.phone, k);
      await b.commit();
    },
    async delCommittee(id) {
      const c = data.committee.find((x) => x.id === id);
      const b = this.db.batch();
      b.delete(this.db.doc('committee/' + id));
      const s = data.secrets[id];
      if (s && s.key) b.delete(this.db.doc('claims/' + s.key));
      b.delete(this.db.doc('secrets/' + id));
      if (c && c.uid) b.delete(this.db.doc('admins/' + c.uid));
      await b.commit();
    },
    /** new code: old claim removed, the person must sign in again with the new code */
    async setCode(kind, id, code) {
      const list = kind === 'admin' ? data.committee : data.parents;
      const person = list.find((x) => x.id === id);
      const b = this.db.batch();
      await this.writeClaim(b, kind, id, person.phone, code);
      if (kind === 'admin') {
        if (person.uid && person.uid !== session.uid) b.delete(this.db.doc('admins/' + person.uid));
        if (person.uid !== session.uid) b.update(this.db.doc('committee/' + id), { uid: null });
      } else b.update(this.db.doc('parents/' + id), { uid: null });
      await b.commit();
    },
    async setTeams(map) {
      const entries = Object.entries(map);
      for (let i = 0; i < entries.length; i += 400) {
        const b = this.db.batch();
        entries.slice(i, i + 400).forEach(([d, t]) => {
          if (t && t.length) b.set(this.db.doc('shifts/' + d), { team: t }); else b.delete(this.db.doc('shifts/' + d));
        });
        await b.commit();
      }
    },
    async putRec(date, pid, rec) {
      const ref = this.db.doc(`attendance/${date}_${pid}`);
      if (!rec) return ref.delete();
      const clean = { date, pid, status: rec.status || 'none', in: rec.in || '', out: rec.out || '', note: rec.note || '', by: rec.by || 'admin', at: this.FV.serverTimestamp() };
      if (rec.geoOk !== undefined) { clean.geoOk = !!rec.geoOk; clean.geoDist = rec.geoDist ?? null; }
      return ref.set(clean);
    },
    async putSettings(s) { await this.db.doc('settings/main').set(s, { merge: true }); },
    async addLog(e) { await this.db.collection('log').add(e); },
    async addRequest(r) { await this.db.collection('requests').add(r); },
    async updateRequest(id, patch) { await this.db.doc('requests/' + id).update(patch); },

    async enablePush() {
      if (!CFG.vapidKey) throw new Error('push-not-configured');
      if (!('Notification' in window) || !('serviceWorker' in navigator)) throw new Error('push-unsupported');
      await loadScript((CFG.sdkBase || 'https://www.gstatic.com/firebasejs/10.12.2/') + 'firebase-messaging-compat.js');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') throw new Error('push-denied');
      const reg = await navigator.serviceWorker.ready;
      const token = await firebase.messaging().getToken({ vapidKey: CFG.vapidKey, serviceWorkerRegistration: reg });
      await this.db.doc('tokens/' + session.uid).set({ pid: session.pid || null, tokens: this.FV.arrayUnion(token), updated: this.FV.serverTimestamp() }, { merge: true });
    },

    exportJSON() { const { secrets, ...rest } = data; return JSON.stringify(rest, null, 2); },
    importJSON() { throw new Error('not-supported'); },
    resetDemo() { throw new Error('not-supported'); }
  };

  const B = CFG.firebase ? Firebase : Local;

  /* =========================================================
     Store – the API the app uses
     ========================================================= */
  function log(action, detail) {
    const who = !session ? '' : session.role === 'admin' ? (data.committee.find((c) => c.id === session.cid)?.name || 'ועד') : (data.parents.find((p) => p.id === session.pid)?.name || '');
    return B.addLog({ t: new Date().toISOString(), who, action, detail }).catch(() => {});
  }

  const Store = {
    util: { pad, isoDate, parseDate, addDays, nowHM, toMin, uid, normPhone, newCode, haversine },
    get mode() { return B.mode; },
    get needsSetup() { return B.needsSetup; },
    get settings() { return data.settings; },
    get parents() { return data.parents; },
    get committee() { return data.committee; },
    get shifts() { return data.shifts; },
    get log() { return data.log; },
    get requests() { return data.requests; },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    onError(fn) { onError = fn; },
    ready: null,

    /* session */
    session() { return session; },
    login: (phone, code) => B.login(phone, code),
    setup: (name, phone, code) => B.setup(name, phone, code),
    logout: () => B.logout(),
    me() { return !session ? null : session.role === 'admin' ? data.committee.find((c) => c.id === session.cid) : data.parents.find((p) => p.id === session.pid); },

    /* people */
    parent(id) { return data.parents.find((p) => p.id === id); },
    codeOf(id) { return data.secrets[id]?.code || ''; },
    async saveParent(p) {
      const isNew = !p.id;
      const code = isNew ? newCode() : null;
      if (isNew) p.id = 'p' + uid();
      p.phone = normPhone(p.phone);
      await guard(B.putParent(p, code));
      log(isNew ? 'הוספת הורה' : 'עריכת הורה', p.name);
      return p;
    },
    async importParents(rows) {
      for (const r of rows) await B.putParent({ id: 'p' + uid(), name: r.name, phone: normPhone(r.phone), child: r.child || '', cls: r.cls || '', active: true }, newCode());
      log('ייבוא הורים', rows.length + ' הורים');
    },
    async removeParent(id) { const p = Store.parent(id); await guard(B.delParent(id)); log('מחיקת הורה', p ? p.name : id); },
    async saveCommittee(c) {
      const isNew = !c.id;
      const code = isNew ? newCode() : null;
      if (isNew) c.id = 'c' + uid();
      c.phone = normPhone(c.phone);
      await guard(B.putCommittee(c, code));
      log(isNew ? 'הוספת חבר/ת ועד' : 'עריכת חבר/ת ועד', c.name);
      return c;
    },
    async removeCommittee(id) { const c = data.committee.find((x) => x.id === id); await guard(B.delCommittee(id)); log('הסרת חבר/ת ועד', c ? c.name : id); },
    async resetCode(kind, id) { const code = newCode(); await guard(B.setCode(kind, id, code)); log('קוד חדש', (kind === 'admin' ? data.committee : data.parents).find((x) => x.id === id)?.name || id); return code; },

    /* shifts */
    team(date) { return data.shifts[date] || []; },
    async setTeam(date, ids) {
      await guard(B.setTeams({ [date]: ids }));
      log('עדכון שיבוץ', date + ': ' + ids.map((i) => Store.parent(i)?.name).join(', '));
    },
    shiftsOf(pid) { return Object.keys(data.shifts).filter((d) => data.shifts[d].includes(pid)).sort(); },
    async rotate(from, to, overwrite) {
      const before = Object.keys(data.shifts).filter((d) => d < from && data.shifts[d].length).sort().pop();
      const last = before ? data.shifts[before][data.shifts[before].length - 1] : null;
      const map = rotation(data, from, to, overwrite, last);
      await guard(B.setTeams(map));
      const n = Object.keys(map).length;
      log('שיבוץ אוטומטי', `${from} → ${to} (${n} ימים)`);
      return n;
    },
    async clearRange(from, to) {
      const map = {};
      Object.keys(data.shifts).forEach((d) => { if (d >= from && d <= to) map[d] = []; });
      await guard(B.setTeams(map));
      log('ניקוי שיבוץ', `${from} → ${to}`);
    },

    /* attendance */
    rec(date, pid) { return data.attendance[date + '|' + pid] || null; },
    async setRec(date, pid, rec, by) {
      await guard(B.putRec(date, pid, rec ? { ...rec, by: by || rec.by } : null));
      log(by === 'admin' ? 'עריכת נוכחות' : 'דיווח נוכחות', `${Store.parent(pid)?.name} · ${date}`);
    },
    checkIn(date, pid, geo) { return Store.setRec(date, pid, { status: 'present', in: nowHM(), out: '', ...(geo || {}) }, 'self'); },
    checkOut(date, pid) {
      const r = Store.rec(date, pid) || { status: 'present', in: '' };
      return Store.setRec(date, pid, { ...r, out: nowHM() }, 'self');
    },
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

    /* swap requests */
    async requestSwap(pid, date, note) {
      await guard(B.addRequest({ pid, date, note: note || '', status: 'open', t: new Date().toISOString() }));
      log('בקשת החלפה', `${Store.parent(pid)?.name} · ${date}`);
    },
    async resolveRequest(id) { await guard(B.updateRequest(id, { status: 'done', doneAt: new Date().toISOString() })); },

    /* settings / misc */
    async saveSettings(s) { await guard(B.putSettings(s)); log('עדכון הגדרות', ''); },
    enablePush: () => B.enablePush(),
    exportJSON: () => B.exportJSON(),
    importJSON: (t) => B.importJSON(t),
    resetDemo: () => B.resetDemo()
  };

  Store.ready = B.init().catch((e) => { console.error(e); Store.initError = e; });
  window.Store = Store;
})();
