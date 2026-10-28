/* ===== 말랑 옷장 : 화면 · 소리 · 옷장 · 상점 =====
   저장/불러오기는 save.js, 아이콘은 icons.js, 배경은 scene.js 에 있어요. */
const $ = s => document.querySelector(s);
const wait = ms => new Promise(r => setTimeout(r, ms));
const run = { screen: 'title', cid: null, outfit: {}, tab: 'hat', shopTab: 'hat', busy: false };
/* ---------- 소리 ---------- */
let actx = null;
function ac() {
  if (!S.sound) return null;
  try { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { actx = null; }
  return actx;
}
function tone(f, t, dur, type = 'sine', vol = 0.18, to = null) {
  const a = ac(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime + t;
  o.type = type; o.frequency.setValueAtTime(f, t0); if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination); o.start(t0); o.stop(t0 + dur + 0.05);
}
function noise(t, dur, vol = 0.3) {
  const a = ac(); if (!a) return;
  const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = buf; f.type = 'bandpass'; f.frequency.value = 1400; g.gain.value = vol;
  s.connect(f).connect(g).connect(a.destination); s.start(a.currentTime + t);
}
const sfx = {
  pop() { tone(660, 0, 0.09, 'triangle', 0.12, 990); },
  tab() { tone(520, 0, 0.07, 'sine', 0.1, 700); },
  no() { tone(300, 0, 0.12, 'square', 0.06, 220); },
  coin() { [988, 1319].forEach((f, i) => tone(f, i * 0.08, 0.18, 'square', 0.07)); },
  buy() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.07, 0.2, 'triangle', 0.12)); },
  clap(n = 3) { for (let i = 0; i < n; i++) noise(i * 0.16, 0.08, 0.5); },
  plop() { tone(240, 0, 0.12, 'sine', 0.2, 120); }
};
function chirp(cid, tier) {
  const v = CHARS[cid].voice, b = v.base;
  const pat = { love: [[1, 0.1], [1.26, 0.1], [1.5, 0.1], [2, 0.22]], like: [[1, 0.12], [1.33, 0.2]], meh: [[1, 0.16], [0.94, 0.16], [1, 0.22]], bad: [[1.2, 0.14], [0.85, 0.14], [0.62, 0.3]] }[tier];
  let t = 0; pat.forEach(([m, d], i) => { tone(b * m, t, d, v.wave, 0.13, tier === 'bad' && i === 2 ? b * 0.45 : null); t += d * 0.9; });
}
/* 일본어 음성
   - 기기에 일본어 음성이 없으면 다른 언어 음성이 일본어를 읽어서 깨져 들려요 → 그때는 효과음만 내요
   - 기기 내장 음성을 먼저 써요 (인터넷 음성은 끊기기 쉬워요)
   - 효과음이 끝난 뒤에 말하게 해서 소리가 겹쳐 지직거리지 않게 해요
   - 재생 중인 음성 객체를 붙잡아 둬서 크롬에서 말이 중간에 끊기지 않게 해요 */
let jaVoice = null, voiceWarned = false, curUtter = null;
function pickVoice() {
  try {
    const vs = speechSynthesis.getVoices().filter(v => /^ja([-_]|$)/i.test(v.lang));
    jaVoice = vs.find(v => v.localService && /Kyoko|O-ren|Otoya|Hattori|Haruka|Ayumi|Ichiro|Sayaka|Nanami/i.test(v.name))
      || vs.find(v => v.localService) || vs[0] || null;
  } catch (e) { jaVoice = null; }
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.addEventListener?.('voiceschanged', pickVoice); }
const cleanJp = t => t.replace(/[〜~]/g, 'ー').replace(/…+/g, '、').replace(/、$/, '');
function speak(cid, text, delay = 0) {
  if (!S.sound || !('speechSynthesis' in window)) return;
  if (!jaVoice) pickVoice();
  if (!jaVoice) {
    if (!voiceWarned) { voiceWarned = true; toast('이 기기에는 일본어 음성이 없어서 효과음으로만 대답해요.'); }
    return;
  }
  const ss = speechSynthesis, v = CHARS[cid].voice;
  const go = () => {
    try {
      const u = new SpeechSynthesisUtterance(cleanJp(text));
      u.voice = jaVoice; u.lang = jaVoice.lang; u.pitch = v.pitch; u.rate = v.rate; u.volume = 1;
      curUtter = u; u.onend = u.onerror = () => { if (curUtter === u) curUtter = null; };
      if (ss.paused) ss.resume();
      ss.speak(u);
    } catch (e) { }
  };
  if (ss.speaking || ss.pending) { ss.cancel(); setTimeout(go, delay + 150); } else setTimeout(go, delay);
}

/* ---------- 공통 ---------- */
let toastTimer;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; t.style.animation = 'none'; t.offsetWidth; t.style.animation = ''; clearTimeout(toastTimer); toastTimer = setTimeout(() => t.hidden = true, 2400); }
function setCoins(pop) { $('#coin-num').textContent = S.coins.toLocaleString('ko-KR'); if (pop) { const c = $('#coins'); c.classList.remove('pop'); c.offsetWidth; c.classList.add('pop'); } }
function drawLevel(pop) {
  const need = xpNeed(S.level);
  $('#lv-num').textContent = 'Lv.' + S.level;
  $('#lv-bar').style.width = Math.min(100, S.xp / need * 100) + '%';
  $('#lv').title = `레벨 ${S.level} · 다음 레벨까지 경험치 ${need - Math.floor(S.xp)}`;
  if (pop) { const c = $('#lv'); c.classList.remove('pop'); c.offsetWidth; c.classList.add('pop'); }
}
function drawSaveStatus() {
  const el = $('#save-status'); if (!el) return;
  if (!saveInfo.ok) { el.textContent = '저장 안 됨 (이 브라우저가 저장을 막았어요)'; el.classList.add('bad'); return; }
  el.classList.remove('bad');
  const d = new Date(saveInfo.at || Date.now());
  el.textContent = `자동 저장됨 · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}
function refreshHud() { setCoins(); drawTickets(); drawLevel(); drawSaveLine(); }
function drawSaveLine() {
  const el = $('#save-line'); if (!el) return;
  const own = ITEMS.filter(i => S.owned.has(i.id)).length;
  if (saveInfo.loaded || S.plays > 0) {
    el.innerHTML = `${DISK}<span>저장된 기록 · Lv.${S.level} · 조개 ${S.coins.toLocaleString('ko-KR')} · 옷 ${own}/${ITEMS.length}</span>`;
    $('#btn-start').textContent = '이어하기';
  } else { el.innerHTML = `${DISK}<span>진행 상황은 이 브라우저에 자동으로 저장돼요</span>`; $('#btn-start').textContent = '게임 시작'; }
}
function soundIcon() { const b = $('#btn-sound'); b.innerHTML = S.sound ? ICON_ON : ICON_OFF; b.setAttribute('aria-label', S.sound ? '소리 끄기' : '소리 켜기'); }
const fmtTime = ms => { const t = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
function regen() {
  const now = Date.now();
  if (S.tickets >= TICKET_CAP) { S.tickAt = now; return; }
  const n = Math.floor((now - S.tickAt) / TICKET_MS);
  if (n > 0) {
    S.tickets = Math.min(TICKET_CAP, S.tickets + n); S.tickAt += n * TICKET_MS;
    if (S.tickets >= TICKET_CAP) S.tickAt = now;
    save(); popTix();
  }
}
function popTix() { const c = $('#tix'); c.classList.remove('pop'); c.offsetWidth; c.classList.add('pop'); }
function drawTickets() {
  $('#tix-num').textContent = S.tickets;
  const full = S.tickets >= TICKET_CAP, left = TICKET_MS - (Date.now() - S.tickAt);
  $('#tix-time').textContent = full ? '' : fmtTime(left);
  $('#tix').title = full ? '코디 티켓 (자동 충전은 10장까지)' : `코디 티켓 · ${fmtTime(left)} 뒤 1장 충전`;
  if (run.busy) return;
  const jb = $('#btn-judge');
  if (S.tickets > 0) {
    jb.disabled = false; jb.textContent = '평가 받기';
    $('#jn-text').innerHTML = `티켓 1장을 써요 · 남은 티켓 <b>${S.tickets}</b>장`; $('#btn-mini3').hidden = true;
  } else {
    jb.disabled = true; jb.textContent = '티켓이 없어요';
    $('#jn-text').innerHTML = `다음 티켓까지 <b>${fmtTime(left)}</b>`; $('#btn-mini3').hidden = false;
  }
}
setInterval(() => { regen(); drawTickets(); }, 1000);
const TITLES = { select: '누구에게 옷을 입혀 볼까?', shop: '조개 상점', mini: '돌 피하기', games: '미니게임', rhythm: '파도 리듬', show: '레드카펫 패션쇼' };
function show(name) {
  run.screen = name;
  for (const s of ['title', 'select', 'dress', 'shop', 'mini', 'games', 'rhythm', 'show']) $('#scr-' + s).hidden = s !== name;
  $('#bar').hidden = name === 'title';
  $('#bar-title').textContent = name === 'dress' ? `${CHARS[run.cid].name}의 옷장` : TITLES[name] || '';
  $('#btn-back').textContent = name === 'select' ? '처음으로' : name === 'dress' ? '캐릭터 선택' : '돌아가기';
  setCoins(); drawTickets(); drawLevel();
  if (name === 'title') drawSaveLine();
  window.scrollTo(0, 0);
  if (name === 'title') startPoops(); else stopPoops();
}
$('#btn-back').onclick = () => {
  sfx.tab();
  if (run.screen === 'select') show('title');
  else if (run.screen === 'dress') { if (!run.busy) openSelect(); }
  else if (run.screen === 'shop') run.cid ? openDress(run.cid) : openSelect();
  else if (run.screen === 'mini') miniBack();
  else if (run.screen === 'show') showBack();
  else if (run.screen === 'games') gamesBack();
  else if (run.screen === 'rhythm') { if (RG.on && !RG.over && !$('#rh-play').hidden) endRhythm(); else if (!$('#rh-play').hidden) drawRhythmIntro(); else openGames(); }
};
$('#btn-sound').onclick = () => { S.sound = !S.sound; if (!S.sound && 'speechSynthesis' in window) speechSynthesis.cancel(); soundIcon(); save(); sfx.pop(); };

/* ---------- 타이틀 ---------- */
function initIcons() {
  $('#tix-ic').innerHTML = TICKET; $('#coin-ic').innerHTML = SHELL;
  $('#mp-l').innerHTML = ARROW_L; $('#mp-r').innerHTML = ARROW_R;
  document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = { ticket: TICKET, shell: SHELL, disk: DISK, star: FX.star }[el.dataset.icon] || ''; });
}
function initTitle() {
  pxScene($('#scene-cv'), 'title');
  pxScene($('#stage-cv'), 'stage');
  $('#t-otter').innerHTML = renderChar('otter', { hat: 'h_sailor' });
  $('#t-fox').innerHTML = renderChar('fox', { hat: 'h_beret' });
  $('#t-seal').innerHTML = renderChar('seal', { hat: 'h_cap' });
  $('#t-wombat').innerHTML = renderChar('wombat', { hat: 'h_beanie' });
  $('#t-hamster').innerHTML = renderChar('hamster', { hat: 'h_ribbon' });
}
let poopTimer = null;
function dropCube(boxEl, sceneEl) {
  if (!boxEl || !sceneEl) return;
  const r = boxEl.querySelector('svg').getBoundingClientRect(), sr = sceneEl.getBoundingClientRect();
  const flipped = getComputedStyle(boxEl.querySelector('.flip')).transform.startsWith('matrix(-1');
  const c = document.createElement('div'); c.className = 'cube';
  c.style.left = (r.left - sr.left + r.width * (flipped ? 0.78 : 0.2)) + 'px';
  c.style.top = (r.top - sr.top + r.height * 0.86) + 'px';
  sceneEl.appendChild(c); setTimeout(() => c.remove(), 4600);
}
function startPoops() { stopPoops(); poopTimer = setInterval(() => dropCube($('#t-wombat-box'), $('#scene')), 3800); }
function stopPoops() { clearInterval(poopTimer); }
function unlockSpeech() {
  // iOS·안드로이드는 첫 음성을 사용자가 누른 순간에 내야 이후 음성이 나와요
  try { if ('speechSynthesis' in window && !unlockSpeech.done) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; u.lang = 'ja-JP'; speechSynthesis.speak(u); unlockSpeech.done = true; pickVoice(); } } catch (e) { }
}
document.addEventListener('pointerdown', () => { ac(); unlockSpeech(); }, { once: true });
$('#btn-start').onclick = () => { ac(); unlockSpeech(); sfx.buy(); openSelect(); };
$('#btn-show-title').onclick = () => { ac(); unlockSpeech(); sfx.buy(); openShow('title'); };
$('#btn-show-sel').onclick = () => { sfx.pop(); openShow('select'); };
$('#btn-show-back').onclick = () => { if (run.busy) return; sfx.pop(); openShow(); };
$('#btn-mini-title').onclick = () => { ac(); unlockSpeech(); sfx.pop(); openGames('title'); };
$('#btn-mini-sel').onclick = () => { sfx.pop(); openGames('select'); };
$('#btn-mini1').onclick = () => { if (!run.busy) { sfx.pop(); openGames('dress'); } };
$('#btn-mini3').onclick = () => { sfx.pop(); openGames('dress'); };

/* ---------- 미니게임 고르기 ---------- */
let gamesFrom = 'title';
function openGames(from) {
  if (from) gamesFrom = from;
  if (typeof stopMini === 'function') stopMini();
  if (typeof stopRhythm === 'function') stopRhythm();
  const left = CHAR_ORDER.filter(c => !playedToday(c)).length, rs = rhythmState();
  const got = MILESTONES.filter(m => rs.claimed.includes(m)).length;
  $('#gc-dodge-sub').textContent = left ? `오늘 ${left} / ${CHAR_ORDER.length}번 남았어요` : `오늘은 다 했어요 · ${untilMidnight()} 뒤에 다시`;
  $('#gc-rhythm-sub').textContent = `목표 티켓 ${got} / ${MILESTONES.length}장 받음 · 최고 ${rs.best.toLocaleString('ko-KR')}점`;
  $('#gc-dodge').classList.toggle('spent', !left);
  $('#gc-dodge-art').innerHTML = renderChar('seal', {});
  $('#gc-rhythm-art').innerHTML = renderChar('hamster', { hat: 'h_cap' });
  show('games');
}
function gamesBack() {
  if (gamesFrom === 'dress' && run.cid) openDress(run.cid);
  else if (gamesFrom === 'select') openSelect();
  else show('title');
}
$('#gc-dodge').onclick = () => { sfx.pop(); openMini('games'); };
$('#gc-rhythm').onclick = () => { sfx.pop(); openRhythm('games'); };

/* ---------- 캐릭터 선택 ---------- */
function openSelect() {
  run.showReturn = false;
  $('#cards').innerHTML = CHAR_ORDER.map(cid => {
    const c = CHARS[cid];
    return `<button class="card" type="button" data-c="${cid}">
      <div class="pic">${renderChar(cid, outfits[cid] || {})}</div>
      <h3>${c.name}<small>${c.species}</small></h3>
      <p class="intro">${c.intro}</p>
      <dl><dt>좋아해</dt><dd>${c.likeText}</dd><dt class="no">싫어해</dt><dd>${c.dislikeText}</dd></dl>
      <div class="best">${S.best[cid] != null ? `최고 점수 ${S.best[cid]}점` : '아직 평가 전'}</div>
    </button>`;
  }).join('');
  document.querySelectorAll('#cards .card').forEach(el => el.onclick = () => { sfx.pop(); openDress(el.dataset.c); });
  const left = CHAR_ORDER.filter(c => !playedToday(c)).length;
  $('#mini-sel-sub').textContent = left ? `오늘 ${left}번 더 할 수 있어요` : '오늘 기회를 다 썼어요. 내일 다시 만나요';
  show('select');
}

/* ---------- 옷 입히기 ---------- */
function openDress(cid) {
  run.cid = cid;
  run.outfit = Object.fromEntries(Object.entries(outfits[cid] || {}).filter(([, id]) => id && S.owned.has(id)));
  const c = CHARS[cid];
  $('#taste').innerHTML = `<b>${c.name}의 취향</b><dt>좋아해</dt><dd>${c.likeText}</dd><dt class="no">싫어해</dt><dd>${c.dislikeText}</dd>`;
  resetStage();
  drawChar(); drawTabs(); drawGrid();
  $('#btn-show-back').hidden = !run.showReturn;
  show('dress');
}
function drawChar() { $('#chr').innerHTML = renderChar(run.cid, run.outfit); }
function drawTabs() {
  $('#tabs').innerHTML = SLOTS.map(s => {
    const own = ITEMS.filter(i => i.slot === s && S.owned.has(i.id)).length, all = ITEMS.filter(i => i.slot === s).length;
    return `<button class="tab" role="tab" type="button" data-s="${s}" aria-selected="${s === run.tab}">${SLOT_LABEL[s]}<span class="cnt">${own}/${all}</span></button>`;
  }).join('');
  document.querySelectorAll('#tabs .tab').forEach(b => b.onclick = () => { run.tab = b.dataset.s; sfx.tab(); drawTabs(); drawGrid(); const g = $('#tabs'); if (g.getBoundingClientRect().top < 70 && window.matchMedia('(max-width: 760px)').matches) g.scrollIntoView({ block: 'start' }); });
}
function drawGrid() {
  const list = ITEMS.filter(i => i.slot === run.tab);
  $('#grid').innerHTML = list.map(it => {
    const own = S.owned.has(it.id), on = run.outfit[it.slot] === it.id;
    return `<button class="tile${on ? ' on' : ''}${own ? '' : ' locked'}" type="button" data-id="${it.id}" aria-pressed="${on}" aria-label="${it.name}${own ? '' : ' (잠김)'}">
      ${renderThumb(it)}${own ? '' : `<span class="lock">${LOCK}${it.price}</span>`}<span class="nm">${it.name}</span></button>`;
  }).join('');
  document.querySelectorAll('#grid .tile').forEach(b => b.onclick = () => tapItem(ITEM[b.dataset.id]));
  const owned = list.filter(i => S.owned.has(i.id)).length;
  $('#foot-msg').textContent = owned === 0 ? `${SLOT_LABEL[run.tab]}은 아직 하나도 없어요. 상점에서 첫 ${SLOT_LABEL[run.tab]}을 열어 보세요.` : '입은 옷을 한 번 더 누르면 벗어요. 잠긴 옷은 상점에서 열 수 있어요.';
}
function tapItem(it) {
  if (run.busy) return;
  if (!S.owned.has(it.id)) { sfx.no(); toast(`${it.name}은 상점에서 ${it.price} 조개로 열 수 있어요.`); return; }
  if (run.outfit[it.slot] === it.id) delete run.outfit[it.slot]; else run.outfit[it.slot] = it.id;
  outfits[run.cid] = { ...run.outfit }; save();
  sfx.pop(); drawChar(); drawGrid();
  const w = $('#chr'); w.classList.remove('react-like'); w.offsetWidth; w.classList.add('react-like'); setTimeout(() => w.classList.remove('react-like'), 500);
}
function resetStage() {
  run.busy = false;
  $('#result').hidden = true; $('#closet').classList.remove('showing'); $('#bubble').hidden = true; $('#stage-actions').hidden = false; $('#fx').innerHTML = '';
  $('#chr').className = 'chr-wrap'; $('#closet').classList.remove('busy');
}

function burst(tier) {
  const fx = $('#fx'), W = fx.clientWidth, H = fx.clientHeight;
  fx.innerHTML = '';
  const add = (cls, svg, x, y, delay) => { const s = document.createElement('span'); s.className = cls; s.innerHTML = svg; s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.animationDelay = delay + 'ms'; s.style.opacity = 0; s.style.animationFillMode = 'both'; fx.appendChild(s); };
  if (tier === 'love') for (let i = 0; i < 10; i++) add('heart', FX.heart, W * (0.2 + Math.random() * 0.6), H * (0.45 + Math.random() * 0.3), i * 120);
  if (tier === 'love' || tier === 'like') for (let i = 0; i < 7; i++) add('spark', FX.spark, W * (0.15 + Math.random() * 0.7), H * (0.25 + Math.random() * 0.45), i * 150);
  if (tier === 'meh') add('drop', FX.drop, W * 0.62, H * 0.42, 200);
  if (tier === 'bad') add('cloudy', FX.cloud, W / 2 - 45, H * 0.2, 0);
}
function poopOnStage() {
  const fx = $('#fx'), svg = $('#chr svg'); if (!svg) return;
  const r = svg.getBoundingClientRect(), sr = fx.getBoundingClientRect();
  [0, 260, 520].forEach((d, i) => setTimeout(() => {
    const c = document.createElement('div'); c.className = 'cube';
    c.style.left = (r.left - sr.left + r.width * (0.64 + i * 0.06)) + 'px'; c.style.top = (r.top - sr.top + r.height * 0.9) + 'px';
    fx.appendChild(c); sfx.plop();
  }, d));
}
function seedBurst() {
  const fx = $('#fx'), svg = $('#chr svg'); if (!svg) return;
  const r = svg.getBoundingClientRect(), sr = fx.getBoundingClientRect();
  for (let i = 0; i < 8; i++) {
    const s = document.createElement('span'); s.className = 'seed';
    const side = i % 2 ? 1 : -1;
    s.style.left = (r.left - sr.left + r.width * (0.5 + side * 0.24)) + 'px'; s.style.top = (r.top - sr.top + r.height * 0.42) + 'px';
    s.style.setProperty('--dx', (side * (30 + Math.random() * 70)) + 'px'); s.style.setProperty('--dy', (-40 - Math.random() * 70) + 'px');
    s.style.animationDelay = (i * 60) + 'ms';
    fx.appendChild(s); setTimeout(() => s.remove(), 1600);
  }
  [0, 120, 240].forEach(d => setTimeout(() => sfx.pop(), d));
}
function countUp(el, to, ms, prefix = '') {
  return new Promise(res => {
    const t0 = performance.now();
    const step = t => { const k = Math.min(1, (t - t0) / ms), v = Math.round(to * (1 - Math.pow(1 - k, 3))); el.textContent = prefix + v; k < 1 ? requestAnimationFrame(step) : res(); };
    requestAnimationFrame(step);
  });
}
const VERDICT = { love: '완전 마음에 들어!', like: '꽤 좋아!', meh: '그냥 그래…', bad: '이건 싫어!' };

async function judge() {
  if (run.busy) return;
  regen();
  if (S.tickets < 1) { sfx.no(); toast('티켓이 없어요. 조금 기다리거나 미니게임으로 티켓을 얻어 보세요.'); drawTickets(); return; }
  S.tickets--; save(); drawTickets(); popTix();
  run.busy = true; ac();
  const cid = run.cid, c = CHARS[cid];
  const r = scoreOutfit(cid, run.outfit), tier = tierOf(r.total);
  const key = outfitKey(cid, run.outfit), repeated = !!S.seen[key];
  $('#closet').classList.add('busy'); $('#stage-actions').hidden = true;

  // 1) 캐릭터 반응 + 목소리
  const w = $('#chr');
  w.className = 'chr-wrap react-' + tier;
  if (cid === 'seal' && (tier === 'love' || tier === 'like')) { w.classList.add('clap'); sfx.clap(tier === 'love' ? 5 : 3); }
  if (cid === 'fox' && tier !== 'bad') w.classList.add('wag');
  if (cid === 'otter' && tier === 'love') w.classList.add('spin');
  const line = repeated && tier !== 'love' ? c.lines.again : c.lines[tier];
  $('#b-jp').textContent = line[0]; $('#b-kr').textContent = line[1]; $('#bubble').hidden = false;
  burst(tier); chirp(cid, tier);
  speak(cid, line[0], cid === 'seal' && (tier === 'love' || tier === 'like') ? 900 : 520);
  if (cid === 'wombat' && tier === 'love') setTimeout(poopOnStage, 900);
  if (cid === 'hamster' && (tier === 'love' || tier === 'like')) { w.classList.add('puff'); if (tier === 'love') setTimeout(seedBurst, 500); }

  // 2) 점수 발표
  await wait(1700);
  $('#closet').classList.add('showing'); $('#result').hidden = false; $('#r-reward').hidden = true; $('#r-actions').hidden = true;
  if (window.matchMedia('(max-width: 760px)').matches) setTimeout(() => $('#result').scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  $('#r-verdict').textContent = VERDICT[tier];
  ['h', 't', 'b'].forEach(k => { $('#m-' + k).style.width = '0'; $('#v-' + k).textContent = '0'; });
  const wt = $('#r-wait'); wt.hidden = false; wt.classList.remove('run');
  await wait(60);
  const parts = { h: r.harmony, t: r.taste, b: r.balance };
  for (const k in parts) { $('#m-' + k).style.width = Math.round(parts[k] * 100) + '%'; countUp($('#v-' + k), Math.round(parts[k] * 100), 900); }
  await countUp($('#r-score'), r.total, 1000);
  tone(tier === 'bad' ? 330 : 880, 0, 0.15, 'triangle', 0.12);

  // 3) 정산
  await wait(500);
  const reward = rewardFor(r.total, repeated);
  S.coins += reward; S.seen[key] = (S.seen[key] || 0) + 1; S.plays++;
  const newBest = S.best[cid] == null || r.total > S.best[cid];
  if (newBest) S.best[cid] = r.total;
  save();
  $('#r-reward').hidden = false;
  const notes = [];
  if (r.total >= 90) notes.push('90점 이상 보너스 +20');
  if (repeated) notes.push('같은 코디를 또 보여줘서 보상이 30%로 줄었어요');
  if (newBest) notes.push(`${c.name}의 최고 기록!`);
  $('#r-note').textContent = notes.join(' · ');
  sfx.coin(); await countUp($('#r-coins'), reward, 700, '+'); setCoins(true);
  $('#r-xp').textContent = '+' + r.total; gainXp(r.total);

  // 4) 몇 초 뒤 버튼 열기
  wt.offsetWidth; wt.classList.add('run');
  await wait(2500);
  wt.hidden = true; $('#r-actions').hidden = false; $('#btn-again').focus({ preventScroll: true });
}
$('#btn-judge').onclick = judge;
$('#btn-again').onclick = () => { sfx.pop(); resetStage(); drawChar(); drawTabs(); drawGrid(); };
$('#btn-rechar').onclick = () => { sfx.pop(); resetStage(); openSelect(); };
const toShop = () => { sfx.pop(); resetStage(); openShop(); };
$('#btn-shop2').onclick = toShop;
$('#btn-shop1').onclick = () => { if (!run.busy) toShop(); };

/* ---------- 상점 ---------- */
function nextFor(slot) { return ITEMS.find(i => i.slot === slot && !S.owned.has(i.id)) || null; }
function openShop() { run.shopTab = run.shopTab || 'hat'; drawShop(); show('shop'); }
function drawShop() {
  const total = ITEMS.length, own = ITEMS.filter(i => S.owned.has(i.id)).length;
  $('#prog-text').textContent = `모은 옷 ${own} / ${total}`; $('#prog-bar').style.width = (own / total * 100) + '%';
  $('#shop-tabs').innerHTML = SLOTS.map(s => {
    const n = nextFor(s);
    return `<button class="tab" role="tab" type="button" data-s="${s}" aria-selected="${s === run.shopTab}">${SLOT_LABEL[s]}<span class="cnt">${n ? n.price : '완료'}</span></button>`;
  }).join('');
  document.querySelectorAll('#shop-tabs .tab').forEach(b => b.onclick = () => { run.shopTab = b.dataset.s; sfx.tab(); drawShop(); });
  const next = nextFor(run.shopTab), likeOf = run.cid ? CHARS[run.cid].likes : [];
  $('#shop-list').innerHTML = ITEMS.filter(i => i.slot === run.shopTab).map(it => {
    const own = S.owned.has(it.id), isNext = next && next.id === it.id, can = isNext && S.coins >= it.price;
    let action;
    if (own) action = `<span class="state">${it.price === 0 ? '처음부터 가진 옷' : '보유 중'}</span>`;
    else if (isNext) action = `<button class="btn ${can ? 'btn-hot' : ''}" type="button" data-buy="${it.id}" ${can ? '' : 'disabled'}>열기</button><span class="state">${can ? '지금 열 수 있어요' : `조개 ${it.price - S.coins}개 더 필요해요`}</span>`;
    else action = `<span class="state">앞의 옷을 먼저 열어야 해요</span>`;
    return `<li class="row${own ? ' owned' : ''}${!own && !isNext ? ' dim' : ''}">
      <div class="th">${renderThumb(it)}</div>
      <div><h4>${it.name}</h4><div class="chips">${it.tags.map(t => `<span class="chip${likeOf.includes(t) ? ' like' : ''}">${TAG_LABEL[t]}</span>`).join('')}</div></div>
      <div class="buy"><span class="price">${SHELL}${it.price}</span>${action}</div></li>`;
  }).join('');
  document.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => buy(ITEM[b.dataset.buy]));
}
function buy(it) {
  if (S.owned.has(it.id) || S.coins < it.price) return;
  S.coins -= it.price; S.owned.add(it.id); save();
  sfx.buy(); setCoins(true); toast(`${it.name}을(를) 열었어요!`); drawShop();
}
function resetPrompt() {
  $('#reset-area').innerHTML = `<span class="confirm">모든 조개와 옷이 사라져요. 정말 처음부터 할까요? <button class="btn" id="rs-yes" type="button">네, 초기화</button><button class="btn btn-mint" id="rs-no" type="button">아니요</button></span>`;
  $('#rs-no').onclick = drawResetLink;
  $('#rs-yes').onclick = () => {
    wipeSave(); refreshHud(); drawShop(); drawResetLink(); toast('처음 상태로 돌아갔어요.');
  };
}
$('#btn-save-now').onclick = () => { sfx.pop(); if (save()) toast('지금 상태를 저장했어요.'); };
function drawResetLink() { $('#reset-area').innerHTML = `<button class="linkish" id="btn-reset" type="button">처음부터 다시 하기</button>`; $('#btn-reset').onclick = resetPrompt; }
drawResetLink();

