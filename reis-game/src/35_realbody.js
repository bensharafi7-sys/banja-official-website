
/* ───────── realistic skinned body (glTF, mocap idle/walk/run) driven by the procedural state ───────── */
const IDQ = new T.Quaternion(), _pa = new T.Vector3(), _pb = new T.Vector3(), _pq = new T.Quaternion(), _pw = new T.Quaternion(), _pp = new T.Quaternion();
// rotate a bone (in world space) so the segment bone→child points along dir; w blends from the current pose
function pointBone(bone, child, dir, w) {
  if (w <= 0.001) return;
  bone.getWorldPosition(_pa); child.getWorldPosition(_pb);
  const cur = _pb.sub(_pa); if (cur.lengthSq() < 1e-10) return; cur.normalize();
  _pq.setFromUnitVectors(cur, dir); if (w < 1) _pq.slerpQuaternions(IDQ, _pq, w);
  bone.getWorldQuaternion(_pw).premultiply(_pq);
  bone.parent.getWorldQuaternion(_pp);
  bone.quaternion.copy(_pp.invert().multiply(_pw));
  bone.updateMatrixWorld(true);
}
const findBone = (root, ...names) => { let hit = null; root.traverse(o => { if (hit || !o.isBone) return; const n = o.name.toLowerCase().replace(/^mixamorig[:_]?/, ''); if (names.includes(n)) hit = o; }); return hit; };
/* which realistic model a look maps to: scanned characters (selim, demir, thugs) when shipped, Michelle for women;
   anyone without a model keeps the procedural body */
const REAL_MALE = 'models/soldier.json', REAL_FEMALE = 'models/michelle.json';
function giveRealBody(h, look, role) {
  const female = !!look.skirt || !!look.female;
  const url = look.model || (role === 'gang' ? 'models/thug.json' : female ? REAL_FEMALE : null);
  if (!url) return;
  attachRealBody(h, url, { height: (look.height || 1.78) * (female ? 0.97 : 1) * (role === 'gang' ? rnd(0.97, 1.04) : 1) });
}
const GLTF_CACHE = {};
const loadGLTF = url => GLTF_CACHE[url] ||= new Promise((res, rej) => new GLTFLoader().load(url, res, undefined, rej));
/* retargeting: an invisible mocap skeleton plays Idle/Walk/Run; every frame its bone motion (relative to its own rest
   pose) is transferred onto the character's skeleton, whatever its rest pose (T-pose mocap → A-pose scans) */
const RT_BONES = ['hips', 'spine', 'spine1|spine01', 'spine2|spine02', 'neck', 'head',
  'leftshoulder', 'leftarm', 'leftforearm', 'lefthand', 'rightshoulder', 'rightarm', 'rightforearm', 'righthand',
  'leftupleg', 'leftleg', 'leftfoot', 'lefttoebase', 'rightupleg', 'rightleg', 'rightfoot', 'righttoebase'];
const _rq = new T.Quaternion(), _rq2 = new T.Quaternion(), _rootQ = new T.Quaternion();
const relQ = (bone, root, out) => { root.getWorldQuaternion(_rootQ).invert(); return bone.getWorldQuaternion(out).premultiply(_rootQ); };
function buildRetarget(target, driver) {
  target.updateMatrixWorld(true); driver.updateMatrixWorld(true);
  const pairs = [];
  for (const n of RT_BONES) {
    const names = n.split('|'), t = findBone(target, ...names), d = findBone(driver, ...names);
    if (!t || !d) continue;
    pairs.push({ t, d, qt0: relQ(t, target, new T.Quaternion()), qs0inv: relQ(d, driver, new T.Quaternion()).invert(), pt0: t.position.clone(), ps0: d.position.clone() });
  }
  const hipsT = pairs[0]?.t, hipsD = pairs[0]?.d;
  const k = hipsT && hipsD ? hipsT.getWorldPosition(new T.Vector3()).y / Math.max(1e-4, hipsD.getWorldPosition(new T.Vector3()).y) : 1;
  return { pairs, k, scaleD: driver.getWorldScale(new T.Vector3()).y, scaleT: target.getWorldScale(new T.Vector3()).y };
}
function applyRetarget(rt, target, driver) {
  driver.updateMatrixWorld(true);
  target.getWorldQuaternion(_rootQ);
  const rootQ = _rootQ.clone();
  for (const p of rt.pairs) {
    // wanted orientation of this bone, relative to the character root
    relQ(p.d, driver, _rq).multiply(p.qs0inv).multiply(p.qt0);
    _rq.premultiply(rootQ); // → world
    p.t.parent.getWorldQuaternion(_rq2).invert();
    p.t.quaternion.copy(_rq2.multiply(_rq));
    p.t.updateMatrixWorld(true);
  }
  // hips bob/sway follows the mocap (vertical scaled to the character's leg length)
  const h = rt.pairs[0];
  if (h && h.t.parent) {
    const dy = (h.d.position.y - h.ps0.y), dx = (h.d.position.x - h.ps0.x), dz = (h.d.position.z - h.ps0.z);
    const f = rt.k * rt.scaleD / rt.scaleT;
    h.t.position.set(h.pt0.x + dx * f * 0.3, h.pt0.y + dy * f, h.pt0.z + dz * f * 0.3);
    h.t.updateMatrixWorld(true);
  }
}
// realistic people: each human gets its own clone of a shared skinned model, animated by retargeted mocap
function attachRealBody(h, url, opts = {}) {
  Promise.all([loadGLTF(url), loadGLTF(opts.clips || REAL_MALE)]).then(([gltf, clipSrc]) => {
    const clips = clipSrc.animations.filter(c => /^(Idle|Walk|Run)$/.test(c.name));
    if (clips.length < 2 || h.dead) return;
    const model = SkeletonUtils.clone(gltf.scene), driver = SkeletonUtils.clone(clipSrc.scene);
    model.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = true; o.frustumCulled = false;
      if (/visor/i.test(o.name)) { o.visible = false; return; }
      o.material = o.material.clone(); o.material.envMapIntensity = 0.6; o.material.metalness = Math.min(o.material.metalness ?? 0, 0.15);
      if (o.material.emissiveMap) { o.material.emissiveMap = null; o.material.emissive?.setHex(0); }
      if (opts.tint != null) o.material.color.setHex(opts.tint);
    });
    const B = n => findBone(model, ...n);
    model.updateMatrixWorld(true);
    const top = B(['headtop_end', 'head_end', 'head']), tp = top.getWorldPosition(new T.Vector3()), ft = B(['lefttoebase', 'leftfoot']).getWorldPosition(new T.Vector3());
    const s = (opts.height || 1.78) / Math.max(0.1, tp.y - Math.min(0, ft.y - 0.08)); model.scale.setScalar(s);
    model.rotation.y = opts.yaw ?? 0;
    const holder = grp(h.root); holder.add(model);
    h.root.updateMatrixWorld(true);
    const R = {
      model, holder, driver, hips: B(['hips']), spine: B(['spine2', 'spine02', 'spine1', 'chest']), head: B(['head']), headTop: B(['headtop_end', 'head_end']),
      arm: [B(['leftarm']), B(['rightarm'])], fore: [B(['leftforearm']), B(['rightforearm'])], hand: [B(['lefthand']), B(['righthand'])],
      up: [B(['leftupleg']), B(['rightupleg'])], leg: [B(['leftleg']), B(['rightleg'])], foot: [B(['leftfoot']), B(['rightfoot'])],
      mixer: new T.AnimationMixer(driver), acts: {}, scale: s,
    };
    R.rt = buildRetarget(model, driver);
    for (const c of clips) { const a = R.mixer.clipAction(c); a.play(); a.time = Math.random() * c.duration; a.weight = c.name === 'Idle' ? 1 : 0; a.setEffectiveWeight(a.weight); R.acts[c.name] = a; }
    R.mixer.update(0.01); applyRetarget(R.rt, model, driver);
    // photographic head rides the head bone; the model's own head collapses to nothing
    if (opts.photo) {
      const fake = { head: new T.Group() }; photoHead(fake, opts.photo); R.photo = fake.head; scene.add(R.photo);
      R.photo.scale.setScalar(opts.headScale || 0.92);
      R.headQ0 = R.head.getWorldQuaternion(new T.Quaternion()).invert().multiply(holder.getWorldQuaternion(new T.Quaternion()));
    }
    h.body.visible = false;
    if (h.gun) { scene.add(h.gun.g); h.gunFree = true; }
    h.real = R;
  }).catch(e => { console.warn('real body', url, e && e.message); /* keep the procedural body */ });
}
const _f = new T.Vector3(), _r = new T.Vector3(), _u = new T.Vector3(0, 1, 0), _d1 = new T.Vector3(), _d2 = new T.Vector3(), _hq = new T.Quaternion(), _hp = new T.Vector3();
function syncRealBody(h, dt, speed, st = {}) {
  const R = h.real; if (!R) return;
  const seated = !!st.seated;
  // locomotion blend by ground speed; foot speed matched with timeScale
  const w = seated ? { Idle: 0, Walk: 0, Run: 0 } : speed < 0.15 ? { Idle: 1, Walk: 0, Run: 0 } :
    speed < 3 ? { Idle: Math.max(0, 1 - speed / 0.8), Walk: Math.min(1, speed / 0.8), Run: 0 } :
    { Idle: 0, Walk: clamp(1 - (speed - 3) / 2, 0, 1), Run: clamp((speed - 3) / 2, 0, 1) };
  for (const k in R.acts) {
    const a = R.acts[k], tw = w[k] ?? 0;
    a.weight = lerp(a.weight ?? 0, tw, damp(10, dt)); a.setEffectiveWeight(a.weight);
    if (k === 'Walk') a.timeScale = clamp(speed / 1.5, 0.6, 1.6); if (k === 'Run') a.timeScale = clamp(speed / 5.2, 0.7, 1.4);
  }
  R.mixer.update(dt);
  applyRetarget(R.rt, R.model, R.driver);
  // falls and knock-downs tip the whole body like the procedural rig
  R.holder.rotation.x = h.body.rotation.x; R.holder.position.y = h.body.position.y;
  R.model.updateMatrixWorld(true);
  // world-space helpers: forward, right, up of the character
  h.root.getWorldQuaternion(_hq);
  _f.set(0, 0, 1).applyQuaternion(_hq); _r.set(-1, 0, 0).applyQuaternion(_hq);
  const side = i => (i === 0 ? -1 : 1); // 0 = left arm → character's left = −right
  const n = v => v.normalize();
  for (let i = 0; i < 2; i++) {
    const sv = _d1.copy(_r).multiplyScalar(side(i));
    if (!R.arm[i] || !R.fore[i] || !R.hand[i]) continue;
    if (seated) {
      if (st.car) {
        pointBone(R.arm[i], R.fore[i], n(_d2.copy(_f).multiplyScalar(0.8).addScaledVector(_u, -0.45).addScaledVector(sv, 0.12)), 1);
        pointBone(R.fore[i], R.hand[i], n(_d2.copy(_f).multiplyScalar(0.9).addScaledVector(_u, 0.15).addScaledVector(sv, -0.25)), 1);
      }
      pointBone(R.up[i], R.leg[i], n(_d2.copy(_f).addScaledVector(_u, -0.15).addScaledVector(sv, 0.08)), 1);
      pointBone(R.leg[i], R.foot[i], n(_d2.copy(_u).multiplyScalar(-1).addScaledVector(_f, 0.25)), 1);
      continue;
    }
    // guard: fists up in front of the chin
    if (h.guardK > 0.01) {
      pointBone(R.arm[i], R.fore[i], n(_d2.copy(_f).multiplyScalar(0.5).addScaledVector(_u, -0.75).addScaledVector(sv, 0.3)), h.guardK);
      pointBone(R.fore[i], R.hand[i], n(_d2.copy(_u).multiplyScalar(0.85).addScaledVector(_f, 0.45).addScaledVector(sv, -0.25)), h.guardK);
    }
    // punches: straight jab/cross or a swinging hook
    if (h.act && h.act.arm === i) {
      const q = h.act.t / h.act.dur, k = q < 0.22 ? 0 : q < 0.45 ? (q - 0.22) / 0.23 : Math.max(0, 1 - (q - 0.45) / 0.55);
      if (h.act.type === 'hook') { pointBone(R.arm[i], R.fore[i], n(_d2.copy(_f).multiplyScalar(0.4).addScaledVector(sv, 0.8)), k); pointBone(R.fore[i], R.hand[i], n(_d2.copy(_f).multiplyScalar(0.7).addScaledVector(sv, -0.7)), k); }
      else { pointBone(R.arm[i], R.fore[i], n(_d2.copy(_f).addScaledVector(_u, 0.05)), k); pointBone(R.fore[i], R.hand[i], n(_d2.copy(_f).addScaledVector(_u, 0.05)), k); }
    }
    // pistol aim: right arm straight along the aim line, left hand supports
    if (h.aimK > 0.01) {
      const aim = _d2.copy(_f).multiplyScalar(Math.cos(h.aimPitch + h.recoil * 0.25)).addScaledVector(_u, Math.sin(h.aimPitch + h.recoil * 0.25));
      if (i === 1) { pointBone(R.arm[i], R.fore[i], aim, h.aimK); pointBone(R.fore[i], R.hand[i], aim, h.aimK); }
      else { const a2 = aim.clone(); pointBone(R.arm[i], R.fore[i], n(a2.clone().addScaledVector(_r, 0.75).addScaledVector(_u, -0.35)), h.aimK); pointBone(R.fore[i], R.hand[i], n(a2.addScaledVector(_r, 0.9)), h.aimK); }
    }
    if (h.panicK > 0.01) { pointBone(R.arm[i], R.fore[i], n(_d2.copy(_u).addScaledVector(sv, 0.35)), h.panicK); pointBone(R.fore[i], R.hand[i], n(_d2.copy(_u).addScaledVector(sv, -0.2)), h.panicK); }
    if (h.phoneK > 0.01 && i === 1) { pointBone(R.arm[i], R.fore[i], n(_d2.copy(_u).multiplyScalar(-0.6).addScaledVector(sv, 0.6).addScaledVector(_f, 0.2)), h.phoneK); pointBone(R.fore[i], R.hand[i], n(_d2.copy(_u).addScaledVector(sv, -0.5)), h.phoneK); }
  }
  // the photo head follows the head bone
  if (R.photo) {
    R.head.updateMatrixWorld(true);
    R.head.getWorldPosition(_hp);
    R.photo.position.copy(_hp).addScaledVector(_u, -0.035);
    R.head.getWorldQuaternion(R.photo.quaternion).multiply(R.headQ0);
    R.head.scale.setScalar(0.001);
    R.photo.visible = h.root.visible !== false;
  }
  // the pistol rides in the right hand pointing along the aim
  if (h.gun && h.gun.g.parent === scene && R.hand[1]) {
    R.hand[1].getWorldPosition(h.gun.g.position);
    const aim = _d2.copy(_f).multiplyScalar(Math.cos(h.aimPitch)).addScaledVector(_u, Math.sin(h.aimPitch));
    h.gun.g.lookAt(_d1.copy(h.gun.g.position).add(aim));
    h.gun.g.position.addScaledVector(aim, 0.03).addScaledVector(_u, -0.03);
  }
}
