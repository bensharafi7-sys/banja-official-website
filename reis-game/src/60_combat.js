
/* ───────── combat FX ───────── */
const tracers = [];
const tracerM = new T.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.9, fog: false });
const TRACER = new T.CylinderGeometry(0.015, 0.015, 1, 4, 1, true).rotateX(Math.PI / 2).translate(0, 0, 0.5);
const sparkM = new T.MeshBasicMaterial({ color: 0xffc56a, transparent: true });
const flashLight = new T.PointLight(0xffc070, 0, 9, 2); scene.add(flashLight);
function tracer(from, to) {
  const m = new T.Mesh(TRACER, tracerM.clone()); m.position.copy(from); m.lookAt(to); m.scale.set(1, 1, from.distanceTo(to));
  scene.add(m); tracers.push({ m, life: 0.07 });
  const s = new T.Mesh(SPHL, sparkM.clone()); s.position.copy(to); s.scale.setScalar(0.12); scene.add(s); tracers.push({ m: s, life: 0.15, grow: 1 });
}
function updateFX(dt) {
  for (let i = tracers.length - 1; i >= 0; i--) {
    const f = tracers[i]; f.life -= dt; f.m.material.opacity = Math.max(0, f.life * 10);
    if (f.grow) f.m.scale.multiplyScalar(1 + dt * 6);
    if (f.life <= 0) { scene.remove(f.m); f.m.material.dispose(); tracers.splice(i, 1); }
  }
  flashLight.intensity = Math.max(0, flashLight.intensity - dt * 120);
}
function muzzle(h) {
  const p = new T.Vector3(); h.gun.flash.getWorldPosition(p);
  h.gun.flash.visible = true; h.gun.flash.rotation.z = Math.random() * TAU; setTimeout(() => h.gun.flash.visible = false, 50);
  flashLight.position.copy(p); flashLight.intensity = 6; h.recoil = 1;
  return p;
}

/* ───────── hit testing: three spheres per body ───────── */
function bodySpheres(o) {
  const s = o.scale || 1, p = o.pos;
  if (o.h && o.h.downK > 0.5) return [[p.x, p.y + 0.3, p.z, 0.45, 1]];
  return [[p.x, p.y + 1.66 * s, p.z, 0.17, 2.2], [p.x, p.y + 1.22 * s, p.z, 0.3, 1], [p.x, p.y + 0.62 * s, p.z, 0.24, 0.7]];
}
function rayHit(o, d, maxD, ignore) {
  let best = null;
  const test = (ref, list) => {
    for (const [x, y, z, r, mul] of list) {
      const ox = x - o.x, oy = y - o.y, oz = z - o.z, b = ox * d.x + oy * d.y + oz * d.z;
      if (b < 0) continue;
      const c2 = ox * ox + oy * oy + oz * oz - b * b; if (c2 > r * r) continue;
      const t = b - Math.sqrt(r * r - c2);
      if (t < maxD && (!best || t < best.t)) best = { t, ref, mul };
    }
  };
  for (const a of actors) if (!a.dead && a !== ignore) test(a, bodySpheres(a));
  for (const p of peds) if (p.h.root.visible && p !== ignore && p.state !== 'out') test(p, bodySpheres(p));
  return best;
}

/* ───────── actors: Tayfun's men and police officers on foot ───────── */
const actors = [];
function makeActor(faction, x, z, weapon, o = {}) {
  const look = faction === 'police' ? COP_LOOK() : GANG_LOOK();
  if (o.look) Object.assign(look, o.look);
  const h = createHuman({ ...look, low: actors.length > 6 && LOW });
  giveRealBody(h, look, faction === 'police' ? 'cop' : 'gang');
  h.root.position.set(x, groundH(x, z), z); scene.add(h.root);
  h.gun.g.visible = weapon === 'pistol';
  const a = { h, pos: h.root.position, facing: o.facing ?? rnd(0, TAU), speed: 0, hp: o.hp ?? (weapon === 'pistol' ? 70 : 90), maxHp: 0, faction, weapon,
    state: o.state || 'idle', home: new T.Vector3(x, 0, z), alert: o.alert ? 1 : 0, cd: rnd(0.5, 1.5), burst: 0, strafe: Math.random() < 0.5 ? 1 : -1, strafeT: rnd(1, 3),
    dead: false, deadT: 0, tag: o.tag || null, scale: 1, reward: o.reward ?? Math.floor(rnd(40, 160)), turn: 0, attackHit: false };
  a.maxHp = a.hp; actors.push(a); return a;
}
function removeActor(a) { scene.remove(a.h.root); if (a.h.gunFree) scene.remove(a.h.gun.g); const i = actors.indexOf(a); if (i >= 0) actors.splice(i, 1); }
function hostile(a) {
  if (a.dead) return false;
  if (a.faction === 'gang') return a.alert > 0;
  if (a.faction === 'police') return S.wanted >= 1;
  return false;
}
function canSee(from, to, maxD) {
  const d = new T.Vector3(to.x - from.x, to.y - from.y, to.z - from.z), L = d.length(); if (L > maxD) return false;
  d.divideScalar(L); return rayBlock(from, d, L) >= L;
}
const tmpV = new T.Vector3(), tmpV2 = new T.Vector3();
function alertGang(pos, r) { for (const a of actors) if (a.faction === 'gang' && !a.dead && a.pos.distanceTo(pos) < r && !a.alert) { a.alert = 1; bark(['b1', 'b2'], a.h, a.pos); } }
function hurtActor(a, dmg, fromPos, kind) {
  if (a.dead) return;
  a.hp -= dmg; a.h.hitK = 1; a.h.hitSide = Math.random() < 0.5 ? 1 : -1;
  if (a.faction === 'gang') { if (!a.alert) alertGang(a.pos, 25); a.alert = 1; }
  if (a.faction === 'police') addWanted(a.hp <= 0 ? 2 : 1);
  if (Math.random() < 0.3) bark(['b3'], a.h, a.pos);
  if (kind === 'punch') { const d = tmpV.subVectors(a.pos, fromPos).setY(0).normalize(); a.pos.addScaledVector(d, 0.45); collide(a.pos, 0.35); }
  if (a.hp <= 0) {
    a.dead = true; a.deadT = 0; a.h.gun.g.visible = false;
    const toA = Math.atan2(a.pos.x - fromPos.x, a.pos.z - fromPos.z);
    a.h.fallDir = Math.cos(angDiff(a.facing, toA)) < 0 ? 1 : -1;
    sfx('fall', a.pos); hitMarker(true);
    if (a.reward && a.faction === 'gang') { S.money += a.reward; floatText(`₺${a.reward}+`); }
    onActorDown(a);
  }
}
function actorShoot(a, target, dist) {
  const from = muzzle(a.h);
  sfx('gun', a.pos); scarePeds(a.pos, 45);
  let chance = 0.6 * clamp(1 - dist / 38, 0.15, 1) * (player.car ? 0.55 : 1) * (player.speed > 4 ? 0.6 : 1) * (a.faction === 'police' ? 0.8 : 1);
  if (a.burstBonus) chance *= 0.7;
  const hitIt = Math.random() < chance;
  const tgt = tmpV2.set(target.x + (hitIt ? 0 : rnd(-1.4, 1.4)), target.y + (hitIt ? rnd(0.9, 1.5) : rnd(0.2, 2.4)), target.z + (hitIt ? 0 : rnd(-1.4, 1.4)));
  tracer(from, tgt);
  if (hitIt) hurtPlayer(rnd(6, 11) * (player.car ? 0.6 : 1), a.pos);
  else if (dist < 25) sfx('whiz');
}
function actorUpdate(a, dt) {
  const h = a.h;
  if (a.dead) {
    a.deadT += dt; animateHuman(h, dt, 0, { down: true });
    if (a.deadT > 30 && a.pos.distanceTo(playerPos()) > 40) removeActor(a);
    return;
  }
  const pp = playerPos(), dx = pp.x - a.pos.x, dz = pp.z - a.pos.z, dist = Math.hypot(dx, dz);
  const toP = Math.atan2(dx, dz);
  let wantSpeed = 0, wantDir = a.facing, guard = false, aim = false, angry = false;
  const eye = tmpV.set(a.pos.x, a.pos.y + 1.6, a.pos.z), pEye = { x: pp.x, y: pp.y + 1.4, z: pp.z };
  a.seeT = (a.seeT || 0) - dt;
  if (a.seeT <= 0) { a.sees = dist < 60 && canSee(eye, pEye, 60); a.seeT = 0.35; }
  if (a.faction === 'gang' && !a.alert && dist < 16 && a.sees && mode === 'play') { alertGang(a.pos, 25); }
  if (a.faction === 'gang' && !a.alert && player.weaponOut && dist < 28 && a.sees && mode === 'play') alertGang(a.pos, 25);
  const fight = hostile(a) && mode === 'play' && !player.dead;
  if (fight && a.hp < a.maxHp * 0.22 && a.faction === 'gang' && !a.fleeing && Math.random() < 0.004) a.fleeing = true;
  if (a.fleeing) {
    wantDir = toP + Math.PI; wantSpeed = 6; h.panicK = 0.5;
    if (dist > 70) { a.fleeing = false; a.alert = 0; }
  } else if (fight) {
    angry = true;
    if (a.weapon === 'pistol') {
      aim = a.sees && dist < 42;
      a.strafeT -= dt; if (a.strafeT < 0) { a.strafe *= -1; a.strafeT = rnd(1.2, 3); }
      if (dist > 17 || !a.sees) { wantDir = toP; wantSpeed = a.sees ? 3.5 : 5; }
      else if (dist < 7) { wantDir = toP + Math.PI; wantSpeed = 2.5; }
      else { wantDir = toP + a.strafe * Math.PI / 2; wantSpeed = 1.6; }
      a.cd -= dt;
      if (aim && a.cd <= 0) {
        a.burst = a.burst > 0 ? a.burst - 1 : Math.floor(rnd(2, 4));
        actorShoot(a, pp, dist);
        a.cd = a.burst > 0 ? rnd(0.22, 0.38) : rnd(1.1, 2.2);
      }
      if (a.faction === 'police' && S.wanted < 2) { aim = false; wantDir = toP; wantSpeed = dist > 1.6 ? 5 : 0; if (dist < 1.6 && !player.car) tryArrest(dt); }
    } else {
      guard = dist < 6;
      if (dist > 1.35) { wantDir = toP + (dist < 4 ? a.strafe * 0.5 : 0); wantSpeed = dist > 6 ? 5.5 : 2.4; }
      a.cd -= dt;
      if (dist < 1.7 && a.cd <= 0 && !player.car) { h.act = { type: Math.random() < 0.35 ? 'hook' : 'cross', arm: Math.random() < 0.5 ? 1 : 0, t: 0, dur: 0.55 }; a.attackHit = false; a.cd = rnd(0.9, 1.6); sfx('whoosh', a.pos); }
      if (h.act && !a.attackHit && h.act.t > 0.24) {
        a.attackHit = true;
        if (dist < 1.9 && !player.car && Math.cos(angDiff(a.facing, toP)) > 0.5) { hurtPlayer(rnd(8, 13), a.pos, 'punch'); sfx('punch', a.pos); }
      }
    }
    if (Math.random() < 0.003) bark(['b1', 'b2', 'rb2'].slice(0, 2), h, a.pos);
  } else {
    // idle life: lean around the home spot, wander a little
    a.wT = (a.wT || 0) - dt;
    if (a.wT <= 0) { a.wT = rnd(3, 7); a.wTarget = new T.Vector3(a.home.x + rnd(-4, 4), 0, a.home.z + rnd(-4, 4)); a.wWalk = Math.random() < 0.5; }
    if (a.wWalk && a.wTarget) { const ddx = a.wTarget.x - a.pos.x, ddz = a.wTarget.z - a.pos.z; if (Math.hypot(ddx, ddz) > 0.5) { wantDir = Math.atan2(ddx, ddz); wantSpeed = 1.2; } }
    if (a.faction === 'police' && S.wanted === 0 && a.pos.distanceTo(pp) > 80) { removeActor(a); return; }
  }
  // face the player when aiming/fighting, otherwise the movement direction
  const faceDir = (aim || guard || (fight && dist < 4)) ? toP : wantDir;
  const df = angDiff(a.facing, faceDir), stp = clamp(df, -8 * dt, 8 * dt); a.facing += stp; a.turn = stp / dt;
  a.speed = lerp(a.speed, wantSpeed, damp(6, dt));
  if (h.act) a.speed *= 0.6;
  const mvx = Math.sin(wantDir) * a.speed * dt, mvz = Math.cos(wantDir) * a.speed * dt;
  a.pos.x += mvx; a.pos.z += mvz;
  for (const b of actors) if (b !== a && !b.dead) { const ox = a.pos.x - b.pos.x, oz = a.pos.z - b.pos.z, d = Math.hypot(ox, oz); if (d < 0.8 && d > 1e-3) { a.pos.x += ox / d * (0.8 - d) * 0.5; a.pos.z += oz / d * (0.8 - d) * 0.5; } }
  if (!player.car && dist < 0.75) { a.pos.x -= dx / dist * (0.75 - dist); a.pos.z -= dz / dist * (0.75 - dist); }
  collide(a.pos, 0.35);
  a.pos.x = clamp(a.pos.x, BOUND.x0, BOUND.x1); a.pos.z = clamp(a.pos.z, BOUND.z0, BOUND.z1);
  a.pos.y = groundH(a.pos.x, a.pos.z);
  h.root.rotation.y = a.facing;
  h.aimPitch = aim ? clamp(Math.atan2(0.2, dist), -0.3, 0.3) : 0;
  // walking backwards/sideways: animate with the actual ground speed
  animateHuman(h, dt, a.speed, { guard, aim, angry, turn: a.turn, lookAt: fight ? 0 : null });
}

/* ───────── pedestrians: routines, chats, tea, phone calls; flee from danger ───────── */
const peds = [];
function perim(cx, cz, s) {
  const R = 27.6, L = 55.2; s = ((s % (4 * L)) + 4 * L) % (4 * L);
  const seg = Math.floor(s / L), u = s % L - R;
  return [[cx + u, cz - R], [cx + R, cz + u], [cx - u, cz + R], [cx - R, cz - u]][seg];
}
function perimParam(cx, cz, x, z) {
  const R = 27.6, L = 55.2, dx = x - cx, dz = z - cz;
  if (Math.abs(dz) >= Math.abs(dx)) return dz < 0 ? clamp(dx, -R, R) + R : 2 * L + (R - clamp(dx, -R, R));
  return dx > 0 ? L + clamp(dz, -R, R) + R : 3 * L + (R - clamp(dz, -R, R));
}
const blockCenter = v => ORG + BLK / 2 + Math.floor((v - ORG) / BLK) * BLK;
function placePed(p, px, pz) {
  for (let k = 0; k < 40; k++) {
    const i = Math.floor(rnd(-1, 9)), j = Math.floor(rnd(0, 9));
    const cx = ORG + BLK / 2 + i * BLK, cz = ORG + BLK / 2 + j * BLK;
    const d = px == null ? 0 : Math.hypot(cx - px, cz - pz);
    if (px == null || (d < 120 && d > 45) || k === 39) { p.cx = cx; p.cz = cz; p.s = rnd(0, 220); p.state = 'walk'; p.stateT = rnd(8, 20); p.h.hitK = 0; p.down = 0; p.hp = 40; return; }
  }
}
function spawnPeds(n) {
  for (let i = 0; i < n; i++) {
    const look = PED_LOOKS[i % PED_LOOKS.length];
    const h = createHuman({ ...look, build: rnd(0.95, 1.18), height: rnd(1.62, 1.86), skin: pick([0xd29a72, 0xb87c56, 0xe0aa84, 0x9a6545]), low: true, eyes: pick([0x5a3418, 0x3a2a14, 0x4a6a3a]) });
    giveRealBody(h, look, 'ped');
    scene.add(h.root);
    const p = { h, pos: h.root.position, spd: rnd(1.1, 1.5), dir: Math.random() < 0.5 ? 1 : -1, s: 0, cx: 0, cz: 0, state: 'walk', stateT: 10, hp: 40, facing: 0, flee: null, friend: null, scale: 1 };
    placePed(p); peds.push(p);
  }
}
function scarePeds(pos, r) {
  for (const p of peds) {
    if (p.state === 'out' || p.pos.distanceTo(pos) > r) continue;
    if (p.state !== 'flee' && Math.random() < 0.25) bark(['ped'], p.h, p.pos);
    p.state = 'flee'; p.stateT = rnd(7, 12); p.flee = pos.clone(); if (p.seat) { p.seat.taken = false; p.seat = null; }
  }
}
function hurtPed(p, dmg, fromPos, kind) {
  if (p.state === 'out') return;
  p.hp -= dmg; p.h.hitK = 1;
  addWanted(1); scarePeds(p.pos, 25);
  if (p.hp <= 0 || kind === 'car') { p.state = 'out'; p.stateT = 20; p.h.fallDir = Math.random() < 0.5 ? 1 : -1; sfx('fall', p.pos); }
  else { p.state = 'flee'; p.stateT = 10; p.flee = fromPos.clone(); }
}
function pedUpdate(p, dt) {
  const pp = playerPos(), h = p.h;
  const far = Math.hypot(p.pos.x - pp.x, p.pos.z - pp.z);
  if (far > 170 && p.state !== 'flee') { if (p.seat) { p.seat.taken = false; p.seat = null; } placePed(p, pp.x, pp.z); }
  h.root.visible = far < 140;
  p.stateT -= dt;
  let speed = 0, st = {};
  if (p.state === 'out') {
    st.down = true;
    if (p.stateT < 0 && far > 30) { h.downK = 0; placePed(p, pp.x, pp.z); }
  } else if (p.state === 'flee') {
    const ax = p.pos.x - p.flee.x, az = p.pos.z - p.flee.z;
    const want = Math.atan2(ax, az) + Math.sin(h.t * 0.8) * 0.4;
    p.facing += clamp(angDiff(p.facing, want), -6 * dt, 6 * dt);
    speed = 5.6; st.panic = p.stateT > 4;
    p.pos.x += Math.sin(p.facing) * speed * dt; p.pos.z += Math.cos(p.facing) * speed * dt;
    if (collide(p.pos, 0.3)) p.facing += 0.8;
    p.pos.x = clamp(p.pos.x, BOUND.x0, BOUND.x1); p.pos.z = clamp(p.pos.z, BOUND.z0, BOUND.z1);
    if (p.stateT < 0) { p.cx = blockCenter(p.pos.x); p.cz = blockCenter(p.pos.z); p.s = perimParam(p.cx, p.cz, p.pos.x, p.pos.z); p.state = 'walk'; p.stateT = rnd(10, 20); }
  } else if (p.state === 'sit') {
    st.seated = true; h.talk = Math.max(0, Math.sin(h.t * 2.2) * Math.sin(h.t * 0.37)) * 0.6;
    p.pos.set(p.seat.x, 0.05, p.seat.z); p.facing = p.seat.face;
    if (p.stateT < 0) { p.seat.taken = false; p.seat = null; p.state = 'walk'; p.stateT = rnd(10, 20); h.talk = 0; }
  } else if (p.state === 'chat' || p.state === 'phone' || p.state === 'look') {
    if (p.state === 'chat' && p.friend) { p.facing += clamp(angDiff(p.facing, Math.atan2(p.friend.pos.x - p.pos.x, p.friend.pos.z - p.pos.z)), -4 * dt, 4 * dt); h.talk = Math.max(0, Math.sin(h.t * 2.6 + p.s)) * (Math.sin(h.t * 0.5 + p.s) > 0 ? 0.7 : 0); }
    if (p.state === 'phone') { st.phone = true; h.talk = Math.max(0, Math.sin(h.t * 3)) * 0.4; }
    if (p.stateT < 0) { p.state = 'walk'; p.stateT = rnd(10, 25); h.talk = 0; if (p.friend) { p.friend.friend = null; p.friend = null; } }
  } else {
    // walking the block, choosing what to do next
    p.s += p.spd * p.dir * dt; speed = p.spd;
    const [ox, oz] = perim(p.cx, p.cz, p.s), [nx, nz] = perim(p.cx, p.cz, p.s + p.dir * 0.5);
    p.pos.set(ox, 0.12, oz); p.facing = Math.atan2(nx - ox, nz - oz);
    if (p.stateT < 0) {
      const r = Math.random();
      p.stateT = rnd(5, 12);
      if (r < 0.25) p.state = 'phone';
      else if (r < 0.4) p.state = 'look';
      else if (r < 0.7) {
        const f = peds.find(q => q !== p && q.state === 'walk' && q.pos.distanceTo(p.pos) < 12);
        if (f) { p.state = f.state = 'chat'; p.friend = f; f.friend = p; f.stateT = p.stateT; } else p.stateT = rnd(4, 10);
      } else if (Math.hypot(p.pos.x + 175, p.pos.z - 105) < 60) {
        const seat = teaSeats.find(s => !s.taken); if (seat) { seat.taken = true; p.seat = seat; p.state = 'sit'; p.stateT = rnd(20, 45); }
      } else p.stateT = rnd(6, 15);
    }
    // step aside for the player on foot
    if (!player.car && far < 1.1) { p.state = 'look'; p.stateT = 2; p.facing = Math.atan2(pp.x - p.pos.x, pp.z - p.pos.z); }
  }
  if (p.state !== 'sit') p.pos.y = groundH(p.pos.x, p.pos.z);
  h.root.rotation.y = p.facing;
  if (far < 80) animateHuman(h, dt, speed, st);
}

/* ───────── wanted level ───────── */
let wantedCool = 0;
function addWanted(n) {
  if (S.noWanted) return;
  const before = S.wanted; S.wanted = clamp(S.wanted + n, 0, 3); wantedCool = 0;
  if (S.wanted > before && before === 0) setTimeout(() => say('pol'), 600);
}
let copCars = [];
function updateWanted(dt) {
  const pp = playerPos();
  if (S.wanted > 0) {
    const seen = actors.some(a => a.faction === 'police' && !a.dead && a.sees) || copCars.some(c => c.pos.distanceTo(pp) < 45);
    wantedCool = seen ? 0 : wantedCool + dt;
    if (wantedCool > 22) { S.wanted--; wantedCool = 0; }
    while (copCars.length < S.wanted && !S.storyPolice) {
      const [a, b, d] = aiRandomSegmentNear(pp.x, pp.z, 80, 140);
      const c = spawnCar('police', 0xf6f6f6, 0, 0, 0); aiPlace(c, a, b, d, 0.5); c.ai = null; c.police = true; c.speed = 0; c.vel.set(0, 0, 0); c.unload = 0;
      copCars.push(c);
    }
  }
  if (S.wanted === 0 && copCars.length && !S.storyPolice) { for (const c of copCars) if (c.pos.distanceTo(pp) > 60) { removeCar(c); } copCars = copCars.filter(c => cars.includes(c)); }
  // at 2+ stars officers jump out once the cruiser is close
  for (const c of copCars) {
    if (S.wanted >= 2 && !c.unloaded && c.pos.distanceTo(pp) < 18 && Math.abs(c.speed) < 4) {
      c.unloaded = true;
      for (const s of [1, -1]) makeActor('police', c.pos.x + Math.cos(c.heading) * s * 2, c.pos.z - Math.sin(c.heading) * s * 2, 'pistol', { alert: true });
    }
  }
}
let arrestT = 0;
function tryArrest(dt) { arrestT += dt; if (arrestT > 2.2) { arrestT = 0; busted(); } }
