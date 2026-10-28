/* ===== 진행 상황 저장 / 불러오기 (LocalStorage) =====
   - 조개, 티켓, 해금한 옷, 코디, 레벨·경험치, 미니게임 기록을 이 브라우저에 저장해요.
   - 새로고침하거나 사이트를 다시 열면 그대로 불러와요.
   - 예전 버전(v1) 저장이 있으면 자동으로 옮겨 와요.
   - 바뀔 때마다 바로 저장하고, 탭을 닫거나 숨길 때 한 번 더 저장해요. */
const SAVE_KEY = 'mallang-closet-save-v2';
const OLD_SAVE_KEYS = ['mallang-closet-v1'];
const SAVE_VERSION = 2;
const TICKET_START = 10, TICKET_CAP = 10, TICKET_MS = 5 * 60 * 1000;

/* 게임 상태 : 저장되는 값은 전부 여기에 있어요 */
const S = {
  coins: 0, owned: new Set(STARTER_IDS), seen: {}, best: {}, sound: true, plays: 0,
  tickets: TICKET_START, tickAt: Date.now(), mini: {}, rhythm: { best: 0, claimed: [] },
  level: 1, xp: 0, createdAt: Date.now(),
  show: { best: 0, wins: 0, plays: 0, invites: [] } // 패션쇼 기록 (최고 순위, 우승 횟수, 받은 초대장)
};
const outfits = {}; // 캐릭터별 마지막 코디
const saveInfo = { ok: true, warned: false, at: 0, loaded: false };

const num = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const arr = (v) => (Array.isArray(v) ? v : []);

function snapshot() {
  return {
    v: SAVE_VERSION, savedAt: Date.now(),
    coins: S.coins, owned: [...S.owned], seen: S.seen, best: S.best, sound: S.sound, plays: S.plays,
    outfits, tickets: S.tickets, tickAt: S.tickAt, mini: S.mini, rhythm: S.rhythm,
    level: S.level, xp: S.xp, createdAt: S.createdAt, show: S.show
  };
}
function applySave(d) {
  S.coins = Math.max(0, Math.floor(num(d.coins)));
  S.owned = new Set([...STARTER_IDS, ...arr(d.owned)].filter(id => ITEM[id]));
  S.seen = obj(d.seen); S.best = obj(d.best); S.sound = d.sound !== false; S.plays = num(d.plays);
  for (const k in outfits) delete outfits[k];
  for (const [cid, o] of Object.entries(obj(d.outfits))) if (CHARS[cid]) outfits[cid] = obj(o);
  S.tickets = Math.max(0, Math.floor(num(d.tickets, TICKET_START)));
  S.tickAt = num(d.tickAt, Date.now());
  S.mini = obj(d.mini);
  const r = obj(d.rhythm);
  S.rhythm = { best: num(r.best), claimed: arr(r.claimed).filter(n => typeof n === 'number') };
  S.level = Math.max(1, Math.floor(num(d.level, 1))); S.xp = Math.max(0, num(d.xp));
  S.createdAt = num(d.createdAt, Date.now());
  const sw = obj(d.show);
  S.show = { best: num(sw.best), wins: num(sw.wins), plays: num(sw.plays), invites: arr(sw.invites).filter(x => typeof x === 'string') };
}
function readKey(k) {
  let raw = null;
  try { raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : null; }
  catch (e) { try { if (raw) localStorage.setItem(k + '-broken', raw); } catch (_) { } return null; } // 깨진 저장은 따로 보관
}

function load() {
  let d = readKey(SAVE_KEY), migrated = false;
  if (!d) for (const k of OLD_SAVE_KEYS) { d = readKey(k); if (d) { migrated = true; break; } }
  if (d && typeof d === 'object') {
    applySave(d); saveInfo.loaded = true; saveInfo.at = num(d.savedAt, 0);
    if (migrated) save();
  }
  return saveInfo.loaded;
}
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot()));
    saveInfo.ok = true; saveInfo.at = Date.now();
    if (typeof drawSaveStatus === 'function') drawSaveStatus();
  } catch (e) {
    saveInfo.ok = false;
    if (!saveInfo.warned && typeof toast === 'function') { saveInfo.warned = true; toast('이 브라우저에서는 저장이 안 돼요. 시크릿 창이면 일반 창으로 열어 주세요.'); }
  }
  return saveInfo.ok;
}
function wipeSave() {
  try { localStorage.removeItem(SAVE_KEY); OLD_SAVE_KEYS.forEach(k => localStorage.removeItem(k)); } catch (e) { }
  applySave({ tickets: TICKET_START, tickAt: Date.now(), createdAt: Date.now() });
  save();
}
// 탭을 닫거나 다른 앱으로 넘어갈 때 한 번 더 저장
window.addEventListener('pagehide', save);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });
// 다른 탭에서 같은 게임을 하면 그쪽 진행 상황을 가져와요
window.addEventListener('storage', e => {
  if (e.key !== SAVE_KEY || !e.newValue) return;
  try { applySave(JSON.parse(e.newValue)); if (typeof refreshHud === 'function') refreshHud(); } catch (_) { }
});

/* ---------- 레벨 · 경험치 ----------
   옷 평가, 돌 피하기, 리듬게임을 하면 경험치가 쌓여요. 레벨이 오를 때마다 코디 티켓 1장. */
const xpNeed = lv => 100 + 50 * (lv - 1);
function gainXp(n) {
  n = Math.max(0, Math.round(n)); if (!n) return 0;
  S.xp += n; let ups = 0;
  while (S.xp >= xpNeed(S.level)) { S.xp -= xpNeed(S.level); S.level++; S.tickets++; ups++; }
  save();
  if (typeof drawLevel === 'function') drawLevel(ups > 0);
  if (ups && typeof toast === 'function') setTimeout(() => toast(`레벨 업! Lv.${S.level} · 코디 티켓 +${ups}`), 300);
  return ups;
}
