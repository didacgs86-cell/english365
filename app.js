(()=>{'use strict';
const DATA=window.ENGLISH_CONTENT,KEY='english365_progress_v1',app=document.getElementById('app');
const defaults=()=>({version:1,cards:{},grammar:{},updatedAt:new Date().toISOString()});
let state=load(),session=null,cardTimer=null;
function load(){try{const x=JSON.parse(localStorage.getItem(KEY));if(x&&x.version===1&&typeof x.cards==='object'&&typeof x.grammar==='object')return x}catch(e){}return defaults()}
function save(){state.updatedAt=new Date().toISOString();try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){alert('No se pudo guardar. Comprueba el almacenamiento del navegador.')}}
function el(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n}
function add(parent,...children){children.forEach(c=>parent.append(c));return parent}
function btn(txt,fn,cls='btn'){const b=el('button',cls,txt);b.type='button';b.onclick=fn;return b}
function clear(){if(cardTimer!==null){clearTimeout(cardTimer);cardTimer=null}app.replaceChildren()}
function title(text,sub){add(app,el('h1','',text),el('p','lead',sub))}
function nav(label='Inicio',fn=home){add(app,add(el('div','nav'),btn('← '+label,fn,'btn secondary')))}
function panel(){return el('section','panel')}
function days(t){return Math.max(0,Math.ceil((t-Date.now())/86400000))}
function cardState(id){return state.cards[id]||{step:0,interval:0,due:0,reps:0,lapses:0}}
function dueCards(){return DATA.vocab.filter(c=>!state.cards[c.id]||cardState(c.id).due<=Date.now())}
function home(){session=null;clear();title('English365 · Tu inglés B2','Aprende por temas, practica y repasa con tarjetas espaciadas.');const grid=el('div','grid');[['📚','Vocabulario','Palabras B2, flashcards, test y completar frases',vocabHome],['✍️','Gramática','Explicaciones y ejercicios B2',grammarHome],['🧠','Repaso',`${dueCards().length} tarjetas nuevas o pendientes`,reviewHome]].forEach(([icon,name,desc,fn])=>{const c=el('button','card');add(c,el('div','emoji',icon),el('h2','',name),el('p','',desc));c.onclick=fn;grid.append(c)});app.append(grid);const p=panel();p.classList.add('spaced');add(p,el('h3','','Tus datos'),el('p','','El progreso se guarda en este navegador. Para trasladarlo a otro dispositivo, exporta el archivo y luego impórtalo allí. Importar sustituye el progreso de ese dispositivo.'));const r=el('div','row');add(r,btn('↓ Exportar progreso',exportData),btn('↑ Importar progreso',()=>document.getElementById('importFile').click(),'btn secondary'));p.append(r);app.append(p)}
const CAT_ICONS=['🧩','🔤','📦','✨','🔗','💬','🩺','✈️','💼','🌿','🌍','🎓','🎭'];
const TYPE_CATEGORIES=['Phrasal verbs','Verbos','Sustantivos','Adjetivos','Conectores','Collocations y expresiones'];
const THEME_CATEGORIES=['Salud y medicina','Viajes y turismo','Trabajo y empresa','Medio ambiente','Sociedad y actualidad','Educación','Cultura y arte'];
const CATEGORY_MAP=Object.fromEntries([...TYPE_CATEGORIES,...THEME_CATEGORIES].map(k=>[k,k]));
const OLD_TYPES={ 'Phrasal verbs':'Phrasal verbs','Verbs':'Verbos','Nouns':'Sustantivos','Adjectives':'Adjetivos','Connectors':'Conectores' };
const OLD_THEMES={
 'Salud y medicina':['Breakthrough','Trial','Side effect','To diagnose','Findings','To recover'],
 'Viajes y turismo':['Itinerary','Accommodation','Delay','Landmark','To explore','To get around'],
 'Trabajo y empresa':['Workload','Promotion','To negotiate','Revenue','To resign','To meet a deadline','Deadline'],
 'Medio ambiente':['Emissions','Renewable','Drought','Waste','Wildlife','To tackle','Sustainable'],
 'Sociedad y actualidad':['Bias','Inequality','Debate','Claim','Survey','To raise awareness'],
 'Educación':['Assignment','Feedback','To revise','Curriculum','Scholarship','To acquire'],
 'Cultura y arte':['Exhibition','Heritage','Plot','Masterpiece','Performance','To portray']
};
function categoryCards(name){return DATA.vocab.filter(c=>{
 if(TYPE_CATEGORIES.includes(name)){
  if(name==='Collocations y expresiones')return c.category===name || c.category==='Expressions';
  return OLD_TYPES[c.category]===name;
 }
 return c.category===name || (OLD_THEMES[name]||[]).includes(c.en);
})}
function vocabHome(){clear();nav();title('Vocabulario B2','Elige por tipo de palabra o por tema. Cada tarjeta pertenece a una categoría coherente.');const search=el('input','field');search.placeholder='Buscar categoría o palabra...';app.append(search);const grid=el('div','category-grid');app.append(grid);function draw(){grid.replaceChildren();Object.keys(CATEGORY_MAP).forEach((name,i)=>{const cards=categoryCards(name);if(!cards.length || (!name.toLowerCase().includes(search.value.toLowerCase())&&!cards.some(c=>c.en.toLowerCase().includes(search.value.toLowerCase()))))return;const b=el('button','category-card');add(b,el('span','category-icon',CAT_ICONS[i]),el('span','category-title',name),el('small','',cards.length+' palabras · '+cards.filter(c=>state.cards[c.id]).length+' estudiadas'),el('span','category-arrow','›'));b.onclick=()=>categoryHome(name);grid.append(b)})}search.oninput=draw;draw()}
function categoryHome(name){const cards=categoryCards(name);clear();nav('Categorías',vocabHome);title(name,`${cards.length} palabras B2. Aprende primero el significado y luego practica.`);const p=panel();add(p,el('h3','','1 · Aprender con flashcards'),el('p','','Descubre la traducción y el ejemplo. Después indica cuánto recuerdas cada palabra.'),btn('Aprender 10 tarjetas',()=>startCards(cards.filter(c=>!state.cards[c.id]).slice(0,10).length?cards.filter(c=>!state.cards[c.id]).slice(0,10):cards.filter(c=>cardState(c.id).due<=Date.now()).slice(0,10))),btn('Ver todas las tarjetas',()=>startCards(cards),'btn secondary'));app.append(p);const modes=el('div','mode-grid spaced');[['📝','Tipo test','Elige el significado correcto',()=>startVocabQuiz(cards,()=>categoryHome(name))],['✏️','Completar frases','Con pista en español y respuesta vinculada a este tema',()=>startFill(cards,()=>categoryHome(name))],['🔤','Traducción','Escribe la expresión en inglés',()=>startTranslation(cards,()=>categoryHome(name))]].forEach(([ico,t,desc,fn])=>{const b=el('button','mode-card');add(b,el('span','',ico),el('strong','',t),el('small','',desc));b.onclick=fn;modes.append(b)});app.append(modes);const p2=panel();p2.classList.add('spaced');add(p2,el('h3','','Palabras de este tema'));cards.forEach(c=>{const d=el('div','word-row');add(d,el('strong','',c.en),el('span','',c.es));p2.append(d)});app.append(p2)}
function startCards(cards){
 if(!cards.length){clear();nav('Vocabulario',vocabHome);title('¡Todo al día!','No tienes tarjetas pendientes por ahora.');app.append(btn('Estudiar todas',()=>startCards(DATA.vocab)));return}
 session={kind:'cards',queue:cards.map(c=>({card:c,ready:0})),done:0,total:cards.length,flipped:false};renderCard();
}
function intervalFor(id,rating){
 const x=cardState(id),v=x.interval||0;
 if(rating===0)return {ms:60000,label:'1 min'};
 let d=rating===1?Math.max(1,Math.round((v||1)*1.3)):rating===2?(v===0?1:v===1?3:Math.round(v*2.2)):(v===0?4:Math.max(4,Math.round(v*3)));
 return {ms:d*86400000,label:d===1?'1 día':d+' días'};
}
function renderCard(){
 clear();const s=session;if(!s||s.kind!=='cards')return;
 if(!s.queue.length){nav('Inicio',home);title('¡Sesión terminada!',`Has completado ${s.done} tarjetas. Tus respuestas se han guardado para los próximos repasos.`);app.append(btn('Volver a inicio',home));return}
 const now=Date.now(),pos=s.queue.findIndex(x=>x.ready<=now);
 if(pos<0){const next=Math.min(...s.queue.map(x=>x.ready)),seconds=Math.max(1,Math.ceil((next-now)/1000));nav('Salir del repaso',reviewHome);title('Esperando las tarjetas difíciles',`Has completado ${s.done} de ${s.total} tarjetas. Quedan ${s.queue.length} para repetir.`);const p=panel();add(p,el('h2','',`Próxima tarjeta en ${seconds} s`),el('p','','Las tarjetas marcadas «Otra vez» reaparecen aproximadamente un minuto después. Puedes dejar esta pantalla abierta.'),btn('Terminar por ahora',reviewHome,'btn secondary'));app.append(p);cardTimer=setTimeout(renderCard,Math.min(1000,next-now));return}
 const entry=s.queue.splice(pos,1)[0],c=entry.card;
 nav('Salir del repaso',reviewHome);title('Flashcards',`${s.done} completadas · ${s.queue.length+1} pendientes en esta sesión`);
 const progress=el('div','bar'),bar=el('div');bar.style.width=`${Math.round(100*s.done/s.total)}%`;progress.append(bar);app.append(progress);
 const p=panel();add(p,el('span','tag',c.category));const flip=el('button','flip');flip.type='button';
 const front=()=>flip.replaceChildren(el('small','','INGLÉS'),el('strong','',c.en),el('small','','Toca para mostrar la respuesta'));
 const back=()=>flip.replaceChildren(el('small','','SIGNIFICADO'),el('strong','',c.es),el('span','',c.example));
 front();const controls=el('div');flip.onclick=()=>{s.flipped=!s.flipped;s.flipped?back():front();renderRatings()};add(p,flip,controls);app.append(p);
 function renderRatings(){controls.replaceChildren();if(!s.flipped){controls.append(el('p','muted','Intenta recordar el significado antes de girar la tarjeta.'));return}
 controls.append(el('p','muted','Elige según lo bien que has recordado esta palabra. El tiempo indica cuándo volverá a estar disponible.'));
 const r=el('div','ratings');['Otra vez','Difícil','Bien','Fácil'].forEach((name,i)=>{
  const timing=intervalFor(c.id,i),button=btn(name,()=>{
   const result=rateCard(c.id,i);if(i===0)s.queue.push({card:c,ready:result.due});else s.done++;
   s.flipped=false;renderCard();
  },'');button.append(el('small','',timing.label));r.append(button)
 });controls.append(r)}renderRatings();
}
// Algoritmo propio y sencillo de repetición espaciada; no es FSRS.
function rateCard(id,rating){const old=cardState(id),x={...old};x.reps++;if(rating===0){x.step=0;x.interval=0;x.lapses++;x.due=Date.now()+60*1000}else if(rating===1){x.step=Math.max(1,x.step);x.interval=Math.max(1,Math.round((x.interval||1)*1.3));x.due=Date.now()+x.interval*86400000}else if(rating===2){x.step++;x.interval=x.interval===0?1:x.interval===1?3:Math.round(x.interval*2.2);x.due=Date.now()+x.interval*86400000}else{x.step++;x.interval=x.interval===0?4:Math.max(4,Math.round(x.interval*3));x.due=Date.now()+x.interval*86400000}state.cards[id]=x;save();return x}
function shuffle(a){const out=[...a];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
function startVocabQuiz(cards=DATA.vocab,back=vocabHome){const items=shuffle(cards).slice(0,10).map(c=>{const pool=DATA.vocab.filter(x=>x.id!==c.id&&x.es!==c.es);const wrong=shuffle(pool).slice(0,3).map(x=>x.es);return {q:`¿Qué significa “${c.en}”?`,options:shuffle([c.es,...wrong]),answer:c.es,why:c.example+' — '+c.es}});startQuiz(items,'Vocabulario',back)}
function startFill(cards=DATA.vocab,back=vocabHome){const items=shuffle(cards.filter(c=>new RegExp(escapeReg(c.en),'i').test(c.example))).slice(0,10).map(c=>({q:c.example.replace(new RegExp(escapeReg(c.en),'i'),'_____'),answer:c.en,hint:c.es,why:`${c.en} = ${c.es}. ${c.example}`}));session={kind:'fill',items,index:0,score:0,back};renderFill()}
function startTranslation(cards,back){const items=shuffle(cards).slice(0,10).map(c=>({q:`Escribe en inglés: ${c.es}`,answer:c.en,hint:'Usa la expresión estudiada en este tema.',why:c.example}));session={kind:'fill',items,index:0,score:0,back,translation:true};renderFill()}
function escapeReg(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function normalize(s){return s.trim().toLocaleLowerCase('en').replace(/[.!?]+$/,'').replace(/\s+/g,' ')}
function renderFill(){clear();nav('Categoría',session.back||vocabHome);const s=session;if(s.index>=s.items.length){endQuiz(s.translation?'Traducción':'Completar frases',s.score,s.items.length,s.back||vocabHome);return}const x=s.items[s.index];title(s.translation?'Traducción':'Completar frases',`Ejercicio ${s.index+1} de ${s.items.length}`);const p=panel();add(p,el('div','question',x.q),el('p','hint',s.translation?'Traduce la expresión al inglés.':'Pista · '+x.hint+' (palabra de esta categoría)'));const input=el('input','field');input.placeholder='Tu respuesta';input.autocomplete='off';const result=el('div');const check=btn('Comprobar',()=>{if(!input.value.trim())return;const ok=normalize(input.value)===normalize(x.answer);if(ok)s.score++;result.replaceChildren(el('div',`answer ${ok?'':'bad'}`,`${ok?'✓ Correcto':'✗ Respuesta esperada: '+x.answer}. ${x.why}`),btn('Siguiente →',()=>{s.index++;renderFill()}));check.disabled=true;input.disabled=true});add(p,input,check,result);app.append(p)}
function startQuiz(items,name,back,grammarId){session={kind:'quiz',items,index:0,score:0,name,back,grammarId};renderQuiz()}
function renderQuiz(){clear();const s=session;nav(s.name==='Gramática'?'Gramática':'Vocabulario',s.back);if(s.index>=s.items.length){if(s.grammarId){const prior=state.grammar[s.grammarId]||{attempts:0,best:0};state.grammar[s.grammarId]={attempts:prior.attempts+1,best:Math.max(prior.best,s.score)};save()}endQuiz(s.name,s.score,s.items.length,s.back);return}const x=s.items[s.index];title(s.name,`Pregunta ${s.index+1} de ${s.items.length}`);const p=panel();p.append(el('div','question',x.q));const choices=el('div','choices'),feedback=el('div');x.options.forEach(option=>{const b=btn(option,()=>{const ok=option===x.answer;if(ok)s.score++;Array.from(choices.children).forEach(y=>{y.disabled=true;if(y.textContent===x.answer)y.classList.add('correct');else if(y===b)y.classList.add('wrong')});feedback.replaceChildren(el('div',`answer ${ok?'':'bad'}`,`${ok?'✓ Correcto':'✗ Incorrecto. Respuesta: '+x.answer}. ${x.why}`),btn('Siguiente →',()=>{s.index++;renderQuiz()}))},'choice');choices.append(b)});add(p,choices,feedback);app.append(p)}
function endQuiz(name,score,total,back){clear();nav('Volver',back);title('Ejercicios completados',`${name} · ${score} de ${total} respuestas correctas`);const p=panel();add(p,el('h2','',`${Math.round(score/total*100)}% de aciertos`),el('p','','Puedes repetir los ejercicios para seguir practicando.'),btn('Volver',back));app.append(p)}
function grammarHome(){clear();nav();title('Gramática B2','Selecciona un tema para leer la explicación y practicar.');const topics=el('div','topics');DATA.grammar.forEach(g=>{const b=el('button','topic');const record=state.grammar[g.id];add(b,el('strong','',g.title),el('span','',record?`Mejor resultado: ${record.best}/${g.questions.length}`:`${g.questions.length} ejercicios`));b.onclick=()=>grammarLesson(g);topics.append(b)});app.append(topics)}
function grammarLesson(g){clear();nav('Gramática',grammarHome);title(g.title,'Explicación y ejemplos originales de nivel B2.');const p=panel();add(p,el('h3','','Regla'),el('p','lesson',g.intro));if(g.keyPoint)add(p,el('h3','','Cómo distinguirlo'),el('p','lesson',g.keyPoint));add(p,el('h3','','Ejemplos'));const ul=el('ul','lesson');g.examples.forEach(x=>ul.append(el('li','',x)));p.append(ul);if(g.translatedExamples){add(p,el('h3','','Ejemplos traducidos'));const translated=el('ul','lesson');g.translatedExamples.forEach(x=>translated.append(el('li','',x)));p.append(translated)}if(g.pitfall){add(p,el('h3','','Error frecuente'),el('p','hint',g.pitfall))}add(p,btn('Empezar ejercicios',()=>{const items=g.questions.map(([q,options,correct,why])=>({q,options,answer:options[correct],why}));startQuiz(items,'Gramática',()=>grammarLesson(g),g.id)}));app.append(p)}
function reviewHome(){clear();nav();title('Repaso','Primero recupera palabras ya estudiadas; después puedes aprender otras nuevas.');
 const now=Date.now(),pending=DATA.vocab.filter(c=>state.cards[c.id]&&cardState(c.id).due<=now).sort((a,b)=>cardState(a.id).due-cardState(b.id).due),newCards=DATA.vocab.filter(c=>!state.cards[c.id]),studied=DATA.vocab.length-newCards.length;
 const p=panel();add(p,el('h2','',`${pending.length} tarjetas pendientes de repaso`),el('p','',`${studied} palabras estudiadas · ${newCards.length} aún sin estudiar. Las tarjetas que marques «Otra vez» volverán durante la misma sesión.`));
 const r=el('div','row');const review=btn(`Repasar pendientes (${pending.length})`,()=>startCards(pending.slice(0,20)));review.disabled=!pending.length;
 const learn=btn(`Aprender 10 nuevas (${Math.min(10,newCards.length)})`,()=>startCards(newCards.slice(0,10)),'btn secondary');learn.disabled=!newCards.length;add(r,review,learn);p.append(r);app.append(p);
 const p2=panel();p2.classList.add('spaced');add(p2,el('h3','','Próximas tarjetas programadas'));
 const upcoming=DATA.vocab.filter(c=>state.cards[c.id]&&cardState(c.id).due>now).sort((a,b)=>cardState(a.id).due-cardState(b.id).due).slice(0,8);
 if(!upcoming.length)p2.append(el('p','muted','Todavía no hay repasos futuros programados.'));
 upcoming.forEach(c=>{const diff=cardState(c.id).due-Date.now(),time=diff<3600000?`${Math.ceil(diff/60000)} min`:diff<86400000?`${Math.ceil(diff/3600000)} h`:`${Math.ceil(diff/86400000)} día(s)`;p2.append(el('p','',`${c.en} · en ${time}`))});app.append(p2)
}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`english365-progreso-${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
document.getElementById('importFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>2e6)throw Error('El archivo es demasiado grande.');const x=JSON.parse(await file.text());if(!x||x.version!==1||!x.cards||!x.grammar||typeof x.cards!=='object'||Array.isArray(x.cards)||typeof x.grammar!=='object'||Array.isArray(x.grammar))throw Error('Formato no compatible.');for(const v of Object.values(x.cards)){if(!v||typeof v.due!=='number'||!Number.isFinite(v.due)||typeof v.reps!=='number')throw Error('Datos de tarjetas no válidos.')}if(!confirm('Importar sustituirá el progreso guardado en este dispositivo. ¿Continuar?'))return;state={version:1,cards:x.cards,grammar:x.grammar,updatedAt:new Date().toISOString()};save();home();alert('Progreso importado correctamente.')}catch(err){alert('No se pudo importar: '+err.message)}finally{e.target.value=''}});
window.addEventListener('hashchange',()=>{if(location.hash==='#home')home()});if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));home();
})();
