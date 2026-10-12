
/* ───────── stylized characters: big head, big eyes, soft skin, rounded hands ───────── */
const HS = 1.34; // head scale
const HAIRCAP = new T.SphereGeometry(1, 36, 18, 0, TAU, 0, 1.35);
const HOOD = new T.SphereGeometry(1, 36, 18, Math.PI / 2 + 0.95, TAU - 1.9, 0, 2.3);
function hairCap(H, m, tilt = -0.45, grow = 1, y = 0.1) { const c = mesh(HAIRCAP, m, H, 0, y, -0.004, 0.108 * grow, 0.126 * grow, 0.118 * grow, false); c.rotation.x = tilt; return c; }
const eyeWhiteM = mat(0xfbfaf6, { cc: 1, r: 0.15, m: 0 }), pupilM = mat(0x050505, { cc: 1, r: 0.1, m: 0 });
const glintM = new T.MeshBasicMaterial({ color: 0xffffff });
const lipM = mat(0x9a5848, { skin: 1 }), mouthM = mat(0x3a1414, { r: 0.6 });
const LID = new T.SphereGeometry(0.0325, 24, 12, 0, TAU, 0, Math.PI / 2);
const TORSO = new T.LatheGeometry([[0, 0], [0.17, 0], [0.2, 0.05], [0.215, 0.15], [0.21, 0.27], [0.215, 0.36], [0.2, 0.43], [0.15, 0.49], [0.07, 0.52], [0, 0.525]].map(([x, y]) => new T.Vector2(x, y)), 32);
const SKIRT = (top, bot, len) => new T.CylinderGeometry(top, bot, len, 24, 1, true);
const PALM = new RoundedBoxGeometry(0.075, 0.085, 0.036, 3, 0.016);
const TUFT = new T.ConeGeometry(0.03, 0.08, 12);
const gunGeo = { slide: new RoundedBoxGeometry(0.03, 0.03, 0.19, 2, 0.006), frame: new RoundedBoxGeometry(0.027, 0.022, 0.15, 2, 0.005), grip: new RoundedBoxGeometry(0.03, 0.115, 0.05, 2, 0.01), guard: new T.TorusGeometry(0.019, 0.0035, 6, 16, Math.PI * 1.3), barrel: new T.CylinderGeometry(0.0075, 0.0075, 0.01, 12) };
const flashM = new T.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.95 });

function buildHand(wr, skin, side) {
  mesh(PALM, skin, wr, 0, -0.05, 0, 1, 1, 1, false);
  const fingers = [];
  for (let k = 0; k < 4; k++) {
    const f = grp(wr, 0, -0.09, -0.027 + k * 0.018);
    mesh(capsule(0.0115, 0.035, 10), skin, f, 0, -0.022, 0, 1, 1, 1, false);
    fingers.push(f);
  }
  const th = grp(wr, -side * 0.02, -0.04, 0.035); th.rotation.set(0.5, 0, side * 0.4);
  mesh(capsule(0.012, 0.03, 10), skin, th, 0, -0.02, 0, 1, 1, 1, false);
  return fingers;
}
function buildGun(hand) {
  const g = grp(hand, 0, -0.08, 0.07); g.rotation.x = 0;
  const steel = mat(0x23252a, { r: 0.28, m: 0.85 }), poly = mat(0x141416, { r: 0.75 }), black = mat(0x0a0a0a, { r: 0.4, m: 0.6 });
  mesh(gunGeo.slide, steel, g, 0, 0.045, 0.05, 1, 1, 1, false);
  for (let k = 0; k < 6; k++) mesh(BOX, black, g, 0, 0.046, -0.03 + k * 0.006, 0.031, 0.026, 0.0025, false); // slide serrations
  mesh(gunGeo.frame, poly, g, 0, 0.02, 0.035, 1, 1, 1, false);
  mesh(gunGeo.grip, poly, g, 0, -0.035, -0.018, 1, 1, 1, false).rotation.x = 0.28;
  const tg = mesh(gunGeo.guard, poly, g, 0, 0.004, 0.03, 1, 1, 1, false); tg.rotation.y = Math.PI / 2; tg.rotation.z = Math.PI * 0.85;
  mesh(BOX, black, g, 0, 0.0, 0.026, 0.004, 0.02, 0.005, false).rotation.x = 0.3; // trigger
  mesh(gunGeo.barrel, black, g, 0, 0.045, 0.146, 1, 1, 1, false).rotation.x = Math.PI / 2;
  mesh(BOX, black, g, 0, 0.063, 0.135, 0.004, 0.006, 0.006, false); mesh(BOX, black, g, 0, 0.063, -0.04, 0.02, 0.006, 0.006, false);
  const flash = mesh(SPHL, flashM, g, 0, 0.045, 0.19, 0.03, 0.03, 0.08, false); flash.visible = false;
  g.visible = false;
  return { g, flash };
}

/* photographic head: the player's real face projected onto the front half of the skull */
const PH_FRONT = new T.SphereGeometry(1, 56, 40, 0, Math.PI), PH_BACK = new T.SphereGeometry(1, 40, 28, Math.PI, Math.PI);
{ const p = PH_FRONT.attributes.position, uv = PH_FRONT.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + 1) / 2, (p.getY(i) + 1) / 2); }
function photoHead(j, url) {
  const tex = new T.TextureLoader().load(url); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8;
  const H = j.head;
  mesh(PH_FRONT, new T.MeshStandardMaterial({ map: tex, roughness: 0.62 }), H, 0, 0.125, 0, 0.118, 0.15, 0.122, true);
  mesh(PH_BACK, mat(0xffffff, { map: pepperTex('#3d3a38', 'rgba(150,145,140,.7)', 500), r: 0.95 }), H, 0, 0.125, 0, 0.118, 0.15, 0.122, true);
  j.jaw = grp(H);
}
function createHuman(o) {
  const B = o.build || 1, sc = (o.height || 1.78) / 1.78, low = !!o.low;
  const skin = mat(o.skin || 0xc98a64, { skin: 1 }), shirt = mat(o.shirt, { r: 0.85 }), pants = mat(o.pants, { r: 0.9 }),
    shoes = mat(o.shoes || 0x3b3b3b, { r: 0.6 }), hairM = mat(o.hair ?? 0x2a1d16, { r: 0.9 }), dark = mat(0x1d1714, { r: 0.9 });
  const root = new T.Group(), body = grp(root); body.scale.setScalar(sc);
  const j = { thigh: [], knee: [], ankle: [], arm: [], fore: [], hand: [], fingers: [], eyes: [], lids: [], brows: [] };
  const sh = !low;
  j.hips = grp(body, 0, 0.97, 0);
  mesh(SPHM, pants, j.hips, 0, 0, 0, 0.19 * B, 0.13, 0.14 * B, sh);
  mesh(CYL, mat(0x2a211b, { r: 0.4 }), j.hips, 0, 0.075, 0, 0.192 * B, 0.05, 0.142 * B, false);
  mesh(RBOX, mat(0xc9a24a, { m: 1, r: 0.3 }), j.hips, 0, 0.075, 0.14 * B, 0.05, 0.035, 0.015, false);
  if (o.skirt) mesh(SKIRT(0.2 * B, 0.32 * B, o.skirt), mat(o.skirtC ?? o.pants, { r: 0.85 }), j.hips, 0, -o.skirt / 2 + 0.05, 0, 1, 1, 1, sh).material.side = T.DoubleSide;
  j.spine = grp(j.hips, 0, 0.07, 0);
  mesh(TORSO, shirt, j.spine, 0, -0.04, 0.015 * B, B, 1, 0.78 * B * (o.belly || 1), sh);
  j.chest = grp(j.spine, 0, 0.24, 0);
  for (const s of [-1, 1]) mesh(SPHM, shirt, j.chest, s * 0.2 * B, 0.14, 0, 0.088 * B, 0.085, 0.088 * B, sh);
  if (o.under) mesh(RBOX, mat(o.under), j.chest, 0, 0.13, 0.135 * B, 0.09, 0.17, 0.02, false);
  j.neck = grp(j.chest, 0, 0.22, 0);
  mesh(CYL, skin, j.neck, 0, 0.02, 0, 0.062 * B, 0.12, 0.062 * B, false);
  j.headRoot = grp(j.neck, 0, 0.035, 0.012); j.headRoot.scale.setScalar(o.headScale || HS);
  j.head = grp(j.headRoot);
  const H = j.head;
  if (o.photo) { photoHead(j, o.photo); } else {
  mesh(SPH, skin, H, 0, 0.1, 0, 0.102, 0.118, 0.11, sh);
  for (const s of [-1, 1]) mesh(SPHM, skin, H, s * 0.054, 0.064, 0.058, 0.038, 0.032, 0.034, false);
  // jaw (opens with the voice amplitude)
  j.jaw = grp(H, 0, 0.055, 0.0);
  mesh(SPHM, skin, j.jaw, 0, -0.012, 0.022, 0.088, 0.06, 0.092, false);
  mesh(SPHM, skin, j.jaw, 0, -0.045, 0.072, 0.042, 0.035, 0.036, false);
  mesh(capsule(0.0095, 0.03, 10), lipM, j.jaw, 0, -0.004, 0.112, 1, 1, 1, false).rotation.z = Math.PI / 2;
  mesh(SPHM, mouthM, H, 0, 0.046, 0.1, 0.032, 0.014, 0.012, false);
  mesh(capsule(0.009, 0.034, 10), lipM, H, 0, 0.05, 0.112, 1, 1, 1, false).rotation.z = Math.PI / 2;
  // nose
  mesh(SPHM, skin, H, 0, 0.092, 0.112, 0.024, 0.036, 0.03, false);
  mesh(SPHM, skin, H, 0, 0.074, 0.126, 0.028, 0.025, 0.026, false);
  for (const s of [-1, 1]) mesh(SPHL, skin, H, s * 0.021, 0.07, 0.114, 0.016, 0.014, 0.014, false);
  // ears
  for (const s of [-1, 1]) { mesh(SPHM, skin, H, s * 0.102, 0.098, -0.004, 0.022, 0.038, 0.03, false); }
  // eyes
  const irisM = mat(o.eyes || 0x5a3418, { cc: 1, r: 0.2 });
  for (const s of [-1, 1]) {
    const eg = grp(H, s * 0.044, 0.116, 0.084);
    mesh(SPHM, eyeWhiteM, eg, 0, 0, 0, 0.03, 0.03, 0.026, false);
    const look = grp(eg);
    mesh(SPHM, irisM, look, 0, 0, 0.022, 0.0175, 0.0175, 0.0065, false);
    mesh(SPHL, pupilM, look, 0, 0, 0.0272, 0.0088, 0.0088, 0.003, false);
    mesh(SPHL, glintM, look, -0.006, 0.007, 0.0296, 0.0036, 0.0036, 0.0015, false);
    const lid = mesh(LID, skin, eg, 0, 0, 0, 1, 1, 1, false);
    j.eyes.push(look); j.lids.push(lid);
    const br = grp(H, s * 0.046, 0.153, 0.1);
    mesh(capsule(0.0095, 0.04, 10), o.brows ? mat(o.brows, { r: 0.9 }) : (o.hair != null ? hairM : dark), br, 0, 0, 0, 1, 1, 1, false).rotation.z = Math.PI / 2;
    br.userData.s = s; j.brows.push(br);
  }
  if (o.face) o.face(H, { skin, hairM, dark, j, B });
  else if (o.hair !== null) {
    hairCap(H, hairM, -0.5, 1.03);
    if (!o.cap) for (let i = 0; i < 5; i++) { const t = mesh(SPHM, hairM, H, (i - 2) * 0.032, 0.205, 0.045 - Math.abs(i - 2) * 0.012, 0.034, 0.026, 0.045, false); t.rotation.x = 0.5; }
  }
  if (o.cap) { hairCap(H, mat(o.cap, { r: 0.9 }), -0.3, 1.07, 0.112); mesh(RBOX, mat(o.cap), H, 0, 0.19, 0.12, 0.17, 0.016, 0.085, false).rotation.x = -0.15; }
  if (o.scarf) { const sm = mat(o.scarf, { r: 0.95 }); sm.side = T.DoubleSide; mesh(HOOD, sm, H, 0, 0.1, -0.006, 0.122, 0.142, 0.13, false); }
  if (o.moustache) { for (const s of [-1, 1]) { const m = mesh(capsule(0.011, 0.035, 10), o.hair != null ? hairM : dark, H, s * 0.02, 0.058, 0.118, 1, 1, 1, false); m.rotation.z = Math.PI / 2 + s * 0.35; } }
  }
  // arms
  for (const s of [1, -1]) { // +1 = left (+x)
    const sa = grp(j.chest, s * 0.25 * B, 0.14, 0);
    if (o.sleeves === 'long') mesh(capsule(0.072 * B, 0.2), shirt, sa, 0, -0.14, 0, 1, 1, 1, sh);
    else { mesh(capsule(0.066 * B, 0.2), skin, sa, 0, -0.15, 0, 1, 1, 1, sh); mesh(capsule(0.08 * B, 0.07), shirt, sa, 0, -0.065, 0, 1, 1, 1, sh); }
    const el = grp(sa, 0, -0.29, 0);
    mesh(capsule(0.058 * B, 0.18), o.sleeves === 'long' ? shirt : skin, el, 0, -0.13, 0, 1, 1, 1, sh);
    if (o.sleeves === 'long') mesh(capsule(0.05 * B, 0.02), skin, el, 0, -0.24, 0, 1, 1, 1, false);
    if (o.watch && s === 1) { mesh(CYL, mat(o.watch, { r: 0.5 }), el, 0, -0.235, 0, 0.06 * B, 0.035, 0.06 * B, false); const f = mesh(CYL, mat(0x1b1b1b, { cc: 1 }), el, 0, -0.235, 0.056 * B, 0.024, 0.012, 0.024, false); f.rotation.x = Math.PI / 2; }
    const wr = grp(el, 0, -0.27, 0);
    j.fingers.push(low ? [] : buildHand(wr, skin, s));
    if (low) mesh(SPHM, skin, wr, 0, -0.06, 0, 0.045, 0.07, 0.035, false);
    j.arm.push(sa); j.fore.push(el); j.hand.push(wr);
  }
  // legs
  for (const s of [1, -1]) {
    const th = grp(j.hips, s * 0.1 * B, -0.03, 0);
    mesh(capsule(0.098 * B, 0.26), pants, th, 0, -0.21, 0, 1, 1, 1, sh);
    if (o.cargo) mesh(RBOX, pants, th, s * 0.095 * B, -0.25, 0, 0.045, 0.15, 0.13, false);
    const kn = grp(th, 0, -0.44, 0);
    mesh(capsule(0.074 * B, 0.29), pants, kn, 0, -0.2, 0, 1, 1, 1, sh);
    const an = grp(kn, 0, -0.43, 0);
    const shoe = mesh(capsule(0.062, 0.15, 14), shoes, an, 0, -0.03, 0.05, 1.05, 1, 0.8, sh); shoe.rotation.x = Math.PI / 2;
    mesh(RBOX, mat(o.sole || 0xf2f2ee, { r: 0.6 }), an, 0, -0.07, 0.05, 0.13, 0.035, 0.29, false);
    j.thigh.push(th); j.knee.push(kn); j.ankle.push(an);
  }
  if (o.extras) o.extras(j, { B, skin });
  const gun = buildGun(j.hand[1]);
  return { root, body, j, gun, phase: rnd(0, TAU), t: rnd(0, 20), airK: 0, mk: 0, lean: 0, downK: 0, blink: rnd(1, 4), lidK: 0, talk: 0,
    act: null, guardK: 0, aimK: 0, aimPitch: 0, recoil: 0, hitK: 0, hitSide: 1, panicK: 0, phoneK: 0, fallDir: 1, mood: 0, gestureK: 0 };
}

/* the player: stocky, black polo, cargo pants, grey sneakers, salt-and-pepper goatee,
   short spiky dark hair greying at the sides, gold chain, ear stud + tragus ring, orange watch, keys */
const REIS = {
  photo: 'img/reis_face.jpg', headScale: 1.16, skirt: 0.62, skirtC: 0x141416, under: 0x36373c,
  build: 1.2, belly: 1.12, height: 1.78, skin: 0xc99070, shirt: 0x141416, pants: 0x15161c, shoes: 0x141414, sole: 0x1c1c1c,
  sleeves: 'long', watch: 0xf07a2a, brows: 0x1a1412, eyes: 0x4a2a14,
  face(h, { dark, j }) {
    const sides = mat(0xffffff, { map: pepperTex('#4a4643', 'rgba(220,215,205,.85)', 900), r: 1 });
    const beard = mat(0xffffff, { map: pepperTex('#3e3a37', 'rgba(230,226,218,.9)', 1400), r: 1 });
    const goat = mat(0xffffff, { map: pepperTex('#1e1b19', 'rgba(200,196,190,.6)', 300), r: 1 });
    const top = mat(0x1e1a18, { r: 0.85 });
    hairCap(h, sides, -0.62, 1.025);
    const tc = mesh(HAIRCAP, top, h, 0, 0.115, 0.0, 0.104, 0.118, 0.113, false); tc.rotation.x = -0.25; tc.scale.multiplyScalar(1.02);
    for (let i = 0; i < 11; i++) {
      const a = (i / 10 - 0.5) * 1.5, row = i % 2;
      const c = mesh(TUFT, top, h, Math.sin(a) * 0.055, 0.226 - Math.abs(a) * 0.014, 0.06 - row * 0.035 - Math.abs(a) * 0.012, 1, 1, 1, false);
      c.rotation.set(0.55 - row * 0.2, 0, -a * 0.45);
    }
    for (const s of [-1, 1]) { const ck = mesh(SPHM, beard, h, s * 0.072, 0.052, 0.05, 0.04, 0.056, 0.05, false); ck.rotation.z = s * 0.25; }
    mesh(SPHM, beard, j.jaw, 0, -0.034, 0.022, 0.094, 0.058, 0.092, false);
    mesh(SPHM, goat, j.jaw, 0, -0.045, 0.098, 0.034, 0.042, 0.026, false);
    for (const s of [-1, 1]) {
      const m = mesh(capsule(0.012, 0.038, 10), goat, h, s * 0.021, 0.058, 0.121, 1, 1, 1, false); m.rotation.z = Math.PI / 2 + s * 0.3;
      const d = mesh(capsule(0.009, 0.04, 10), goat, j.jaw, s * 0.04, -0.012, 0.106, 1, 1, 1, false); d.rotation.z = s * 0.12;
    }
    mesh(CYL, mat(0x0d0d0d, { cc: 1 }), h, 0.111, 0.07, 0.004, 0.012, 0.006, 0.012, false).rotation.z = Math.PI / 2;
    const rim = mesh(new T.TorusGeometry(0.012, 0.0028, 8, 18), mat(0xe2e6ea, { r: 0.15, m: 1 }), h, 0.115, 0.07, 0.004, 1, 1, 1, false); rim.rotation.y = Math.PI / 2;
    const hoop = mesh(new T.TorusGeometry(0.01, 0.0022, 8, 14), mat(0xe2e6ea, { r: 0.15, m: 1 }), h, 0.098, 0.096, 0.028, 1, 1, 1, false); hoop.rotation.y = Math.PI / 2;
  },
  extras(j, { B }) {
    const g = mat(0xf2c35a, { r: 0.18, m: 1 });
    const ch = mesh(new T.TorusGeometry(0.088, 0.004, 8, 40), g, j.chest, 0, 0.21, 0.035, 1, 1, 1, false); ch.rotation.x = 1.25;
    for (const s of [1, -1]) { const c = mesh(RBOX, mat(0x17181d), j.chest, s * 0.05, 0.215, 0.1 * B, 0.075, 0.012, 0.055, false); c.rotation.set(-0.6, 0, s * 0.45); }
    const col = mesh(new T.TorusGeometry(0.075, 0.02, 8, 24), mat(0x17181d), j.chest, 0, 0.235, -0.01, 1, 1, 1, false); col.rotation.x = Math.PI / 2;
    mesh(RBOX, mat(0x101116), j.chest, 0, 0.12, 0.145 * B, 0.032, 0.13, 0.012, false);
    for (let i = 0; i < 2; i++) mesh(SPHL, mat(0x2a2b30, { cc: 1 }), j.chest, 0, 0.16 - i * 0.05, 0.152 * B, 0.007, 0.007, 0.004, false);
    const keys = grp(j.hips, 0.17 * B, 0.0, 0.07);
    mesh(new T.TorusGeometry(0.02, 0.003, 6, 12), mat(0xc0c0c0, { m: 1, r: 0.3 }), keys, 0, 0, 0, 1, 1, 1, false);
    for (let i = 0; i < 4; i++) mesh(RBOX, mat(i === 1 ? 0xf2c35a : 0xb8b8b8, { m: 1, r: 0.3 }), keys, (i - 1.5) * 0.012, -0.04, 0.005, 0.012, 0.05, 0.005, false);
  }
};

function setFist(h, k) {
  for (let i = 0; i < 2; i++) { const s = i ? -1 : 1; for (const f of h.j.fingers[i]) f.rotation.set(0, 0, -s * (0.15 + k * 1.5)); }
}
/* procedural animation: gait, idle, combat layers, face */
function animateHuman(h, dt, speed, st = {}) {
  animateRig(h, dt, speed, st);
  if (h.real) syncRealBody(h, dt, speed, st);
}
function animateRig(h, dt, speed, st) {
  const J = h.j; h.t += dt;
  // face: blinking, eyes, brows, jaw
  h.blink -= dt; if (h.blink < 0) { h.lidK = 1; h.blink = rnd(2, 5.5); }
  h.lidK = Math.max(0, h.lidK - dt * 7);
  const lid = lerp(-0.42, 1.45, h.lidK > 0.5 ? (1 - h.lidK) * 2 : h.lidK * 2) + (h.mood > 0.5 ? 0.25 : 0);
  for (const l of J.lids) l.rotation.x = st.down ? 1.45 : lid;
  const ly = clamp(st.eyeYaw || 0, -0.5, 0.5), lp = clamp(st.eyePitch || 0, -0.3, 0.3);
  for (const e of J.eyes) e.rotation.set(-lp, ly, 0);
  for (const br of J.brows) br.rotation.z = br.userData.s * (h.mood * 0.35 - 0.05) + Math.sin(h.t * 0.7) * 0.02;
  J.jaw.rotation.x = clamp(h.talk, 0, 1) * 0.32 + (h.panicK * 0.2);
  if (st.seated) {
    J.hips.position.set(0, 0.97, 0); J.hips.rotation.set(0, 0, 0);
    J.spine.rotation.set(-0.1, 0, 0); J.chest.rotation.set(0, 0, 0); J.neck.rotation.set(0.08, 0, 0);
    J.head.rotation.set(Math.sin(h.t * 0.3) * 0.04, (st.steer || 0) * 0.5 + (st.car ? 0 : Math.sin(h.t * 0.25) * 0.4), 0);
    for (let i = 0; i < 2; i++) {
      const s = i ? -1 : 1;
      J.thigh[i].rotation.set(-1.45, 0, s * 0.1); J.knee[i].rotation.set(1.4, 0, 0); J.ankle[i].rotation.set(0.05, 0, 0);
      if (st.car) { J.arm[i].rotation.set(-0.95 + s * (st.steer || 0) * 0.25, 0, s * 0.2); J.fore[i].rotation.set(-0.55, 0, 0); }
      else { J.arm[i].rotation.set(-0.35 + (i ? Math.sin(h.t * 0.8) * 0.15 : 0), 0, s * 0.18); J.fore[i].rotation.set(-1.25 - (i ? 0.3 + Math.max(0, Math.sin(h.t * 0.5)) * 0.6 : 0), 0, 0); }
    }
    setFist(h, st.car ? 0.9 : 0.3);
    h.body.rotation.x = 0; h.body.position.y = 0;
    return;
  }
  h.airK = lerp(h.airK, st.air ? 1 : 0, damp(10, dt));
  h.downK = lerp(h.downK, st.down ? 1 : 0, damp(st.down ? 8 : 3, dt));
  h.guardK = lerp(h.guardK, st.guard ? 1 : 0, damp(10, dt));
  h.aimK = lerp(h.aimK, st.aim ? 1 : 0, damp(14, dt));
  h.panicK = lerp(h.panicK, st.panic ? 1 : 0, damp(6, dt));
  h.phoneK = lerp(h.phoneK, st.phone ? 1 : 0, damp(4, dt));
  h.gestureK = lerp(h.gestureK, h.talk > 0.05 ? 1 : 0, damp(3, dt));
  h.hitK = Math.max(0, h.hitK - dt * 3.2);
  h.recoil = Math.max(0, h.recoil - dt * 9);
  h.mood = lerp(h.mood, st.angry ? 1 : 0, damp(4, dt));
  const runK = clamp((speed - 2.6) / 3.6, 0, 1);
  h.mk = lerp(h.mk, clamp(speed / 1.0, 0, 1) * (1 - h.airK), damp(8, dt));
  const mk = h.mk, idle = 1 - mk;
  const stepLen = lerp(0.68, 1.25, runK);
  h.phase += speed / (2 * stepLen) * TAU * dt;
  const p = h.phase, A = Math.asin(Math.min(0.9, stepLen / 1.74)) * mk;
  const t = h.t, br = Math.sin(t * 1.7), sway = Math.sin(t * 0.45);
  h.lean = lerp(h.lean, clamp(-(st.turn || 0) * speed * 0.03, -0.22, 0.22), damp(6, dt));
  // action overlay (punches)
  let act = 0, actArm = -1, hook = 0;
  if (h.act) {
    h.act.t += dt; const q = h.act.t / h.act.dur;
    if (q >= 1) h.act = null;
    else { act = q < 0.22 ? -q / 0.22 * 0.35 : q < 0.45 ? lerp(-0.35, 1, (q - 0.22) / 0.23) : lerp(1, 0, (q - 0.45) / 0.55); actArm = h.act.arm; hook = h.act.type === 'hook' ? 1 : 0; }
  }
  const actK = Math.max(0, act);
  J.hips.position.y = 0.97 + Math.cos(2 * p) * lerp(0.022, -0.035, runK) * mk - 0.035 * runK * mk + br * 0.003 * idle - h.guardK * 0.04;
  J.hips.position.x = sway * 0.022 * idle;
  J.hips.rotation.set(0, -Math.sin(p) * 0.13 * mk + (actArm === 1 ? actK * 0.25 : actArm === 0 ? -actK * 0.15 : 0), Math.sin(p) * 0.045 * mk * (1 - runK) + h.lean - sway * 0.03 * idle);
  J.spine.rotation.set(0.04 * mk + 0.2 * runK * mk + (st.lean || 0) + h.guardK * 0.12 + actK * 0.12 - h.hitK * 0.45 - h.panicK * 0.1,
    Math.sin(p) * 0.1 * mk + (actArm === 1 ? actK * 0.35 * (1 + hook) : actArm === 0 ? -actK * 0.25 : 0) + h.hitK * 0.3 * h.hitSide,
    -h.lean * 0.5 + sway * 0.025 * idle + h.hitK * 0.15 * h.hitSide);
  J.chest.rotation.set(br * 0.02 * idle + br * 0.008, Math.sin(p) * 0.14 * mk * (1 - h.guardK * 0.6), 0);
  J.neck.rotation.set(-J.spine.rotation.x * 0.7 - h.aimK * h.aimPitch * 0.6, 0, 0);
  const look = st.lookAt != null ? clamp(st.lookAt, -1.1, 1.1) : (Math.sin(t * 0.37) * 0.35 + Math.sin(t * 0.13) * 0.2) * idle * (1 - h.guardK) * (1 - h.aimK);
  J.head.rotation.set(Math.sin(t * 0.29) * 0.05 * idle - h.hitK * 0.5 + h.gestureK * Math.sin(t * 5.3) * 0.04,
    -(J.hips.rotation.y + J.spine.rotation.y + J.chest.rotation.y) * 0.9 + look + h.gestureK * Math.sin(t * 2.1) * 0.08, -h.lean * 0.4 + h.hitK * 0.3 * h.hitSide);
  setFist(h, Math.max(h.guardK, h.aimK * 0.9, actK > 0 ? 1 : 0, runK * 0.5));
  for (let i = 0; i < 2; i++) {
    const s = i ? -1 : 1, ph = p + (i ? Math.PI : 0), sw = Math.sin(ph), cs = Math.cos(ph);
    let tx = -sw * A - 0.12 * runK * mk + s * sway * 0.02 * idle - h.guardK * 0.15 * (i ? -1 : 1) * idle;
    let kx = (0.06 + Math.pow(Math.max(0, cs), 1.4) * lerp(0.8, 1.75, runK) + Math.max(0, -cs) * Math.max(0, sw) * 0.18) * mk
      + (0.03 + Math.max(0, s * sway) * 0.08) * idle + h.guardK * 0.25 * idle;
    tx = lerp(tx, -0.75 + i * 0.35, h.airK); kx = lerp(kx, 1.1 - i * 0.4, h.airK);
    J.thigh[i].rotation.set(tx, 0, s * (0.035 + h.guardK * 0.08));
    J.knee[i].rotation.set(kx, 0, 0);
    J.ankle[i].rotation.set(-(tx + kx) * 0.88 + 0.35 * Math.max(0, -sw) * Math.max(0, cs) * mk, 0, 0);
    // arms: walk swing → guard → aim → punch → panic/phone/gesture
    const armA = lerp(0.38, 0.95, runK) * mk;
    let ax = lerp(sw * armA + br * 0.02 * idle, -0.5, h.airK), az = s * (0.13 + 0.05 * runK + 0.4 * h.airK) + s * 0.015 * br * idle;
    let fx = -(0.15 + 0.25 * mk + 1.05 * runK * mk) - Math.max(0, -sw) * 0.35 * mk;
    // talking gestures
    if (i === 1 || h.gestureK > 0.3) { ax = lerp(ax, -0.35 + Math.sin(t * 2.3 + i) * 0.25, h.gestureK * (i ? 0.9 : 0.5)); fx = lerp(fx, -1.1 + Math.sin(t * 3.1 + i) * 0.3, h.gestureK * (i ? 0.9 : 0.5)); }
    ax = lerp(ax, -0.95 + sw * 0.08 * mk, h.guardK); az = lerp(az, s * 0.28, h.guardK); fx = lerp(fx, -2.0, h.guardK);
    if (i === actArm) {
      if (hook) { ax = lerp(ax, -1.35, actK); az = lerp(az, s * 1.1 * (1 - actK) + s * 0.2, actK); fx = lerp(fx, -1.2, actK); }
      else { ax = lerp(ax, -1.55, actK) + (act < 0 ? -act * 0.6 : 0); az = lerp(az, -s * 0.12, actK); fx = lerp(fx, -0.08, actK); }
    }
    if (h.aimK > 0.01) {
      if (i === 1) { ax = lerp(ax, -1.52 - h.aimPitch - h.recoil * 0.35, h.aimK); az = lerp(az, 0.14, h.aimK); fx = lerp(fx, -0.06 - h.recoil * 0.4, h.aimK); }
      else { ax = lerp(ax, -1.3 - h.aimPitch, h.aimK); az = lerp(az, -0.55, h.aimK); fx = lerp(fx, -0.75, h.aimK); }
    }
    ax = lerp(ax, -2.7 + Math.sin(t * 9 + i) * 0.3, h.panicK); az = lerp(az, s * 0.35, h.panicK); fx = lerp(fx, -0.9, h.panicK);
    if (i === 0) { ax = lerp(ax, -0.4, h.phoneK); az = lerp(az, 0.95, h.phoneK); fx = lerp(fx, -2.5, h.phoneK); }
    J.arm[i].rotation.set(ax, 0, az);
    J.fore[i].rotation.set(fx, 0, 0);
    J.hand[i].rotation.set(0, 0, s * -0.1 - (i === 1 ? h.aimK * 0.1 : 0));
  }
  if (h.downK > 0.01) {
    h.body.rotation.x = -h.fallDir * h.downK * Math.PI / 2 * 0.95;
    h.body.position.y = h.downK * 0.14;
    for (let i = 0; i < 2; i++) { J.arm[i].rotation.x = lerp(J.arm[i].rotation.x, -2.6 * (h.fallDir > 0 ? 1 : 0.3), h.downK * 0.7); J.knee[i].rotation.x = lerp(J.knee[i].rotation.x, 0.3 + i * 0.5, h.downK); }
  } else { h.body.rotation.x = 0; h.body.position.y = 0; }
}

/* look presets for the city's people and factions */
const PED_LOOKS = [
  { shirt: 0xd9573f, pants: 0x34405a, hair: 0x2a1d16, moustache: 1 }, { shirt: 0xf3e3c3, pants: 0x4a4a52, hair: 0x3a2a20, cap: 0x2c5f8a },
  { shirt: 0x2f7d7a, pants: 0x2a2a30, hair: 0x8a8480, sleeves: 'long', moustache: 1 }, { shirt: 0xc0473b, pants: 0x2a2228, scarf: 0x8a4a7a, skirt: 0.75, skirtC: 0x3b2f4a, sleeves: 'long', hair: null },
  { shirt: 0xf2c14e, pants: 0x4b3d2c, hair: 0x1c140f, sleeves: 'long' }, { shirt: 0x8fc1d9, pants: 0x4b5260, hair: 0x5a3a22 },
  { shirt: 0xc3a8d6, pants: 0x2f2f3a, hair: 0x3b2418, scarf: 0x2f7d7a, skirt: 0.7, skirtC: 0x2f4a5a, sleeves: 'long' },
];
const GANG_LOOK = () => ({ shirt: pick([0x2b2622, 0x3a2a24, 0x232830]), under: pick([0x8a2a2a, 0x2a2a2a, 0xd8d0c0]), pants: 0x1c1c22, hair: 0x15100c, sleeves: 'long', build: rnd(1.05, 1.25), moustache: Math.random() < 0.6 ? 1 : 0, eyes: 0x2a1a0e, skin: pick([0xc08458, 0xa86e48, 0xd09a72]) });
const COP_LOOK = () => ({ shirt: 0x2c4f8a, under: 0xe8e8e8, pants: 0x1d2a44, cap: 0x1d2a44, hair: 0x1c140f, sleeves: 'short', build: rnd(1, 1.15), skin: pick([0xc08458, 0xd09a72]) });
