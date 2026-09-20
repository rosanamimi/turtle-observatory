const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(process.argv[2],'utf8');
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const FIXED=new Date(2026,8,2,12,0,0).getTime(); // 2026-09-02 12:00 本地
const mk=(y,m,d,h,t)=>({created_at:new Date(y,m-1,d,h,0,0).toISOString(),text:t,progress:null,has_event:false});
const rows=[mk(2026,9,2,10,'今天研究門把'),mk(2026,9,20,10,'9月20日研究門把'),mk(2026,9,29,10,'9月29日研究門把'),mk(2025,9,2,10,'去年9月2日研究門把'),mk(2026,9,1,23,'昨天深夜研究門把')];
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'file:///x/index.html',virtualConsole:vc,beforeParse(w){
 w.scrollTo=()=>{};
 const RD=w.Date;
 class FD extends RD{constructor(...a){a.length?super(...a):super(FIXED);} static now(){return FIXED;}}
 w.Date=FD;
 w.fetch=(url)=>Promise.resolve({ok:true,headers:{get:()=>null},json:async()=>url.includes('mix_observations')?[]:rows});
}});
const w=dom.window,doc=w.document,sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{await sleep(200);
 const v=doc.getElementById('behResearch').textContent;
 console.log((v==='1 次'?'PASS':'FAIL')+' fixed today=9/2: 9/20、9/29、去年9/2、昨天深夜 都不算今天 -> 今日研究='+v+' (期望 1 次)');
 console.log((errors.length===0?'PASS':'FAIL')+' no errors');w.close();process.exit(0);})();
