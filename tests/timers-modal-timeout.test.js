const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(process.argv[2],'utf8');
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
let intervals=0,cleared=0,active=new Set();let hidden=false;
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'file:///x/index.html',virtualConsole:vc,beforeParse(w){
 w.scrollTo=()=>{};
 const si=w.setInterval.bind(w),ci=w.clearInterval.bind(w);
 w.setInterval=(f,ms)=>{const id=si(f,ms);if(ms===9000){intervals++;active.add(id);}return id;};
 w.clearInterval=(id)=>{if(active.delete(id))cleared++;return ci(id);};
 Object.defineProperty(w.document,'hidden',{get:()=>hidden});
 // fetch that honors abort and never resolves (for timeout test)
 w.fetch=(url,opt={})=>new Promise((res,rej)=>{if(opt.signal)opt.signal.addEventListener('abort',()=>rej(Object.assign(new Error('aborted'),{name:'AbortError'})));});
}});
const w=dom.window,d=w.document,sleep=ms=>new Promise(r=>setTimeout(r,ms));
const t=(n,c)=>console.log((c?'PASS ':'FAIL ')+n);
const tab=n=>{d.getElementById('tabbtn-'+n).click();};
(async()=>{
 await sleep(100);
 t('timer NOT running on home at load',active.size===0);
 tab('warn');await sleep(20);t('timer starts on warn tab',active.size===1);
 hidden=true;d.dispatchEvent(new w.Event('visibilitychange'));t('timer stops when page hidden',active.size===0);
 hidden=false;d.dispatchEvent(new w.Event('visibilitychange'));t('timer resumes when visible again',active.size===1);
 tab('home');await sleep(20);t('timer stops when leaving warn tab',active.size===0);
 tab('warn');tab('log');await sleep(20);t('no leaked timers after switching',active.size===0);
 // resign modal: focus trap + Esc + focus return
 const opener=d.getElementById('checkBtn');opener.focus();
 w.openResignModal();
 const ov=d.getElementById('resignModalOverlay');
 t('resign modal open, focus inside',ov.classList.contains('open')&&ov.contains(d.activeElement));
 const btns=[...ov.querySelectorAll('button')];
 // force layout visibility for offsetParent in jsdom
 btns.forEach(b=>Object.defineProperty(b,'offsetParent',{get:()=>ov}));
 const last=btns[btns.length-1],first=btns[0];
 last.focus();d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));
 t('Tab from last wraps to first',d.activeElement===first);
 first.focus();d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}));
 t('Shift+Tab from first wraps to last',d.activeElement===last);
 d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
 t('Esc closes resign modal and returns focus',!ov.classList.contains('open')&&d.activeElement===opener);
 // real 10s timeout on startup GET (fetch never resolves)
 const st=d.getElementById('logStatus');
 console.log('waiting for 10s timeout...');
 await sleep(10500);
 t('startup GET aborted by timeout -> failure message: '+st.textContent,st.textContent.includes('失敗'));
 t('no runtime errors',errors.length===0);if(errors.length)console.log(errors);
 w.close();process.exit(0);
})();
