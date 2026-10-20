// マップの見た目（床・壁・建物・空・霧・光・飾り）。
// 静的な箱は素材ごとに1つにまとめて描くので、箱が増えても描画回数は増えない。
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const S = 128;
const rnd = (a, b) => a + Math.random() * (b - a);
const gray = (v) => {
  const c = Math.max(0, Math.min(255, Math.round(v)));
  return `rgb(${c},${c},${c})`;
};

function noise(g, base, amp, n = 900, size = 2) {
  g.fillStyle = gray(base);
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < n; i++) {
    g.fillStyle = gray(base + rnd(-amp, amp));
    g.fillRect(rnd(0, S), rnd(0, S), size, size);
  }
}

// 模様はほぼ白黒で描き、素材ごとの色（tint）を掛けて色を付ける
const PAINT = {
  concrete(g) {
    noise(g, 190, 22);
    g.fillStyle = "rgba(0,0,0,.08)";
    for (let i = 0; i < 6; i++) g.fillRect(rnd(0, S), rnd(0, S), rnd(20, 50), rnd(2, 6));
  },
  plaster(g) { noise(g, 225, 10, 700); },
  brick(g) {
    g.fillStyle = gray(150);
    g.fillRect(0, 0, S, S);
    for (let r = 0; r < 8; r++) {
      const off = (r % 2) * 16;
      for (let c = -1; c < 5; c++) {
        g.fillStyle = gray(rnd(205, 245));
        g.fillRect(c * 32 + off + 1, r * 16 + 1, 30, 14);
      }
    }
  },
  stone(g) {
    g.fillStyle = gray(120);
    g.fillRect(0, 0, S, S);
    let y = 0;
    while (y < S) {
      const h = rnd(18, 34);
      let x = 0;
      while (x < S) {
        const w = rnd(24, 50);
        g.fillStyle = gray(rnd(165, 225));
        g.fillRect(x + 1, y + 1, Math.min(w, S - x) - 2, Math.min(h, S - y) - 2);
        x += w;
      }
      y += h;
    }
  },
  wood(g) {
    g.fillStyle = gray(200);
    g.fillRect(0, 0, S, S);
    for (let x = 0; x < S; x += 16) {
      g.fillStyle = gray(rnd(170, 225));
      g.fillRect(x + 1, 0, 14, S);
      g.strokeStyle = "rgba(0,0,0,.18)";
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        g.moveTo(x + rnd(2, 14), 0);
        g.lineTo(x + rnd(2, 14), S);
        g.stroke();
      }
    }
  },
  crate(g) {
    g.fillStyle = gray(205);
    g.fillRect(0, 0, S, S);
    g.strokeStyle = "rgba(60,40,20,.7)";
    g.lineWidth = 8;
    g.strokeRect(4, 4, S - 8, S - 8);
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(8, 8); g.lineTo(S - 8, S - 8);
    g.moveTo(S - 8, 8); g.lineTo(8, S - 8);
    g.stroke();
  },
  ridges(g) {
    g.fillStyle = gray(200);
    g.fillRect(0, 0, S, S);
    for (let x = 0; x < S; x += 8) {
      g.fillStyle = gray(x % 16 ? 170 : 225);
      g.fillRect(x, 0, 4, S);
    }
    g.fillStyle = "rgba(0,0,0,.35)";
    g.fillRect(0, 0, S, 4);
    g.fillRect(0, S - 4, S, 4);
  },
  paint(g) {
    noise(g, 235, 8, 400);
    g.fillStyle = "rgba(0,0,0,.12)";
    g.fillRect(0, S * 0.5, S, 3);
  },
  hedge(g) { noise(g, 150, 60, 1400, 4); },
  sandbag(g) {
    g.fillStyle = gray(150);
    g.fillRect(0, 0, S, S);
    for (let r = 0; r < 4; r++) {
      for (let c = -1; c < 3; c++) {
        g.fillStyle = gray(rnd(190, 235));
        g.beginPath();
        g.ellipse(c * 64 + (r % 2) * 32 + 32, r * 32 + 16, 30, 14, 0, 0, 6.28);
        g.fill();
      }
    }
  },
  facade(g) {
    noise(g, 205, 12, 600);
    g.fillStyle = gray(60);
    g.fillRect(S * 0.22, S * 0.22, S * 0.56, S * 0.56);
    g.fillStyle = gray(130);
    g.fillRect(S * 0.22, S * 0.22, S * 0.56, 4);
    g.fillRect(S * 0.22, S * 0.5, S * 0.56, 3);
  },
  facadeLit(g) { // 光る窓だけ（夜の建物用）
    g.fillStyle = "#000";
    g.fillRect(0, 0, S, S);
    if (Math.random() < 0.6) {
      g.fillStyle = "#ffcf7a";
      g.fillRect(S * 0.26, S * 0.26, S * 0.48, S * 0.48);
    }
  },
  asphalt(g) { noise(g, 120, 25, 1200); },
  grass(g) { noise(g, 150, 45, 1600, 3); },
  dirt(g) { noise(g, 150, 38, 1200, 3); },
  snow(g) { noise(g, 240, 10, 700, 3); },
};

const texCache = new Map();
function tex(name) {
  if (texCache.has(name)) return texCache.get(name);
  const c = document.createElement("canvas");
  c.width = c.height = S;
  PAINT[name](c.getContext("2d"));
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  texCache.set(name, t);
  return t;
}

// 箱の素材：tex=模様、tint=色、tile=模様1枚が実際に何メートルか（[横, 縦]）
const MATS = {
  concrete: { tex: "concrete", tint: 0xb9bcc0, tile: [6, 6] },
  concreteSnow: { tex: "concrete", tint: 0xe6ecf2, tile: [6, 6] },
  brick: { tex: "brick", tint: 0xc0634a, tile: [4, 4] },
  facade: { tex: "facade", tint: 0xc9c3b8, tile: [3, 4] },
  facadeNight: { tex: "facade", tint: 0x6f685e, tile: [3, 4], lit: true },
  plasterA: { tex: "plaster", tint: 0xe8dcc0, tile: [6, 6] },
  plasterB: { tex: "plaster", tint: 0xaebfcf, tile: [6, 6] },
  plasterC: { tex: "plaster", tint: 0xe3b7b0, tile: [6, 6] },
  stone: { tex: "stone", tint: 0xb3ab9a, tile: [4, 4] },
  stoneDark: { tex: "stone", tint: 0x7b7a7e, tile: [4, 4] },
  wood: { tex: "wood", tint: 0x9a6a3f, tile: [3, 3] },
  woodDark: { tex: "wood", tint: 0x5d4128, tile: [3, 3] },
  crate: { tex: "crate", tint: 0xb88a52, tile: [2, 2] },
  metalGray: { tex: "ridges", tint: 0x8b949c, tile: [2.4, 2.4], metal: 0.45, rough: 0.55 },
  corrugated: { tex: "ridges", tint: 0x9aa3a8, tile: [2.4, 3], metal: 0.4, rough: 0.6 },
  cRed: { tex: "ridges", tint: 0xb23a32, tile: [2.4, 2.6], metal: 0.4, rough: 0.55 },
  cBlue: { tex: "ridges", tint: 0x2f5fa8, tile: [2.4, 2.6], metal: 0.4, rough: 0.55 },
  cGreen: { tex: "ridges", tint: 0x3b8a55, tile: [2.4, 2.6], metal: 0.4, rough: 0.55 },
  cOrange: { tex: "ridges", tint: 0xd9822b, tile: [2.4, 2.6], metal: 0.4, rough: 0.55 },
  carRed: { tex: "paint", tint: 0xb4322e, tile: [4, 4], metal: 0.5, rough: 0.35 },
  carBlue: { tex: "paint", tint: 0x2d5da8, tile: [4, 4], metal: 0.5, rough: 0.35 },
  carYellow: { tex: "paint", tint: 0xd8b02a, tile: [4, 4], metal: 0.5, rough: 0.35 },
  carWhite: { tex: "paint", tint: 0xe4e6ea, tile: [4, 4], metal: 0.5, rough: 0.35 },
  hedge: { tex: "hedge", tint: 0x4f7a3c, tile: [3, 3] },
  sandbag: { tex: "sandbag", tint: 0xc8b48a, tile: [2, 1.4] },
  asphalt: { tex: "asphalt", tint: 0x8a8d92, tile: [8, 8] },
};
export const MAT_KEYS = Object.keys(MATS);

const FLOOR_TILE = { asphalt: 8, grass: 6, dirt: 6, snow: 8 };

const matCache = new Map();
function boxMat(key) {
  if (matCache.has(key)) return matCache.get(key);
  const d = MATS[key];
  const m = new THREE.MeshStandardMaterial({
    map: tex(d.tex), color: d.tint, metalness: d.metal ?? 0, roughness: d.rough ?? 0.9, envMapIntensity: 0.35,
  });
  if (d.lit) {
    m.emissiveMap = tex("facadeLit");
    m.emissive = new THREE.Color(0xffffff);
    m.emissiveIntensity = 1.1;
  }
  matCache.set(key, m);
  return m;
}

const DECOR_MATS = {
  pole: { color: 0x4a4a4f, metalness: 0.3, roughness: 0.7 },
  trunk: { color: 0x5d4128, roughness: 0.9 },
  leaf: { color: 0x3f7a3a, roughness: 0.9 },
  pineLeaf: { color: 0x2d5a2b, roughness: 0.9 },
  rock: { color: 0x8a8780, roughness: 0.95 },
  bulb: { color: 0xfff1b0, emissive: 0xfff1b0, emissiveIntensity: 1.4 },
  barrelWood: { color: 0x76502f, roughness: 0.92 },
  barrelHoop: { color: 0x34383b, metalness: 0.45, roughness: 0.62 },
  grassBlade: { color: 0x648a43, roughness: 1 },
  flame: { color: 0xff9a3c, emissive: 0xff9a3c, emissiveIntensity: 1.6 },
  paper: { color: 0xf2dfb1, roughness: 0.95 },
  lacquer: { color: 0x5b171b, roughness: 0.42, metalness: 0.18 },
  roofTile: { color: 0x45474b, roughness: 0.86 },
  sakuraLeaf: { color: 0xd77f9a, roughness: 0.9 },
  moss: { color: 0x526b3a, roughness: 1 },
  warmGlow: { color: 0xffc66d, emissive: 0xffa62b, emissiveIntensity: 1.2 },
};
function decorMat(key) {
  if (matCache.has(key)) return matCache.get(key);
  let m;
  if (key.startsWith("box:")) m = boxMat(key.slice(4));
  else if (key.startsWith("cloth:")) m = new THREE.MeshStandardMaterial({ color: Number(key.slice(6)), roughness: 0.8, side: THREE.DoubleSide });
  else m = new THREE.MeshStandardMaterial({ ...DECOR_MATS[key], envMapIntensity: 0.3 });
  matCache.set(key, m);
  return m;
}

// 箱を作る。模様が引き伸ばされないよう、面ごとに実際の大きさに合わせて UV を掛ける
function makeBox(b, tile) {
  const g = new THREE.BoxGeometry(b.w, b.h, b.d);
  const uv = g.attributes.uv;
  const [tu, tv] = tile;
  // BoxGeometry の面の並び：+x, -x, +y, -y, +z, -z（各4頂点）
  const dims = [[b.d, b.h], [b.d, b.h], [b.w, b.d], [b.w, b.d], [b.w, b.h], [b.w, b.h]];
  const ox = (b.x * 0.173 + b.z * 0.291) % 1;
  for (let f = 0; f < 6; f++) {
    const top = f === 2 || f === 3;
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, (uv.getX(i) * dims[f][0]) / tu + ox, (uv.getY(i) * dims[f][1]) / (top ? tu : tv));
    }
  }
  g.translate(b.x, (b.y ?? 0) + b.h / 2, b.z);
  return g;
}

// 飾り（当たり判定なし）を「素材名 → 形のリスト」に集める
function decorParts(list) {
  const parts = new Map();
  const add = (key, geo) => {
    if (!parts.has(key)) parts.set(key, []);
    parts.get(key).push(geo);
  };
  const cyl = (r, h, x, y, z, seg = 8) => new THREE.CylinderGeometry(r, r, h, seg).translate(x, y + h / 2, z);
  for (const d of list) {
    const s = d.s ?? 1;
    switch (d.t) {
      case "lamp":
        add("pole", cyl(0.08, 3.4, d.x, 0, d.z));
        add("bulb", new THREE.SphereGeometry(0.24, 8, 6).translate(d.x, 3.55, d.z));
        break;
      case "torch":
        add("pole", cyl(0.09, 2.2, d.x, 0, d.z));
        add("flame", new THREE.ConeGeometry(0.24, 0.6, 7).translate(d.x, 2.5, d.z));
        break;
      case "flag":
        add("pole", cyl(0.05, 4, d.x, 0, d.z));
        add(`cloth:${d.c}`, new THREE.BoxGeometry(1.3, 0.85, 0.04).translate(d.x + 0.7, 3.4, d.z));
        break;
      case "pine":
        add("trunk", cyl(0.3 * s, 2 * s, d.x, 0, d.z));
        add("pineLeaf", new THREE.ConeGeometry(2.4 * s, 4.5 * s, 8).translate(d.x, 2 * s + 2.2 * s, d.z));
        add("pineLeaf", new THREE.ConeGeometry(1.7 * s, 3.5 * s, 8).translate(d.x, 2 * s + 4.6 * s, d.z));
        break;
      case "tree":
        add("trunk", cyl(0.25 * s, 2.4 * s, d.x, d.y ?? 0, d.z));
        add("leaf", new THREE.IcosahedronGeometry(1.7 * s, 0).translate(d.x, (d.y ?? 0) + 3.4 * s, d.z));
        break;
      case "rock":
        add("rock", new THREE.DodecahedronGeometry(1.2 * s, 0).scale(1, 0.7, 1).translate(d.x, 0.6 * s, d.z));
        break;
      case "slab": {
        const tile = MATS[d.m].tile;
        add(`box:${d.m}`, makeBox({ x: d.x, z: d.z, y: d.y, w: d.w, d: d.d, h: d.h }, tile));
        break;
      }
      case "barrel": {
        const h = 0.9 * s;
        add("barrelWood", new THREE.CylinderGeometry(0.34 * s, 0.4 * s, h, 10).translate(d.x, h / 2, d.z));
        add("barrelHoop", new THREE.CylinderGeometry(0.365 * s, 0.365 * s, 0.07 * s, 10).translate(d.x, h * 0.28, d.z));
        add("barrelHoop", new THREE.CylinderGeometry(0.365 * s, 0.365 * s, 0.07 * s, 10).translate(d.x, h * 0.72, d.z));
        break;
      }
      case "grass": {
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI;
          const blade = new THREE.ConeGeometry(0.12 * s, 0.65 * s, 4);
          blade.rotateZ((i - 1) * 0.35);
          blade.translate(d.x + Math.cos(a) * 0.12 * s, 0.3 * s, d.z + Math.sin(a) * 0.12 * s);
          add("grassBlade", blade);
        }
        break;
      }
      case "ruinColumn": {
        const h = (d.h ?? 3.2) * s;
        add("rock", new THREE.CylinderGeometry(0.42 * s, 0.55 * s, h, 7).translate(d.x, h / 2, d.z));
        add("rock", new THREE.BoxGeometry(1.15 * s, 0.28 * s, 1.15 * s).translate(d.x, h + 0.12 * s, d.z));
        break;
      }
      case "woodCrate": {
        const g = new THREE.BoxGeometry(0.9 * s, 0.9 * s, 0.9 * s);
        g.translate(d.x, 0.45 * s, d.z);
        add("box:crate", g);
        // 箱の補強帯も同一マテリアルで結合して描画負荷を抑える
        add("barrelHoop", new THREE.BoxGeometry(0.94 * s, 0.07 * s, 0.94 * s).translate(d.x, 0.25 * s, d.z));
        break;
      }
      case "sign": {
        const h = 1.7 * s;
        add("trunk", cyl(0.055 * s, h, d.x, 0, d.z));
        add(`cloth:${d.c ?? 0x8b6b3e}`, new THREE.BoxGeometry(0.95 * s, 0.62 * s, 0.08 * s).translate(d.x, h * 0.78, d.z));
        add("barrelHoop", new THREE.BoxGeometry(0.7 * s, 0.045 * s, 0.1 * s).translate(d.x, h * 0.78, d.z + 0.05 * s));
        break;
      }
      case "lantern": {
        // 和紙提灯：木枠・紙面・吊り金具を同一素材ごとにまとめて描画
        const h = 1.05 * s;
        add("trunk", cyl(0.035 * s, 0.28 * s, d.x, d.y ?? 2.55, d.z, 6));
        add("paper", new THREE.CylinderGeometry(0.25 * s, 0.29 * s, h, 8).translate(d.x, (d.y ?? 2.55) - h * 0.35, d.z));
        add("lacquer", new THREE.CylinderGeometry(0.3 * s, 0.3 * s, 0.09 * s, 8).translate(d.x, (d.y ?? 2.55) + 0.18 * s, d.z));
        add("lacquer", new THREE.CylinderGeometry(0.3 * s, 0.3 * s, 0.09 * s, 8).translate(d.x, (d.y ?? 2.55) - h * 0.85, d.z));
        add("warmGlow", new THREE.SphereGeometry(0.12 * s, 6, 5).translate(d.x, d.y ?? 2.55, d.z));
        break;
      }
      case "sakura": {
        const y = d.y ?? 0;
        add("trunk", cyl(0.3 * s, 2.7 * s, d.x, y, d.z, 7));
        // 低ポリの花房を複数に分け、遠景でも桜と分かる輪郭を作る
        for (const [ox, oy, oz, r] of [[0,3.2,0,1.45],[-0.9,3.1,0.3,1.05],[0.85,3.15,-0.25,1.1],[0,4.05,0.1,1.0],[0.25,2.9,0.85,0.8]]) {
          add("sakuraLeaf", new THREE.IcosahedronGeometry(r * s, 1).translate(d.x + ox * s, y + oy * s, d.z + oz * s));
        }
        break;
      }
      case "stoneLantern": {
        const y = d.y ?? 0;
        add("rock", new THREE.BoxGeometry(0.75*s, 0.22*s, 0.75*s).translate(d.x, y + 0.11*s, d.z));
        add("rock", new THREE.CylinderGeometry(0.19*s, 0.25*s, 0.72*s, 6).translate(d.x, y + 0.58*s, d.z));
        add("rock", new THREE.BoxGeometry(0.62*s, 0.16*s, 0.62*s).translate(d.x, y + 1.02*s, d.z));
        add("paper", new THREE.BoxGeometry(0.34*s, 0.42*s, 0.34*s).translate(d.x, y + 1.31*s, d.z));
        add("rock", new THREE.ConeGeometry(0.55*s, 0.28*s, 4).rotateY(Math.PI/4).translate(d.x, y + 1.66*s, d.z));
        break;
      }
      case "fence": {
        const len = Math.max(1, d.len ?? 3.5) * s;
        const a = d.a ?? 0;
        const postCount = Math.max(2, Math.floor(len / 1.1) + 1);
        for (let i = 0; i < postCount; i++) {
          const u = (i / (postCount - 1) - 0.5) * len;
          const x = d.x + Math.cos(a) * u, z = d.z + Math.sin(a) * u;
          add("trunk", new THREE.BoxGeometry(0.12*s, 0.95*s, 0.12*s).translate(x, 0.48*s, z));
        }
        for (const y of [0.28, 0.72]) {
          const rail = new THREE.BoxGeometry(len, 0.12*s, 0.1*s);
          rail.rotateY(-a).translate(d.x, y*s, d.z);
          add("trunk", rail);
        }
        break;
      }
      case "roof": {
        // 破風を模した二枚の傾斜屋根。遮蔽物・当たり判定には使用しない。
        const w = (d.w ?? 3.2) * s, depth = (d.d ?? 2.2) * s;
        const ridgeY = (d.y ?? 3.2) * s;
        for (const side of [-1, 1]) {
          const geo = new THREE.BoxGeometry(w * 0.56, 0.16*s, depth);
          geo.rotateZ(side * -0.22);
          geo.translate(d.x + side * w * 0.23, ridgeY - 0.28*s, d.z);
          add("roofTile", geo);
        }
        add("lacquer", new THREE.BoxGeometry(0.12*s, 0.2*s, depth * 1.08).translate(d.x, ridgeY - 0.08*s, d.z));
        break;
      }
      case "rubble": {
        // 形状を少しずつ変え、同じ石の反復に見えないようにする
        for (let i = 0; i < 4; i++) {
          const a = i * 2.399;
          const r = (0.18 + (i % 2) * 0.16) * s;
          const geo = new THREE.DodecahedronGeometry((0.42 + (i % 3) * 0.12) * s, 0);
          geo.scale(1.25, 0.65 + (i % 2) * 0.2, 0.9);
          geo.rotateY(a);
          geo.translate(d.x + Math.cos(a) * r, (0.22 + (i % 2) * 0.12) * s, d.z + Math.sin(a) * r);
          add("rock", geo);
        }
        break;
      }
      default:
        break;
    }
  }
  return parts;
}

// 空：上から下へ色が変わる大きな球（霧の影響を受けない）
function makeSky(theme) {
  const geo = new THREE.SphereGeometry(280, 24, 14);
  const pos = geo.attributes.position;
  const top = new THREE.Color(theme.sky[0]), hor = new THREE.Color(theme.sky[1]), bot = new THREE.Color(theme.sky[2]);
  const col = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / 280;
    if (t >= 0) c.copy(hor).lerp(top, Math.pow(t, 0.6));
    else c.copy(hor).lerp(bot, Math.min(1, -t * 3));
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = -2;
  return mesh;
}

function makeStars() {
  const n = 320, arr = new Float32Array(n * 3);
  let seed = 12345;
  const r = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < n; i++) {
    const y = 0.15 + r() * 0.85, a = r() * 6.2832, k = Math.sqrt(1 - y * y) * 270;
    arr.set([Math.cos(a) * k, y * 270, Math.sin(a) * k], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  const mesh = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, fog: false, depthWrite: false }));
  mesh.renderOrder = -1;
  return mesh;
}

export function createMapView(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const hemi = new THREE.HemisphereLight();
  const sun = new THREE.DirectionalLight();
  scene.add(hemi, sun);
  let owned = []; // この地図専用の形・材料（切り替え時に解放する）

  function clear() {
    for (const o of owned) o.dispose();
    owned = [];
    root.clear();
  }

  function addMerged(list, mat) {
    const geo = mergeGeometries(list.map((g) => g.toNonIndexed()));
    for (const g of list) g.dispose();
    owned.push(geo);
    root.add(new THREE.Mesh(geo, mat));
  }

  function load(map) {
    clear();
    const th = map.theme;
    scene.background = new THREE.Color(th.sky[1]);
    scene.fog = new THREE.Fog(th.fog[0], th.fog[1], th.fog[2]);
    hemi.color.set(th.hemi[0]);
    hemi.groundColor.set(th.hemi[1]);
    hemi.intensity = th.hemi[2];
    sun.color.set(th.sun[0]);
    sun.intensity = th.sun[1];
    sun.position.set(...th.sun[2]).multiplyScalar(40);

    // 床
    const size = map.bound * 2 + 40;
    const tile = FLOOR_TILE[th.floor];
    const ft = tex(th.floor).clone();
    ft.needsUpdate = true;
    ft.repeat.set(size / tile, size / tile);
    owned.push(ft);
    const floorGeo = new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({ map: ft, color: th.floorTint, roughness: 1, envMapIntensity: 0.3 });
    owned.push(floorGeo, floorMat);
    root.add(new THREE.Mesh(floorGeo, floorMat));

    // 箱（壁・建物・障害物）：素材ごとにまとめる
    const byMat = new Map();
    for (const b of map.boxes) {
      if (!byMat.has(b.m)) byMat.set(b.m, []);
      byMat.get(b.m).push(makeBox(b, MATS[b.m].tile));
    }
    for (const [m, list] of byMat) addMerged(list, boxMat(m));

    // 飾り
    for (const [key, list] of decorParts(map.decor ?? [])) addMerged(list, decorMat(key));

    // 空・星
    const sky = makeSky(th);
    owned.push(sky.geometry, sky.material);
    root.add(sky);
    if (th.stars) {
      const stars = makeStars();
      owned.push(stars.geometry, stars.material);
      root.add(stars);
    }
    return { objects: root.children.length };
  }

  return { load, root };
}
