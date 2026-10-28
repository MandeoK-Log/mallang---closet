/* ===== 말랑 옷장 : 픽셀 그림 =====
   56×64 칸짜리 도트 위에 도형을 찍고, 칸마다 외곽선·그늘·하이라이트를 자동으로 넣어요. */
const GW = 56, GH = 64;
const INK = '#2f2321';

/* ---------- 색 ---------- */
function rgbHex(r, g, b) { return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join(''); }
const _shadeCache = new Map();
function shade(hex, amt) {
  const k = hex + amt; if (_shadeCache.has(k)) return _shadeCache.get(k);
  const [r, g, b] = hexRgb(hex).map(v => v * 255);
  const f = v => amt < 0 ? v * (1 + amt) : v + (255 - v) * amt;
  const out = rgbHex(f(r), f(g), f(b)); _shadeCache.set(k, out); return out;
}
function mix(a, b, t) { const A = hexRgb(a), B = hexRgb(b); return rgbHex(...A.map((v, i) => (v + (B[i] - v) * t) * 255)); }
const outlineOf = c => mix(shade(c, -0.55), INK, 0.6);

/* ---------- 칸 마스크 ---------- */
class M {
  constructor() { this.a = new Uint8Array(GW * GH); }
  has(x, y) { return x >= 0 && y >= 0 && x < GW && y < GH && this.a[y * GW + x] === 1; }
  put(x, y) { if (x >= 0 && y >= 0 && x < GW && y < GH) this.a[y * GW + x] = 1; return this; }
  test(fn) { for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (fn(x + 0.5, y + 0.5)) this.a[y * GW + x] = 1; return this; }
  ell(cx, cy, rx, ry, ang = 0) {
    const c = Math.cos(ang), s = Math.sin(ang);
    return this.test((px, py) => { const dx = px - cx, dy = py - cy, u = dx * c + dy * s, v = -dx * s + dy * c; return (u * u) / (rx * rx) + (v * v) / (ry * ry) <= 1; });
  }
  box(x0, y0, x1, y1) { return this.test((px, py) => px >= x0 && px <= x1 && py >= y0 && py <= y1); }
  rect(x, y, w, h) { return this.box(x, y, x + w, y + h); }
  rrect(x, y, w, h, r) {
    this.box(x + r, y, x + w - r, y + h).box(x, y + r, x + w, y + h - r);
    return this.ell(x + r, y + r, r, r).ell(x + w - r, y + r, r, r).ell(x + r, y + h - r, r, r).ell(x + w - r, y + h - r, r, r);
  }
  poly(pts) {
    return this.test((px, py) => {
      let ins = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) ins = !ins;
      }
      return ins;
    });
  }
  line(x0, y0, x1, y1, w = 1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1, h = (w - 1) / 2;
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
      for (let a = -h; a <= h + 0.001; a++) for (let b = -h; b <= h + 0.001; b++) this.put(Math.round(x + a), Math.round(y + b));
    }
    return this;
  }
  rows(y0, y1) { for (let y = 0; y < GH; y++) if (y < y0 || y > y1) this.a.fill(0, y * GW, y * GW + GW); return this; }
  cols(x0, x1) { for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (x < x0 || x > x1) this.a[y * GW + x] = 0; return this; }
  and(m) { for (let i = 0; i < this.a.length; i++) this.a[i] &= m.a[i]; return this; }
  or(m) { for (let i = 0; i < this.a.length; i++) this.a[i] |= m.a[i]; return this; }
  sub(m) { for (let i = 0; i < this.a.length; i++) if (m.a[i]) this.a[i] = 0; return this; }
  clone() { const m = new M(); m.a.set(this.a); return m; }
  each(fn) { for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (this.a[y * GW + x]) fn(x, y); }
}
const E = (cx, cy, rx, ry, ang) => new M().ell(cx, cy, rx, ry, ang);
const R = (x, y, w, h) => new M().rect(x, y, w, h);
const RR = (x, y, w, h, r) => new M().rrect(x, y, w, h, r);
const PG = pts => new M().poly(pts);
const LN = (x0, y0, x1, y1, w) => new M().line(x0, y0, x1, y1, w);
const symPoly = left => left.concat(left.slice().reverse().map(([x, y]) => [56 - x, y]));
const mirX = x => GW - 1 - x;

/* ---------- 붓 ---------- */
class Painter {
  constructor() { this.groups = []; this.g = null; }
  group(cls = '', style = '') { this.g = { cls, style, px: new Map() }; this.groups.push(this.g); return this; }
  set(x, y, c) { if (x >= 0 && y >= 0 && x < GW && y < GH) this.g.px.set(y * GW + x, c); }
  dots(pts, c) { for (const [x, y] of pts) this.set(x, y, c); return this; }
  sym(pts, c) { for (const [x, y] of pts) { this.set(x, y, c); this.set(mirX(x), y, c); } return this; }
  /* 마스크를 칠하면서 외곽선 · 아래오른쪽 그늘 · 위왼쪽 빛을 자동으로 넣어요 */
  fill(m, base, o = {}) {
    const ol = o.outline === false ? null : (o.outline || outlineOf(base));
    const shadeOn = o.shade !== false, hlOn = o.hl !== false;
    m.each((x, y) => {
      let c = (o.pat && o.pat(x, y)) || base;
      const edge = !m.has(x - 1, y) || !m.has(x + 1, y) || !m.has(x, y - 1) || !m.has(x, y + 1);
      if (edge && ol) { this.set(x, y, ol); return; }
      if (shadeOn && (!m.has(x + 1, y + 2) || !m.has(x + 2, y + 1))) c = shade(c, -0.17);
      else if (shadeOn && o.dither !== false && (x + y) % 2 === 0 && (!m.has(x + 2, y + 3) || !m.has(x + 3, y + 2))) c = shade(c, -0.17);
      else if (hlOn && (!m.has(x - 1, y - 2) || !m.has(x - 2, y - 1))) c = shade(c, 0.32);
      this.set(x, y, c);
    });
    return this;
  }
  patch(m, c) { m.each((x, y) => this.set(x, y, typeof c === 'function' ? c(x, y) : c)); return this; }
  svg() {
    let out = '';
    for (const g of this.groups) {
      if (!g.px.size) continue;
      const byCol = {};
      for (let y = 0; y < GH; y++) {
        let x = 0;
        while (x < GW) {
          const c = g.px.get(y * GW + x);
          if (!c) { x++; continue; }
          let x2 = x + 1; while (x2 < GW && g.px.get(y * GW + x2) === c) x2++;
          (byCol[c] || (byCol[c] = [])).push(`M${x} ${y}h${x2 - x}v1h${x - x2}z`);
          x = x2;
        }
      }
      const inner = Object.keys(byCol).map(c => `<path fill="${c}" d="${byCol[c].join('')}"/>`).join('');
      out += (g.cls || g.style) ? `<g${g.cls ? ` class="${g.cls}"` : ''}${g.style ? ` style="${g.style}"` : ''}>${inner}</g>` : inner;
    }
    return out;
  }
}

/* ---------- 공통 몸 ---------- */
const BODY = () => E(28, 44.2, 13, 12.4);
const TORSO = () => BODY().rows(28, 49);
const SHORTS = () => BODY().rows(48, 53);
const LONGS = () => BODY().rows(48, 63).or(R(19, 54, 7, 4)).or(R(30, 54, 7, 4));
const FEET_X = [22.5, 33.5];
const ARMS = {
  def: [[15.5, 44, 3, 5.5, 0.35], [40.5, 44, 3, 5.5, -0.35]],
  otter: [[20, 45.5, 3, 4.6, -0.75], [36, 45.5, 3, 4.6, 0.75]],
  seal: [[15.5, 45, 2.6, 6, 0.55], [40.5, 45, 2.6, 6, -0.55]]
};
const armsOf = cid => ARMS[cid] || ARMS.def;
const PINK = '#f49aa6', BLUSH = '#f6a9b0';
/* 다른 파일(패션쇼 경쟁자 등)이 머리·꼬리 그리기를 추가할 수 있는 자리 */
const EXTRA = { head: {}, tail: {} };

function eye(P, x, y, kind = 'tall') {
  const K = '#231817';
  if (kind === 'big') { P.dots([[x, y], [x + 1, y], [x + 2, y], [x, y + 1], [x + 1, y + 1], [x + 2, y + 1], [x, y + 2], [x + 1, y + 2], [x + 2, y + 2]], K); P.dots([[x + 1, y]], '#fff'); P.dots([[x + 2, y + 2]], '#8a7f7c'); }
  else if (kind === 'dot') { P.dots([[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]], K); P.dots([[x + 1, y]], '#fff'); }
  else { P.dots([[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1], [x, y + 2], [x + 1, y + 2]], K); P.dots([[x + 1, y]], '#fff'); }
}
function eyes(P, x, y, kind) { const w = kind === 'big' ? 3 : 2; eye(P, x, y, kind); eye(P, GW - x - w, y, kind); }
function blush(P, x, y, w = 3) { for (let i = 0; i < w; i++) { P.set(x + i, y, BLUSH); P.set(mirX(x + i), y, BLUSH); } P.set(x + 1, y + 1, shade(BLUSH, 0.25)); P.set(mirX(x + 1), y + 1, shade(BLUSH, 0.25)); }

/* ----- 캐릭터 부위 ----- */
function drawTail(P, cid) {
  const c = CHARS[cid];
  if (EXTRA.tail[cid]) return EXTRA.tail[cid](P, c);
  if (cid === 'otter') P.fill(PG([[19, 51], [5, 57], [3, 60], [8, 61], [21, 56]]), shade(c.fur, -0.08));
  else if (cid === 'fox') {
    const t = PG([[36, 55], [45, 56], [51, 53], [55, 46], [55, 37], [52, 30], [48, 27], [46, 33], [47, 40], [44, 46], [38, 48]]);
    P.fill(t, c.fur, { pat: (x, y) => y < 34 ? '#dfe6f4' : (x + y) % 2 === 0 && y > 50 ? '#eef1f8' : null });
  }
}
function drawFeet(P, cid) {
  const c = CHARS[cid];
  for (const fx of FEET_X) {
    if (cid === 'seal') P.fill(E(fx + (fx < 28 ? -1 : 1), 59.5, 5.5, 2.6), c.fur);
    else P.fill(E(fx, 58.5, 4.5, 3), c.feet || (cid === 'otter' || cid === 'wombat' ? shade(c.fur, -0.1) : c.fur));
    if (cid === 'hamster') P.dots([[Math.round(fx - 2), 60], [Math.round(fx), 60], [Math.round(fx + 1.5), 60]], PINK);
  }
}
function drawBody(P, cid) {
  const c = CHARS[cid];
  const pat = c.pat ? c.pat : cid === 'seal' ? (x, y) => ((x * 7 + y * 13) % 23 === 0 || (x * 5 + y * 3) % 29 === 0) ? '#a5b1bc' : null : null;
  P.fill(BODY(), c.fur, { pat });
  if (c.chest) P.patch(PG([[20, 37], [28, 43], [36, 37], [36, 39.5], [28, 45.5], [20, 39.5]]), c.chest);
  if (cid === 'otter' || cid === 'wombat' || cid === 'hamster' || c.belly) P.patch(E(28, 47.5, 8, 7.5).and(E(28, 45, 11.3, 10.3)), (x, y) => (y > 51 && (x + y) % 2) ? shade(c.cream, -0.08) : c.cream);
}
function drawArm(P, cid, i, top) {
  const c = CHARS[cid], [cx, cy, rx, ry, ang] = armsOf(cid)[i];
  const m = E(cx, cy, rx, ry, ang);
  P.fill(m, c.fur, { hl: false });
  if (top && top.sleeve !== 'none') {
    const cut = top.sleeve === 'long' ? cy + ry - 2.5 : cy - 0.5;
    const sl = m.clone().rows(0, Math.floor(cut));
    P.fill(sl, top.color, { hl: false, pat: top.kind === 'stripe' ? (x, y) => y % 3 === 0 ? top.accent : null : top.kind === 'plaid' ? (x, y) => (x % 4 === 0 || y % 4 === 0) ? shade(top.color, -0.2) : null : top.kind === 'jersey' ? () => top.accent : null });
  }
  if (cid === 'hamster' || cid === 'otter') { const px = Math.round(cx + Math.sin(ang) * (ry - 1.2)), py = Math.round(cy + Math.cos(ang) * (ry - 1.4)); P.set(px, py, PINK); }
}
function drawHead(P, cid) {
  const c = CHARS[cid], f = c.fur;
  if (EXTRA.head[cid]) return EXTRA.head[cid](P, c);
  if (cid === 'otter') {
    for (const ex of [14, 42]) { P.fill(E(ex, 12.5, 3.2, 3.2), f); P.patch(E(ex, 12.5, 1.2, 1.2), shade(f, -0.35)); }
    const head = E(28, 21, 15.5, 13);
    P.fill(head, f);
    P.patch(E(28, 26, 9.5, 6).and(E(28, 21, 14.3, 11.8)), c.cream);
    P.sym([[19, 16], [20, 15], [21, 15], [22, 16]], c.cream);
    eyes(P, 20, 18, 'tall');
    P.dots([[26, 23], [27, 23], [28, 23], [29, 23], [27, 24], [28, 24]], '#231817'); P.dots([[26, 23]], '#6b524c');
    P.dots([[25, 26], [26, 27], [27, 26], [28, 26], [29, 27], [30, 26]], '#231817');
    blush(P, 16, 24);
    P.sym([[15, 26], [14, 26], [13, 27]], shade(f, -0.4));
  } else if (cid === 'seal') {
    const head = E(28, 21, 16.5, 13.5);
    P.fill(head, f, { pat: (x, y) => ([[17, 12], [18, 12], [36, 10], [39, 15], [40, 15], [14, 22], [33, 9], [41, 26]].some(([a, b]) => a === x && b === y)) ? '#a5b1bc' : null });
    eyes(P, 19, 17, 'big');
    P.fill(E(25, 25.5, 3.6, 2.7).or(E(31, 25.5, 3.6, 2.7)), '#f3f6f8', { hl: false });
    P.dots([[24, 25], [26, 26], [31, 26], [29, 25]], '#7b8791');
    P.dots([[26, 22], [27, 22], [28, 22], [29, 22], [27, 23], [28, 23]], '#231817');
    P.sym([[20, 26], [19, 26], [18, 25], [17, 25]], '#5e6a74');
    blush(P, 15, 21);
  } else if (cid === 'fox') {
    for (const side of [1, -1]) {
      const pts = [[13, 16], [11, 2], [13, 1], [25, 10]].map(([x, y]) => side > 0 ? [x, y] : [56 - x, y]);
      P.fill(PG(pts), f);
      const inner = [[14, 13], [13, 5], [21, 10]].map(([x, y]) => side > 0 ? [x, y] : [56 - x, y]);
      P.patch(PG(inner), '#d9e0f2');
    }
    const head = E(28, 21, 15, 12.5).or(PG([[14, 21], [9, 27], [13, 26.5], [11, 30], [17, 29]])).or(PG([[42, 21], [47, 27], [43, 26.5], [45, 30], [39, 29]]));
    P.fill(head, f, { pat: (x, y) => (y > 27 && (x + y) % 2 === 0) ? '#eef1f8' : null });
    eyes(P, 20, 19, 'dot');
    P.sym([[19, 19]], '#231817');
    P.dots([[27, 23], [28, 23], [27, 24], [28, 24]], '#231817');
    P.dots([[26, 26], [27, 27], [28, 27], [29, 26]], '#231817');
    blush(P, 16, 23);
  } else if (cid === 'wombat') {
    for (const side of [1, -1]) { const pts = [[13, 13], [13, 5], [16, 4], [20, 9]].map(([x, y]) => side > 0 ? [x, y] : [56 - x, y]); P.fill(PG(pts), f); }
    const head = RR(12, 7, 32, 28, 11);
    P.fill(head, f);
    P.patch(E(28, 28, 10.5, 6).and(RR(13, 8, 30, 26, 10)), c.cream);
    eyes(P, 16, 18, 'dot');
    P.fill(RR(22, 21, 12, 7, 3), '#4a3833', { outline: '#231817' });
    P.dots([[24, 23], [25, 23]], '#8c7770');
    P.dots([[26, 31], [27, 32], [28, 32], [29, 31]], '#231817');
    blush(P, 15, 25);
  } else {
    // 골든햄스터: 위는 주황, 아래는 크림, 볼주머니가 빵빵
    for (const ex of [16, 40]) { P.fill(E(ex, 10, 3.6, 3.6), f); P.patch(E(ex, 10.3, 1.7, 1.7), PINK); }
    const head = E(28, 21, 15, 12.5).or(E(16, 27, 6, 5.5)).or(E(40, 27, 6, 5.5));
    const cream = E(28, 29, 10, 6.5).or(E(16, 28.5, 5.5, 4.2)).or(E(40, 28.5, 5.5, 4.2)).or(E(28, 23.5, 3.2, 3));
    P.fill(head, f, { pat: (x, y) => cream.has(x, y) ? c.cream : (y < 15 && (x === 27 || x === 28)) ? shade(f, -0.18) : null });
    eyes(P, 20, 18, 'big');
    P.dots([[27, 23], [28, 23]], '#e8738a');
    P.dots([[25, 25], [26, 26], [27, 25], [28, 25], [29, 26], [30, 25]], '#231817');
    P.dots([[27, 26], [28, 26], [27, 27], [28, 27]], '#ffffff');
    P.dots([[26, 27], [29, 27], [27, 28], [28, 28]], '#b9a59a');
    blush(P, 13, 25, 4);
    P.sym([[12, 23], [13, 22]], shade(c.cream, -0.12));
  }
}
function drawHeld(P, cid) {
  if (cid === 'otter') {
    const shell = E(28, 51, 5.5, 5.2).rows(0, 50).or(R(26, 50, 4, 2));
    P.fill(shell, '#f6b4a6', { pat: (x, y) => (y < 50 && [24, 26, 28, 30, 32].some(r => Math.abs((x + 0.5 - 28) - (r - 28) * (51 - y - 0.5) / 5) < 0.5)) ? '#df8f80' : null });
    P.fill(E(22.5, 49.5, 2, 2).or(E(33.5, 49.5, 2, 2)), CHARS.otter.fur, { hl: false });
  }
}

/* ----- 모자 ----- */
const HAT = {
  ribbon(P, c, a) { P.fill(PG([[36, 9], [30, 4], [29, 14]]).or(PG([[37, 9], [43, 4], [44, 14]])), c); P.fill(R(35, 7, 3, 4), a, { hl: false }); P.fill(LN(35, 11, 33, 16, 2).or(LN(37, 11, 39, 16, 2)), a, { hl: false }); },
  beanie(P, c, a) {
    P.fill(E(28, 3.5, 3.2, 3.2), a);
    P.fill(E(28, 13.5, 14.5, 10.5).rows(0, 13), c, { pat: x => x % 3 === 0 ? shade(c, -0.12) : null });
    P.fill(RR(13, 10, 30, 6, 2), shade(c, -0.1), { pat: x => x % 2 ? shade(c, -0.3) : null });
  },
  bucket(P, c) { P.fill(PG([[18, 13], [20, 3], [36, 3], [38, 13]]), c, { pat: (x, y) => y === 9 || y === 10 ? shade(c, -0.25) : null }); P.fill(E(28, 13.5, 17.5, 3), shade(c, -0.12)); },
  cap(P, c, a) {
    P.fill(E(27.5, 3.5, 1.6, 1.6), a);
    P.fill(E(27.5, 12.5, 13.5, 9.5).rows(0, 12), c, { pat: (x, y) => x === 27 ? shade(c, -0.18) : (y >= 7 && y <= 8 && x >= 23 && x <= 31) ? '#f4f4f0' : null });
    P.fill(PG([[34, 9], [49, 10], [49, 14], [34, 14]]), shade(c, -0.15));
  },
  sailor(P, c, a) {
    P.fill(LN(38, 11, 43, 18, 2).or(LN(40, 11, 46, 16, 2)), a, { hl: false });
    P.fill(E(28, 9.5, 11.5, 6.5).rows(0, 11), c);
    P.fill(R(17, 9, 22, 3), a, { hl: false });
    P.fill(E(28, 12.8, 14.5, 2.3), c);
    P.dots([[27, 6], [28, 6], [27, 7], [28, 7]], a);
  },
  straw(P, c, a) {
    P.fill(E(28, 13, 22, 3.6), c, { pat: (x, y) => (x + y * 2) % 4 === 0 ? shade(c, -0.15) : null });
    P.fill(E(28, 9.5, 10.5, 7).rows(0, 12), c, { pat: (x, y) => (x + y * 2) % 4 === 0 ? shade(c, -0.15) : null });
    P.fill(R(18, 9, 20, 3), a, { hl: false });
  },
  muff(P, c, a) {
    P.fill(E(28, 20, 17.5, 15).sub(E(28, 20, 15, 12.5)).rows(0, 19), a);
    for (const x of [10.5, 45.5]) P.fill(E(x, 22, 5, 5), c, { pat: (px, py) => ((px * 3 + py * 5) % 7 === 0) ? '#ffffff' : null });
  },
  beret(P, c) { P.fill(R(24, 2, 2, 3), shade(c, -0.2), { hl: false }); P.fill(E(26, 9, 14, 5, -0.12), c); },
  flower(P, c, a) {
    const pts = [];
    for (let i = 0; i < 7; i++) { const t = (-162 + i * 24) * Math.PI / 180; pts.push([28 + 15.5 * Math.cos(t), 20 + 13 * Math.sin(t)]); }
    for (let i = 0; i < pts.length - 1; i++) P.fill(LN(Math.round(pts[i][0]), Math.round(pts[i][1]) + 1, Math.round(pts[i + 1][0]), Math.round(pts[i + 1][1]) + 1, 1), '#6a9a5a', { outline: false, shade: false, hl: false });
    pts.forEach(([x, y], i) => {
      P.fill(E(x + 2.2, y + 1.6, 1.5, 1.1), '#86b86f', { outline: '#3e6a3a', hl: false, shade: false });
      P.fill(E(x, y, 2.6, 2.6), i % 2 ? a : c);
      P.set(Math.floor(x), Math.floor(y), '#fff6c8');
    });
  },
  witch(P, c, a) {
    P.fill(PG([[18, 12], [24, 5], [28, 1], [36, 0], [33, 4], [34, 12]]), c);
    P.fill(R(19, 7, 15, 3).and(PG([[18, 12], [24, 5], [28, 1], [36, 0], [33, 4], [34, 12]])), a, { hl: false });
    P.fill(R(25, 7, 4, 3), '#f2c14e', { hl: false });
    P.fill(E(28, 13, 21, 3), c);
  },
  tophat(P, c, a) {
    P.fill(R(20, 0, 16, 13), c, { pat: (x, y) => x === 22 && y > 1 && y < 7 ? '#6b6878' : null });
    P.fill(R(20, 8, 16, 3), a, { hl: false });
    P.fill(E(28, 12.6, 15, 2.4), c);
  },
  crown(P, c, a) {
    const m = PG(symPoly([[18, 14], [17, 4], [22.5, 8.5], [27.5, 1]]));
    P.fill(m, c, { pat: (x, y) => y === 11 ? shade(c, -0.22) : null });
    P.fill(E(28, 9.5, 2, 2), a, { hl: false });
    P.fill(E(21.5, 11, 1.4, 1.4).or(E(34.5, 11, 1.4, 1.4)), '#5b9bd5', { hl: false });
    P.dots([[17, 3], [27, 0], [28, 0], [38, 3]], '#fff6c8');
  }
};

/* ----- 상의 ----- */
function topPat(it) {
  const c = it.color, a = it.accent;
  switch (it.kind) {
    case 'tee': return (x, y) => (y === 42 && x >= 25 && x <= 30) || (y === 41 && x >= 26 && x <= 29) ? '#ffffff' : null;
    case 'stripe': return (x, y) => y % 3 === 0 ? a : null;
    case 'jersey': return x => (x < 19 || x > 36) ? a : null;
    case 'plaid': return (x, y) => (x % 5 === 0 && y % 5 === 0) ? shade(c, -0.45) : (x % 5 === 0 || y % 5 === 0) ? shade(c, -0.22) : null;
    case 'hawaii': { const fl = [[19, 38], [24, 45], [33, 39], [37, 45], [29, 47], [21, 47]]; return (x, y) => fl.some(([fx, fy]) => (x === fx && Math.abs(y - fy) <= 1) || (y === fy && Math.abs(x - fx) <= 1)) ? (fl.some(([fx, fy]) => fx === x && fy === y) ? '#e05a5a' : a) : null; }
    case 'knit': return (x, y) => { if (y >= 47) return x % 2 ? shade(c, -0.15) : null; for (const col of [19, 26, 33]) if (x === col + [0, 1, 2, 1][y % 4]) return a; return null; };
    case 'vest': return (x, y) => y % 3 === 0 ? shade(c, -0.18) : null;
    case 'pumpkin': return x => [20, 24, 31, 35].includes(x) ? shade(c, -0.16) : null;
    case 'cape': return () => shade(c, 0.35);
    default: return null;
  }
}
function drawTopBehind(P, it) {
  if (it.kind === 'hoodie') P.fill(E(28, 34, 16.5, 4.5), shade(it.color, -0.08));
  if (it.kind === 'cape') P.fill(E(28, 35, 13, 3), shade(it.color, -0.15));
}
function drawTopFill(P, it) {
  P.fill(TORSO(), it.color, { pat: topPat(it), hl: it.kind !== 'tux' });
}
function drawTopDetail(P, it) {
  const c = it.color, a = it.accent;
  switch (it.kind) {
    case 'hoodie':
      P.fill(PG([[21, 43], [35, 43], [33, 49], [23, 49]]), shade(c, -0.08));
      P.dots([[25, 35], [25, 36], [25, 37], [25, 38], [30, 35], [30, 36], [30, 37], [30, 38]], '#fff4cf');
      P.dots([[25, 39], [30, 39]], a); break;
    case 'jersey':
      P.dots([[26, 37], [27, 37], [28, 37], [29, 37], [29, 38], [28, 39], [28, 40], [27, 41], [27, 42]], '#ffffff');
      P.dots([[30, 38], [29, 39], [29, 40], [28, 41], [28, 42], [26, 38], [27, 38]], shade(c, -0.35)); break;
    case 'plaid': P.dots([[28, 37], [28, 40], [28, 43], [28, 46]], '#f6efe0'); P.fill(LN(27, 35, 27, 48, 1), shade(c, -0.5), { outline: false, shade: false, hl: false }); break;
    case 'hawaii': P.dots([[23, 35], [24, 36], [25, 37], [26, 38], [27, 39], [28, 39], [29, 38], [30, 37], [31, 36], [32, 35]], outlineOf(c)); break;
    case 'vest': P.fill(LN(27, 35, 27, 48, 1).or(LN(28, 35, 28, 48, 1)), '#d8d8d8', { outline: false, hl: false, shade: false }); P.dots([[27, 38], [28, 38], [27, 39], [28, 39]], '#9a9a9a'); break;
    case 'sailorTop': {
      const collar = PG(symPoly([[16, 35], [27.9, 47.5]])).sub(PG(symPoly([[21, 34], [27.9, 42]])));
      P.fill(collar, a, { pat: (x, y) => { const d = Math.abs(x + 0.5 - 28); return Math.abs(d - (45 - y) * 0.95) < 0.6 && y < 44 ? '#ffffff' : null; } });
      P.fill(PG(symPoly([[25, 43], [27.5, 49]])), '#e05a5a', { hl: false });
      P.fill(E(28, 43.5, 1.8, 1.6), '#e05a5a', { hl: false }); break;
    }
    case 'pumpkin':
      P.dots([[23, 38], [22, 39], [23, 39], [24, 39], [32, 38], [31, 39], [32, 39], [33, 39]], a);
      P.dots([[21, 43], [22, 44], [23, 43], [24, 44], [25, 43], [26, 44], [27, 43], [28, 43], [29, 44], [30, 43], [31, 44], [32, 43], [33, 44], [34, 43]], a); break;
    case 'tux':
      P.fill(PG(symPoly([[22.5, 33], [27.9, 47]])), '#fbfbf8', { hl: false });
      P.fill(PG([[23, 38], [27, 39.5], [23, 41]]).or(PG([[33, 38], [29, 39.5], [33, 41]])), a, { hl: false });
      P.dots([[27, 39], [28, 39], [27, 40], [28, 40]], shade(a, -0.3));
      P.dots([[27, 43], [28, 43], [27, 46], [28, 46]], INK); break;
    case 'knit': P.fill(R(15, 47, 26, 3).and(BODY()), shade(c, -0.08), { pat: x => x % 2 ? shade(c, -0.2) : null, hl: false }); break;
  }
}
function drawTopOver(P, it) {
  if (it.kind !== 'cape') return;
  const c = it.color, a = it.accent;
  const cape = PG([[19, 36], [13, 46], [9, 59], [20, 60], [28, 59], [36, 60], [47, 59], [43, 46], [37, 36]]);
  const stars = [[14, 53], [41, 51], [21, 57], [34, 56], [12, 48], [44, 56]];
  P.fill(cape, c, { pat: (x, y) => stars.some(([sx, sy]) => (x === sx && Math.abs(y - sy) <= 1) || (y === sy && Math.abs(x - sx) <= 1)) ? a : null });
  P.fill(E(28, 37.5, 2.2, 2.2), a);
}

/* ----- 하의 ----- */
function drawBottomFill(P, it) {
  const c = it.color, a = it.accent, d = shade(c, -0.22);
  const seam = (x, y) => (x === 27 && y >= 51) ? d : null;
  switch (it.kind) {
    case 'shorts': P.fill(SHORTS(), c, { pat: (x, y) => y === 49 && x % 2 ? shade(c, 0.4) : y === 52 ? shade(c, 0.18) : seam(x, y) }); break;
    case 'jogger': P.fill(LONGS(), c, { pat: (x, y) => (y >= 55 && y <= 56) ? shade(c, -0.2) : (y === 49 && (x === 26 || x === 29)) ? '#ffffff' : seam(x, y) }); break;
    case 'swim': P.fill(SHORTS(), c, { pat: (x, y) => x % 4 === 0 ? a : seam(x, y) }); break;
    case 'overall': P.fill(SHORTS(), c, { pat: seam }); break;
    case 'cargo': P.fill(SHORTS(), c, { pat: seam }); P.fill(R(16, 49, 5, 4).or(R(35, 49, 5, 4)), d, { hl: false }); break;
    case 'cord': P.fill(LONGS(), c, { pat: (x, y) => x % 2 ? d : seam(x, y) }); break;
    case 'slacks': P.fill(LONGS(), c, { pat: (x, y) => (x === 22 || x === 33) ? shade(c, 0.25) : seam(x, y), hl: false }); break;
    default: P.fill(SHORTS().rows(48, 50), c, { hl: false }); // 스커트 허리 아래
  }
}
function drawBottomFlare(P, it) {
  const c = it.color, a = it.accent;
  switch (it.kind) {
    case 'pleats': P.fill(PG(symPoly([[17, 47.5], [12.5, 56.5]])), c, { pat: (x, y) => y <= 48 ? shade(c, -0.25) : ([20, 24, 31, 35].includes(x + Math.round((x < 28 ? 1 : -1) * (y - 48) / 4))) ? shade(c, 0.3) : null }); break;
    case 'tartan': P.fill(PG(symPoly([[17, 47.5], [12.5, 56.5]])), c, { pat: (x, y) => (x % 5 === 2 || y % 4 === 1) ? a : (x % 5 === 4 && y % 2 === 0) ? '#f2c14e' : null }); P.fill(E(37, 52, 1.2, 1.2), '#f2c14e', { hl: false }); break;
    case 'tulle': {
      const m = PG(symPoly([[16, 47.5], [10.5, 55]]));
      for (let x = 11; x <= 44; x += 3) m.ell(x + 0.5, 55.3, 1.8, 1.6);
      P.fill(m, c, { pat: (x, y) => (y >= 49 && y <= 53 && Math.abs(x + 0.5 - 28) < 9 + (y - 49) * 1.2) ? a : ((x * 7 + y * 3) % 11 === 0 ? '#ffffff' : null) });
      break;
    }
    case 'bloomer': P.fill(E(28, 52, 15.5, 5.5), c, { pat: x => [17, 22, 27, 28, 33, 38].includes(x) ? a : null }); break;
    case 'lace': {
      const m = PG(symPoly([[17, 47.5], [13.5, 55]]));
      for (let x = 14; x <= 41; x += 3) m.ell(x + 0.5, 55.4, 1.7, 1.5);
      P.fill(m, c, { pat: (x, y) => (y === 51 && x % 2) ? a : (y >= 55 && (x % 3 === 1)) ? shade(c, -0.12) : null }); break;
    }
  }
}
function drawBottomDetail(P, it) {
  if (it.kind !== 'overall') return;
  const c = it.color, a = it.accent;
  P.fill(LN(22, 36, 22, 44, 2).or(LN(33, 36, 33, 44, 2)), c, { hl: false });
  P.fill(R(21, 41, 14, 8), c, { pat: (x, y) => (y >= 43 && y <= 45 && x >= 25 && x <= 30) ? shade(c, -0.18) : null });
  P.dots([[22, 42], [33, 42]], a);
}

/* ----- 신발 (한 발씩) ----- */
function drawShoe(P, it, fx) {
  const c = it.color, a = it.accent;
  const low = (top = 56) => E(fx, 59, 5.2, 3.2).rows(top, 63);
  const boot = top => new M().box(fx - 4.2, top, fx + 4.2, 61).or(E(fx, 59.3, 5.2, 2.8).rows(57, 63));
  const xi = Math.floor(fx);
  switch (it.kind) {
    case 'sneaker': P.fill(low(), c, { pat: (x, y) => y === 60 ? a : null }); P.dots([[xi - 1, 57], [xi + 1, 57]], shade(a, -0.3)); break;
    case 'sandal': P.fill(R(xi - 5, 60, 11, 2), c, { hl: false }); P.fill(LN(xi - 3, 59, xi + 2, 56, 1).or(LN(xi - 3, 56, xi + 2, 59, 1)), shade(c, -0.25), { outline: false, hl: false, shade: false }); break;
    case 'rain': P.fill(boot(52), c, { pat: (x, y) => y === 53 ? shade(c, -0.2) : y === 61 ? shade(c, -0.35) : null }); break;
    case 'fins': { const dir = fx < 28 ? -1 : 1; P.fill(E(fx + dir * 2.5, 60, 7, 2.6).or(low(57)), c, { pat: x => (x - xi) % 3 === 0 ? shade(c, -0.2) : null }); break; }
    case 'slipper': { const m = low(57); for (let k = -4; k <= 4; k += 2) m.ell(fx + k, 57, 1.5, 1.4); P.fill(m, c, { pat: (x, y) => y <= 57 ? a : null }); break; }
    case 'hightop': P.fill(boot(54), c, { pat: (x, y) => y === 60 ? a : null }); P.fill(E(fx + (fx < 28 ? -2 : 2), 57, 1.4, 1.4), a, { hl: false }); break;
    case 'hiking': P.fill(boot(53), c, { pat: (x, y) => y >= 60 ? '#3a3330' : (y === 55 || y === 57) && Math.abs(x + 0.5 - fx) < 2 ? a : null }); break;
    case 'mary': P.fill(low(57), c, { pat: (x, y) => y === 58 && Math.abs(x + 0.5 - fx) < 3 ? shade(c, -0.3) : null }); P.set(xi + (fx < 28 ? -2 : 2), 58, '#f2c14e'); break;
    case 'furboot': { const m = boot(53); for (let k = -4; k <= 4; k += 2) m.ell(fx + k, 53.5, 1.6, 1.6); P.fill(m, c, { pat: (x, y) => y <= 54 ? a : null }); break; }
    case 'loafer': P.fill(low(57), c); P.dots([[xi - 1, 58], [xi, 58], [xi + 1, 58]], a); break;
    case 'ballet': P.fill(low(57), c); P.fill(LN(xi - 2, 57, xi + 2, 52, 1).or(LN(xi + 2, 57, xi - 2, 53, 1)), a, { outline: false, shade: false, hl: false }); break;
    case 'gold': P.fill(low(57), c, { pat: (x, y) => ((x + y) % 5 === 0) ? a : null }); P.set(xi - 2, 57, '#ffffff'); break;
  }
}

/* ----- 가방 ----- */
function strap(P, col) { P.fill(LN(19, 36, 38, 51, 3), col, { hl: false, shade: false }); }
function drawBagBehind(P, it) {
  if (it.kind !== 'pack') return;
  P.fill(RR(12, 34, 32, 20, 6), it.color);
  P.fill(R(9, 43, 5, 8).or(R(42, 43, 5, 8)), shade(it.color, -0.15), { hl: false });
}
function drawBagFront(P, it) {
  const c = it.color, a = it.accent, d = shade(c, -0.22);
  switch (it.kind) {
    case 'shellbag': strap(P, d); P.fill(E(43, 55, 6, 5.5).rows(0, 54).or(R(41, 54, 4, 3)), c, { pat: (x, y) => (y < 54 && [39, 41, 43, 45, 47].some(r => Math.abs((x + 0.5 - 43) - (r - 43) * (55 - y - 0.5) / 5.5) < 0.5)) ? d : null }); break;
    case 'cross': strap(P, c); P.fill(RR(37, 49, 11, 8, 1.5), c); P.fill(R(37, 49, 11, 4), d, { hl: false }); P.dots([[42, 52], [43, 52]], a); break;
    case 'pack': for (const x of [20, 35]) { P.fill(PG([[x - 1.5, 35], [x + 1.5, 35], [x + (x < 28 ? 0.5 : 1.5), 50], [x - (x < 28 ? 1.5 : 0.5), 50]]), c, { hl: false }); P.dots([[x - 1, 45], [x, 45]], a); } break;
    case 'basket':
      P.fill(E(44, 52, 6, 6).sub(E(44, 52, 4, 4)).rows(0, 51), c, { hl: false });
      P.fill(PG([[37, 52], [51, 52], [49, 60], [39, 60]]), c, { pat: (x, y) => (x + y) % 3 === 0 ? d : null });
      P.fill(R(38, 51, 12, 3), a, { hl: false }); break;
    case 'star':
      P.fill(E(43.5, 52, 5, 5).sub(E(43.5, 52, 3.4, 3.4)).rows(0, 51), a, { hl: false });
      P.fill(PG([[38, 52], [49, 52], [48, 59], [39, 59]]), c);
      P.dots([[43, 54], [42, 55], [43, 55], [44, 55], [43, 56], [41, 55], [45, 55]], a); P.dots([[40, 53]], '#ffffff'); break;
  }
}

/* ---------- 캐릭터 전체 ---------- */
function armStyle(cid, i) { const [cx, cy, , ry, ang] = armsOf(cid)[i]; return `transform-origin:${(cx - Math.sin(ang) * ry * 0.7).toFixed(1)}px ${(cy - ry * 0.75).toFixed(1)}px`; }
function paintChar(cid, outfit = {}) {
  const P = new Painter();
  const hat = outfit.hat && ITEM[outfit.hat], top = outfit.top && ITEM[outfit.top], bot = outfit.bottom && ITEM[outfit.bottom];
  const sh = outfit.shoes && ITEM[outfit.shoes], bag = outfit.bag && ITEM[outfit.bag];
  P.group('tail'); drawTail(P, cid);
  P.group(); if (bag) drawBagBehind(P, bag); if (top) drawTopBehind(P, top);
  drawFeet(P, cid);
  drawBody(P, cid);
  if (bot) drawBottomFill(P, bot);
  if (top) { drawTopFill(P, top); drawTopDetail(P, top); }
  if (bot) drawBottomDetail(P, bot);
  if (sh) for (const fx of FEET_X) drawShoe(P, sh, fx);
  if (bot) drawBottomFlare(P, bot);
  P.group('arm armL', armStyle(cid, 0)); drawArm(P, cid, 0, top);
  P.group('arm armR', armStyle(cid, 1)); drawArm(P, cid, 1, top);
  P.group(); if (top) drawTopOver(P, top);
  P.group('held'); drawHeld(P, cid);
  P.group(); if (bag) drawBagFront(P, bag);
  P.group('head'); drawHead(P, cid);
  if (hat) HAT[hat.kind](P, hat.color, hat.accent);
  return P;
}
function renderChar(cid, outfit = {}, opts = {}) {
  const P = paintChar(cid, outfit);
  const size = opts.size ? ` width="${opts.size[0]}" height="${opts.size[1]}"` : '';
  return `<svg class="chr chr-${cid}" viewBox="0 0 ${GW} ${GH}"${size} xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" role="img" aria-label="${CHARS[cid].name}">`
    + `<path class="shadow" fill="${INK}" fill-opacity=".14" d="M18 62h20v1h-20zM21 63h14v1h-14z"/>`
    + `<g class="bob">${P.svg()}</g></svg>`;
}

/* 옷장 미리보기 : 흐린 마네킹 위에 아이템만 */
const THUMB_VIEW = { hat: '4 -1 48 26', top: '6 30 44 33', bottom: '7 45 42 18', shoes: '13 50 30 14', bag: '6 33 48 29' };
function renderThumb(it) {
  const P = new Painter(), ghost = '#ece2d4';
  P.group();
  const g = { outline: false, shade: false, hl: false };
  if (it.slot === 'hat') P.fill(E(28, 21, 15.5, 13), ghost, g);
  else if (it.slot === 'shoes') { for (const fx of FEET_X) P.fill(E(fx, 58.5, 4.5, 3), ghost, g); }
  else {
    if (it.slot === 'bag') drawBagBehind(P, it);
    if (it.slot === 'top') drawTopBehind(P, it);
    P.fill(BODY(), ghost, g);
    for (const a of ARMS.def) if (it.slot === 'top') P.fill(E(...a), ghost, g);
  }
  if (it.slot === 'hat') HAT[it.kind](P, it.color, it.accent);
  if (it.slot === 'top') {
    drawTopFill(P, it); drawTopDetail(P, it);
    if (it.sleeve !== 'none') for (const [cx, cy, rx, ry, ang] of ARMS.def) {
      const m = E(cx, cy, rx, ry, ang).rows(0, Math.floor(it.sleeve === 'long' ? cy + ry - 2.5 : cy - 0.5));
      P.fill(m, it.color, { hl: false, pat: it.kind === 'stripe' ? (x, y) => y % 3 === 0 ? it.accent : null : it.kind === 'jersey' ? () => it.accent : null });
    }
    drawTopOver(P, it);
  }
  if (it.slot === 'bottom') { drawBottomFill(P, it); drawBottomFlare(P, it); drawBottomDetail(P, it); }
  if (it.slot === 'shoes') for (const fx of FEET_X) drawShoe(P, it, fx);
  if (it.slot === 'bag') drawBagFront(P, it);
  return `<svg viewBox="${THUMB_VIEW[it.slot]}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-hidden="true">${P.svg()}</svg>`;
}
