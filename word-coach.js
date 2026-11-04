/* English365: sesiones de recuerdo activo, sin modificar las valoraciones de flashcards. */
(()=>{'use strict';
const normalize=s=>String(s).trim().toLocaleLowerCase('en').replace(/[.!?]+$/,'').replace(/\s+/g,' ').replace(/^[“”"']+|[“”"']+$/g,'');
function accepts(value,card){
 const forms=[card.en,...(card.alternatives||[])].flatMap(s=>/^to /i.test(s)?[s,s.slice(3)]:[s]);
 if(forms.some(s=>/\benrol\b/i.test(s)))forms.push(...forms.map(s=>s.replace(/\benrol\b/ig,'enroll')));
 return forms.map(normalize).includes(normalize(value));
}
function node(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function button(text,fn,secondary=false){const b=node('button','btn'+(secondary?' secondary':''),text);b.type='button';b.onclick=fn;return b}
function mix(cards){const out=[...cards];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
function example(card){return card.example&&!/^Vocabulario B2 del PDF/i.test(card.example)?card.example:''}
function validSession(s,byId){return s&&s.version===1&&Array.isArray(s.ids)&&s.ids.length>0&&s.ids.length<=5&&new Set(s.ids).size===s.ids.length&&s.ids.every(id=>byId.has(id))&&['study','recall','summary'].includes(s.phase)&&Number.isInteger(s.studyIndex)&&s.studyIndex>=0&&s.studyIndex<s.ids.length&&Array.isArray(s.queue)&&s.queue.length<=5&&new Set(s.queue).size===s.queue.length&&s.queue.every(id=>s.ids.includes(id))&&s.results&&s.ids.every(id=>{const r=s.results[id];return r&&['attempts','correct','wrong','helped'].every(k=>Number.isInteger(r[k])&&r[k]>=0&&r[k]<=4)&&r.correct<=2&&r.attempts<=4})&&Number.isInteger(s.hint)&&s.hint>=0&&s.hint<=2&&typeof s.revealed==='boolean'&&(s.answer===null||typeof s.answer==='object'&&s.answer&&typeof s.answer.ok==='boolean'&&typeof s.answer.helped==='boolean'&&typeof s.answer.value==='string')}
function attach(options){
 const {root,cards,progress,save,onExit,onArchive,scope}=options;
 const eligible=cards.filter(c=>['hard','again'].includes(progress.cards[c.id]?.bucket));
 const byId=new Map(eligible.map(c=>[c.id,c]));
 if(!progress.learningSessions||typeof progress.learningSessions!=='object'||Array.isArray(progress.learningSessions))progress.learningSessions={};
 if(!progress.learningStats||typeof progress.learningStats!=='object'||Array.isArray(progress.learningStats))progress.learningStats={};
 let s=progress.learningSessions[scope];
 if(!validSession(s,byId)){delete progress.learningSessions[scope];s=null}
 const box=node('section','panel spaced coach');box.append(node('h3','','Aprender estas palabras'),node('p','','Sesiones de hasta 5 palabras: lee frases de ejemplo, escucha, recuerda por escrito y repite. Tu clasificación solo cambia si eliges Fácil.'));
 if(s)box.append(button(s.phase==='summary'?'Ver última sesión':'Continuar sesión guardada',render));
 const launch=button(s?'Nueva sesión · sustituir la guardada':'Aprender estas palabras · 5 por sesión',()=>start(eligible));launch.disabled=!eligible.length;box.append(launch);
 if(!eligible.length)box.append(node('p','muted','Marca alguna palabra como Difícil u Otra vez para empezar.'));
 root.append(box);
 function commit(){progress.learningSessions[scope]=s;save()}
 function start(pool){
  const selected=mix(pool).sort((a,b)=>(progress.learningStats[a.id]?.sessions||0)-(progress.learningStats[b.id]?.sessions||0)).slice(0,5);
  if(!selected.length)return;
  s={version:1,ids:selected.map(c=>c.id),phase:'study',studyIndex:0,queue:selected.map(c=>c.id),results:Object.fromEntries(selected.map(c=>[c.id,{attempts:0,correct:0,wrong:0,helped:0}])),hint:0,revealed:false,answer:null,completed:false};commit();render();
 }
 function audio(text){
  if(!('speechSynthesis'in window)){alert('La lectura en voz alta no está disponible en este navegador.');return}
  window.speechSynthesis.cancel();const voice=new SpeechSynthesisUtterance(text);voice.lang='en-GB';voice.rate=.85;window.speechSynthesis.speak(voice);
 }
 function heading(text,sub){root.append(node('h1','',text),node('p','lead',sub))}
 function render(){
  root.replaceChildren();root.append(button('← Guardar y salir',()=>{commit();if('speechSynthesis'in window)window.speechSynthesis.cancel();onExit()},true));
  if(s.phase==='study')study();else if(s.phase==='summary')summary();else recall();
 }
 function study(){
  const c=byId.get(s.ids[s.studyIndex]);heading('Entender y escuchar',`Palabra ${s.studyIndex+1} de ${s.ids.length} · Después tendrás que escribirla de memoria.`);
  const p=node('section','panel');p.append(node('h2','',c.en),node('p','coach-translation',c.es),button('🔊 Escuchar pronunciación',()=>audio(c.en),true));
  if(window.WordExamples)p.append(window.WordExamples.render(c,{progress,save}));else if(example(c))p.append(node('p','lesson',example(c)));
  p.append(button(s.studyIndex+1===s.ids.length?'Empezar a recordar →':'Siguiente palabra →',()=>{if(s.studyIndex+1<s.ids.length)s.studyIndex++;else s.phase='recall';commit();render()}));root.append(p);
 }
 function recall(){
  if(!s.queue.length){finish();return}
  const c=byId.get(s.queue[0]),r=s.results[c.id];heading('Recordar sin mirar',`${s.ids.filter(id=>s.results[id].correct>=2).length} de ${s.ids.length} palabras recordadas dos veces sin ayuda · Intento ${r.attempts+(s.answer?0:1)} de 4 para esta palabra.`);
  const p=node('section','panel');p.append(node('p','muted','Escribe la expresión estudiada en inglés. Se aceptan mayúsculas, puntuación final y el infinitivo con o sin «to».'));
  const label=node('label','question',c.es);label.htmlFor='coach-answer';p.append(label);
  const input=node('input','field');input.id='coach-answer';input.autocomplete='off';input.setAttribute('autocorrect','off');input.spellcheck=false;input.placeholder='Tu respuesta en inglés';input.value=s.answer?s.answer.value:s.draft||'';input.disabled=!!s.answer||s.revealed;
  input.oninput=()=>{s.draft=input.value;commit()};p.append(input);
  const hints=node('div','row');
  if(!s.answer){
   const check=button('Comprobar',()=>{if(!input.value.trim())return;answer(accepts(input.value,c),input.value)});check.disabled=s.revealed;hints.append(check);
   const hint=button(s.hint===0?'Pista 1 · Primera letra':'Pista 2 · Forma de la expresión',()=>{s.draft=input.value;s.hint=Math.min(2,s.hint+1);commit();render()},true);hint.disabled=s.hint>=2||s.revealed;hints.append(hint);
   hints.append(button('Ver respuesta',()=>{s.revealed=true;answer(false,input.value)},true));
   input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();check.click()}});
  }
  p.append(hints);
  if(s.hint>0){const bare=c.en.replace(/^to /i,'');p.append(node('p','hint',s.hint===1?'Primera letra de la palabra principal: '+bare.charAt(0).toUpperCase():'Forma: '+bare.replace(/[A-Za-z]/g,'_')+' · '+bare.split(/\s+/).length+' palabra(s)'));}
  if(s.answer){
   const feedback=node('div','answer'+(!s.answer.ok?' bad':''));feedback.setAttribute('role','status');feedback.append(node('strong','',s.answer.ok?(s.answer.helped?'Correcto con ayuda':'✓ Correcto sin ayuda'):'Respuesta: '+c.en),node('p','',c.en+' — '+c.es));
   if(window.WordExamples)feedback.append(window.WordExamples.render(c,{progress,save}));else if(example(c))feedback.append(node('p','',example(c)));
   feedback.append(button('🔊 Escuchar respuesta',()=>audio(c.en),true),node('p','muted',r.correct>=2?'Ya la has recordado dos veces sin ayuda.':r.attempts>=4?'La guardamos para seguir practicando en otra ronda.':'Volverá a aparecer después de otras palabras cuando las haya.'));
   p.append(feedback,button('Continuar →',advance));
  }
  root.append(p);if(!input.disabled)input.focus();
 }
 function answer(ok,value){
  if(s.answer)return;const r=s.results[s.queue[0]],helped=s.hint>0||s.revealed;r.attempts++;if(!ok)r.wrong++;if(helped)r.helped++;if(ok&&!helped)r.correct++;s.answer={ok,helped,value};delete s.draft;commit();render();
 }
 function advance(){
  const id=s.queue.shift(),r=s.results[id];if(r.correct<2&&r.attempts<4)s.queue.splice(Math.min(2,s.queue.length),0,id);
  s.answer=null;s.hint=0;s.revealed=false;delete s.draft;commit();render();
 }
 function finish(){
  s.phase='summary';if(!s.completed){s.ids.forEach(id=>{const r=s.results[id],old=progress.learningStats[id]||{};progress.learningStats[id]={sessions:(old.sessions||0)+1,attempts:(old.attempts||0)+r.attempts,lastPracticed:Date.now(),lastResult:r.correct>=2?'recalled':'practice'}});s.completed=true}commit();render();
 }
 function summary(){
  heading('Sesión terminada',`${s.ids.filter(id=>s.results[id].correct>=2).length} de ${s.ids.length} recordadas dos veces sin ayuda. La práctica se ha guardado; ninguna palabra se archiva automáticamente.`);
  const table=node('table','coach-results'),head=node('tr');['Palabra','Resultado','Clasificación'].forEach(t=>head.append(node('th','',t)));const thead=node('thead');thead.append(head);table.append(thead);const body=node('tbody');
  s.ids.forEach(id=>{const c=byId.get(id),r=s.results[id],row=node('tr');row.append(node('td','',c.en));const text=r.correct<2?'Seguir practicando':r.wrong?'Recordada tras repetir':r.helped?'Recordada después de usar una pista':'Recordada sin ayuda';row.append(node('td','',text));const action=node('td');if(progress.cards[id]?.bucket==='known')action.append(node('span','','Archivada'));else action.append(button('Fácil · archivar',()=>{onArchive(c);commit();summaryRefresh()},true));row.append(action);body.append(row)});table.append(body);const scroll=node('div','coach-table');scroll.append(table);root.append(scroll);
  const missed=s.ids.filter(id=>{const r=s.results[id];return (r.wrong>0||r.helped>0||r.correct<2)&&['hard','again'].includes(progress.cards[id]?.bucket)}).map(id=>byId.get(id));
  const retry=button('Practicar solo las falladas ('+missed.length+')',()=>start(missed));retry.disabled=!missed.length;
  root.append(retry,button('Volver a mis palabras',onExit,true));
 }
 function summaryRefresh(){render()}
 return {start:()=>start(eligible),resume:render};
}
window.WordCoach={attach};
})();
