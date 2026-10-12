
/* ───────── state, player, story cast ───────── */
const S = { money: 0, bags: 0, mi: 0, si: 0, timer: 0, free: false, wanted: 0, storyPolice: false, noWanted: false, trust: null, demir: null, cp: 'start', spawned: {} };
let mode = 'title';
const START = new T.Vector3(-88, 0, -303);
const player = { h: createHuman(REIS), pos: START.clone(), facing: Math.PI / 2, speed: 0, vy: 0, grounded: true, turn: 0, car: null, down: 0,
  hp: 100, dead: false, deadT: 0, weapon: 'fist', hasPistol: false, ammo: 0, reserve: 0, reload: 0, combo: 0, comboT: 0, atkCd: 0, pending: null,
  aiming: false, weaponOut: false, hurtT: 9, lock: null };
scene.add(player.h.root);
// the player's own rigged model (generated from his reference image); the procedural body stays until it is present
attachRealBody(player.h, 'models/reis.glb', { height: 1.78, yaw: Math.PI });
const playerPos = () => player.car ? player.car.pos : player.pos;

const NPC = {};
function npc(key, name, look, x, z, face, solid = true) {
  const h = createHuman(look); h.root.position.set(x, groundH(x, z), z); h.root.rotation.y = face; scene.add(h.root);
  if (solid) addCol(x - 0.3, x + 0.3, z - 0.3, z + 0.3, 2);
  NPC[key] = { h, name, pos: h.root.position, face };
}
npc('selim', 'SELİM', { shirt: 0x5a3a24, under: 0x2a2a2e, pants: 0x24262c, hair: 0x1a120c, sleeves: 'long', build: 0.98, height: 1.76, skin: 0xc89070, brows: 0x1a120c, eyes: 0x3a2412 }, -15, -272.6, Math.PI);
npc('demir', 'DEMİR', { shirt: 0x1e2024, under: 0x3a3a40, pants: 0x1a1a1e, cap: 0x141416, moustache: 1, hair: 0x0d0a08, sleeves: 'long', build: 1.22, belly: 1.08, height: 1.9, skin: 0xb8805a, brows: 0x0d0a08 }, 182, -303, 0, false);
const SPEAKER = { BENJO: () => player.h, 'SELİM': () => NPC.selim.h, 'DEMİR': () => NPC.demir.h };

const blackCar = spawnCar('merc', 0x0c0c10, -84, -299, Math.PI / 2);
const CAR_HOME = [-84, -299, Math.PI / 2];
spawnCar('sahin', 0xf3e3c3, -46, -76.5, Math.PI / 2);
spawnCar('taxi', 0xf2c014, -5, 75, -Math.PI / 2);

/* the warehouse at the docks: Demir's door faces the city, the ledger waits inside */
const WH = { x0: 172, x1: 192, z0: -318, z1: -305, door: [180, 184] };
{
  const wall = mat(0x4a4640, { r: 0.85 }), roofM = mat(0x2a2c30, { r: 0.6, m: 0.3 }), H = 6;
  const wb = (x0, x1, z0, z1) => { mesh(BOX, wall, scene, (x0 + x1) / 2, H / 2, (z0 + z1) / 2, x1 - x0, H, z1 - z0); addCol(x0, x1, z0, z1, H); };
  wb(WH.x0, WH.x0 + 0.4, WH.z0, WH.z1); wb(WH.x1 - 0.4, WH.x1, WH.z0, WH.z1); wb(WH.x0, WH.x1, WH.z0, WH.z0 + 0.4);
  wb(WH.x0, WH.door[0], WH.z1 - 0.4, WH.z1); wb(WH.door[1], WH.x1, WH.z1 - 0.4, WH.z1);
  mesh(BOX, wall, scene, (WH.door[0] + WH.door[1]) / 2, H - 0.8, WH.z1 - 0.2, WH.door[1] - WH.door[0], 1.6, 0.4);
  mesh(BOX, roofM, scene, (WH.x0 + WH.x1) / 2, H + 0.15, (WH.z0 + WH.z1) / 2, WH.x1 - WH.x0 + 0.8, 0.3, WH.z1 - WH.z0 + 0.8);
  mesh(BOX, mat(0x111111, { e: 0xffb860, ei: 5 }), scene, 182, 4.6, WH.z1 + 0.25, 0.6, 0.25, 0.25, false);
  mesh(BOX, mat(0x111111, { e: 0xfff0d0, ei: 3 }), scene, 183, H - 0.1, -311.5, 3, 0.1, 0.4, false);
  for (const [x, z] of [[175, -315], [189, -314], [189, -308.5]]) { mesh(RBOX, mat(0x6b4f32, { r: 0.9 }), scene, x, 0.6, z, 1.2, 1.2, 1.2); addCol(x - 0.6, x + 0.6, z - 0.6, z + 0.6, 1.2); }
  mesh(BOX, mat(0x5a4632, { r: 0.8 }), scene, 183, 0.45, -311.5, 2, 0.9, 1);
  addCol(182, 184, -312, -311, 0.9);
  const doorL = new T.PointLight(0xffb070, 30, 14, 1.6); doorL.position.set(182, 4.2, -301.5); scene.add(doorL);
  neon('DEPO 7', '#9ad8ff', 182, 5.3, WH.z1 + 0.3, 0, 4);
}
const ITEM = {};
{
  const env = grp(scene, 20, 0.15, -300); mesh(BOX, mat(0xe8dcc0, { r: 0.7, e: 0x3a3020, ei: 0.4 }), env, 0, 0, 0, 0.32, 0.03, 0.22); env.visible = false; ITEM.envelope = env;
  const led = grp(scene, 183, 0.98, -311.5); mesh(BOX, mat(0x3a1a12, { r: 0.6, e: 0x4a2a10, ei: 0.5 }), led, 0, 0, 0, 0.3, 0.06, 0.4); mesh(BOX, mat(0xd9ae4f, { m: 1, r: 0.3 }), led, 0, 0.032, 0, 0.31, 0.005, 0.06); ITEM.ledger = led;
}
const TRAFFIC = LOW ? 9 : 16;
for (let i = 0; i < TRAFFIC; i++) {
  const kind = pick(['taxi', 'taxi', 'sahin', 'sahin', 'merc', 'pickup']);
  const col = kind === 'taxi' ? 0xf2c014 : kind === 'merc' ? pick([0x0c0c10, 0x9aa2ab, 0x2c3e5a]) : pick([0xf3e3c3, 0xd9573f, 0x2f8aa0, 0x6fae4a, 0xf2a93b, 0x8a7fc0]);
  const c = spawnCar(kind, col, 0, 0, 0);
  const [a, b, d] = aiRandomSegmentNear(-77, 10, 30, 260); aiPlace(c, a, b, d, rnd(0.2, 0.8));
}
spawnPeds(LOW ? 7 : 14);

/* money bags */
const bags = [];
const bagM = mat(0x8a6238, { r: 0.9 }), bandM = mat(0xf2c35a, { m: 1, r: 0.3, e: 0x6b4a10, ei: 0.6 });
for (let i = 0; i < 12; i++) {
  let x, z;
  do { const a = Math.floor(srand() * 9), b = Math.floor(srand() * 8); x = roadAt(a) + (srand() < 0.5 ? 7.5 : -7.5); z = roadAt(b) + 15 + srand() * 40; } while (Math.abs(x) > 280);
  const g = grp(scene, x, 0.6, z);
  mesh(SPH, bagM, g, 0, 0, 0, 0.32, 0.38, 0.32); mesh(CYL, bandM, g, 0, 0.26, 0, 0.13, 0.08, 0.13); mesh(SPH, bandM, g, 0, 0.36, 0, 0.1, 0.1, 0.1);
  mesh(new T.RingGeometry(0.6, 0.8, 24), new T.MeshBasicMaterial({ color: 0xd9ae4f, transparent: true, opacity: 0.6, side: T.DoubleSide }), g, 0, -0.45, 0, 1, 1, 1, false).rotation.x = -Math.PI / 2;
  bags.push({ g, x, z, got: false });
}
const beacon = grp(scene);
mesh(new T.CylinderGeometry(1.4, 1.4, 70, 24, 1, true), new T.MeshBasicMaterial({ color: 0xffc456, transparent: true, opacity: 0.2, depthWrite: false, blending: T.AdditiveBlending, fog: false, side: T.DoubleSide }), beacon, 0, 35, 0, 1, 1, 1, false);
const beaconRing = mesh(new T.RingGeometry(2.4, 3, 40), new T.MeshBasicMaterial({ color: 0xffc456, transparent: true, opacity: 0.85, side: T.DoubleSide, depthWrite: false }), beacon, 0, 0.2, 0, 1, 1, 1, false);
beaconRing.rotation.x = -Math.PI / 2; beacon.visible = false;

/* ───────── HUD helpers ───────── */
let toastTimer = 0;
function toast(a, b, ms) {
  $('t1').textContent = a; $('t2').textContent = b; $('t1').classList.toggle('bad', /BAŞARISIZ|TUTUKLANDIN/.test(a));
  $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), ms);
}
const floatText = t => toast('', t, 1100);
let promptTxt = null;
const setPrompt = t => { promptTxt = t; };
let hitMarkT = 0;
function hitMarker(kill) { hitMarkT = kill ? 0.3 : 0.12; }
let shake = 0, hurtFlash = 0, slowmo = 0;

/* ───────── damage, death, arrest ───────── */
function hurtPlayer(dmg, fromPos, kind) {
  if (player.dead || mode !== 'play') return;
  player.hp -= dmg; player.hurtT = 0; hurtFlash = Math.min(1, hurtFlash + dmg / 25); shake = Math.max(shake, 0.25);
  player.h.hitK = 1; player.h.hitSide = Math.random() < 0.5 ? 1 : -1;
  if (kind === 'punch' && !player.car) { const d = tmpV.subVectors(player.pos, fromPos).setY(0).normalize(); player.pos.addScaledVector(d, 0.35); }
  if (player.hp <= 0) die();
}
function die() {
  player.dead = true; player.deadT = 0; player.hp = 0; player.h.fallDir = 1; player.aiming = false;
  if (player.car) toggleCar(true);
  sfx('fall', player.pos);
}
function respawn(where, why) {
  $('dead').hidden = true;
  stopVoices();
  const lost = Math.floor(S.money * 0.1); S.money -= lost;
  player.dead = false; player.hp = 100; player.down = 0; player.h.downK = 0; player.pos.copy(where); player.vy = 0;
  S.wanted = 0; clearCops();
  for (const a of [...actors]) if (a.faction === 'police') removeActor(a);
  toast(why, lost ? `₺${lost} פחות בכיס` : 'חזרת לרחוב', 2400);
  if (!S.free && curStep()) { mode = 'play'; loadCheckpoint(S.cp); }
}
function busted() {
  if (player.dead) return;
  sfx('fail'); toast('TUTUKLANDIN', 'נעצרת. שוחררת בערבות מהתחנה', 2600);
  player.dead = true; player.deadT = 2.2;
  setTimeout(() => respawn(START, 'Serbest'), 1600);
}
function clearCops() {
  for (const c of copCars) removeCar(c);
  copCars = []; S.storyPolice = false;
  if (siren && AC) siren.g.gain.setTargetAtTime(0, AC.currentTime, 0.3);
}
onCrash = (c, imp, other) => {
  if (c.driver === 'player') { shake = Math.min(1, imp / 18); sfx('crash', c.pos); if (other && other.police) addWanted(1); }
};
function onActorDown(a) { /* mission counters read actors directly */ }

/* ───────── input ───────── */
const keys = {};
let jumpReq = false, sprintTouch = false, walkToggle = false, camIdle = 0, rmb = false, hbTouch = false;
addEventListener('keydown', e => {
  keys[e.code] = true; if (e.repeat) return;
  if (mode === 'cut' && ['Enter', 'Space', 'KeyF', 'KeyE'].includes(e.code)) { advanceDialog(true); e.preventDefault(); return; }
  if (mode === 'choice' && choiceCb) { if (e.code === 'Digit1') choiceCb('a'); if (e.code === 'Digit2') choiceCb('b'); return; }
  if (mode !== 'play' || player.dead) return;
  if (e.code === 'KeyF' || e.code === 'KeyE') interact();
  if (e.code === 'Space') { jumpReq = true; e.preventDefault(); }
  if (e.code === 'KeyC') walkToggle = !walkToggle;
  if (e.code === 'KeyQ') swapWeapon();
  if (e.code === 'KeyR') startReload();
  if (e.code === 'KeyH' && player.car) { honk(player.car.pos); scarePeds(player.car.pos, 10); }
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; rmb = false; });
const cam = { yaw: Math.PI / 2, pitch: 0.28, pos: new T.Vector3(), look: new T.Vector3() };
const cv = renderer.domElement;
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('mousedown', e => {
  if (mode !== 'play') return;
  const locked = document.pointerLockElement === cv;
  if (!locked && !TOUCH) { try { const r = cv.requestPointerLock?.(); r?.catch?.(() => {}); } catch (err) {} }
  if (e.button === 2) rmb = true;
  if (e.button === 0 && (locked || TOUCH)) attack();
});
addEventListener('mouseup', e => { if (e.button === 2) rmb = false; });
addEventListener('mousemove', e => {
  if (mode !== 'play') return;
  if (document.pointerLockElement === cv) { const k = player.aiming ? 0.0016 : 0.0026; cam.yaw -= e.movementX * k; cam.pitch = clamp(cam.pitch + e.movementY * 0.002, -0.35, 1.1); camIdle = 0; }
});
const joy = { id: null, x: 0, y: 0, ox: 0, oy: 0 }, look = { id: null, x: 0, y: 0 };
const joyEl = $('joy'), knob = $('knob');
joyEl.addEventListener('pointerdown', e => { joy.id = e.pointerId; const r = joyEl.getBoundingClientRect(); joy.ox = r.left + r.width / 2; joy.oy = r.top + r.height / 2; joyMove(e); joyEl.setPointerCapture(e.pointerId); });
joyEl.addEventListener('pointermove', e => { if (e.pointerId === joy.id) joyMove(e); });
const joyEnd = e => { if (e.pointerId !== joy.id) return; joy.id = null; joy.x = joy.y = 0; knob.style.transform = ''; };
joyEl.addEventListener('pointerup', joyEnd); joyEl.addEventListener('pointercancel', joyEnd);
function joyMove(e) {
  let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy; const d = Math.hypot(dx, dy), R = 52;
  if (d > R) { dx *= R / d; dy *= R / d; }
  joy.x = dx / R; joy.y = -dy / R; knob.style.transform = `translate(${dx}px,${dy}px)`;
}
cv.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; });
cv.addEventListener('pointermove', e => {
  if (e.pointerId !== look.id || mode !== 'play') return;
  cam.yaw -= (e.clientX - look.x) * 0.006; cam.pitch = clamp(cam.pitch + (e.clientY - look.y) * 0.004, -0.3, 1.1);
  look.x = e.clientX; look.y = e.clientY; camIdle = 0;
});
const lookEnd = e => { if (e.pointerId === look.id) look.id = null; };
cv.addEventListener('pointerup', lookEnd); cv.addEventListener('pointercancel', lookEnd);
const btn = (id, down, up) => { const el = $(id); el.addEventListener('pointerdown', e => { e.preventDefault(); down(); }); if (up) { el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up); } };
let atkHeld = false;
btn('bAct', () => { if (mode === 'cut') advanceDialog(true); else if (mode === 'play') interact(); });
btn('bJump', () => { if (player.car) hbTouch = true; else jumpReq = true; }, () => hbTouch = false);
btn('bRun', () => sprintTouch = true, () => sprintTouch = false);
btn('bWpn', () => swapWeapon());
btn('bAtk', () => { atkHeld = true; if (mode === 'play') attack(); }, () => atkHeld = false);
$('dlg').addEventListener('click', () => advanceDialog(true));
$('bSnd').addEventListener('click', () => { initAudio(); musicOn = !musicOn; if (musicG) musicG.gain.value = musicOn ? 0.26 : 0; $('bSnd').textContent = musicOn ? '🔊 מוזיקה' : '🔇 מוזיקה'; });

/* ───────── weapons ───────── */
function swapWeapon() {
  if (!player.hasPistol) { toast('', 'אין לך עדיין אקדח', 1200); return; }
  player.weapon = player.weapon === 'fist' ? 'pistol' : 'fist';
  player.h.gun.g.visible = player.weapon === 'pistol';
}
function startReload() {
  if (player.weapon !== 'pistol' || player.reload > 0 || player.ammo >= 12 || player.reserve <= 0) return;
  player.reload = 1.3; sfx('reload');
}
function attack() {
  if (player.dead || player.car || mode !== 'play' || player.down > 0) return;
  if (player.weapon === 'pistol') fire(); else punch();
}
function nearestTarget(maxD, cone, fromFacing) {
  let best = null, bs = 1e9;
  const consider = (o, isHostile) => {
    const dx = o.pos.x - player.pos.x, dz = o.pos.z - player.pos.z, d = Math.hypot(dx, dz);
    if (d > maxD) return;
    const ang = Math.abs(angDiff(fromFacing, Math.atan2(dx, dz)));
    if (ang > cone) return;
    const score = d + ang * 4 - (isHostile ? 20 : 0);
    if (score < bs) { bs = score; best = o; }
  };
  for (const a of actors) if (!a.dead) consider(a, hostile(a) || a.faction === 'gang');
  for (const p of peds) if (p.state !== 'out' && p.h.root.visible) consider(p, false);
  return best;
}
function punch() {
  if (player.atkCd > 0) return;
  player.combo = player.comboT > 0 ? (player.combo + 1) % 3 : 0;
  const type = ['jab', 'cross', 'hook'][player.combo], arm = player.combo === 0 ? 0 : 1, dur = player.combo === 2 ? 0.55 : 0.4;
  player.h.act = { type, arm, t: 0, dur }; player.atkCd = dur * 0.62; player.comboT = 0.95;
  const tgt = nearestTarget(3.2, 1.8, player.facing);
  if (tgt) player.facing = Math.atan2(tgt.pos.x - player.pos.x, tgt.pos.z - player.pos.z);
  player.pending = { t: dur * 0.42, combo: player.combo };
  sfx('whoosh', player.pos);
  if (Math.random() < 0.15) bark(['rb2', 'rb1'], player.h);
}
function resolvePunch(combo) {
  const tgt = nearestTarget(1.9, 1.0, player.facing);
  if (!tgt) return;
  const dmg = combo === 2 ? 36 : 20;
  sfx('punch', player.pos); shake = Math.max(shake, 0.12); slowmo = 0.06; hitMarker(false);
  if (actors.includes(tgt)) {
    hurtActor(tgt, dmg, player.pos, 'punch');
    if (combo === 2 && !tgt.dead) { tgt.stunT = 1.4; tgt.h.fallDir = 1; }
    if (tgt.dead && Math.random() < 0.4) setTimeout(() => bark(['rb1'], player.h), 400);
  } else hurtPed(tgt, dmg, player.pos, 'punch');
}
const aimRay = new T.Raycaster();
function fire() {
  if (player.atkCd > 0 || player.reload > 0) return;
  if (player.ammo <= 0) { sfx('empty'); startReload(); player.atkCd = 0.3; return; }
  player.ammo--; player.atkCd = 0.24;
  const from = muzzle(player.h);
  sfx('gun', player.pos); scarePeds(player.pos, 55); alertGang(player.pos, 45);
  if (copCars.some(c => c.pos.distanceTo(player.pos) < 45) || actors.some(a => a.faction === 'police' && !a.dead && a.pos.distanceTo(player.pos) < 45)) addWanted(1);
  shake = Math.max(shake, 0.08);
  let o, d;
  if (player.aiming && !TOUCH) {
    aimRay.setFromCamera(new T.Vector2(0, 0), camera); o = aimRay.ray.origin.clone(); d = aimRay.ray.direction.clone();
  } else {
    const tgt = player.lock || nearestTarget(32, 0.6, player.facing);
    o = new T.Vector3(player.pos.x, player.pos.y + 1.45, player.pos.z);
    if (tgt) { const c = new T.Vector3(tgt.pos.x + rnd(-0.15, 0.15), tgt.pos.y + rnd(1.0, 1.5), tgt.pos.z + rnd(-0.15, 0.15)); d = c.sub(o).normalize(); player.facing = Math.atan2(d.x, d.z); }
    else d = new T.Vector3(Math.sin(player.facing), 0, Math.cos(player.facing));
  }
  const wall = rayBlock(o, d, 140), hit = rayHit(o, d, Math.min(140, wall), null);
  const tEnd = hit ? hit.t : Math.min(wall, 140);
  tracer(from, o.clone().addScaledVector(d, tEnd));
  if (hit) {
    const dmg = 34 * hit.mul;
    hitMarker(false);
    if (actors.includes(hit.ref)) hurtActor(hit.ref, dmg, player.pos, 'gun'); else hurtPed(hit.ref, dmg, player.pos, 'gun');
  }
  if (player.ammo === 0) setTimeout(startReload, 250);
}

/* ───────── vehicles: enter / exit / hijack ───────── */
function nearestCar() {
  let best = null, bd = 1e9;
  for (const c of cars) {
    if (c.police && copCars.includes(c) && S.wanted > 0) continue;
    const d = Math.hypot(c.pos.x - player.pos.x, c.pos.z - player.pos.z) - c.s.L / 2;
    if (d < 1.6 && d < bd) { bd = d; best = c; }
  }
  return best;
}
function nearSimit() { return simitCarts.find(s => Math.hypot(s.x - player.pos.x, s.z - player.pos.z) < 2.4); }
function interact() {
  if (!player.car) {
    const sc = nearSimit();
    if (sc && !nearestCar()) {
      if (S.money < 20) { toast('', 'אין לך ₺20 לסימיט', 1200); return; }
      S.money -= 20; player.hp = Math.min(100, player.hp + 50); sfx('eat'); toast('', 'Afiyet olsun! ‎+50 חיים', 1300); return;
    }
  }
  toggleCar();
}
function toggleCar(force) {
  if (player.car) {
    const c = player.car;
    if (Math.abs(c.speed) > 6 && !force) { toast('', 'עצור קודם', 1200); return; }
    c.driver = null; if (!force) { c.speed = 0; c.vel.set(0, 0, 0); }
    c.body.remove(player.h.root); scene.add(player.h.root);
    const lx = Math.cos(c.heading), lz = -Math.sin(c.heading);
    player.pos.set(c.pos.x + lx * (c.s.W / 2 + 0.6), 0, c.pos.z + lz * (c.s.W / 2 + 0.6));
    collide(player.pos, 0.35); player.pos.y = groundH(player.pos.x, player.pos.z);
    player.facing = c.heading + Math.PI / 2; player.speed = 0; player.car = null;
    $('speedo').hidden = true; sfx('door', player.pos);
    if (eng) eng.g.gain.setTargetAtTime(0, AC.currentTime, 0.2);
    return;
  }
  if (player.dead) return;
  const c = nearestCar(); if (!c) return;
  if (c.ai) { c.ai = null; toast('', 'הנהג ברח. הרכב שלך עכשיו.', 1400); if (Math.random() < 0.5) addWanted(S.wanted ? 0 : 0); }
  c.driver = 'player'; player.car = c; player.aiming = false; player.h.aimK = 0; player.h.guardK = 0;
  const [sx, sy, sz] = c.s.seat;
  scene.remove(player.h.root); c.body.add(player.h.root);
  player.h.root.position.set(sx, c.s.wr + sy - 0.95, sz); player.h.root.rotation.set(0, 0, 0);
  player.h.body.rotation.x = 0; player.h.body.position.y = 0;
  cam.yaw = c.heading; $('speedo').hidden = false; sfx('door', c.pos);
}
function policeUpdate(c, dt) {
  const tp = playerPos(), dx = tp.x - c.pos.x, dz = tp.z - c.pos.z, d = Math.hypot(dx, dz);
  const diff = angDiff(c.heading, Math.atan2(dx, dz));
  let thr = 1, st = clamp(diff * 2.5, -1, 1);
  if (c.rev > 0) { c.rev -= dt; thr = -1; st = -st; }
  else {
    if (d < 10) thr = c.speed > 3 ? -0.7 : 0;
    else if (Math.abs(diff) > 1.4 && c.speed > 14) thr = 0.1;
    if (Math.abs(c.speed) < 1.5 && d > 11) { c.stuck += dt; if (c.stuck > 1.2) { c.rev = 1.1; c.stuck = 0; } } else c.stuck = 0;
  }
  drive(c, thr, st, false, dt);
  const on = Math.floor(performance.now() / 180) % 2;
  c.body.userData.bar[0].material.emissiveIntensity = on ? 5 : 0.2;
  c.body.userData.bar[1].material.emissiveIntensity = on ? 0.2 : 5;
  if (d > 240) { const [a, b, dd] = aiRandomSegmentNear(tp.x, tp.z, 90, 140); aiPlace(c, a, b, dd); c.ai = null; c.speed = 0; c.unloaded = false; }
}
function knockCheck() {
  for (const c of cars) {
    const sp = Math.abs(c.speed); if (sp < 4) continue;
    for (const [x, z] of carCircles(c)) {
      const R = c.s.W / 2 + 0.4;
      for (const p of peds) if (p.state !== 'out' && Math.hypot(p.pos.x - x, p.pos.z - z) < R) { if (c.driver === 'player') hurtPed(p, 99, c.pos, 'car'); else { p.state = 'flee'; p.stateT = 6; p.flee = c.pos.clone(); p.pos.x += Math.sin(c.heading + 1.5) * 1.2; p.pos.z += Math.cos(c.heading + 1.5) * 1.2; } }
      for (const a of actors) if (!a.dead && Math.hypot(a.pos.x - x, a.pos.z - z) < R) { hurtActor(a, sp * 5, c.pos, 'car'); a.stunT = 2; a.h.fallDir = 1; a.pos.x += Math.sin(c.heading) * 1.5; a.pos.z += Math.cos(c.heading) * 1.5; collide(a.pos, 0.35); }
      if (!player.car && player.down <= 0 && !player.dead && Math.hypot(player.pos.x - x, player.pos.z - z) < R) {
        player.down = 2.2; player.facing = c.heading + Math.PI; hurtPlayer(sp * 1.5, c.pos); sfx('thud', player.pos);
        player.pos.x += Math.sin(c.heading) * 1.5; player.pos.z += Math.cos(c.heading) * 1.5; collide(player.pos, 0.35);
      }
    }
  }
}

/* ───────── story: Görev 01 · Karaköy'den Gelen Telefon ───────── */
const CP_KEY = 'benjo.m01';
const STORY = [
  { ep: "Görev 01 · Karaköy'den Gelen Telefon", steps: [
    { id: 'call1', text: 'הטלפון מצלצל…', cp: 'start', phone: [
      ['ELİF', "בנג'ו, אל תדבר בטלפון. יש עיניים בכל פינה. הרכב השחור ליד הרציף.", 'm_e1'],
      ['BENJO', 'אם רצו שאשאר בחוץ... היו צריכים לסגור את העיר.', 'm_b1'],
      ['ELİF', 'הלילה... אתה לא יודע מי חבר שלך.', 'm_e2'],
    ] },
    { id: 'walk', text: 'לך לאורך הרציף בגשם. הסמן הזהוב במפה.', target: [-40, -296], r: 3.5, tip: true },
    { id: 'call2', text: 'אליף שוב על הקו', phone: [
      ['ELİF', 'סלים מחכה לך ליד המוסך. הוא אומר שיש לו מידע על המחסן... אבל אני לא סומכת עליו.', 'm_e3'],
      ['ELİF', "תחליט, בנג'ו. לסמוך עליו... או לבדוק לבד קודם.", 'm_e4'],
    ], choice: { q: 'אליף לא סומכת על סלים. מה תעשה?', a: 'לסמוך על סלים', b: 'לבדוק לבד קודם', key: 'trust', va: 'selim', vb: 'alone' } },
    { id: 'selim', if: () => S.trust === 'selim', text: 'פגוש את סלים ליד המוסך', target: [-15, -274.5], r: 3, npc: 'selim', dlg: [
      ['SELİM', "בנג'ו... חשבתי שלא אראה אותך יותר. השומר במחסן נקרא דמיר. תגיד לו שמוראט שלח אותך.", 'm_s1'],
      ['BENJO', 'אם אתה משקר לי, סלים... אני אדע.', 'm_b2'],
    ] },
    { id: 'clue', if: () => S.trust === 'alone', text: 'מישהו השאיר מעטפה ליד הלוקנטה. מצא אותה.', target: [20, -300], r: 2.2, item: 'envelope', mono: [
      ['BENJO', 'דמיר... מוראט... אז ככה זה עובד עכשיו.', 'm_b3'],
    ] },
    { id: 'car', text: 'היכנס לרכב השחור ליד הרציף', cp: 'car', enter: true },
    { id: 'drive', text: 'סע למחסן 7 בנמל. עקוב אחרי ה-GPS.', target: [160, -300], r: 9, vehicle: true, gps: true },
    { id: 'demir', text: 'גש לשומר בדלת המחסן', cp: 'wh', target: [182, -301], r: 3, npc: 'demir', dlg: [
      ['DEMİR', 'המחסן סגור. תסתובב... וחזור מאיפה שבאת.', 'm_d1'],
    ], choice: { q: 'דמיר חוסם את הדלת.', a: '"מוראט שלח אותי"', b: 'להיכנס בכוח', key: 'demir', va: 'talk', vb: 'fight' } },
    { id: 'talk', if: () => S.demir === 'talk', text: '', auto: true, npc: 'demir', dlg: [
      ['BENJO', 'מוראט שלח אותי.', 'm_b4'],
      ['DEMİR', '...תיכנס. מהר.', 'm_d2'],
    ] },
    { id: 'fight', if: () => S.demir === 'fight', text: 'דמיר ואנשיו! תוריד אותם', fight: 'wh', pre: [
      ['BENJO', 'אני לא חוזר אחורה.', 'm_b5'],
      ['DEMİR', 'טעות גדולה, חבר.', 'm_d3'],
    ] },
    { id: 'ledger', text: 'קח את הפנקס מהשולחן במחסן', cp: 'ledger', target: [183, -310.2], r: 1.6, item: 'ledger' },
    { id: 'escape', text: 'אנשי מוראט בדרך! ברח מהנמל', escape: [182, -305, 80] },
    { id: 'call3', text: 'אליף מתקשרת', end: true, phone: [
      ['ELİF', 'מצאת את זה? יופי. עכשיו תיעלם משם... מוראט כבר יודע שחזרת.', 'm_e5'],
      ['BENJO', 'שיידע. הלילה הזה רק התחיל.', 'm_b6'],
    ] },
  ] },
];
const curStep = () => (STORY[S.mi] || {}).steps?.[S.si];
const stepIdx = id => STORY[0].steps.findIndex(s => s.id === id);

/* checkpoints: where the player (and the black car) wake up, and what has already happened */
const CPS = {
  start: { p: [-88, -303, Math.PI / 2], car: CAR_HOME },
  car: { p: [-88, -301.5, Math.PI / 2], car: CAR_HOME },
  wh: { p: [168, -300.5, Math.PI / 2], car: [160, -300, Math.PI / 2] },
  ledger: { p: [182, -306.5, Math.PI], car: [160, -300, Math.PI / 2] },
};
function saveCheckpoint(name) {
  S.cp = name;
  try { localStorage.setItem(CP_KEY, JSON.stringify({ cp: name, trust: S.trust, demir: S.demir, money: S.money })); } catch (e) {}
}
function readCheckpoint() { try { return JSON.parse(localStorage.getItem(CP_KEY) || 'null'); } catch (e) { return null; } }
function clearCheckpoint() { try { localStorage.removeItem(CP_KEY); } catch (e) {} }
function placeAtCheckpoint(name) {
  const c = CPS[name] || CPS.start;
  if (player.car) toggleCar(true);
  player.pos.set(c.p[0], 0, c.p[1]); player.pos.y = groundH(c.p[0], c.p[1]); player.facing = c.p[2]; cam.yaw = c.p[2];
  player.speed = 0; player.vy = 0;
  blackCar.pos.set(c.car[0], 0, c.car[1]); blackCar.heading = c.car[2]; blackCar.speed = 0; blackCar.vel.set(0, 0, 0); blackCar.ai = null;
  for (const a of [...actors]) if (a.tag === 'wh' || a.tag === 'esc') removeActor(a);
  S.spawned = {};
  NPC.demir.h.root.visible = S.demir !== 'fight' || name === 'wh';
  if (name === 'wh') { S.demir = null; NPC.demir.pos.set(182, 0, -303); NPC.demir.h.root.rotation.y = 0; }
  if (name === 'ledger' && S.demir === 'talk') { NPC.demir.pos.set(178.5, 0, -302.5); NPC.demir.h.root.rotation.y = Math.PI / 2; }
  ITEM.ledger.visible = true;
}
function loadCheckpoint(name) {
  placeAtCheckpoint(name);
  S.si = stepIdx({ start: 'call1', car: 'car', wh: 'demir', ledger: 'ledger' }[name] || 'call1');
  startStep();
}

function startStep() {
  const st = curStep();
  if (!st) return;
  if (st.if && !st.if()) { S.si++; startStep(); return; }
  $('ep').textContent = STORY[S.mi].ep;
  $('objTxt').textContent = st.text;
  $('timer').hidden = true;
  if (st.cp) saveCheckpoint(st.cp);
  if (st.item) ITEM[st.item].visible = true;
  if (st.id === 'call1') toast("Karaköy'den Gelen Telefon", 'Görev 01', 2600);
  if (st.phone) { sfx('ring'); setTimeout(() => { if (curStep() === st) startDialog(st.phone, null, () => afterTalk(st), { phone: true }); }, 1400); }
  if (st.auto) startDialog(st.dlg, NPC[st.npc], () => afterTalk(st));
  if (st.fight) startDialog(st.pre, NPC.demir, () => spawnFight(st.fight));
  if (st.escape) spawnFight('esc');
  if (st.tip) toast('', TOUCH ? "ג'ויסטיק לתנועה · גרירה למצלמה · ספרינט לריצה" : 'WASD תנועה · Shift ריצה · עכבר מצלמה', 3600);
}
function afterTalk(st) {
  if (st.choice) { showChoice(st.choice, () => completeStep(true)); return; }
  completeStep(true);
}
let choiceCb = null;
function showChoice(c, done) {
  mode = 'choice'; document.exitPointerLock?.();
  $('choiceQ').textContent = c.q; $('choiceA').textContent = c.a; $('choiceB').textContent = c.b; $('choice').hidden = false;
  choiceCb = v => { $('choice').hidden = true; choiceCb = null; S[c.key] = v === 'a' ? c.va : c.vb; mode = 'play'; done(); };
  setTimeout(() => $('choiceA').focus(), 50);
}
$('choiceA').addEventListener('click', () => choiceCb?.('a'));
$('choiceB').addEventListener('click', () => choiceCb?.('b'));
function spawnFight(kind) {
  S.spawned = S.spawned || {}; S.spawned[kind] = true;
  if (kind === 'wh') {
    NPC.demir.h.root.visible = false;
    makeActor('gang', NPC.demir.pos.x, NPC.demir.pos.z, 'fist', { tag: 'wh', alert: true, hp: 140, reward: 300, facing: 0,
      look: { shirt: 0x1e2024, under: 0x3a3a40, pants: 0x1a1a1e, cap: 0x141416, moustache: 1, build: 1.22, belly: 1.08, height: 1.9, skin: 0xb8805a } });
    for (const [x, z] of [[176, -309], [188, -309]]) makeActor('gang', x, z, 'fist', { tag: 'wh', alert: true, hp: 80, reward: 100 });
    combatK = 1;
  }
  if (kind === 'esc') {
    for (const [x, z, w] of [[214, -301, 'fist'], [208, -298, 'fist'], [150, -302, 'fist'], [146, -299, 'pistol']]) makeActor('gang', x, z, w, { tag: 'esc', alert: true, hp: 75, reward: 120 });
    combatK = 1;
  }
}
const fightLeft = tag => actors.filter(a => a.tag === tag && !a.dead).length;
function completeStep(talked) {
  const st = curStep();
  const go = () => {
    if (st.reward) S.money += st.reward;
    if (st.item) { ITEM[st.item].visible = false; sfx('coin'); }
    if (st.id === 'talk') { NPC.demir.pos.set(178.5, 0, -302.5); NPC.demir.h.root.rotation.y = Math.PI / 2; }
    if (st.escape) for (const a of [...actors]) if (a.tag === 'esc') removeActor(a);
    S.si++;
    if (S.si >= STORY[S.mi].steps.length) { finishMission(); return; }
    if (!st.phone && !st.auto) sfx('win');
    startStep();
  };
  if (talked) { go(); return; }
  if (st.dlg) startDialog(st.dlg, NPC[st.npc], st.choice ? () => afterTalk(st) : go);
  else if (st.mono) startDialog(st.mono, null, go);
  else go();
}
function finishMission() {
  S.money += 1500; sfx('win');
  toast('GÖREV TAMAMLANDI', "השיחה מקרקוי  ·  ₺1,500+", 2600);
  clearCheckpoint();
  $('endTxt').textContent = S.trust === 'selim'
    ? 'הפנקס אצלך. סמכת על סלים, והפעם זה עבד. אבל מוראט כבר יודע שחזרת, ובאיסטנבול נאמנות עולה ביוקר.'
    : 'הפנקס אצלך. לא סמכת על אף אחד, ככה שורדים באיסטנבול. אבל מוראט כבר יודע שחזרת.';
  setTimeout(() => { mode = 'end'; $('endCard').hidden = false; document.exitPointerLock?.(); }, 2200);
}
function missionUpdate(dt) {
  const st = curStep();
  if (!st || mode !== 'play' || player.dead || S.free) { beacon.visible = false; return; }
  if (st.phone || st.auto) { beacon.visible = false; return; }
  if (st.enter) {
    beacon.visible = !player.car; beacon.position.set(blackCar.pos.x, 0, blackCar.pos.z);
    if (player.car === blackCar) completeStep();
    else if (player.car) setPrompt('זה לא הרכב. הרכב השחור ליד הרציף.');
    return;
  }
  if (st.fight) {
    beacon.visible = false;
    if (dlg) return;
    const left = fightLeft(st.fight);
    $('objTxt').textContent = `${st.text} (${left} נותרו)`;
    if (left === 0 && S.spawned?.[st.fight] && !S.fightEnding) { S.fightEnding = true; setTimeout(() => { S.fightEnding = false; if (curStep() === st) completeStep(); }, 1200); }
    return;
  }
  const pp = playerPos();
  if (st.escape) {
    const [ex, ez, er] = st.escape, d = Math.hypot(pp.x - ex, pp.z - ez);
    beacon.visible = false;
    $('objTxt').textContent = `${st.text} (${Math.max(0, Math.ceil(er - d))} מ׳)`;
    if (d > er) completeStep();
    return;
  }
  const tx = st.target[0], tz = st.target[1];
  beacon.visible = true; beacon.position.set(tx, groundH(tx, tz), tz);
  beaconRing.scale.setScalar(st.r / 3 * (1 + Math.sin(performance.now() / 300) * 0.06));
  if (st.item) { const it = ITEM[st.item]; it.rotation.y += dt * 1.5; }
  const d = Math.hypot(pp.x - tx, pp.z - tz);
  if (d < st.r) {
    if (st.vehicle && !player.car) { setPrompt('צריך להגיע עם רכב'); return; }
    if (player.car) { if (Math.abs(player.car.speed) > 4) { setPrompt('עצור את הרכב'); return; } if (!st.vehicle) toggleCar(); }
    completeStep();
  }
}

/* GPS: an L-shaped route over the street grid, recomputed twice a second */
let gps = [], gpsT = 0;
function updateGPS(dt) {
  const st = curStep();
  if (!st || !st.gps || mode !== 'play') { gps = []; return; }
  if ((gpsT -= dt) > 0) return; gpsT = 0.5;
  const pp = playerPos(), [tx, tz] = st.target;
  const snap = v => roadAt(clamp(Math.round((v - ORG) / BLK), 0, NB));
  const ax = snap(pp.x), az = snap(pp.z), bx = snap(tx), bz = snap(tz);
  if (Math.hypot(tx - pp.x, tz - pp.z) < 60 || (Math.abs(pp.z - tz) < 14 && pp.z < -286)) { gps = [[pp.x, pp.z], [tx, tz]]; return; }
  gps = [[pp.x, pp.z], [ax, az], [bx, az], [bx, bz], [tx, tz]];
}

/* ───────── dialogue: voiced, lip-synced, over-the-shoulder shots (or a close-up on a phone call) ───────── */
let dlg = null;
function startDialog(lines, who, done, opts = {}) {
  if (player.car && who) toggleCar(true);
  if (player.car) { player.car.speed = 0; player.car.vel.set(0, 0, 0); }
  mode = 'cut'; document.body.classList.add('cine'); document.exitPointerLock?.();
  player.aiming = false; player.h.guardK = 0; player.speed = 0;
  const n = who;
  if (n) {
    let ox = player.pos.x - n.pos.x, oz = player.pos.z - n.pos.z; const ol = Math.hypot(ox, oz) || 1;
    player.pos.set(n.pos.x + ox / ol * 1.9, 0, n.pos.z + oz / ol * 1.9); collide(player.pos, 0.35);
    player.pos.y = groundH(player.pos.x, player.pos.z);
    player.facing = Math.atan2(n.pos.x - player.pos.x, n.pos.z - player.pos.z);
    n.h.root.rotation.y = Math.atan2(player.pos.x - n.pos.x, player.pos.z - n.pos.z);
  }
  dlg = { lines, i: -1, who: n, done, t: 0, cut: true, at: performance.now(), auto: 0, phone: !!opts.phone };
  setTimeout(() => advanceDialog(false), 700);
}
function advanceDialog(user) {
  if (!dlg) return;
  if (user && dlg.i >= 0 && performance.now() - dlg.at < 400) return;
  stopVoices();
  dlg.i++; dlg.t = 0; dlg.at = performance.now(); dlg.cut = true;
  if (dlg.i >= dlg.lines.length) {
    $('dlg').hidden = true; document.body.classList.remove('cine');
    const d = dlg.done; dlg = null; mode = 'play'; d && d(); return;
  }
  const [w, l, vid] = dlg.lines[dlg.i];
  $('who').textContent = w + (w === 'ELİF' ? '  ·  📞' : ''); $('line').textContent = l; $('dlg').hidden = false;
  $('dlgFace').hidden = w !== 'BENJO';
  const dur = say(vid, SPEAKER[w]?.(), null, { phone: w === 'ELİF' });
  dlg.auto = (dur || Math.max(2.5, l.length * 0.075)) + 0.6;
}
function cutCamera(dt) {
  if (!dlg) return;
  dlg.t += dt;
  if (dlg.i >= 0 && dlg.t > dlg.auto) advanceDialog(false);
  if (!dlg) return;
  let want, lookAt;
  const P = playerPos();
  if (!dlg.who && player.car) {
    const c = player.car, hw = player.h.root.getWorldPosition(new T.Vector3());
    let ox = hw.x - c.pos.x, oz = hw.z - c.pos.z; const ol = Math.hypot(ox, oz);
    if (ol < 0.1) { ox = Math.cos(c.heading); oz = -Math.sin(c.heading); } else { ox /= ol; oz /= ol; }
    const fx = Math.sin(c.heading), fz = Math.cos(c.heading);
    want = new T.Vector3(hw.x + ox * 2.3 + fx * 0.9, hw.y + 1.25, hw.z + oz * 2.3 + fz * 0.9);
    lookAt = new T.Vector3(hw.x, hw.y + 1.05, hw.z);
  } else if (!dlg.who) {
    // close-up: slightly off-axis in front of Benjo, slow push-in, rain between us and him
    const f = player.car ? player.car.heading : player.facing, fx = Math.sin(f), fz = Math.cos(f), rx = -fz, rz = fx, push = Math.min(dlg.t, 6) * 0.04;
    const side = dlg.i % 2 ? -1 : 1, base = player.car ? 1.25 : 1.62;
    want = new T.Vector3(P.x + fx * (2.1 - push) + rx * 0.6 * side, P.y + base + 0.12, P.z + fz * (2.1 - push) + rz * 0.6 * side);
    lookAt = new T.Vector3(P.x, P.y + base - 0.06, P.z);
  } else {
    const speakerIsBenjo = dlg.i < 0 || dlg.lines[dlg.i][0] === 'BENJO';
    const S1 = speakerIsBenjo ? player.pos : dlg.who.pos, L1 = speakerIsBenjo ? dlg.who.pos : player.pos;
    let dx = S1.x - L1.x, dz = S1.z - L1.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
    const rx = -dz, rz = dx, drift = dlg.t * 0.035;
    want = new T.Vector3(L1.x - dx * 1.5 + rx * (0.85 + drift), L1.y + 1.78, L1.z - dz * 1.5 + rz * (0.85 + drift));
    lookAt = new T.Vector3(S1.x, S1.y + 1.62, S1.z);
  }
  if (dlg.cut) { cam.pos.copy(want); cam.look.copy(lookAt); dlg.cut = false; }
  cam.pos.lerp(want, damp(4, dt)); cam.look.lerp(lookAt, damp(5, dt));
  camera.position.copy(cam.pos); camera.lookAt(cam.look);
  if (Math.abs(camera.fov - 40) > 0.1) { camera.fov = 40; camera.updateProjectionMatrix(); }
}
/* ───────── Tayfun's turf (free roam): crews hang out, defend their corner ───────── */
const turf = GANG_BLOCKS.map(([i, j]) => ({ cx: ORG + BLK / 2 + i * BLK, cz: ORG + BLK / 2 + j * BLK, cool: 0, spawned: false, tag: 'turf' + i + j }));
function updateTurf(dt) {
  const pp = playerPos();
  for (const t of turf) {
    t.cool -= dt;
    const d = Math.hypot(t.cx - pp.x, t.cz - pp.z);
    if (!t.spawned && t.cool <= 0 && d < 110 && d > 45 && S.free) {
      t.spawned = true;
      const cx = t.cx + 27.5, cz = t.cz - 27.5;
      makeActor('gang', cx, cz, 'fist', { tag: t.tag, facing: 0 }); makeActor('gang', cx - 1.4, cz + 0.9, 'fist', { tag: t.tag, facing: 2 });
      makeActor('gang', cx + 0.6, cz + 1.8, S.mi >= 3 ? 'pistol' : 'fist', { tag: t.tag, facing: 4 });
    }
    if (t.spawned) {
      const left = actors.filter(a => a.tag === t.tag && !a.dead);
      if (!left.length) { t.spawned = false; t.cool = 150; if (d < 60) toast('', 'השטח של מוראט נוקה', 1600); }
      else if (d > 170 && !left.some(a => a.alert)) { for (const a of [...actors]) if (a.tag === t.tag) removeActor(a); t.spawned = false; }
    }
  }
}

/* ───────── minimap ───────── */
const MAPC = document.createElement('canvas'); MAPC.width = 640; MAPC.height = 680;
{
  const g = MAPC.getContext('2d'), mx = x => x + 320, mz = z => z + 360;
  g.fillStyle = '#5a5060'; g.fillRect(0, 0, 640, 680);
  g.fillStyle = '#2f8aa0'; g.fillRect(0, 0, 640, mz(-320));
  g.fillStyle = '#9b8670'; g.fillRect(0, mz(-320), 640, 34);
  g.fillStyle = 'rgba(200,50,58,.35)'; for (const [i, j] of GANG_BLOCKS) g.fillRect(mx(ORG + 6 + i * BLK), mz(ORG + 6 + j * BLK), 58, 58);
  g.fillStyle = '#a99c8f';
  for (let k = 0; k <= NB; k++) { g.fillRect(mx(roadAt(k)) - 6, mz(-286), 12, 572); g.fillRect(mx(-286), mz(roadAt(k)) - 6, 572, 12); }
  g.fillStyle = '#3b3442'; for (const [x0, x1, z0, z1] of footprints) g.fillRect(mx(x0), mz(z0), x1 - x0, z1 - z0);
  g.fillStyle = '#6fae4a'; for (const [i, j] of [[6, 6], [2, 1], [0, 3]]) g.fillRect(mx(ORG + 9 + i * BLK), mz(ORG + 9 + j * BLK), 52, 52);
  g.fillStyle = '#f0e4d0'; g.beginPath(); g.arc(mx(-35), mz(-31), 12, 0, TAU); g.fill();
  g.beginPath(); g.arc(mx(105), mz(35), 7, 0, TAU); g.fill();
}
const mm = $('minimap').getContext('2d');
function drawMinimap() {
  const W = 300, sc = player.car ? 0.9 : 1.5, pp = playerPos();
  mm.save(); mm.fillStyle = '#1d1a17'; mm.fillRect(0, 0, W, W);
  mm.translate(W / 2, W / 2);
  mm.rotate(-Math.PI / 2 - Math.atan2(Math.cos(cam.yaw), Math.sin(cam.yaw))); mm.scale(sc, sc);
  mm.drawImage(MAPC, -(pp.x + 320), -(pp.z + 360));
  const dot = (x, z, c, r) => { mm.fillStyle = c; mm.beginPath(); mm.arc(x - pp.x, z - pp.z, r / sc, 0, TAU); mm.fill(); };
  for (const b of bags) if (!b.got) dot(b.x, b.z, '#9be36a', 3.5);
  for (const a of actors) if (!a.dead) dot(a.pos.x, a.pos.z, a.faction === 'police' ? '#5b8cff' : (a.alert ? '#ff3b3b' : '#c06060'), 4);
  for (const c of copCars) dot(c.pos.x, c.pos.z, Math.floor(performance.now() / 200) % 2 ? '#ff3030' : '#3060ff', 5);
  const st = curStep();
  if (gps.length > 1) {
    mm.strokeStyle = 'rgba(0,0,0,.6)'; mm.lineWidth = 9 / sc; mm.lineJoin = 'round';
    for (const pass of [0, 1]) { mm.beginPath(); for (let i = 0; i < gps.length; i++) mm[i ? 'lineTo' : 'moveTo'](gps[i][0] - pp.x, gps[i][1] - pp.z); mm.stroke(); mm.strokeStyle = '#ffc456'; mm.lineWidth = 5 / sc; }
  }
  if (st && mode === 'play' && !S.free && (st.target || st.enter)) {
    let tx = st.enter ? blackCar.pos.x : st.target[0], tz = st.enter ? blackCar.pos.z : st.target[1];
    let dx = tx - pp.x, dz = tz - pp.z; const d = Math.hypot(dx, dz), lim = (W / 2 - 10) / sc;
    if (d > lim) { dx *= lim / d; dz *= lim / d; }
    mm.fillStyle = '#ffc456'; mm.strokeStyle = '#000'; mm.lineWidth = 2 / sc; mm.beginPath(); mm.arc(dx, dz, 7 / sc, 0, TAU); mm.fill(); mm.stroke();
  }
  const fa = player.car ? player.car.heading : player.facing;
  mm.rotate(Math.atan2(Math.cos(fa), Math.sin(fa)) + Math.PI / 2); mm.scale(1 / sc, 1 / sc);
  mm.fillStyle = '#fff4e0'; mm.strokeStyle = '#000'; mm.lineWidth = 2;
  mm.beginPath(); mm.moveTo(0, -11); mm.lineTo(8, 9); mm.lineTo(0, 4); mm.lineTo(-8, 9); mm.closePath(); mm.fill(); mm.stroke();
  mm.restore();
}

/* ───────── player update ───────── */
function updateFoot(dt) {
  const P = player, h = P.h;
  P.atkCd -= dt; P.comboT -= dt;
  if (P.reload > 0) { P.reload -= dt; if (P.reload <= 0) { const n = Math.min(12 - P.ammo, P.reserve); P.ammo += n; P.reserve -= n; } }
  if (P.pending) { P.pending.t -= dt; if (P.pending.t <= 0) { resolvePunch(P.pending.combo); P.pending = null; } }
  if (P.dead) {
    P.deadT += dt; animateHuman(h, dt, 0, { down: true });
    h.root.position.copy(P.pos); h.root.rotation.y = P.facing;
    if (P.deadT > 1.8 && $('dead').hidden && mode === 'play' && P.hp <= 0) { $('dead').hidden = false; setTimeout(() => respawn(START, 'Hastane'), 2600); }
    return;
  }
  if (P.down > 0) {
    P.down -= dt; animateHuman(h, dt, 0, { down: P.down > 0.8 });
    h.root.position.copy(P.pos); h.root.rotation.y = P.facing; return;
  }
  let ix = 0, iz = 0;
  if (keys.KeyW || keys.ArrowUp) iz += 1; if (keys.KeyS || keys.ArrowDown) iz -= 1;
  if (keys.KeyD || keys.ArrowRight) ix += 1; if (keys.KeyA || keys.ArrowLeft) ix -= 1;
  if (joy.id != null) { ix = joy.x; iz = joy.y; }
  const mag = Math.min(1, Math.hypot(ix, iz));
  const fx = Math.sin(cam.yaw), fz = Math.cos(cam.yaw), rx = -fz, rz = fx;
  let dx = fx * iz + rx * ix, dz = fz * iz + rz * ix; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
  P.weaponOut = P.weapon === 'pistol';
  P.aiming = P.weapon === 'pistol' && (rmb || (TOUCH && atkHeld));
  // combat stance when enemies are close
  const threat = actors.some(a => hostile(a) && a.pos.distanceTo(P.pos) < 9);
  const guard = P.weapon === 'fist' && (threat || P.comboT > 0);
  let target = 0;
  const sprint = keys.ShiftLeft || keys.ShiftRight || sprintTouch;
  if (mag > 0.12) {
    if (joy.id != null) target = mag < 0.65 ? lerp(0.9, 2.2, (mag - 0.12) / 0.53) : lerp(2.2, 5.2, (mag - 0.65) / 0.35);
    else target = walkToggle ? 1.9 : 4.6;
    if (sprint && !P.aiming) target = 7.2;
    if (P.aiming) target = Math.min(target, 2.3);
    if (guard && !sprint) target = Math.min(target, 3.2);
  }
  if (h.act) target *= 0.4;
  P.speed = lerp(P.speed, target, damp(target > P.speed ? 4.5 : 8, dt));
  let moveDir = P.facing;
  if (P.aiming && !TOUCH) {
    const d = angDiff(P.facing, cam.yaw); P.facing += clamp(d, -14 * dt, 14 * dt); P.turn = 0;
    if (mag > 0.12) moveDir = Math.atan2(dx, dz);
  } else if (P.aiming && TOUCH) {
    P.lock = nearestTarget(35, Math.PI, cam.yaw);
    if (P.lock) { const want = Math.atan2(P.lock.pos.x - P.pos.x, P.lock.pos.z - P.pos.z); P.facing += clamp(angDiff(P.facing, want), -12 * dt, 12 * dt); }
    if (mag > 0.12) moveDir = Math.atan2(dx, dz);
  } else if (mag > 0.12) {
    const d = angDiff(P.facing, Math.atan2(dx, dz)), ts = lerp(10, 6, clamp(P.speed / 7, 0, 1));
    const s = clamp(d, -ts * dt, ts * dt); P.facing += s; P.turn = s / dt; moveDir = P.facing;
  } else P.turn = lerp(P.turn, 0, damp(10, dt));
  if (!P.aiming) P.lock = null;
  if (TOUCH && atkHeld && P.weapon === 'pistol' && P.atkCd <= 0) fire();
  P.pos.x += Math.sin(moveDir) * P.speed * dt; P.pos.z += Math.cos(moveDir) * P.speed * dt;
  if (h.act && h.act.t < h.act.dur * 0.45) { P.pos.x += Math.sin(P.facing) * 1.4 * dt; P.pos.z += Math.cos(P.facing) * 1.4 * dt; }
  collide(P.pos, 0.35);
  for (const c of cars) for (const [x, z] of carCircles(c)) {
    const ox = P.pos.x - x, oz = P.pos.z - z, d = Math.hypot(ox, oz), R = c.s.W / 2 + 0.35;
    if (d < R && d > 1e-4) { P.pos.x = x + ox / d * R; P.pos.z = z + oz / d * R; }
  }
  P.pos.x = clamp(P.pos.x, BOUND.x0, BOUND.x1); P.pos.z = clamp(P.pos.z, BOUND.z0, BOUND.z1);
  const gh = groundH(P.pos.x, P.pos.z);
  if (P.grounded && jumpReq) { P.vy = 5.2; P.grounded = false; }
  jumpReq = false;
  P.vy -= 15 * dt; P.pos.y += P.vy * dt;
  if (P.pos.y <= gh) { P.pos.y = gh; P.vy = 0; P.grounded = true; } else if (P.pos.y - gh > 0.2) P.grounded = false;
  h.root.position.copy(P.pos); h.root.rotation.y = P.facing;
  h.aimPitch = P.aiming ? clamp(-(cam.pitch - 0.12) * 0.9, -0.6, 0.5) : 0;
  const relMove = P.aiming ? Math.abs(angDiff(P.facing, moveDir)) > 2 ? -P.speed : P.speed : P.speed;
  animateHuman(h, dt, Math.abs(relMove), { air: !P.grounded, turn: P.turn, guard, aim: P.aiming || (P.weapon === 'pistol' && P.atkCd > 0), angry: threat || P.aiming });
  // regenerate slowly after a while out of danger
  P.hurtT += dt; if (P.hurtT > 6 && P.hp < 60) P.hp = Math.min(60, P.hp + 4 * dt);
  const c = nearestCar(), sc = nearSimit();
  setPrompt(c ? (TOUCH ? 'הקש "רכב" כדי להיכנס' : 'F — היכנס לרכב') : sc ? (TOUCH ? 'הקש "רכב" לסימיט ב־₺20' : 'F — סימיט ב־₺20 (+50 חיים)') : null);
  $('bAct').classList.toggle('hot', !!(c || sc));
}
function updateDrive(dt) {
  const c = player.car;
  let thr = 0, st = 0;
  if (keys.KeyW || keys.ArrowUp) thr += 1; if (keys.KeyS || keys.ArrowDown) thr -= 1;
  if (keys.KeyA || keys.ArrowLeft) st += 1; if (keys.KeyD || keys.ArrowRight) st -= 1;
  if (joy.id != null) { thr = Math.abs(joy.y) > 0.2 ? joy.y : 0; st = -joy.x; }
  drive(c, thr, st, keys.Space || hbTouch, dt);
  player.pos.set(c.pos.x, 0, c.pos.z);
  animateHuman(player.h, dt, 0, { seated: true, car: true, steer: c.steer });
  $('speedo').firstChild.nodeValue = Math.round(Math.abs(c.speed) * 3.6);
  if (eng) {
    const gear = Math.min(4, Math.floor(Math.abs(c.speed) / 10)), w = (Math.abs(c.speed) % 10) / 10;
    const f = 42 + gear * 9 + w * 55 + Math.abs(thr) * 8;
    eng.o.frequency.setTargetAtTime(f, AC.currentTime, 0.05); eng.o2.frequency.setTargetAtTime(f * 0.5, AC.currentTime, 0.05);
    eng.g.gain.setTargetAtTime(0.05 + Math.abs(thr) * 0.03, AC.currentTime, 0.1);
  }
  setPrompt(TOUCH ? null : (Math.abs(c.speed) < 6 ? 'F — צא מהרכב · H — צופר' : null));
  $('bAct').classList.remove('hot');
}
function followCamera(dt) {
  const inCar = !!player.car, P = player;
  const tp = inCar ? P.car.pos : P.pos;
  camIdle += dt;
  if (inCar && camIdle > 1.2 && Math.abs(P.car.speed) > 2) { cam.yaw += angDiff(cam.yaw, P.car.heading) * damp(2.2, dt); cam.pitch = lerp(cam.pitch, 0.22, damp(1.5, dt)); }
  const aim = P.aiming && !TOUCH;
  const dist = inCar ? 7.5 + Math.abs(P.car.speed) * 0.05 : aim ? 2.1 : P.dead ? 5.5 : 4.2;
  const h = inCar ? 1.6 : aim ? 1.62 : 1.55;
  const fx = Math.sin(cam.yaw), fz = Math.cos(cam.yaw), rx = -fz, rz = fx, sh = inCar ? 0 : aim ? 0.62 : 0.45;
  const target = new T.Vector3(tp.x + rx * sh, tp.y + h, tp.z + rz * sh);
  let d = dist;
  for (; d > 1.2; d -= 0.4) {
    const x = target.x - fx * d * Math.cos(cam.pitch), z = target.z - fz * d * Math.cos(cam.pitch), y = target.y + d * Math.sin(cam.pitch);
    if (!insideBuilding(x, y, z)) break;
  }
  const want = new T.Vector3(target.x - fx * d * Math.cos(cam.pitch), Math.max(0.4, target.y + d * Math.sin(cam.pitch)), target.z - fz * d * Math.cos(cam.pitch));
  cam.pos.lerp(want, damp(inCar ? 9 : aim ? 22 : 14, dt));
  cam.look.lerp(aim ? target.clone().addScaledVector(new T.Vector3(fx, -Math.sin(cam.pitch) * 0.9, fz), 10) : target, damp(aim ? 30 : 20, dt));
  camera.position.copy(cam.pos);
  if (shake > 0) { camera.position.x += rnd(-1, 1) * shake * 0.3; camera.position.y += rnd(-1, 1) * shake * 0.3; shake = Math.max(0, shake - dt * 2.5); }
  camera.lookAt(cam.look);
  const fov = inCar ? 60 + Math.abs(P.car.speed) * 0.35 : aim ? 42 : 56;
  if (Math.abs(camera.fov - fov) > 0.1) { camera.fov = lerp(camera.fov, fov, damp(8, dt)); camera.updateProjectionMatrix(); }
}
let titleT = 0;
function titleCamera(dt) {
  titleT += dt * 0.05;
  camera.position.set(-35 + Math.sin(titleT) * 80, 62 + Math.sin(titleT * 0.7) * 6, -35 + Math.cos(titleT) * 80);
  camera.lookAt(-35, 16, -31); cam.pos.copy(camera.position);
}

/* ───────── frame ───────── */
const flagPos = window.__flag?.geometry.attributes.position, flagX = flagPos && Float32Array.from({ length: flagPos.count }, (_, i) => flagPos.getX(i));
function waveFlag(t) {
  if (!flagPos) return;
  for (let i = 0; i < flagPos.count; i++) { const x = flagX[i], k = (x + 1.5) / 3; flagPos.setZ(i, Math.sin(t * 5 - x * 2.4) * 0.22 * k + Math.sin(t * 9.3 - x * 4) * 0.05 * k); }
  flagPos.needsUpdate = true;
}
const tmpProj = new T.Vector3();
function update(dt) {
  worldT += dt; updateLights(worldT);
  setPrompt(null);
  listener.copy(camera.position);
  if (mode === 'play') { if (player.car) updateDrive(dt); else updateFoot(dt); }
  else if (!player.car) { animateHuman(player.h, dt, 0, { phone: !!(dlg && dlg.phone) }); player.h.root.rotation.y = player.facing; player.h.root.position.copy(player.pos); }
  else animateHuman(player.h, dt, 0, { seated: true, phone: !!(dlg && dlg.phone) });
  syncRealBody(player.h, dt, player.car ? 0 : (mode === 'play' ? player.speed : 0), { seated: !!player.car, car: !!player.car });
  const pp = playerPos();
  const obstacles = cars.map(c => c.pos);
  const pObs = { x: pp.x, z: pp.z, isPlayer: true }; obstacles.push(pObs);
  for (const p of peds) if (p.h.root.visible && p.state !== 'sit') obstacles.push(p.pos);
  for (const a of actors) obstacles.push(a.pos);
  for (const c of cars) {
    if (c === player.car) continue;
    if (c.police) { if (mode === 'play' && copCars.includes(c) && S.wanted > 0) policeUpdate(c, dt); else if (Math.abs(c.speed) > 0.05) drive(c, 0, 0, true, dt); continue; }
    if (c.ai) {
      if (Math.hypot(c.pos.x - pp.x, c.pos.z - pp.z) > 240) { const [a, b, d] = aiRandomSegmentNear(pp.x, pp.z, 90, 180); aiPlace(c, a, b, d, rnd(0.2, 0.8)); }
      aiUpdate(c, dt, obstacles);
    } else if (Math.abs(c.speed) > 0.05 || c.vel.lengthSq() > 0.01) drive(c, 0, 0, true, dt);
  }
  carVsCar(); knockCheck();
  for (const p of peds) pedUpdate(p, dt);
  for (const a of [...actors]) {
    if (a.stunT > 0) { a.stunT -= dt; animateHuman(a.h, dt, 0, { down: a.stunT > 0.5 }); continue; }
    actorUpdate(a, dt);
  }
  for (const k in NPC) {
    const n = NPC[k];
    if (Math.hypot(n.pos.x - player.pos.x, n.pos.z - player.pos.z) < 90) animateHuman(n.h, dt, 0, dlg && dlg.who === n ? { lookAt: 0, eyeYaw: 0 } : { angry: k === 'demir' && S.demir !== 'talk' });
  }
  updateLipSync(); updateFX(dt); updateWanted(dt); updateTurf(dt); updateGPS(dt);
  updateRain(dt, camera.position); waveFlag(worldT);
  combatK = lerp(combatK, actors.some(a => hostile(a) && !a.dead && a.pos.distanceTo(pp) < 50) || S.wanted >= 2 ? 1 : 0, damp(0.8, dt));
  const now = performance.now() / 1000;
  for (const b of bags) {
    if (b.got) continue;
    b.g.rotation.y = now * 1.6; b.g.position.y = 0.75 + Math.sin(now * 2 + b.x) * 0.12;
    if (mode === 'play' && Math.hypot(b.x - pp.x, b.z - pp.z) < 1.9) { b.got = true; scene.remove(b.g); S.money += 250; S.bags++; sfx('coin'); toast('', `שק כסף ${S.bags}/12  ·  ₺250+`, 1300); }
  }
  if (siren && AC) {
    let md = 1e9; for (const c of copCars) md = Math.min(md, Math.hypot(c.pos.x - pp.x, c.pos.z - pp.z));
    siren.o.frequency.setTargetAtTime(760 + Math.sin(now * 5) * 190, AC.currentTime, 0.02);
    siren.g.gain.setTargetAtTime(S.wanted > 0 ? clamp(1 - md / 160, 0, 1) * 0.05 : 0, AC.currentTime, 0.1);
  }
  missionUpdate(dt);
  if (mode === 'play' || mode === 'end') followCamera(dt); else if (mode === 'cut') cutCamera(dt); else if (mode === 'title') titleCamera(dt);
  const fc = mode === 'title' ? new T.Vector3(-35, 0, -35) : pp;
  sun.position.set(fc.x + sunDir.x * 200, sunDir.y * 200, fc.z + sunDir.z * 200);
  sun.target.position.set(fc.x, 0, fc.z); sun.target.updateMatrixWorld();
  sky.position.copy(camera.position);
  // HUD
  $('money').firstChild.nodeValue = '₺ ' + S.money.toLocaleString('en-US');
  $('bags').textContent = `${S.bags}/12 שקים`;
  $('prompt').hidden = !promptTxt || mode !== 'play'; if (promptTxt) $('prompt').textContent = promptTxt;
  $('hp').firstChild.style.width = clamp(player.hp, 0, 100) + '%'; $('hp').classList.toggle('low', player.hp < 30);
  $('wpnTxt').textContent = player.weapon === 'pistol' ? (player.reload > 0 ? 'טוען…' : `אקדח  ${player.ammo} / ${player.reserve}`) : 'אגרופים';
  $('stars').innerHTML = '<b>' + '★'.repeat(S.wanted) + '</b>' + '★'.repeat(3 - S.wanted);
  $('wanted').classList.toggle('flash', S.wanted > 0 && Math.floor(now * 3) % 2 === 0);
  const showCross = mode === 'play' && !player.car && player.weapon === 'pistol' && (player.aiming || TOUCH);
  const cr = $('cross'); cr.hidden = !showCross;
  if (showCross && TOUCH && player.lock) {
    tmpProj.set(player.lock.pos.x, player.lock.pos.y + 1.3, player.lock.pos.z).project(camera);
    cr.className = 'lock'; cr.style.left = ((tmpProj.x + 1) / 2 * innerWidth) + 'px'; cr.style.top = ((1 - tmpProj.y) / 2 * innerHeight) + 'px';
  } else if (showCross) { cr.className = hitMarkT > 0 ? 'hit' : ''; cr.style.left = '50%'; cr.style.top = '50%'; }
  hitMarkT -= dt;
  $('bAtk').textContent = player.weapon === 'pistol' ? 'ירי' : 'אגרוף';
  $('bJump').textContent = player.car ? 'בלם יד' : 'קפוץ';
  hurtFlash = Math.max(0, hurtFlash - dt * 1.5);
  $('hurt').style.opacity = Math.max(hurtFlash, player.hp < 30 && mode === 'play' ? 0.35 + Math.sin(now * 4) * 0.1 : 0);
}
let last = performance.now(), frame = 0;
function loop(now) {
  requestAnimationFrame(loop);
  let dt = clamp((now - last) / 1000, 0, 0.05); last = now;
  if (slowmo > 0) { slowmo -= dt; dt *= 0.25; }
  update(dt);
  if (frame++ % 2 === 0 && mode !== 'title') drawMinimap();
  if (composer) composer.render(); else renderer.render(scene, camera);
}
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer?.setSize(innerWidth, innerHeight); });

/* ───────── boot ───────── */
if (TOUCH) { document.body.classList.add('touch'); $('touch').hidden = false; $('keysInfo').textContent = 'ג׳ויסטיק לתנועה ונהיגה · גרירה לסיבוב מצלמה · "אגרוף/ירי" לתקיפה עם נעילה אוטומטית · "נשק" להחלפה'; }
const startBtn = $('start');
startBtn.disabled = false; startBtn.textContent = 'התחל משימה 01';
const saved = readCheckpoint();
if (saved && saved.cp && saved.cp !== 'start') $('resume').hidden = false;
async function beginGame(cp) {
  initAudio();
  startBtn.disabled = true; $('resume').disabled = true; startBtn.textContent = 'טוען קולות…';
  const t0 = performance.now();
  while (!voicesReady && performance.now() - t0 < 8000) await new Promise(r => setTimeout(r, 100));
  $('title').hidden = true; document.body.classList.remove('intro'); mode = 'play';
  if (cp && saved) { S.trust = saved.trust; S.demir = saved.demir; S.money = saved.money || 0; }
  loadCheckpoint(cp || 'start');
  cam.pos.copy(camera.position);
}
$('resume').addEventListener('click', () => beginGame(saved.cp));
startBtn.addEventListener('click', () => beginGame(null));
$('freeRoam').addEventListener('click', () => {
  $('endCard').hidden = true; mode = 'play'; S.free = true;
  $('ep').textContent = 'Serbest · עולם פתוח'; $('objTxt').textContent = 'איסטנבול בלילה. אסוף את שקי הכסף (ירוק במפה) ונקה את השטחים של אנשי מוראט (אדום).'; $('timer').hidden = true;
});
requestAnimationFrame(loop);
window.__game = { S, player, cars, actors, peds, STORY, NPC_ITEMS: ITEM, blackCar, loadCheckpoint, choose: v => choiceCb?.(v), get dlg() { return dlg; }, gps: () => gps, startStep, completeStep, toggleCar, spawnFight, NPC, cam, camera, makeActor, attack, swapWeapon, startDialog, T, get mode() { return mode; }, set mode(v) { mode = v; } };
