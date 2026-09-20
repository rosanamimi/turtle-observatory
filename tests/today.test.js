const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(process.argv[2],'utf8');
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const now=new Date();
const iso=d=>d.toISOString();
const yest=new Date(now);yest.setDate(yest.getDate()-1);
const lastYear=new Date(now);lastYear.setFullYear(lastYear.getFullYear()-1);
// 同月、日期以今天日數為前綴的其他日子(例:今天 2 號 → 20~29 號;今天 1 號 → 10~19)
const d=now.getDate();const prefixDay=new Date(now);prefixDay.setDate(Number(String(d)+'0')<=28?Number(String(d)+'0'):d);
const mk=(dt,t)=>({created_at:iso(dt),text:t,progress:null,has_event:false});
const rows=[mk(now,'今天研究門把'),mk(yest,'昨天研究門把'),mk(lastYear,'去年同日研究門把'),mk(prefixDay,'同前綴日期研究門把')];
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'file:///x/index.html',virtualConsole:vc,beforeParse(w){
 w.scrollTo=()=>{};
 w.fetch=(url)=>Promise.resolve({ok:true,headers:{get:()=>null},json:async()=>url.includes('mix_observations')?[]:rows});
}});
const w=dom.window,doc=w.document,sleep=ms=>new Promise(r=>setTimeout(r,ms));
const t=(n,c)=>console.log((c?'PASS ':'FAIL ')+n);
(async()=>{
 await sleep(200);
 const el=id=>doc.getElementById(id).textContent;
 console.log('今日研究門把(behTouch)=',el('behTouch'),' 研究(behResearch)=',el('behResearch'),' prefixDay=',prefixDay.toDateString(),'isToday?',prefixDay.toDateString()===now.toDateString());
 const expected=(prefixDay.toDateString()===now.toDateString())?'2 次':'1 次';
 t('only today counted (yesterday / last year / same-prefix day excluded)',el('behTouch')===expected&&el('behResearch')===expected);
 const before=el('behTouch');
 for(let i=0;i<5;i++)doc.getElementById('checkBtn').click();
 await sleep(50);
 t('checkBtn no longer overwrites real behTouch ('+before+' -> '+el('behTouch')+')',el('behTouch')===before);
 t('no errors',errors.length===0);if(errors.length)console.log(errors);
 w.close();process.exit(0);
})();
