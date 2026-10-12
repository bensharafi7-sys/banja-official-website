import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { Water } from 'three/addons/objects/Water.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const T = THREE, TAU = Math.PI * 2;
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (k, dt) => 1 - Math.exp(-k * dt);
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
let seed = 20261012;
const srand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const sr = (a, b) => a + srand() * (b - a);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const TOUCH = matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window && innerWidth < 1100);
const LOW = TOUCH;

/* ───────── renderer, Pixar-style soft light + bloom ───────── */
const renderer = new T.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1.5 : 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputColorSpace = T.SRGBColorSpace;
$('game').appendChild(renderer.domElement);

const scene = new T.Scene();
scene.fog = new T.Fog(0x161c2c, 35, LOW ? 260 : 330);
const camera = new T.PerspectiveCamera(56, innerWidth / innerHeight, 0.1, 2600);

/* post: MSAA scene → bloom → tone map → film grade (teal shadows, amber highlights, vignette, grain) */
let composer = null;
const GRADE = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, vig: { value: 1.0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time, vig; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 d = vUv - 0.5; float r = dot(d, d);
      vec3 c = vec3(texture2D(tDiffuse, vUv - d * 0.0025).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv + d * 0.0025).b);
      float l = dot(c, vec3(0.299,0.587,0.114));
      c = mix(c, c * vec3(0.86,1.0,1.08), smoothstep(0.35, 0.0, l));   // teal shadows
      c = mix(c, c * vec3(1.08,1.0,0.88), smoothstep(0.35, 0.9, l));   // amber highlights
      c = mix(vec3(l), c, 1.08);                                         // a touch more colour
      c = (c - 0.5) * 1.06 + 0.5;                                        // contrast
      c *= 1.0 - vig * smoothstep(0.12, 0.62, r) * 0.75;                 // vignette
      c += (hash(vUv * 1000.0 + time) - 0.5) * 0.035;                    // grain
      gl_FragColor = vec4(max(c, 0.0), 1.0);
    }` };
let gradePass = null;
{
  const rt = new T.WebGLRenderTarget(innerWidth * renderer.getPixelRatio(), innerHeight * renderer.getPixelRatio(), { type: T.HalfFloatType, samples: LOW ? 2 : 4 });
  composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new T.Vector2(innerWidth / (LOW ? 3 : 2), innerHeight / (LOW ? 3 : 2)), 0.7, 0.55, 0.6));
  composer.addPass(new OutputPass());
  gradePass = new ShaderPass(GRADE); composer.addPass(gradePass);
}

const sunDir = new T.Vector3(-0.42, 0.22, -0.88).normalize();
const sky = new T.Mesh(new T.SphereGeometry(2000, 32, 16), new T.ShaderMaterial({
  side: T.BackSide, depthWrite: false, fog: false, uniforms: { sunDir: { value: sunDir } },
  vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `varying vec3 vD; uniform vec3 sunDir;
    void main(){ float h = vD.y;
      vec3 top = vec3(0.02,0.03,0.08), mid = vec3(0.07,0.07,0.15), hor = vec3(0.26,0.16,0.20);
      vec3 c = mix(hor, mid, smoothstep(0.0, 0.16, h)); c = mix(c, top, smoothstep(0.14, 0.7, h));
      if (h < 0.0) c = mix(hor, vec3(0.55,0.42,0.48), smoothstep(0.0, -0.15, h));
      float s = max(dot(vD, sunDir), 0.0);
      c += vec3(0.5,0.6,0.9) * pow(s, 30.0) * 0.25 + vec3(0.9,0.93,1.0) * pow(s, 2000.0) * 2.0;
      gl_FragColor = vec4(pow(c, vec3(2.2)), 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
}));
scene.add(sky);
// painterly clouds
{
  const cm = new T.MeshBasicMaterial({ color: 0x1a1f2e, fog: false, transparent: true, opacity: 0.85 });
  for (let i = 0; i < 26; i++) {
    const g = new T.Group(), a = sr(0, TAU), d = sr(900, 1500);
    for (let k = 0; k < 5; k++) { const m = new T.Mesh(new T.SphereGeometry(1, 12, 8), cm); m.position.set(k * 38 - 76 + sr(-10, 10), sr(-6, 12), sr(-10, 10)); m.scale.set(sr(30, 55), sr(14, 24), sr(20, 30)); g.add(m); }
    g.position.set(Math.cos(a) * d, sr(220, 420), Math.sin(a) * d); g.lookAt(0, g.position.y, 0); scene.add(g);
  }
}

const hemi = new T.HemisphereLight(0x6a7cac, 0x3a2a24, 1.0);
scene.add(hemi);
const sun = new T.DirectionalLight(0xa9bcff, 0.5);
sun.castShadow = true;
sun.shadow.mapSize.set(LOW ? 1024 : 2048, LOW ? 1024 : 2048);
const SR = LOW ? 45 : 62;
Object.assign(sun.shadow.camera, { left: -SR, right: SR, top: SR, bottom: -SR, near: 1, far: 420 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05;
scene.add(sun, sun.target);
const rim = new T.DirectionalLight(0xff9a50, 0.45); rim.position.set(1, 0.6, 1); scene.add(rim);
// wet-night reflections: a dim environment of warm windows, red neon and sodium lamps
{
  const env = new T.Scene(); env.background = new T.Color(0x05070d);
  const em = (c, i) => new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(i) });
  for (let i = 0; i < 26; i++) { const a = i / 26 * TAU, m = new T.Mesh(new T.BoxGeometry(2, rnd(1, 4), 0.2), em(pick([0xffb050, 0xff6040, 0xffd090, 0x6080ff]), rnd(0.5, 1.6))); m.position.set(Math.cos(a) * 12, rnd(-1, 5), Math.sin(a) * 12); m.lookAt(0, 0, 0); env.add(m); }
  const pm = new T.PMREMGenerator(renderer); scene.environment = pm.fromScene(env, 0.04).texture;
}
/* rain: streaks that follow the camera */
const RAIN_N = LOW ? 900 : 2200, rainPos = new Float32Array(RAIN_N * 6);
const rainGeo = new T.BufferGeometry(); rainGeo.setAttribute('position', new T.BufferAttribute(rainPos, 3));
const rain = new T.LineSegments(rainGeo, new T.LineBasicMaterial({ color: 0x9fb2d8, transparent: true, opacity: 0.38, fog: true }));
rain.frustumCulled = false; scene.add(rain);
for (let i = 0; i < RAIN_N; i++) { const x = rnd(-35, 35), y = rnd(0, 30), z = rnd(-35, 35); rainPos.set([x, y, z, x + 0.05, y + 0.7, z], i * 6); }
function updateRain(dt, c) {
  for (let i = 0; i < RAIN_N; i++) {
    const o = i * 6; let y = rainPos[o + 1] - dt * 22;
    let x = rainPos[o], z = rainPos[o + 2];
    if (y < 0 || Math.abs(x - c.x) > 35 || Math.abs(z - c.z) > 35) { x = c.x + rnd(-35, 35); z = c.z + rnd(-35, 35); y = c.y + rnd(5, 25); }
    rainPos[o] = x; rainPos[o + 1] = y; rainPos[o + 2] = z; rainPos[o + 3] = x + 0.05; rainPos[o + 4] = y + 0.7; rainPos[o + 5] = z;
  }
  rainGeo.attributes.position.needsUpdate = true;
}

/* ───────── helpers ───────── */
const matCache = new Map();
function mat(c, o = {}) {
  const k = c + JSON.stringify(o);
  if (!matCache.has(k)) {
    let m;
    if (o.skin) m = new T.MeshPhysicalMaterial({ color: c, roughness: 0.52, sheen: 0.45, sheenColor: new T.Color(0xffb59c), sheenRoughness: 0.5 });
    else if (o.cc) m = new T.MeshPhysicalMaterial({ color: c, roughness: o.r ?? 0.3, metalness: o.m ?? 0.2, clearcoat: 1, clearcoatRoughness: 0.15 });
    else m = new T.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.75, metalness: o.m ?? 0 });
    if (o.map) m.map = o.map;
    if (o.e != null) { m.emissive = new T.Color(o.e); m.emissiveIntensity = o.ei ?? 1; }
    if (o.t != null) { m.transparent = true; m.opacity = o.t; }
    if (o.fog === false) m.fog = false;
    matCache.set(k, m);
  }
  return matCache.get(k);
}
const SPH = new T.SphereGeometry(1, 32, 22), SPHM = new T.SphereGeometry(1, 18, 12), SPHL = new T.SphereGeometry(1, 10, 8);
const BOX = new T.BoxGeometry(1, 1, 1), RBOX = new RoundedBoxGeometry(1, 1, 1, 3, 0.18);
const CYL = new T.CylinderGeometry(1, 1, 1, 20), CYL8 = new T.CylinderGeometry(1, 1, 1, 10);
const CONE = new T.ConeGeometry(1, 1, 16), CONE4 = new T.ConeGeometry(1, 1, 4);
const capCache = new Map();
const capsule = (r, l, seg = 16) => { const k = r.toFixed(3) + '_' + l + '_' + seg; if (!capCache.has(k)) capCache.set(k, new T.CapsuleGeometry(r, l, 6, seg)); return capCache.get(k); };
function mesh(geo, m, parent, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, shadow = true) {
  const o = new T.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz);
  o.castShadow = shadow; if (parent) parent.add(o); return o;
}
function grp(parent, x = 0, y = 0, z = 0) { const g = new T.Group(); g.position.set(x, y, z); if (parent) parent.add(g); return g; }
function canvasTex(w, h, draw, repeat = false) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; if (repeat) t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4; return t;
}
// salt-and-pepper hair texture (the grey beard)
const pepperTex = (base, light, dens) => { const t = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < dens * 3; i++) { g.fillStyle = Math.random() < 0.5 ? light : 'rgba(0,0,0,.45)'; g.fillRect(Math.random() * w, Math.random() * h, 1, 2 + Math.random() * 2); }
}, true); t.repeat.set(3, 3); return t; };

/* instanced batches */
const inst = {};
function addInst(name, geo, m, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = null, shadow = false) {
  (inst[name] ||= { geo, m, list: [], shadow }).list.push([x, y, z, sx, sy, sz, rx, ry, rz, color]);
}
function flushInst() {
  const d = new T.Object3D();
  for (const k in inst) {
    const b = inst[k]; const im = new T.InstancedMesh(b.geo, b.m, b.list.length);
    b.list.forEach((p, i) => {
      d.position.set(p[0], p[1], p[2]); d.scale.set(p[3], p[4], p[5]); d.rotation.set(p[6], p[7], p[8]); d.updateMatrix();
      im.setMatrixAt(i, d.matrix); if (p[9] != null) im.setColorAt(i, new T.Color(p[9]));
    });
    im.castShadow = b.shadow; im.receiveShadow = true; scene.add(im);
    delete inst[k];
  }
}

/* ───────── world layout + collisions ───────── */
const BLK = 70, RW = 12, NB = 8, ORG = -280, LANE = 2.6;
const roadAt = k => ORG + k * BLK;
const BOUND = { x0: -288, x1: 288, z0: -317, z1: 288 };
const roadDist = v => { const k = Math.round((v - ORG) / BLK); return Math.abs(v - (ORG + k * BLK)); };
const groundH = (x, z) => (z > -286 && roadDist(x) > RW / 2 && roadDist(z) > RW / 2) ? 0.12 : 0;

const CELL = 30, grid = new Map(); let stamp = 0;
const footprints = [];
function addCol(x0, x1, z0, z1, h = 99) {
  const c = { x0, x1, z0, z1, h, s: 0 };
  for (let cx = Math.floor(x0 / CELL); cx <= Math.floor(x1 / CELL); cx++)
    for (let cz = Math.floor(z0 / CELL); cz <= Math.floor(z1 / CELL); cz++) {
      const k = cx + ',' + cz; if (!grid.has(k)) grid.set(k, []); grid.get(k).push(c);
    }
  return c;
}
function nearCols(x, z, r) {
  stamp++; const out = [];
  for (let cx = Math.floor((x - r) / CELL); cx <= Math.floor((x + r) / CELL); cx++)
    for (let cz = Math.floor((z - r) / CELL); cz <= Math.floor((z + r) / CELL); cz++) {
      const a = grid.get(cx + ',' + cz); if (!a) continue;
      for (const c of a) if (c.s !== stamp) { c.s = stamp; out.push(c); }
    }
  return out;
}
function collide(p, r) {
  let hit = null;
  for (const c of nearCols(p.x, p.z, r)) {
    const cx = clamp(p.x, c.x0, c.x1), cz = clamp(p.z, c.z0, c.z1);
    let dx = p.x - cx, dz = p.z - cz; const d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    if (d2 < 1e-8) {
      const l = p.x - c.x0, rr = c.x1 - p.x, b = p.z - c.z0, t = c.z1 - p.z, m = Math.min(l, rr, b, t);
      if (m === l) { p.x = c.x0 - r; hit = { x: -1, z: 0 }; } else if (m === rr) { p.x = c.x1 + r; hit = { x: 1, z: 0 }; }
      else if (m === b) { p.z = c.z0 - r; hit = { x: 0, z: -1 }; } else { p.z = c.z1 + r; hit = { x: 0, z: 1 }; }
    } else { const d = Math.sqrt(d2); dx /= d; dz /= d; p.x = cx + dx * r; p.z = cz + dz * r; hit = { x: dx, z: dz }; }
  }
  return hit;
}
function insideBuilding(x, y, z, m = 0.6) {
  for (const c of nearCols(x, z, m + 0.5)) if (x > c.x0 - m && x < c.x1 + m && z > c.z0 - m && z < c.z1 + m && y < c.h + m) return true;
  return false;
}
// distance along a ray until it enters a building (Infinity if clear within maxD)
function rayBlock(o, d, maxD) {
  let best = Infinity;
  const steps = Math.ceil(maxD / CELL) + 1;
  stamp++;
  for (let s = 0; s <= steps; s++) {
    const px = o.x + d.x * Math.min(maxD, s * CELL), pz = o.z + d.z * Math.min(maxD, s * CELL);
    for (let cx = Math.floor(px / CELL) - 1; cx <= Math.floor(px / CELL) + 1; cx++) for (let cz = Math.floor(pz / CELL) - 1; cz <= Math.floor(pz / CELL) + 1; cz++) {
      const a = grid.get(cx + ',' + cz); if (!a) continue;
      for (const c of a) {
        if (c.s === stamp) continue; c.s = stamp;
        let t0 = 0, t1 = maxD;
        for (const [oo, dd, lo, hi] of [[o.x, d.x, c.x0, c.x1], [o.z, d.z, c.z0, c.z1]]) {
          if (Math.abs(dd) < 1e-9) { if (oo < lo || oo > hi) { t0 = 1; t1 = 0; } continue; }
          let a1 = (lo - oo) / dd, a2 = (hi - oo) / dd; if (a1 > a2) [a1, a2] = [a2, a1];
          t0 = Math.max(t0, a1); t1 = Math.min(t1, a2);
        }
        if (t0 <= t1 && t0 < best && o.y + d.y * t0 < c.h) best = t0;
      }
    }
  }
  return best;
}
// planar UVs by face direction so one facade texture tiles at real-world scale on any geometry
function planarUV(geo, w, h, d) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i);
    if (Math.abs(ny) > 0.6) { uv.setXY(i, 0.01, 0.995); continue; }
    const u = Math.abs(nx) > Math.abs(nz) ? (p.getZ(i) + d / 2) : (p.getX(i) + w / 2);
    uv.setXY(i, u / 32, (p.getY(i) + h / 2) / 64);
  }
  uv.needsUpdate = true; return geo;
}
