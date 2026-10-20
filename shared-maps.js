// マップ定義（サーバーとクライアントで共有）。
// 乱数を使わないので、どこで読み込んでも同じ形になる。
// 箱＝壁・建物・障害物。当たり判定は「上から見た長方形」で、高さ h は見た目だけ。
// m は素材名（サーバーは使わない）。

export const PLAYER_RADIUS = 0.4;

// 使える素材名（見た目側の定義と一致していることをテストで確認する）
export const BOX_MATERIALS = [
  "concrete", "concreteSnow", "brick", "facade", "facadeNight",
  "plasterA", "plasterB", "plasterC", "stone", "stoneDark",
  "wood", "woodDark", "crate", "metalGray", "corrugated",
  "cRed", "cBlue", "cGreen", "cOrange",
  "carRed", "carBlue", "carYellow", "carWhite",
  "hedge", "sandbag", "asphalt",
];

// ---- 作図の部品 ----
const bx = (x, z, w, d, h, m) => ({ x, z, w, d, h, m });
// 軸に平行な壁：(x1,z1)→(x2,z2)、厚み t
const wl = (x1, z1, x2, z2, t, h, m) =>
  z1 === z2
    ? bx((x1 + x2) / 2, z1, Math.abs(x2 - x1), t, h, m)
    : bx(x1, (z1 + z2) / 2, t, Math.abs(z2 - z1), h, m);
const mirX = (l) => l.map((b) => ({ ...b, x: -b.x }));
const mirZ = (l) => l.map((b) => ({ ...b, z: -b.z }));
const mir4 = (l) => [...l, ...mirX(l), ...mirZ(l), ...mirZ(mirX(l))];

// 4辺の外壁（アリーナの境目が見えるようにする）
function perimeter(B, m, h = 7, t = 2) {
  const o = B + 0.5 + t / 2;
  const len = 2 * (B + 0.5 + t);
  return [bx(0, -o, len, t, h, m), bx(0, o, len, t, h, m), bx(-o, 0, t, 2 * B + 1, h, m), bx(o, 0, t, 2 * B + 1, h, m)];
}

const cont = (x, z, alongX, m, h = 2.6) => (alongX ? bx(x, z, 12, 2.6, h, m) : bx(x, z, 2.6, 12, h, m));

// ---- 0 市街地・路地 ----
function city() {
  const boxes = [
    bx(0, -20, 12, 12, 10, "facade"), bx(-20, 0, 12, 12, 10, "facade"), bx(20, 0, 12, 12, 10, "facade"), bx(0, 20, 12, 12, 10, "facade"),
    bx(-23.5, -20, 5, 12, 7, "brick"), bx(-16.5, -20, 5, 12, 7, "plasterA"),
    bx(16.5, 20, 5, 12, 7, "brick"), bx(23.5, 20, 5, 12, 7, "plasterB"),
    bx(20, -23.5, 12, 5, 7, "plasterC"), bx(20, -16.5, 12, 5, 7, "brick"),
    bx(-20, 16.5, 12, 5, 7, "plasterA"), bx(-20, 23.5, 12, 5, 7, "facade"),
    bx(0, 0, 5, 5, 1.2, "stone"),
    ...mir4([bx(4.2, 4.2, 1.6, 1.6, 1.6, "crate")]),
    ...mir4([bx(13, 20, 1.4, 2.6, 1.5, "metalGray"), bx(20, 13, 2.6, 1.4, 1.5, "metalGray")]),
    bx(-9.5, -10, 2, 4.2, 1.5, "carRed"), bx(9.5, 10, 2, 4.2, 1.5, "carBlue"),
    bx(10, -9.5, 4.2, 2, 1.5, "carYellow"), bx(-10, 9.5, 4.2, 2, 1.5, "carWhite"),
    bx(0, -29, 4, 1, 1.1, "concrete"), bx(0, 29, 4, 1, 1.1, "concrete"), bx(-29, 0, 1, 4, 1.1, "concrete"), bx(29, 0, 1, 4, 1.1, "concrete"),
    ...mir4([bx(29, 29, 2, 2, 2, "crate")]),
    ...mir4([bx(29, 14, 1.6, 1.6, 0.8, "stone"), bx(14, 29, 1.6, 1.6, 0.8, "stone")]),
  ];
  const planters = mir4([{ x: 29, z: 14 }, { x: 14, z: 29 }]);
  return {
    name: "市街地・路地", bound: 32, wallM: "concrete", boxes,
    theme: { floor: "asphalt", floorTint: 0x8a8d92, sky: [0x5f9fe0, 0xcfe3f3, 0xb9c4cc], fog: [0xcfe3f3, 60, 190], sun: [0xfff1d6, 1.6, [-0.5, 1, -0.3]], hemi: [0xcfe3ff, 0x6b6558, 1.0] },
    decor: [
      ...mir4([{ t: "lamp", x: 6.5, z: 6.5 }, { t: "lamp", x: 30.6, z: 7 }, { t: "lamp", x: 7, z: 30.6 }]),
      { t: "flag", x: 0, z: -13.4, c: 0xb3261e }, { t: "flag", x: 0, z: 13.4, c: 0x1f5fb3 },
      { t: "flag", x: -13.4, z: 0, c: 0xd4a72c }, { t: "flag", x: 13.4, z: 0, c: 0x2e8b57 },
      ...planters.map((p) => ({ t: "tree", x: p.x, z: p.z, y: 0.8, s: 0.9 })),
    ],
  };
}

// ---- 1 廃墟・広場 ----
function ruins() {
  const R = (x1, z1, x2, z2) => wl(x1, z1, x2, z2, 1.2, 5.5, "stone");
  const boxes = [
    R(-8, -8, -2.5, -8), R(2.5, -8, 8, -8), R(-8, 8, -2.5, 8), R(2.5, 8, 8, 8),
    R(-8, -8, -8, -2.5), R(-8, 2.5, -8, 8), R(8, -8, 8, -2.5), R(8, 2.5, 8, 8),
    bx(0, 0, 2.2, 2.2, 6, "stoneDark"),
    ...mir4([bx(4, 4, 2, 2, 1.4, "stone")]),
    ...mir4([bx(27, 27, 7, 7, 9, "stoneDark")]),
    ...[-26, -18, -10, 10, 18, 26].flatMap((x) => [bx(x, 17, 1.8, 1.8, 6.5, "stone"), bx(x, -17, 1.8, 1.8, 6.5, "stone")]),
    wl(-36, 0, -24, 0, 1.2, 4, "stone"), wl(24, 0, 36, 0, 1.2, 4, "stone"), wl(0, -36, 0, -26, 1.2, 4, "stone"), wl(0, 26, 0, 36, 1.2, 4, "stone"),
    ...mir4([bx(15, 7, 2.4, 2.4, 1.8, "stone"), bx(7, 15, 2.4, 2.4, 1.8, "stone"), bx(24, 12, 2, 3, 2.2, "stone")]),
    wl(-20, -30, -12, -30, 1, 5, "stoneDark"), wl(12, -30, 20, -30, 1, 5, "stoneDark"),
    wl(-20, 30, -12, 30, 1, 5, "stoneDark"), wl(12, 30, 20, 30, 1, 5, "stoneDark"),
  ];
  return {
    name: "廃墟・広場", bound: 40, wallM: "stoneDark", boxes,
    theme: { floor: "dirt", floorTint: 0x8f8068, sky: [0x3e4c7a, 0xf0b98a, 0xb08a7a], fog: [0xd9a98a, 50, 170], sun: [0xffc890, 1.5, [0.7, 0.6, 0.2]], hemi: [0xffd0a0, 0x4a4048, 0.9] },
    decor: [
      ...mir4([{ t: "torch", x: 3.2, z: 7 }, { t: "rock", x: 36, z: 12, s: 1.4 }, { t: "pine", x: 44, z: 30, s: 1.2 }, { t: "pine", x: 44, z: 8, s: 1 }]),
      { t: "flag", x: 0, z: -6.5, c: 0x7a1f1f },
    ],
  };
}

// ---- 2 港町 ----
function harbor() {
  const W = (x1, z1, x2, z2) => wl(x1, z1, x2, z2, 1, 7, "corrugated");
  const boxes = [
    cont(-24, -26, true, "cRed"), cont(-24, -20.6, true, "cBlue"), cont(-29, -8, false, "cGreen"), cont(-23.4, -8, false, "cOrange"),
    cont(-24, 8, true, "metalGray"), cont(-24, 13.4, true, "cRed"), cont(-20, 26, false, "cBlue", 5.2),
    cont(24, -26, true, "cGreen"), cont(24, -20.6, true, "cOrange"), cont(29, -8, false, "cBlue"), cont(23.4, -8, false, "cRed"),
    cont(24, 8, true, "cBlue"), cont(24, 13.4, true, "cGreen"), cont(20, 26, false, "cOrange", 5.2),
    bx(0, 0, 3.6, 3.6, 10, "metalGray"),
    bx(5, 0, 2, 2, 2, "crate"), bx(-5, 0, 2, 2, 2, "crate"), bx(0, 5, 2, 2, 2, "crate"), bx(0, -5, 2, 2, 2, "crate"),
    W(-10, -33.5, 10, -33.5), W(-9.5, -34, -9.5, -30.5), W(-9.5, -28.5, -9.5, -24.5),
    W(9.5, -34, 9.5, -30.5), W(9.5, -28.5, 9.5, -24.5), W(-10, -24.5, -3, -24.5), W(3, -24.5, 10, -24.5),
    bx(-5, -30, 2, 2, 2, "crate"), bx(5, -30, 2, 2, 2, "crate"), bx(0, -28, 2, 2, 2, "crate"),
    wl(-14, 30, -6, 30, 1.2, 1.2, "concrete"), wl(6, 30, 14, 30, 1.2, 1.2, "concrete"),
    bx(-4, 19, 2, 2, 2, "crate"), bx(4, 19, 2, 2, 2, "crate"), bx(0, 24, 2, 2, 2, "crate"),
  ];
  return {
    name: "港町", bound: 36, wallM: "concrete", boxes,
    theme: { floor: "asphalt", floorTint: 0x7d8084, sky: [0x7c93a8, 0xc9d3dc, 0xaab5bd], fog: [0xc9d3dc, 50, 180], sun: [0xffffff, 1.1, [0.3, 1, 0.5]], hemi: [0xdde8f2, 0x5f6a72, 1.0] },
    decor: [
      { t: "slab", x: 0, z: 0, y: 10, w: 18, d: 1.4, h: 1, m: "metalGray" },
      { t: "lamp", x: -3.4, z: -23.6 }, { t: "lamp", x: 3.4, z: -23.6 }, { t: "lamp", x: -12, z: 30.8 }, { t: "lamp", x: 12, z: 30.8 },
      { t: "flag", x: 0, z: -22.5, c: 0x1f5fb3 }, { t: "flag", x: 0, z: 31.2, c: 0xb3261e },
    ],
  };
}

// ---- 3 住宅街 ----
function suburb() {
  const boxes = [
    bx(-24, -20, 9, 8, 4.5, "plasterA"), bx(-9, -20, 9, 8, 4.5, "plasterB"), bx(9, -20, 9, 8, 4.5, "plasterC"), bx(24, -20, 9, 8, 4.5, "plasterA"),
    bx(-16, 20, 9, 8, 4.5, "plasterB"), bx(0, 20, 9, 8, 4.5, "plasterA"), bx(16, 20, 9, 8, 4.5, "plasterC"),
    wl(-30, -8, -14, -8, 0.3, 1.4, "wood"), wl(14, -8, 30, -8, 0.3, 1.4, "wood"),
    wl(-30, 8, -12, 8, 0.3, 1.4, "wood"), wl(12, 8, 30, 8, 0.3, 1.4, "wood"),
    bx(-26, 2, 1.2, 7, 1.6, "hedge"), bx(26, -2, 1.2, 7, 1.6, "hedge"), bx(-6, 29, 8, 1.2, 1.6, "hedge"), bx(6, -29, 8, 1.2, 1.6, "hedge"),
    bx(-10, -3.5, 4.2, 2, 1.5, "carBlue"), bx(9, 3.5, 4.2, 2, 1.5, "carRed"), bx(0, -6.5, 4, 1.2, 2.6, "metalGray"),
    bx(-27, -28, 3, 3, 2.6, "wood"), bx(27, 28, 3, 3, 2.6, "wood"),
    bx(-20, -12.5, 1.6, 1.6, 1.6, "crate"), bx(20, 12.5, 1.6, 1.6, 1.6, "crate"), bx(-3, -12, 1.6, 1.6, 1.6, "crate"), bx(3, 12, 1.6, 1.6, 1.6, "crate"),
    wl(-30, -27, -17, -27, 0.4, 1.8, "brick"), wl(17, -27, 30, -27, 0.4, 1.8, "brick"),
    wl(-30, 27, -18, 27, 0.4, 1.8, "brick"), wl(18, 27, 30, 27, 0.4, 1.8, "brick"),
  ];
  return {
    name: "住宅街", bound: 32, wallM: "brick", boxes,
    theme: { floor: "grass", floorTint: 0x6f9a4d, sky: [0x5fa8ef, 0xd6ecff, 0xc9d8c0], fog: [0xd6ecff, 60, 190], sun: [0xfff4e0, 1.7, [0.4, 1, -0.4]], hemi: [0xd6ecff, 0x5d7a45, 1.0] },
    decor: [
      { t: "slab", x: 0, z: 0, y: 0.03, w: 66, d: 16, h: 0.06, m: "asphalt" },
      ...mir4([{ t: "tree", x: 14, z: -12.5, y: 0, s: 1 }, { t: "tree", x: 26, z: 12.5, y: 0, s: 1.1 }, { t: "lamp", x: 8, z: 7.4 }]),
      { t: "flag", x: -2, z: 7.2, c: 0xd4a72c },
    ],
  };
}

// ---- 4 山岳・山道 ----
function mountain() {
  const boxes = [
    bx(-28, -27, 16, 12, 9, "stoneDark"), bx(2, -31, 14, 8, 7, "stone"), bx(28, -26, 14, 14, 10, "stoneDark"),
    bx(-31, 8, 10, 18, 8, "stone"), bx(-12, 18, 12, 10, 6, "stoneDark"), bx(12, 22, 12, 8, 5, "stone"), bx(30, 16, 10, 16, 9, "stoneDark"),
    bx(-12, -8, 8, 6, 4, "stone"), bx(12, -4, 6, 8, 4.5, "stone"),
    bx(0, 6, 3.2, 3.2, 2.8, "stone"), bx(-22, -10, 3.2, 3.2, 2.8, "stone"), bx(22, 10, 3.2, 3.2, 2.8, "stone"), bx(-4, -18, 3.2, 3.2, 2.8, "stone"),
    bx(7, -17, 3.2, 3.2, 2.8, "stone"), bx(-26, 28, 3.2, 3.2, 2.8, "stone"), bx(0, 32, 3.2, 3.2, 2.8, "stone"), bx(24, -8, 3.2, 3.2, 2.8, "stone"),
    bx(-18, -14, 6, 1.2, 1.4, "wood"), bx(18, -12, 6, 1.2, 1.4, "wood"), bx(-20, 5, 6, 1.2, 1.4, "wood"),
    bx(14, 12, 6, 1.2, 1.4, "wood"), bx(-2, 22, 6, 1.2, 1.4, "wood"), bx(2, -24, 6, 1.2, 1.4, "wood"),
    bx(-10, -26, 2, 2, 1.8, "stoneDark"), bx(14, -22, 2, 2, 1.8, "stoneDark"), bx(26, 0, 2, 2, 1.8, "stoneDark"), bx(-30, -6, 2, 2, 1.8, "stoneDark"),
    bx(-4, 13, 2, 2, 1.8, "stoneDark"), bx(30, -8, 2, 2, 1.8, "stoneDark"), bx(-14, 30, 2, 2, 1.8, "stoneDark"), bx(16, 32, 2, 2, 1.8, "stoneDark"),
  ];
  return {
    name: "山岳・山道", bound: 40, wallM: "stoneDark", boxes,
    theme: { floor: "dirt", floorTint: 0x7a7f5a, sky: [0x4a78b5, 0xdfe9f2, 0x9fb0a0], fog: [0xdfe9f2, 55, 180], sun: [0xfff0dd, 1.5, [-0.6, 1, 0.3]], hemi: [0xdbe8f5, 0x55603f, 1.0] },
    decor: [
      ...mir4([{ t: "pine", x: 44, z: 36, s: 1.4 }, { t: "pine", x: 44, z: 20, s: 1.2 }, { t: "pine", x: 44, z: 4, s: 1.5 }, { t: "pine", x: 36, z: 44, s: 1.3 }, { t: "pine", x: 18, z: 44, s: 1.2 }, { t: "pine", x: 2, z: 44, s: 1.4 }]),
      ...mir4([{ t: "rock", x: 42, z: 14, s: 1.6 }, { t: "rock", x: 10, z: 43, s: 1.4 }]),
    ],
  };
}

// ---- 5 雪原・戦場 ----
function snowfield() {
  const boxes = [
    wl(-36, -14, -8, -14, 1.6, 1.4, "sandbag"), wl(8, -14, 36, -14, 1.6, 1.4, "sandbag"),
    wl(-36, 14, -8, 14, 1.6, 1.4, "sandbag"), wl(8, 14, 36, 14, 1.6, 1.4, "sandbag"),
    ...mir4([bx(20, 5, 1.6, 6, 1.4, "sandbag")]),
    ...mir4([bx(30, 28, 8, 6, 4, "concreteSnow")]),
    bx(0, 0, 8, 3.4, 3, "metalGray"), bx(-1, 0, 3.6, 3.6, 4.4, "metalGray"),
    ...mir4([bx(7, 5, 2, 2, 2, "crate")]),
    ...mir4([bx(14, 32, 3, 3, 9, "wood")]),
    wl(-34, -22, -22, -22, 0.3, 1.2, "wood"), wl(22, -22, 34, -22, 0.3, 1.2, "wood"), wl(-34, 22, -22, 22, 0.3, 1.2, "wood"), wl(22, 22, 34, 22, 0.3, 1.2, "wood"),
    ...mir4([bx(10, 22, 2.4, 2.4, 1.8, "stoneDark"), bx(28, 6, 2.4, 2.4, 1.8, "stoneDark")]),
  ];
  return {
    name: "雪原・戦場", bound: 40, wallM: "concreteSnow", boxes,
    theme: { floor: "snow", floorTint: 0xf4f8ff, sky: [0x9fb6cc, 0xe8eef4, 0xe0e8ee], fog: [0xe8eef4, 45, 160], sun: [0xffffff, 1.3, [0.2, 1, 0.4]], hemi: [0xf0f6ff, 0xc8d4e0, 1.1] },
    decor: [
      ...mir4([{ t: "pine", x: 44, z: 24, s: 1.3 }, { t: "pine", x: 44, z: 6, s: 1.1 }, { t: "pine", x: 24, z: 44, s: 1.2 }, { t: "pine", x: 6, z: 44, s: 1.3 }]),
      { t: "flag", x: 0, z: -10, c: 0xb3261e }, { t: "flag", x: 0, z: 10, c: 0x1f5fb3 },
    ],
  };
}

// ---- 6 夜戦・ゲート ----
function nightGate() {
  const boxes = [
    wl(-34.5, -14, -5, -14, 2, 7.5, "stoneDark"), wl(5, -14, 34.5, -14, 2, 7.5, "stoneDark"),
    bx(-7, -14, 6, 6, 11, "stone"), bx(7, -14, 6, 6, 11, "stone"),
    bx(-21, 12, 14, 8, 5.5, "facadeNight"), bx(21, 12, 10, 8, 5, "facadeNight"),
    bx(0, 8, 3, 3, 1.3, "stone"), bx(-9, 6, 2.4, 2.4, 1.8, "wood"), bx(9, 6, 2.4, 2.4, 1.8, "wood"),
    wl(-34, -3, -26, -3, 1, 2.2, "stone"), wl(26, -3, 34, -3, 1, 2.2, "stone"), wl(-10, 22, 10, 22, 1.2, 2.6, "stoneDark"),
    bx(-16, -24, 8, 1.6, 2.2, "stone"), bx(16, -24, 8, 1.6, 2.2, "stone"), bx(0, -26, 3, 3, 2.4, "stone"),
    bx(-26, -22, 3, 3, 2.4, "stone"), bx(26, -22, 3, 3, 2.4, "stone"),
    bx(-12, 18, 2, 2, 2, "crate"), bx(12, 18, 2, 2, 2, "crate"), bx(-28, 22, 2, 2, 2, "crate"), bx(28, 22, 2, 2, 2, "crate"),
    bx(-8, -30, 6, 1.2, 1.4, "woodDark"), bx(8, -30, 6, 1.2, 1.4, "woodDark"), bx(-22, -30, 6, 1.2, 1.4, "woodDark"), bx(22, -30, 6, 1.2, 1.4, "woodDark"),
  ];
  return {
    name: "夜戦・ゲート", bound: 34, wallM: "stoneDark", boxes,
    theme: { floor: "dirt", floorTint: 0x4a4a52, sky: [0x050a18, 0x1a2540, 0x0c1220], fog: [0x141c30, 25, 110], sun: [0x8fa8ff, 0.8, [-0.3, 1, 0.4]], hemi: [0x5a6ea8, 0x1a1a22, 0.7], stars: true },
    decor: [
      ...mirX([{ t: "torch", x: 4.6, z: -12.6 }, { t: "torch", x: 16, z: 2 }, { t: "torch", x: 6, z: 20.6 }]),
      { t: "torch", x: 4.6, z: -12.6 }, { t: "torch", x: 16, z: 2 }, { t: "torch", x: 6, z: 20.6 },
      { t: "flag", x: 0, z: -13, c: 0x7a1f1f },
    ],
  };
}

// 各マップにテーマ固有の小物を追加。装飾は当たり判定に加えず、戦闘ルートを塞がない。
function addMapDetails(def, index) {
  const decor = [...(def.decor ?? [])];
  const blocked = (x, z, radius = 1.1) => def.boxes.some((b) =>
    Math.abs(x - b.x) < b.w / 2 + radius && Math.abs(z - b.z) < b.d / 2 + radius
  );
  const addIfClear = (item, radius = 1.1) => {
    if (Math.abs(item.x) < def.bound - 2 && Math.abs(item.z) < def.bound - 2 && !blocked(item.x, item.z, radius)) decor.push(item);
  };
  // 中央部にも小さな環境ストーリーを置く。装飾は衝突判定に影響しない。
  // 配置は決定的にし、通信相手や端末ごとに景観がずれないようにする。
  const interior = [
    // 市街地：路地の生活感
    [{ t: "sign", x: -13, z: 5, c: 0xb3261e, s: 0.9 }, { t: "barrel", x: 13, z: -5, s: 0.8 }, { t: "woodCrate", x: -5, z: 13, s: 0.75 }, { t: "lantern", x: -12, z: -5, y: 2.5, s: 0.85 }, { t: "roof", x: 12, z: 12, y: 3.4, w: 3.2, d: 2.6, s: 0.9 }],
    // 廃墟：崩落した石材
    [{ t: "rubble", x: -13, z: 12, s: 1.2 }, { t: "ruinColumn", x: 13, z: -12, h: 1.7, s: 0.85 }, { t: "rock", x: -13, z: -12, s: 0.8 }, { t: "rubble", x: 12, z: 12, s: 0.9 }, { t: "stoneLantern", x: -18, z: 4, s: 0.8 }],
    // 港町：係留設備と積み荷
    [{ t: "sign", x: -13, z: 18, c: 0x1f5fb3, s: 0.8 }, { t: "barrel", x: 13, z: 18, s: 1.1 }, { t: "woodCrate", x: 13, z: -18, s: 1.1 }, { t: "fence", x: -13, z: -18, len: 4, a: 0, s: 0.8 }, { t: "lantern", x: 13, z: -4, y: 2.5, s: 0.9 }],
    // 住宅街：庭石・植栽
    [{ t: "sakura", x: -13, z: 13, y: 0, s: 0.8 }, { t: "grass", x: 13, z: -13, s: 1.3 }, { t: "woodCrate", x: -13, z: -13, s: 0.7 }, { t: "stoneLantern", x: 13, z: 13, s: 0.7 }, { t: "fence", x: -13, z: -2, len: 4, a: Math.PI / 2, s: 0.8 }],
    // 山道：道標と岩
    [{ t: "sign", x: -18, z: 0, c: 0x9b7540, s: 0.8 }, { t: "rock", x: 18, z: 0, s: 1.1 }, { t: "pine", x: -18, z: 18, s: 0.8 }, { t: "stoneLantern", x: 18, z: -18, s: 0.75 }, { t: "fence", x: -18, z: -18, len: 4, a: 0.5, s: 0.7 }],
    // 雪原：折れた標識と雪に埋もれた資材
    [{ t: "sign", x: -16, z: 0, c: 0xc6d9eb, s: 0.8 }, { t: "rock", x: 16, z: 0, s: 0.9 }, { t: "woodCrate", x: 0, z: 17, s: 0.7 }, { t: "rubble", x: -16, z: 18, s: 0.7 }, { t: "fence", x: 16, z: -18, len: 3.5, a: 0, s: 0.7 }],
    // 夜戦：灯火と補給物資
    [{ t: "torch", x: -13, z: 13, s: 0.85 }, { t: "barrel", x: 13, z: -13, s: 0.9 }, { t: "sign", x: 0, z: 20, c: 0x7a1f1f, s: 0.85 }, { t: "lantern", x: -17, z: 5, y: 2.6, s: 0.85 }, { t: "ruinColumn", x: 17, z: 5, h: 2.2, s: 0.8 }],
  ][index] ?? [];
  for (const item of interior) addIfClear(item, item.t === "tree" || item.t === "pine" ? 1.8 : 1.25);

  // 周縁のアクセントは規則的な間隔にし、乱数を使わず端末間で同じ景観にする。
  for (let i = -3; i <= 3; i++) {
    const p = i * 8;
    if (index === 0) { // 市街地：路地の荷物・街路樹
      addIfClear({ t: "barrel", x: p, z: -29, s: 0.9 });
      addIfClear({ t: "woodCrate", x: p + 2, z: 29, s: 0.85 });
    } else if (index === 1) { // 廃墟：崩れた柱と瓦礫
      addIfClear({ t: "ruinColumn", x: p, z: -31, h: 2.1 + (Math.abs(i) % 3) * 0.65, s: 0.9 });
      addIfClear({ t: "rock", x: p + 3, z: 31, s: 0.75 + (Math.abs(i) % 2) * 0.25 });
    } else if (index === 2) { // 港町：積み荷と樽
      addIfClear({ t: "barrel", x: p, z: -31, s: 1 });
      addIfClear({ t: "woodCrate", x: p + 2, z: 31, s: 1 });
    } else if (index === 3) { // 住宅街：庭木の代わりの草むらと木箱
      addIfClear({ t: "grass", x: p, z: -29, s: 1.1 });
      addIfClear({ t: "grass", x: p + 3, z: 29, s: 1.25 });
    } else if (index === 4) { // 山道：岩肌の小さな草
      addIfClear({ t: "rock", x: p, z: -33, s: 0.65 + (Math.abs(i) % 3) * 0.18 });
      addIfClear({ t: "grass", x: p + 3, z: 33, s: 1.2 });
    } else if (index === 5) { // 雪原：雪に埋もれた岩
      addIfClear({ t: "rock", x: p, z: -32, s: 0.65 + (Math.abs(i) % 2) * 0.2 });
      addIfClear({ t: "rock", x: p + 3, z: 32, s: 0.6 });
    } else { // 夜戦：補給用の樽と障害物の視認性を補う灯火
      addIfClear({ t: "barrel", x: p, z: -29, s: 0.85 });
      if (Math.abs(i) % 2 === 0) addIfClear({ t: "torch", x: p + 3, z: 29 });
    }
  }
  return { ...def, decor };
}

function finish(def, index) {
  const detailed = addMapDetails(def, index);
  return { ...detailed, boxes: [...detailed.boxes, ...perimeter(detailed.bound, detailed.wallM)] };
}

export const MAPS = [city(), ruins(), harbor(), suburb(), mountain(), snowfield(), nightGate()].map(finish);

// ---- 解析（テストとスポーン用） ----
export function freeAt(map, x, z, margin = 0) {
  if (Math.abs(x) > map.bound || Math.abs(z) > map.bound) return false;
  const r = PLAYER_RADIUS + margin;
  for (const b of map.boxes) {
    if (Math.abs(x - b.x) < b.w / 2 + r && Math.abs(z - b.z) < b.d / 2 + r) return false;
  }
  return true;
}

const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// 歩ける場所を格子で調べ、最も大きい「つながった領域」を返す（行き止まりの小部屋を見つけるため）
export function mainRegion(map, step = 1) {
  const n = Math.floor((2 * map.bound) / step) + 1;
  const at = (i) => -map.bound + i * step;
  const free = new Uint8Array(n * n);
  let freeCount = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (freeAt(map, at(i), at(j))) {
        free[i * n + j] = 1;
        freeCount++;
      }
    }
  }
  const comp = new Int32Array(n * n).fill(-1);
  const stack = [];
  let comps = 0, best = -1, bestSize = 0;
  for (let s = 0; s < n * n; s++) {
    if (!free[s] || comp[s] !== -1) continue;
    let size = 0;
    comp[s] = comps;
    stack.push(s);
    while (stack.length) {
      const c = stack.pop();
      size++;
      const i = (c / n) | 0, j = c % n;
      for (const [di, dj] of D4) {
        const ni = i + di, nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= n || nj >= n) continue;
        const k = ni * n + nj;
        if (free[k] && comp[k] === -1) {
          comp[k] = comps;
          stack.push(k);
        }
      }
    }
    if (size > bestSize) {
      bestSize = size;
      best = comps;
    }
    comps++;
  }
  const cells = [];
  for (let s = 0; s < n * n; s++) if (comp[s] === best) cells.push([at((s / n) | 0), at(s % n)]);
  return { cells, freeCount, mainSize: bestSize, components: comps, cellsTotal: n * n, step };
}

// スポーン地点：つながった領域の中で、壁から離れた点を、互いに遠くなるように選ぶ（決定的）
const spawnCache = new WeakMap();
export function getSpawns(map, max = 16) {
  if (spawnCache.has(map)) return spawnCache.get(map);
  const cands = mainRegion(map, 2).cells
    .filter(([x, z]) => freeAt(map, x, z, 0.8))
    .map(([x, z]) => ({ x, z }));
  const picked = [];
  if (cands.length) {
    picked.push(cands.reduce((a, c) => (Math.hypot(c.x, c.z) < Math.hypot(a.x, a.z) ? c : a)));
    while (picked.length < max) {
      let best = null, bestD = 0;
      for (const c of cands) {
        const d = Math.min(...picked.map((p) => Math.hypot(p.x - c.x, p.z - c.z)));
        if (d > bestD) {
          bestD = d;
          best = c;
        }
      }
      if (!best || bestD < 6) break;
      picked.push(best);
    }
  }
  spawnCache.set(map, picked);
  return picked;
}

// 他のプレイヤーから一番遠い地点を選ぶ（上位3つからランダム）
export function pickSpawn(spawns, others, rand = Math.random) {
  if (!spawns.length) return { x: 0, z: 0 };
  if (!others.length) return spawns[Math.floor(rand() * spawns.length)];
  const scored = spawns
    .map((s) => ({ s, d: Math.min(...others.map((o) => Math.hypot(o.x - s.x, o.z - s.z))) }))
    .sort((a, b) => b.d - a.d);
  const top = scored.slice(0, Math.min(3, scored.length));
  return top[Math.floor(rand() * top.length)].s;
}
