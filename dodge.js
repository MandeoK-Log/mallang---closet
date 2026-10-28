/* ===== 돌 피하기 미니게임 =====
   게임 계산은 360×540 좌표로 하고, 그림은 240×360 도트 캔버스에 그려서 크게 늘려 보여줘요. */
const MINI_STATS = {
  otter: { speed: 3, life: 4, px: 250, note: '조개를 꼭 쥐고 있어서 균형이 좋아요' },
  seal: { speed: 4, life: 3, px: 300, note: '배로 미끄러지듯 재빨라요' },
  fox: { speed: 5, life: 2, px: 350, note: '제일 빠르지만 몸이 약해요' },
  wombat: { speed: 2, life: 5, px: 205, note: '느리지만 엉덩이가 아주 튼튼해요' },
  hamster: { speed: 3, life: 3, px: 250, hit: 0.75, note: '몸이 작아서 돌에 덜 맞아요' }
};
const MW = 360, MH = 540, GROUND = MH - 24, PW = 84, PH = PW * 64 / 56;
const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const playedToday = cid => S.mini[cid] === dayKey();
function untilMidnight() {
  const n = new Date(), m = new Date(n); m.setHours(24, 0, 0, 0);
  const s = Math.ceil((m - n) / 1000), h = Math.floor(s / 3600), mm = Math.floor(s % 3600 / 60);
  return h ? `${h}시간 ${mm}분` : `${mm}분`;
}

const G = { on: false, over: false, keys: {}, padL: false, padR: false };
let miniFrom = 'title', raf = 0, cv = null, ctx = null;
const DW = 240, DH = 360, K = DW / MW, cx = v => Math.round(v * K);

function openMini(from) { miniFrom = from || run.screen; stopMini(); drawMiniPick(); show('mini'); }
function drawMiniPick() {
  stopMini();
  $('#mini-pick').hidden = false; $('#mini-play').hidden = true;
  $('#mini-cards').innerHTML = CHAR_ORDER.map(cid => {
    const c = CHARS[cid], st = MINI_STATS[cid], done = playedToday(cid);
    const pips = Array.from({ length: 5 }, (_, i) => `<i class="${i < st.speed ? 'on' : ''}"></i>`).join('');
    const hearts = Array.from({ length: 5 }, (_, i) => HEART_SVG(i < st.life)).join('');
    return `<button class="card mcard${done ? ' done' : ''}" type="button" data-c="${cid}" aria-disabled="${done}">
      <div class="pic">${renderChar(cid, outfits[cid] || {})}</div>
      <h3>${c.name}<small>${c.species}</small></h3>
      <div class="stat"><span>속도</span><span class="pips" aria-label="속도 ${st.speed}/5">${pips}</span></div>
      <div class="stat"><span>생명력</span><span class="hearts" aria-label="생명력 ${st.life}/5">${hearts}</span></div>
      <p class="intro">${st.note}</p>
      <div class="best">${done ? `오늘은 이미 했어요 · ${untilMidnight()} 뒤에 다시` : '오늘 할 수 있어요'}</div>
    </button>`;
  }).join('');
  document.querySelectorAll('#mini-cards .card').forEach(el => el.onclick = () => {
    const cid = el.dataset.c;
    if (playedToday(cid)) { sfx.no(); toast(`${CHARS[cid].name}는 오늘 이미 했어요. ${untilMidnight()} 뒤에 다시 할 수 있어요.`); return; }
    sfx.pop(); startMini(cid);
  });
}
function miniBack() {
  if (G.on && !G.over) { endMini(); return; }
  if (!$('#mini-play').hidden) { drawMiniPick(); return; }
  openGames();
}

/* ---------- 준비 : 도트 그림 만들기 ---------- */
const DODGE_ART = {
  heart: [
    '..###...###..',
    '.#wwr#.#rrr#.',
    '#wwrrr#rrrrr#',
    '#wrrrrrrrrrr#',
    '#rrrrrrrrrrr#',
    '.#rrrrrrrrR#.',
    '..#rrrrrrR#..',
    '...#rrrrR#...',
    '....#rrR#....',
    '.....#R#.....',
    '......#......'
  ],
  ticket: [
    '.##################.',
    '#hhhhhh#hhhhhhhhhhh#',
    '#yyyyyyyyyyyyyyyyyy#',
    '#yyyyyy#yyyyrrryyyy#',
    '.#yyyyyyyyyrrrrryy#.',
    '..#yyyyyyyyrrrrry#..',
    '..#yyyy#yyyrrrrry#..',
    '.#yyyyyyyyyyrrryyy#.',
    '#yyyyyy#yyyyyyyyyyy#',
    '#dddddddddddddddddd#',
    '.##################.'
  ]
};
const SPR = {};
function rockSprites() {
  const list = [];
  for (let i = 0; i < 6; i++) {
    const r = 7 + i * 1.4, ph = [Math.random() * 6, Math.random() * 6, Math.random() * 6], tone = i % 2 ? '#a9a49c' : '#968f86';
    const frames = [];
    for (let f = 0; f < 4; f++) {
      const rot = f * Math.PI / 2, size = Math.ceil(r * 2) + 3, c0 = size / 2;
      const ins = (x, y) => { const dx = x - c0, dy = y - c0, a = Math.atan2(dy, dx) + rot; const rr = r * (0.84 + 0.08 * Math.sin(a * 3 + ph[0]) + 0.06 * Math.sin(a * 5 + ph[1]) + 0.04 * Math.sin(a * 2 + ph[2])); return dx * dx + dy * dy <= rr * rr; };
      const D = new Dots(size, size);
      D.blob(ins, (x, y) => {
        const X = x + 0.5, Y = y + 0.5;
        if (!ins(X + 1.5, Y + 1.5) || !ins(X + 2, Y + 0.5)) return shade(tone, -0.22);
        if (!ins(X - 1.5, Y - 1.5)) return shade(tone, 0.35);
        return ((x * 7 + y * 5 + f) % 11 === 0) ? shade(tone, -0.12) : tone;
      }, INK, [0, 0, size - 1, size - 1]);
      const c = document.createElement('canvas'); c.width = size; c.height = size; c.getContext('2d').putImageData(D.img, 0, 0);
      frames.push(c);
    }
    list.push({ r, frames });
  }
  return list;
}
function makeSprites() {
  if (SPR.rocks) return;
  SPR.rocks = rockSprites();
  SPR.heart = artCanvas(DODGE_ART.heart, { r: '#f2667e', R: '#d84a64', w: '#ffd0d8' });
  SPR.ticket = artCanvas(DODGE_ART.ticket, { y: '#ffd36e', h: '#fff1b8', d: '#e9a93a', r: '#ef7a62' });
  SPR.clouds = [cloudSprite(34), cloudSprite(24), cloudSprite(18)];
  // 하늘과 모래 바닥은 한 번만 그려 두고 계속 써요
  const D = new Dots(DW, DH), gy = cx(GROUND);
  D.bands(0, gy, ['#a9dcee', '#c3e7f2', '#d9f0f5', '#ecf7f3', '#f8f2de']);
  for (let y = gy; y < DH; y++) for (let x = 0; x < DW; x++) D.put(x, y, y === gy ? INK : (x * 7 + y * 13) % 17 === 0 ? '#e5c995' : (x * 3 + y * 5) % 23 === 0 ? '#fff4dc' : '#f2dcae');
  SPR.bg = document.createElement('canvas'); SPR.bg.width = DW; SPR.bg.height = DH; SPR.bg.getContext('2d').putImageData(D.img, 0, 0);
}
function charImage(cid) {
  const svg = renderChar(cid, outfits[cid] || {}, { size: [GW, GH] }).replace('<svg ', '<svg preserveAspectRatio="none" ');
  const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); return img;
}
function setupCanvas() {
  cv = $('#mini-cv'); ctx = cv.getContext('2d');
  cv.width = DW; cv.height = DH; ctx.imageSmoothingEnabled = false;
  makeSprites();
}
function startMini(cid) {
  ac(); unlockSpeech();
  S.mini[cid] = dayKey(); save();
  const st = MINI_STATS[cid];
  Object.assign(G, {
    cid, on: true, over: false, paused: false, t: 0, count: 3, x: MW / 2, tilt: 0, dir: 0, target: null,
    life: st.life, maxLife: st.life, tix: 0, bonus: 0, nextBonus: 30,
    rocks: [], items: [], parts: [], spawnT: 0.4, tixT: 3 + Math.random() * 2, heartT: 13 + Math.random() * 5,
    inv: 0, shake: 0, img: charImage(cid), last: performance.now(), lastSec: -1, keys: {}, padL: false, padR: false
  });
  $('#mini-pick').hidden = true; $('#mini-play').hidden = false; $('#mini-over').hidden = true;
  $('#bar-title').textContent = `돌 피하기 · ${CHARS[cid].name}`;
  setupCanvas(); hud();
  cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  window.scrollTo(0, 0);
}
function stopMini() { G.on = false; cancelAnimationFrame(raf); }

/* ---------- 진행 ---------- */
function loop(now) {
  if (!G.on) return;
  const dt = Math.min(0.05, (now - G.last) / 1000); G.last = now;
  if (!G.paused) step(dt);
  draw();
  raf = requestAnimationFrame(loop);
}
function recomputeDir() {
  const k = G.keys;
  G.dir = ((k.ArrowRight || k.KeyD || G.padR) ? 1 : 0) - ((k.ArrowLeft || k.KeyA || G.padL) ? 1 : 0);
}
function movePlayer(dt) {
  const st = MINI_STATS[G.cid];
  let d = G.dir;
  const follow = d === 0 && G.target != null;
  if (follow) { const diff = G.target - G.x; d = Math.abs(diff) < 4 ? 0 : Math.sign(diff); }
  const nx = G.x + d * st.px * dt;
  G.x = follow && ((d > 0 && nx > G.target) || (d < 0 && nx < G.target)) ? G.target : nx;
  G.x = Math.max(PW * 0.38, Math.min(MW - PW * 0.38, G.x));
  G.tilt += (d * 0.16 - G.tilt) * Math.min(1, dt * 12);
}
function spawnRock(sp) {
  const sp_i = Math.floor(Math.random() * SPR.rocks.length), r = SPR.rocks[sp_i].r / K;
  G.rocks.push({ x: r + Math.random() * (MW - r * 2), y: -r - 4, r, vy: sp * (0.85 + Math.random() * 0.3), rot: Math.random() * 4, vr: (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 6), sp: sp_i });
}
function addText(x, y, text, color) { G.parts.push({ k: 'text', x, y, text, color, life: 1 }); }
function hitCircles() {
  const top = GROUND - PH * 0.968;
  const k = MINI_STATS[G.cid].hit || 1;
  return [{ x: G.x, y: top + PH * 0.69, r: PW * 0.21 * k }, { x: G.x, y: top + PH * 0.33, r: PW * 0.25 * k }];
}
function touches(x, y, r) { return hitCircles().some(c => Math.hypot(c.x - x, c.y - y) < c.r + r); }
function step(dt) {
  if (G.over) { G.parts.forEach(p => p.life -= dt); return; }
  if (G.count > 0) {
    const before = Math.ceil(G.count); G.count -= dt; movePlayer(dt);
    if (G.count <= 0) tone(988, 0, 0.25, 'triangle', 0.14); else if (Math.ceil(G.count) !== before) tone(660, 0, 0.12, 'triangle', 0.12);
    return;
  }
  G.t += dt; movePlayer(dt);
  const sp = Math.min(560, 170 + 9 * G.t);
  G.spawnT -= dt;
  if (G.spawnT <= 0) {
    spawnRock(sp);
    if (G.t > 20 && Math.random() < Math.min(0.55, (G.t - 20) / 70)) spawnRock(sp);
    G.spawnT = Math.max(0.2, 0.85 - 0.013 * G.t) * (0.7 + Math.random() * 0.6);
  }
  G.tixT -= dt;
  if (G.tixT <= 0) { G.items.push({ k: 'tix', x: 30 + Math.random() * (MW - 60), y: -20, vy: 115 + 3 * G.t, ph: Math.random() * 6 }); G.tixT = 5 + Math.random() * 4; }
  G.heartT -= dt;
  if (G.heartT <= 0) { G.items.push({ k: 'heart', x: 30 + Math.random() * (MW - 60), y: -20, vy: 125 + 3 * G.t, ph: Math.random() * 6 }); G.heartT = 14 + Math.random() * 7; }
  if (G.t >= G.nextBonus) { G.bonus++; G.tix++; G.nextBonus += 30; addText(MW / 2, MH * 0.35, '버티기 보너스 +1', '#d65e47'); sfx.buy(); }

  for (const r of G.rocks) {
    r.y += r.vy * dt; r.rot += r.vr * dt;
    if (!r.dead && G.inv <= 0 && touches(r.x, r.y, r.r * 0.85)) {
      r.dead = true; G.life--; G.inv = 1.3; G.shake = 0.3;
      noise(0, 0.12, 0.6); tone(150, 0, 0.2, 'square', 0.1, 80);
      addText(G.x, GROUND - PH - 6, '아야!', '#3b2b28');
      if (G.life <= 0) { endMini(); return; }
    }
    if (!r.dead && r.y > GROUND - r.r * 0.4) { r.dead = true; for (let i = 0; i < 4; i++) G.parts.push({ k: 'dust', x: r.x, y: GROUND, vx: (Math.random() - 0.5) * 80, vy: -40 - Math.random() * 60, life: 0.5 }); }
  }
  G.rocks = G.rocks.filter(r => !r.dead);
  for (const it of G.items) {
    it.y += it.vy * dt; it.x += Math.sin(G.t * 3 + it.ph) * 24 * dt;
    if (!it.dead && touches(it.x, it.y, 14)) {
      it.dead = true;
      if (it.k === 'tix') { G.tix++; addText(it.x, it.y, '티켓 +1', '#c98a12'); tone(1046, 0, 0.1, 'square', 0.07); tone(1319, 0.08, 0.16, 'square', 0.07); }
      else if (G.life < G.maxLife) { G.life++; addText(it.x, it.y, '생명 +1', '#e04a66'); tone(784, 0, 0.12, 'triangle', 0.12, 1175); }
      else { addText(it.x, it.y, '생명이 가득해요', '#7b6660'); tone(700, 0, 0.1, 'sine', 0.08); }
    }
    if (it.y > GROUND + 10) it.dead = true;
  }
  G.items = G.items.filter(i => !i.dead);
  for (const p of G.parts) {
    p.life -= dt;
    if (p.k === 'dust') { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; } else p.y -= 40 * dt;
  }
  G.parts = G.parts.filter(p => p.life > 0);
  G.inv -= dt; G.shake -= dt;
  hud();
}
function hud() {
  const sec = Math.floor(G.t);
  const key = G.life + '|' + G.tix + '|' + sec;
  if (key === G.hudKey) return; G.hudKey = key;
  $('#mh-life').innerHTML = Array.from({ length: G.maxLife }, (_, i) => HEART_SVG(i < G.life)).join('');
  $('#mh-tix').innerHTML = `${TICKET}<b>${G.tix}</b>`;
  $('#mh-time').textContent = `${sec}초`;
}

/* ---------- 그리기 ---------- */
const PXFONT = (px, bold) => `${bold ? 700 : 400} ${px}px Galmuri11, DotGothic16, monospace`;
function pxText(text, x, y, px, fill, stroke = '#ffffff', bold = true) {
  ctx.font = PXFONT(px, bold); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (stroke) { ctx.fillStyle = stroke; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) ctx.fillText(text, x + dx, y + dy); }
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
}
function draw() {
  if (!ctx || !SPR.bg) return;
  const now = performance.now() / 1000;
  ctx.save();
  if (G.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * 4), Math.round((Math.random() - 0.5) * 4));
  ctx.drawImage(SPR.bg, 0, 0);
  // 구름
  [[30, 30, 6], [150, 60, 4], [90, 16, 3]].forEach(([x, y, v], i) => {
    const s = SPR.clouds[i], span = DW + s.width * 2;
    ctx.drawImage(s, Math.round(((x + now * v) % span + span) % span - s.width), y);
  });
  // 아이템 : 티켓은 반짝이는 테두리, 하트는 콩닥
  for (const it of G.items) {
    const x = cx(it.x), y = cx(it.y);
    if (it.k === 'tix') {
      const s = SPR.ticket, glow = Math.floor(now * 6) % 2;
      ctx.fillStyle = glow ? 'rgba(255,236,150,.75)' : 'rgba(255,255,255,.6)';
      ctx.fillRect(x - s.width / 2 - 2, y - s.height / 2 - 2, s.width + 4, s.height + 4);
      ctx.drawImage(s, Math.round(x - s.width / 2), Math.round(y - s.height / 2 + (Math.floor(now * 4 + it.ph) % 2)));
    } else {
      const s = SPR.heart, b = Math.floor(now * 5 + it.ph) % 2;
      ctx.drawImage(s, Math.round(x - s.width / 2), Math.round(y - s.height / 2 - b));
    }
  }
  // 돌 (네 방향 그림을 돌려 가며 굴러가요)
  for (const r of G.rocks) {
    const R = SPR.rocks[r.sp], f = R.frames[((Math.floor(r.rot) % 4) + 4) % 4];
    ctx.drawImage(f, Math.round(cx(r.x) - f.width / 2), Math.round(cx(r.y) - f.height / 2));
  }
  // 캐릭터
  const gx = cx(G.x), gy = cx(GROUND);
  ctx.fillStyle = 'rgba(47,35,33,.18)'; ctx.fillRect(gx - 16, gy - 2, 32, 2); ctx.fillRect(gx - 12, gy - 3, 24, 1);
  const blink = G.inv > 0 && !G.over && Math.floor(G.inv * 10) % 2 === 0;
  if (!blink && G.img && G.img.complete) {
    const moving = G.dir !== 0 || G.target != null, hop = moving ? (Math.floor(now * 10) % 2) * 2 : 0;
    ctx.drawImage(G.img, gx - GW / 2, gy - GH + 2 - hop, GW, GH);
  }
  // 먼지·글자
  for (const p of G.parts) {
    if (p.k === 'dust') { if (p.life > 0) { ctx.fillStyle = '#d9c39a'; ctx.fillRect(cx(p.x), cx(p.y), 2, 2); } }
    else if (p.life > 0 && (p.life > 0.3 || Math.floor(p.life * 20) % 2)) pxText(p.text, cx(p.x), cx(p.y), 11, p.color);
  }
  ctx.restore();
  // 카운트다운·일시정지
  if (G.count > 0 && !G.over) bigText(String(Math.ceil(G.count)), '돌을 피하고 티켓을 주워요!');
  if (G.paused && !G.over) { ctx.fillStyle = 'rgba(255,249,239,.78)'; ctx.fillRect(0, 0, DW, DH); bigText('잠깐 멈춤', '화면을 누르거나 아무 키나 누르면 계속해요'); }
}
function bigText(t, sub) {
  pxText(t, DW / 2, Math.round(DH * 0.36), t.length > 2 ? 22 : 44, '#ffffff', INK);
  pxText(sub, DW / 2, Math.round(DH * 0.36) + 34, 11, INK, '#ffffff');
}

/* ---------- 끝 ---------- */
function endMini() {
  if (G.over) return;
  G.over = true; G.keys = {}; G.padL = G.padR = false; G.dir = 0; G.target = null;
  const c = CHARS[G.cid], got = G.tix;
  S.tickets += got; save(); drawTickets(); if (got) popTix();
  gainXp(Math.floor(G.t) * 2 + got * 10);
  const line = got >= 6 ? c.lines.love : got >= 3 ? c.lines.like : got >= 1 ? c.lines.meh : c.lines.bad;
  setTimeout(() => {
    $('#mo-title').textContent = got ? `티켓 ${got}장 획득!` : '앗, 티켓을 못 주웠어요';
    $('#mo-line').innerHTML = `<span class="jp">${line[0]}</span><span class="kr">${line[1]}</span>`;
    $('#mo-sum').innerHTML = `<li><span>버틴 시간</span><b>${Math.floor(G.t)}초</b></li><li><span>주운 티켓</span><b>${got - G.bonus}장</b></li><li><span>버티기 보너스</span><b>${G.bonus}장</b></li><li><span>지금 가진 티켓</span><b>${S.tickets}장</b></li>`;
    $('#mini-over').hidden = false;
    chirp(G.cid, got >= 6 ? 'love' : got >= 3 ? 'like' : got >= 1 ? 'meh' : 'bad');
    speak(G.cid, line[0], 520);
    $('#mo-again').focus({ preventScroll: true });
  }, 650);
}
$('#mo-again').onclick = () => { sfx.pop(); drawMiniPick(); };
$('#mo-dress').onclick = () => { sfx.pop(); stopMini(); const cid = G.cid; openDress(gamesFrom === 'dress' && run.cid ? run.cid : cid); };

/* ---------- 조작 ---------- */
const MOVE_KEYS = ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'];
window.addEventListener('keydown', e => {
  if (run.screen !== 'mini' || !G.on || G.over) return;
  if (G.paused) { G.paused = false; G.last = performance.now(); e.preventDefault(); return; }
  if (MOVE_KEYS.includes(e.code)) { e.preventDefault(); G.keys[e.code] = true; G.target = null; recomputeDir(); }
  else if (e.code === 'Space' || e.code === 'KeyP' || e.code === 'Escape') { e.preventDefault(); G.paused = true; }
});
window.addEventListener('keyup', e => { if (MOVE_KEYS.includes(e.code)) { G.keys[e.code] = false; recomputeDir(); } });
window.addEventListener('blur', () => { G.keys = {}; G.padL = G.padR = false; recomputeDir(); if (G.on && !G.over && G.count <= 0) G.paused = true; });
document.addEventListener('visibilitychange', () => { if (document.hidden && G.on && !G.over) { G.paused = true; G.keys = {}; recomputeDir(); } });
function bindPad(id, side) {
  const b = $(id);
  const on = e => { e.preventDefault(); if (G.paused) { G.paused = false; G.last = performance.now(); } G[side] = true; G.target = null; recomputeDir(); try { b.setPointerCapture(e.pointerId); } catch (_) { } };
  const off = () => { G[side] = false; recomputeDir(); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
  b.addEventListener('contextmenu', e => e.preventDefault());
}
bindPad('#mp-l', 'padL'); bindPad('#mp-r', 'padR');
(function bindCanvas() {
  const c = $('#mini-cv'); let down = false;
  const toX = e => { const r = c.getBoundingClientRect(); return (e.clientX - r.left) / r.width * MW; };
  c.addEventListener('pointerdown', e => {
    if (!G.on || G.over) return;
    if (G.paused) { G.paused = false; G.last = performance.now(); return; }
    down = true; G.target = toX(e); try { c.setPointerCapture(e.pointerId); } catch (_) { }
  });
  c.addEventListener('pointermove', e => { if (down && G.on) G.target = toX(e); });
  const up = () => { down = false; G.target = null; };
  c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
})();
$('#btn-mini-sel .mb-ic').innerHTML = TICKET;
