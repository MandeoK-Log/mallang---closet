/* ===== 레드카펫 패션쇼 =====
   무대(320×200 도트 캔버스): 위쪽 입구 → 가운데 레드카펫(동선) → 아래쪽 심사위원석, 양옆은 관객석.
   - 참가자 10명(나 + 경쟁자 9명), 내 순서는 매번 무작위
   - 내 차례에는 마우스 좌클릭/우클릭(또는 ← →)으로 균형잡기 → 심사 점수에 조금 반영
   - 심사위원 4명이 흰 보드에 0~10점을 들고, 합계(40점 만점)로 순위를 매겨요
   - 경쟁자의 관객 호응·플래시는 그 경쟁자가 받을 점수를 미리 반영해요 (우승 후보일수록 시끌벅적)
   - 내 차례가 끝나면 남은 무대를 건너뛸 수 있어요
   - 1등을 하면 다음 스테이지 초대장! (스테이지 2는 아직 개발 중) */
const SHOW_STAGES = [
  { id: 'gangwon', name: '강원 감자골 패션쇼', sub: '스테이지 1 · 국내 소규모 · 시골 마을 패션쇼', fee: 2 },
  { id: 'national', name: '전국 패션 위크', sub: '스테이지 2 · 전국 규모 패션쇼', dev: true, invite: 'national' }
];
const SHOW_REWARD = [
  { coins: 500, tickets: 3 }, { coins: 250, tickets: 1 }, { coins: 150, tickets: 1 },
  { coins: 80 }, { coins: 80 }, { coins: 40 }, { coins: 40 }, { coins: 40 }, { coins: 40 }, { coins: 40 }
];
const SVW = 320, SVH = 200, RUN_TOP = 46, RUN_END = 118, JX = [76, 128, 192, 244];
const SH = { on: false, speed: 1, pick: null };

/* ---------- 점수 계산 ---------- */
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
function prestigeOf(o) {
  let s = 0;
  for (const k of ['hat', 'top', 'bottom', 'shoes']) if (o[k] && ITEM[o[k]]) s += ITEM[o[k]].idx / 11;
  if (o.bag && ITEM[o.bag]) s += (ITEM[o.bag].idx + 1) / 5;
  return s / 5;
}
function tagCounts(o) {
  const t = {}; for (const k in TAG_LABEL) t[k] = 0;
  for (const s of SLOTS) if (o[s] && ITEM[o[s]]) ITEM[o[s]].tags.forEach(g => t[g]++);
  return t;
}
/* 무대 실력(균형잡기·심사위원 취향 빼고): 캐릭터와 잘 맞는 정도 55% + 옷의 고급스러움 45% */
function showBase(cid, o) { return 10 * (0.55 * scoreOutfit(cid, o).total / 100 + 0.45 * prestigeOf(o)); }
function judgeUser(cid, o, bal) {
  const r = scoreOutfit(cid, o), pr = prestigeOf(o), tags = tagCounts(o), base = showBase(cid, o);
  return JUDGES.map(j => clampN(Math.round(base + j.bias(o, r, pr, tags) + (bal - 0.5) * 1.2 + (Math.random() - 0.5) * 0.6), 0, 10));
}
function rivalScores(target) {
  const sc = JUDGES.map(() => clampN(Math.round(target / 4 + (Math.random() - 0.5) * 1.6), 0, 10));
  const goal = Math.round(target); let guard = 0;
  while (sc.reduce((a, b) => a + b, 0) !== goal && guard++ < 40) {
    const i = Math.floor(Math.random() * 4), up = sc.reduce((a, b) => a + b, 0) < goal;
    if (up && sc[i] < 10) sc[i]++; else if (!up && sc[i] > 0) sc[i]--;
  }
  return sc;
}
const reactOf = total => clampN((total - 15) / 13, 0, 1);
function starsOf(cid, o) {
  const b = showBase(cid, o) * 4;
  return b >= 27 ? 5 : b >= 25 ? 4 : b >= 23 ? 3 : b >= 20.5 ? 2 : 1;
}
function showState() { if (!S.show) S.show = { best: 0, wins: 0, plays: 0, invites: [] }; return S.show; }

/* ---------- 대기실 ---------- */
let showFrom = 'title';
function openShow(from) {
  if (from) showFrom = from;
  stopShow();
  run.showReturn = false;
  if (!SH.pick) SH.pick = run.cid && CHAR_ORDER.includes(run.cid) ? run.cid : CHAR_ORDER[0];
  drawShowLobby(); show('show');
}
function showBack() {
  if (SH.on && !SH.done) { stopShow(); toast('패션쇼에서 나왔어요. 참가비는 돌려받지 못해요.'); drawShowLobby(); return; }
  if (!$('#show-stage').hidden) { stopShow(); drawShowLobby(); return; }
  if (showFrom === 'select') openSelect(); else if (showFrom === 'dress' && run.cid) openDress(run.cid); else show('title');
}
function drawShowLobby() {
  $('#show-lobby').hidden = false; $('#show-stage').hidden = true;
  const st = showState(), stage = SHOW_STAGES[0];
  $('#show-stages').innerHTML = SHOW_STAGES.map((sg, i) => {
    if (sg.dev) {
      const invited = st.invites.includes(sg.invite);
      return `<div class="stage-card locked${invited ? ' invited' : ''}"><span class="sc-no">STAGE ${i + 1}</span><b>${sg.name}</b><span>${sg.sub}</span>
        <em>${invited ? '초대장 받음 · 무대를 준비하고 있어요 (개발 중)' : '🔒 스테이지 1에서 우승하면 초대장을 받아요 · 개발 중'}</em></div>`;
    }
    return `<div class="stage-card open"><span class="sc-no">STAGE ${i + 1}</span><b>${sg.name}</b><span>${sg.sub}</span>
      <em>${st.best ? `내 최고 순위 ${st.best}등 · 우승 ${st.wins}번` : '아직 참가 전이에요'} · 참가비 티켓 ${sg.fee}장</em></div>`;
  }).join('');
  $('#show-judges').innerHTML = JUDGES.map(j => `<div class="jcard"><span class="jpic">${renderJudge(j.id)}</span><span><b>${j.name}</b><small>${j.title}</small><em>좋아해: ${j.taste}</em></span></div>`).join('');
  $('#show-chars').innerHTML = CHAR_ORDER.map(cid => {
    const c = CHARS[cid], o = outfits[cid] || {}, worn = SLOTS.filter(s => o[s] && S.owned.has(o[s])).length, stars = starsOf(cid, o);
    return `<div class="scard${SH.pick === cid ? ' on' : ''}" data-c="${cid}">
      <button class="scard-pick" type="button" data-pick="${cid}" aria-pressed="${SH.pick === cid}"><span class="pic">${renderChar(cid, o)}</span>
        <b>${c.name}<small>${c.species}</small></b><span class="stars" aria-label="예상 실력 ${stars}/5">${'★'.repeat(stars)}<i>${'★'.repeat(5 - stars)}</i></span>
        <span class="worn">입은 옷 ${worn}/5</span></button>
      <button class="btn btn-lilac scard-dress" type="button" data-dress="${cid}">코디 바꾸기</button></div>`;
  }).join('');
  document.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { SH.pick = b.dataset.pick; sfx.pop(); drawShowLobby(); });
  document.querySelectorAll('[data-dress]').forEach(b => b.onclick = () => { sfx.pop(); SH.pick = b.dataset.dress; openDress(SH.pick); run.showReturn = true; $('#btn-show-back').hidden = false; });
  const enough = S.tickets >= stage.fee, o = outfits[SH.pick] || {};
  $('#show-go').disabled = !enough;
  $('#show-go').textContent = `${CHARS[SH.pick].name}로 참가하기 · 티켓 ${stage.fee}장`;
  $('#show-go-note').textContent = !enough ? `티켓이 ${stage.fee - S.tickets}장 모자라요. 미니게임으로 모아 보세요.` : SLOTS.filter(s => o[s]).length < 3 ? '옷을 3개 이상 입으면 점수가 훨씬 좋아요.' : '예상 실력 별은 균형잡기와 심사위원 취향을 빼고 계산한 거예요.';
}
$('#show-go').onclick = () => startShow();

/* ---------- 그림 준비 ---------- */
function svgImage(svg, w, h) { const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', `<svg width="${w}" height="${h}" preserveAspectRatio="none" `)); return img; }
const crowdCache = {};
function crowdSprite(v, up) {
  const k = v + (up ? 'u' : 'd'); if (crowdCache[k]) return crowdCache[k];
  const furs = ['#c98a4b', '#a7a39b', '#f3ead8', '#8d6b50', '#f6b3b8', '#e7a14f', '#9a8b7a', '#fbfbf6', '#3d3739', '#cdd5dc'];
  const shirts = ['#5b86c5', '#ef7a62', '#8fd8b6', '#e9b949', '#b49be0', '#f49ab0', '#3fae6b'];
  const fur = furs[v % furs.length], shirt = shirts[(v * 3) % shirts.length], ear = v % 3;
  const D = new Dots(15, 17);
  D.blob((x, y) => x > 2 && x < 13 && y > 11, (x, y) => (y === 12 ? shade(shirt, 0.25) : shirt), INK, [0, 10, 14, 16]);
  if (up) { D.blob(inEll(2.5, 7, 1.6, 3), fur, INK, [0, 3, 5, 11]); D.blob(inEll(12.5, 7, 1.6, 3), fur, INK, [10, 3, 15, 11]); }
  if (ear === 0) { D.blob(inEll(4, 3, 2, 2), fur, INK, [1, 0, 7, 6]); D.blob(inEll(11, 3, 2, 2), fur, INK, [8, 0, 14, 6]); }
  if (ear === 1) { D.blob((x, y) => y > 0 && y < 6 && Math.abs(x - 4) < (y - 0.5) * 0.6, fur, INK, [1, 0, 7, 6]); D.blob((x, y) => y > 0 && y < 6 && Math.abs(x - 11) < (y - 0.5) * 0.6, fur, INK, [8, 0, 14, 6]); }
  D.blob(inEll(7.5, 7.5, 5, 4.6), (x, y) => (y < 5 ? shade(fur, 0.15) : fur), INK, [1, 2, 14, 13]);
  D.put(5, 7, '#1d1513'); D.put(9, 7, '#1d1513'); D.put(4, 9, '#f6a9b0'); D.put(10, 9, '#f6a9b0');
  const c = document.createElement('canvas'); c.width = 15; c.height = 17; c.getContext('2d').putImageData(D.img, 0, 0);
  return (crowdCache[k] = c);
}
const runEdge = y => { const k = clampN((y - RUN_TOP) / (RUN_END + 4 - RUN_TOP), 0, 1); return [148 - 34 * k, 172 + 34 * k]; };
function buildSeats() {
  const seats = []; let v = 0;
  for (const y of [62, 78, 94, 110]) {
    const [l, r] = runEdge(y);
    for (let x = 6; x < l - 14; x += 15) seats.push({ x, y, v: (v += 7) % 23, ph: Math.random() * 6 });
    for (let x = 299; x > r + 2; x -= 15) seats.push({ x, y, v: (v += 5) % 23, ph: Math.random() * 6 });
  }
  for (const y of [130, 148]) { for (const x of [4, 20]) seats.push({ x, y, v: (v += 3) % 23, ph: Math.random() * 6 }); for (const x of [285, 301]) seats.push({ x, y, v: (v += 3) % 23, ph: Math.random() * 6 }); }
  return seats;
}
function buildStatic() {
  const D = new Dots(SVW, SVH);
  // 벽 : 붉은 커튼
  for (let y = 0; y < 44; y++) for (let x = 0; x < SVW; x++) { const m = x % 10; D.put(x, y, m < 2 ? '#5e1a24' : m === 5 ? '#93323f' : (y > 40 && (x + y) % 2) ? '#6a1e29' : '#7b2632'); }
  for (let x = 0; x < SVW; x++) { D.put(x, 44, INK); D.put(x, 43, '#4a141c'); }
  // 입구
  for (let y = 21; y < 44; y++) for (let x = 144; x < 176; x++) D.put(x, y, (x < 146 || x > 173 || y < 23) ? '#5a3a24' : y < 30 ? '#fff6d6' : (BAYER[y & 3][x & 3] < (y - 30) ? '#ffd98a' : '#fff0bf'));
  // 바닥 : 마을회관 나무 마루
  for (let y = 45; y < SVH; y++) for (let x = 0; x < SVW; x++) { const row = Math.floor((y - 45) / 7), seam = (x + row * 23) % 46 === 0; D.put(x, y, (y - 45) % 7 === 0 || seam ? '#a9774a' : (x * 7 + y * 3) % 31 === 0 ? '#d9a873' : '#c8955f'); }
  // 건초 벤치
  for (const y of [62, 78, 94, 110]) {
    const [l, r] = runEdge(y);
    for (const [x0, x1] of [[2, l - 6], [r + 4, SVW - 3]]) for (let yy = y - 5; yy <= y + 1; yy++) for (let x = Math.round(x0); x <= Math.round(x1); x++)
      D.put(x, yy, (yy === y - 5 || yy === y + 1 || x === Math.round(x0) || x === Math.round(x1)) ? '#8a6a2e' : (x + yy * 2) % 5 === 0 ? '#c9a64a' : '#e2c46a');
  }
  // 레드카펫 (멀리 좁고 가까이 넓게)
  for (let y = RUN_TOP - 2; y <= RUN_END + 4; y++) {
    const [l, r] = runEdge(y);
    for (let x = Math.round(l); x <= Math.round(r); x++) {
      const edge = x === Math.round(l) || x === Math.round(r), gold = x === Math.round(l) + 1 || x === Math.round(r) - 1, mid = Math.abs(x - 160) < (r - l) * 0.12;
      D.put(x, y, edge ? '#5a1218' : gold ? '#e9c45b' : (mid && BAYER[y & 3][x & 3] < 6) ? '#dc4a55' : '#c8333f');
    }
  }
  const bg = document.createElement('canvas'); bg.width = SVW; bg.height = SVH; const bx = bg.getContext('2d'); bx.putImageData(D.img, 0, 0);
  // 간판
  bx.fillStyle = '#5a3a24'; bx.fillRect(98, 3, 124, 16); bx.fillStyle = '#e8c58a'; bx.fillRect(100, 5, 120, 12);
  bx.fillStyle = '#5a3a24'; [[102, 7], [216, 7], [102, 13], [216, 13]].forEach(([x, y]) => bx.fillRect(x, y, 2, 2));
  bx.font = '700 11px Galmuri11, monospace'; bx.textAlign = 'center'; bx.textBaseline = 'middle'; bx.fillStyle = '#5a1218'; bx.fillText(SHOW_STAGES[0].name, 160, 11.5);
  // 심사위원석 책상 (심사위원 위에 덮어 그려요)
  const F = new Dots(SVW, SVH);
  for (let y = 158; y < SVH; y++) for (let x = 30; x < 290; x++) {
    const top = y < 162, edge = x === 30 || x === 289 || y === 158;
    F.put(x, y, edge ? INK : top ? '#fbf6ee' : y < 166 ? '#e9e0d2' : (y > 184 ? '#9e2633' : (x % 12 < 6 ? '#c8333f' : '#b52d38')));
  }
  const fg = document.createElement('canvas'); fg.width = SVW; fg.height = SVH; const fx = fg.getContext('2d'); fx.putImageData(F.img, 0, 0);
  JUDGES.forEach((j, i) => {
    const x = JX[i]; fx.fillStyle = INK; fx.fillRect(x - 17, 168, 34, 12); fx.fillStyle = '#f6efe2'; fx.fillRect(x - 16, 169, 32, 10);
    fx.font = '400 11px Galmuri11, monospace'; fx.textAlign = 'center'; fx.textBaseline = 'middle'; fx.fillStyle = INK; fx.fillText({ flamingo: '로제', poodle: '뿌뿌', owl: '올리버', peacock: '피콕' }[j.id], x, 174.5);
  });
  return { bg, fg };
}

/* ---------- 시작 ---------- */
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function startShow() {
  const stage = SHOW_STAGES[0], cid = SH.pick;
  regen();
  if (S.tickets < stage.fee) { sfx.no(); toast(`참가비 티켓 ${stage.fee}장이 필요해요.`); return; }
  S.tickets -= stage.fee; save(); drawTickets(); popTix();
  ac(); unlockSpeech();
  const outfit = Object.fromEntries(Object.entries(outfits[cid] || {}).filter(([, id]) => id && S.owned.has(id)));
  const me = { user: true, cid, name: CHARS[cid].name, species: CHARS[cid].species, home: '우리 집', outfit, img: svgImage(renderChar(cid, outfit), GW, GH), scores: null, total: null };
  const rivals = RIVAL_IDS.map(id => {
    const R = RIVALS[id], target = clampN(R.tier + (Math.random() - 0.5) * 2.4, 4, 39), scores = rivalScores(target);
    return { user: false, cid: 'rv_' + id, name: R.name, species: R.species, home: R.home, intro: R.intro, outfit: R.outfit, img: svgImage(renderChar('rv_' + id, R.outfit), GW, GH), scores, total: scores.reduce((a, b) => a + b, 0) };
  });
  const list = shuffle([me, ...rivals]);
  list.forEach((e, i) => { e.no = i + 1; e.state = 'wait'; e.tie = Math.random(); });
  if (!SH.art) SH.art = buildStatic();
  if (!SH.judgeImgs) SH.judgeImgs = JUDGES.map(j => svgImage(renderJudge(j.id), GW, GH));
  Object.assign(SH, {
    on: true, done: false, list, me, cur: -1, phase: 'open', pt: 0, seats: buildSeats(), flashes: [], sparks: [],
    crowd: 0.25, crowdTarget: 0.25, burstT: -9, burst: 0, userDone: false, speed: 1, bal: null, last: performance.now(), t: 0
  });
  $('#show-lobby').hidden = true; $('#show-stage').hidden = false; $('#show-result').hidden = true;
  $('#show-skip').disabled = true; $('#show-speed').textContent = '빨리 보기 ×2'; $('#show-speed').setAttribute('aria-pressed', 'false');
  $('#bar-title').textContent = SHOW_STAGES[0].name;
  const cv = $('#show-cv'); cv.width = SVW; cv.height = SVH; SH.ctx = cv.getContext('2d'); SH.ctx.imageSmoothingEnabled = false;
  drawShowList();
  crowdAudio(true);
  cancelAnimationFrame(SH.raf); SH.raf = requestAnimationFrame(showLoop);
  window.scrollTo(0, 0);
}
function stopShow() { SH.on = false; cancelAnimationFrame(SH.raf); crowdAudio(false); clearInterval(SH.beatTimer); }

/* ---------- 진행 ---------- */
function showLoop(now) {
  if (!SH.on) return;
  const dt = Math.min(0.05, (now - SH.last) / 1000); SH.last = now; SH.t += dt;
  stepShow(dt); drawShow();
  SH.raf = requestAnimationFrame(showLoop);
}
function nextPhase(p) { SH.phase = p; SH.pt = 0; }
function beginTurn(i) {
  SH.cur = i; const e = SH.list[i];
  e.state = 'stage'; e.y = RUN_TOP; e.alpha = 0; e.boards = 0; e.shown = false;
  nextPhase('call'); drawShowList();
  SH.crowdTarget = e.user ? 0.45 : 0.25 + reactOf(e.total) * 0.35;
  if (e.user) { $('#show-hint').textContent = '내 차례! 좌클릭/우클릭(← →)으로 균형을 잡아요'; fanfare(); }
  else $('#show-hint').textContent = SH.userDone ? '남은 무대는 건너뛸 수 있어요' : '';
  $('#show-pad').classList.toggle('active', e.user);
}
function stepShow(dt) {
  SH.crowd += (SH.crowdTarget - SH.crowd) * Math.min(1, dt * 3);
  setCrowdLevel(SH.crowd + Math.max(0, SH.burst * (1 - (SH.t - SH.burstT) / 2.2)));
  SH.flashes = SH.flashes.filter(f => SH.t - f.t < 0.18);
  SH.sparks = SH.sparks.filter(s => SH.t - s.t < 0.7);
  if (SH.phase === 'open') { SH.pt += dt; if (SH.pt >= 2.2) beginTurn(0); return; }
  if (SH.phase === 'end') return;
  const e = SH.list[SH.cur], d = dt * (e.user ? 1 : SH.speed);
  SH.pt += d;
  // 관객 플래시 : 경쟁자는 미리 정해진 점수만큼, 점수 발표 직후엔 모두
  const burstLive = SH.t - SH.burstT < 1.4 ? SH.burst : 0;
  const r = (SH.phase === 'walk' || SH.phase === 'pose') && !e.user ? reactOf(e.total) : burstLive;
  if (r > 0.6 && Math.random() < (r - 0.55) * 14 * dt) flash();
  switch (SH.phase) {
    case 'call': e.alpha = Math.min(1, SH.pt / 0.5); if (SH.pt >= 0.9) nextPhase(e.user ? 'ready' : 'walk'); break;
    case 'ready':
      if (!SH.bal) SH.bal = { a: 0, v: 0, t: 0, inZone: 0, total: 0, stumbles: 0, p1: Math.random() * 6, p2: Math.random() * 6, wob: 0 };
      if (SH.pt >= 2.2) { nextPhase('walk'); beatOn(true); }
      break;
    case 'walk': {
      const dur = e.user ? 6.5 : 3.6, f = Math.min(1, SH.pt / dur);
      e.y = RUN_TOP + (RUN_END - RUN_TOP) * f;
      if (!e.user && SH.pt < d * 1.5) beatOn(true);
      if (e.user) updateBalance(dt);
      if (f >= 1) {
        if (e.user) { const b = SH.bal; e.balance = clampN(b.inZone / Math.max(0.01, b.total) - 0.1 * b.stumbles, 0, 1); e.scores = judgeUser(e.cid, e.outfit, e.balance); e.total = e.scores.reduce((a, b2) => a + b2, 0); }
        nextPhase('pose'); for (let i = 0; i < 6; i++) SH.sparks.push({ x: 160 + (Math.random() - 0.5) * 50, y: e.y - 20 - Math.random() * 40, t: SH.t + i * 0.08 });
      }
      break;
    }
    case 'pose': if (SH.pt >= 1.0) { beatOn(false); nextPhase('judge'); } break;
    case 'judge': {
      const nb = Math.min(4, Math.floor((SH.pt - 0.1) / 0.45) + 1);
      if (SH.pt > 0.1 && nb > e.boards) { e.boards = nb; ding(e.scores[nb - 1]); }
      if (SH.pt >= 2.2 && !e.shown) {
        e.shown = true; e.state = 'done'; drawShowList();
        SH.burst = 0.15 + reactOf(e.total) * 0.85; SH.burstT = SH.t; cheer(SH.burst);
        if (e.user) {
          const tier = e.total >= 27 ? 'love' : e.total >= 23 ? 'like' : e.total >= 19 ? 'meh' : 'bad', line = CHARS[e.cid].lines[tier];
          chirp(e.cid, tier); speak(e.cid, line[0], 600);
        }
      }
      if (SH.pt >= 3.8) nextPhase('exit');
      break;
    }
    case 'exit':
      e.y = RUN_END - (RUN_END - RUN_TOP) * 0.3 * Math.min(1, SH.pt / 0.6); e.alpha = 1 - Math.min(1, SH.pt / 0.6);
      if (SH.pt >= 0.6) {
        if (e.user) { SH.userDone = true; $('#show-skip').disabled = false; SH.bal = null; $('#show-pad').classList.remove('active'); }
        SH.crowdTarget = 0.25;
        if (SH.cur + 1 < SH.list.length) beginTurn(SH.cur + 1); else finishShow();
      }
      break;
  }
}

/* ---------- 균형잡기 ----------
   바늘이 천천히 좌우로 흔들려요. 바늘이 오른쪽으로 가면 좌클릭, 왼쪽으로 가면 우클릭.
   가운데 초록 칸에 머문 시간이 길수록 좋고, 끝까지 넘어가면 휘청(감점). */
function updateBalance(dt) {
  const b = SH.bal; b.t += dt;
  const drift = Math.sin(b.t * 1.2 + b.p1) * 0.6 + Math.sin(b.t * 2.2 + b.p2) * 0.35;
  b.v += drift * 0.85 * dt; b.v *= 1 - 0.9 * dt; b.a += b.v * dt;
  b.total += dt; if (Math.abs(b.a) < 0.35) b.inZone += dt;
  b.wob = Math.max(0, b.wob - dt);
  if (Math.abs(b.a) >= 1) { b.stumbles++; b.a = Math.sign(b.a) * 0.65; b.v = -Math.sign(b.a) * 0.2; b.wob = 0.6; oops(); }
}
function lean(dir) {
  const e = SH.list[SH.cur];
  if (!SH.on || !e || !e.user || !SH.bal || (SH.phase !== 'walk' && SH.phase !== 'ready')) return;
  SH.bal.v += dir * 0.55; SH.bal.kick = { dir, t: SH.t };
  tone(dir < 0 ? 520 : 620, 0, 0.05, 'triangle', 0.05);
}

/* ---------- 그리기 ---------- */
function stxt(text, x, y, px, fill, stroke = INK, align = 'center') {
  const c = SH.ctx; c.font = `700 ${px}px Galmuri11, DotGothic16, monospace`; c.textAlign = align; c.textBaseline = 'middle';
  if (stroke) { c.fillStyle = stroke; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) c.fillText(text, x + dx, y + dy); }
  c.fillStyle = fill; c.fillText(text, x, y);
}
function pbox(x, y, w, h, fill, ink = INK) { const c = SH.ctx; c.fillStyle = ink; c.fillRect(x + 1, y, w - 2, h); c.fillRect(x, y + 1, w, h - 2); c.fillStyle = fill; c.fillRect(x + 1, y + 1, w - 2, h - 2); }
function drawShow() {
  const c = SH.ctx; if (!c) return;
  const t = SH.t, e = SH.list[SH.cur];
  c.drawImage(SH.art.bg, 0, 0);
  // 전구 줄
  for (let x = 4, i = 0; x < SVW; x += 9, i++) {
    const y = 28 + Math.round(Math.sin(x / 15) * 3);
    if (x > 140 && x < 180) continue;
    c.fillStyle = INK; c.fillRect(x, y - 1, 1, 1);
    c.fillStyle = (Math.floor(t * 3) + i) % 3 === 0 ? '#fff6c8' : ['#ef7a62', '#e9c45b', '#8fd8b6', '#8cc8f0'][i % 4];
    c.fillRect(x - 1, y, 3, 2);
  }
  // 관객
  const lvl = SH.crowd + Math.max(0, SH.burst * (1 - (t - SH.burstT) / 2.2));
  for (const s of SH.seats) {
    const up = lvl > 0.55 && Math.sin(t * (6 + lvl * 4) + s.ph) > 0.3 - lvl * 0.5;
    const hop = up && lvl > 0.7 ? Math.round(Math.abs(Math.sin(t * 8 + s.ph)) * 2) : Math.round(Math.sin(t * 2 + s.ph) * 0.5);
    c.drawImage(crowdSprite(s.v, up), s.x, s.y - 16 - hop);
  }
  // 무대 위 참가자
  if (e && SH.phase !== 'open' && SH.phase !== 'end' && e.img.complete) {
    const k = (e.y - RUN_TOP) / (RUN_END - RUN_TOP), sc = 0.55 + 0.45 * k;
    let sway = 0, tilt = 0;
    if (SH.phase === 'walk') sway = Math.round(Math.sin(SH.pt * 7) * 1.5);
    if (e.user && SH.bal) { sway += Math.round(SH.bal.a * 8); tilt = SH.bal.a * 0.2 + (SH.bal.wob ? Math.sin(t * 40) * 0.08 : 0); }
    const bob = SH.phase === 'walk' ? Math.floor(SH.pt * 6) % 2 : 0, w = Math.round(GW * sc), h = Math.round(GH * sc);
    c.globalAlpha = e.alpha;
    c.fillStyle = 'rgba(47,35,33,.25)'; c.fillRect(160 + sway - Math.round(w * 0.3), Math.round(e.y) - 2, Math.round(w * 0.6), 2);
    c.save(); c.translate(160 + sway, Math.round(e.y)); c.rotate(tilt);
    c.drawImage(e.img, -Math.round(w / 2), -h + 2 - bob, w, h);
    c.restore(); c.globalAlpha = 1;
  }
  // 반짝이·플래시
  for (const s of SH.sparks) { if (t < s.t) continue; const a = (t - s.t) / 0.7, r = Math.round(1 + a * 3); c.fillStyle = '#fff6c8'; c.fillRect(Math.round(s.x) - r, Math.round(s.y), r * 2 + 1, 1); c.fillRect(Math.round(s.x), Math.round(s.y) - r, 1, r * 2 + 1); }
  for (const f of SH.flashes) {
    const a = 1 - (t - f.t) / 0.18;
    c.fillStyle = `rgba(255,255,255,${0.9 * a})`; c.fillRect(f.x - 3, f.y, 7, 1); c.fillRect(f.x, f.y - 3, 1, 7); c.fillRect(f.x - 1, f.y - 1, 3, 3);
    if (f.big) { c.fillStyle = `rgba(255,255,255,${0.16 * a})`; c.fillRect(0, 0, SVW, SVH); }
  }
  // 심사위원 + 점수 보드
  JUDGES.forEach((j, i) => {
    const img = SH.judgeImgs[i]; if (img.complete) c.drawImage(img, JX[i] - GW / 2, 108 + (e && e.boards > i && SH.phase === 'judge' ? -2 : 0));
  });
  c.drawImage(SH.art.fg, 0, 0);
  if (e && (SH.phase === 'judge') ) {
    JUDGES.forEach((j, i) => {
      if (e.boards <= i) return;
      const x = JX[i], up = Math.min(1, (SH.pt - 0.1 - i * 0.45) / 0.15), y = Math.round(140 - up * 8);
      c.fillStyle = '#6b4a2e'; c.fillRect(x - 1, y + 20, 2, 10);
      pbox(x - 15, y, 30, 21, '#ffffff'); stxt(String(e.scores[i]), x, y + 11, 22, e.scores[i] >= 8 ? '#d65e47' : INK, null);
    });
  }
  // 합계
  if (e && e.shown && (SH.phase === 'judge' || SH.phase === 'exit')) {
    pbox(110, 84, 100, 30, e.user ? '#fff3d6' : '#ffffff');
    stxt(`합계 ${e.total}점`, 160, 95, 11, INK, null);
    const label = e.total >= 30 ? '우승 후보!' : e.total >= 26 ? '대단해요!' : e.total >= 21 ? '좋아요' : '아쉬워요';
    stxt(label, 160, 106, 11, e.total >= 26 ? '#d65e47' : '#7b6660', null);
  }
  // 이름표
  if (e && SH.phase !== 'open' && SH.phase !== 'end') {
    pbox(4, 48, 124, 30, e.user ? '#fff3d6' : '#fffaf0');
    stxt(`${e.no}번 · ${e.name}`, 8, 57, 11, e.user ? '#d65e47' : INK, null, 'left');
    stxt(`${e.species} · ${e.home}`, 8, 70, 11, '#7b6660', null, 'left');
  }
  // 균형 게이지
  if (e && e.user && SH.bal && (SH.phase === 'ready' || SH.phase === 'walk')) {
    const b = SH.bal, gx = 100, gy = 32, gw = 120;
    pbox(gx - 4, gy - 4, gw + 8, 14, '#fffaf0');
    c.fillStyle = '#f2b8b0'; c.fillRect(gx, gy, gw, 6);
    c.fillStyle = '#9fd3a8'; c.fillRect(gx + gw / 2 - gw * 0.35 / 2, gy, Math.round(gw * 0.35), 6);
    const nx = Math.round(gx + gw / 2 + b.a * gw / 2);
    c.fillStyle = INK; c.fillRect(nx - 1, gy - 3, 3, 12);
    c.fillStyle = '#ffffff'; c.fillRect(nx, gy - 2, 1, 10);
    stxt('◀좌클릭', gx - 6, gy + 3, 11, '#ffffff', INK, 'right');
    stxt('우클릭▶', gx + gw + 6, gy + 3, 11, '#ffffff', INK, 'left');
    if (SH.phase === 'ready') { pbox(70, 54, 180, 26, '#ffffff'); stxt('균형을 잡으며 걸어가요!', 160, 63, 11, INK, null); stxt(`${Math.ceil(2.2 - SH.pt)}`, 160, 74, 11, '#d65e47', null); }
    if (b.wob) stxt('휘청!', 160 + Math.round(b.a * 8), Math.round(e.y) - 70, 11, '#d65e47');
  }
  if (SH.phase === 'open') {
    c.fillStyle = 'rgba(47,35,33,.55)'; c.fillRect(0, 0, SVW, SVH);
    stxt(SHOW_STAGES[0].name, 160, 82, 22, '#fff6c8');
    stxt('참가자 10명 · 심사위원 4명', 160, 108, 11, '#ffffff');
    stxt('곧 시작해요!', 160, 124, 11, '#ffffff');
  }
}

/* ---------- 참가자 목록 ---------- */
function drawShowList() {
  const sorted = SH.done ? rankList() : null;
  const rows = (sorted || SH.list).map((e, i) => {
    const cls = [e.user ? 'me' : '', SH.list[SH.cur] === e && !SH.done ? 'now' : ''].join(' ');
    const right = e.state === 'done' || SH.done ? `<b>${e.total}점</b>` : SH.list[SH.cur] === e ? '<em>무대 중</em>' : '<em>대기</em>';
    return `<li class="${cls}"><span class="no">${sorted ? (i + 1) + '등' : e.no}</span><span class="av">${renderChar(e.cid, e.outfit)}</span><span class="nm">${e.name}${e.user ? ' (나)' : ''}<small>${e.species} · ${e.home}</small></span>${right}</li>`;
  }).join('');
  $('#show-list').innerHTML = rows;
  $('#show-list-title').textContent = SH.done ? '최종 순위' : '참가 순서';
}
function rankList() { return [...SH.list].sort((a, b) => (b.total - a.total) || (a.user ? -1 : b.user ? 1 : b.tie - a.tie)); }

/* ---------- 끝 ---------- */
function skipRest() {
  if (!SH.userDone || SH.done) return;
  sfx.pop(); SH.list.forEach(e => { if (e.state !== 'done') e.state = 'done'; });
  finishShow();
}
function finishShow() {
  SH.done = true; nextPhase('end'); beatOn(false); SH.crowdTarget = 0.3;
  const ranked = rankList(), rank = ranked.indexOf(SH.me) + 1, rw = SHOW_REWARD[rank - 1] || { coins: 40 }, st = showState();
  st.plays++; if (!st.best || rank < st.best) st.best = rank;
  const firstInvite = rank === 1 && !st.invites.includes('national');
  if (rank === 1) { st.wins++; if (firstInvite) st.invites.push('national'); }
  S.coins += rw.coins; S.tickets += rw.tickets || 0; save(); setCoins(true); drawTickets();
  gainXp(30 + (11 - rank) * 8);
  drawShowList();
  const medal = ['🥇', '🥈', '🥉'][rank - 1] || '';
  $('#sr-title').textContent = rank === 1 ? '우승!' : rank <= 3 ? `${rank}등 입상!` : `${rank}등`;
  $('#sr-sub').textContent = rank === 1 ? `${SHOW_STAGES[0].name}의 주인공은 ${SH.me.name}!` : rank <= 3 ? '시상대에 올랐어요!' : '다음엔 더 좋은 옷으로 도전해 봐요.';
  $('#sr-medal').textContent = medal;
  $('#sr-mine').innerHTML = `<li><span>심사 점수</span><b>${SH.me.scores.join(' + ')} = ${SH.me.total}점</b></li><li><span>균형잡기</span><b>${Math.round((SH.me.balance || 0) * 100)}%</b></li><li><span>보상</span><b>조개 ${rw.coins}${rw.tickets ? ` · 티켓 ${rw.tickets}장` : ''}</b></li>`;
  $('#sr-top').innerHTML = ranked.slice(0, 3).map((e, i) => `<li class="${e.user ? 'me' : ''}"><span>${i + 1}등</span><span class="av">${renderChar(e.cid, e.outfit)}</span><b>${e.name}</b><em>${e.total}점</em></li>`).join('');
  $('#sr-invite').hidden = !firstInvite;
  if (firstInvite) $('#sr-invite-name').textContent = `${SH.me.name} 님`;
  $('#show-result').hidden = false; $('#show-skip').disabled = true; $('#show-hint').textContent = '';
  if (rank <= 3) { cheer(1); for (let i = 0; i < 14; i++) setTimeout(flash, i * 90); }
  sfx.coin();
}
$('#show-skip').onclick = skipRest;
$('#show-speed').onclick = () => { SH.speed = SH.speed === 1 ? 2 : 1; $('#show-speed').textContent = SH.speed === 2 ? '보통 속도로' : '빨리 보기 ×2'; $('#show-speed').setAttribute('aria-pressed', String(SH.speed === 2)); sfx.tab(); };
$('#sr-again').onclick = () => { sfx.pop(); stopShow(); drawShowLobby(); };
$('#sr-dress').onclick = () => { sfx.pop(); stopShow(); openDress(SH.me.cid); };

/* ---------- 소리 : 관객 웅성거림 · 환호 · 박수 · 카메라 · 런웨이 비트 ---------- */
function crowdAudio(on) {
  const a = ac();
  if (!on) { if (SH.cg) { try { SH.cg.gain.setTargetAtTime(0.0001, SH.ca.currentTime, 0.1); const s = SH.cs; setTimeout(() => { try { s.stop(); } catch (_) { } }, 400); } catch (_) { } SH.cg = null; } return; }
  if (!a || SH.cg) return;
  const buf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate), d = buf.getChannelData(0);
  let v = 0; for (let i = 0; i < d.length; i++) { v = v * 0.97 + (Math.random() * 2 - 1) * 0.03; d[i] = v * 6 * (0.7 + 0.3 * Math.sin(i / 4000)); }
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = buf; s.loop = true; f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 0.6; g.gain.value = 0.0001;
  s.connect(f).connect(g).connect(a.destination); s.start();
  SH.ca = a; SH.cs = s; SH.cg = g;
}
function setCrowdLevel(l) { if (SH.cg) SH.cg.gain.setTargetAtTime(0.02 + clampN(l, 0, 1.4) * 0.11, SH.ca.currentTime, 0.15); }
function cheer(level) {
  const n = Math.round(6 + level * 34);
  for (let i = 0; i < n; i++) noise(Math.random() * (0.6 + level), 0.03, 0.1 + level * 0.25);
  if (level > 0.7) { tone(1800, 0.1, 0.25, 'sine', 0.05, 2600); tone(2000, 0.5, 0.3, 'sine', 0.04, 2900); }
}
function flash() {
  const s = SH.seats[Math.floor(Math.random() * SH.seats.length)];
  SH.flashes.push({ x: s.x + 7, y: s.y - 12, t: SH.t, big: Math.random() < 0.25 });
  noise(0, 0.025, 0.18); tone(3200, 0, 0.02, 'square', 0.02);
}
function ding(score) { tone(440 + score * 70, 0, 0.16, 'triangle', 0.12); if (score >= 9) tone((440 + score * 70) * 1.5, 0.06, 0.16, 'triangle', 0.08); }
function oops() { tone(420, 0, 0.35, 'sine', 0.07, 240); noise(0, 0.25, 0.08); }
function fanfare() { [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.09, 0.18, 'square', 0.06)); }
function beatOn(on) {
  clearInterval(SH.beatTimer); if (!on) return;
  let n = 0;
  SH.beatTimer = setInterval(() => {
    if (!SH.on || SH.phase === 'end') return clearInterval(SH.beatTimer);
    const sp = SH.list[SH.cur] && !SH.list[SH.cur].user ? SH.speed : 1;
    if (n % 2 === 0) tone(110, 0, 0.14, 'sine', 0.22, 48); else noise(0, 0.03, 0.08);
    if (n % 8 === 4) tone(196, 0, 0.12, 'triangle', 0.06);
    n += sp;
  }, 250);
}

/* ---------- 조작 : 좌클릭 / 우클릭 / ← → / 터치 ---------- */
(function bindShowInput() {
  const box = $('#show-box');
  box.addEventListener('contextmenu', e => e.preventDefault());
  box.addEventListener('pointerdown', e => {
    if (!SH.on || SH.done) return;
    if (e.pointerType === 'mouse') { if (e.button === 0) lean(-1); else if (e.button === 2) lean(1); }
    else { const r = box.getBoundingClientRect(); lean(e.clientX - r.left < r.width / 2 ? -1 : 1); }
  });
  $('#sp-l').addEventListener('pointerdown', e => { e.preventDefault(); lean(-1); });
  $('#sp-r').addEventListener('pointerdown', e => { e.preventDefault(); lean(1); });
  window.addEventListener('keydown', e => {
    if (run.screen !== 'show' || !SH.on) return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); if (!e.repeat) lean(-1); }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); if (!e.repeat) lean(1); }
  });
})();
