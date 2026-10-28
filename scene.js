/* ===== 픽셀 배경 (타이틀 바닷가 · 옷장 무대) =====
   화면 4px 를 도트 1칸으로 잡고, 작은 캔버스에 그린 뒤 CSS 로 크게 늘려요. */
const SCENE_PX = 4;
const SCENES = [];
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const _rgb = {};
function rgbOf(hex) { return _rgb[hex] || (_rgb[hex] = hexRgb(hex).map(v => Math.round(v * 255))); }

/* 도트 버퍼 : ImageData 에 직접 칠해요 */
class Dots {
  constructor(w, h) { this.w = w; this.h = h; this.img = new ImageData(w, h); }
  put(x, y, hex) {
    x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const [r, g, b] = rgbOf(hex), i = (y * this.w + x) * 4, d = this.img.data;
    d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
  }
  /* 위에서 아래로 여러 색을 디더링으로 부드럽게 이어 칠해요 */
  bands(y0, y1, cols) {
    for (let y = y0; y < y1; y++) {
      const f = (y - y0) / Math.max(1, y1 - y0) * (cols.length - 1), i = Math.min(cols.length - 2, Math.floor(f)), k = f - i;
      for (let x = 0; x < this.w; x++) this.put(x, y, (BAYER[y & 3][x & 3] + 0.5) / 16 < k ? cols[i + 1] : cols[i]);
    }
  }
  /* inside(x,y) 가 참인 칸을 칠하고, 가장자리는 테두리 색으로 */
  blob(inside, fill, ink, box) {
    const [x0, y0, x1, y1] = box.map(Math.floor);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const cx = x + 0.5, cy = y + 0.5;
      if (!inside(cx, cy)) continue;
      const edge = ink && (!inside(cx - 1, cy) || !inside(cx + 1, cy) || !inside(cx, cy - 1) || !inside(cx, cy + 1));
      this.put(x, y, edge ? ink : (typeof fill === 'function' ? fill(x, y) : fill));
    }
  }
}
const inEll = (cx, cy, rx, ry) => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

/* 구름 한 덩이를 작은 캔버스로 */
function cloudSprite(w) {
  const h = Math.round(w * 0.42), D = new Dots(w + 2, h + 2);
  const parts = [[0.30, 0.66, 0.24, 0.32], [0.52, 0.42, 0.26, 0.40], [0.74, 0.62, 0.22, 0.30], [0.50, 0.74, 0.46, 0.22]];
  const ins = (x, y) => parts.some(([px, py, rx, ry]) => inEll(1 + px * w, 1 + py * h, rx * w, ry * h)(x, y));
  D.blob(ins, (x, y) => (y > h * 0.72 ? '#e3edf3' : (y < h * 0.4 && (x + y) % 3 === 0) ? '#ffffff' : '#fbfdff'), INK, [0, 0, w + 1, h + 1]);
  const c = document.createElement('canvas'); c.width = D.w; c.height = D.h; c.getContext('2d').putImageData(D.img, 0, 0); return c;
}

function pxScene(canvas, kind) {
  const sc = { canvas, kind, ctx: canvas.getContext('2d'), base: document.createElement('canvas'), W: 0, H: 0, clouds: [] };
  if ('ResizeObserver' in window) new ResizeObserver(() => sizeScene(sc)).observe(canvas);
  else window.addEventListener('resize', () => sizeScene(sc));
  SCENES.push(sc); sizeScene(sc);
  return sc;
}
function sizeScene(sc) {
  const r = sc.canvas.getBoundingClientRect(); if (!r.width || !r.height) return;
  const W = Math.ceil(r.width / SCENE_PX), H = Math.ceil(r.height / SCENE_PX);
  if (W === sc.W && H === sc.H) return;
  Object.assign(sc, { W, H, mobile: r.width <= 760 });
  sc.canvas.width = W; sc.canvas.height = H; sc.base.width = W; sc.base.height = H;
  sc.clouds = sc.kind === 'title'
    ? [{ s: cloudSprite(Math.round(W * 0.11) + 8), y: Math.round(H * 0.12), x: W * 0.15, v: 1.1 }, { s: cloudSprite(Math.round(W * 0.07) + 6), y: Math.round(H * 0.25), x: W * 0.62, v: 0.7 }, { s: cloudSprite(Math.round(W * 0.05) + 5), y: Math.round(H * 0.07), x: W * 0.45, v: 0.5 }]
    : [{ s: cloudSprite(Math.round(W * 0.16) + 6), y: Math.round(H * 0.08), x: W * 0.2, v: 0.6 }, { s: cloudSprite(Math.round(W * 0.1) + 5), y: Math.round(H * 0.18), x: W * 0.7, v: 0.4 }];
  paintBase(sc); drawScene(sc, performance.now() / 1000);
}
function seaTopOf(sc) { return Math.round(sc.H * (sc.kind === 'stage' ? 0.38 : sc.mobile ? 0.54 : 0.60)); }
function paintBase(sc) {
  const { W, H } = sc, D = new Dots(W, H), top = seaTopOf(sc);
  // 하늘
  D.bands(0, top, ['#a9dcee', '#c3e7f2', '#d9f0f5', '#ecf7f3', '#f8f6e6']);
  // 해
  if (sc.kind === 'title') {
    const r = sc.mobile ? 6 : 10, cx = W - Math.round(W * 0.09) - r, cy = Math.round(H * 0.06) + r;
    D.blob(inEll(cx, cy, r + 4, r + 4), (x, y) => (BAYER[y & 3][x & 3] < 6 ? '#fff3cf' : null) || (y < cy - r + 2 ? '#d9f0f5' : '#e6f4f1'), null, [cx - r - 5, cy - r - 5, cx + r + 5, cy + r + 5]);
    D.blob(inEll(cx, cy, r, r), (x, y) => (x + y < cx + cy - r * 0.6 ? '#fff3c4' : x + y > cx + cy + r * 0.7 ? '#f6cf6c' : '#ffe39a'), INK, [cx - r - 1, cy - r - 1, cx + r + 1, cy + r + 1]);
  }
  // 바다
  for (let x = 0; x < W; x++) D.put(x, top, INK);
  D.bands(top + 1, H, ['#9fd8e6', '#86c9da', '#70bad0', '#5eabc4']);
  if (sc.kind === 'title') {
    // 얼음 조각
    const iw = W * (sc.mobile ? 0.20 : 0.17), icx = W - W * 0.04 - iw, icy = H - H * 0.17 - Math.round(23 / SCENE_PX), iry = Math.max(4, Math.round(26 / SCENE_PX));
    D.blob(inEll(icx, icy + 2, iw * 0.96, iry), (x, y) => (BAYER[y & 3][x & 3] < 8 ? '#4f9db7' : '#5eabc4'), null, [icx - iw - 1, icy - iry, icx + iw + 1, icy + iry + 3]);
    D.blob(inEll(icx, icy, iw, iry), (x, y) => y < icy - iry * 0.2 ? ((x + y) % 7 === 0 ? '#ffffff' : '#f6fbff') : (y > icy + iry * 0.35 ? '#c4dff0' : '#e2f1fa'), INK, [icx - iw - 1, icy - iry - 1, icx + iw + 1, icy + iry + 1]);
    // 모래섬 + 거품
    const scx = W * 0.30, scy = H * 1.06, srx = W * 0.44, sry = H * 0.30;
    D.blob(inEll(scx, scy, srx + 2, sry + 2), (x, y) => (BAYER[y & 3][x & 3] < 7 ? '#ffffff' : '#c6ecf4'), null, [scx - srx - 3, scy - sry - 3, scx + srx + 3, H]);
    D.blob(inEll(scx, scy, srx, sry), (x, y) => ((x * 7 + y * 13) % 17 === 0 ? '#e5c995' : (x * 5 + y * 3) % 23 === 0 ? '#fff4dc' : y > H - 3 ? '#efd6a6' : '#f6e3bd'), INK, [scx - srx - 1, scy - sry - 1, scx + srx + 1, H]);
    // 분홍 조개 하나
    const sx = Math.round(W * 0.31), sy = Math.round(H * 0.88);
    D.blob(inEll(sx, sy, 2.6, 2), '#f6b7a8', INK, [sx - 4, sy - 3, sx + 4, sy + 3]);
  } else {
    // 옷장 무대 : 아래쪽은 모래밭
    const sandTop = Math.round(H * 0.56);
    for (let x = 0; x < W; x++) { const wav = Math.round(Math.sin(x / 5) * 1.2); D.put(x, sandTop + wav - 1, '#ffffff'); if (x % 2) D.put(x, sandTop + wav - 2, '#e8f7fb'); }
    for (let y = sandTop; y < H; y++) for (let x = 0; x < W; x++) {
      const wav = Math.round(Math.sin(x / 5) * 1.2);
      if (y < sandTop + wav) continue;
      D.put(x, y, y === sandTop + wav ? INK : (x * 7 + y * 13) % 19 === 0 ? '#e5c995' : (x * 5 + y * 3) % 29 === 0 ? '#fff4dc' : y > H * 0.82 ? '#f0d9ad' : '#f6e3bd');
    }
  }
  sc.base.getContext('2d').putImageData(D.img, 0, 0);
}
function drawScene(sc, t) {
  const { ctx: c, W, H } = sc; if (!W) return;
  c.imageSmoothingEnabled = false;
  c.drawImage(sc.base, 0, 0);
  for (const cl of sc.clouds) {
    const span = W + cl.s.width * 2, x = Math.round(((cl.x + t * cl.v) % span + span) % span - cl.s.width);
    c.drawImage(cl.s, x, cl.y);
  }
  // 물결 반짝이 : 줄마다 다른 속도로 흘러요
  const top = seaTopOf(sc), bottom = sc.kind === 'stage' ? Math.round(H * 0.56) - 3 : H;
  c.fillStyle = 'rgba(255,255,255,.85)';
  for (let y = top + 3, row = 0; y < bottom; y += 4 + row, row++) {
    const len = 3 + (row % 3), gap = 14 + row * 3, off = Math.round(t * (2 + row * 0.7) * (row % 2 ? -1 : 1));
    for (let x = ((off % gap) + gap) % gap - gap; x < W; x += gap) c.fillRect(x, y, len, 1);
  }
}
setInterval(() => { const t = performance.now() / 1000; for (const sc of SCENES) if (sc.canvas.offsetParent) drawScene(sc, t); }, 125);
