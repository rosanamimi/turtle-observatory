const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(process.argv[2],'utf8');
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push('jsdomError: '+e.message));vc.on('error',e=>errors.push('console.error: '+e));
let mode='ok';const posts=[];
const OBS=[{created_at:'2026-09-19T10:00:00Z',text:'<img src=x onerror=window.__pwn=1>',progress:5,has_event:true,event_time:null,event_type:'<b>x</b>',event_content:'c'}];
const MIX=[{observed_at:'2026-09-19T10:00:00Z',question:'q',mix_components:'a＋b',conclusion:'保留可能性',stage:'③ 接觸後'}];
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'file:///D:/x/index.html',virtualConsole:vc,beforeParse(w){
 w.scrollTo=()=>{};w.matchMedia=w.matchMedia||(()=>({matches:false,addListener(){},removeListener(){}}));
 w.fetch=(url,opt={})=>{const isPost=(opt.method||'GET')==='POST';
  if(isPost&&mode==='postfail'){return Promise.reject(Object.assign(new Error('aborted'),{name:'AbortError'}));}
  if(isPost){posts.push(url);return Promise.resolve({ok:true,json:async()=>({})});}
  if(mode==='getfail'&&window_loaded)return Promise.reject(new Error('timeout'));
  const body=url.includes('mix_observations')?MIX:OBS;
  return Promise.resolve({ok:true,headers:{get:()=>url.includes('mix_observations')?'0-0/1':null},json:async()=>body});};
}});
let window_loaded=false;
const w=dom.window,d=w.document;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 await sleep(300);window_loaded=true;
 const t=(n,c)=>console.log((c?'PASS ':'FAIL ')+n);
 t('no load errors',errors.length===0);if(errors.length)console.log(errors);
 t('timeline escaped, no injected img',!d.querySelector('#timeline img')&&!w.__pwn&&d.querySelector('#timeline').textContent.includes('<img'));
 t('timeline no on* attrs',![...d.querySelectorAll('#timeline *')].some(e=>[...e.attributes].some(a=>a.name.startsWith('on'))));
 // tabs keyboard
 const b0=d.getElementById('tabbtn-home');b0.focus();
 b0.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));await sleep(50);
 t('ArrowRight -> log tab active',d.getElementById('tabbtn-log').getAttribute('aria-selected')==='true'&&d.getElementById('tab-log').classList.contains('active')&&d.getElementById('tabbtn-log').tabIndex===0&&d.getElementById('tabbtn-home').tabIndex===-1);
 d.getElementById('tabbtn-log').dispatchEvent(new w.KeyboardEvent('keydown',{key:'End',bubbles:true}));await sleep(50);
 t('End -> warn tab active',d.getElementById('tab-warn').classList.contains('active'));
 // warn timer
 d.getElementById('tabbtn-warn').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Home',bubbles:true}));await sleep(50);
 t('Home -> home tab',d.getElementById('tab-home').classList.contains('active'));
 t('mix write UI removed',!d.getElementById('mixAddBtn')&&!d.getElementById('mixModalOverlay'));
 t('log form present',!!d.getElementById('addLogBtn')&&!!d.getElementById('eventFields'));
 // POST ok + reload fail
 mode='getfail';
 d.getElementById('logInput').value='新紀錄';d.getElementById('addLogBtn').click();await sleep(100);
 const st=d.getElementById('logStatus').textContent;
 t('POST ok + GET fail => not "同步" success msg: '+st,posts.length===1&&!st.includes('已新增並同步')&&st.includes('重新讀取失敗'));
 mode='postfail';
 d.getElementById('logInput').value='逾時';d.getElementById('addLogBtn').click();await sleep(100);
 t('POST timeout => ambiguous msg, input kept',d.getElementById('logStatus').textContent.includes('無法確認是否已寫入')&&d.getElementById('logInput').value==='逾時');
 mode='ok';
 d.getElementById('logInput').value='新紀錄2';d.getElementById('addLogBtn').click();await sleep(100);
 t('POST ok + GET ok => success msg',d.getElementById('logStatus').textContent.includes('已新增並同步'));
 w.close();process.exit(0);
})();
