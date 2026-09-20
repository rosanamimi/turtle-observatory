// ---------- data ----------
const stages = [
  "想到門","靠近門","找到門把","摸門把","研究開門角度",
  "決定要不要推","手放上去","推開一點","門縫出現","發出小小訊息"
];
const stageDescs = [
  "龜龜意識到門的存在，開始進行初步心理建設。",
  "龜龜已完成移動，正處於門前一公尺的安全觀察距離。",
  "龜龜的視線已鎖定門把位置，但尚未發起接觸。",
  "龜龜已完成門把接觸，正在確認其物理特性。",
  "龜龜目前已經知道門怎麼開，但正在研究推門需要幾度。",
  "偵測到高強度內部決策活動，結果尚未產出。",
  "手部（前肢）已就定位，等待最終授權。",
  "本日觀察到顯著的『原地進展』，門縫寬度趨近於零但不為零。",
  "門縫已可見，龜龜正在評估是否應該讓訊息通過。",
  "推門動作接近完成，系統準備記錄本次觀察週期結束。"
];
const behaviorTags = [
  "🐢 目前行為：研究門把","🐢 目前行為：偷看門縫","🐢 目前行為：假裝要走開",
  "🐢 目前行為：原地踏步","🐢 目前行為：深呼吸中","🐢 目前行為：重新評估角度",
  "🐢 目前行為：縮回殼裡休息","🐢 目前行為：再次靠近門"
];
const quotes = [
  ["「我不是不推。」","「我只是還在研究。」"],
  ["「我今天有進步。」","「昨天也有人說我有進步。」"],
  ["「再研究一下。」",""],
  ["「我已經走到門前了。」",""],
  ["「門是不是可以再觀察一下？」",""],
  ["「我只是確認門把。」",""],
  ["「我明天一定……」",""],
  ["「何用作福問神仙。」",""],
  ["「我知道門沒鎖。」","「所以不用急著開。」"],
  ["「方向已經明確。」","「剩下的只是方向。」"],
  ["「我沒有停。」","「我只是在原地完成轉換。」"],
  ["「訊息我有想過。」","「想過也是一種進度。」"],
  ["「我不是縮回去。」","「我只是還沒完全出去。」"],
  ["「我有手機。」",""],
  ["「下一步很小。」","「所以值得仔細研究。」"],
  ["「再一下。」",""]
];
const warnings = [
  "龜龜正在思考。","龜龜仍未推門。","門把磨損程度正在上升。",
  "龜龜可能正在研究另一種開門角度。","請勿催促龜龜。",
  "龜龜已經「快好了」三個小時。","目前沒有任何新的實際行動。",
  "何用作福問神仙。"
];

let progress = 73;
let touchesTodayReal = null; // 今日「摸門把」次數，只由真實觀察紀錄計算；讀取失敗時為 null
let wear = 81;
const sceneCard = document.getElementById('sceneCard');
const warnLogEntries = [];
let warnTimer = null; // 警告輪播計時器，見 syncWarnTimer()

// ---------- 02·D 門把磨損：localStorage 持久化（純娛樂性互動統計，不進資料庫） ----------
let handleCheckCount = 0;
let handlePushCount = 0;
let handleResignationSeen = false;

function readWearNum(key, fallback, min, max){
  try{
    const raw = localStorage.getItem(key);
    if(raw === null) return fallback;
    const n = Number(raw);
    if(!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.round(n)));
  }catch(err){
    return fallback; // localStorage 不可用（例如無痕模式限制）時安全回到預設值
  }
}
function readWearBool(key){
  try{
    return localStorage.getItem(key) === '1';
  }catch(err){
    return false;
  }
}
function loadWearState(){
  wear = readWearNum('handleWear', 81, 0, 99);
  handleCheckCount = readWearNum('handleCheckCount', 0, 0, 999999);
  handlePushCount = readWearNum('handlePushCount', 0, 0, 999999);
  handleResignationSeen = readWearBool('handleResignationSeen');
}
function saveWearState(){
  try{
    localStorage.setItem('handleWear', String(wear));
    localStorage.setItem('handleCheckCount', String(handleCheckCount));
    localStorage.setItem('handlePushCount', String(handlePushCount));
    localStorage.setItem('handleResignationSeen', handleResignationSeen ? '1' : '0');
  }catch(err){
    // localStorage 不可寫入時安全略過，不影響畫面互動
  }
}
// 依磨損百分比回傳狀態標籤／說明／色系分級；六階段 MIX 資料完全無關，只是同一套暖金／深紫視覺語言
function wearStatusInfo(w){
  if(w >= 99) return { label:'拒絕繼續配合', desc:'門把已正式提出離職申請。', tier:'critical' };
  if(w >= 90) return { label:'瀕臨崩潰', desc:'建議龜龜儘快決定是否真的要開門。', tier:'critical' };
  if(w >= 70) return { label:'高度磨損', desc:'門把已經開始懷疑人生。', tier:'high' };
  if(w >= 40) return { label:'出現使用痕跡', desc:'偵測到長期觸摸，但推門次數仍然偏低。', tier:'mid' };
  return { label:'狀態良好', desc:'目前仍可承受龜龜的反覆確認。', tier:'good' };
}
// 「真正開門」沿用 02·C 已經算好的真實事件結果（#behOpen），不因按鈕點擊而增加
function renderWearOpenCount(){
  const openEl = document.getElementById('wearOpenCount');
  if(!openEl) return;
  const sourceEl = document.getElementById('behOpen');
  openEl.textContent = sourceEl ? sourceEl.textContent : '0 次';
}
function renderWearUI(){
  document.querySelectorAll('.wear-num').forEach(el=> el.textContent = wear + '%');
  document.querySelectorAll('.wear-bar-inner').forEach(el=> el.style.width = wear + '%');
  const info = wearStatusInfo(wear);
  const tagEl = document.getElementById('wearStatusTag');
  const descEl = document.getElementById('wearStatusDesc');
  if(tagEl){
    tagEl.textContent = info.label;
    tagEl.className = 'wear-status-tag tier-' + info.tier;
  }
  if(descEl) descEl.textContent = info.desc;
  const checkEl = document.getElementById('wearCheckCount');
  const pushEl = document.getElementById('wearPushCount');
  if(checkEl) checkEl.textContent = handleCheckCount + ' 次';
  if(pushEl) pushEl.textContent = handlePushCount + ' 次';
  renderWearOpenCount();
}
// ---------- Modal 共用：記住／還原焦點、Tab 焦點循環、Esc 關閉 ----------
const modalReturnFocus = new WeakMap();
function rememberModalFocus(overlay){
  modalReturnFocus.set(overlay, document.activeElement);
}
function restoreModalFocus(overlay){
  const el = modalReturnFocus.get(overlay);
  modalReturnFocus.delete(overlay);
  if(el && typeof el.focus === 'function' && document.contains(el)) el.focus();
}
document.addEventListener('keydown', (e)=>{
  const overlay = document.querySelector('.modal-overlay.open');
  if(!overlay) return;
  if(e.key === 'Escape'){
    e.preventDefault();
    if(overlay.id === 'resignModalOverlay') closeResignModal();
    return;
  }
  if(e.key !== 'Tab') return;
  const items = Array.from(overlay.querySelectorAll('button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])'))
    .filter(el => el.offsetParent !== null);
  if(items.length === 0) return;
  const first = items[0], last = items[items.length - 1];
  if(!overlay.contains(document.activeElement)){ e.preventDefault(); first.focus(); }
  else if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
  else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
});

function openResignModal(){
  const overlay = document.getElementById('resignModalOverlay');
  if(!overlay) return;
  rememberModalFocus(overlay);
  overlay.classList.add('open');
  const btn = document.getElementById('resignModalConfirmBtn');
  if(btn) btn.focus();
}
function closeResignModal(){
  const overlay = document.getElementById('resignModalOverlay');
  if(!overlay) return;
  overlay.classList.remove('open');
  restoreModalFocus(overlay);
}
// 磨損首次到達 99% 且尚未看過彩蛋時才自動彈出；顯示當下就標記已看過，確保同一瀏覽器只自動出現一次
function maybeShowResignEgg(){
  if(wear >= 99 && !handleResignationSeen){
    handleResignationSeen = true;
    saveWearState();
    openResignModal();
  }
}

// ---------- 觀察日：從 8/13 開始計算 ----------
function updateDayCount(){
  const now = new Date();
  let start = new Date(now.getFullYear(), 7, 13); // 8月是月份索引 7
  if(start > now){ start = new Date(now.getFullYear()-1, 7, 13); }
  const diffDays = Math.floor((now - start) / 86400000) + 1;
  document.getElementById('dayCount').textContent = `第 ${diffDays} 日`;
}
updateDayCount();

// ---------- 真實觀察紀錄（串接 Supabase 資料庫） ----------
const SUPABASE_URL = 'https://ezpcoagdafgqodkrogms.supabase.co';
const SUPABASE_KEY = 'sb_publishable_d4CMWsLWgYi0sSTSgbzF9w_5Ed1iwLg';
const SUPABASE_TABLE = 'observations';
const SUPABASE_HEADERS = {
  apikey: SUPABASE_KEY,
  'Content-Type': 'application/json'
};
const FETCH_TIMEOUT_MS = 10000;
// 逾時涵蓋「連線＋讀完回應內容」：parse 在計時器仍有效時執行，逾時會讓 fetch／res.json() 以 AbortError 失敗
async function requestWithTimeout(url, options, parse){
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try{
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    return await parse(res);
  } finally {
    clearTimeout(timer);
  }
}

let logEntries = []; // 從資料庫讀回來的真實紀錄
const LOG_PAGE_SIZE = 50;
let logLimit = LOG_PAGE_SIZE; // 目前向資料庫要求的筆數上限，「載入更多」時遞增
let logHasMore = false; // 上次讀取筆數達到上限，代表可能還有更舊的紀錄
// 統計專用資料：今天的全部紀錄＋全部實際事件，獨立於時間軸分頁（「載入更多」不會改變統計）
let statsEntries = [];
const STATS_LIMIT = 1000;
const LOG_CHUNK = 500; // 每次請求最多筆數，需小於 Supabase 單次回傳上限（預設 1000）
let realRecordsLoaded = false;

// 時間軸單筆共用模板：time 與 bodyHtml 由呼叫端負責跳脫
function tlEntryHtml(time, bodyHtml){
  return `
    <div class="tl-entry">
      <div class="tl-time mono">${escapeHtml(time)}</div>
      <div class="tl-body">${bodyHtml}</div>
    </div>
  `;
}

// 觀察紀錄篩選（僅在已載入的資料內比對，不重新請求）
let logFilter = '';
function filteredLogEntries(){
  const q = logFilter.trim().toLowerCase();
  if(!q) return logEntries;
  return logEntries.filter(e => [e.text, e.eventType, e.eventContent, e.time, e.eventTime].some(s => String(s ?? '').toLowerCase().includes(q)));
}

function renderTimeline(){
  const list = filteredLogEntries();
  const el = document.getElementById('timeline');
  if(list.length === 0){
    el.innerHTML = `<p class="recent-log-empty">${logEntries.length === 0 ? '尚無觀察紀錄。' : '沒有符合的紀錄。'}</p>`;
  } else {
    el.innerHTML = list.map(e => tlEntryHtml(e.time, `
        <p>${escapeHtml(e.text)}</p>
        ${e.progress ? `<div class="tl-progress">進度：${escapeHtml(e.progress)}</div>` : ''}
        ${e.hasEvent ? `
          <div class="tl-event">
            <div class="tl-event-head">📌 實際事件${e.eventType ? `｜${escapeHtml(e.eventType)}` : ''}</div>
            ${e.eventTime ? `<div class="tl-event-time">${escapeHtml(e.eventTime)}</div>` : ''}
            ${e.eventContent ? `<p>${escapeHtml(e.eventContent)}</p>` : ''}
          </div>
        ` : ''}
      `)).join('');
  }
  const moreBtn = document.getElementById('logLoadMore');
  const countEl = document.getElementById('logCount');
  if(moreBtn) moreBtn.hidden = !logHasMore;
  if(countEl) countEl.textContent = logFilter.trim()
    ? `符合 ${list.length} / 已載入 ${logEntries.length} 筆`
    : `已載入 ${logEntries.length} 筆`;
}

// HOME 頁「RECENT SIGNAL／最近觀測」：合併真實觀察（observations）與 MIX 推測（mix_observations），
// 依時間新到舊取最近 3 筆。不製造假資料——任一來源沒有資料就不放入合併清單。
function renderRecentLog(){
  const el = document.getElementById('recentLog');
  if(!el) return;

  const realItems = logEntries.map(e => ({
    kind: 'real',
    ts: e.createdAtRaw ? new Date(e.createdAtRaw).getTime() : 0,
    time: e.time,
    text: e.text
  }));

  // 用 mixLatestEntries（永遠是 MIX 第 1 頁＝最新資料），不受表格切頁影響
  const mixItems = (typeof mixLatestEntries !== 'undefined' ? mixLatestEntries : []).map(e => ({
    kind: 'mix',
    ts: e.observed_at ? new Date(e.observed_at).getTime() : 0,
    time: formatMixTime(e.observed_at),
    stage: e.stage,
    conclusion: e.conclusion
  }));

  const merged = [...realItems, ...mixItems]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 3);

  if(merged.length === 0){
    el.innerHTML = `<p class="recent-log-empty">尚無觀察紀錄。</p>`;
    return;
  }

  el.innerHTML = merged.map(e => {
    if(e.kind === 'mix'){
      const stageText = e.stage ? escapeHtml(e.stage) : '';
      const conclusionText = e.conclusion ? escapeHtml(e.conclusion) : '';
      const body = [stageText, conclusionText].filter(Boolean).join('｜');
      return tlEntryHtml(e.time, `
            <div class="recent-log-tag recent-log-tag-mix">🔮 MIX</div>
            <p>${body}</p>
          `);
    }
    return tlEntryHtml(e.time, `
          <div class="recent-log-tag recent-log-tag-real">📌 真實觀察</div>
          <p>${escapeHtml(e.text)}</p>
        `);
  }).join('');
}

function formatTimestamp(iso){
  const d = new Date(iso);
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}


// 四軸階段：心理／行動屬於重新接觸前，互動／關係屬於重新接觸後。
// 單一圈號格式保留為舊版綜合階段，不改寫既有資料。
const STAGE_ORDER = ['①','②','③','④','⑤','⑥'];
const STAGE_AXES = {
  pre:  { label:'重新接觸前', axes:['心理','行動'] },
  post: { label:'重新接觸後', axes:['互動','關係'] }
};
const STAGE_AXIS_ALIAS = { P:'心理', A:'行動', F:'互動', R:'關係' };
let selectedStagePhase = 'post';

function parseStageParts(stageStr){
  if(typeof stageStr !== 'string') return [];
  return stageStr.split(/[｜；;]/).map(raw=>raw.trim()).filter(Boolean).map(raw=>{
    const match = raw.match(/^(心理|行動|互動|關係|P|A|F|R)\s*[:：]?\s*([①②③④⑤⑥1-6])/i);
    if(match){
      const alias = match[1].toUpperCase();
      const idx = /^[1-6]$/.test(match[2]) ? Number(match[2]) - 1 : STAGE_ORDER.indexOf(match[2]);
      return { axis:STAGE_AXIS_ALIAS[alias] || match[1], idx, label:raw };
    }
    const legacy = raw.match(/^([①②③④⑤⑥1-6])/);
    if(!legacy) return null;
    const idx = /^[1-6]$/.test(legacy[1]) ? Number(legacy[1]) - 1 : STAGE_ORDER.indexOf(legacy[1]);
    return { axis:'舊版綜合', idx, label:raw };
  }).filter(Boolean);
}

function markProgressUpdated(){
  const el = document.getElementById('progressUpdatedAt');
  if(!el) return;
  const d = new Date();
  const p = n=>String(n).padStart(2,'0');
  el.textContent = `最後更新 ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function stagePhaseOf(entry){
  const parts = parseStageParts(entry && entry.stage);
  if(parts.some(p=>p.axis==='互動' || p.axis==='關係')) return 'post';
  if(parts.length) return 'pre';
  return null;
}
function stageIndexOf(stageStr){
  const parts = parseStageParts(stageStr);
  // 舊有 Dashboard 邏輯維持只讀重新接觸前的行動／綜合／心理階段；
  // 02 的四軸顯示直接使用 parseStageParts，不改變首頁既有行為。
  const preferred = parts.find(p=>p.axis==='行動') || parts.find(p=>p.axis==='舊版綜合') || parts.find(p=>p.axis==='心理');
  return preferred ? preferred.idx : null;
}

// ---------- 02·A／02·B：以 mix_observations.stage 六階段為主要資料來源 ----------
// 文案與「新增 MIX 紀錄」表單的 #mixStage 選項保持一致，避免兩處措辭不同調
const STAGE_NAMES = ['🌱 尚未形成','👀 開始靠近','🚪 心理放行','🤏 準備行動','✋ 發送前臨界','💬 已發送'];
const STAGE_ONE_LINERS = [
  '還沒有明確的主動行動傾向。',
  '開始出現聯絡念頭、尋找理由或入口。',
  '心理上已經允許自己靠近，但尚未進入實際準備。',
  '開始處理「怎麼傳、什麼時候傳、傳什麼」。',
  '實際行動已非常接近，只差最後一步。',
  '第一則主動小訊息已實際發出。'
];
function stageFullLabel(idx){
  return `${STAGE_ORDER[idx]} ${STAGE_NAMES[idx]}`;
}
// 只保留 stage 欄位可辨識的紀錄；忽略空值／格式無法辨識的紀錄。
function validMixEntries(){
  return (typeof mixLatestEntries !== 'undefined' ? mixLatestEntries : []).filter(e => parseStageParts(e.stage).length > 0);
}
// 比較「目前」與「前一筆」的六階段索引，回傳狀態類型與顯示文字
function stageChangeLabel(curIdx, prevIdx, noPrevLabel){
  if(prevIdx === null || prevIdx === undefined){
    return { type:'none', label: noPrevLabel || '尚無前次觀測可比較' };
  }
  if(curIdx === prevIdx) return { type:'same', label:'維持原階段' };
  if(curIdx > prevIdx) return { type:'up', label:`前進 ${curIdx - prevIdx} 階` };
  return { type:'down', label:`回落 ${prevIdx - curIdx} 階` };
}

function stageAbsurdVerdict(phaseKey, parts){
  const level = parts.length ? Math.max(...parts.map(p=>p.idx)) : 0;
  const pre = [
    '龜龜已確認門的存在，並決定先尊重它的隱私。',
    '龜龜正在靠近。所謂靠近，是一種需要長期研究的移動方式。',
    '內部會議已同意可以前進，肢體執行部仍在閱讀會議紀錄。',
    '開場白已在腦中完成數次彩排，目前沒有任何一句離開腦中。',
    '距離送出只差最後一步，以及對最後一步的完整風險評估。',
    '訊息真的出去了。觀測所正在確認這是否違反龜龜物理學。'
  ];
  const post = [
    '重新接觸已發生，雙方暫時都假裝這是一件非常普通的事。',
    '龜龜已經走回門口，目前正在研究「回來」能不能算完成一半。',
    '互動正在形成。每一個自然回覆背後都有一場不自然的內部會議。',
    '關係開始往前，但龜龜堅持使用肉眼幾乎看不見的速度。',
    '連結逐漸穩定，觀測所暫時找不到新的理由可以替龜龜緊張。',
    '關係已進入新階段。門把要求把這項成果寫進年終考核。'
  ];
  return (phaseKey==='post' ? post : pre)[Math.min(level,5)];
}

// 02·A：目前觀測階段——只顯示「最新一筆有效 MIX 紀錄」的六階段資訊，不換算成看似精確的成功機率
function renderStageOverview(){
  const container = document.getElementById('stageOverview');
  if(!container) return;
  container.setAttribute('aria-busy','false');
  const valid = validMixEntries();
  if(valid.length === 0){
    container.innerHTML = `
      <div class="stage-empty">
        <p class="stage-empty-title">尚無可用的 MIX 觀測資料</p>
        <p class="stage-empty-hint">目前尚無含有效階段的 MIX 觀測紀錄，有紀錄後這裡才會顯示龜龜目前的六階段觀測位置。</p>
      </div>`;
    return;
  }
  const phaseEntries = valid.filter(e=>stagePhaseOf(e)===selectedStagePhase);
  const latest = phaseEntries[0];
  const phase = STAGE_AXES[selectedStagePhase];
  if(!latest){
    container.innerHTML = `<div class="stage-empty"><p class="stage-empty-title">尚無聊天後的互動／關係階段資料</p><p class="stage-empty-hint">完整的接觸前紀錄仍可在 01 · C MIX 龜龜觀測站查看。</p></div>`;
    return;
  }
  const parts = parseStageParts(latest.stage);
  const legacy = parts.find(p=>p.axis==='舊版綜合');
  const axes = legacy ? ['舊版綜合'] : phase.axes.filter(axis=>parts.some(p=>p.axis===axis));
  const axisCards = axes.map(axis=>{
    const part = parts.find(p=>p.axis===axis);
    const previousPart = phaseEntries.slice(1).map(e=>parseStageParts(e.stage).find(p=>p.axis===axis)).find(Boolean);
    const change = stageChangeLabel(part.idx, previousPart ? previousPart.idx : null);
    return `<div class="stage-axis-card">
      <div class="stage-axis-label">${axis}</div>
      <div class="stage-axis-value">${escapeHtml(part.label.replace(/^(心理|行動|互動|關係|P|A|F|R)\s*[:：]?\s*/i,''))}</div>
      <span class="stage-change-tag stage-change-${change.type}">${change.label}</span>
      <div class="stage-progress" role="img" aria-label="${axis}為第 ${part.idx+1} 階">
        <div class="stage-progress-rail"><div class="stage-progress-fill" style="width:${((part.idx+1)/6)*100}%"></div></div>
        <div class="stage-progress-dots">${STAGE_ORDER.map((n,i)=>`<span class="stage-progress-dot${i<=part.idx?' is-reached':''}${i===part.idx?' is-current':''}">${n}</span>`).join('')}</div>
      </div>
    </div>`;
  }).join('');
  container.innerHTML = `
    <p class="stage-phase-note">斷斷續續聊天中 · 最新觀測時間：${formatMixTime(latest.observed_at)}</p>
    <div class="stage-verdict">${stageAbsurdVerdict(selectedStagePhase,parts)}<small>觀測所翻譯結果，原始階段資料如下</small></div>
    <div class="stage-axis-grid${axes.length===1?' is-single':''}">${axisCards}</div>
  `;
}

// 02·B：階段軌跡——最近 10 筆有效 MIX 紀錄，由新到舊排列，保留連續重複階段（不去重）
function renderStageTrajectory(){
  const container = document.getElementById('stageTrajectory');
  if(!container) return;
  container.setAttribute('aria-busy','false');
  const allValid = validMixEntries(); // 新→舊
  const valid = allValid.filter(e=>stagePhaseOf(e)===selectedStagePhase);
  if(valid.length === 0){
    container.innerHTML = `<p class="stage-tl-empty">尚無可用的 MIX 觀測資料，暫無階段軌跡可顯示。</p>`;
    return;
  }
  const phase = STAGE_AXES[selectedStagePhase];
  let upCount = 0, sameCount = 0, downCount = 0;
  const axesToCompare = selectedStagePhase==='pre' ? ['心理','行動','舊版綜合'] : phase.axes;
  axesToCompare.forEach(axis=>{
    const values = valid.map(e=>parseStageParts(e.stage).find(p=>p.axis===axis)).filter(Boolean);
    for(let i=0;i<values.length-1;i++){
      if(values[i].idx > values[i+1].idx) upCount++;
      else if(values[i].idx < values[i+1].idx) downCount++;
      else sameCount++;
    }
  });
  const summaryHtml = `
    <div class="stage-trend-summary" aria-label="最近 ${valid.length} 筆觀測變化摘要">
      <div class="stage-trend-stat"><span class="v">${valid.length}</span><span class="k">近期觀測</span></div>
      <div class="stage-trend-stat"><span class="v">${upCount}</span><span class="k">前進</span></div>
      <div class="stage-trend-stat"><span class="v">${sameCount}</span><span class="k">原地研究</span></div>
      <div class="stage-trend-stat"><span class="v">${downCount}</span><span class="k">戰術性後退</span></div>
    </div>`;
  const trendVerdict = upCount > downCount && upCount > sameCount
    ? '系統判定：龜龜確實有動。觀測所對此感到措手不及。'
    : sameCount >= upCount && sameCount >= downCount
      ? `系統判定：龜龜成功把同一件事重新想了 ${sameCount || valid.length} 次。`
      : '系統判定：這不是退步，是龜龜正在為前進增加助跑距離。';
  const listHtml = valid.map((e, i)=>{
    const parts = parseStageParts(e.stage).filter(p=>axesToCompare.includes(p.axis));
    return `
      <div class="stage-compact-row">
        <time class="stage-compact-time">${formatMixTime(e.observed_at)}</time>
        <div class="stage-tl-axes">${parts.map(p=>`<span class="stage-axis-badge"><b>${p.axis}</b>${escapeHtml(p.label.replace(/^(心理|行動|互動|關係|P|A|F|R)\s*[:：]?\s*/i,''))}</span>`).join('')}</div>
      </div>`;
  }).join('');

  container.innerHTML = `<p class="stage-phase-note">${phase.label} · 完整案情請至 01 · C 查看。</p>` + summaryHtml + `<p class="trajectory-verdict">${trendVerdict}</p><div class="stage-compact-list" aria-label="${phase.label}最近 ${valid.length} 筆階段摘要">${listHtml}</div>`;
}

const MIND_BASELINE_BY_STAGE = [20, 40, 60, 75, 90, 99];
const MIND_DECREASE_KW = /阻力加重|退縮|重新封閉|不安全感上升/;
const MIND_INCREASE_KW = /阻力鬆動|開始解除|更能接受主動|接近行動/;
const TOUCH_KEYWORDS = /摸門把|研究門把|確認門把|看門|靠近|找理由|想傳|打開對話框|想訊息內容/;

// 完全從真實觀察紀錄（observations）＋ MIX 推測（mix_observations）自動推算 Dashboard 數字
function updateDashboardStats(){
  // 今日：以本地時區今天 00:00 至隔天 00:00 的完整時間戳比對（含年份，避免 9/2 誤中 9/20 或往年同日）
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
  const todays = statsEntries.filter(e => {
    const t = new Date(e.createdAtRaw).getTime();
    return t >= dayStart.getTime() && t < dayEnd.getTime();
  });

  // 今日研究門把：文字命中任一關鍵字就算一次
  const touchesToday = todays.filter(e => TOUCH_KEYWORDS.test(e.text)).length;

  // 最新一筆 MIX：用 mixLatestEntries（永遠對應 MIX 第 1 頁＝最新資料，已依 observed_at desc 排序，
  // index 0 為最新），不會因為表格切到第 2 頁以後而誤用舊資料
  const latestMix = (typeof mixLatestEntries !== 'undefined' && mixLatestEntries.length > 0) ? mixLatestEntries[0] : null;
  const stageIdx = latestMix ? stageIndexOf(latestMix.stage) : null;

  // 🧠 心理放行：MIX stage 對應基準值，再依最新 3 筆 MIX 的用詞加分／扣分
  let mindPercent = stageIdx !== null ? MIND_BASELINE_BY_STAGE[stageIdx] : progress;
  if(typeof mixLatestEntries !== 'undefined' && mixLatestEntries.length > 0){
    let mindAdjust = 0;
    mixLatestEntries.slice(0, 3).forEach(m => {
      const t = `${m.conclusion || ''} ${m.question || ''}`;
      if(MIND_DECREASE_KW.test(t)) mindAdjust -= 8;
      if(MIND_INCREASE_KW.test(t)) mindAdjust += 8;
    });
    mindAdjust = Math.max(-20, Math.min(20, mindAdjust));
    mindPercent = Math.max(0, Math.min(99, Math.round(mindPercent + mindAdjust)));
  }
  setProgress(mindPercent, null);

  // ---------- 龜龜今日行為統計（TAB1）也吃同一批真實資料 ----------
  const peekToday = todays.filter(e => /看門/.test(e.text)).length;
  const approachToday = todays.filter(e => /靠近/.test(e.text)).length;
  const researchToday = todays.filter(e => /研究/.test(e.text)).length;
  const suddenRetreatToday = todays.filter(e => /退/.test(e.text)).length;
  const shellToday = todays.filter(e => /縮/.test(e.text)).length;
  const prepToday = todays.filter(e => /準備訊息|想傳/.test(e.text)).length;
  // 「真正推門」「成功開門」是里程碑事件，看全部真實紀錄有沒有發生過，不侷限今天
  const pushCount = statsEntries.filter(e => e.hasEvent && /文字|訊息|簡訊|line|Line|LINE/i.test(e.eventType)).length;
  const openCount = statsEntries.filter(e => e.hasEvent && /通話|面對面|見面|語音|視訊/.test(e.eventType)).length;

  document.getElementById('behPeek').textContent = peekToday + ' 次';
  document.getElementById('behApproach').textContent = approachToday + ' 次';
  document.getElementById('behResearch').textContent = researchToday + ' 次';
  document.getElementById('behRetreat').textContent = suddenRetreatToday + ' 次';
  document.getElementById('behShell').textContent = shellToday + ' 次';
  document.getElementById('behPrep').textContent = prepToday + ' 次';
  document.getElementById('behPush').textContent = pushCount + ' 次';
  document.getElementById('behOpen').textContent = openCount + ' 次';
  renderWearOpenCount();
  document.getElementById('behPushCard').classList.toggle('zero', pushCount === 0);
  document.getElementById('behOpenCard').classList.toggle('zero', openCount === 0);

  document.getElementById('behTouch').textContent = touchesToday + ' 次';
  touchesTodayReal = realRecordsLoaded ? touchesToday : null;
  updateQuoteMeta();
  const behaviorNote = document.getElementById('behaviorDataNote');
  if(behaviorNote){
    const d = new Date();
    behaviorNote.textContent = `今日行為依真實觀察文字計算；送出訊息與深入互動為已讀取紀錄累計。統計截至 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}。`;
  }
  syncObsReport();
}

// 讀取序號：較舊的請求（含其逾時失敗）不得覆蓋較新請求的結果；舊請求改為等待最新那次的結果
let logLoadSeq = 0;
let latestLogLoad = null;
function loadLogEntries(){
  const seq = ++logLoadSeq;
  latestLogLoad = runLogLoad(seq);
  return latestLogLoad;
}

// 依序分段抓取最新的 total 筆（每段 LOG_CHUNK），避免單次 limit 超過伺服器上限而被靜默截斷
// 回傳 { rows, full }：full 表示湊滿了 total 筆（可能還有更舊的紀錄）
async function fetchObservationWindow(total, parseJson){
  const rows = [];
  while(rows.length < total){
    const n = Math.min(LOG_CHUNK, total - rows.length);
    const page = await requestWithTimeout(
      `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?select=created_at,text,progress,has_event,event_time,event_type,event_content&order=created_at.desc&limit=${n}&offset=${rows.length}`,
      { headers: SUPABASE_HEADERS },
      parseJson
    );
    rows.push(...page);
    if(page.length < n) return { rows, full: false };
  }
  return { rows, full: true };
}

// 今天（本地時區 00:00～隔天 00:00）的全部紀錄，加上所有實際事件
function statsQueryUrl(){
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 1);
  const cond = `(has_event.eq.true,and(created_at.gte.${start.toISOString()},created_at.lt.${end.toISOString()}))`;
  return `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?select=created_at,text,has_event,event_type&or=${encodeURIComponent(cond)}&order=created_at.desc&limit=${STATS_LIMIT}`;
}

async function runLogLoad(seq){
  const statusEl = document.getElementById('logStatus');
  statusEl.textContent = '正在連接資料庫…';
  let loaded = false;
  try{
    const parseJson = async res => {
      if(!res.ok) throw new Error('load failed: ' + res.status);
      return res.json();
    };
    // 統計查詢失敗不視為整體失敗：退回用已載入的紀錄計算
    const statsReq = requestWithTimeout(statsQueryUrl(), { headers: SUPABASE_HEADERS }, parseJson).catch(() => null);
    const { rows, full } = await fetchObservationWindow(logLimit, parseJson);
    const statRows = await statsReq;
    if(seq !== logLoadSeq) return latestLogLoad;
    logEntries = rows.map(row => ({
      time: formatTimestamp(row.created_at),
      createdAtRaw: row.created_at,
      text: row.text,
      progress: (row.progress !== null && row.progress !== undefined) ? `${row.progress}%` : '',
      hasEvent: !!row.has_event,
      eventTime: row.event_time ? formatTimestamp(row.event_time) : '',
      eventType: row.event_type || '',
      eventContent: row.event_content || ''
    }));
    statsEntries = statRows
      ? statRows.map(r => ({ createdAtRaw: r.created_at, text: r.text || '', hasEvent: !!r.has_event, eventType: r.event_type || '' }))
      : logEntries;
    logHasMore = full;
    statusEl.textContent = logHasMore
      ? `已連接資料庫，已載入最近 ${logEntries.length} 筆真實紀錄，可能還有更早的紀錄。`
      : `已連接資料庫，共 ${logEntries.length} 筆真實紀錄（所有裝置共用）。`;
    loaded = true;
    realRecordsLoaded = true;
  }catch(err){
    if(seq !== logLoadSeq) return latestLogLoad;
    logEntries = [];
    logHasMore = false;
    statsEntries = [];
    realRecordsLoaded = false;
    statusEl.textContent = '資料庫連線失敗，目前無法顯示紀錄。請確認網路連線，或稍後重新整理再試。';
  }
  renderTimeline();
  renderRecentLog();
  updateDashboardStats();
  if(!loaded){
    touchesTodayReal = null;
    updateQuoteMeta();
    document.querySelectorAll('#tab-progress .behavior-primary .n,#tab-progress .behavior-secondary .n').forEach(el=>el.textContent='—');
    document.getElementById('behaviorDataNote').textContent = '真實觀察資料暫時無法讀取，統計尚未更新。';
  }
  if(loaded) markProgressUpdated();
  return loaded;
}

async function addLogEntry(){
  const textEl = document.getElementById('logInput');
  const progEl = document.getElementById('logProgress');
  const btnEl = document.getElementById('addLogBtn');
  const statusEl = document.getElementById('logStatus');
  const hasEventEl = document.querySelector('input[name="hasEvent"]:checked');
  const eventTimeEl = document.getElementById('eventTime');
  const eventTypeEl = document.getElementById('eventType');
  const eventContentEl = document.getElementById('eventContent');

  const text = textEl.value.trim();
  if(!text){ textEl.focus(); return; }
  const progVal = progEl.value.trim();
  const hasEvent = hasEventEl && hasEventEl.value === 'yes';

  btnEl.disabled = true;
  statusEl.textContent = '新增中…';
  try{
    const body = { text, has_event: hasEvent };
    if(progVal !== '') body.progress = Number(progVal);
    if(hasEvent){
      body.event_time = eventTimeEl.value ? new Date(eventTimeEl.value).toISOString() : null;
      body.event_type = eventTypeEl.value.trim();
      body.event_content = eventContentEl.value.trim();
    }
    await requestWithTimeout(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
      method: 'POST',
      headers: { ...SUPABASE_HEADERS, Prefer: 'return=minimal' },
      body: JSON.stringify(body)
    }, async res => {
      if(!res.ok) throw Object.assign(new Error('insert failed: ' + res.status), { rejected: true });
    });

    textEl.value = '';
    progEl.value = '';
    document.getElementById('hasEventNo').checked = true;
    document.getElementById('eventFields').classList.remove('open');
    eventTimeEl.value = '';
    eventTypeEl.value = '';
    eventContentEl.value = '';
    if(progVal !== ''){ setProgress(Number(progVal), null); }

    const reloaded = await loadLogEntries();
    statusEl.textContent = reloaded
      ? `已新增並同步到資料庫！共 ${logEntries.length} 筆真實紀錄。`
      : '已新增到資料庫，但重新讀取失敗，請稍後重新整理確認，請勿重複新增。';
  }catch(err){
    statusEl.textContent = err.rejected
      ? '新增失敗，請確認 Supabase 的 Policy 是否已開放 INSERT。'
      : '無法確認是否已寫入（連線逾時或中斷），請先重新整理確認紀錄，再決定是否重新送出，避免重複新增。';
  }finally{
    btnEl.disabled = false;
  }
}

document.querySelectorAll('input[name="hasEvent"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const yes = document.getElementById('hasEventYes').checked;
    document.getElementById('eventFields').classList.toggle('open', yes);
  });
});

document.getElementById('addLogBtn').addEventListener('click', addLogEntry);

document.getElementById('logFilter').addEventListener('input', e => {
  logFilter = e.target.value;
  renderTimeline();
});
document.getElementById('logLoadMore').addEventListener('click', () => {
  logLimit += LOG_PAGE_SIZE;
  loadLogEntries();
});
loadLogEntries();

// ---------- MIX 龜龜觀測站（獨立的 Supabase 資料表：mix_observations，server-side 分頁） ----------
const MIX_TABLE = 'mix_observations';
const MIX_PAGE_SIZE = 10;
// mixLatestEntries：永遠對應「第 1 頁＝最新資料」，給首頁 RECENT SIGNAL／updateDashboardStats() 用，
// 不會因為使用者把表格切到第 2 頁以後而被覆蓋。
// mixPageEntries：目前表格頁面實際顯示的那一頁資料，會隨切頁改變。
let mixLatestEntries = [];
let mixPageEntries = [];
let mixCurrentPage = 1;
let mixTotalCount = 0;
let mixTotalPages = 1;
let mixPageLoading = false;

function formatMixTime(iso){
  if(!iso) return '';
  const d = new Date(iso);
  const p = n => n.toString().padStart(2,'0');
  return `${d.getFullYear()}/${p(d.getMonth()+1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function escapeHtml(s){
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderMixStageBadges(stage){
  return String(stage ?? '').split('｜').map(s => s.trim()).filter(Boolean).map(label => {
    // 英文字母需位於開頭，後接數字、圈號、分隔符或結尾，避免誤認一般舊文字。
    const axis = label.match(/^(心理|行動|互動|關係)/)?.[1]
      || label.match(/^([PAFR])(?=\s|[0-9①-⑳０-９:：｜·-]|$)/i)?.[1]?.toUpperCase();
    const tone = ({心理:'p', P:'p', 行動:'a', A:'a', 互動:'f', F:'f', 關係:'r', R:'r'})[axis] || 'a';
    return `<span class="mix-stage-badge mix-stage-${tone}">${escapeHtml(label)}</span>`;
  }).join('');
}

function mixReadingBlock(value, kind, index){
  const question = kind === 'question';
  const id = `mix-${kind}-${index}`;
  return `<section class="mix-reading mix-${kind}">
    <h3>${question ? 'OBSERVATION QUESTION · 觀測問題' : 'MIX CONCLUSION · 交集結論'}</h3>
    <div class="mix-copy" id="${id}">${escapeHtml(String(value ?? ''))}</div>
    <button type="button" class="mix-expand" aria-expanded="false" aria-controls="${id}" hidden>${question ? '展開問題' : '展開全文'}</button>
  </section>`;
}

function syncMixToggles(){
  document.querySelectorAll('#mixRecords .mix-copy').forEach(copy => {
    if(!copy.getClientRects().length) return; // 隱藏分頁待顯示後再量測。
    const button = copy.nextElementSibling;
    const expanded = button.getAttribute('aria-expanded') === 'true';
    copy.classList.remove('is-expanded');
    const overflowing = copy.scrollHeight > copy.clientHeight + 1;
    copy.classList.toggle('is-expanded', expanded);
    button.hidden = !overflowing;
  });
}

const mixRecords = document.getElementById('mixRecords');
mixRecords.addEventListener('click', event => {
  const button = event.target.closest('.mix-expand');
  if(!button) return;
  const expanded = button.getAttribute('aria-expanded') !== 'true';
  const copy = document.getElementById(button.getAttribute('aria-controls'));
  copy.classList.toggle('is-expanded', expanded);
  button.setAttribute('aria-expanded', String(expanded));
  button.textContent = copy.closest('.mix-question')
    ? (expanded ? '收合問題' : '展開問題') : (expanded ? '收合內容' : '展開全文');
});
let mixMeasureFrame;
function scheduleMixMeasurement(){
  cancelAnimationFrame(mixMeasureFrame);
  mixMeasureFrame = requestAnimationFrame(syncMixToggles);
}
if(typeof ResizeObserver !== 'undefined') new ResizeObserver(scheduleMixMeasurement).observe(mixRecords);
window.addEventListener('resize', scheduleMixMeasurement);
if(document.fonts) document.fonts.ready.then(scheduleMixMeasurement);

function renderMixCards(){
  const body = mixRecords;
  const empty = document.getElementById('mixEmpty');
  if(mixPageEntries.length === 0){
    body.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  body.innerHTML = mixPageEntries.map((e, index) => {
    const dateTime = formatMixTime(e.observed_at);
    const components = String(e.mix_components ?? '').split(/[＋+、,，｜|／/]/).map(s => s.trim()).filter(Boolean);
    return `<article class="mix-record" aria-label="${escapeHtml(dateTime)} MIX 觀測紀錄">
      <header class="mix-record-head">
        <div class="mix-record-time">${escapeHtml(dateTime)}</div>
        <div class="mix-stages">${renderMixStageBadges(e.stage)}</div>
      </header>
      ${components.length ? `<div class="mix-components" aria-label="MIX 組成">${components.map(s => `<span class="mix-component">${escapeHtml(s)}</span>`).join('')}</div>` : ''}
      ${mixReadingBlock(e.question, 'question', index)}
      ${mixReadingBlock(e.conclusion, 'conclusion', index)}
    </article>`;
  }).join('');
  scheduleMixMeasurement();
}

// 分頁列文字／按鈕狀態；只有超過 1 頁才顯示整組控制項
function renderMixPagination(){
  const wrap = document.getElementById('mixPagination');
  const info = document.getElementById('mixPageInfo');
  const prevBtn = document.getElementById('mixPrevBtn');
  const nextBtn = document.getElementById('mixNextBtn');
  if(!wrap || !info || !prevBtn || !nextBtn) return;
  if(mixTotalPages <= 1){
    wrap.style.display = 'none';
    return;
  }
  wrap.style.display = 'flex';
  info.textContent = `第 ${mixCurrentPage} / ${mixTotalPages} 頁`;
  prevBtn.disabled = mixPageLoading || mixCurrentPage <= 1;
  nextBtn.disabled = mixPageLoading || mixCurrentPage >= mixTotalPages;
}

// 真正的 Supabase server-side pagination：limit/offset 取目前頁資料，
// Prefer: count=exact 讓回應帶 Content-Range，從中解析總筆數／總頁數。
// 載入中收到的新請求不丟棄：排成下一次讀取（只保留最後一次），回傳的 Promise 會等到那次讀取完成
let mixQueued = null;
async function loadMixPage(page, opts){
  if(mixPageLoading){
    return new Promise(resolve => {
      if(mixQueued){ mixQueued.page = page; mixQueued.opts = opts; mixQueued.resolvers.push(resolve); }
      else mixQueued = { page, opts, resolvers: [resolve] };
    });
  }
  await runMixPage(page, opts);
  while(mixQueued){
    const q = mixQueued;
    mixQueued = null;
    try{
      await runMixPage(q.page, q.opts);
    } finally {
      q.resolvers.forEach(r => r());
    }
  }
}

async function runMixPage(page, opts){
  mixPageLoading = true;
  renderMixPagination(); // 立刻停用上一頁／下一頁，避免載入期間被重複點擊

  const statusEl = document.getElementById('mixStatus');
  statusEl.textContent = '正在連接資料庫…';
  const offset = (page - 1) * MIX_PAGE_SIZE;
  let succeeded = false;

  try{
    const { data, contentRange } = await requestWithTimeout(
      `${SUPABASE_URL}/rest/v1/${MIX_TABLE}?select=observed_at,question,mix_components,conclusion,stage&order=observed_at.desc&limit=${MIX_PAGE_SIZE}&offset=${offset}`,
      { headers: { ...SUPABASE_HEADERS, Prefer: 'count=exact' } },
      async res => {
        if(!res.ok) throw new Error('load failed: ' + res.status);
        return { data: await res.json(), contentRange: res.headers.get('content-range') };
      }
    );

    // Content-Range 格式如「0-9/23」；沒有資料時可能是「*/0」
    if(contentRange && contentRange.indexOf('/') !== -1){
      const totalPart = contentRange.split('/')[1];
      const parsedTotal = totalPart === '*' ? NaN : parseInt(totalPart, 10);
      if(!Number.isNaN(parsedTotal)) mixTotalCount = parsedTotal;
    }
    mixTotalPages = Math.max(1, Math.ceil(mixTotalCount / MIX_PAGE_SIZE));

    // 資料筆數變動（例如刪除）導致要求的頁碼超出範圍：自動改載最後一個有效頁面
    if(page > mixTotalPages){
      mixPageLoading = false;
      await runMixPage(mixTotalPages, opts);
      return;
    }

    mixCurrentPage = page;
    mixPageEntries = data;
    if(page === 1) mixLatestEntries = data; // 首頁／統計只吃第 1 頁（最新資料），切頁不會覆蓋它

    statusEl.textContent = `已連接資料庫，共 ${mixTotalCount} 筆 MIX 觀測紀錄。`;
    succeeded = true;
  }catch(err){
    // 失敗時保留目前畫面內容，不清空既有表格／分頁，只更新狀態文字
    statusEl.textContent = '資料庫連線失敗，請確認 mix_observations 這張表已建立且 Policy 已開放。';
    ['stageOverview','stageTrajectory'].forEach(id=>{
      const el = document.getElementById(id);
      if(!el) return;
      el.setAttribute('aria-busy','false');
      el.innerHTML = `<div class="stage-empty"><p class="stage-empty-title">暫時無法讀取觀測階段</p><p class="stage-empty-hint">資料連線失敗，稍後重新整理頁面即可再次嘗試。</p></div>`;
    });
  }finally{
    mixPageLoading = false;
    renderMixCards();
    renderMixPagination();
  }

  if(succeeded){
    renderRecentLog();
    updateDashboardStats();
    if(!realRecordsLoaded){
      document.querySelectorAll('#tab-progress .behavior-primary .n,#tab-progress .behavior-secondary .n').forEach(el=>el.textContent='—');
      document.getElementById('behaviorDataNote').textContent = '真實觀察資料暫時無法讀取，統計尚未更新。';
    }
    renderStageOverview();
    renderStageTrajectory();
    markProgressUpdated();
    if(opts && opts.scrollToSection){
      const target = document.getElementById('logSecMix');
      // 'auto' 在有 CSS scroll-behavior:smooth 時仍會被判定成平滑捲動，要用 'instant' 才會真正瞬間跳轉
      if(target) target.scrollIntoView({ behavior: prefersReducedMotion() ? 'instant' : 'smooth', block:'start' });
    }
  }
}

document.getElementById('mixPrevBtn').addEventListener('click', ()=>{
  if(mixPageLoading || mixCurrentPage <= 1) return;
  loadMixPage(mixCurrentPage - 1, { scrollToSection: true });
});
document.getElementById('mixNextBtn').addEventListener('click', ()=>{
  if(mixPageLoading || mixCurrentPage >= mixTotalPages) return;
  loadMixPage(mixCurrentPage + 1, { scrollToSection: true });
});

loadMixPage(1);

document.getElementById('progressRefreshBtn').addEventListener('click', async ()=>{
  const btn = document.getElementById('progressRefreshBtn');
  const label = document.getElementById('progressUpdatedAt');
  btn.disabled = true;
  label.textContent = '正在重新讀取觀測資料…';
  try{
    await Promise.all([loadLogEntries(), loadMixPage(1)]);
    if(/正在重新讀取/.test(label.textContent)) label.textContent = '讀取未完成，請稍後再試。';
  }finally{
    btn.disabled = false;
  }
});

document.getElementById('wearResetBtn').addEventListener('click', ()=>{
  if(!window.confirm('要重設這台裝置的門把磨損與查看／催促次數嗎？')) return;
  wear = 81;
  handleCheckCount = 0;
  handlePushCount = 0;
  handleResignationSeen = false;
  saveWearState();
  renderWearUI();
});

// ---------- tabs（含網址 hash 狀態：#home／#log／#progress／#warn） ----------
const tabBtns = document.querySelectorAll('.tabbtn');
const panels = document.querySelectorAll('.tabpanel');
const TAB_NAMES = Array.from(tabBtns).map(b=>b.dataset.tab); // ['home','log','progress','warn']

// 純 DOM 切換：切分頁 active 狀態＋（可選）捲動到頂部。
// .tabpanel 的 fadein 動畫是靠 display:none → block 觸發，沿用同一套 class 切換邏輯即可保留淡入效果。
function activateTab(tabName, opts){
  const scroll = !opts || opts.scroll !== false;
  const targetBtn = document.querySelector(`.tabbtn[data-tab="${tabName}"]`);
  const targetPanel = document.getElementById('tab-'+tabName);
  if(!targetBtn || !targetPanel) return false;
  tabBtns.forEach(b=>{ b.classList.remove('active'); b.setAttribute('aria-selected','false'); b.tabIndex = -1; });
  panels.forEach(p=>p.classList.remove('active'));
  targetBtn.classList.add('active'); targetBtn.setAttribute('aria-selected','true'); targetBtn.tabIndex = 0;
  targetPanel.classList.add('active');
  syncWarnTimer();
  if(tabName === 'log') scheduleMixMeasurement();
  if(scroll) window.scrollTo({top:0, behavior:'instant'});
  return true;
}

// 目前網址 hash 對應的分頁；hash 不存在或不是合法分頁名稱時，回傳 'home'
function tabFromHash(){
  const h = location.hash.replace('#','');
  return TAB_NAMES.includes(h) ? h : 'home';
}

tabBtns.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const tab = btn.dataset.tab;
    if(location.hash === '#'+tab){
      // 目前已在這個分頁：hash 不會變、不會觸發 hashchange，直接切換（維持原本「重複點擊也捲動到頂部」的行為）
      activateTab(tab);
    } else {
      location.hash = tab; // 觸發 hashchange，由下方監聽統一處理切換＋捲動
    }
  });
});

// 方向鍵／Home／End 在分頁間移動（自動啟用，沿用點擊的 hash 切換流程）
document.querySelector('.tabbar').addEventListener('keydown', (e)=>{
  const i = Array.prototype.indexOf.call(tabBtns, document.activeElement);
  if(i === -1) return;
  let next = null;
  if(e.key === 'ArrowRight') next = (i + 1) % tabBtns.length;
  else if(e.key === 'ArrowLeft') next = (i - 1 + tabBtns.length) % tabBtns.length;
  else if(e.key === 'Home') next = 0;
  else if(e.key === 'End') next = tabBtns.length - 1;
  if(next === null) return;
  e.preventDefault();
  tabBtns[next].focus();
  tabBtns[next].click();
});

// 瀏覽器上一頁／下一頁、或手動修改網址 hash 時同步切換分頁
window.addEventListener('hashchange', ()=>{
  activateTab(tabFromHash());
});

// 頁面初次載入／重新整理：依目前 hash 開啟對應分頁；無效或不存在則顯示首頁。
// 一開始就在頁面頂部，不需要捲動動畫。
activateTab(tabFromHash(), {scroll:false});

// HOME「查看全部觀察紀錄 →」：切換到 01 觀察紀錄 分頁（重用既有 Tab 切換邏輯，會一併更新網址為 #log）
const recentLogMoreBtn = document.getElementById('recentLogMore');
if(recentLogMoreBtn){
  recentLogMoreBtn.addEventListener('click', ()=>{
    const logTabBtn = document.querySelector('.tabbtn[data-tab="log"]');
    if(logTabBtn) logTabBtn.click();
  });
}

// 01 觀察紀錄分頁內快速導覽：純畫面平滑捲動（scroll-margin-top 已處理 sticky 主導覽的遮擋），
// 不會改動網址 hash，跟 #home/#log/#progress/#warn 的分頁路由完全獨立
document.querySelectorAll('.log-quicknav-link').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const target = document.getElementById(btn.dataset.target);
    if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
  });
});

// 使用者是否開啟「減少動態效果」，供本次新增的捲動互動（回到頂端／MIX 切頁後捲回）判斷
// 是否要用 smooth 還是直接跳轉，函式宣告會 hoist，前面用到也沒問題
function prefersReducedMotion(){
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

// ---------- 回到頂端：全站共用（不限 01 分頁） ----------
(function initBackToTop(){
  const btn = document.getElementById('backToTop');
  if(!btn) return;
  const SHOW_AFTER = 400;
  let visible = false;
  function syncVisibility(){
    const shouldShow = window.scrollY > SHOW_AFTER;
    if(shouldShow !== visible){
      visible = shouldShow;
      btn.classList.toggle('is-visible', shouldShow);
    }
  }
  window.addEventListener('scroll', syncVisibility, { passive:true });
  syncVisibility();
  btn.addEventListener('click', ()=>{
    // 'auto' 在全站 html{scroll-behavior:smooth} 之下仍會平滑捲動，要用 'instant' 才會真正瞬間跳轉
    window.scrollTo({ top:0, behavior: prefersReducedMotion() ? 'instant' : 'smooth' });
  });
})();

// ---------- build stage track ----------
// 02·A／02·B 改版後，stageTrack／stageCur／stageDesc／progressNum／progressBar
// 這些 DOM 節點已不存在於畫面上；以下函式維持運作（供 checkBtn／pushBtn／updateDashboardStats
// 內部的 progress 數值引擎與首頁 sceneCard 動畫使用），對已移除的節點一律加上 null 檢查，避免拋出例外。
const track = document.getElementById('stageTrack');
function renderStages(currentIdx){
  if(!track) return;
  track.innerHTML = '';
  stages.forEach((s,i)=>{
    const el = document.createElement('div');
    el.className = 'stage-item' + (i===currentIdx?' current':'') + (i<currentIdx?' done':'');
    el.innerHTML = `<div class="idx mono">${String(i+1).padStart(2,'0')}</div><div class="nm">${s}</div>`;
    track.appendChild(el);
  });
}
function stageIndexFromProgress(p){
  return Math.min(stages.length-1, Math.floor(p/10));
}
function updateStageBlock(){
  const idx = stageIndexFromProgress(progress);
  renderStages(idx);
  const curEl = document.getElementById('stageCur');
  const descEl = document.getElementById('stageDesc');
  if(curEl) curEl.textContent = `${toCircled(idx+1)} ${stages[idx]}`;
  if(descEl) descEl.textContent = stageDescs[idx];
}
function toCircled(n){
  const circled = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩"];
  return circled[n-1] || n;
}

function setProgress(p, animateDir){
  progress = Math.max(0, Math.min(99, Math.round(p)));
  const numEl = document.getElementById('progressNum');
  const barEl = document.getElementById('progressBar');
  if(numEl) numEl.textContent = progress + '%';
  if(barEl) barEl.style.width = progress + '%';
  updateStageBlock();
  if(animateDir === 'back'){
    sceneCard.classList.remove('advance'); void sceneCard.offsetWidth;
    sceneCard.classList.add('shake');
    setTimeout(()=>sceneCard.classList.remove('shake'), 700);
  } else if(animateDir === 'forward'){
    sceneCard.classList.remove('shake'); void sceneCard.offsetWidth;
    sceneCard.classList.add('advance');
    setTimeout(()=>sceneCard.classList.remove('advance'), 1000);
  }
}

function setWear(w){
  wear = Math.max(0, Math.min(99, Math.round(w)));
  saveWearState();
  renderWearUI();
  maybeShowResignEgg();
}

function setToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
}

function updateQuoteMeta(){
  const el = document.getElementById('quoteMeta');
  if(!el) return;
  el.textContent = touchesTodayReal === null ? '— 龜龜' : `— 龜龜，今日第 ${touchesTodayReal} 次摸門把後`;
}

function randomQuote(){
  const q = quotes[Math.floor(Math.random()*quotes.length)];
  document.getElementById('quoteText').innerHTML = q[1] ? `${q[0]}<br>${q[1]}` : q[0];
  updateQuoteMeta();
}

function nowStamp(){
  const d = new Date();
  return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
}

function pushWarnLog(msg){
  warnLogEntries.unshift({time: nowStamp(), msg});
  if(warnLogEntries.length > 8) warnLogEntries.pop();
  const logEl = document.getElementById('warnLog');
  logEl.innerHTML = warnLogEntries.map(e=>
    `<div class="warn-log-item"><span>${e.msg}</span><span class="tm mono">${e.time}</span></div>`
  ).join('');
}

function randomWarning(logIt){
  const w = warnings[Math.floor(Math.random()*warnings.length)];
  const el = document.getElementById('warnText');
  el.parentElement.style.opacity = 0;
  setTimeout(()=>{ el.textContent = w; el.parentElement.style.opacity = 1; syncObsReport(); }, 250);
  if(logIt) pushWarnLog(w);
}

// HOME「觀測所即時回報」：從既有元素（behaviorTag／今日研究門把統計／系統提示）鏡射最新內容，
// 不建立新的資料來源，單純把已存在的真實／模擬資料同步顯示到回報區塊。
function syncObsReport(){
  const btEl = document.getElementById('behaviorTag');
  const rb = document.getElementById('reportBehavior');
  if(btEl && rb) rb.textContent = btEl.textContent.replace(/^🐢\s*目前行為[:：]\s*/, '');

  const touchEl = document.getElementById('behTouch');
  const rt = document.getElementById('reportTouch');
  if(touchEl && rt) rt.textContent = touchEl.textContent;

  const warnEl = document.getElementById('warnText');
  const rn = document.getElementById('reportNotice');
  if(warnEl && rn) rn.textContent = warnEl.textContent;
}

// rotate warning banner ambiently：只在「系統警告」分頁顯示且頁面可見時運行，其餘時間暫停
function syncWarnTimer(){
  const shouldRun = !document.hidden && document.getElementById('tab-warn').classList.contains('active');
  if(shouldRun && warnTimer === null){
    warnTimer = setInterval(()=>randomWarning(true), 9000);
  } else if(!shouldRun && warnTimer !== null){
    clearInterval(warnTimer);
    warnTimer = null;
  }
}
document.addEventListener('visibilitychange', syncWarnTimer);
syncWarnTimer();
document.getElementById('warnRefreshBtn').addEventListener('click', ()=>randomWarning(true));

// ---------- interactions ----------
document.getElementById('checkBtn').addEventListener('click', ()=>{
  const roll = Math.random();
  let delta = 0;
  let dir = null;
  if(roll < 0.15){
    delta = -(Math.random()*1.5);
    dir = 'back';
  } else if(roll < 0.55){
    delta = 0;
  } else {
    delta = Math.random()*2.2;
    dir = 'forward';
  }
  setProgress(progress + delta, dir);


  handleCheckCount += 1;
  setWear(wear + (Math.random()<0.5?1:0));

  document.getElementById('behaviorTag').textContent = behaviorTags[Math.floor(Math.random()*behaviorTags.length)];
  randomQuote();
  randomWarning(false);
  syncObsReport();

  const msgs = [
    "已更新最新觀測結果。龜龜仍在研究中。",
    "本次觀測完成。偵測到極微量的『原地進展』。",
    "已記錄一次觀察行為。龜龜狀態：一如既往地謹慎。",
    "系統已同步。門依然沒鎖，龜龜依然知道。",
    "最新狀態已載入。龜龜距離門外仍有一隻龜的距離。",
    "本次觀測正常。龜龜仍具備完整的研究能力。",
    "系統顯示：方向存在、訊息不存在。",
    "已確認龜龜在線。私訊功能使用狀態未知。",
    "觀測完成。龜龜仍處於「不是不動，只是尚未動」"
  ];
  setToast(msgs[Math.floor(Math.random()*msgs.length)]);
});

document.getElementById('pushBtn').addEventListener('click', ()=>{
  setProgress(progress - 1, 'back');
  handlePushCount += 1;
  setWear(wear + 1);
  document.getElementById('behaviorTag').textContent = "🐢 目前行為：看了你一眼，然後縮回殼裡";
  setToast("「龜龜看了你一眼。」「然後縮回殼裡。」進度 -1%。");
  syncObsReport();
});

// ---------- 門把離職通知彩蛋：關閉互動（按鈕／ESC／點擊遮罩） ----------
(function initResignModal(){
  const overlay = document.getElementById('resignModalOverlay');
  const confirmBtn = document.getElementById('resignModalConfirmBtn');
  const closeX = document.getElementById('resignModalCloseX');
  if(confirmBtn) confirmBtn.addEventListener('click', closeResignModal);
  if(closeX) closeX.addEventListener('click', closeResignModal);
  if(overlay){
    overlay.addEventListener('click', (e)=>{
      if(e.target.id === 'resignModalOverlay') closeResignModal();
    });
  }
})();

// ---------- init ----------
updateStageBlock();
loadWearState();
renderWearUI();
maybeShowResignEgg();
pushWarnLog("龜龜正在思考。");
randomWarning(false);
syncObsReport();
