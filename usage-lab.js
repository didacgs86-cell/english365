/* English365 3.0 · Elegir, justificar, corregir y volver a practicar. */
(()=>{'use strict';
const lessons=window.ENGLISH_USAGE||[],items=lessons.flatMap(l=>l.items.map(q=>({...q,lesson:l}))),byId=new Map(items.map(q=>[q.id,q]));
const intervals=[0,1,3,7,14];
const E=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
const B=(text,fn,secondary=false)=>{const b=E('button','btn'+(secondary?' secondary':''),text);b.type='button';b.onclick=fn;return b};
const number=(x,min,max)=>Number.isFinite(x)&&x>=min&&x<=max;
function sanitize(raw){
 const out={version:1,stats:{},days:{},session:null};if(!raw||typeof raw!=='object'||Array.isArray(raw))return out;
 if(raw.stats&&typeof raw.stats==='object')for(const [id,r]of Object.entries(raw.stats)){if(!byId.has(id)||!r||typeof r!=='object')continue;out.stats[id]={attempts:Number.isInteger(r.attempts)&&number(r.attempts,0,1e7)?r.attempts:0,correct:Number.isInteger(r.correct)&&number(r.correct,0,1e7)?r.correct:0,errors:Number.isInteger(r.errors)&&number(r.errors,0,1e7)?r.errors:0,stage:Number.isInteger(r.stage)&&number(r.stage,0,4)?r.stage:0,due:number(r.due,0,1e15)?r.due:0,lastAt:number(r.lastAt,0,1e15)?r.lastAt:0,lastCorrectAt:number(r.lastCorrectAt,0,1e15)?r.lastCorrectAt:0}}
 if(raw.days&&typeof raw.days==='object')for(const [key,n]of Object.entries(raw.days))if(/^\d{4}-\d{2}-\d{2}$/.test(key)&&Number.isInteger(n)&&number(n,0,1e6))out.days[key]=n;
 const s=raw.session;
 if(s&&s.version===1&&['question','summary'].includes(s.phase)&&Array.isArray(s.ids)&&s.ids.length>0&&s.ids.length<=8&&new Set(s.ids).size===s.ids.length&&s.ids.every(id=>byId.has(id))&&Array.isArray(s.queue)&&s.queue.length<=16&&s.queue.every(q=>q&&s.ids.includes(q.id)&&typeof q.retry==='boolean')&&Number.isInteger(s.answered)&&number(s.answered,0,16)&&Number.isInteger(s.correct)&&number(s.correct,0,16)&&number(s.started,0,1e15)&&[null,0,1].includes(s.word)&&typeof s.helped==='boolean'&&(s.result===null||s.result&&[s.result.wordOk,s.result.reasonOk,s.result.mastered].every(x=>typeof x==='boolean'))&&s.firstResults&&typeof s.firstResults==='object'&&Array.isArray(s.wrongIds)&&s.wrongIds.every(id=>s.ids.includes(id))&&(s.phase==='summary'||s.queue.length>0)){
  out.session=JSON.parse(JSON.stringify(s));out.session.firstResults=Object.fromEntries(Object.entries(s.firstResults).filter(([id,v])=>s.ids.includes(id)&&typeof v==='boolean'));
 }
 return out;
}
function dayKey(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function summary(raw){const p=sanitize(raw),values=Object.values(p.stats);return {practised:values.filter(x=>x.attempts>0).length,settled:values.filter(x=>x.stage>=3).length,due:values.filter(x=>x.attempts&&x.due<=Date.now()).length,errors:values.filter(x=>x.attempts&&x.stage===0).length,today:p.days[dayKey()]||0,total:items.length,resumable:!!p.session&&p.session.phase!=='summary'}}
function order(values,key){return values.map((v,i)=>({v,n:(()=>{let n=[...key+':'+i].reduce((a,c)=>Math.imul(a^c.charCodeAt(0),16777619)>>>0,2166136261);n^=n>>>16;n=Math.imul(n,0x7feb352d);n^=n>>>15;return n>>>0})()})).sort((a,b)=>a.n-b.n).map(x=>x.v)}
function mount({root,progress,save,onExit}){
 progress.usageLab=sanitize(progress.usageLab);let p=progress.usageLab,s=p.session,filter='all',search='';
 function commit(){p.session=s;progress.usageLab=p;return save()}
 function top(name,desc){root.append(E('h1','',name),E('p','lead',desc))}
 function clear(){root.replaceChildren();window.scrollTo?.({top:0,behavior:'instant'})}
 function menu(){
  clear();top('Laboratorio de uso','Elige la palabra. Explica por qué. Comprueba si sabes usarla.');
  const stats=summary(p),hero=E('section','lab-hero');hero.append(E('div','eyebrow','MÁS ALLÁ DE LA TRADUCCIÓN'),E('h2','','Entender la diferencia lo cambia todo.'),E('p','','Palabras que se confunden y combinaciones que suenan naturales. Ocho situaciones por sesión, con una segunda oportunidad para los errores.'));
  const actions=E('div','row');if(s&&s.phase==='question')actions.append(B('Continuar mi sesión',render));actions.append(B('Empezar práctica mixta',()=>launch('mixed'),!!s),B('Solo mis errores',()=>launch('errors'),true));hero.append(actions);root.append(hero);
  const metrics=E('div','metrics');[['Practicadas',stats.practised+'/'+stats.total],['Para volver a ver',stats.due],['Por afianzar',stats.errors],['Consolidadas',stats.settled]].forEach(([label,n])=>{const m=E('div','metric');m.append(E('strong','',String(n)),E('span','',label));metrics.append(m)});root.append(metrics);
  const controls=E('div','library-controls'),tabs=E('div','segmented');[['all','Todo'],['contrast','No las confundas'],['collocation','Combinaciones']].forEach(([key,label])=>{const b=B(label,()=>{filter=key;draw()},true);b.dataset.filter=key;tabs.append(b)});const input=E('input','field search');input.type='search';input.placeholder='Buscar una diferencia o combinación…';input.setAttribute('aria-label','Buscar lecciones de uso');input.value=search;input.oninput=()=>{search=input.value;draw()};controls.append(tabs,input);root.append(controls);const grid=E('div','lesson-grid');root.append(grid);
  function draw(){grid.replaceChildren();tabs.querySelectorAll('button').forEach(b=>{b.classList.toggle('selected',b.dataset.filter===filter);b.setAttribute('aria-pressed',String(b.dataset.filter===filter))});const found=lessons.filter(l=>(filter==='all'||l.kind===filter)&&(l.title+' '+l.rule).toLowerCase().includes(search.trim().toLowerCase()));
   if(!found.length)grid.append(E('p','empty','No hay coincidencias. Prueba con otra palabra.'));
   found.forEach(l=>{const card=E('article','lesson-tile'),count=l.items.filter(q=>p.stats[q.id]?.stage>=3).length;card.append(E('span','tag',l.kind==='contrast'?'NO LAS CONFUNDAS':'COMBINACIÓN NATURAL'),E('h3','',l.title),E('p','muted',count+' de 2 situaciones consolidadas'));const details=E('details','rule-preview');details.append(E('summary','','Ver la diferencia'),E('p','',l.rule));if(l.note)details.append(E('p','muted',l.note));card.append(details,B('Practicar esta lección',()=>launch('lesson',l.id),true));grid.append(card)})
  }draw();root.append(B('Volver al inicio',onExit,true));
 }
 function launch(mode,lessonId){
  const pool=items.filter(q=>mode==='lesson'?q.lesson.id===lessonId:mode==='errors'?p.stats[q.id]?.attempts>0&&p.stats[q.id]?.stage===0:true);
  if(!pool.length){const msg=E('p','empty','Todavía no tienes errores pendientes en el laboratorio. Empieza con una práctica mixta.');msg.setAttribute('role','status');root.querySelector('.lab-hero').append(msg);return}
  if(s&&s.phase==='question'&&!confirm('Hay una sesión guardada. ¿Sustituirla por esta nueva práctica?'))return;
  const rank=q=>{const r=p.stats[q.id];return r?.attempts&&r.stage===0?0:r?.attempts&&r.due<=Date.now()?1:!r?.attempts?2:3};
  const shuffled=[...pool];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]}
  const poolMixed=shuffled.sort((a,b)=>rank(a)-rank(b)||(p.stats[a.id]?.lastAt||0)-(p.stats[b.id]?.lastAt||0));
  const selected=poolMixed.slice(0,8);s={version:1,phase:'question',ids:selected.map(q=>q.id),queue:selected.map(q=>({id:q.id,retry:false})),answered:0,correct:0,started:Date.now(),word:null,helped:false,result:null,firstResults:{},wrongIds:[]};commit();render();
 }
 function render(){
  clear();if(s.phase==='summary'){finishView();return}
  const entry=s.queue[0],q=byId.get(entry.id),l=q.lesson;
  const upper=E('div','session-nav');upper.append(B('← Guardar y salir',menu,true),E('span','muted',entry.retry?'SEGUNDA OPORTUNIDAD':`SITUACIÓN ${Math.min(s.ids.length,Object.keys(s.firstResults).length+(s.result?0:1))} DE ${s.ids.length}`));root.append(upper);
  const bar=E('div','bar'),fill=E('div');fill.style.width=100*Object.keys(s.firstResults).length/s.ids.length+'%';bar.append(fill);root.append(bar);
  const card=E('section','practice-surface');card.append(E('span','tag',l.kind==='contrast'?'NO LAS CONFUNDAS':'COMBINACIÓN NATURAL'),E('h1','practice-title',s.word===null?'¿Qué encaja aquí?':s.result?'Tu respuesta, con contexto.':'¿Por qué la has elegido?'));
  if(q.context)card.append(E('p','context-intent',q.context));
  const sentence=E('p','context-sentence');sentence.lang='en';const parts=q.q.split('___');sentence.append(document.createTextNode(parts[0]),E('mark','',s.word===null?'…':l.options[s.word]),document.createTextNode(parts[1]||''));card.append(sentence);
  if(s.word===null){card.append(E('p','muted','Elige la opción más natural para este sentido y esta estructura.'));const choices=E('div','lab-options');order([0,1],q.id+s.started+'word').forEach(i=>{const b=B(l.options[i],()=>{s.word=i;commit();render()},true);b.lang='en';choices.append(b)});card.append(choices)}
  else if(!s.result){card.append(E('p','muted','Ahora elige la razón. La corrección aparece después de este paso.'));const choices=E('div','choices reason-options');order([0,1,2],q.id+s.started+'reason').forEach(i=>{const b=B(l.reasons[i],()=>submit(i),true);choices.append(b)});card.append(choices,B('Cambiar mi palabra',()=>{s.word=null;commit();render()},true))}
  else{
   const feedback=E('div','lab-feedback '+(s.result.mastered?'success':'retry'));feedback.setAttribute('role','status');feedback.append(E('strong','',s.result.mastered?'Bien elegida y bien razonada.':s.result.wordOk&&s.result.reasonOk?'Correcta con ayuda. Vamos a afianzarla.':s.result.wordOk?'La palabra era correcta; revisa el motivo.':'Una diferencia que merece otro intento.'),E('p','correct-sentence',q.q.replace('___',l.options[q.answer])),E('p','',q.translation),E('p','rule',l.rule));if(l.note)feedback.append(E('p','muted',l.note));card.append(feedback,B(s.queue.length===1?'Ver mi resultado':'Siguiente situación →',advance));
  }
  if(!s.result){const hint=B(s.helped?'Regla consultada':'Necesito una pista',()=>{s.helped=true;commit();render()},true);hint.disabled=s.helped;card.append(hint);if(s.helped)card.append(E('p','hint',l.rule))}
  root.append(card);
 }
 function submit(reason){
  if(s.result)return;const entry=s.queue[0],q=byId.get(entry.id),now=Date.now(),wordOk=s.word===q.answer,reasonOk=reason===q.answer,mastered=wordOk&&reasonOk&&!s.helped;
  s.result={wordOk,reasonOk,mastered};s.answered++;if(mastered)s.correct++;
  if(!entry.retry)s.firstResults[q.id]=mastered;
  if(!mastered){if(!s.wrongIds.includes(q.id))s.wrongIds.push(q.id);if(!entry.retry)s.queue.splice(Math.min(3,s.queue.length),0,{id:q.id,retry:true})}
  const old=p.stats[q.id]||{attempts:0,correct:0,errors:0,stage:0,due:0,lastAt:0,lastCorrectAt:0};let stage=old.stage;
  if(!mastered)stage=0;else if(!old.lastCorrectAt||old.due<=now)stage=Math.min(4,stage+1);
  const due=!mastered?now+10*60000:stage!==old.stage?now+intervals[stage]*86400000:old.due||now+86400000;
  p.stats[q.id]={attempts:old.attempts+1,correct:old.correct+(mastered?1:0),errors:old.errors+(mastered?0:1),stage,due,lastAt:now,lastCorrectAt:mastered?now:old.lastCorrectAt};p.days[dayKey()]=(p.days[dayKey()]||0)+1;commit();render();
 }
 function advance(){if(!s.result)return;s.queue.shift();s.word=null;s.helped=false;s.result=null;if(!s.queue.length)s.phase='summary';commit();render()}
 function finishView(){
  const first=Object.values(s.firstResults).filter(Boolean).length;top('Una sesión con más sentido.',`${first} de ${s.ids.length} situaciones resueltas y razonadas sin ayuda en el primer intento.`);
  const box=E('section','practice-surface');box.append(E('div','result-number',first+'/'+s.ids.length),E('h2','',s.wrongIds.length?'Ya sabes qué afianzar.':'Buen trabajo. Ahora deja que pase un poco de tiempo.'),E('p','',s.wrongIds.length?'Las dificultades han vuelto a aparecer en la sesión y quedan en tu cuaderno de errores.':'Las situaciones volverán según tu historial: 1, 3, 7 y 14 días. Repetir hoy no aumenta su nivel de consolidación.'));
  const list=E('ul','result-list');s.ids.forEach(id=>{const q=byId.get(id),li=E('li');li.append(E('span','',q.lesson.title),E('strong',s.firstResults[id]?'text-success':'text-warning',s.firstResults[id]?'Sin ayuda':'Por afianzar'));list.append(li)});box.append(list,B('Volver al laboratorio',menu),B('Ir al inicio',onExit,true));root.append(box)
 }
 menu();return {menu,launch,resume:()=>{if(s)render()}};
}
window.UsageLab={mount,sanitize,summary,lessons,items};
})();
