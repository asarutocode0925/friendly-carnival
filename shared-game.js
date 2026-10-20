// サーバーとクライアントで共有するゲームルール。
// 移動・衝突・射線判定を1か所にまとめ、予測のずれとチート余地を減らす。

import { PLAYER_RADIUS } from "./shared-maps.js";

// 版番号：サーバーとクライアントで違うと、画面に「再読み込みしてください」と出す
export const VERSION = "2.0.0";

export const TICK = 0.05;        // 物理・通信の刻み（20Hz）
export const PLAYER_R = PLAYER_RADIUS; // プレイヤーの当たり半径（shared-maps.js と同じ値）
export const EYE_H = 1.6;        // 目の高さ
export const HIT_R = 0.6;        // 射線からの横ずれ許容
export const MAX_HP = 100;
export const RESPAWN_MS = 3000;

// キャラコン（単位：ユニット/秒）。air accel と空中の速度上限で「ビュンビュン」を作る
export const MOVE = {
  maxGround: 9,
  groundAccel: 12,
  airAccel: 30,
  airWishCap: 1.2,
  friction: 7,
  stopSpeed: 2.5,
  gravity: 24,
  jumpV: 10,
  leapSpeed: 14,     // リープの水平速度
  leapUp: 4,         // リープの上昇速度
  leapCooldown: 2,   // リープのクールダウン（秒）
  maxSpeed: 16,      // 空中でも超えない速度上限（際限ないバニーホップを防ぐ）
};

export const WEAPON_ORDER = ["knife", "pistol", "magnum", "smg", "rifle", "sniper", "shotgun", "hinawaju", "tanzutsu", "lmg"];

export const WEAPONS = {
  knife: {
    label: "ナイフ", melee: true, cooldown: 450, mag: 0, reload: 0,
    damage: 55, backstab: 100, pellets: 1, spread: 0, range: 2.2, cone: 0.7, auto: false,
    sound: { f: 1600, d: 0.05, v: 0.2 },
  },
  pistol: {
    label: "ピストル", cooldown: 250, mag: 12, reload: 1200,
    damage: 25, pellets: 1, spread: 0, range: 60, auto: false,
    sound: { f: 900, d: 0.08, v: 0.35 },
  },
  hinawaju: {
    label: "ヘビーライフル", cooldown: 1400, mag: 1, reload: 2600,
    damage: 100, pellets: 1, spread: 0.003, range: 120, auto: false, head: 2,
    sound: { f: 260, d: 0.25, v: 0.5 },
  },
  tanzutsu: {
    label: "デリンジャー", cooldown: 180, mag: 2, reload: 900,
    damage: 30, pellets: 1, spread: 0.06, range: 25, auto: false,
    sound: { f: 800, d: 0.09, v: 0.4 },
  },
  lmg: {
    label: "軽機関銃", cooldown: 100, mag: 60, reload: 3200,
    damage: 9, pellets: 1, spread: 0.1, range: 80, auto: true,
    sound: { f: 700, d: 0.05, v: 0.3 },
  },
  magnum: {
    label: "リボルバー", cooldown: 550, mag: 6, reload: 2200,
    damage: 55, pellets: 1, spread: 0.005, range: 90, auto: false, head: 2.5,
    sound: { f: 500, d: 0.18, v: 0.5 },
  },
  smg: {
    label: "サブマシンガン", cooldown: 75, mag: 30, reload: 1600,
    damage: 8, pellets: 1, spread: 0.05, range: 45, auto: true,
    sound: { f: 1100, d: 0.04, v: 0.25 },
  },
  rifle: {
    label: "アサルトライフル", cooldown: 120, mag: 30, reload: 1800,
    damage: 11, pellets: 1, spread: 0.03, range: 80, auto: true,
    sound: { f: 600, d: 0.05, v: 0.3 },
  },
  sniper: {
    label: "スナイパー", cooldown: 1200, mag: 5, reload: 2500,
    damage: 90, pellets: 1, spread: 0, range: 150, auto: false,
    sound: { f: 300, d: 0.2, v: 0.5 },
  },
  shotgun: {
    label: "ショットガン", cooldown: 800, mag: 6, reload: 2000,
    damage: 10, pellets: 6, spread: 0.12, range: 25, auto: false,
    sound: { f: 400, d: 0.15, v: 0.5 },
  },
};

// スキン（見た目のみ・クライアント側で描画。サーバーは関与しない）
// スキン（見た目のみ。クライアントで描画し、サーバーは関与しない）
// pattern：描画パターン名（view.js で生成）
export const SKINS = {
  std:      { name: "標準",     color: 0x9aa3ad, metal: 0.6, rough: 0.4, pattern: "none" },
  gold:     { name: "ゴールド",   color: 0xd4a72c, metal: 0.9, rough: 0.25, pattern: "gold" },
  sakura:   { name: "桜花",     color: 0xf2b8c6, metal: 0.2, rough: 0.6, pattern: "sakura" },
  indigo:   { name: "インディゴ",     color: 0x1f2f5c, metal: 0.1, rough: 0.7, pattern: "indigo" },
  shu:      { name: "レッド",     color: 0xb3261e, metal: 0.3, rough: 0.15, pattern: "shu" },
  camo:     { name: "迷彩",     color: 0x56623f, metal: 0.1, rough: 0.9, pattern: "camo" },
  neon:     { name: "ネオン",   color: 0x14202b, metal: 0.4, rough: 0.3, pattern: "neon", emissive: 0x00e5ff },
  oni:      { name: "オーガ",     color: 0x2a0d0d, metal: 0.5, rough: 0.5, pattern: "oni", emissive: 0xff2a00 },
  ryu:      { name: "ドラゴン",     color: 0x2e5e4e, metal: 0.8, rough: 0.3, pattern: "scales" },
  seigaiha: { name: "ウェーブ",   color: 0x1d4f7a, metal: 0.4, rough: 0.4, pattern: "waves" },
  rust:     { name: "錆鉄",     color: 0x6b4a33, metal: 0.5, rough: 0.9, pattern: "rust" },
  damascus: { name: "ダマスカス", color: 0x9aa3ad, metal: 1, rough: 0.3, pattern: "damascus" },
  kohaku:   { name: "琥珀",     color: 0xc2611a, metal: 0.2, rough: 0.15, pattern: "kohaku", emissive: 0xff9a2e },
  kuro:     { name: "ブラックゴールド", color: 0x111111, metal: 0.7, rough: 0.2, pattern: "kuroGold" },
  aurora:   { name: "極光",     color: 0x0b1d3a, metal: 0.7, rough: 0.25, pattern: "aurora", emissive: 0x2ef2c0 },
  yoru:     { name: "夜空",     color: 0x05060f, metal: 0.6, rough: 0.35, pattern: "stars" },
  kinryu:   { name: "ゴールドドラゴン",     color: 0xc9a227, metal: 0.95, rough: 0.2, pattern: "scales" },
  hanabi:   { name: "花火",     color: 0x101018, metal: 0.4, rough: 0.5, pattern: "hanabi", emissive: 0xff8ad8 },
  fade:     { name: "フェード", color: 0x6a2c8f, metal: 0.85, rough: 0.22, pattern: "fade" },
  glitch:   { name: "グリッチ", color: 0x101018, metal: 0.5, rough: 0.3, pattern: "glitch", emissive: 0x00ffd5 },
  reaver:   { name: "リーバー", color: 0x15101a, metal: 0.7, rough: 0.25, pattern: "reaver", emissive: 0xff6a1f },
  prime:    { name: "プライム", color: 0xe8e8ee, metal: 0.9, rough: 0.15, pattern: "prime" },
  doppler:  { name: "ドップラー", color: 0x2a2a33, metal: 0.9, rough: 0.2, pattern: "plain", animated: true },
};
export const SKIN_ORDER = Object.keys(SKINS);

// マップは shared-maps.js（サーバーとクライアントで共有）
export { MAPS, getSpawns, pickSpawn } from "./shared-maps.js";

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export const normAngle = (a) => {
  let r = (a + Math.PI) % (2 * Math.PI);
  if (r < 0) r += 2 * Math.PI;
  return r - Math.PI;
};

export function newPhys(x = 0, z = 0) {
  return { x, y: 0, z, vx: 0, vy: 0, vz: 0, g: true, lc: 0 };
}

// 円（プレイヤー）と箱の衝突を押し戻す
export function resolveBoxes(x, z, boxes) {
  for (const b of boxes) {
    const hw = b.w / 2 + PLAYER_R;
    const hd = b.d / 2 + PLAYER_R;
    const ox = x - b.x;
    const oz = z - b.z;
    if (Math.abs(ox) < hw && Math.abs(oz) < hd) {
      const px = hw - Math.abs(ox);
      const pz = hd - Math.abs(oz);
      if (px < pz) x = b.x + Math.sign(ox || 1) * hw;
      else z = b.z + Math.sign(oz || 1) * hd;
    }
  }
  return { x, z };
}

// Quake系の加速：向きに対する速度成分だけを増やす（空中の方向転換・ストレイフの源）
function accelerate(s, wx, wz, wishSpeed, accel, dt) {
  const cur = s.vx * wx + s.vz * wz;
  const add = wishSpeed - cur;
  if (add <= 0) return;
  const a = Math.min(add, accel * wishSpeed * dt);
  s.vx += wx * a;
  s.vz += wz * a;
}

// 1ステップ進める（サーバーと予測で同一の式）
// input: { x, z, j }  j = ジャンプ（押しっぱなしで連続ジャンプ＝バニーホップ）
export function stepMove(s, input, yaw, dt, map) {
  const ix = input.x;
  const iz = input.z;
  const mag = Math.min(1, Math.hypot(ix, iz));
  let wx = ix * Math.cos(yaw) - iz * Math.sin(yaw);
  let wz = -ix * Math.sin(yaw) - iz * Math.cos(yaw);
  const wl = Math.hypot(wx, wz);
  if (wl > 0) {
    wx /= wl;
    wz /= wl;
  }
  const wish = MOVE.maxGround * mag;

  // リープ：入力の向き（無ければ視線の向き）へ瞬間的に飛ぶ。クールダウンも状態として持つ
  if (s.lc > 0) s.lc = Math.max(0, s.lc - dt);
  if (input.l && s.lc <= 0) {
    const lx = wl > 0 ? wx : -Math.sin(yaw);
    const lz = wl > 0 ? wz : -Math.cos(yaw);
    s.vx = lx * MOVE.leapSpeed;
    s.vz = lz * MOVE.leapSpeed;
    s.vy = Math.max(s.vy, MOVE.leapUp);
    s.g = false;
    s.lc = MOVE.leapCooldown;
  }

  if (s.g) {
    const sp = Math.hypot(s.vx, s.vz);
    if (sp > 0) {
      const nsp = Math.max(0, sp - Math.max(sp, MOVE.stopSpeed) * MOVE.friction * dt) / sp;
      s.vx *= nsp;
      s.vz *= nsp;
    }
    accelerate(s, wx, wz, wish, MOVE.groundAccel, dt);
    if (input.j) {
      s.vy = MOVE.jumpV;
      s.g = false;
    }
  } else {
    accelerate(s, wx, wz, Math.min(wish, MOVE.airWishCap), MOVE.airAccel, dt);
  }

  // 速度上限
  const spd = Math.hypot(s.vx, s.vz);
  if (spd > MOVE.maxSpeed) {
    const k = MOVE.maxSpeed / spd;
    s.vx *= k;
    s.vz *= k;
  }

  // 重力と着地
  s.vy -= MOVE.gravity * dt;
  s.y += s.vy * dt;
  if (s.y <= 0) {
    s.y = 0;
    s.vy = 0;
    s.g = true;
  } else {
    s.g = false;
  }

  // 水平移動（範囲と壁で止まる）
  let nx = s.x + s.vx * dt;
  let nz = s.z + s.vz * dt;
  if (Math.abs(nx) > map.bound) { nx = clamp(nx, -map.bound, map.bound); s.vx = 0; }
  if (Math.abs(nz) > map.bound) { nz = clamp(nz, -map.bound, map.bound); s.vz = 0; }
  const r = resolveBoxes(nx, nz, map.boxes);
  if (r.x !== nx) s.vx = 0;
  if (r.z !== nz) s.vz = 0;
  s.x = r.x;
  s.z = r.z;
  return s;
}

// 射線（原点ox,oz、方向dx,dz単位ベクトル）と箱の交差距離。当たらなければ -1
export function rayBoxT(ox, oz, dx, dz, b) {
  const minX = b.x - b.w / 2, maxX = b.x + b.w / 2;
  const minZ = b.z - b.d / 2, maxZ = b.z + b.d / 2;
  let tmin = 0, tmax = Infinity;

  if (Math.abs(dx) < 1e-9) {
    if (ox < minX || ox > maxX) return -1;
  } else {
    let t1 = (minX - ox) / dx, t2 = (maxX - ox) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return -1;
  }

  if (Math.abs(dz) < 1e-9) {
    if (oz < minZ || oz > maxZ) return -1;
  } else {
    let t1 = (minZ - oz) / dz, t2 = (maxZ - oz) / dz;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return -1;
  }
  return tmin;
}

// 2点間が遮蔽物で遮られているか
export function blocked(ax, az, bx, bz, boxes) {
  const dx = bx - ax, dz = bz - az;
  const d = Math.hypot(dx, dz);
  if (d < 1e-6) return false;
  const ux = dx / d, uz = dz / d;
  for (const b of boxes) {
    const t = rayBoxT(ax, az, ux, uz, b);
    if (t >= 0 && t < d) return true;
  }
  return false;
}

// 近接攻撃の範囲判定（扇形）
export function inMeleeCone(ax, az, ayaw, tx, tz, range, cone) {
  const dx = tx - ax, dz = tz - az;
  const d = Math.hypot(dx, dz);
  if (d > range) return false;
  if (d < 1e-6) return true;
  const fx = -Math.sin(ayaw), fz = -Math.cos(ayaw);
  return (dx * fx + dz * fz) / d >= Math.cos(cone);
}
