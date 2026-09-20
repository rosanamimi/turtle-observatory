const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(process.argv[2],'utf8');
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const pend={obs:[],mix:[]};let mixGets=0;
const row=t=>({created_at:'2026-09-19T10:00:00Z',text:t,progress:null,has_event:false});
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'file:///x/index.html',virtualConsole:vc,beforeParse(w){
 w.scrollTo=()=>{};
 w.fetch=(url,opt={})=>{
  if((opt.method||'GET')==='POST')return Promise.resolve({ok:true});
  if(url.includes('or=')) return Promise.resolve({ok:true,headers:{get:()=>null},json:async()=>[]}); // 統計查詢：與時間軸請求分開處理
  const k=url.includes('mix_observations')?'mix':'obs';
  return new Promise((res,rej)=>{pend[k].push({res,rej,url});if(k==='mix')mixGets++;});
 };
}});
const w=dom.window,d=w.document,sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ok=(rows)=>({ok:true,headers:{get:()=>'0-0/1'},json:async()=>rows});
const t=(n,c)=>console.log((c?'PASS ':'FAIL ')+n);
(async()=>{
 await sleep(100);
 // pend.obs[0]=startup GET (slow). Add entry -> POST ok -> GET#2
 d.getElementById('logInput').value='x';d.getElementById('addLogBtn').click();await sleep(50);
 t('second obs GET issued',pend.obs.length===2);
 pend.obs[1].res(ok([row('NEW')]));await sleep(50);
 t('new data shown',d.getElementById('timeline').textContent.includes('NEW'));
 pend.obs[0].rej(new Error('timeout'));await sleep(50);   // stale failure
 t('stale failure ignored (timeline kept, status not failure)',d.getElementById('timeline').textContent.includes('NEW')&&!d.getElementById('logStatus').textContent.includes('失敗'));
 // stale success must not overwrite
 d.getElementById('logInput').value='y';d.getElementById('addLogBtn').click();await sleep(50);
 pend.obs[2].res(ok([row('NEWER')]));await sleep(50);
 t('newer shown',d.getElementById('timeline').textContent.includes('NEWER'));
 // MIX: startup GET pending (pend.mix[0]); submit MIX while loading
 t('mix startup GET pending',pend.mix.length===1);
 d.getElementById('progressRefreshBtn').click();await sleep(50);
 t('no extra mix GET yet (queued)',pend.mix.length===1);
 pend.mix[0].res(ok([{observed_at:'2026-09-19T10:00:00Z',question:'OLD',mix_components:'',conclusion:'',stage:''}]));await sleep(50);
 t('queued page-1 refresh issued after first completes',pend.mix.length===2);
 pend.mix[1].res(ok([{observed_at:'2026-09-19T11:00:00Z',question:'FRESH',mix_components:'',conclusion:'',stage:''}]));await sleep(50);
 t('fresh MIX shown',d.getElementById('mixRecords').textContent.includes('FRESH'));
 t('no errors',errors.length===0);if(errors.length)console.log(errors);
 w.close();process.exit(0);
})();
