/* ===== 말랑 옷장 : 데이터 · 점수 · 그림 (DOM 없음) ===== */
const SLOTS = ['hat', 'top', 'bottom', 'shoes', 'bag'];
const SLOT_LABEL = { hat: '모자', top: '상의', bottom: '하의', shoes: '신발', bag: '가방' };
const TAG_LABEL = {
  ocean: '바다', cozy: '포근', nature: '자연', cute: '귀여움', sporty: '스포티', summer: '여름',
  winter: '겨울', elegant: '우아', fancy: '화려', casual: '캐주얼', spooky: '으스스'
};

/* ---------- 캐릭터 ---------- */
const CHARS = {
  otter: {
    id: 'otter', name: '몽돌', species: '해달', fur: '#a57f5d', cream: '#f2e3c9',
    intro: '조개 껍데기를 꼭 쥐고 다니는 다정한 해달',
    likes: ['ocean', 'cozy', 'nature', 'cute'], dislikes: ['spooky', 'fancy'],
    hue: 195, hueW: 48, sat: 0.5, light: 0.7, neutral: 0.55,
    w: [0.35, 0.45, 0.20], picky: 1.18, bias: 0,
    likeText: '바다색 · 포근한 옷 · 자연 느낌', dislikeText: '으스스한 옷 · 번쩍이는 옷',
    arm: { x: 106, y: 238, ang: -40 },
    voice: { pitch: 1.25, rate: 1.0, base: 560, wave: 'triangle' },
    lines: {
      love: ['わーい！だいすき！', '와~ 너무 좋아!'],
      like: ['いいね〜！', '좋은데~!'],
      meh: ['うーん、まあまあ…', '음, 그럭저럭…'],
      bad: ['やだ〜！', '싫어~!'],
      again: ['また同じ服〜？', '또 같은 옷이야~?']
    }
  },
  seal: {
    id: 'seal', name: '통통', species: '물범', fur: '#cdd5dc', cream: '#eef2f5',
    intro: '신나면 배를 짝짝 두드리는 장난꾸러기 물범',
    likes: ['sporty', 'summer', 'ocean', 'cute'], dislikes: ['elegant', 'winter'],
    hue: 28, hueW: 60, sat: 0.85, light: 0.6, neutral: 0.3,
    w: [0.30, 0.50, 0.20], picky: 1.03, bias: 2,
    likeText: '쨍한 색 · 운동복 · 여름 옷', dislikeText: '얌전한 옷 · 두꺼운 겨울옷',
    arm: { x: 90, y: 230, ang: 28 },
    voice: { pitch: 1.4, rate: 1.08, base: 700, wave: 'triangle' },
    lines: {
      love: ['やったー！パチパチ！', '야호! 짝짝짝!'],
      like: ['いいじゃん！', '괜찮은데!'],
      meh: ['ふつう〜', '보통이야~'],
      bad: ['いやだ！', '싫어!'],
      again: ['それ、さっきも着たよ！', '그거 아까도 입었잖아!']
    }
  },
  fox: {
    id: 'fox', name: '설이', species: '북극여우', fur: '#fbfbfd', cream: '#ffffff',
    intro: '눈보다 하얀 털이 자랑인 까다로운 북극여우',
    likes: ['elegant', 'winter', 'fancy'], dislikes: ['sporty', 'summer', 'casual'],
    hue: 228, hueW: 50, sat: 0.22, light: 0.8, neutral: 0.95,
    w: [0.45, 0.40, 0.15], picky: 1.16, bias: 0,
    likeText: '차분한 색 · 우아한 옷 · 겨울 옷', dislikeText: '운동복 · 여름 옷 · 너무 편한 옷',
    arm: { x: 90, y: 230, ang: 28 },
    voice: { pitch: 1.1, rate: 0.95, base: 620, wave: 'sine' },
    lines: {
      love: ['ふふ、最高ね！', '후후, 최고네!'],
      like: ['悪くないわ', '나쁘지 않네'],
      meh: ['うーん…微妙', '음… 애매해'],
      bad: ['これは嫌い！', '이건 싫어!'],
      again: ['同じ服はつまらないわ', '같은 옷은 지루해']
    }
  },
  wombat: {
    id: 'wombat', name: '네모', species: '웜벳', fur: '#8d6b50', cream: '#b9987b',
    intro: '기분 좋으면 네모난 똥을 퐁 싸는 느긋한 웜벳',
    likes: ['cozy', 'nature', 'casual'], dislikes: ['fancy', 'elegant'],
    hue: 32, hueW: 50, sat: 0.42, light: 0.5, neutral: 0.6,
    w: [0.30, 0.45, 0.25], picky: 1, bias: 4,
    likeText: '흙빛 · 편하고 포근한 옷', dislikeText: '화려한 옷 · 격식 있는 옷',
    arm: { x: 90, y: 230, ang: 28 },
    voice: { pitch: 0.85, rate: 0.88, base: 330, wave: 'sine' },
    lines: {
      love: ['しあわせ〜！', '행복해~!'],
      like: ['すき〜', '좋아~'],
      meh: ['まあいっか〜', '뭐 괜찮겠지~'],
      bad: ['うぅ…いやだ…', '으으… 싫어…'],
      again: ['これ、知ってる〜', '이거 아는 옷이야~']
    }
  }
};
CHARS.hamster = {
  id: 'hamster', name: '보리', species: '골든햄스터', fur: '#e7a14f', cream: '#fff1dc',
  intro: '볼주머니에 해바라기씨를 꽉 채우고 다니는 겁 많은 햄스터',
  likes: ['cute', 'fancy', 'cozy'], dislikes: ['spooky', 'sporty'],
  hue: 345, hueW: 55, sat: 0.6, light: 0.76, neutral: 0.5,
  w: [0.30, 0.50, 0.20], picky: 1.16, bias: 1,
  likeText: '달콤한 파스텔 · 귀엽고 반짝이는 옷', dislikeText: '무서운 옷 · 땀나는 운동복',
  voice: { pitch: 1.45, rate: 1.1, base: 840, wave: 'triangle' },
  lines: {
    love: ['きゃー！かわいい！', '꺄! 귀여워!'],
    like: ['えへへ、いいかも', '에헤헤, 괜찮을지도'],
    meh: ['うーん、ふつう', '음, 보통이야'],
    bad: ['こわいよ〜！', '무서워~!'],
    again: ['前にも着たよ〜', '전에도 입었어~']
  }
};
const CHAR_ORDER = ['otter', 'seal', 'fox', 'wombat', 'hamster'];

/* ---------- 아이템 (각 슬롯 앞의 2개만 처음부터 열림, 가방은 0개) ---------- */
const SLOT_PRICES = [0, 0, 30, 45, 65, 90, 120, 160, 210, 270, 340, 420];
const BAG_PRICES = [180, 280, 400, 550, 750];
const RAW = {
  hat: [
    ['h_ribbon', '리본 핀', 'ribbon', '#f4a3b8', '#e07a96', ['cute']],
    ['h_beanie', '방울 비니', 'beanie', '#e9b949', '#f6efe0', ['cozy', 'winter', 'casual']],
    ['h_bucket', '버킷햇', 'bucket', '#9cba8f', '#7d9c70', ['nature', 'casual', 'summer']],
    ['h_cap', '야구모자', 'cap', '#3d6fb6', '#f2f2f2', ['sporty', 'casual']],
    ['h_sailor', '세일러 모자', 'sailor', '#fbfbf8', '#2d4a7a', ['ocean', 'cute']],
    ['h_straw', '밀짚모자', 'straw', '#e8cf8a', '#e05a5a', ['summer', 'nature', 'ocean']],
    ['h_muff', '털 귀마개', 'muff', '#f1c4d6', '#d99ab5', ['winter', 'cozy', 'cute']],
    ['h_beret', '베레모', 'beret', '#8e3b46', '#6e2a34', ['elegant']],
    ['h_flower', '꽃 화관', 'flower', '#f6d04d', '#f08fa8', ['nature', 'cute', 'summer']],
    ['h_witch', '마녀 모자', 'witch', '#6b4fa0', '#f39a3c', ['spooky', 'fancy']],
    ['h_tophat', '실크햇', 'tophat', '#2d2a35', '#c94b6b', ['elegant', 'fancy']],
    ['h_crown', '왕관', 'crown', '#f2c14e', '#d9534f', ['fancy']]
  ],
  top: [
    ['t_tee', '하늘 티셔츠', 'tee', '#8ec5e8', '#6aa8d2', ['casual', 'summer'], 'short', 2],
    ['t_hoodie', '노랑 후드티', 'hoodie', '#f3cf55', '#d9ae2e', ['cozy', 'casual'], 'long', 3],
    ['t_stripe', '마린 줄무늬', 'stripe', '#fbfbf8', '#2d4a7a', ['ocean', 'casual'], 'long', 2],
    ['t_jersey', '축구 유니폼', 'jersey', '#3fae6b', '#ffffff', ['sporty', 'summer'], 'short', 2],
    ['t_plaid', '체크 셔츠', 'plaid', '#c8553d', '#5a2a22', ['casual', 'nature', 'cozy'], 'long', 2],
    ['t_hawaii', '하와이안 셔츠', 'hawaii', '#ff8a6b', '#fff2a8', ['summer', 'ocean', 'casual'], 'short', 2],
    ['t_knit', '꽈배기 니트', 'knit', '#efe3c8', '#cdb994', ['cozy', 'winter'], 'long', 3],
    ['t_vest', '패딩 조끼', 'vest', '#f28c38', '#c96a1f', ['winter', 'sporty'], 'none', 3],
    ['t_sailor', '세일러 블라우스', 'sailorTop', '#fbfbf8', '#2d4a7a', ['ocean', 'cute', 'elegant'], 'short', 2],
    ['t_pumpkin', '호박 니트', 'pumpkin', '#f08a24', '#3b2b28', ['spooky', 'cozy', 'cute'], 'long', 3],
    ['t_tux', '턱시도', 'tux', '#2b2a33', '#d9475b', ['elegant', 'fancy'], 'long', 2],
    ['t_cape', '별빛 망토', 'cape', '#b9a3e3', '#f2c14e', ['fancy', 'elegant'], 'none', 3]
  ],
  bottom: [
    ['b_denim', '청 반바지', 'shorts', '#5b86c5', '#3f679f', ['casual', 'summer'], 2],
    ['b_jogger', '조거 팬츠', 'jogger', '#9aa3ad', '#7b848e', ['sporty', 'casual', 'cozy'], 2],
    ['b_swim', '수영 반바지', 'swim', '#3cc2c2', '#ffffff', ['ocean', 'summer', 'sporty'], 2],
    ['b_overall', '멜빵 바지', 'overall', '#8a6a45', '#e9b949', ['cozy', 'nature', 'casual'], 2],
    ['b_cargo', '카고 반바지', 'cargo', '#a8a06a', '#857e4d', ['nature', 'casual', 'sporty'], 2],
    ['b_pleats', '주름 스커트', 'pleats', '#34497a', '#24365e', ['cute', 'elegant'], 3],
    ['b_cord', '코듀로이 바지', 'cord', '#9b6b43', '#7a5232', ['cozy', 'nature'], 2],
    ['b_tartan', '타탄 스커트', 'tartan', '#c94b4b', '#2f3d5c', ['cute', 'winter', 'elegant'], 3],
    ['b_tulle', '튤 스커트', 'tulle', '#f6b9cf', '#ffe0ea', ['cute', 'fancy'], 3],
    ['b_bloomer', '호박 바지', 'bloomer', '#7b55b0', '#f39a3c', ['spooky', 'cute'], 3],
    ['b_slacks', '슬랙스', 'slacks', '#2f2e3a', '#1f1e28', ['elegant'], 1],
    ['b_lace', '레이스 플레어', 'lace', '#f7f4ef', '#e2d6c6', ['elegant', 'summer', 'cute'], 3]
  ],
  shoes: [
    ['s_sneaker', '하얀 운동화', 'sneaker', '#f4f4f2', '#6aa8d2', ['casual', 'sporty']],
    ['s_sandal', '샌들', 'sandal', '#c99b6d', '#a87a4c', ['summer', 'casual']],
    ['s_rain', '노랑 장화', 'rain', '#f5cc3d', '#d9ab18', ['nature', 'cute', 'ocean']],
    ['s_fins', '오리발', 'fins', '#33b5b0', '#23908c', ['ocean', 'summer', 'sporty']],
    ['s_slipper', '털 슬리퍼', 'slipper', '#f3b5c7', '#ffffff', ['cozy', 'cute']],
    ['s_hightop', '하이탑', 'hightop', '#7d63c2', '#ffffff', ['sporty', 'casual']],
    ['s_hiking', '등산화', 'hiking', '#7a7f4b', '#c8553d', ['nature', 'sporty']],
    ['s_mary', '메리제인', 'mary', '#c8404a', '#8f2630', ['cute', 'elegant']],
    ['s_furboot', '털 부츠', 'furboot', '#d9bfa0', '#fbf6ee', ['winter', 'cozy']],
    ['s_loafer', '로퍼', 'loafer', '#6b4a32', '#e9b949', ['elegant']],
    ['s_ballet', '발레 슈즈', 'ballet', '#f7d3dc', '#e79bb0', ['elegant', 'cute']],
    ['s_gold', '반짝 구두', 'gold', '#e9c45b', '#fff6c8', ['fancy']]
  ],
  bag: [
    ['g_shell', '조개 파우치', 'shellbag', '#f6b7a8', '#e08f7c', ['ocean', 'cute']],
    ['g_cross', '미니 크로스백', 'cross', '#3e5c8a', '#e9b949', ['casual', 'elegant']],
    ['g_pack', '백팩', 'pack', '#e0614b', '#b8412e', ['sporty', 'casual']],
    ['g_basket', '피크닉 바구니', 'basket', '#c99a5b', '#e05a5a', ['nature', 'cozy']],
    ['g_star', '별빛 핸드백', 'star', '#b49be0', '#f2c14e', ['fancy', 'elegant']]
  ]
};
const ITEMS = [];
const ITEM = {};
for (const slot of SLOTS) {
  RAW[slot].forEach((r, i) => {
    const it = { id: r[0], name: r[1], kind: r[2], color: r[3], accent: r[4], tags: r[5], slot, idx: i };
    if (slot === 'top') { it.sleeve = r[6]; it.vol = r[7]; }
    if (slot === 'bottom') it.vol = r[6];
    it.price = slot === 'bag' ? BAG_PRICES[i] : SLOT_PRICES[i];
    ITEMS.push(it); ITEM[it.id] = it;
  });
}
const STARTER_IDS = ITEMS.filter(i => i.slot !== 'bag' && i.idx < 2).map(i => i.id);

/* ---------- 색 계산 ---------- */
function hexRgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255); }
function toLab(hex) {
  const lin = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const [r, g, b] = hexRgb(hex).map(lin);
  const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  const fx = f(X), fy = f(Y), fz = f(Z);
  const L = 116 * fy - 16, A = 500 * (fx - fy), B = 200 * (fy - fz);
  let h = Math.atan2(B, A) * 180 / Math.PI; if (h < 0) h += 360;
  return { L, A, B, C: Math.hypot(A, B), h };
}
function toHsl(hex) {
  const [r, g, b] = hexRgb(hex); const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) {
    const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60;
  }
  return { h, s, l };
}
const DEG = Math.PI / 180;
function pairDiff(c1, c2, k) {
  let dh = Math.abs(c1.h - c2.h); if (dh > 180) dh = 360 - dh;
  const dH = 2 * Math.sqrt(c1.C * c2.C) * Math.sin(dh * DEG / 2);
  return Math.sqrt(dH * dH + Math.pow((c1.C - c2.C) / k, 2));
}
/* Ou & Luo 2색 조화 모델 — 붙어 있는 색 쌍 */
function harmonyAdjacent(hex1, hex2) {
  const c1 = toLab(hex1), c2 = toLab(hex2);
  const HC = 0.04 + 0.53 * Math.tanh(0.8 - 0.045 * pairDiff(c1, c2, 1.46));
  const HLsum = 0.3 + 0.5 * Math.tanh(-4 + 0.029 * (c1.L + c2.L));
  const HdL = 0.14 + 0.15 * Math.tanh(-2 + 0.2 * Math.abs(c1.L - c2.L));
  const hsy = c => {
    const EC = 0.5 + 0.5 * Math.tanh(-2 + 0.5 * c.C);
    const HS = -0.08 - 0.14 * Math.sin((c.h + 50) * DEG) - 0.07 * Math.sin((2 * c.h + 90) * DEG);
    const t = (90 - c.h) / 10;
    const EY = ((0.22 * c.L - 12.8) / 10) * Math.exp(t - Math.exp(t));
    return EC * (HS + EY);
  };
  return HC + HLsum + HdL + hsy(c1) + hsy(c2);
}
/* 떨어져 있는 색 쌍 */
function harmonyApart(hex1, hex2) {
  const c1 = toLab(hex1), c2 = toLab(hex2);
  return 0.2 + 0.65 * Math.tanh(1.7 - 0.045 * pairDiff(c1, c2, 1.30));
}
const ADJ = new Set(['fur|hat', 'fur|top', 'fur|bottom', 'fur|shoes', 'top|bottom', 'bottom|shoes', 'top|bag', 'bottom|bag', 'hat|top']);

/* ---------- 점수 ---------- */
const clamp01 = v => Math.max(0, Math.min(1, v));
function itemTaste(c, it) {
  const { h, s, l } = toHsl(it.color);
  let dh = Math.abs(h - c.hue); if (dh > 180) dh = 360 - dh;
  const hueAff = s < 0.14 ? c.neutral : Math.exp(-Math.pow(dh / c.hueW, 2));
  const satAff = 1 - Math.abs(s - c.sat);
  const lightAff = 1 - Math.abs(l - c.light) * 1.4;
  let v = 0.45 * hueAff + 0.25 * satAff + 0.30 * lightAff;
  for (const t of it.tags) {
    if (c.likes.includes(t)) v += 0.14;
    if (c.dislikes.includes(t)) v -= 0.26;
  }
  return clamp01(v);
}
function scoreOutfit(cid, outfit) {
  const c = CHARS[cid];
  const worn = SLOTS.filter(s => outfit[s]).map(s => ITEM[outfit[s]]);
  const main = worn.filter(i => i.slot !== 'bag');
  // 1) 색 조화 — Ou & Luo 모델, 모든 색 쌍 평균
  const parts = [['fur', c.fur], ...worn.map(i => [i.slot, i.color])];
  let sum = 0, n = 0;
  for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
    const key = [parts[i][0], parts[j][0]];
    const adj = ADJ.has(key.join('|')) || ADJ.has(key.reverse().join('|'));
    sum += adj ? harmonyAdjacent(parts[i][1], parts[j][1]) : harmonyApart(parts[i][1], parts[j][1]);
    n++;
  }
  const CH = n ? sum / n : 0;
  const harmony = n ? clamp01((CH - 0.05) / 0.85) : 0.25;
  // 2) 취향
  const taste = worn.length ? worn.reduce((a, i) => a + itemTaste(c, i), 0) / worn.length : 0.15;
  // 3) 코디 밸런스
  const complete = main.length / 4;
  const tc = {}; worn.forEach(i => i.tags.forEach(t => tc[t] = (tc[t] || 0) + 1));
  const coherence = worn.length ? Math.min(1, Math.max(0, ...Object.values(tc)) / Math.max(2, worn.length) * 1.15) : 0;
  let vol = 0.7;
  if (outfit.top && outfit.bottom) {
    const a = ITEM[outfit.top].vol, b = ITEM[outfit.bottom].vol;
    vol = (a === 3 && b === 3) ? 0.35 : (a + b >= 3 && a + b <= 5) ? 1 : 0.6;
  }
  const bagFit = outfit.bag ? (ITEM[outfit.bag].tags.some(t => tc[t] > 1) ? 0.08 : 0.03) : 0;
  const balance = clamp01(0.5 * complete + 0.3 * coherence + 0.2 * vol + bagFit);
  let total = 100 * (c.w[0] * harmony + c.w[1] * taste + c.w[2] * balance);
  total = total * c.picky * (0.55 + 0.45 * complete) + c.bias;
  total = Math.round(Math.max(0, Math.min(100, total)));
  return { total, harmony, taste, balance, CH };
}
function tierOf(score) { return score >= 85 ? 'love' : score >= 65 ? 'like' : score >= 45 ? 'meh' : 'bad'; }
function rewardFor(score, repeated) {
  let r = Math.round(score * 1.0) + (score >= 90 ? 20 : 0);
  if (repeated) r = Math.round(r * 0.3);
  return Math.max(3, r);
}
function outfitKey(cid, outfit) { return cid + ':' + SLOTS.map(s => outfit[s] || '-').join(','); }

