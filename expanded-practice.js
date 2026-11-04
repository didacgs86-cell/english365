/* English365 3.1 · Irregulares y respuestas breves: práctica escrita, sin audio. */
(()=>{'use strict';
const verbs=window.ENGLISH_EXPANDED.irregulars,talk=window.ENGLISH_EXPANDED.vocab.filter(c=>c.wordType==='Coletillas y conversación');
const verbMap=new Map(verbs.map(v=>[v.id,v])),talkMap=new Map(talk.map(c=>[c.id,c])),allIds=new Set([...verbMap.keys(),...talkMap.keys()]);
const E=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
const B=(text,fn,secondary=false)=>{const b=E('button','btn'+(secondary?' secondary':''),text);b.type='button';b.onclick=fn;return b};
const norm=s=>String(s).toLowerCase().trim().replace(/[.!?]+$/,'').replace(/\s+/g,' ');
function accepts(value,forms){const bits=norm(value).split(/\s*(?:\/|,|\bor\b)\s*/);return bits.length>0&&bits.every(x=>x&&forms.map(norm).includes(x))}
function pattern(v){const p=v.past[0],a=v.participle[0];return v.base===p&&p===a?'AAA':p===a?'ABB':v.base===a?'ABA':'ABC'}
function mix(xs){const out=[...xs];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
function sanitize(raw){
 const out={version:1,stats:{},sessions:{}};if(!raw||typeof raw!=='object'||Array.isArray(raw))return out;
 for(const [id,r]of Object.entries(raw.stats||{}))if(allIds.has(id)&&r&&typeof r==='object')out.stats[id]={correct:Number.isInteger(r.correct)&&r.correct>=0&&r.correct<=1e7?r.correct:0,wrong:Number.isInteger(r.wrong)&&r.wrong>=0&&r.wrong<=1e7?r.wrong:0,lastAt:Number.isFinite(r.lastAt)&&r.lastAt>=0?r.lastAt:0};
 for(const kind of ['irregular','conversation']){const s=raw.sessions?.[kind],map=kind==='irregular'?verbMap:talkMap;if(!s||s.version!==1||!['question','summary'].includes(s.phase)||!Array.isArray(s.ids)||!s.ids.length||s.ids.length>10||new Set(s.ids).size!==s.ids.length||!s.ids.every(id=>map.has(id))||!Array.isArray(s.queue)||s.queue.length>20||!s.queue.every(q=>q&&s.ids.includes(q.id)&&typeof q.retry==='boolean')||!Number.isInteger(s.answered)||s.answered<0||s.answered>20||!Array.isArray(s.missed)||!s.missed.every(id=>s.ids.includes(id))||!s.first||typeof s.first!=='object'||(s.phase==='question'&&!s.queue.length)||![null,true,false].includes(s.checked))continue;
  if(kind==='irregular'&&!['past','participle','both'].includes(s.mode))continue;
  const copy={version:1,phase:s.phase,ids:[...s.ids],queue:s.queue.map(q=>({id:q.id,retry:q.retry})),answered:s.answered,missed:[...new Set(s.missed)],first:Object.fromEntries(Object.entries(s.first).filter(([id,v])=>s.ids.includes(id)&&typeof v==='boolean')),checked:s.checked,helped:s.helped===true,mode:kind==='irregular'?s.mode:'responses',draft:{past:typeof s.draft?.past==='string'?s.draft.past.slice(0,100):'',participle:typeof s.draft?.participle==='string'?s.draft.participle.slice(0,100):''},choice:typeof s.choice==='string'?s.choice.slice(0,100):'',options:Array.isArray(s.options)&&s.options.length<=4&&s.options.every(id=>talkMap.has(id))?[...s.options]:[]};
  if(kind==='conversation'&&copy.phase==='question'&&(!copy.options.includes(copy.queue[0].id)||copy.options.length!==4))continue;
  out.sessions[kind]=copy;
 }return out;
}
function sessionEngine({root,progress,save,onExit,kind,menu}){
 progress.expandedPractice=sanitize(progress.expandedPractice);let p=progress.expandedPractice,s=p.sessions[kind];
 const map=kind==='irregular'?verbMap:talkMap;
 function commit(){p.sessions[kind]=s;progress.expandedPractice=p;return save()}
 function clear(){root.replaceChildren();window.scrollTo?.({top:0,behavior:'instant'})}
 function chooseOptions(){if(kind!=='conversation'||s.phase!=='question')return;const c=map.get(s.queue[0].id);const alternatives=mix(talk.filter(x=>x.function!==c.function));const distinct=[],seen=new Set();for(const x of alternatives)if(!seen.has(x.function)){seen.add(x.function);distinct.push(x.id);if(distinct.length===3)break}s.options=mix([c.id,...distinct])}
 function start(pool,mode='both'){
  if(!pool.length)return false;if(s&&s.phase==='question'&&!confirm('Ya hay una sesión guardada en este apartado. ¿Sustituirla?'))return false;
  const rank=id=>{const r=p.stats[id];return r?.wrong>r?.correct?0:!r?1:2};
  const selected=mix(pool).sort((a,b)=>rank(a.id)-rank(b.id)||(p.stats[a.id]?.lastAt||0)-(p.stats[b.id]?.lastAt||0)).slice(0,10);
  s={version:1,phase:'question',ids:selected.map(x=>x.id),queue:selected.map(x=>({id:x.id,retry:false})),answered:0,missed:[],first:{},checked:null,helped:false,mode:kind==='irregular'?mode:'responses',draft:{past:'',participle:''},choice:'',options:[]};chooseOptions();commit();render();return true;
 }
 function render(){
  clear();if(s.phase==='summary'){summaryView();return}
  const entry=s.queue[0],item=map.get(entry.id),nav=E('div','session-nav');nav.append(B('← Guardar y salir',menu,true),E('span','muted',entry.retry?'SEGUNDA OPORTUNIDAD':`EJERCICIO ${Math.min(s.ids.length,Object.keys(s.first).length+(s.checked===null?1:0))} DE ${s.ids.length}`));root.append(nav);
  const box=E('section','practice-surface');
  if(kind==='irregular'){
   box.append(E('span','tag','VERBOS IRREGULARES'),E('h1','',item.base),E('p','lead',item.es));
   const form=E('form','irregular-form'),inputs={};
   for(const key of ['past','participle'])if(s.mode==='both'||s.mode===key){const label=E('label','',key==='past'?'Past simple · pasado':'Past participle · participio'),input=E('input','field');input.name=key;input.autocomplete='off';input.spellcheck=false;input.setAttribute('autocorrect','off');input.setAttribute('aria-label',label.textContent);input.value=s.draft[key]||'';input.disabled=s.checked!==null;input.maxLength=100;input.oninput=()=>{s.draft[key]=input.value;commit()};label.append(input);form.append(label);inputs[key]=input}
   if(s.checked===null){const b=E('button','btn','Comprobar formas');b.type='submit';form.append(b);form.onsubmit=e=>{e.preventDefault();if(Object.values(inputs).some(x=>!x.value.trim()))return;const ok=Object.entries(inputs).every(([key,input])=>accepts(input.value,key==='past'?item.past:item.participle));answer(ok)};form.append(B('Mostrar formas',()=>{s.helped=true;answer(false)},true))}
   box.append(form);
   if(s.checked!==null){const feedback=E('div','answer'+(s.checked?'':' bad'));feedback.setAttribute('role','status');feedback.append(E('strong','',s.checked?'Formas correctas.':'Repasa las formas y vuelve a intentarlo.'),E('p','verb-chain',item.base+' → '+item.past.join(' / ')+' → '+item.participle.join(' / ')));if(item.note)feedback.append(E('p','',item.note));box.append(feedback)}
  }else{
   box.append(E('span','tag','COLETILLAS EN CONTEXTO'),E('h1','practice-title','¿Qué podrías decir?'),E('p','context-intent','Tu intención: '+item.function.toLowerCase()+'.'),E('p','context-sentence',item.prompt||item.example.split(' B:')[0]));
   box.append(E('p','muted','Elige una respuesta adecuada para esa intención. Puede haber otras formas válidas de expresarla.'));
   const choices=E('div','choices');for(const id of s.options){const c=talkMap.get(id),b=B(c.en,()=>{s.choice=c.en;answer(c.function===item.function)},true);b.disabled=s.checked!==null;if(s.checked!==null){if(id===item.id)b.classList.add('correct');if(s.choice===c.en&&id!==item.id)b.classList.add('wrong')}choices.append(b)}box.append(choices);
   if(s.checked!==null){const feedback=E('div','answer'+(s.checked?'':' bad'));feedback.setAttribute('role','status');feedback.append(E('strong','',s.checked?'Una respuesta adecuada.':'La intención que practicamos era: '+item.function),E('p','',item.en+' — '+item.es),E('p','',item.exampleNote),E('p','',item.example),E('p','',item.exampleEs));box.append(feedback)}
  }
  if(s.checked!==null)box.append(B(s.queue.length===1?'Ver mi resultado':'Siguiente →',advance));root.append(box);
 }
 function answer(ok){
  if(s.checked!==null)return;const q=s.queue[0];s.checked=ok;s.answered++;if(!q.retry)s.first[q.id]=ok&&!s.helped;if(!ok||s.helped){if(!s.missed.includes(q.id))s.missed.push(q.id);if(!q.retry)s.queue.splice(Math.min(3,s.queue.length),0,{id:q.id,retry:true})}
  const old=p.stats[q.id]||{correct:0,wrong:0,lastAt:0};p.stats[q.id]={correct:old.correct+(ok&&!s.helped?1:0),wrong:old.wrong+(!ok||s.helped?1:0),lastAt:Date.now()};commit();render();
 }
 function advance(){if(s.checked===null)return;s.queue.shift();s.checked=null;s.helped=false;s.draft={past:'',participle:''};s.choice='';if(!s.queue.length)s.phase='summary';chooseOptions();commit();render()}
 function summaryView(){const first=Object.values(s.first).filter(Boolean).length;root.append(E('h1','','Sesión terminada'),E('p','lead',`${first} de ${s.ids.length} ejercicios correctos sin ayuda al primer intento.`));const box=E('section','practice-surface');box.append(E('div','result-number',first+'/'+s.ids.length));for(const id of s.ids){const item=map.get(id),row=E('div','word-row');row.append(E('strong','',item.base||item.en),E('span','',s.first[id]?'Sin ayuda':'Seguir practicando'));box.append(row)}const retry=B('Repetir lo que me ha costado',()=>start(s.missed.map(id=>map.get(id)),s.mode),true);retry.disabled=!s.missed.length;box.append(retry,B('Volver al apartado',menu),B('Volver a vocabulario',onExit,true));root.append(box)}
 return {start,resume:()=>{if(s)render()},hasSession:()=>!!s&&s.phase==='question',stats:()=>p.stats};
}
function irregulars({root,progress,save,onExit}){
 let search='',filter='all',mode='both',show=true;const engine=sessionEngine({root,progress,save,onExit,kind:'irregular',menu});
 function menu(){root.replaceChildren();root.append(E('h1','','Verbos irregulares'),E('p','lead','144 verbos en orden alfabético. Aprende infinitivo, pasado y participio, y escríbelos de memoria.'));
 const actions=E('div','row'),start=B('Practicar 10 verbos',()=>engine.start(filtered(),mode));actions.append(start);if(engine.hasSession())actions.append(B('Continuar sesión guardada',engine.resume,true));root.append(actions);
 const options=E('div','practice-settings');const modeLabel=E('label','','Quiero practicar'),modeSelect=E('select','field');[['both','Pasado y participio'],['past','Solo pasado'],['participle','Solo participio']].forEach(([v,t])=>{const o=E('option','',t);o.value=v;modeSelect.append(o)});modeSelect.value=mode;modeSelect.onchange=()=>mode=modeSelect.value;modeLabel.append(modeSelect);
 const filterLabel=E('label','','Patrón de formas'),select=E('select','field');[['all','Todos los patrones'],['AAA','AAA · las tres iguales'],['ABB','ABB · pasado = participio'],['ABA','ABA · infinitivo = participio'],['ABC','ABC · otras combinaciones']].forEach(([v,t])=>{const o=E('option','',t);o.value=v;select.append(o)});select.value=filter;select.onchange=()=>{filter=select.value;draw()};filterLabel.append(select);options.append(modeLabel,filterLabel);root.append(options);
 const input=E('input','field search');input.type='search';input.placeholder='Buscar infinitivo o significado…';input.setAttribute('aria-label','Buscar verbos irregulares');input.value=search;input.oninput=()=>{search=input.value;draw()};root.append(input);const toggle=B(show?'Ocultar soluciones de la tabla':'Mostrar soluciones de la tabla',()=>{show=!show;toggle.textContent=show?'Ocultar soluciones de la tabla':'Mostrar soluciones de la tabla';draw()},true);root.append(toggle,E('p','muted','Las variantes se muestran separadas por /. En los ejercicios basta con una forma válida; las notas aclaran usos especiales. Los patrones se calculan con la primera variante.'));
 const wrapper=E('div','verb-table-scroll');root.append(wrapper);const status=E('p','muted');status.setAttribute('role','status');root.append(status);
 function draw(){wrapper.replaceChildren();const rows=filtered();start.disabled=!rows.length;status.textContent=rows.length+' verbos · orden A–Z';const table=E('table','verb-table'),head=E('thead'),tr=E('tr');['Infinitivo','Pasado','Participio','Significado y notas','Práctica'].forEach(t=>{const th=E('th','',t);th.scope='col';tr.append(th)});head.append(tr);table.append(head);const body=E('tbody');for(const v of rows){const r=E('tr');r.append(E('th','',v.base),E('td','',show?v.past.join(' / '):'•••'),E('td','',show?v.participle.join(' / '):'•••'));const meaning=E('td');meaning.append(E('span','',v.es));if(v.note&&show)meaning.append(E('small','verb-note',v.note));r.append(meaning);const act=E('td');act.append(B('Practicar',()=>engine.start([v],mode),true));r.append(act);body.append(r)}table.append(body);wrapper.append(table);if(!rows.length)wrapper.append(E('p','empty','No hay verbos con ese filtro.'))}draw();root.append(B('Volver a verbos',onExit,true));
 }
 function filtered(){return verbs.filter(v=>(filter==='all'||pattern(v)===filter)&&(v.base+' '+v.es).toLowerCase().includes(search.trim().toLowerCase()))}
 menu();return engine;
}
function conversation({root,progress,save,onExit}){let active='all';const engine=sessionEngine({root,progress,save,onExit,kind:'conversation',menu});function menu(){root.replaceChildren();root.append(E('h1','','Qué decir durante una conversación'),E('p','lead','48 respuestas breves: comprender, mostrar interés, pedir aclaraciones, discrepar y cerrar. Todo se practica por escrito.'));const actions=E('div','row');actions.append(B('Practicar 10 respuestas',()=>engine.start(active==='all'?talk:talk.filter(c=>c.function===active))));if(engine.hasSession())actions.append(B('Continuar sesión guardada',engine.resume,true));root.append(actions);const label=E('label','','Filtrar por intención'),select=E('select','field');[['all','Todas las intenciones'],...[...new Set(talk.map(c=>c.function))].map(s=>[s,s])].forEach(([v,t])=>{const o=E('option','',t);o.value=v;select.append(o)});select.value=active;select.onchange=()=>{active=select.value;draw()};label.append(select);root.append(label);const list=E('div','conversation-grid');root.append(list);function draw(){list.replaceChildren();for(const c of talk.filter(c=>active==='all'||c.function===active)){const card=E('article','lesson-tile');card.append(E('span','tag',c.function),E('h2','',c.en),E('p','',c.es),E('small','muted',c.register));const detail=E('details','rule-preview');detail.append(E('summary','','Cuándo usarla'),E('p','',c.exampleNote),E('p','',c.example),E('p','',c.exampleEs));card.append(detail);list.append(card)}}draw();root.append(B('Volver a vocabulario',onExit,true))}menu();return engine}
window.ExpandedPractice={irregulars,conversation,sanitize,accepts,pattern};
})();
