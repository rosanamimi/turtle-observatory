const fs=require('fs');
const src=fs.readFileSync(process.argv[2],'utf8');
function grab(name){const i=src.indexOf('function '+name+'(');let d=0,j=src.indexOf('{',i);let k=j;for(;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)break;}}return src.slice(i,k+1);}
const P='<img src=x onerror=alert(1)>';
const ESC='&lt;img src=x onerror=alert(1)&gt;';
const RT='let logFilter="",logHasMore=false;'+grab('escapeHtml')+grab('tlEntryHtml')+grab('filteredLogEntries')+grab('renderTimeline')+';renderTimeline();';
let out='';
const el={set innerHTML(v){out=v;}};
const document={getElementById:()=>el};
const fields=['text','time','progress','eventType','eventTime','eventContent'];
let fail=0;
for(const f of fields){
  const e={time:'t',text:'x',progress:'1%',hasEvent:true,eventType:'a',eventTime:'b',eventContent:'c'};e[f]=P;
  const logEntries=[e];
  new Function('document','logEntries',RT)(document,logEntries);
  const ok=out.includes(ESC)&&!out.includes('<img')&&out.includes('<div class="tl-entry">');
  console.log(f,ok?'PASS':'FAIL'); if(!ok){fail++;console.log(out);}
}
// non-string
new Function('document','logEntries',RT)(document,[{time:5,text:null,progress:'',hasEvent:false}]);
console.log('non-string PASS');
process.exit(fail?1:0);
