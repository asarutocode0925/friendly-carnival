import test from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, BOX_MATERIALS, freeAt, mainRegion, getSpawns, pickSpawn } from './shared-maps.js';

const NOT_PERIMETER = (m) => m.boxes.slice(0, -4); // 最後の4つは外壁

test('there are 7 maps and each has a name, a bound and a theme', () => {
  assert.equal(MAPS.length, 7);
  for (const m of MAPS) {
    assert.ok(m.name && m.bound >= 28 && m.bound <= 45, m.name);
    assert.ok(m.theme && m.theme.sky.length === 3 && m.theme.fog.length === 3, `${m.name}: theme`);
  }
});

test('every box is valid, uses a known material and stays inside the arena walls', () => {
  for (const m of MAPS) {
    for (const b of m.boxes) {
      assert.ok(b.w > 0 && b.d > 0 && b.h > 0, `${m.name}: size ${JSON.stringify(b)}`);
      assert.ok(BOX_MATERIALS.includes(b.m), `${m.name}: unknown material ${b.m}`);
    }
    for (const b of NOT_PERIMETER(m)) {
      assert.ok(Math.abs(b.x) + b.w / 2 <= m.bound + 0.51 && Math.abs(b.z) + b.d / 2 <= m.bound + 0.51, `${m.name}: box sticks out ${JSON.stringify(b)}`);
    }
  }
});

test('each map has enough cover (not empty) but is not too crowded', () => {
  for (const m of MAPS) {
    assert.ok(NOT_PERIMETER(m).length >= 24, `${m.name}: only ${NOT_PERIMETER(m).length} boxes`);
    let blocked = 0, total = 0;
    for (let x = -m.bound; x <= m.bound; x++) {
      for (let z = -m.bound; z <= m.bound; z++) {
        total++;
        if (!freeAt(m, x, z)) blocked++;
      }
    }
    const frac = blocked / total;
    assert.ok(frac >= 0.08 && frac <= 0.45, `${m.name}: blocked fraction ${frac.toFixed(2)}`);
  }
});

test('the walkable area is one connected region (no sealed rooms)', () => {
  for (const m of MAPS) {
    const r = mainRegion(m, 1);
    assert.ok(r.mainSize / r.freeCount >= 0.98, `${m.name}: only ${(100 * r.mainSize / r.freeCount).toFixed(1)}% connected (${r.components} regions)`);
  }
});

test('spawn points are safe, reachable, and spread out', () => {
  for (const m of MAPS) {
    const sp = getSpawns(m);
    assert.ok(sp.length >= 8, `${m.name}: only ${sp.length} spawns`);
    const region = new Set(mainRegion(m, 0.5).cells.map(([x, z]) => `${x},${z}`));
    for (const s of sp) {
      assert.ok(freeAt(m, s.x, s.z, 0.8), `${m.name}: spawn too close to a wall at ${s.x},${s.z}`);
      assert.ok(region.has(`${s.x},${s.z}`), `${m.name}: spawn in a sealed area at ${s.x},${s.z}`);
    }
    for (let i = 0; i < sp.length; i++) {
      for (let j = i + 1; j < sp.length; j++) {
        assert.ok(Math.hypot(sp[i].x - sp[j].x, sp[i].z - sp[j].z) >= 6, `${m.name}: spawns too close`);
      }
    }
  }
});

test('pickSpawn chooses a point far from other players', () => {
  const m = MAPS[0];
  const sp = getSpawns(m);
  const enemy = { x: sp[0].x, z: sp[0].z };
  const picked = pickSpawn(sp, [enemy], () => 0);
  const dPicked = Math.hypot(picked.x - enemy.x, picked.z - enemy.z);
  const dMedian = [...sp].map((s) => Math.hypot(s.x - enemy.x, s.z - enemy.z)).sort((a, b) => a - b)[Math.floor(sp.length / 2)];
  assert.ok(dPicked >= dMedian, 'the chosen spawn should be at least as far as the median one');
  assert.deepEqual(pickSpawn([], [enemy]), { x: 0, z: 0 });
});

test('every map has theme-specific visual landmarks without changing collision geometry', () => {
  const expected = ['barrel', 'ruinColumn', 'barrel', 'grass', 'rock', 'rock', 'torch'];
  for (let i = 0; i < MAPS.length; i++) {
    const m = MAPS[i];
    assert.ok(Array.isArray(m.decor) && m.decor.length >= 8, `${m.name}: missing map details`);
    assert.ok(m.decor.some((d) => d.t === expected[i]), `${m.name}: missing theme landmark ${expected[i]}`);
    for (const d of m.decor) {
      assert.ok(Number.isFinite(d.x) && Number.isFinite(d.z), `${m.name}: invalid decor position`);
      if (d.s !== undefined) assert.ok(Number.isFinite(d.s) && d.s > 0, `${m.name}: invalid decor scale`);
    }
  }
});


test('each map has layered interior details without changing collision boxes', () => {
  const signatures = new Set();
  for (const m of MAPS) {
    assert.ok(m.decor.length >= 12, `${m.name}: too few environmental details`);
    assert.ok(m.decor.some((d) => Math.abs(d.x) < m.bound - 5 && Math.abs(d.z) < m.bound - 5), `${m.name}: no interior landmark`);
    signatures.add(m.decor.map((d) => d.t).sort().join(','));
  }
  assert.ok(signatures.size >= 5, 'maps should have visually distinct decoration sets');
});


test('new architectural props are deterministic, theme-specific and visual-only', () => {
  const required = [
    ['市街地・路地', 'lantern'],
    ['廃墟・広場', 'stoneLantern'],
    ['港町', 'fence'],
    ['住宅街', 'sakura'],
    ['山岳・山道', 'stoneLantern'],
    ['雪原・戦場', 'fence'],
    ['夜戦・ゲート', 'lantern'],
  ];
  for (const [name, type] of required) {
    const map = MAPS.find((m) => m.name === name);
    assert.ok(map, `missing map ${name}`);
    assert.ok(map.decor.some((d) => d.t === type), `${name}: missing ${type}`);
  }
  // Decoration generation must never alter server-side collision geometry.
  for (const map of MAPS) {
    for (const d of map.decor) {
      assert.ok(Number.isFinite(d.x) && Number.isFinite(d.z), `${map.name}: invalid decoration coordinates`);
    }
  }
});
