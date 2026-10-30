// נשק וסע – evening reminder for tomorrow's shift.
// Runs from GitHub Actions (see .github/workflows/neshek-vase-reminders.yml).
// Needs the secret FIREBASE_SERVICE_ACCOUNT (the JSON key of a Firebase service account).
import admin from 'firebase-admin';

const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!raw) {
  console.log('FIREBASE_SERVICE_ACCOUNT is not set – reminders are not configured yet. Skipping.');
  process.exit(0);
}
const APP_URL = process.env.APP_URL || 'https://bensharafi7-sys.github.io/banja-official-website/neshek-vase/';

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
const db = admin.firestore();

// "tomorrow" in Israel, as YYYY-MM-DD
const ymd = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(d);
const target = process.env.REMINDER_DATE || ymd(new Date(Date.now() + 24 * 3600 * 1000));
const first = (n) => String(n || '').split(/\s+/)[0];

const settings = { shiftStart: '07:30', shiftEnd: '08:00', ...(await db.doc('settings/main').get()).data() };
const shift = await db.doc('shifts/' + target).get();
const team = (shift.exists && shift.data().team) || [];
if (!team.length) { console.log(`No shift on ${target}.`); process.exit(0); }

const parents = Object.fromEntries((await Promise.all(team.map((id) => db.doc('parents/' + id).get())))
  .filter((d) => d.exists).map((d) => [d.id, d.data()]));

let sent = 0;
for (const pid of team) {
  const p = parents[pid];
  if (!p || !p.uid) { console.log(`${pid}: never signed in – no device to notify.`); continue; }
  const tokDoc = await db.doc('tokens/' + p.uid).get();
  const tokens = (tokDoc.exists && tokDoc.data().tokens) || [];
  if (!tokens.length) { console.log(`${p.name}: notifications not enabled.`); continue; }

  const partners = team.filter((x) => x !== pid).map((x) => first(parents[x]?.name)).filter(Boolean);
  const res = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: {
      title: 'מחר משמרת נשק וסע 🚗',
      body: `${first(p.name)}, מחר ${settings.shiftStart}–${settings.shiftEnd} בפס הירוק${partners.length ? ' עם ' + partners.join(' ו') : ''}. תודה! 💚`
    },
    webpush: { fcmOptions: { link: APP_URL }, notification: { icon: APP_URL + 'icons/icon-192.png', lang: 'he', dir: 'rtl' } }
  });
  sent += res.successCount;

  // forget tokens of uninstalled apps / revoked permissions
  const dead = res.responses.map((r, i) => (!r.success && /registration-token-not-registered|invalid-argument|invalid-registration-token/.test(r.error?.code || '') ? tokens[i] : null)).filter(Boolean);
  if (dead.length) await tokDoc.ref.update({ tokens: admin.firestore.FieldValue.arrayRemove(...dead) });
  console.log(`${p.name}: ${res.successCount}/${tokens.length} delivered.`);
}
console.log(`Done: ${sent} notifications for ${target}.`);
