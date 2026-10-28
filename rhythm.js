/* ===== 파도 리듬 : Q W E SPACE 리듬게임 =====
   계산은 360×540 좌표, 그림은 절반 크기(180×270) 도트 캔버스에 그려요.
   점수가 오를수록 레벨이 올라가서 BPM·스크롤 속도·노트 밀도가 같이 올라가요. */
const RW = 360, RH = 540, HIT_Y = 468;
const LANES = [
  { code: 'KeyQ', label: 'Q', x: 16, w: 74, col: '#f49ab0' },
  { code: 'KeyW', label: 'W', x: 94, w: 74, col: '#8fd8b6' },
  { code: 'KeyE', label: 'E', x: 172, w: 74, col: '#8cc8f0' },
  { code: 'Space', label: 'SPACE', x: 250, w: 94, col: '#f6cf5a' }
];
const LV_AT = [0, 1650, 4400, 8250, 13200, 19800, 27500, 36300, 46200, 57200]; // 난이도 조정(-10%)
const MILESTONES = [2000, 5000, 10000, 18000, 30000, 45000];
// 난이도 조정(-10%): 판정 범위를 10% 넓혔어요
const JUDGE = [{ name: 'PERFECT', win: 0.05, pts: 100, col: '#fff3a6' }, { name: 'GREAT', win: 0.1, pts: 70, col: '#a8f0d2' }, { name: 'GOOD', win: 0.15, pts: 40, col: '#bcdcff' }];
/* ---------- 노래 3곡 (직접 작곡한 칩튠) ----------
   한 마디 = 16칸(16분음표). 멜로디 숫자는 lead 음에서 몇 반음 위인지, '.' 은 쉼표.
   노트(리듬 박스)는 이 멜로디와 킥 드럼이 실제로 울리는 칸에서만 만들어져요.
   bass 글자: r=근음 o=한 옥타브 위 f=5도 b=단7도 t=코드의 3도 */
const SONGS = [
  {
    id: 'surf', name: '파도타기 서프', mood: '달리는 서프 록', bpm: 128, root: 52, lead: 64, wave: 'square',
    prog: [[0, 'm'], [-4, 'M'], [3, 'M'], [-2, 'M']],
    arr: ['A', 'A', 'B', 'B'],
    mel: {
      A: ['12 . 10 . 7 . 10 . 12 . 15 . 14 . 12 .', '12 . 10 . 8 . 7 . . . 8 . 10 . . .', '7 . 10 . 14 . 15 . 14 . 10 . 7 . 10 .', '14 . 12 . 10 . 14 . 17 . . . 14 . . .'],
      B: ['19 . . 19 . . 17 . 19 . 22 . 19 . 17 .', '20 . . 19 . . 15 . 12 . 15 . 19 . . .', '19 . . 15 . . 14 . 15 . 19 . 22 . 19 .', '17 . 14 . 10 . 14 . 17 . . . 22 . . .']
    },
    drums: {
      A: { k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', o: '................' },
      B: { k: 'x.....x.x.x.....', s: '....x.......x..x', h: 'xxxxxxxxxxxxxxxx', o: '..............x.' }
    },
    bass: { A: 'r.r.o.r.r.r.o.f.', B: 'r.ror.o.r.ror.f.' },
    arp: { A: 0, B: 16 }
  },
  {
    id: 'funk', name: '조개껍데기 펑크', mood: '통통 튀는 펑크', bpm: 112, root: 55, lead: 55, wave: 'square',
    prog: [[0, '7'], [0, '7'], [5, '7'], [-5, '7']],
    arr: ['A', 'A', 'B', 'B'],
    mel: {
      A: ['12 . . 10 . 12 . . 15 . 12 . 10 . 7 .', '10 . 12 . . 7 . . 5 . 7 . . . . .', '17 . . 15 . 17 . . 19 . 17 . 15 . 12 .', '14 . 12 . 14 . . 17 . . 19 . . 17 . .'],
      B: ['24 . 22 . 19 . 22 . . 19 . . 17 . 19 .', '15 . 17 . . 19 . . 22 . . 19 . . . .', '17 . 17 . 19 . 22 . 24 . . 22 . 17 . .', '26 . 24 . 22 . . 19 . 17 . 14 . 12 . .']
    },
    drums: {
      A: { k: 'x.....x...x.....', s: '....x..g....x..g', h: 'xxxxxxxxxxxxxxxx', o: '................' },
      B: { k: 'x.....x...x..x..', s: '....x..g....x..g', h: 'xxxxxxxxxxxxxxxx', o: '......x.......x.' }
    },
    bass: { A: 'r..o..rb..r..fo.', B: 'r.ro..rb.rr..fo.' },
    arp: { A: 0, B: 'stab' }
  },
  {
    id: 'disco', name: '여름밤 디스코', mood: '반짝이는 디스코 팝', bpm: 120, root: 57, lead: 57, wave: 'square',
    prog: [[0, 'm'], [-4, 'M'], [3, 'M'], [-2, 'M']],
    arr: ['A', 'A', 'B', 'B'],
    mel: {
      A: ['12 . 12 . 15 . 12 . 19 . 17 . 15 . 12 .', '12 . . 15 . . 17 . 20 . 19 . 17 . 15 .', '15 . 15 . 19 . 15 . 22 . 19 . 17 . 15 .', '14 . 14 . 17 . 19 . 22 . . . 19 . . .'],
      B: ['24 . . 24 . . 22 . 24 . . 27 . . 24 .', '20 . . 20 . . 19 . 20 . . 24 . . 20 .', '19 . . 19 . . 17 . 19 . . 22 . . 19 .', '22 . 22 . 24 . 22 . 19 . 17 . 14 . . .']
    },
    drums: {
      A: { k: 'x...x...x...x...', s: '....x.......x...', h: '................', o: '..x...x...x...x.' },
      B: { k: 'x...x...x...x...', s: '....x.......x...', h: 'x.xxx.xxx.xxx.xx', o: '..x...x...x...x.' }
    },
    bass: { A: 'r.o.r.o.r.o.r.o.', B: 'roror.o.roror.o.' },
    arp: { A: 8, B: 16 }
  }
];
const BASS_OFF = { r: 0, o: 12, f: 7, b: 10 };
const parseBar = str => str.trim().split(/\s+/).map(t => (t === '.' ? null : Number(t)));
for (const sg of SONGS) for (const k in sg.mel) sg.mel[k] = sg.mel[k].map(parseBar);
const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
let lastSongId = null;
const rnow = () => performance.now() / 1000;
const levelOf = sc => { let l = 1; LV_AT.forEach((t, i) => { if (sc >= t) l = i + 1; }); return l; };

const RG = { on: false };
let rcv = null, rctx = null, rraf = 0, rFrom = 'games';

function rhythmState() { if (!S.rhythm) S.rhythm = { best: 0, claimed: [] }; return S.rhythm; }
function openRhythm(from) {
  rFrom = from || rFrom; stopRhythm();
  drawRhythmIntro(); show('rhythm');
}
function drawRhythmIntro() {
  const st = rhythmState();
  $('#rh-intro').hidden = false; $('#rh-play').hidden = true;
  $('#rh-best').textContent = st.best.toLocaleString('ko-KR');
  $('#rh-goals').innerHTML = MILESTONES.map(m => {
    const got = st.claimed.includes(m);
    return `<li class="${got ? 'got' : ''}"><span class="g-pt">${m.toLocaleString('ko-KR')}점</span><span class="g-rw">${TICKET}<b>+1</b></span><span class="g-st">${got ? '받음' : '도전'}</span></li>`;
  }).join('');
  const left = MILESTONES.filter(m => !st.claimed.includes(m)).length;
  $('#rh-left').textContent = left ? `아직 받을 수 있는 티켓 ${left}장` : '목표 티켓을 모두 받았어요. 최고 점수에 도전해 보세요!';
}
$('#rh-start').onclick = () => { sfx.pop(); startRhythm(); };

function startRhythm() {
  ac(); unlockSpeech();
  if (document.activeElement) document.activeElement.blur();
  const pool = SONGS.filter(sg => sg.id !== lastSongId), song = pool[Math.floor(Math.random() * pool.length)];
  lastSongId = song.id;
  const t0 = rnow() + 0.5, bpm = song.bpm;
  Object.assign(RG, {
    on: true, over: false, paused: false, score: 0, combo: 0, maxCombo: 0, hp: 10, level: 1,
    counts: { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 }, earned: 0, notes: [], fx: [], press: [0, 0, 0, 0],
    song, bpm, speed: 300, step: 0, stepT: t0 + 4 * 60 / bpm, beatT: t0, beat: -4, lastLane: 1, lastPitch: null, lastNoteStep: -99,
    aq: [], judge: null, pop: null, flash: 0, startT: t0 + 4 * 60 / bpm, dancerBeat: 0, pauseAt: 0
  });
  const bus = rBus(); if (bus) { bus.master.gain.cancelScheduledValues(0); bus.master.gain.value = 0.9; bus.dly.delayTime.value = 45 / bpm; }
  $('#rs-song').textContent = song.name; $('#rs-mood').textContent = song.mood;
  $('#rh-intro').hidden = true; $('#rh-play').hidden = false; $('#rh-over').hidden = true;
  $('#rh-dancer').innerHTML = renderChar(run.cid || 'hamster', outfits[run.cid || 'hamster'] || {});
  rcv = $('#rh-cv'); rctx = rcv.getContext('2d');
  rcv.width = RGW; rcv.height = RGH; rctx.imageSmoothingEnabled = false;
  rhBg();
  $('#rh-dancer-big').innerHTML = renderChar(run.cid || 'hamster', outfits[run.cid || 'hamster'] || {});
  rhHud(true);
  cancelAnimationFrame(rraf); rraf = requestAnimationFrame(rLoop);
  window.scrollTo(0, 0);
}
function stopRhythm() { RG.on = false; cancelAnimationFrame(rraf); }

/* ---------- 오디오 ----------
   소리는 0.15초 앞까지만 미리 예약해요. 그래서 일시정지하면 음악도 바로 멈추고,
   노트와 소리가 같은 시계(rnow)를 써서 박자가 딱 맞물려요. */
function audioAt(t) { const a = ac(); if (!a) return null; const lat = (a.outputLatency || a.baseLatency || 0); return Math.max(a.currentTime, a.currentTime + (t - rnow()) - lat); }
function rBus() {
  const a = ac(); if (!a) return null;
  if (RG.bus && RG.bus.a === a) return RG.bus;
  const comp = a.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.connect(a.destination);
  const master = a.createGain(); master.gain.value = 0.9; master.connect(comp);
  const mel = a.createGain(); mel.connect(master);
  const dly = a.createDelay(1), fb = a.createGain(), wet = a.createGain();
  fb.gain.value = 0.28; wet.gain.value = 0.2; dly.delayTime.value = 0.35;
  mel.connect(dly); dly.connect(fb); fb.connect(dly); dly.connect(wet); wet.connect(master);
  const nb = a.createBuffer(1, a.sampleRate, a.sampleRate), d = nb.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  RG.bus = { a, master, mel, dly, noise: nb };
  return RG.bus;
}
function voice(at, f, dur, type, vol, dest, slideTo, filt) {
  const B = RG.bus, a = B.a, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, at); if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, at + dur * 0.8);
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.006);
  g.gain.setValueAtTime(vol, at + dur * 0.55); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  let node = o;
  if (filt) { const fl = a.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = filt; o.connect(fl); node = fl; }
  node.connect(g).connect(dest || B.master); o.start(at); o.stop(at + dur + 0.02);
}
function noiseHit(at, dur, vol, type, freq) {
  const B = RG.bus, a = B.a, s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = B.noise; f.type = type; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  s.connect(f).connect(g).connect(B.master); s.start(at, Math.random() * 0.5); s.stop(at + dur + 0.02);
}
const DRUM = {
  k(at) { voice(at, 160, 0.22, 'sine', 0.95, null, 42); voice(at, 90, 0.05, 'triangle', 0.4); },
  s(at) { noiseHit(at, 0.16, 0.42, 'bandpass', 1900); voice(at, 210, 0.08, 'triangle', 0.25, null, 140); },
  g(at) { noiseHit(at, 0.06, 0.12, 'bandpass', 2200); },
  h(at, soft) { noiseHit(at, 0.035, soft ? 0.07 : 0.13, 'highpass', 7500); },
  o(at) { noiseHit(at, 0.22, 0.12, 'highpass', 6500); },
  crash(at) { noiseHit(at, 1.1, 0.16, 'highpass', 5000); }
};
/* 칸 하나(16분음표)의 소리를 예약 큐에 넣어요 */
function queueStep(t, step) {
  const sg = RG.song, bar = Math.floor(step / 16), s16 = step % 16, sec = sg.arr[Math.floor(bar / 4) % sg.arr.length];
  const [cr, q] = sg.prog[bar % 4], dr = sg.drums[sec], mel = sg.mel[sec][bar % 4];
  const third = q === 'm' ? 3 : 4, ev = [];
  if (dr.k[s16] === 'x') ev.push(at => DRUM.k(at));
  if (dr.s[s16] === 'x') ev.push(at => DRUM.s(at));
  if (dr.s[s16] === 'g') ev.push(at => DRUM.g(at));
  if (dr.h[s16] === 'x') ev.push(at => DRUM.h(at, s16 % 2 === 1));
  if (dr.o[s16] === 'x') ev.push(at => DRUM.o(at));
  if (s16 === 0 && bar % 4 === 0 && bar > 0 && sec === 'B') ev.push(at => DRUM.crash(at));
  const bc = sg.bass[sec][s16];
  if (bc !== '.') {
    const off = bc === 't' ? third : BASS_OFF[bc], m = sg.root - 12 + cr + off;
    ev.push(at => { voice(at, midiHz(m), 15 / RG.bpm * 1.7, 'triangle', 0.42); voice(at, midiHz(m), 15 / RG.bpm * 1.2, 'square', 0.05, null, null, 700); });
  }
  const chord = [0, third, 7, 12].map(i => sg.root + 12 + cr + i);
  if (sg.arp[sec] === 'stab') { if (s16 === 2 || s16 === 10) ev.push(at => chord.slice(0, 3).forEach(m => voice(at, midiHz(m + 12), 0.09, 'square', 0.035, null, null, 2600))); }
  else if (sg.arp[sec] && s16 % (16 / sg.arp[sec]) === 0) { const m = chord[(s16 / (16 / sg.arp[sec])) % 4] + 12; ev.push(at => voice(at, midiHz(m), 0.07, 'square', 0.03, null, null, 3000)); }
  const p = mel[s16];
  if (p != null) {
    let len = 1; while (len < 4 && s16 + len < 16 && mel[s16 + len] == null) len++;
    const f = midiHz(sg.lead + p), dur = 15 / RG.bpm * len * 0.92;
    ev.push(at => { voice(at, f, dur, sg.wave, 0.11, RG.bus.mel, null, 3800); voice(at, f * 2, dur * 0.6, 'triangle', 0.03, RG.bus.mel); });
  }
  if (ev.length) RG.aq.push({ t, play: at => ev.forEach(fn => fn(at)) });
  return p;
}
function pumpAudio(t) {
  while (RG.aq.length && RG.aq[0].t < t + 0.15) {
    const e = RG.aq.shift();
    if (e.t < t - 0.05) continue; // 너무 늦은 소리는 건너뛰기
    if (rBus()) { const at = audioAt(e.t); if (at != null) e.play(at); }
  }
}
function hitTick(lane) { if (rBus()) { const at = RG.bus.a.currentTime; voice(at, lane === 3 ? 1400 : 2200, 0.035, 'square', 0.035); } }
function duckMelody() {
  const B = rBus(); if (!B) return; const now = B.a.currentTime;
  B.mel.gain.cancelScheduledValues(now); B.mel.gain.setValueAtTime(0.3, now); B.mel.gain.linearRampToValueAtTime(1, now + 0.5);
}

/* ---------- 채보 : 노래에서 바로 뽑아요 ----------
   멜로디가 올라가면 오른쪽 키, 내려가면 왼쪽 키 (Q·W·E), 마디 첫 박 킥은 SPACE.
   레벨이 오를수록 8분·16분 음표까지 노트로 만들고, 화음(두 키 동시)도 섞어요. */
function laneFor(p) {
  if (RG.lastPitch == null) return 1;
  const d = p - RG.lastPitch;
  if (d === 0) return RG.lastLane;
  const stepTo = Math.abs(d) >= 5 ? 2 : 1;
  return Math.max(0, Math.min(2, RG.lastLane + Math.sign(d) * stepTo));
}
function generate(upTo) {
  while (RG.stepT < upTo) {
    const lv = RG.level, step = RG.step, s16 = step % 16, t = RG.stepT;
    if (s16 === 0) { RG.bpm = Math.min(RG.song.bpm + 32, RG.song.bpm + 3.6 * (lv - 1)); if (RG.bus) RG.bus.dly.delayTime.setValueAtTime(45 / RG.bpm, Math.max(0, audioAt(t) || 0)); }
    const p = queueStep(t, step);
    const sec = RG.song.arr[Math.floor(step / 64) % RG.song.arr.length];
    let take = false;
    if (p != null) {
      if (s16 % 4 === 0) take = true;
      else if (s16 % 2 === 0) take = lv >= 3 || (lv === 2 && Math.random() < 0.5);
      else take = (lv >= 5 && Math.random() < 0.85) || (lv === 4 && Math.random() < 0.4);
      if (lv <= 2 && step - RG.lastNoteStep < 2) take = false;
    }
    const downbeat = s16 === 0, kick = RG.song.drums[sec].k[s16] === 'x';
    const space = downbeat || (lv >= 6 && sec === 'B' && kick && p == null);
    if (take) {
      const lane = laneFor(p);
      if (space && lv < 3) RG.notes.push({ t, lane: 3, hit: false, miss: false });
      else { RG.notes.push({ t, lane, hit: false, miss: false }); if (space) RG.notes.push({ t, lane: 3, hit: false, miss: false }); }
      RG.lastLane = lane; RG.lastPitch = p; RG.lastNoteStep = step;
    } else if (space && step - RG.lastNoteStep >= 2) { RG.notes.push({ t, lane: 3, hit: false, miss: false }); RG.lastNoteStep = step; }
    RG.step++; RG.stepT += 15 / RG.bpm;
  }
}

/* ---------- 진행 ---------- */
function rLoop() {
  if (!RG.on) return;
  const t = rnow();
  if (!RG.paused && !RG.over) rStep(t);
  rDraw(t);
  rraf = requestAnimationFrame(rLoop);
}
function rStep(t) {
  // 카운트인 메트로놈
  while (RG.beatT <= t + 0.6 && RG.beat < 0) { const hi = RG.beat === -1; RG.aq.push({ t: RG.beatT, play: at => { DRUM.h(at); voice(at, hi ? 1568 : 1046, 0.07, 'square', 0.05); } }); RG.beat++; RG.beatT += 60 / RG.bpm; }
  RG.aq.sort((a, b) => a.t - b.t);
  pumpAudio(t);
  const target = 300 + 29 * (RG.level - 1);
  RG.speed += (target - RG.speed) * 0.02;
  generate(t + (HIT_Y + 40) / RG.speed + 0.6);
  for (const n of RG.notes) {
    if (!n.hit && !n.miss && t - n.t > JUDGE[2].win) { n.miss = true; registerMiss(n); if (RG.over) return; }
  }
  RG.notes = RG.notes.filter(n => !(n.hit || n.miss) || t - n.t < 0.4);
  // 춤추는 캐릭터
  const beatNow = Math.floor((t - RG.startT) * RG.bpm / 60 + 0.02);
  if (beatNow !== RG.dancerBeat) { RG.dancerBeat = beatNow; for (const d of [$('#rh-dancer'), $('#rh-dancer-big')]) { d.classList.remove('beat'); void d.offsetWidth; d.classList.add('beat'); } }
}
function registerMiss(n) {
  RG.combo = 0; RG.counts.MISS++; RG.hp -= 1;
  RG.judge = { name: 'MISS', col: '#ff8a8a', t: rnow() };
  duckMelody();
  rhHud();
  if (RG.hp <= 0) endRhythm();
}
function rhPress(lane) {
  if (!RG.on || RG.over) return;
  if (RG.paused) { resumeRhythm(); return; }
  const t = rnow();
  RG.press[lane] = t;
  let best = null, bd = 1;
  for (const n of RG.notes) if (n.lane === lane && !n.hit && !n.miss) { const d = Math.abs(n.t - t); if (d < bd) { bd = d; best = n; } }
  if (!best || bd > JUDGE[2].win) return;
  const j = JUDGE.find(j => bd <= j.win);
  best.hit = true;
  RG.combo++; RG.maxCombo = Math.max(RG.maxCombo, RG.combo); RG.counts[j.name]++;
  RG.score += Math.round(j.pts * (1 + Math.min(RG.combo, 100) / 50));
  if (RG.combo % 15 === 0 && RG.hp < 10) RG.hp++;
  RG.judge = { name: j.name, col: j.col, t };
  RG.fx.push({ lane, t, col: LANES[lane].col });
  if (RG.combo % 10 === 0) { const d = $('#rh-dancer-big'); d.classList.remove('cheer'); void d.offsetWidth; d.classList.add('cheer'); }
  hitTick(lane);
  const nl = levelOf(RG.score);
  if (nl > RG.level) { RG.level = nl; RG.flash = t; RG.pop = { text: `LEVEL ${nl}`, sub: '박자가 빨라져요!', t }; tone(660, 0, 0.1, 'triangle', 0.1); tone(990, 0.1, 0.18, 'triangle', 0.1); }
  checkGoals(t);
  rhHud();
}
function checkGoals(t) {
  const st = rhythmState();
  for (const m of MILESTONES) {
    if (RG.score >= m && !st.claimed.includes(m)) {
      st.claimed.push(m); S.tickets++; RG.earned++; save(); drawTickets(); popTix();
      RG.pop = { text: `${m.toLocaleString('ko-KR')}점 달성!`, sub: '코디 티켓 +1', t, ticket: true };
      sfx.buy();
    }
  }
}
function rhHud(force) {
  const key = RG.score + '|' + RG.combo + '|' + RG.hp + '|' + RG.level;
  if (!force && key === RG.hudKey) return; RG.hudKey = key;
  $('#rh-score').textContent = RG.score.toLocaleString('ko-KR');
  $('#rh-lv').textContent = 'LV ' + RG.level;
  $('#rh-hp').style.width = Math.max(0, RG.hp) * 10 + '%';
  $('#rh-hp').classList.toggle('low', RG.hp <= 3);
  const st = rhythmState(), next = MILESTONES.find(m => !st.claimed.includes(m)), prev = [...MILESTONES].reverse().find(m => m <= RG.score && st.claimed.includes(m)) || 0;
  $('#rs-lv').textContent = `LV ${RG.level}`; $('#rs-bpm').textContent = `BPM ${Math.round(RG.bpm)}`;
  $('#rs-best').textContent = Math.max(st.best, RG.score).toLocaleString('ko-KR');
  if (next) { $('#rs-next').textContent = next.toLocaleString('ko-KR') + '점'; $('#rs-bar').style.width = Math.min(100, Math.max(0, (RG.score - prev) / (next - prev) * 100)) + '%'; }
  else { $('#rs-next').textContent = '모두 달성!'; $('#rs-bar').style.width = '100%'; }
  const nl = LV_AT[RG.level]; $('#rs-up').textContent = nl ? `${(nl - RG.score).toLocaleString('ko-KR')}점 더 얻으면 LV ${RG.level + 1}` : '최고 레벨';
}
function pauseRhythm() { if (RG.on && !RG.over && !RG.paused) { RG.paused = true; RG.pauseAt = rnow(); fadeMaster(0.0001); } }
function fadeMaster(v) { const B = RG.bus; if (!B) return; const now = B.a.currentTime; B.master.gain.cancelScheduledValues(now); B.master.gain.setTargetAtTime(v, now, 0.05); }
function resumeRhythm() {
  if (!RG.paused) return;
  const shift = rnow() - RG.pauseAt + 1.2; // 다시 시작할 때 1.2초 여유
  RG.notes.forEach(n => n.t += shift); RG.aq.forEach(e => e.t += shift); RG.stepT += shift; RG.beatT += shift; RG.startT += shift;
  RG.paused = false; fadeMaster(0.9);
}

/* ---------- 그리기 (도트) ---------- */
const RGW = RW / 2, RGH = RH / 2, HY = HIT_Y / 2;
let rBg = null;
const g2 = v => Math.round(v / 2);
function rhBg() {
  if (rBg) return;
  const D = new Dots(RGW, RGH);
  D.bands(0, RGH, ['#1c1731', '#241e3f', '#2c2550', '#2a2349']);
  LANES.forEach((L, i) => {
    const x0 = g2(L.x), x1 = g2(L.x + L.w);
    for (let y = 0; y < RGH; y++) for (let x = x0; x < x1; x++) if ((x + y) % (i % 2 ? 4 : 3) === 0) D.put(x, y, i % 2 ? '#2f2853' : '#332b5a');
    for (let y = 0; y < RGH; y++) D.put(x1, y, '#15112a');
  });
  for (let i = 0; i < 26; i++) { const x = (i * 53 + 7) % RGW, y = (i * 37 + 11) % (HY - 20); D.put(x, y, i % 3 ? '#8d84c6' : '#fff6dc'); }
  rBg = document.createElement('canvas'); rBg.width = RGW; rBg.height = RGH; rBg.getContext('2d').putImageData(D.img, 0, 0);
}
function rText(text, x, y, px, fill, stroke = '#15112a') {
  const c = rctx; c.font = `700 ${px}px Galmuri11, DotGothic16, monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
  if (stroke) { c.fillStyle = stroke; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1], [0, 2], [1, 2], [-1, 2]]) c.fillText(text, x + dx, y + dy); }
  c.fillStyle = fill; c.fillText(text, x, y);
}
function pxBox(x, y, w, h, fill, ink = '#15112a') {
  const c = rctx;
  c.fillStyle = ink; c.fillRect(x + 1, y, w - 2, h); c.fillRect(x, y + 1, w, h - 2);
  c.fillStyle = fill; c.fillRect(x + 1, y + 1, w - 2, h - 2);
  c.fillStyle = shade(fill, 0.45); c.fillRect(x + 2, y + 1, w - 4, 1);
  c.fillStyle = shade(fill, -0.25); c.fillRect(x + 1, y + h - 2, w - 2, 1);
}
function rDraw(t) {
  const c = rctx; if (!c || !rBg) return;
  c.drawImage(rBg, 0, 0);
  // 박자마다 화면이 살짝 밝아져요
  const ph = ((t - RG.startT) * RG.bpm / 60) % 1, pulse = ph < 0.18 ? 1 : 0, fl = t - RG.flash < 0.5 ? 1 : 0;
  if (pulse || fl) { c.fillStyle = fl ? 'rgba(255,240,170,.16)' : 'rgba(160,150,240,.08)'; c.fillRect(0, 0, RGW, RGH); }
  // 누른 줄은 빛기둥
  LANES.forEach((L, i) => {
    const lit = t - RG.press[i];
    if (lit < 0.18) {
      const x = g2(L.x), w = g2(L.w);
      [[60, 0.14], [36, 0.22], [16, 0.34]].forEach(([h, a]) => { c.fillStyle = hexA(L.col, a * (1 - lit / 0.18)); c.fillRect(x, HY - h, w, h); });
    }
  });
  // 판정선
  for (let x = 4; x < RGW - 4; x += 4) { c.fillStyle = '#fff6dc'; c.fillRect(x, HY - 1, 2, 2); }
  // 노트
  for (const n of RG.notes) {
    if (n.hit) continue;
    const L = LANES[n.lane], y = g2(HIT_Y - (n.t - t) * RG.speed);
    if (y < -10 || y > RGH + 10) continue;
    c.globalAlpha = n.miss ? 0.35 : 1;
    pxBox(g2(L.x) + 2, y - 4, g2(L.w) - 4, 9, L.col);
    if (n.lane === 3) { c.fillStyle = shade(L.col, -0.35); c.fillRect(g2(L.x + L.w / 2) - 4, y, 8, 1); }
    c.globalAlpha = 1;
  }
  // 맞힌 자리에서 터지는 도트
  RG.fx = RG.fx.filter(f => t - f.t < 0.3);
  for (const f of RG.fx) {
    const k = (t - f.t) / 0.3, L = LANES[f.lane], x = g2(L.x + L.w / 2), d = Math.round(4 + k * 14);
    c.fillStyle = f.col;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1], [-0.6, 0.6], [0.6, 0.6]]) c.fillRect(Math.round(x + dx * d) - 1, Math.round(HY + dy * d) - 1, 2, 2);
  }
  // 키 버튼
  LANES.forEach((L, i) => {
    const down = t - RG.press[i] < 0.09, y = HY + 11 + (down ? 1 : 0);
    pxBox(g2(L.x) + 1, y, g2(L.w) - 2, 20, down ? L.col : '#3a3358');
    rText(L.label, g2(L.x + L.w / 2), y + 10, 11, down ? '#15112a' : '#fff6dc', null);
  });
  // 판정·콤보
  if (RG.judge && t - RG.judge.t < 0.5) {
    const k = (t - RG.judge.t) / 0.5;
    if (k < 0.7 || Math.floor(k * 20) % 2) rText(RG.judge.name, RGW / 2, 164 - Math.round(k * 6), 22, RG.judge.col);
  }
  if (RG.combo >= 3) { rText(String(RG.combo), RGW / 2, 106, 33, '#fff6dc'); rText('COMBO', RGW / 2, 130, 11, '#c9c2f0'); }
  if (RG.pop && t - RG.pop.t < 1.8) {
    const k = (t - RG.pop.t) / 1.8, y = 72 - Math.round(k * 8);
    if (k < 0.8 || Math.floor(k * 20) % 2) {
      pxBox(14, y - 17, RGW - 28, 34, '#1d1830', RG.pop.ticket ? '#f6cf5a' : '#c9c2f0');
      rText(RG.pop.text, RGW / 2, y - 6, 11, RG.pop.ticket ? '#f6cf5a' : '#fff6dc', null);
      rText(RG.pop.sub, RGW / 2, y + 8, 11, '#fff6dc', null);
    }
  }
  // 카운트인
  if (RG.beat < 0 && !RG.over) {
    rText(RG.song.name, RGW / 2, 60, 22, '#f6cf5a');
    rText(RG.song.mood, RGW / 2, 80, 11, '#c9c2f0', null);
    rText(String(-RG.beat), RGW / 2, 112, 44, '#fff6dc');
    rText('노트가 선에 닿을 때 눌러요', RGW / 2, 146, 11, '#c9c2f0');
  }
  if (RG.paused && !RG.over) {
    c.fillStyle = 'rgba(21,17,42,.8)'; c.fillRect(0, 0, RGW, RGH);
    rText('잠깐 멈춤', RGW / 2, 108, 22, '#fff6dc');
    rText('아무 키나 누르면 이어서 해요', RGW / 2, 134, 11, '#c9c2f0');
  }
}
function hexA(hex, a) { const [r, g, b] = hexRgb(hex).map(v => Math.round(v * 255)); return `rgba(${r},${g},${b},${a})`; }

/* ---------- 끝 ---------- */
function endRhythm() {
  if (RG.over) return;
  RG.over = true;
  const st = rhythmState(), newBest = RG.score > st.best;
  if (newBest) st.best = RG.score;
  save();
  gainXp(Math.min(400, Math.floor(RG.score / 50)));
  const total = RG.counts.PERFECT + RG.counts.GREAT + RG.counts.GOOD + RG.counts.MISS;
  const acc = total ? Math.round((RG.counts.PERFECT + RG.counts.GREAT * 0.7 + RG.counts.GOOD * 0.4) / total * 100) : 0;
  const next = MILESTONES.find(m => !st.claimed.includes(m));
  setTimeout(() => {
    $('#rh-o-title').textContent = newBest ? '최고 기록!' : '끝!';
    $('#rh-o-score').textContent = RG.score.toLocaleString('ko-KR');
    $('#rh-o-sum').innerHTML = `<li><span>노래</span><b>${RG.song.name}</b></li><li><span>최고 레벨</span><b>LV ${RG.level}</b></li><li><span>최대 콤보</span><b>${RG.maxCombo}</b></li><li><span>정확도</span><b>${acc}%</b></li><li><span>이번에 받은 티켓</span><b>${RG.earned}장</b></li>`;
    $('#rh-o-next').textContent = next ? `다음 티켓 목표: ${next.toLocaleString('ko-KR')}점` : '목표 티켓을 모두 받았어요!';
    $('#rh-over').hidden = false;
    $('#rh-again').focus({ preventScroll: true });
  }, 500);
  sfx.coin();
}
$('#rh-again').onclick = () => { sfx.pop(); startRhythm(); };
$('#rh-list').onclick = () => { sfx.pop(); stopRhythm(); openGames(); };

/* ---------- 조작 ---------- */
window.addEventListener('keydown', e => {
  if (run.screen !== 'rhythm' || !RG.on || RG.over || $('#rh-play').hidden) return;
  const lane = LANES.findIndex(L => L.code === e.code);
  if (lane >= 0) { e.preventDefault(); if (!e.repeat) rhPress(lane); }
  else if (e.code === 'Escape' || e.code === 'KeyP') { e.preventDefault(); RG.paused ? resumeRhythm() : pauseRhythm(); }
  else if (RG.paused) resumeRhythm();
});
window.addEventListener('blur', pauseRhythm);
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseRhythm(); });
document.querySelectorAll('#rh-pads .pad').forEach((b, i) => {
  b.addEventListener('pointerdown', e => { e.preventDefault(); rhPress(i); });
  b.addEventListener('contextmenu', e => e.preventDefault());
});
