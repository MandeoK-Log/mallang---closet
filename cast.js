/* ===== 패션쇼 출연진 : 강원도 경쟁자 9명 + 심사위원 4명 =====
   경쟁자는 기존 캐릭터와 같은 몸(56×64 도트)에 머리만 새로 그려요.
   tier 는 그 경쟁자의 평소 실력(심사위원 4명 점수 합계 기준, 40점 만점)이에요. */
const RIVALS = {
  goat: {
    name: '산들', species: '산양', home: '대관령', fur: '#a7a39b', cream: '#d9d5cc', tier: 27.6,
    intro: '대관령 바람을 맞고 자란 우승 후보', outfit: { hat: 'h_tophat', top: 't_tux', bottom: 'b_slacks', shoes: 's_loafer', bag: 'g_cross' }
  },
  tanuki: {
    name: '너굴', species: '너구리', home: '춘천', fur: '#9a8b7a', cream: '#efe6d8', tier: 26.2,
    intro: '춘천 호숫가의 멋쟁이 너구리', outfit: { hat: 'h_beret', top: 't_cape', bottom: 'b_tulle', shoes: 's_ballet' }
  },
  duck: {
    name: '꽥순', species: '오리', home: '속초', fur: '#fbfbf6', cream: '#ffffff', feet: '#f39a3c', tier: 24.9,
    intro: '속초 바다 출신 마린룩 장인', outfit: { hat: 'h_sailor', top: 't_sailor', bottom: 'b_pleats', shoes: 's_mary', bag: 'g_shell' }
  },
  sheep: {
    name: '몽실', species: '양', home: '평창', fur: '#f3ead8', cream: '#fffaf0', tier: 23.6,
    intro: '평창 목장의 포근포근 니트 요정', outfit: { hat: 'h_muff', top: 't_knit', bottom: 'b_tartan', shoes: 's_furboot' }
  },
  bear: {
    name: '반달', species: '반달가슴곰', home: '인제', fur: '#3d3739', cream: '#c9a98a', chest: '#f4efe9', tier: 22.2,
    intro: '인제 산골에서 내려온 아웃도어 마니아', outfit: { hat: 'h_bucket', top: 't_plaid', bottom: 'b_overall', shoes: 's_hiking', bag: 'g_basket' }
  },
  squirrel: {
    name: '도토리', species: '다람쥐', home: '홍천', fur: '#c98a4b', cream: '#f3dcbc', belly: true, tier: 20.8,
    intro: '홍천 숲속의 여름 휴가 패션', outfit: { hat: 'h_flower', top: 't_hawaii', bottom: 'b_cargo', shoes: 's_sandal' }
  },
  gorani: {
    name: '고랑이', species: '고라니', home: '정선', fur: '#b98a5a', cream: '#efd9b8', belly: true, tier: 19.3,
    intro: '정선 밭두렁을 뛰어다니는 개구쟁이', outfit: { hat: 'h_straw', top: 't_stripe', bottom: 'b_denim', shoes: 's_rain' }
  },
  hedgehog: {
    name: '밤송이', species: '고슴도치', home: '횡성', fur: '#e7cfae', cream: '#f6e6cf', tier: 17.8,
    intro: '횡성에서 온 수줍은 할로윈 덕후', outfit: { hat: 'h_witch', top: 't_pumpkin', bottom: 'b_bloomer', shoes: 's_slipper' }
  },
  piglet: {
    name: '감자', species: '아기돼지', home: '강릉', fur: '#f6b3b8', cream: '#fbd3d6', belly: true, tier: 16.2,
    intro: '강릉 감자밭의 편한 옷 대장', outfit: { hat: 'h_beanie', top: 't_hoodie', bottom: 'b_jogger', shoes: 's_sneaker' }
  }
};
const RIVAL_IDS = Object.keys(RIVALS);
// 기존 그리기 코드(renderChar)가 그대로 쓸 수 있게 CHARS 에도 등록해요 (캐릭터 선택 목록에는 안 나와요)
for (const id of RIVAL_IDS) CHARS['rv_' + id] = Object.assign({ id: 'rv_' + id }, RIVALS[id]);

const sideEach = (pts, fn) => [1, -1].forEach(s => fn(pts.map(([x, y]) => (s > 0 ? [x, y] : [56 - x, y])), s));
const HEAD_BOX = () => E(28, 21, 14.3, 11.8);

EXTRA.head.rv_gorani = (P, c) => {
  for (const s of [1, -1]) { const ex = s > 0 ? 12 : 44; P.fill(E(ex, 13, 4.2, 6.6, -0.7 * s), c.fur); P.patch(E(ex, 13.5, 2, 4.2, -0.7 * s), '#e6b28f'); }
  P.fill(E(28, 21, 14, 12.5), c.fur, { pat: (x, y) => (y < 13 && (x === 27 || x === 28)) ? shade(c.fur, -0.15) : null });
  P.patch(E(28, 27, 7.5, 5.2).and(HEAD_BOX()), c.cream);
  eyes(P, 19, 17, 'big');
  P.dots([[27, 24], [28, 24], [27, 25], [28, 25]], '#2a1d1a');
  P.dots([[26, 28], [27, 29], [28, 29], [29, 28]], INK);
  P.dots([[24, 29], [24, 30], [31, 29], [31, 30]], '#ffffff'); P.dots([[23, 29], [23, 30], [32, 29], [32, 30], [24, 31], [31, 31]], '#9b7a60');
  blush(P, 14, 24);
};
EXTRA.head.rv_tanuki = (P, c) => {
  sideEach([[13, 14], [13, 5], [17, 4], [22, 10]], pts => P.fill(PG(pts), '#5c4f45'));
  P.fill(E(28, 21, 15, 12.5), c.fur);
  P.patch(E(20, 20, 5.6, 3.8, 0.35).or(E(36, 20, 5.6, 3.8, -0.35)).and(HEAD_BOX()), '#4a3f38');
  P.patch(E(28, 27, 8.5, 5).and(HEAD_BOX()), c.cream);
  P.sym([[17, 14], [18, 13], [19, 13], [20, 13]], c.cream);
  eyes(P, 19, 19, 'dot'); P.sym([[18, 18]], '#8d8178');
  P.dots([[26, 24], [27, 24], [28, 24], [29, 24], [27, 25], [28, 25]], '#1d1513');
  P.dots([[26, 28], [27, 29], [28, 29], [29, 28]], INK);
  blush(P, 14, 25);
};
EXTRA.head.rv_hedgehog = (P, c) => {
  const pts = [];
  for (let i = 0; i <= 24; i++) { const a = Math.PI * (0.92 + i / 24 * 1.16), r = i % 2 ? 13.5 : 18; pts.push([28 + Math.cos(a) * r * 1.05, 21 + Math.sin(a) * r * 0.92]); }
  pts.push([45, 30], [11, 30]);
  P.fill(PG(pts), '#7a5b44', { pat: (x, y) => ((x * 3 + y * 5) % 7 === 0 ? '#a17f63' : null) });
  P.fill(E(28, 23.5, 12, 9.5), c.cream);
  eyes(P, 21, 20, 'dot');
  P.fill(E(28, 27, 1.8, 1.4), '#1d1513', { hl: false, shade: false });
  P.dots([[26, 30], [27, 31], [28, 31], [29, 30]], INK);
  blush(P, 17, 26);
};
EXTRA.head.rv_duck = (P, c) => {
  P.fill(E(28, 9, 2.2, 2.8), c.fur);
  P.fill(E(28, 21, 14, 12.5), c.fur);
  eyes(P, 20, 17, 'dot');
  P.fill(RR(20, 22, 16, 8, 3), '#f39a3c', { pat: (x, y) => (y >= 27 ? '#e07f22' : null) });
  P.dots([[25, 24], [30, 24]], '#b0601a');
  blush(P, 14, 22);
};
EXTRA.head.rv_sheep = (P, c) => {
  let wool = E(28, 19, 14, 11);
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; wool.ell(28 + Math.cos(a) * 13, 19 + Math.sin(a) * 10, 3.6, 3.6); }
  P.fill(wool, c.fur, { pat: (x, y) => ((x * 5 + y * 7) % 9 === 0 ? '#ffffff' : (x * 3 + y) % 11 === 0 ? '#e3d8c2' : null) });
  sideEach([[0, 0]], (_, s) => P.fill(E(s > 0 ? 14 : 42, 24, 4.8, 2.4, 0.35 * s), '#5a4a44'));
  P.fill(E(28, 25, 8.5, 8), '#5a4a44');
  P.fill(E(28, 16, 9, 4.5), c.fur, { pat: (x, y) => ((x * 5 + y * 7) % 9 === 0 ? '#ffffff' : null) });
  P.dots([[23, 23], [24, 23], [23, 24], [24, 24], [31, 23], [32, 23], [31, 24], [32, 24]], '#ffffff');
  P.dots([[24, 24], [32, 24]], '#1d1513');
  P.dots([[27, 28], [28, 28], [27, 29], [28, 29]], '#3a2f2b'); P.dots([[26, 30], [29, 30]], '#8a7a72');
};
EXTRA.head.rv_piglet = (P, c) => {
  sideEach([[14, 14], [13, 4], [23, 10]], pts => { P.fill(PG(pts), c.fur); });
  P.fill(E(28, 21, 15, 12.5), c.fur);
  sideEach([[15, 12], [15, 7], [20, 10]], pts => P.patch(PG(pts), '#ea8f99'));
  eyes(P, 20, 18, 'dot');
  P.fill(E(28, 26, 5.4, 3.7), '#ef97a1');
  P.dots([[26, 26], [26, 27], [29, 26], [29, 27]], '#a8505c');
  P.dots([[26, 31], [27, 32], [28, 32], [29, 31]], INK);
  blush(P, 14, 24);
};
EXTRA.head.rv_bear = (P, c) => {
  for (const x of [15, 41]) { P.fill(E(x, 10, 4.2, 4.2), c.fur); P.patch(E(x, 10.3, 2, 2), '#6a6264'); }
  P.fill(E(28, 21, 15, 13), c.fur);
  P.fill(E(28, 27, 7.5, 5.3), c.cream, { hl: false });
  for (const x of [19, 35]) { P.dots([[x, 18], [x + 1, 18], [x, 19], [x + 1, 19], [x - 1, 18], [x + 2, 18], [x - 1, 19], [x + 2, 19], [x, 17], [x + 1, 17], [x, 20], [x + 1, 20]], '#8b8285'); P.dots([[x, 18], [x + 1, 18], [x, 19], [x + 1, 19]], '#0f0b0b'); P.set(x + 1, 18, '#ffffff'); }
  P.fill(E(28, 25, 2.4, 1.6), '#120c0b', { hl: false, shade: false });
  P.dots([[26, 29], [27, 30], [28, 30], [29, 29]], '#3a2c28');
  blush(P, 14, 24);
};
EXTRA.head.rv_goat = (P, c) => {
  sideEach([[0, 0]], (_, s) => { P.fill(LN(s > 0 ? 21 : 35, 11, s > 0 ? 17 : 39, 3, 2).or(LN(s > 0 ? 17 : 39, 3, s > 0 ? 15 : 41, 6, 2)), '#4e4740', { hl: false }); });
  sideEach([[0, 0]], (_, s) => P.fill(E(s > 0 ? 12 : 44, 19, 4.6, 2.2, 0.3 * s), c.fur));
  P.fill(E(28, 21, 13.5, 12.5), c.fur);
  P.fill(PG([[24, 31], [32, 31], [28, 40]]), '#ece8e0', { pat: (x, y) => (y > 34 && x % 2 ? '#d9d4ca' : null) });
  P.patch(E(28, 27, 6.5, 4.5).and(HEAD_BOX()), c.cream);
  eyes(P, 21, 18, 'dot'); P.sym([[20, 17], [21, 16]], '#5f5a52');
  P.dots([[27, 25], [28, 25], [27, 26], [28, 26]], '#3a3430');
  P.dots([[26, 29], [27, 30], [28, 30], [29, 29]], INK);
  blush(P, 15, 24);
};
EXTRA.head.rv_squirrel = (P, c) => {
  for (const s of [1, -1]) { const x = s > 0 ? 17 : 39; P.fill(E(x, 9.5, 3, 4, -0.3 * s), c.fur); P.dots([[x, 5], [x - s, 4]], '#6b4a2e'); }
  P.fill(E(28, 21, 14.5, 12.5), c.fur, { pat: (x, y) => (y < 16 && (x === 27 || x === 28) ? '#6b4a2e' : (y < 15 && (x === 24 || x === 31) ? '#f3dcbc' : null)) });
  P.patch(E(28, 27, 9, 5).and(HEAD_BOX()), c.cream);
  P.sym([[17, 22], [18, 22], [19, 23], [20, 23]], '#6b4a2e');
  eyes(P, 19, 17, 'big');
  P.dots([[27, 24], [28, 24]], '#d96b7a');
  P.dots([[26, 27], [27, 28], [28, 28], [29, 27]], INK);
  blush(P, 14, 25);
};
EXTRA.tail.rv_squirrel = (P, c) => {
  const t = PG([[36, 54], [44, 55], [51, 50], [54, 42], [53, 32], [49, 25], [44, 24], [42, 30], [46, 36], [46, 44], [40, 47]]);
  P.fill(t, c.fur, { pat: (x, y) => ((x + y) % 5 === 0 ? '#e0a669' : (y < 30 ? shade(c.fur, -0.12) : null)) });
};
EXTRA.tail.rv_duck = (P, c) => P.fill(PG([[38, 52], [46, 48], [44, 54]]), c.fur);

/* ----- 심사위원 : 상반신 초상화 (아래쪽은 심사석 책상에 가려져요) ----- */
const JUDGES = [
  {
    id: 'flamingo', name: '로제 플라맹', title: '패션 잡지 편집장', taste: '화려하고 귀여운 여름 옷',
    bias: (o, r, pr, tags) => Math.min(0.75, 0.25 * (tags.fancy + tags.summer + tags.cute)) - Math.min(0.5, 0.25 * tags.spooky)
  },
  {
    id: 'poodle', name: '마담 뿌뿌', title: '파리 디자이너', taste: '우아하고 격식 있는 옷',
    bias: (o, r, pr, tags) => Math.min(0.75, 0.25 * (tags.elegant + tags.fancy)) - Math.min(0.75, 0.25 * (tags.sporty + tags.casual))
  },
  {
    id: 'owl', name: '올리버 교수', title: '색채학 교수', taste: '색깔 조화가 뛰어난 옷',
    bias: (o, r) => Math.max(-0.9, Math.min(0.6, (r.harmony - 0.6) * 1.5))
  },
  {
    id: 'peacock', name: '피콕 경', title: '전설의 런웨이 모델', taste: '고급스럽고 가방까지 갖춘 옷',
    bias: (o, r, pr) => (pr - 0.35) * 1.5 + (o.bag ? 0.3 : 0)
  }
];
function paintJudge(id) {
  const P = new Painter(); P.group();
  if (id === 'flamingo') {
    const f = '#f49ab0';
    P.fill(E(28, 54, 17, 12), f, { pat: (x, y) => ((x + y * 2) % 6 === 0 ? '#f7b6c7' : null) });
    P.fill(LN(29, 46, 33, 34, 6).or(LN(33, 34, 30, 24, 6)), f);
    P.fill(E(29, 18, 9.5, 8.5), f);
    P.fill(R(21, 14, 7, 4).or(R(30, 14, 7, 4)), '#1b1416', { hl: false });
    P.fill(R(27, 15, 4, 1), '#1b1416', { outline: false, hl: false, shade: false });
    P.dots([[23, 15], [32, 15]], '#ffffff');
    P.fill(PG([[35, 19], [45, 21], [43, 27], [37, 24]]), '#f6efe6');
    P.fill(PG([[41, 22], [45, 21], [43, 27]]), '#2a2224', { hl: false });
    P.fill(E(29, 8.5, 2, 3), '#f7b6c7');
    blush(P, 22, 20, 2);
  } else if (id === 'poodle') {
    const w = '#fbf8f4', fl = (x, y) => ((x * 3 + y * 5) % 7 === 0 ? '#ebe4da' : null);
    P.fill(E(28, 50, 16, 15), w, { pat: fl });
    P.fill(E(12, 31, 6, 9).or(E(44, 31, 6, 9)), w, { pat: fl });
    P.fill(E(28, 24, 11.5, 10.5), w, { pat: fl });
    P.fill(E(28, 11, 8, 6.5), w, { pat: fl });
    P.fill(R(24, 15, 8, 3), '#f28fb0', { hl: false });
    P.fill(E(28, 29, 5.5, 3.8), '#f6efe7', { hl: false });
    eyes(P, 22, 22, 'dot');
    P.fill(E(28, 28, 1.9, 1.4), '#1d1513', { hl: false, shade: false });
    P.dots([[27, 31], [28, 31]], '#d77a90');
    blush(P, 17, 27);
    for (let i = 0; i < 9; i++) { const x = 18 + i * 2.5, y = 38 + Math.sin(i / 8 * Math.PI) * 4; P.fill(E(x, y, 1.4, 1.4), '#fdf6e8', { outline: '#b9ab98', hl: false, shade: false }); }
  } else if (id === 'owl') {
    const b = '#8a6446';
    sideEach([[13, 18], [14, 6], [21, 14]], pts => P.fill(PG(pts), shade(b, -0.1)));
    P.fill(E(28, 36, 17.5, 22), b, { pat: (x, y) => (y > 40 && (x + y) % 4 === 0 ? '#a98466' : null) });
    P.patch(E(28, 50, 9, 9).and(E(28, 36, 16.5, 21)), '#d8bf9d');
    P.fill(E(21, 26, 7, 7).or(E(35, 26, 7, 7)), '#f0dcc0', { hl: false });
    for (const x of [21, 35]) { P.patch(E(x, 26, 6, 6).sub(E(x, 26, 4.6, 4.6)), '#c9a23a'); P.fill(E(x, 26, 2.6, 2.6), '#120c0b', { outline: false, hl: false, shade: false }); P.set(x, 25, '#ffffff'); }
    P.patch(R(26, 25, 4, 1), '#c9a23a');
    P.fill(PG([[26, 31], [30, 31], [28, 35]]), '#e6a33a', { hl: false });
    P.fill(PG([[20, 44], [27, 47], [20, 50]]).or(PG([[36, 44], [29, 47], [36, 50]])), '#d8424d');
    P.fill(R(26, 45, 4, 4), '#b8323d', { hl: false });
  } else {
    const tealT = '#2f8f7f';
    const fan = E(28, 40, 27, 26).rows(0, 50);
    P.fill(fan, tealT, { pat: (x, y) => ((x * 7 + y * 3) % 13 === 0 ? '#3fae9a' : null) });
    for (let i = 0; i < 9; i++) { const a = Math.PI * (1.05 + i / 8 * 0.9), x = 28 + Math.cos(a) * 21, y = 40 + Math.sin(a) * 20; P.fill(E(x, y, 2.6, 2.6), '#e9c45b', { outline: '#2f5f6f', hl: false }); P.set(Math.round(x), Math.round(y), '#2f5fb5'); }
    P.fill(E(28, 55, 13, 11), '#2f6fb5', { pat: (x, y) => ((x + y) % 5 === 0 ? '#4a89cc' : null) });
    P.fill(LN(28, 47, 28, 30, 6), '#2f7fbf');
    P.fill(E(28, 22, 7.5, 7.5), '#2f7fbf');
    for (const [x2, y2] of [[23, 6], [28, 4], [33, 6]]) { P.fill(LN(28, 15, x2, y2, 1), '#2a4d6e', { outline: false, hl: false, shade: false }); P.fill(E(x2, y2, 1.6, 1.6), '#2fbf9f', { hl: false }); }
    P.dots([[23, 20], [24, 20], [23, 21], [24, 21], [22, 21]], '#ffffff'); P.dots([[24, 21]], '#120c0b');
    P.dots([[31, 21], [32, 21]], '#120c0b');
    P.fill(PG([[34, 22], [40, 24], [34, 26]]), '#d6c9a8', { hl: false });
    P.patch(E(32, 21, 3, 3).sub(E(32, 21, 2, 2)), '#e9c45b'); P.patch(LN(34, 23, 36, 30, 1), '#e9c45b');
  }
  return P;
}
function renderJudge(id, size) {
  const s = size ? ` width="${size[0]}" height="${size[1]}"` : '';
  return `<svg class="jdg" viewBox="0 0 ${GW} ${GH}"${s} xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-hidden="true">${paintJudge(id).svg()}</svg>`;
}
