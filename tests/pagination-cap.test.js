// 伺服器單次回傳有上限（Supabase 預設 1000）：紀錄超過上限時仍要能一路「載入更多」到最後一筆
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const errors = []; const vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e.message));
const FIXED = new Date(2026, 8, 2, 12, 0, 0).getTime();
const TOTAL = 1200, SERVER_CAP = 1000;
const all = Array.from({ length: TOTAL }, (_, i) => ({ created_at: new Date(FIXED - i * 60000).toISOString(), text: `紀錄 ${i}`, progress: null, has_event: false }));
let maxLimitSeen = 0;
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'file:///x/index.html', virtualConsole: vc, beforeParse(w) {
  w.scrollTo = () => {};
  const RD = w.Date; class FD extends RD { constructor(...a) { a.length ? super(...a) : super(FIXED); } static now() { return FIXED; } } w.Date = FD;
  w.fetch = (url, opt = {}) => {
    const ok = body => Promise.resolve({ ok: true, headers: { get: () => null }, json: async () => body });
    if ((opt.method || 'GET') === 'POST') return Promise.resolve({ ok: true });
    if (url.includes('mix_observations') || url.includes('or=')) return ok([]);
    const limit = Number(/limit=(\d+)/.exec(url)[1]); const offset = Number((/offset=(\d+)/.exec(url) || [0, 0])[1]);
    maxLimitSeen = Math.max(maxLimitSeen, limit);
    return ok(all.slice(offset, offset + Math.min(limit, SERVER_CAP)));   // 模擬伺服器上限：超過 1000 的 limit 會被靜默截斷
  };
} });
const w = dom.window, d = w.document, sleep = ms => new Promise(r => setTimeout(r, ms));
const t = (n, c) => console.log((c ? 'PASS ' : 'FAIL ') + n);
(async () => {
  await sleep(150);
  const btn = d.getElementById('logLoadMore'); const count = () => d.getElementById('logCount').textContent;
  let clicks = 0;
  while (!btn.hidden && clicks < 40) { btn.click(); clicks++; await sleep(40); }
  t('一路載入更多後已載入 1200 筆 (' + count() + ')', count().includes('已載入 1200 筆'));
  t('載入完畢 → 隱藏「載入更多」', btn.hidden);
  t('最舊的一筆(紀錄 1199)可見', d.getElementById('timeline').textContent.includes('紀錄 1199'));
  t('單次請求 limit 未超過伺服器上限 (max=' + maxLimitSeen + ')', maxLimitSeen <= SERVER_CAP);
  t('no errors', errors.length === 0); if (errors.length) console.log(errors);
  w.close(); process.exit(0);
})();
