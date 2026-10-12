
/* ───────── facades: warm storybook Istanbul palette ───────── */
function facade(wall, shutter, trim) {
  const W = 256, H = 512;
  const mk = (emit) => canvasTex(W, H, g => {
    g.fillStyle = emit ? '#000' : wall; g.fillRect(0, 0, W, H);
    if (!emit) for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,240,220,${srand() * 0.05})`; g.fillRect(srand() * W, srand() * H, srand() * 50, srand() * 50); }
    for (let r = 1; r < 16; r++) {
      if (!emit) { g.fillStyle = trim; g.fillRect(0, r * 32 - 3, W, 3); }
      for (let k = 0; k < 8; k++) {
        const x = k * 32 + 9, y = r * 32 + 6, w = 14, h = 20, lit = srand() < 0.5, open = srand() < 0.6;
        if (emit) { if (lit) { g.fillStyle = srand() < 0.85 ? '#ffb963' : '#d6e6ff'; g.beginPath(); g.roundRect(x, y, w, h, [7, 7, 1, 1]); g.fill(); } continue; }
        g.fillStyle = trim; g.beginPath(); g.roundRect(x - 2, y - 2, w + 4, h + 4, [9, 9, 2, 2]); g.fill();
        g.fillStyle = lit ? '#ffd79a' : '#3b4b5c'; g.beginPath(); g.roundRect(x, y, w, h, [7, 7, 1, 1]); g.fill();
        if (!lit) { g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + 2, y + 3, 3, 8); }
        if (open) { g.fillStyle = shutter; g.fillRect(x - 7, y, 5, h); g.fillRect(x + w + 2, y, 5, h); }
        if (r % 3 === 0 && srand() < 0.6) { g.fillStyle = '#7b4a2e'; g.fillRect(x - 3, y + h + 1, w + 6, 4); g.fillStyle = srand() < 0.5 ? '#e0566a' : '#f2c14e'; for (let f = 0; f < 4; f++) { g.beginPath(); g.arc(x + 1 + f * 4, y + h, 2.4, 0, TAU); g.fill(); } }
      }
    }
  }, true);
  const m = new T.MeshStandardMaterial({ map: mk(false), emissiveMap: mk(true), emissive: 0xffffff, emissiveIntensity: 1.7, roughness: 0.88, color: 0x6a7088 });
  return m;
}
const FACADES = [
  ['#f2b48a', '#2f7d7a', '#fbe3c8'], ['#f4d58d', '#c0473b', '#fff1cf'], ['#e8846b', '#2c5f8a', '#fbd9c5'], ['#9fd3c0', '#b8463a', '#effaf2'],
  ['#8fc1d9', '#d9893b', '#eef7fb'], ['#c3a8d6', '#2f6b5c', '#f3eafa'], ['#d9774f', '#284c64', '#f7d6bf'], ['#f3e3c3', '#4b7d3a', '#fffaf0'],
].map(([w, s, t]) => facade(w, s, t));
const awningTex = ['#c0473b', '#2f7d7a', '#d9a53b', '#2c5f8a'].map(c => canvasTex(64, 32, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#fff3e0' : c; g.fillRect(i * 8, 0, 8, 32); } }));
function building(x0, x1, z0, z1, h, m) {
  const w = x1 - x0, d = z1 - z0;
  const geo = planarUV(new RoundedBoxGeometry(w, h, d, 2, 0.9), w, h, d);
  const b = new T.Mesh(geo, m || FACADES[Math.floor(srand() * FACADES.length)]);
  b.position.set((x0 + x1) / 2, h / 2, (z0 + z1) / 2); b.castShadow = b.receiveShadow = true; scene.add(b);
  addCol(x0, x1, z0, z1, h); footprints.push([x0, x1, z0, z1]);
  addInst('cornice', RBOX, mat(0xfff1dc, { r: 0.8 }), (x0 + x1) / 2, h + 0.25, (z0 + z1) / 2, w + 0.6, 0.5, d + 0.6);
  // terracotta roof on low buildings, rooftop life on the rest
  if (h < 14 && srand() < 0.6) {
    const rf = mesh(CONE4, mat(0xc4583a, { r: 0.7 }), scene, (x0 + x1) / 2, h + 2.2, (z0 + z1) / 2, w * 0.74, 4, d * 0.74);
    rf.rotation.y = Math.PI / 4; rf.receiveShadow = true;
  } else {
    const n = Math.floor(srand() * 4);
    for (let i = 0; i < n; i++) {
      const px = sr(x0 + 2, x1 - 2), pz = sr(z0 + 2, z1 - 2);
      addInst('tank', CYL, mat(0xf5f1ea, { r: 0.4 }), px, h + 1.1, pz, 0.5, 1.6, 0.5, 0, 0, Math.PI / 2);
      addInst('panel', RBOX, mat(0x2b4a7a, { r: 0.25, m: 0.4 }), px, h + 1.0, pz + 1.4, 1.7, 0.08, 1.2, -0.6, 0, 0);
    }
    if (srand() < 0.35) addInst('dish', SPHM, mat(0xf0f0f0), sr(x0 + 2, x1 - 2), h + 0.9, sr(z0 + 2, z1 - 2), 0.6, 0.25, 0.6);
  }
  // shop awnings on the street-facing ground floor
  for (const [ax, az, side] of [[(x0 + x1) / 2, z0 - 0.7, '-z'], [(x0 + x1) / 2, z1 + 0.7, '+z'], [x0 - 0.7, (z0 + z1) / 2, '-x'], [x1 + 0.7, (z0 + z1) / 2, '+x']]) {
    if (srand() >= 0.45) continue;
    const m = mat(0xffffff, { map: awningTex[Math.floor(srand() * 4)], r: 0.9 });
    if (side[1] === 'z') { const a = mesh(BOX, m, scene, ax, 3.4, az, Math.min(w - 3, 9), 0.08, 1.6); a.rotation.x = side === '-z' ? -0.35 : 0.35; }
    else { const a = mesh(BOX, m, scene, ax, 3.4, az, 1.6, 0.08, Math.min(d - 3, 9)); a.rotation.z = side === '-x' ? 0.35 : -0.35; }
  }
}

/* lamp light pools on the wet asphalt */
const POOL = new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const poolM = new T.MeshBasicMaterial({ map: canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,170,80,.55)'); r.addColorStop(0.5, 'rgba(255,140,60,.18)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }), transparent: true, blending: T.AdditiveBlending, depthWrite: false });
/* ground, sea, roads */
const ground = new T.Mesh(new T.PlaneGeometry(1400, 1020), new T.MeshStandardMaterial({ color: 0x23242c, roughness: 0.16, metalness: 0.45 }));
ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, 190); ground.receiveShadow = true; scene.add(ground);
const dock = new T.Mesh(new T.PlaneGeometry(1400, 34), new T.MeshStandardMaterial({ color: 0x3a3836, roughness: 0.22, metalness: 0.35 }));
dock.rotation.x = -Math.PI / 2; dock.position.set(0, 0.01, -303); dock.receiveShadow = true; scene.add(dock);
const sea = new T.Mesh(new T.PlaneGeometry(5000, 2400, 1, 1), new T.MeshPhysicalMaterial({ color: 0x0a1a24, roughness: 0.08, metalness: 0.4, clearcoat: 1, clearcoatRoughness: 0.1 }));
sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.6, -1520); scene.add(sea);
mesh(RBOX, mat(0xe5d3b8), scene, 0, -0.3, -320.5, 1400, 1.0, 1.0, false);
addCol(-700, 700, -340, -319);
for (let x = -280; x <= 280; x += 8) addInst('bollard', CYL, mat(0x3a3a46), x, 0.35, -318.6, 0.2, 0.7, 0.2);
/* Karaköy waterfront: promenade lamps, neon, a flag and a lit ferry on the Bosphorus */
for (let x = -276; x <= 276; x += 16) {
  addInst('pole', CYL8, mat(0x2d3a35, { m: 0.5, r: 0.4 }), x, 2.4, -316.5, 0.08, 4.8, 0.08, 0, 0, 0, null, true);
  addInst('lamp', SPHM, mat(0x222222, { e: 0xffb860, ei: 6 }), x, 4.9, -316.5, 0.28, 0.34, 0.28);
  addInst('pool', POOL, poolM, x, 0.03, -315, 8, 1, 8);
}
const neonTex = (txt, col) => canvasTex(512, 128, g => { g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, 512, 128); g.font = 'bold 72px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = col; g.shadowBlur = 18; g.fillStyle = col; g.fillText(txt, 256, 66); g.fillText(txt, 256, 66); });
function neon(txt, col, x, y, z, ry, w = 10) { const t = neonTex(txt, col); const m = mesh(new T.PlaneGeometry(w, w / 4), new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, color: 0xffffff }), scene, x, y, z, 1, 1, 1, false); m.rotation.y = ry; return m; }
neon('KARAKÖY', '#ff4a4a', -60, 8.5, -270.8, Math.PI, 12);
neon('LOKANTA', '#ffc070', 20, 6, -270.8, Math.PI, 8);
neon('MEYHANE', '#ff5aa0', 120, 7, -270.8, Math.PI, 9);
{
  const fl = canvasTex(192, 128, g => { g.fillStyle = '#e30a17'; g.fillRect(0, 0, 192, 128); g.fillStyle = '#fff'; g.beginPath(); g.arc(78, 64, 34, 0, TAU); g.fill(); g.fillStyle = '#e30a17'; g.beginPath(); g.arc(88, 64, 27, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 6 : 15; g.lineTo(122 + Math.cos(a) * r, 64 + Math.sin(a) * r); } g.fill(); });
  mesh(CYL8, mat(0xcfd3d6, { m: 1, r: 0.3 }), scene, -100, 5, -310, 0.07, 10, 0.07);
  const flag = mesh(new T.PlaneGeometry(3, 2, 12, 1), new T.MeshStandardMaterial({ map: fl, side: T.DoubleSide, roughness: 0.8 }), scene, -98.5, 9, -310, 1, 1, 1, false);
  window.__flag = flag;
}
const ferry = grp(scene, -40, -0.3, -380);
mesh(RBOX, mat(0xe8e8e8, { r: 0.5 }), ferry, 0, 1, 0, 30, 2.4, 8);
mesh(RBOX, mat(0x202838, { r: 0.4 }), ferry, 0, 3, 0, 22, 2, 6);
for (let i = -5; i <= 5; i++) mesh(BOX, mat(0x111111, { e: 0xffd28a, ei: 4 }), ferry, i * 1.9, 3, 3.05, 1.2, 0.8, 0.05, false);
mesh(SPHL, mat(0x111111, { e: 0xff3030, ei: 5 }), ferry, 14, 4.5, 0, 0.25, 0.25, 0.25, false);

const pave = new T.MeshStandardMaterial({ color: 0x6e665c, roughness: 0.3, metalness: 0.2 });
const dashM = mat(0xfff4dc, { r: 0.8 });
for (let k = 0; k <= NB; k++) {
  const r = roadAt(k);
  for (let v = -280; v <= 280; v += 6) {
    if (roadDist(v) < 8) continue;
    addInst('dash', BOX, dashM, r, 0.015, v, 0.22, 0.02, 2.8);
    addInst('dash', BOX, dashM, v, 0.015, r, 2.8, 0.02, 0.22);
  }
}
for (let a = 0; a <= NB; a++) for (let b = 0; b <= NB; b++) {
  const X = roadAt(a), Z = roadAt(b);
  for (let s = -4.5; s <= 4.5; s += 1.5) {
    addInst('zebra', BOX, dashM, X + s, 0.016, Z + 8.2, 0.75, 0.02, 3.4);
    addInst('zebra', BOX, dashM, X + s, 0.016, Z - 8.2, 0.75, 0.02, 3.4);
    addInst('zebra', BOX, dashM, X + 8.2, 0.016, Z + s, 3.4, 0.02, 0.75);
    addInst('zebra', BOX, dashM, X - 8.2, 0.016, Z + s, 3.4, 0.02, 0.75);
  }
}
/* traffic lights: one shared phase for the whole grid; N/S and E/W alternate */
const TL = { nsGreen: mat(0x0a2a0a, { e: 0x3dff6a, ei: 3 }), nsRed: mat(0x2a0a0a, { e: 0xff3020, ei: 0.1 }), ewGreen: mat(0x0a2a0a, { e: 0x3dff6a, ei: 0.1 }), ewRed: mat(0x2a0a0a, { e: 0xff3020, ei: 3 }) };
const tlPhase = t => Math.floor(t / 11) % 2; // 0 → N/S axis (moving along z) green
for (let a = 1; a < NB; a++) for (let b = 1; b < NB; b++) {
  const X = roadAt(a) + 7.4, Z = roadAt(b) - 7.4;
  addInst('tlPole', CYL8, mat(0x2d3a35, { m: 0.4, r: 0.5 }), X, 2.4, Z, 0.1, 4.8, 0.1, 0, 0, 0, null, true);
  addInst('tlBox', RBOX, mat(0x2d3a35, { r: 0.5 }), X, 4.6, Z, 0.5, 1.1, 0.5);
  addInst('tlNSg', SPHL, TL.nsGreen, X, 4.35, Z + 0.27, 0.13, 0.13, 0.06);
  addInst('tlNSr', SPHL, TL.nsRed, X, 4.85, Z + 0.27, 0.13, 0.13, 0.06);
  addInst('tlEWg', SPHL, TL.ewGreen, X - 0.27, 4.35, Z, 0.06, 0.13, 0.13);
  addInst('tlEWr', SPHL, TL.ewRed, X - 0.27, 4.85, Z, 0.06, 0.13, 0.13);
}
function updateLights(t) {
  const p = tlPhase(t);
  TL.nsGreen.emissiveIntensity = p === 0 ? 3 : 0.08; TL.nsRed.emissiveIntensity = p === 0 ? 0.08 : 3;
  TL.ewGreen.emissiveIntensity = p === 1 ? 3 : 0.08; TL.ewRed.emissiveIntensity = p === 1 ? 0.08 : 3;
}
for (let k = 0; k <= NB; k++) for (let v = -262; v <= 262; v += 35) {
  if (roadDist(v) < 10) continue;
  const r = roadAt(k);
  for (const [x, z, ry] of [[r + 7, v, 0], [v, r - 7, 1]]) {
    addInst('pole', CYL8, mat(0x2d3a35, { m: 0.5, r: 0.4 }), x, 3.2, z, 0.1, 6.4, 0.1, 0, 0, 0, null, true);
    addInst('lampArm', CYL8, mat(0x2d3a35, { m: 0.5, r: 0.4 }), x - (ry ? 0 : 0.5), 6.3, z + (ry ? 0.5 : 0), 0.05, 1.0, 0.05, ry ? Math.PI / 2 : 0, 0, ry ? 0 : Math.PI / 2);
    addInst('lamp', SPHM, mat(0x222222, { e: 0xffb860, ei: 6 }), x - (ry ? 0 : 1), 6.2, z + (ry ? 1 : 0), 0.32, 0.4, 0.32);
    addInst('pool', POOL, poolM, x - (ry ? 0 : 1), 0.03, z + (ry ? 1 : 0), 9, 1, 9);
  }
}
function tree(x, z, s = 1) {
  addInst('trunk', CYL8, mat(0x7a5236), x, 1.4 * s, z, 0.2 * s, 2.8 * s, 0.2 * s, 0, 0, 0, null, true);
  const greens = [0x6fae4a, 0x89c04f, 0x5d9a45];
  for (let i = 0; i < 3; i++) addInst('crown', SPHM, mat(0xffffff, { r: 0.9 }), x + (i - 1) * 0.9 * s, (3.4 + (i === 1 ? 0.9 : 0)) * s, z + (i === 1 ? 0.4 : -0.3) * s, 1.6 * s, 1.45 * s, 1.6 * s, 0, 0, 0, greens[i], true);
}
function bench(x, z, ry) {
  const g = grp(scene, x, 0.12, z); g.rotation.y = ry;
  mesh(RBOX, mat(0x2f7d7a, { r: 0.6 }), g, 0, 0.45, 0, 1.8, 0.1, 0.5); mesh(RBOX, mat(0x2f7d7a, { r: 0.6 }), g, 0, 0.8, -0.22, 1.8, 0.45, 0.08);
  for (const sx of [-0.75, 0.75]) mesh(BOX, mat(0x2d3a35), g, sx, 0.22, 0, 0.08, 0.44, 0.45);
  return g;
}
/* simit carts: walk up and press F to eat (+50 health) */
const simitCarts = [];
const simitTex = canvasTex(256, 64, g => { g.fillStyle = '#c0473b'; g.fillRect(0, 0, 256, 64); g.fillStyle = '#fff3e0'; g.font = 'bold 40px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SİMİT', 128, 34); });
function simitCart(x, z, ry) {
  const g = grp(scene, x, 0.12, z); g.rotation.y = ry;
  mesh(RBOX, mat(0xc0473b, { cc: 1, r: 0.35 }), g, 0, 0.85, 0, 1.6, 0.7, 0.9);
  mesh(BOX, mat(0xffffff, { map: simitTex }), g, 0, 0.88, 0.46, 1.3, 0.35, 0.01, false);
  const glass = mesh(RBOX, mat(0xddeeff, { t: 0.35, r: 0.05 }), g, 0, 1.55, 0, 1.5, 0.7, 0.8, false);
  for (let i = 0; i < 6; i++) { const r = mesh(new T.TorusGeometry(0.13, 0.05, 8, 16), mat(0xc98a3c, { r: 0.6 }), g, -0.5 + (i % 3) * 0.5, 1.33 + Math.floor(i / 3) * 0.22, 0, 1, 1, 1, false); r.rotation.x = Math.PI / 2; }
  for (const sx of [-0.7, 0.7]) mesh(new T.TorusGeometry(0.28, 0.07, 10, 20), mat(0x2b2b2b), g, sx, 0.3, 0.42, 1, 1, 1);
  mesh(CONE, mat(0xc0473b), g, 0, 2.35, 0, 1.3, 0.5, 0.9);
  mesh(CYL8, mat(0xdddddd, { m: 0.6 }), g, 0, 2, 0, 0.03, 0.9, 0.03);
  addCol(x - 0.9, x + 0.9, z - 0.9, z + 0.9, 2);
  simitCarts.push({ x, z });
}

/* landmarks */
const stone = mat(0xf0e4d0, { r: 0.85 }), lead = mat(0x8fa7b8, { r: 0.35, m: 0.35 }), gold = mat(0xf2c35a, { r: 0.25, m: 1 });
function mosque(cx, cz) {
  const g = grp(scene, cx, 0, cz);
  mesh(RBOX, stone, g, 0, 5, 4, 26, 10, 24).receiveShadow = true;
  mesh(CYL, stone, g, 0, 11, 4, 11.5, 2, 11.5);
  mesh(new T.SphereGeometry(11, 40, 18, 0, TAU, 0, Math.PI / 2), lead, g, 0, 12, 4);
  mesh(CYL, gold, g, 0, 23.5, 4, 0.12, 2, 0.12); mesh(SPH, gold, g, 0, 24.7, 4, 0.5, 0.5, 0.5);
  for (const [x, z] of [[0, -8], [0, 16], [-13, 4], [13, 4]]) mesh(new T.SphereGeometry(5.5, 28, 12, 0, TAU, 0, Math.PI / 2), lead, g, x, 10, z);
  for (const [x, z] of [[-9, -5], [9, -5], [-9, 13], [9, 13]]) { mesh(CYL, stone, g, x, 11, z, 2.6, 2, 2.6); mesh(new T.SphereGeometry(2.8, 18, 8, 0, TAU, 0, Math.PI / 2), lead, g, x, 12, z); }
  mesh(RBOX, stone, g, 0, 2, -18, 26, 4, 1.2); mesh(RBOX, stone, g, -13, 2, -12, 1.2, 4, 12); mesh(RBOX, stone, g, 13, 2, -12, 1.2, 4, 12);
  addCol(cx - 13, cx + 13, cz - 8, cz + 16, 24);
  for (const [x, z] of [[-17, -14], [17, -14], [-17, 20], [17, 20]]) {
    mesh(CYL, stone, g, x, 19, z, 1.1, 38, 1.1);
    for (const y of [24, 31]) mesh(CYL, stone, g, x, y, z, 1.7, 0.6, 1.7);
    mesh(CONE, lead, g, x, 41.5, z, 1.2, 7, 1.2); mesh(SPH, gold, g, x, 45.3, z, 0.28, 0.28, 0.28);
    addCol(cx + x - 1.2, cx + x + 1.2, cz + z - 1.2, cz + z + 1.2, 45);
  }
  for (let i = 0; i < 10; i++) tree(cx + sr(-24, 24), cz + sr(-27, -22), 0.9);
  bench(cx - 8, cz - 24, 0); bench(cx + 8, cz - 24, 0);
}
function galata(cx, cz) {
  const g = grp(scene, cx, 0, cz);
  mesh(new T.CylinderGeometry(7, 7.6, 46, 36), mat(0xd8bf98, { r: 0.9 }), g, 0, 23, 0).receiveShadow = true;
  mesh(new T.CylinderGeometry(7.05, 7.05, 1.2, 36), mat(0xb59a74), g, 0, 34, 0);
  mesh(new T.CylinderGeometry(7.4, 7.4, 3, 36), mat(0x3d3530, { e: 0xffb060, ei: 0.7 }), g, 0, 47.5, 0);
  mesh(new T.CylinderGeometry(8.3, 8.3, 0.5, 36), mat(0xb59a74), g, 0, 46, 0);
  mesh(new T.ConeGeometry(7.6, 14, 36), mat(0x4f6b86, { r: 0.4, m: 0.3 }), g, 0, 56, 0);
  mesh(CYL, gold, g, 0, 64, 0, 0.1, 2.5, 0.1);
  addCol(cx - 7, cx + 7, cz - 7, cz + 7, 63);
  for (let i = 0; i < 8; i++) tree(cx + sr(-24, 24) * (i % 2 ? 1 : -1), cz + sr(14, 25), 1);
  for (const x of [-12, 12]) bench(cx + x, cz - 18, 0);
  // crates and barrels for cover in the final fight
  for (const [x, z] of [[-9, -14], [9, -14], [-15, -6], [15, -6], [0, -20]]) {
    mesh(RBOX, mat(0x9b6a3c, { r: 0.85 }), scene, cx + x, 0.75, cz + z, 1.5, 1.5, 1.5); addCol(cx + x - 0.75, cx + x + 0.75, cz + z - 0.75, cz + z + 0.75, 1.5);
  }
}
const signTex = txt => canvasTex(512, 128, g => {
  g.fillStyle = '#9b2a2e'; g.beginPath(); g.roundRect(0, 0, 512, 128, 30); g.fill(); g.strokeStyle = '#f2c35a'; g.lineWidth = 6; g.beginPath(); g.roundRect(10, 10, 492, 108, 24); g.stroke();
  g.fillStyle = '#fff3e0'; g.font = 'bold 60px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 256, 68);
});
const teaSeats = [];
function teaHouse(cx, cz) {
  building(cx - 11, cx + 11, cz + 12, cz + 24, 5, FACADES[1]);
  const st = signTex('ÇAY BAHÇESİ');
  const sign = mesh(new T.PlaneGeometry(10, 2.5), new T.MeshStandardMaterial({ map: st, emissive: 0xffffff, emissiveMap: st, emissiveIntensity: 0.6, transparent: true }), scene, cx, 6.5, cz + 11.8);
  sign.rotation.y = Math.PI;
  for (let i = 0; i < 12; i++) {
    const x = cx + (i % 4 - 1.5) * 8, z = cz - 18 + Math.floor(i / 4) * 9;
    addInst('tbl', CYL, mat(0x8a5a32, { r: 0.6 }), x, 0.82, z, 0.62, 0.07, 0.62, 0, 0, 0, null, true);
    addInst('tblLeg', CYL8, mat(0x2b2b2b), x, 0.45, z, 0.06, 0.8, 0.06);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1]]) { addInst('stool', CYL, mat(0xc0473b), x + dx * 1, 0.42, z + dz * 1, 0.24, 0.07, 0.24); teaSeats.push({ x: x + dx, z: z + dz, face: Math.atan2(-dx, -dz), taken: false }); }
    addInst('umb', CONE, mat(0xffffff, { r: 0.9 }), x, 2.9, z, 2.0, 0.75, 2.0, 0, 0, 0, i % 2 ? 0xc0473b : 0xfff3e0, true);
    addInst('umbPole', CYL8, mat(0x2b2b2b), x, 1.6, z, 0.04, 2.6, 0.04);
    addInst('glass', CYL8, mat(0xb04a1e, { t: 0.85, r: 0.1 }), x + 0.2, 0.92, z, 0.035, 0.1, 0.035);
  }
  for (let i = 0; i <= 24; i++) for (const zz of [-22, -13, -4]) addInst('bulb', SPHL, mat(0x111111, { e: 0xffd28a, ei: 4 }), cx - 14 + i * 28 / 24, 3.4 - Math.sin(i / 24 * Math.PI) * 0.5, cz + zz, 0.1, 0.1, 0.1);
  tree(cx - 20, cz - 22); tree(cx + 20, cz - 22); tree(cx + 22, cz + 2);
}
function park(cx, cz) {
  mesh(RBOX, mat(0x86b85a, { r: 1 }), scene, cx, 0.12, cz, 52, 0.06, 52, false).receiveShadow = true;
  for (let i = 0; i < 22; i++) tree(cx + sr(-24, 24), cz + sr(-24, 24), sr(0.8, 1.3));
  mesh(CYL, stone, scene, cx, 0.5, cz, 3.5, 0.8, 3.5);
  mesh(CYL, mat(0x5ec3d6, { r: 0.05, m: 0.1 }), scene, cx, 0.92, cz, 3.1, 0.05, 3.1, false);
  addCol(cx - 3.5, cx + 3.5, cz - 3.5, cz + 3.5, 1);
  for (let i = 0; i < 4; i++) bench(cx + Math.cos(i * TAU / 4) * 7, cz + Math.sin(i * TAU / 4) * 7, -i * TAU / 4 - Math.PI / 2);
}
function docks() {
  const cc = [0xd9573f, 0x2f8aa0, 0x6fae4a, 0xf2a93b, 0x8a7fc0, 0x2c5f8a];
  for (let x = 110; x < 268; x += 13) for (const z of [-312, -294]) {
    if (Math.abs(x - 180) < 14) continue;
    const n = 1 + Math.floor(srand() * 3);
    for (let s = 0; s < n; s++) addInst('cont', RBOX, mat(0xffffff, { r: 0.6 }), x, 1.3 + s * 2.6, z, 12, 2.55, 2.5, 0, 0, 0, pick(cc), true);
    addCol(x - 6, x + 6, z - 1.3, z + 1.3, n * 2.6);
  }
  const crane = grp(scene, 240, 0, -308), y = mat(0xf2c14e, { r: 0.5, m: 0.2 });
  for (const [x, z] of [[-5, -6], [5, -6], [-5, 6], [5, 6]]) { mesh(BOX, y, crane, x, 14, z, 0.9, 28, 0.9); addCol(240 + x - 0.6, 240 + x + 0.6, -308 + z - 0.6, -308 + z + 0.6); }
  mesh(BOX, y, crane, 0, 28.5, -14, 2, 2, 50); mesh(RBOX, mat(0xc0473b), crane, 0, 31, 4, 6, 3, 6);
  for (const [x, z] of [[170, -300], [192, -306], [176, -310]]) { mesh(CYL, mat(0x2f8aa0, { r: 0.5 }), scene, x, 0.6, z, 0.5, 1.2, 0.5); addCol(x - 0.5, x + 0.5, z - 0.5, z + 0.5, 1.2); }
}
function yali(cx, cz) {
  const wood = mat(0xb5463a, { r: 0.8 }), trim = mat(0xfff3e0);
  const g = grp(scene, cx, 0, cz);
  mesh(RBOX, wood, g, 0, 2.5, 0, 20, 5, 9).receiveShadow = true;
  mesh(RBOX, wood, g, 0, 6.6, 0.6, 22, 3.6, 10.6);
  mesh(CONE4, mat(0x6e3b2e, { r: 0.7 }), g, 0, 10, 0.6, 16, 3.5, 9).rotation.y = Math.PI / 4;
  for (let i = -4; i <= 4; i++) for (const yy of [2.8, 6.8]) mesh(RBOX, trim, g, i * 2.3, yy, 5.95 + (yy > 5 ? 0 : -0.6), 1.1, 1.8, 0.12, false);
  addCol(cx - 11, cx + 11, cz - 5, cz + 6, 12);
  for (const x of [-14, 14]) tree(cx + x, cz + 2, 1.1);
}
function farShore() {
  const hill = mat(0x16121e, { fog: false, r: 1 });
  for (let i = 0; i < 9; i++) mesh(SPHM, hill, scene, -1500 + i * 380, -40, -1650 + sr(-80, 80), 420, sr(70, 150), 160, false);
  const sil = mat(0x0f0d16, { fog: false, r: 1 });
  for (let i = 0; i < 70; i++) { const h = sr(15, 60); mesh(BOX, sil, scene, sr(-1500, 1500), h / 2, sr(-1560, -1500), sr(15, 40), h, 20, false); }
  for (let i = 0; i < 6; i++) { const x = sr(-1200, 1200); mesh(CYL8, sil, scene, x, 60, -1490, 3, 120, 3, false); mesh(SPHL, sil, scene, x + 25, 30, -1495, 26, 26, 26, false); }
  const P = []; for (let i = 0; i < 900; i++) P.push(sr(-1500, 1500), sr(2, 70), sr(-1580, -1480));
  const pg = new T.BufferGeometry(); pg.setAttribute('position', new T.Float32BufferAttribute(P, 3));
  scene.add(new T.Points(pg, new T.PointsMaterial({ color: 0xffd08a, size: 3, fog: false })));
  const bm = mat(0x6d5470, { fog: false });
  for (const x of [-620, 380]) mesh(BOX, bm, scene, x, 80, -1100, 8, 170, 10, false);
  mesh(BOX, bm, scene, -120, 64, -1100, 2400, 3, 14, false);
  const cab = []; for (let i = 0; i <= 60; i++) { const t = i / 60; cab.push(new T.Vector3(-620 + t * 1000, 165 - Math.sin(t * Math.PI) * 95, -1100)); }
  scene.add(new T.Line(new T.BufferGeometry().setFromPoints(cab), new T.LineBasicMaterial({ color: 0x5a4560, fog: false })));
  const dl = []; for (let i = 0; i < 120; i++) dl.push(-1300 + i * 20, 66, -1093);
  const dg = new T.BufferGeometry(); dg.setAttribute('position', new T.Float32BufferAttribute(dl, 3));
  scene.add(new T.Points(dg, new T.PointsMaterial({ color: 0xff3a3a, size: 4, fog: false })));
}

/* city */
const SPECIAL = { '3,3': 'mosque', '1,5': 'tea', '5,4': 'tower', '6,6': 'park', '2,1': 'park', '0,3': 'park' };
// Tayfun's turf: these blocks are patrolled by his men in free roam
const GANG_BLOCKS = [[6, 1], [6, 2], [7, 6], [1, 7]];
function block(i, j, ring) {
  const cx = ORG + BLK / 2 + i * BLK, cz = ORG + BLK / 2 + j * BLK;
  mesh(RBOX, pave, scene, cx, 0.06, cz, 58, 0.12, 58, false).receiveShadow = true;
  const sp = SPECIAL[i + ',' + j];
  if (sp === 'mosque') return mosque(cx, cz);
  if (sp === 'tea') return teaHouse(cx, cz);
  if (sp === 'tower') return galata(cx, cz);
  if (sp === 'park') return park(cx, cz);
  const H = 26, sx = cx + sr(-9, 9), sz = cz + sr(-9, 9);
  for (const [a, b] of [[cx - H, sx], [sx, cx + H]]) for (const [c, d] of [[cz - H, sz], [sz, cz + H]]) {
    if (!ring && srand() < 0.07) { tree((a + b) / 2, (c + d) / 2, 1.1); continue; }
    const dist = Math.hypot(cx, cz);
    let h = Math.round((ring ? sr(22, 46) : sr(9, 28) + Math.max(0, 140 - dist) * 0.07) / 3.5) * 3.5;
    building(a + 0.8, b - 0.8, c + 0.8, d - 0.8, h);
  }
  if (!ring) {
    for (let k = 0; k < 3; k++) {
      const side = Math.floor(srand() * 4), u = sr(-24, 24);
      const p = [[cx + u, cz - 27.6], [cx + u, cz + 27.6], [cx - 27.6, cz + u], [cx + 27.6, cz + u]][side];
      tree(p[0], p[1], 0.8);
    }
    if (srand() < 0.25) simitCart(cx + 27.2, cz + sr(-15, 15), Math.PI / 2);
  }
}
for (let i = -1; i <= NB; i++) for (let j = 0; j <= NB; j++) block(i, j, i === -1 || i === NB || j === NB);
docks(); yali(-200, -311); farShore();
simitCart(-82.5, 40, -Math.PI / 2);
flushInst();
