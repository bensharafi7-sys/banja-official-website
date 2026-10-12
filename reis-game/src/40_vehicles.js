
/* ───────── vehicles: chunky rounded bodies, glossy paint ───────── */
const SPEC = {
  pickup: { L: 5.6, W: 2.15, wr: 0.5, max: 38, acc: 13, seat: [0.42, 0.62, 0.45] },
  sahin: { L: 4.3, W: 1.75, wr: 0.36, max: 31, acc: 9.5, seat: [0.36, 0.4, -0.1] },
  merc: { L: 4.9, W: 1.95, wr: 0.38, max: 44, acc: 14.5, seat: [0.4, 0.42, -0.15] },
  taxi: { L: 4.4, W: 1.8, wr: 0.36, max: 33, acc: 10, seat: [0.37, 0.41, -0.1] },
  police: { L: 4.8, W: 1.9, wr: 0.38, max: 41, acc: 15, seat: [0.4, 0.42, -0.15] },
};
const wheelGeo = {};
const glassM = new T.MeshPhysicalMaterial({ color: 0x1d2b38, roughness: 0.05, metalness: 0.1, transmission: 0, transparent: true, opacity: 0.55, clearcoat: 1 });
function rbox(w, h, d, r) { return new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.01, h / 2 - 0.01, d / 2 - 0.01)); }
const carGeoCache = new Map();
const cgeo = (k, f) => { if (!carGeoCache.has(k)) carGeoCache.set(k, f()); return carGeoCache.get(k); };
function buildCar(kind, color) {
  const s = SPEC[kind], g = new T.Group(), body = grp(g);
  const paint = mat(color, { cc: 1, r: 0.3, m: 0.25 }), chrome = mat(0xe6e9ec, { r: 0.12, m: 1 }), black = mat(0x1a1a1e, { r: 0.6 });
  const L = s.L, W = s.W, y0 = s.wr + 0.2;
  const headM = mat(0x333333, { e: 0xfff4dc, ei: 3 }), tailM = mat(0x330000, { e: 0xff3030, ei: 2 });
  if (kind === 'pickup') {
    mesh(cgeo('pk1', () => rbox(W, 0.85, L, 0.3)), paint, body, 0, y0 + 0.27, 0);
    mesh(cgeo('pk2', () => rbox(W * 0.92, 0.78, 2.2, 0.32)), glassM, body, 0, y0 + 1.05, 0.35);
    mesh(cgeo('pk3', () => rbox(W * 0.95, 0.12, 2.25, 0.06)), paint, body, 0, y0 + 1.46, 0.35);
    for (const sx of [-1, 1]) mesh(cgeo('pk4', () => rbox(0.12, 0.5, 2.1, 0.05)), paint, body, sx * (W / 2 - 0.06), y0 + 0.92, -1.75);
    mesh(cgeo('pk5', () => rbox(W, 0.5, 0.12, 0.05)), paint, body, 0, y0 + 0.92, -2.74);
    for (const sx of [-1, 1]) mesh(CYL8, black, body, sx * (W / 2 - 0.14), y0 + 1.4, -0.85, 0.06, 1.0, 0.06);
    mesh(CYL8, black, body, 0, y0 + 1.9, -0.85, 0.06, W - 0.2, 0.06).rotation.z = Math.PI / 2;
    mesh(cgeo('pk6', () => rbox(W - 0.35, 0.5, 0.05, 0.02)), mat(0x26262a, { m: 0.5, r: 0.5 }), body, 0, y0 + 1.55, -0.85);
    mesh(cgeo('pk7', () => rbox(W * 0.82, 0.48, 0.1, 0.05)), black, body, 0, y0 + 0.4, L / 2 + 0.02);
    for (const sx of [-1, 1]) for (const zz of [1.85, -1.75]) mesh(cgeo('pk8', () => rbox(0.14, 0.4, 1.3, 0.06)), black, body, sx * (W / 2 + 0.04), y0 + 0.22, zz);
  } else {
    const roofH = kind === 'sahin' || kind === 'taxi' ? 0.62 : 0.56;
    mesh(cgeo(kind + 'b', () => rbox(W, 0.7, L, 0.32)), paint, body, 0, y0 + 0.17, 0);
    mesh(cgeo(kind + 'c', () => rbox(W * 0.86, roofH, L * 0.5, 0.28)), glassM, body, 0, y0 + 0.5 + roofH / 2, -L * 0.04);
    mesh(cgeo(kind + 'r', () => rbox(W * 0.87, 0.09, L * 0.44, 0.04)), paint, body, 0, y0 + 0.5 + roofH, -L * 0.04);
    for (const zz of [L / 2, -L / 2]) mesh(cgeo(kind + 'bp', () => rbox(W * 0.98, 0.24, 0.16, 0.08)), chrome, body, 0, y0 - 0.06, zz);
    if (kind === 'merc') mesh(cgeo('mg', () => rbox(0.65, 0.28, 0.06, 0.03)), chrome, body, 0, y0 + 0.28, L / 2 + 0.01);
    if (kind === 'taxi') {
      mesh(cgeo('tx', () => rbox(W + 0.02, 0.1, L * 0.6, 0.04)), mat(0x1a1a1e), body, 0, y0 + 0.2, 0);
      mesh(cgeo('txs', () => rbox(0.75, 0.22, 0.32, 0.08)), mat(0x222222, { e: 0xffe08a, ei: 1.5 }), body, 0, y0 + 0.66 + roofH, -L * 0.04);
    }
    if (kind === 'police') {
      mesh(cgeo('pl', () => rbox(W + 0.02, 0.2, L * 0.8, 0.06)), mat(0x2c5f8a, { cc: 1 }), body, 0, y0 + 0.14, 0);
      body.userData.bar = [mesh(cgeo('plr', () => rbox(0.55, 0.16, 0.32, 0.06)), mat(0x220000, { e: 0xff1a1a, ei: 0 }), body, 0.3, y0 + 0.62 + roofH, -L * 0.04),
        mesh(cgeo('plr', () => rbox(0.55, 0.16, 0.32, 0.06)), mat(0x000022, { e: 0x2050ff, ei: 0 }), body, -0.3, y0 + 0.62 + roofH, -L * 0.04)];
      body.userData.bar.forEach(m => { m.material = m.material.clone(); });
    }
  }
  for (const sx of [-1, 1]) {
    mesh(SPHM, headM, body, sx * (W / 2 - 0.32), y0 + 0.3, L / 2 - 0.02, 0.2, 0.13, 0.08, false);
    mesh(SPHM, tailM, body, sx * (W / 2 - 0.25), y0 + 0.32, -L / 2 + 0.02, 0.17, 0.1, 0.06, false);
    if (kind !== 'pickup') mesh(SPHM, paint, body, sx * (W / 2 - 0.05), y0 + 0.75, L * 0.08, 0.05, 0.05, 0.12, false); // mirrors
  }
  const k = s.wr.toFixed(2);
  wheelGeo[k] ||= { tire: new T.TorusGeometry(s.wr * 0.72, s.wr * 0.3, 12, 24).rotateY(Math.PI / 2), rim: new T.CylinderGeometry(s.wr * 0.62, s.wr * 0.62, 0.3, 16).rotateZ(Math.PI / 2), hub: new T.SphereGeometry(s.wr * 0.25, 12, 8) };
  const wheels = [];
  for (const [sx, front] of [[1, 1], [-1, 1], [1, 0], [-1, 0]]) {
    const pv = grp(g, sx * (W / 2 - 0.15), s.wr, front ? L / 2 - 0.95 : -(L / 2 - 1.0)), sp = grp(pv);
    mesh(wheelGeo[k].tire, mat(0x202024, { r: 0.85 }), sp); mesh(wheelGeo[k].rim, kind === 'pickup' ? black : chrome, sp, 0, 0, 0, 1, 1, 1, false);
    mesh(wheelGeo[k].hub, mat(0x8a8f96, { m: 1, r: 0.3 }), sp, sx * 0.14, 0, 0, 0.6, 1, 1, false);
    wheels.push({ pv, sp, front: !!front });
  }
  scene.add(g);
  return { kind, s, g, body, wheels, pos: g.position, heading: 0, speed: 0, vel: new T.Vector3(), steer: 0, yaw: 0, acc: 0, pv: 0, driver: null, ai: null, police: false, stuck: 0, rev: 0, honk: 0, hp: 100 };
}
const cars = [];
/* a real car model (glossy black paint, chrome, tinted glass) dressed over a car's physics body */
function dressCar(c, url, opts = {}) {
  loadGLTF(url).then(gltf => {
    const m = gltf.scene.clone(true);
    const paint = new T.MeshPhysicalMaterial({ color: opts.paint ?? 0x050507, metalness: 0.45, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 0.9 });
    const chrome = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.12, envMapIntensity: 1.2 });
    const glass = new T.MeshPhysicalMaterial({ color: 0x0c1014, metalness: 0.3, roughness: 0.04, transparent: true, opacity: 0.5, clearcoat: 1, envMapIntensity: 1.5 });
    const get = n => m.getObjectByName(n);
    if (get('body')) get('body').material = paint;
    for (const n of ['rim_fl', 'rim_fr', 'rim_rr', 'rim_rl', 'trim']) if (get(n)) get(n).material = chrome;
    if (get('glass')) get('glass').material = glass;
    m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals(); } });
    const box = new T.Box3().setFromObject(m), size = box.getSize(new T.Vector3());
    const k = c.s.L / size.z; m.scale.setScalar(k); m.position.y = -box.min.y * k; m.rotation.y = Math.PI; // model's nose points −z
    for (const o of [...c.body.children]) if (o.isMesh) o.visible = false;
    for (const w of c.wheels) w.pv.visible = false;
    const ao = new T.Mesh(new T.PlaneGeometry(0.655 * 4 * k, 1.3 * 4 * k), new T.MeshBasicMaterial({ map: new T.TextureLoader().load('models/ferrari_ao.png'), blending: T.MultiplyBlending, toneMapped: false, transparent: true, depthWrite: false }));
    ao.rotation.x = -Math.PI / 2; ao.position.y = 0.02; c.g.add(ao);
    c.body.add(m);
    c.fw = ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr'].map(get).filter(Boolean); c.fw.forEach(w => w.rotation.order = 'YXZ');
    if (c.fw.length < 4) c.fw = null;
    if (opts.seat) c.s = { ...c.s, seat: opts.seat };
    c.real = m;
  }).catch(e => console.warn('car model', e && e.message));
}
function spawnCar(kind, color, x, z, h) { const c = buildCar(kind, color); c.pos.set(x, 0, z); c.heading = h; c.g.rotation.y = h; cars.push(c); return c; }
function removeCar(c) { scene.remove(c.g); const i = cars.indexOf(c); if (i >= 0) cars.splice(i, 1); }

function carCircles(c) {
  const fx = Math.sin(c.heading), fz = Math.cos(c.heading), o = c.s.L / 2 - c.s.W / 2;
  return [[c.pos.x + fx * o, c.pos.z + fz * o], [c.pos.x, c.pos.z], [c.pos.x - fx * o, c.pos.z - fz * o]];
}
const tmpP = new T.Vector3();
let onCrash = () => {};
function drive(c, thr, st, hb, dt) {
  const s = c.s;
  if (thr > 0) { if (c.speed < -0.5) c.speed += 24 * thr * dt; else c.speed += s.acc * thr * Math.max(0, 1 - Math.max(0, c.speed) / s.max) * dt; }
  else if (thr < 0) { if (c.speed > 0.5) c.speed += 24 * thr * dt; else c.speed = Math.max(-10, c.speed + s.acc * 0.6 * thr * dt); }
  else c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), (1.6 + Math.abs(c.speed) * 0.06) * dt);
  if (hb) c.speed -= Math.sign(c.speed) * Math.min(Math.abs(c.speed), 7 * dt);
  const maxSt = 0.62 / (1 + Math.abs(c.speed) * 0.045);
  c.steer = lerp(c.steer, st * maxSt, damp(7, dt));
  c.yaw = c.speed / (s.L * 0.6) * Math.tan(c.steer) * (hb ? 1.6 : 1);
  c.heading += c.yaw * dt;
  const fx = Math.sin(c.heading), fz = Math.cos(c.heading);
  const grip = hb ? 1.4 : (Math.abs(c.speed) > 22 && Math.abs(st) > 0.8 ? 4.5 : 9);
  const k = damp(grip, dt);
  c.vel.x += (fx * c.speed - c.vel.x) * k; c.vel.z += (fz * c.speed - c.vel.z) * k;
  c.pos.x += c.vel.x * dt; c.pos.z += c.vel.z * dt;
  for (const [x, z] of carCircles(c)) {
    tmpP.set(x, 0, z);
    const hit = collide(tmpP, s.W / 2 + 0.05);
    if (hit) {
      c.pos.x += tmpP.x - x; c.pos.z += tmpP.z - z;
      const imp = -(c.vel.x * hit.x + c.vel.z * hit.z);
      if (imp > 0) { c.vel.x += hit.x * imp * 1.2; c.vel.z += hit.z * imp * 1.2; c.speed *= imp > 6 ? 0.35 : 0.8; if (imp > 7) onCrash(c, imp); }
    }
  }
  c.pos.x = clamp(c.pos.x, BOUND.x0, BOUND.x1); c.pos.z = clamp(c.pos.z, BOUND.z0 + 0.5, BOUND.z1);
  c.g.rotation.y = c.heading;
  const roll = (c.vel.x * fx + c.vel.z * fz) * dt / s.wr;
  for (const w of c.wheels) { w.sp.rotation.x += roll; if (w.front) w.pv.rotation.y = c.steer; }
  if (c.fw) c.fw.forEach((w, i) => { w.rotation.x = -c.wheels[i].sp.rotation.x; w.rotation.y = i < 2 ? c.steer : 0; });
  c.acc = lerp(c.acc, (c.speed - c.pv) / Math.max(dt, 1e-3), 0.1); c.pv = c.speed;
  c.body.rotation.z = lerp(c.body.rotation.z, clamp(c.yaw * c.speed * 0.014, -0.09, 0.09), 0.15);
  c.body.rotation.x = lerp(c.body.rotation.x, clamp(-c.acc * 0.006, -0.06, 0.06), 0.15);
}
function carVsCar() {
  for (let a = 0; a < cars.length; a++) for (let b = a + 1; b < cars.length; b++) {
    const A = cars[a], Bc = cars[b];
    if (Math.abs(A.pos.x - Bc.pos.x) > 7 || Math.abs(A.pos.z - Bc.pos.z) > 7) continue;
    const ca = carCircles(A), cb = carCircles(Bc), R = (A.s.W + Bc.s.W) / 2;
    for (const p of ca) for (const q of cb) {
      let dx = p[0] - q[0], dz = p[1] - q[1]; const d = Math.hypot(dx, dz);
      if (d >= R || d < 1e-4) continue;
      dx /= d; dz /= d; const push = (R - d) / 2;
      A.pos.x += dx * push; A.pos.z += dz * push; Bc.pos.x -= dx * push; Bc.pos.z -= dz * push;
      const rel = (A.vel.x - Bc.vel.x) * dx + (A.vel.z - Bc.vel.z) * dz;
      if (rel < 0) {
        A.vel.x -= dx * rel * 0.6; A.vel.z -= dz * rel * 0.6; Bc.vel.x += dx * rel * 0.6; Bc.vel.z += dz * rel * 0.6;
        A.speed *= 0.7; Bc.speed *= 0.7;
        if (-rel > 6) onCrash(A.driver === 'player' ? A : Bc, -rel, A.driver === 'player' ? Bc : A);
      }
    }
  }
}

/* traffic AI: right-hand lanes, red lights, honks when blocked, gets out of the way */
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function aiPlace(c, a, b, d, t = 0.5) {
  const [dx, dz] = d, rx = -dz, rz = dx;
  c.ai = { a, b, d };
  c.pos.set(roadAt(a) + dx * BLK * t + rx * LANE, 0, roadAt(b) + dz * BLK * t + rz * LANE);
  c.heading = Math.atan2(dx, dz); c.speed = 8; c.vel.set(dx * 8, 0, dz * 8); c.g.rotation.y = c.heading;
}
function aiRandomSegmentNear(px, pz, minD, maxD) {
  for (let tries = 0; tries < 60; tries++) {
    const a = Math.floor(Math.random() * 9), b = Math.floor(Math.random() * 9), d = pick(DIRS);
    const na = a + d[0], nb = b + d[1]; if (na < 0 || na > 8 || nb < 0 || nb > 8) continue;
    const x = roadAt(a) + d[0] * 35, z = roadAt(b) + d[1] * 35, dist = Math.hypot(x - px, z - pz);
    if (dist >= minD && dist <= maxD) return [a, b, d];
  }
  return [4, 4, [1, 0]];
}
let worldT = 0;
function aiUpdate(c, dt, obstacles) {
  const ai = c.ai, [dx, dz] = ai.d, rx = -dz, rz = dx;
  const p0x = roadAt(ai.a) + rx * LANE, p0z = roadAt(ai.b) + rz * LANE;
  let t = (c.pos.x - p0x) * dx + (c.pos.z - p0z) * dz;
  if (t > BLK - LANE - 1) {
    const na = ai.a + dx, nb = ai.b + dz;
    const opts = DIRS.filter(d => !(d[0] === -dx && d[1] === -dz) && na + d[0] >= 0 && na + d[0] <= 8 && nb + d[1] >= 0 && nb + d[1] <= 8);
    ai.a = na; ai.b = nb; ai.d = opts.length ? pick(opts) : [-dx, -dz];
    return;
  }
  const look = Math.max(t, 0) + 9;
  const tx = p0x + dx * look, tz = p0z + dz * look;
  const want = Math.atan2(tx - c.pos.x, tz - c.pos.z), diff = angDiff(c.heading, want);
  let target = 11 * (1 - Math.min(0.6, Math.abs(diff))), blocked = false;
  // red light: stop before the crossing of the next (inner) intersection
  const na = ai.a + dx, nb = ai.b + dz, inner = na > 0 && na < 8 && nb > 0 && nb < 8;
  const myAxis = dz !== 0 ? 0 : 1;
  if (inner && tlPhase(worldT) !== myAxis && t > BLK - 24 && t < BLK - 10.5) target = Math.min(target, Math.max(0, (BLK - 11 - t) * 1.2));
  const fx = Math.sin(c.heading), fz = Math.cos(c.heading);
  for (const o of obstacles) {
    if (o === c.pos) continue;
    const ox = o.x - c.pos.x, oz = o.z - c.pos.z, al = ox * fx + oz * fz, lat = Math.abs(-ox * fz + oz * fx);
    if (al > 0 && al < 11 && lat < 2.0) { target = 0; blocked = o.isPlayer; break; }
  }
  if (blocked) { c.honk += dt; if (c.honk > 2.2) { c.honk = -rnd(2, 5); honk(c.pos); } } else c.honk = Math.min(c.honk, 0);
  if (c.rev > 0) { c.rev -= dt; drive(c, -0.8, -clamp(diff * 2, -1, 1), false, dt); return; }
  if (target > 2 && Math.abs(c.speed) < 0.6) { c.stuck += dt; if (c.stuck > 2.5) { c.rev = 1.2; c.stuck = 0; } } else c.stuck = 0;
  const thr = c.speed < target - 0.5 ? 0.7 : c.speed > target + 0.5 ? -0.7 : 0;
  drive(c, thr, clamp(diff * 2.2, -1, 1), false, dt);
}
