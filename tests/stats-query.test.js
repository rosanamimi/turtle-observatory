// 統計專用查詢：語法（今天區間＋全部實際事件）、只有統計查詢失敗時的退回、空結果、時間軸之外的歷史實際事件
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const FIXED = new Date(2026, 8, 2, 12, 0, 0).getTime();
const dayStart = new Date(2026, 8, 2, 0, 0, 0), dayEnd = new Date(2026, 8, 3, 0, 0, 0);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t = (n, c) => console.log((c ? 'PASS ' : 'FAIL ') + n);
const at = (h, text, extra = {}) => ({ created_at: new Date(2026, 8, 2, h, 0, 0).toISOString(), text, progress: null, has_event: false, ...extra });

async function run(mode) {
  const errors = []; const vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(e.message));
  let statsUrl = null;
  const timeline = [at(9, '摸門把'), at(8, '看門')];                                   // 時間軸只有 2 筆今天的紀錄
  const statsOk = [                                                                     // 統計查詢：今天 3 筆 + 很久以前的實際事件（不在時間軸內）
    at(9, '摸門把'), at(8, '看門'), at(7, '研究門把'),
    { created_at: new Date(2026, 0, 5, 10, 0, 0).toISOString(), text: '舊事件', has_event: true, event_type: '文字訊息' },
    { created_at: new Date(2026, 1, 5, 10, 0, 0).toISOString(), text: '舊事件2', has_event: true, event_type: '通話' }
  ];
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'file:///x/index.html', virtualConsole: vc, beforeParse(w) {
    w.scrollTo = () => {};
    const RD = w.Date; class FD extends RD { constructor(...a) { a.length ? super(...a) : super(FIXED); } static now() { return FIXED; } } w.Date = FD;
    w.fetch = (url, opt = {}) => {
      const ok = body => Promise.resolve({ ok: true, headers: { get: () => null }, json: async () => body });
      if ((opt.method || 'GET') === 'POST') return ok({});
      if (url.includes('mix_observations')) return ok([]);
      if (url.includes('or=')) {
        statsUrl = url;
        if (mode === 'stats-fail') return Promise.reject(new Error('stats down'));
        return ok(mode === 'stats-empty' ? [] : statsOk);
      }
      return ok(timeline);
    };
  } });
  const w = dom.window, d = w.document; await sleep(200);
  const el = id => d.getElementById(id).textContent;
  const r = { errors, statsUrl, el, d };
  r.close = () => w.close();
  return r;
}

(async () => {
  // 1) 正常：語法 + 歷史事件 + 統計不受時間軸限制
  let r = await run('ok');
  const q = new URL(r.statsUrl).searchParams; const cond = q.get('or'); const sel = q.get('select');
  t('統計查詢包含 has_event.eq.true', cond.includes('has_event.eq.true'));
  t('統計查詢下限 = 今天 00:00 (' + dayStart.toISOString() + ')', cond.includes('created_at.gte.' + dayStart.toISOString()));
  t('統計查詢上限 = 隔天 00:00 (' + dayEnd.toISOString() + ')', cond.includes('created_at.lt.' + dayEnd.toISOString()));
  t('統計查詢只選需要的欄位', sel === 'created_at,text,has_event,event_type');
  t('今日研究門把 = 統計查詢的 3 筆（含 07:00 那筆），不是時間軸的 2 筆: ' + r.el('behTouch'), r.el('behTouch') === '3 次');
  t('時間軸之外的歷史「送出訊息」事件被計入 (behPush=' + r.el('behPush') + ')', r.el('behPush') === '1 次');
  t('時間軸之外的歷史「深入互動」事件被計入 (behOpen=' + r.el('behOpen') + ')', r.el('behOpen') === '1 次');
  t('語錄署名 = 今日第 3 次', r.el('quoteMeta').includes('今日第 3 次'));
  t('no errors (ok)', r.errors.length === 0); r.close();

  // 2) 只有統計查詢失敗：頁面不視為失敗，退回用已載入的時間軸資料
  r = await run('stats-fail');
  t('統計失敗 → 時間軸仍正常顯示 (2 筆)', r.d.querySelectorAll('#timeline .tl-entry').length === 2);
  t('統計失敗 → 狀態不是連線失敗: ' + r.el('logStatus'), !r.el('logStatus').includes('失敗'));
  t('統計失敗 → 退回已載入資料計算 (今日研究門把=2)', r.el('behTouch') === '2 次');
  t('統計失敗 → 語錄署名用退回值 (今日第 2 次)', r.el('quoteMeta').includes('今日第 2 次'));
  t('統計失敗 → 歷史事件計為 0（無法得知）', r.el('behPush') === '0 次');
  t('no errors (stats-fail)', r.errors.length === 0); r.close();

  // 3) 統計查詢成功但沒有資料：以空結果為準（不退回）
  r = await run('stats-empty');
  t('統計成功但為空 → 今日研究門把 = 0（不退回時間軸資料）', r.el('behTouch') === '0 次');
  t('統計成功但為空 → 語錄署名 = 今日第 0 次', r.el('quoteMeta').includes('今日第 0 次'));
  t('no errors (stats-empty)', r.errors.length === 0); r.close();
  process.exit(0);
})();
