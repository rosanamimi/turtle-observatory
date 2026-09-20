// 觀察紀錄「載入更多」、篩選；語錄「今日第 N 次」只用真實紀錄，且不受時間軸分頁影響（今天超過 50 筆的情境）
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const errors = []; const vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e.message));
const FIXED = new Date(2026, 8, 2, 12, 0, 0).getTime(); // 固定在本地 9/2 中午，避免跨午夜造成不穩定
const TOTAL = 70;                                      // 今天共 70 筆「摸門把」，都在今天 10:50～12:00
const urls = []; let failObs = false;
const rows = n => Array.from({ length: n }, (_, i) => ({
  created_at: new Date(FIXED - i * 60000).toISOString(),
  text: `摸門把 舊紀錄 ${i}`, progress: null,
  // 第 4 筆是實際事件，事件時間(8/18)與建立時間(9/2)不同
  ...(i === 3 ? { has_event: true, event_type: '文字訊息', event_content: 'x', event_time: new Date(2026, 7, 18, 10, 0, 0).toISOString() } : { has_event: false })
}));
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'file:///x/index.html', virtualConsole: vc, beforeParse(w) {
  w.scrollTo = () => {};
  const RD = w.Date;
  class FD extends RD { constructor(...a) { a.length ? super(...a) : super(FIXED); } static now() { return FIXED; } }
  w.Date = FD;
  w.fetch = (url, opt = {}) => {
    if ((opt.method || 'GET') === 'POST') return Promise.resolve({ ok: true });
    if (url.includes('mix_observations')) return Promise.resolve({ ok: true, headers: { get: () => null }, json: async () => [] });
    if (failObs) return Promise.reject(new Error('down'));
    const ok = body => Promise.resolve({ ok: true, headers: { get: () => null }, json: async () => body });
    if (url.includes('or=')) { urls.push('STATS ' + url); return ok(rows(TOTAL)); }   // 統計查詢：今天全部
    urls.push(url);
    const limit = Number(/limit=(\d+)/.exec(url)[1]);
    return ok(rows(Math.min(TOTAL, limit)));                                          // 時間軸查詢：受 limit 限制
  };
} });
const w = dom.window, d = w.document, sleep = ms => new Promise(r => setTimeout(r, ms));
const t = (n, c) => console.log((c ? 'PASS ' : 'FAIL ') + n);
(async () => {
  await sleep(150);
  const btn = d.getElementById('logLoadMore');
  const meta = () => d.getElementById('quoteMeta').textContent;
  t('時間軸只載入 50 筆 → 顯示「載入更多」', !btn.hidden && d.querySelectorAll('#timeline .tl-entry').length === 50);
  t('今天有 70 筆，語錄署名仍是 70（不受 50 筆分頁限制）: ' + meta(), meta().includes('今日第 70 次'));
  t('「今日研究門把」統計也是 70', d.getElementById('behTouch').textContent === '70 次');
  for (let i = 0; i < 5; i++) d.getElementById('checkBtn').click();
  t('按「查看最新狀態」不會改動真實次數', meta().includes('今日第 70 次'));
  btn.click(); await sleep(100);
  t('載入更多 → 時間軸請求 limit=100', urls.filter(u => !u.startsWith('STATS')).pop().includes('limit=100'));
  t('載入更多後 70 筆 < 100 → 隱藏按鈕', btn.hidden);
  t('載入更多後統計不變（仍為 70）', meta().includes('今日第 70 次') && d.getElementById('behTouch').textContent === '70 次');
  t('已載入 70 筆', d.getElementById('logCount').textContent.includes('已載入 70 筆'));
  const f = d.getElementById('logFilter');
  f.value = '舊紀錄 6'; f.dispatchEvent(new w.Event('input', { bubbles: true }));
  const n = d.querySelectorAll('#timeline .tl-entry').length;
  t('篩選「舊紀錄 6」→ 6、60~69 共 11 筆 (實際 ' + n + ')', n === 11 && d.getElementById('logCount').textContent.includes('符合 11 / 已載入 70'));
  f.value = '8/18'; f.dispatchEvent(new w.Event('input', { bubbles: true }));
  t('用「事件時間」8/18 也能篩到（建立時間是 9/2）', d.querySelectorAll('#timeline .tl-entry').length === 1);
  f.value = 'zzzz不存在'; f.dispatchEvent(new w.Event('input', { bubbles: true }));
  t('無符合 → 顯示提示', d.getElementById('timeline').textContent.includes('沒有符合的紀錄'));
  f.value = '<img src=x onerror=1>'; f.dispatchEvent(new w.Event('input', { bubbles: true }));
  t('篩選字串不會被當 HTML 渲染', !d.querySelector('#timeline img'));
  f.value = ''; f.dispatchEvent(new w.Event('input', { bubbles: true }));
  t('清空篩選 → 全部顯示', d.querySelectorAll('#timeline .tl-entry').length === 70);
  failObs = true; d.getElementById('progressRefreshBtn').click(); await sleep(150);
  t('讀取失敗 → 語錄署名不顯示假次數', meta() === '— 龜龜');
  t('讀取失敗 → 隱藏「載入更多」', btn.hidden);
  t('no errors', errors.length === 0); if (errors.length) console.log(errors);
  w.close(); process.exit(0);
})();
