/* ===== 픽셀 아이콘 =====
   글자 그림(아스키 아트)으로 아이콘을 그려요. 한 글자 = 한 칸.
   '.' 은 투명, '#' 은 진한 테두리 색, 나머지 글자는 팔레트에서 색을 찾아요. */
function pxArt(rows, pal = {}, cls = '') {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  let rects = '';
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.') { x++; continue; }
      let x2 = x + 1;
      while (x2 < row.length && row[x2] === ch) x2++;
      rects += `<rect x="${x}" y="${y}" width="${x2 - x}" height="1" fill="${pal[ch] || INK}"/>`;
      x = x2;
    }
  });
  return `<svg class="px ${cls}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}
const mirrorRows = rows => rows.map(r => r.split('').reverse().join(''));

const ART = {
  ticket: [
    '.##############.',
    '#hhhhh#hhhhhhhh#',
    '#yyyyyyyyyrryyy#',
    '#yyyyy#yyrrrryy#',
    '.#yyyyyyyrrrry#.',
    '.#yyyy#yyrrrry#.',
    '#yyyyyyyyyrryyy#',
    '#ddddd#dddddddd#',
    '.##############.'
  ],
  shell: [
    '...#######...',
    '.##PwpPppPp##',
    '#ppPwpPppPpp#',
    '#ppPppPppPpp#',
    '#ppPppPppPpp#',
    '.#pPppPppPp#.',
    '..#PppPppP#..',
    '...#dpPpd#...',
    '..#dd###dd#..',
    '..#########..'
  ],
  lock: [
    '..#####..',
    '.##...##.',
    '.#.....#.',
    '.#.....#.',
    '#########',
    '#hyyyyyy#',
    '#yyy#yyy#',
    '#yyy#yyy#',
    '#ddddddd#',
    '#########'
  ],
  soundOn: [
    '....##......',
    '...#.#...#..',
    '####.#.#..#.',
    '#....#..#.#.',
    '#....#..#.#.',
    '####.#.#..#.',
    '...#.#...#..',
    '....##......'
  ],
  soundOff: [
    '....##......',
    '...#.#......',
    '####.#.#...#',
    '#....#..#.#.',
    '#....#...#..',
    '####.#..#.#.',
    '...#.#.#...#',
    '....##......'
  ],
  heart: [
    '.##...##.',
    '#ww#.#rr#',
    '#wrr#rrr#',
    '#rrrrrrr#',
    '.#rrrrr#.',
    '..#rrr#..',
    '...#r#...',
    '....#....'
  ],
  spark: [
    '...#...',
    '..#y#..',
    '.#yhy#.',
    '#yhwhy#',
    '.#yhy#.',
    '..#y#..',
    '...#...'
  ],
  drop: [
    '..#..',
    '.#w#.',
    '#wbb#',
    '#bbb#',
    '#bbb#',
    '.###.'
  ],
  rain: [
    '.....####.......',
    '...##gggg##.....',
    '..#ggggggggg##..',
    '.#ggggggggggggg#',
    '#gggggggggggggg#',
    '#GGGGGGGGGGGGGG#',
    '.##############.',
    '................',
    '..b....b....b...',
    '.b....b....b....',
    'b....b....b.....'
  ],
  arrowL: [
    '.....##.',
    '....##..',
    '...##...',
    '..##....',
    '.##.....',
    '.##.....',
    '..##....',
    '...##...',
    '....##..',
    '.....##.'
  ],
  star: [
    '....#....',
    '...#y#...',
    '####y####',
    '#yyyhyyy#',
    '.#yyyyy#.',
    '..#yyy#..',
    '.#yy#yy#.',
    '#y#...#y#',
    '##.....##'
  ],
  disk: [
    '##########.',
    '#bwwwwwwb##',
    '#bwwwwwwbb#',
    '#bbbbbbbbb#',
    '#bbkkkkkbb#',
    '#bbk#kkkbb#',
    '#bbk#kkkbb#',
    '###########'
  ]
};
const PAL = {
  ticket: { y: '#ffd36e', h: '#fff1b8', d: '#e9a93a', r: '#ef7a62' },
  shell: { p: '#f6b7a8', P: '#de8b7c', w: '#ffe3dc', d: '#e9a091' },
  lock: { y: '#f2c14e', h: '#fff1b8', d: '#d49a2a' },
  heartOn: { r: '#f2667e', w: '#ffd0d8' },
  heartOff: { r: '#eadfd2', w: '#f6efe7' },
  spark: { y: '#ffd95e', h: '#fff2a8', w: '#ffffff' },
  drop: { w: '#ffffff', b: '#bfe6f5' },
  rain: { g: '#c9d1d8', G: '#a9b3bc', b: '#6fa7d6' },
  star: { y: '#ffd95e', h: '#fff7cf' },
  disk: { b: '#6fa7d6', w: '#f4f4f0', k: '#d7dde3' }
};
const TICKET = pxArt(ART.ticket, PAL.ticket, 'ic-ticket');
const SHELL = pxArt(ART.shell, PAL.shell, 'ic-shell');
const LOCK = pxArt(ART.lock, PAL.lock, 'ic-lock');
const ICON_ON = pxArt(ART.soundOn, {}, 'ic-sound');
const ICON_OFF = pxArt(ART.soundOff, {}, 'ic-sound');
const DISK = pxArt(ART.disk, PAL.disk, 'ic-disk');
const HEART_SVG = on => pxArt(ART.heart, on ? PAL.heartOn : PAL.heartOff, 'ic-heart');
const ARROW_L = pxArt(ART.arrowL, {}, 'ic-arrow');
const ARROW_R = pxArt(mirrorRows(ART.arrowL), {}, 'ic-arrow');
const FX = {
  heart: HEART_SVG(true),
  spark: pxArt(ART.spark, PAL.spark),
  cloud: pxArt(ART.rain, PAL.rain),
  drop: pxArt(ART.drop, PAL.drop),
  star: pxArt(ART.star, PAL.star)
};

/* 캔버스용: 같은 글자 그림을 캔버스 이미지로 바꿔요 (미니게임에서 써요) */
function artCanvas(rows, pal = {}) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x2 = c.getContext('2d');
  rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[x]; if (ch === '.') continue; x2.fillStyle = pal[ch] || INK; x2.fillRect(x, y, 1, 1); } });
  return c;
}
