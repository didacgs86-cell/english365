(()=>{'use strict';
const DATA=window.ENGLISH_CONTENT,KEY='english365_progress_v1',app=document.getElementById('app');
const defaults=()=>({version:1,cards:{},grammar:{},practice:{},updatedAt:new Date().toISOString()});
let state=load(),session=null,cardTimer=null;
if(!state.practice||typeof state.practice!=='object')state.practice={};
function load(){try{const x=JSON.parse(localStorage.getItem(KEY));if(x&&x.version===1&&typeof x.cards==='object'&&typeof x.grammar==='object')return x}catch(e){}return defaults()}
function save(){state.updatedAt=new Date().toISOString();try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch(e){alert('No se pudo guardar. Comprueba el almacenamiento del navegador.');return false}}
function el(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n}
function add(parent,...children){children.forEach(c=>parent.append(c));return parent}
function btn(txt,fn,cls='btn'){const b=el('button',cls,txt);b.type='button';b.onclick=fn;return b}
function clear(){if(cardTimer!==null){clearTimeout(cardTimer);cardTimer=null}app.replaceChildren();window.scrollTo?.({top:0,behavior:'instant'})}
function title(text,sub){add(app,el('h1','',text),el('p','lead',sub));document.title=text+' · English365'}
function nav(label='Inicio',fn=home){add(app,add(el('div','nav'),btn('← '+label,fn,'btn secondary')))}
function panel(){return el('section','panel')}
function days(t){return Math.max(0,Math.ceil((t-Date.now())/86400000))}
function cardState(id){return state.cards[id]||{step:0,interval:0,due:0,reps:0,lapses:0}}
function isKnown(c){return cardState(c.id).bucket==='known'}
function dueCards(){return DATA.vocab.filter(c=>!isKnown(c)&&(!state.cards[c.id]||cardState(c.id).due<=Date.now()))}
function setNav(key){document.title=({home:'Inicio',vocab:'Vocabulario',lab:'Laboratorio',grammar:'Gramática',dialogs:'Diálogos'}[key]||'Mi espacio')+' · English365';document.querySelectorAll('[data-nav]').forEach(b=>{const active=b.dataset.nav===key;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});const labels={home:'Inicio',vocab:'Vocabulario',lab:'Laboratorio',grammar:'Gramática',dialogs:'Diálogos'};const name=document.getElementById('view-name');if(name)name.textContent=labels[key]||'Mi espacio'}
function labHome(){setNav('lab');clear();session=null;window.UsageLab.mount({root:app,progress:state,save,onExit:home})}
function blockHeading(label,link,fn){const h=el('div','section-heading');h.append(el('h2','',label));if(link)h.append(btn(link,fn,'text-button'));return h}
function openTools(){clear();title('Tu progreso, contigo','Guarda una copia antes de cambiar de dispositivo.');nav('Inicio',home);const p=panel();add(p,el('h2','','Copia de seguridad'),el('p','','Los datos se guardan en este navegador. Exporta desde tu iPhone e importa aquí para continuar en el ordenador. Importar sustituye los datos del navegador actual.'),btn('Exportar progreso',exportData),btn('Importar progreso',()=>document.getElementById('importFile').click(),'btn secondary'));app.append(p)}
function home(){
 setNav('home');session=null;clear();
 const all=DATA.vocab,known=all.filter(isKnown).length,studied=all.filter(c=>state.cards[c.id]).length,pending=all.filter(c=>!isKnown(c)&&state.cards[c.id]&&cardState(c.id).due<=Date.now()),weak=all.filter(c=>['hard','again'].includes(cardState(c.id).bucket)),fresh=all.filter(c=>!state.cards[c.id]);
 const lab=window.UsageLab.summary(state.usageLab),date=new Intl.DateTimeFormat('es',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
 const intro=el('div','page-intro');intro.append(el('span','eyebrow',date),el('h1','','Tu inglés, con sentido.'),el('p','lead','Un pequeño paso hoy. Más soltura mañana.'));app.append(intro);
 const layout=el('div','dashboard-grid'),hero=el('section','dashboard-hero');hero.append(el('span','tag','TU SIGUIENTE PASO'),el('h2','','No solo recordar.\nSaber elegir.'),el('p','','Pon las palabras en su sitio: distingue matices, aprende combinaciones y entiende el porqué.'));
 const action=el('div','row');action.append(btn(lab.resumable?'Continuar mi práctica →':'Entrenar vocabulario en uso →',()=>{setNav('lab');clear();const mod=window.UsageLab.mount({root:app,progress:state,save,onExit:home});if(lab.resumable)mod.resume();else mod.launch('mixed')}));hero.append(action,el('div','hero-foot','8 situaciones · elección + razonamiento · a tu ritmo'));
 const art=el('div','word-orbit');art.setAttribute('aria-hidden','true');art.append(el('span','orbit-chip one','actually'),el('span','orbit-symbol','≠'),el('span','orbit-chip two','currently'),el('span','orbit-caption','en realidad  /  actualmente'));hero.append(art);layout.append(hero);
 const side=el('section','today-card');side.append(el('div','eyebrow','TU MOMENTO DE HOY'),el('h2','','Vuelve a lo importante.'),el('p','','Recupera lo que ya has visto antes de añadir más palabras.'));
 const dueRow=el('div','today-count');dueRow.append(el('strong','',String(pending.length)),el('span','','palabras pendientes'));side.append(dueRow);
 const review=btn(pending.length?'Repasar pendientes →':'Aprender 10 palabras →',()=>pending.length?startCards(pending.slice(0,20)):startCards(fresh.slice(0,10)));review.disabled=!pending.length&&!fresh.length;side.append(review,btn('Mis palabras clasificadas',wordFolders,'text-button'));layout.append(side);app.append(layout);
 const metrics=el('div','metrics');[[known,'Ya me las sé'],[studied,'Palabras vistas'],[weak.length,'Difícil / Otra vez'],[lab.settled,'Situaciones consolidadas']].forEach(([n,label])=>{const m=el('div','metric');m.append(el('strong','',String(n)),el('span','',label));metrics.append(m)});app.append(metrics);
 app.append(blockHeading('Tu forma de practicar','Explorar vocabulario →',vocabHome));const routes=el('div','route-grid');[
 ['01','No las confundas','Actually o currently. Sensible o sensitive. El matiz importa.',labHome,'lavender'],
 ['02','Recupera las difíciles','Vuelve a tus palabras de Difícil y Otra vez, con ejemplos y pistas.',()=>{wordFolders()},'sage'],
 ['03','De la palabra al diálogo','Usa lo que aprendes en viajes, trabajo y situaciones cotidianas.',speakingHome,'peach']
 ].forEach(([n,title,desc,fn,tone])=>{const b=el('button','route-card '+tone);b.type='button';b.append(el('span','route-number',n),el('h3','',title),el('p','',desc),el('span','route-arrow','↗'));b.onclick=fn;routes.append(b)});app.append(routes);
 const bottom=el('div','dashboard-bottom');bottom.append(el('p','muted','Tu progreso se queda en este navegador. Llévalo contigo al cambiar de dispositivo.'),btn('Gestionar mis datos',openTools,'text-button'));app.append(bottom)
}

const CAT_ICONS=['🧩','🔤','📦','✨','🔗','💬','🩺','✈️','💼','🌿','🌍','🎓','🎭'];
const TYPE_CATEGORIES=['Phrasal verbs','Verbos','Sustantivos','Adjetivos','Conectores','Collocations y expresiones'];
const THEME_CATEGORIES=['Salud y medicina','Viajes y turismo','Trabajo y empresa','Medio ambiente','Sociedad y actualidad','Educación','Cultura y arte'];
const CATEGORY_MAP=Object.fromEntries([...TYPE_CATEGORIES,...THEME_CATEGORIES].map(k=>[k,k]));
// Clasificación explícita por tarjeta: una etiqueta lingüística y una temática opcional.
// Las tarjetas históricas mantienen sus identificadores para preservar el progreso.
const OLD_TYPES={'Phrasal verbs':'Phrasal verbs','Verbs':'Verbos','Nouns':'Sustantivos','Adjectives':'Adjetivos','Connectors':'Conectores','Expressions':'Collocations y expresiones'};
const LEGACY_THEMES={
 'Salud y medicina':['Breakthrough','Trial','Side effect','To diagnose','Findings','To recover'],
 'Viajes y turismo':['Itinerary','Accommodation','Delay','Landmark','To explore','To get around'],
 'Trabajo y empresa':['Workload','Promotion','To negotiate','Revenue','To resign','To meet a deadline','Deadline'],
 'Medio ambiente':['Emissions','Renewable','Drought','Waste','Wildlife','To tackle','Sustainable'],
 'Sociedad y actualidad':['Bias','Inequality','Debate','Claim','Survey','To raise awareness'],
 'Educación':['Assignment','Feedback','To revise','Curriculum','Scholarship','To acquire'],
 'Cultura y arte':['Exhibition','Heritage','Plot','Masterpiece','Performance','To portray']
};
const THEME_BY_WORD=new Map(Object.entries(LEGACY_THEMES).flatMap(([theme,words])=>words.map(w=>[w,theme])));
DATA.vocab.forEach(c=>{
 c.wordType=c.id.startsWith('pdfb2_')?'':c.wordType||OLD_TYPES[c.category]|| (TYPE_CATEGORIES.includes(c.category)?c.category:'');
 c.theme=c.theme||(THEME_CATEGORIES.includes(c.category)?c.category:THEME_BY_WORD.get(c.en)||'');
});
function categoryCards(name){return DATA.vocab.filter(c=>TYPE_CATEGORIES.includes(name)?c.wordType===name:c.theme===name)}
function vocabHome(){
 setNav('vocab');clear();title('Tu vocabulario. A tu manera.','Busca una palabra, vuelve a tus carpetas o elige qué quieres aprender.');
 const toolbar=el('div','vocab-toolbar');toolbar.append(btn('Mis palabras clasificadas',wordFolders),btn('Laboratorio de uso ↗',labHome,'btn secondary'));app.append(toolbar);
 const search=el('input','field search');search.type='search';search.placeholder='Busca una palabra en inglés o español…';search.setAttribute('aria-label','Buscar vocabulario');app.append(search);
 const results=el('div','word-search-results'),browse=el('section');app.append(results,browse);
 const tabs=el('div','segmented');let group='themes';const content=el('div','category-grid');[['themes','Por situaciones'],['types','Por tipo de palabra']].forEach(([key,label])=>{const b=btn(label,()=>{group=key;drawCategories()},'btn secondary');b.dataset.group=key;tabs.append(b)});browse.append(tabs,el('p','muted','Explora el vocabulario temático. La búsqueda incluye también toda tu colección B2.'),content);
 function drawCategories(){tabs.querySelectorAll('button').forEach(b=>{b.classList.toggle('selected',b.dataset.group===group);b.setAttribute('aria-pressed',String(b.dataset.group===group))});content.replaceChildren();const names=group==='themes'?THEME_CATEGORIES:TYPE_CATEGORIES;names.forEach(name=>{const cards=categoryCards(name);if(!cards.length)return;const b=el('button','category-card');b.type='button';const learned=cards.filter(isKnown).length;b.append(el('span','category-icon',CAT_ICONS[Object.keys(CATEGORY_MAP).indexOf(name)]||'↗'),el('span','category-title',name),el('small','',cards.length+' palabras · '+learned+' archivadas'),el('span','category-arrow','↗'));b.onclick=()=>categoryHome(name);content.append(b)})}
 function drawSearch(){results.replaceChildren();const q=search.value.trim().toLowerCase();browse.hidden=!!q;if(!q)return;const found=DATA.vocab.filter(c=>(c.en+' '+c.es).toLowerCase().includes(q));results.append(el('p','muted',found.length+' resultados'+(found.length>40?' · se muestran los primeros 40':'')));found.slice(0,40).forEach(c=>{const row=el('article','search-word'),heading=el('div');heading.append(el('h3','',c.en),el('p','',c.es));const actions=el('div','row');actions.append(btn('Estudiar',()=>startCards([c],true),'btn secondary'));row.append(heading,actions);if(window.WordExamples)row.append(window.WordExamples.render(c,{progress:state,save,collapsed:true}));results.append(row)});if(!found.length)results.append(el('p','empty','Prueba con otra palabra o con su significado en español.'))}search.oninput=drawSearch;drawCategories();drawSearch();
 const archive=el('div','collection-link');archive.append(el('div', '', '¿Buscas la colección original del documento B2?'));const a=el('a','text-button','Abrir mis 1.350 palabras →');a.href='mi-vocabulario-b2.html';archive.append(a);browse.append(archive)
}

function categoryHome(name){setNav('vocab');const cards=categoryCards(name);clear();nav('Categorías',vocabHome);title(name,`${cards.length} palabras B2. Aprende primero el significado y luego practica.`);const p=panel();add(p,el('h3','','1 · Aprender con flashcards'),el('p','','Descubre la traducción y el ejemplo. Después indica cuánto recuerdas cada palabra.'),btn('Aprender 10 tarjetas',()=>startCards(cards.filter(c=>!state.cards[c.id]).slice(0,10).length?cards.filter(c=>!state.cards[c.id]).slice(0,10):cards.filter(c=>!isKnown(c)&&cardState(c.id).due<=Date.now()).slice(0,10))),btn('Estudiar tarjetas sin archivar',()=>startCards(cards),'btn secondary'));app.append(p);const modes=el('div','mode-grid spaced');[['📝','Tipo test','Elige el significado correcto',()=>startVocabQuiz(cards,()=>categoryHome(name))],['✏️','Completar frases','Con pista en español y respuesta vinculada a este tema',()=>startFill(cards,()=>categoryHome(name))],['🔤','Traducción','Escribe la expresión en inglés',()=>startTranslation(cards,()=>categoryHome(name))],['🎯','Recuerdo activo','Escribe la palabra inglesa a partir de su significado',()=>startRecall(cards,()=>categoryHome(name))]].forEach(([ico,t,desc,fn])=>{const b=el('button','mode-card');add(b,el('span','',ico),el('strong','',t),el('small','',desc));b.onclick=fn;modes.append(b)});app.append(modes);const p2=panel();p2.classList.add('spaced');add(p2,el('h3','','Palabras de este tema'));cards.forEach(c=>{const d=el('div','word-row');add(d,el('strong','',c.en),el('span','',c.es));p2.append(d)});app.append(p2)}
function startCards(cards,includeKnown=false){
 cards=cards.filter(c=>includeKnown||!isKnown(c));
 if(!cards.length){clear();nav('Vocabulario',vocabHome);title('¡Todo al día!','No tienes tarjetas pendientes por ahora.');app.append(btn('Ver mis palabras clasificadas',wordFolders));return}
 session={kind:'cards',queue:cards.map(c=>({card:c,ready:0})),done:0,total:cards.length,flipped:false};renderCard();
}
function intervalFor(id,rating){
 const x=cardState(id),v=x.interval||0;
 if(rating===3)return {ms:0,label:'Ya me la sé'};
 if(rating===0)return {ms:60000,label:'1 min · Otra vez'};
 let d=rating===1?Math.max(1,Math.round((v||1)*1.3)):rating===2?(v===0?1:v===1?3:Math.round(v*2.2)):(v===0?4:Math.max(4,Math.round(v*3)));
 return {ms:d*86400000,label:d===1?'1 día':d+' días'};
}
function renderCard(){
 clear();const s=session;if(!s||s.kind!=='cards')return;
 if(!s.queue.length){nav('Inicio',home);title('¡Sesión terminada!',`Has completado ${s.done} tarjetas. Tus palabras se han guardado según tu última valoración.`);app.append(btn('Ver mis palabras clasificadas',wordFolders),btn('Volver a inicio',home,'btn secondary'));return}
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
 controls.append(el('p','muted','Otra vez y Difícil se guardan en sus carpetas. Bien mantiene el repaso espaciado. Fácil la guarda en «Ya me las sé» y la retira del repaso habitual.'));
 const r=el('div','ratings');['Otra vez','Difícil','Bien','Fácil'].forEach((name,i)=>{
  const timing=intervalFor(c.id,i),button=btn(name,()=>{
   const result=rateCard(c.id,i);if(i===0)s.queue.push({card:c,ready:result.due});else s.done++;
   s.flipped=false;renderCard();
  },'');button.append(el('small','',timing.label));r.append(button)
 });controls.append(r);if(window.WordExamples)controls.append(window.WordExamples.render(c,{progress:state,save,collapsed:true}))}renderRatings();
}
// Algoritmo propio y sencillo de repetición espaciada; no es FSRS.
function rateCard(id,rating){const old=cardState(id),x={...old};x.reps++;if(rating===0){x.step=0;x.interval=0;x.lapses++;x.due=Date.now()+60*1000}else if(rating===1){x.step=Math.max(1,x.step);x.interval=Math.max(1,Math.round((x.interval||1)*1.3));x.due=Date.now()+x.interval*86400000}else if(rating===2){x.step++;x.interval=x.interval===0?1:x.interval===1?3:Math.round(x.interval*2.2);x.due=Date.now()+x.interval*86400000}else{x.step++;x.interval=x.interval===0?4:Math.max(4,Math.round(x.interval*3));x.due=Date.now()+x.interval*86400000}x.bucket=['again','hard','good','known'][rating];if(rating===3)x.due=0;state.cards[id]=x;save();return x}
function shuffle(a){const out=[...a];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
function startVocabQuiz(cards=DATA.vocab,back=vocabHome){const items=shuffle(cards).slice(0,10).map(c=>{const pool=DATA.vocab.filter(x=>x.id!==c.id&&x.es!==c.es);const wrong=shuffle(pool).slice(0,3).map(x=>x.es);return {id:c.id,q:`¿Qué significa “${c.en}”?`,options:shuffle([c.es,...wrong]),answer:c.es,why:c.example+' — '+c.es}});startQuiz(items,'Vocabulario',back)}
// Cada ejercicio de huecos usa la forma REAL que aparece en la frase.
// Para verbos flexionados y expresiones con «to», se define la solución contextual.
const CLOZE_FORMS={
 v02:'carried out',v03:'came across',v04:'look into',v05:'ran out of',
 v21:'figured out',v22:'brought up',v23:'copes',v24:'achieved',
 v25:'get along with',v26:'turned down',v27:'set up',v28:'take over',
 v29:'pointed out',v32:'came up with',v33:'deal with',v34:'prevent',
 v35:'requires',v36:'assume',v37:'enhance',v38:'struggles',v39:'overcame',
 v186:'enrol',v198:'take a break',v199:'pay attention',v201:'took part in',
 v202:'keep an eye on',v203:'in charge of',v204:'made the most of',v205:'get in touch'
};
function clozeItem(c){
 const form=CLOZE_FORMS[c.id]||c.en;
 const re=new RegExp(escapeReg(form),'i');
 if(!re.test(c.example))return null;
 return {id:c.id,q:c.example.replace(re,'_____'),answer:form,hint:c.es,
  why:`Forma en esta frase: ${form}. Expresión de referencia: ${c.en} = ${c.es}. ${c.example}`};
}
function startFill(cards=DATA.vocab,back=vocabHome){
 const items=shuffle(cards.map(clozeItem).filter(Boolean)).slice(0,10);
 session={kind:'fill',items,index:0,score:0,back};renderFill();
}
function startTranslation(cards,back){const items=shuffle(cards).slice(0,10).map(c=>({id:c.id,q:`Escribe en inglés: ${c.es}`,answer:c.en,hint:'Usa la expresión estudiada en este tema.',why:c.example}));session={kind:'fill',items,index:0,score:0,back,translation:true};renderFill()}
function startRecall(cards,back){
 const items=shuffle(cards).slice(0,10).map(c=>({id:c.id,q:`¿Cómo se dice en inglés: ${c.es}?`,answer:c.en,hint:`Ejemplo: ${(clozeItem(c)||{q:c.example}).q}`,why:`${c.en} — ${c.example}`}));
 session={kind:'fill',items,index:0,score:0,back,recall:true,missed:[],retry:false,firstScore:null,firstTotal:items.length};renderFill();
}
function recordPractice(id,ok){if(!id)return;const x=state.practice[id]||{correct:0,wrong:0};x[ok?'correct':'wrong']++;state.practice[id]=x;save()}
function escapeReg(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function normalize(s){return String(s).trim().toLocaleLowerCase('en').replace(/[.!?]+$/,'').replace(/\s+/g,' ').replace(/^[“”"']+|[“”"']+$/g,'')}
const SPELLING_VARIANTS={'to enrol':['to enroll','enroll'],'enrol':['enroll'],'to travel':['to travel']};
function acceptedAnswers(x){const answers=[x.answer,...(x.alternatives||[]),...(SPELLING_VARIANTS[normalize(x.answer)]||[])];const noTo=answers.flatMap(a=>/^to /i.test(a)?[a,a.replace(/^to /i,'')]:[a]);return [...new Set(noTo.map(normalize))]}
function isAccepted(value,x){return acceptedAnswers(x).includes(normalize(value))}
function renderFill(){
 clear();const s=session;nav('Categoría',s.back||vocabHome);
 if(s.index>=s.items.length){
  if(s.recall&&!s.retry&&s.missed.length){
   const missed=s.missed;clear();nav('Categoría',s.back||vocabHome);title('Segunda oportunidad',`Has acertado ${s.score} de ${s.items.length}. Ahora practicarás de nuevo las ${missed.length} palabras falladas.`);
   app.append(btn('Repetir las falladas',()=>{s.firstScore=s.score;s.items=shuffle(missed);s.index=0;s.retry=true;s.score=0;renderFill()}));return;
  }
  endQuiz(s.recall?'Recuerdo activo':s.translation?'Traducción':'Completar frases',s.score,s.items.length,s.back||vocabHome,s.retry?`Primera ronda: ${s.firstScore}/${s.firstTotal}. Segunda oportunidad: ${s.score}/${s.items.length}.`:null);return;
 }
 const x=s.items[s.index];title(s.recall?'Recuerdo activo':s.translation?'Traducción':'Completar frases',`Ejercicio ${s.index+1} de ${s.items.length}`);
 const p=panel();add(p,el('div','question',x.q),el('p','hint',s.recall?x.hint:s.translation?'Traduce la expresión al inglés.':'Pista · '+x.hint+' (palabra de esta categoría)'));
 const input=el('input','field');input.placeholder='Tu respuesta';input.autocomplete='off';const result=el('div');
 const check=btn('Comprobar',()=>{if(!input.value.trim())return;const ok=isAccepted(input.value,x);if(ok)s.score++;else if(s.recall&&!s.retry)s.missed.push(x);recordPractice(x.id,ok);
  result.replaceChildren(el('div',`answer ${ok?'':'bad'}`,`${ok?'✓ Correcto':'✗ Respuesta esperada: '+x.answer}. ${x.why}`),btn('Siguiente →',()=>{s.index++;renderFill()}));check.disabled=true;input.disabled=true});
 input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!check.disabled)check.click()});add(p,input,check,result);app.append(p);input.focus();
}
function startQuiz(items,name,back,grammarId){session={kind:'quiz',items,index:0,score:0,name,back,grammarId};renderQuiz()}
function renderQuiz(){clear();const s=session;nav(s.name==='Gramática'?'Gramática':'Vocabulario',s.back);if(s.index>=s.items.length){if(s.grammarId){const prior=state.grammar[s.grammarId]||{attempts:0,best:0};state.grammar[s.grammarId]={attempts:prior.attempts+1,best:Math.max(prior.best,s.score)};save()}endQuiz(s.name,s.score,s.items.length,s.back);return}const x=s.items[s.index];title(s.name,`Pregunta ${s.index+1} de ${s.items.length}`);const p=panel();p.append(el('div','question',x.q));const choices=el('div','choices'),feedback=el('div');x.options.forEach(option=>{const b=btn(option,()=>{const ok=option===x.answer;if(ok)s.score++;if(s.name==='Vocabulario')recordPractice(x.id,ok);Array.from(choices.children).forEach(y=>{y.disabled=true;if(y.textContent===x.answer)y.classList.add('correct');else if(y===b)y.classList.add('wrong')});feedback.replaceChildren(el('div',`answer ${ok?'':'bad'}`,`${ok?'✓ Correcto':'✗ Incorrecto. Respuesta: '+x.answer}. ${x.why}`),btn('Siguiente →',()=>{s.index++;renderQuiz()}))},'choice');choices.append(b)});add(p,choices,feedback);app.append(p)}
function endQuiz(name,score,total,back,details=null){clear();nav('Volver',back);title('Ejercicios completados',`${name} · ${score} de ${total} respuestas correctas`);const p=panel();add(p,el('h2','',`${total?Math.round(score/total*100):0}% de aciertos`),el('p','',details||'Puedes repetir los ejercicios para seguir practicando.'),btn('Volver',back));app.append(p)}
function grammarHome(){setNav('grammar');clear();nav();title('Gramática B2','Selecciona un tema para leer la explicación y practicar.');const topics=el('div','topics');DATA.grammar.forEach(g=>{const b=el('button','topic');const record=state.grammar[g.id];add(b,el('strong','',g.title),el('span','',record?`Mejor resultado: ${record.best}/${g.questions.length}`:`${g.questions.length} ejercicios`));b.onclick=()=>grammarLesson(g);topics.append(b)});app.append(topics)}
function grammarLesson(g){clear();nav('Gramática',grammarHome);title(g.title,'Explicación y ejemplos originales de nivel B2.');const p=panel();add(p,el('h3','','Regla'),el('p','lesson',g.intro));if(g.keyPoint)add(p,el('h3','','Cómo distinguirlo'),el('p','lesson',g.keyPoint));add(p,el('h3','','Ejemplos'));const ul=el('ul','lesson');g.examples.forEach(x=>ul.append(el('li','',x)));p.append(ul);if(g.translatedExamples){add(p,el('h3','','Ejemplos traducidos'));const translated=el('ul','lesson');g.translatedExamples.forEach(x=>translated.append(el('li','',x)));p.append(translated)}if(g.pitfall){add(p,el('h3','','Error frecuente'),el('p','hint',g.pitfall))}add(p,btn('Empezar ejercicios',()=>{const items=g.questions.map(([q,options,correct,why])=>({q,options,answer:options[correct],why}));startQuiz(items,'Gramática',()=>grammarLesson(g),g.id)}));app.append(p)}
function reviewHome(){setNav('vocab');clear();nav();app.append(btn('📂 Mis palabras clasificadas',wordFolders));title('Repaso','Primero recupera palabras ya estudiadas; después puedes aprender otras nuevas.');
 const now=Date.now(),pending=DATA.vocab.filter(c=>!isKnown(c)&&state.cards[c.id]&&cardState(c.id).due<=now).sort((a,b)=>cardState(a.id).due-cardState(b.id).due),newCards=DATA.vocab.filter(c=>!state.cards[c.id]),studied=DATA.vocab.length-newCards.length;
 const p=panel();add(p,el('h2','',`${pending.length} tarjetas pendientes de repaso`),el('p','',`${studied} palabras estudiadas · ${newCards.length} aún sin estudiar. Las tarjetas que marques «Otra vez» volverán durante la misma sesión.`));
 const r=el('div','row');const review=btn(`Repasar pendientes (${pending.length})`,()=>startCards(pending.slice(0,20)));review.disabled=!pending.length;
 const learn=btn(`Aprender 10 nuevas (${Math.min(10,newCards.length)})`,()=>startCards(newCards.slice(0,10)),'btn secondary');learn.disabled=!newCards.length;add(r,review,learn);p.append(r);app.append(p);
 const difficult=DATA.vocab.filter(c=>state.practice[c.id]&&state.practice[c.id].wrong>state.practice[c.id].correct).sort((a,b)=>(state.practice[b.id].wrong-state.practice[b.id].correct)-(state.practice[a.id].wrong-state.practice[a.id].correct));
 if(difficult.length){const weak=panel();weak.classList.add('spaced');add(weak,el('h3','','Palabras que más te cuestan'),el('p','',`${difficult.length} palabras con más errores que aciertos en los ejercicios de vocabulario.`),btn('Practicar palabras difíciles',()=>startRecall(difficult.slice(0,10),reviewHome)));app.append(weak)}
 const p2=panel();p2.classList.add('spaced');add(p2,el('h3','','Próximas tarjetas programadas'));
 const upcoming=DATA.vocab.filter(c=>!isKnown(c)&&state.cards[c.id]&&cardState(c.id).due>now).sort((a,b)=>cardState(a.id).due-cardState(b.id).due).slice(0,8);
 if(!upcoming.length)p2.append(el('p','muted','Todavía no hay repasos futuros programados.'));
 upcoming.forEach(c=>{const diff=cardState(c.id).due-Date.now(),time=diff<3600000?`${Math.ceil(diff/60000)} min`:diff<86400000?`${Math.ceil(diff/3600000)} h`:`${Math.ceil(diff/86400000)} día(s)`;p2.append(el('p','',`${c.en} · en ${time}`))});app.append(p2)
}


function attachCoach(cards,scope,onExit){
 if(!window.WordCoach)return;
 window.WordCoach.attach({root:app,cards,progress:state,save,onExit,scope:'all:'+scope,onArchive:c=>{state.cards[c.id]={...cardState(c.id),bucket:'known',due:0};save()}});
}

// La última valoración define la carpeta; los registros anteriores no se reclasifican por inferencia.
const WORD_FOLDERS=[['known','✅ Ya me las sé','Archivadas: solo aparecen si decides estudiarlas desde aquí.'],['hard','🟠 Difícil','Palabras que has marcado como difíciles. Puedes estudiarlas ahora, sin esperar.'],['again','🔴 Otra vez','Palabras que quieres volver a estudiar. Puedes repasarlas ahora.'],['good','🔵 Bien','Palabras que sigues repasando con repetición espaciada.']];
function wordFolders(){
 setNav('vocab');clear();nav('Repaso',reviewHome);title('Mis palabras clasificadas','Cada palabra se guarda en la carpeta de tu última valoración. Las respuestas anteriores a esta actualización mantienen su progreso, sin carpeta.');
 const grid=el('div','category-grid');
 WORD_FOLDERS.forEach(([key,label,desc])=>{const cards=DATA.vocab.filter(c=>cardState(c.id).bucket===key),b=el('button','category-card');add(b,el('strong','',label),el('small','',cards.length+' palabras'),el('span','',desc));b.onclick=()=>wordFolder(key);grid.append(b)});app.append(grid);attachCoach(DATA.vocab,'weak',wordFolders);
}
function wordFolder(key){
 const folder=WORD_FOLDERS.find(f=>f[0]===key);if(!folder)return;
 clear();nav('Mis palabras',wordFolders);const cards=DATA.vocab.filter(c=>cardState(c.id).bucket===key);
 title(folder[1],folder[2]);const study=btn('Estudiar esta carpeta ('+cards.length+')',()=>startCards(cards,true));study.disabled=!cards.length;app.append(study);if(key==='hard'||key==='again')attachCoach(cards,key,()=>wordFolder(key));
 const search=el('input','field');search.placeholder='Buscar en inglés o español';search.setAttribute('aria-label','Buscar palabras en esta carpeta');const list=panel();list.classList.add('folder-list');app.append(search,list);
 function draw(){list.replaceChildren();const q=search.value.trim().toLowerCase(),found=cards.filter(c=>(c.en+' '+c.es).toLowerCase().includes(q));if(!found.length)list.append(el('p','muted',cards.length?'Sin resultados.':'Todavía no hay palabras en esta carpeta.'));
 found.slice(0,50).forEach(c=>{const row=el('div','word-row'),actions=el('div','row');add(row,el('strong','',c.en),el('span','',c.es));actions.append(btn('Estudiar',()=>startCards([c],true),'btn secondary'));
 if(key==='known')actions.append(btn('Devolver al repaso',()=>{state.cards[c.id]={...cardState(c.id),bucket:'good',due:Date.now()};save();wordFolder(key)},'btn secondary'));
 row.append(actions);if((key==='hard'||key==='again')&&window.WordExamples)row.append(window.WordExamples.render(c,{progress:state,save,collapsed:true}));list.append(row)});if(found.length>50)list.append(el('p','muted','Se muestran 50 resultados. Usa la búsqueda para afinar.'))}search.oninput=draw;draw();
}

// Speaking365: estado independiente; nunca modifica las tarjetas ni el progreso anterior.
const SPEAKING_KEY='english365_speaking_v1';
function speakingProgress(){try{return JSON.parse(localStorage.getItem(SPEAKING_KEY))||{}}catch(e){return {}}}
function speakingSave(id){const x=speakingProgress();x[id]=(x[id]||0)+1;try{localStorage.setItem(SPEAKING_KEY,JSON.stringify(x))}catch(e){}}
function speakingHome(){setNav('dialogs');clear();nav();title('Diálogos cotidianos','Lee, elige una respuesta o escribe lo que dirías en una situación real.');const grid=el('div','category-grid');const done=speakingProgress();(window.ENGLISH_SPEAKING||[]).forEach(scene=>{const b=el('button','category-card');add(b,el('span','category-icon',scene.icon),el('span','category-title',scene.title),el('small','',scene.subtitle),el('small','',done[scene.id]?`Prácticas completadas: ${done[scene.id]}`:'Sin practicar'),el('span','category-arrow','›'));b.onclick=()=>speakingScene(scene);grid.append(b)});app.append(grid);const p=panel();p.classList.add('spaced');add(p,el('p','','Los diálogos y los ejercicios guiados funcionan sin conexión. La práctica escrita permite comparar tu respuesta con un modelo, sin corregir automáticamente todas las variantes posibles.'));app.append(p)}
function speakingScene(scene){clear();nav('Diálogos',speakingHome);title(scene.icon+' '+scene.title,scene.subtitle);const p=panel();add(p,el('h3','','Elige cómo practicar'),el('p','','Lee el diálogo, elige respuestas o formula tus propias frases.'));const r=el('div','row');add(r,btn('Leer el diálogo',()=>speakingRead(scene)),btn('🎯 Conversación guiada',()=>speakingPractice(scene,'guided')),btn('✍️ Responder libremente',()=>speakingPractice(scene,'free'),'btn secondary'));p.append(r);app.append(p)}
function speakingRead(scene){clear();nav('Situación',()=>speakingScene(scene));title(scene.title,'Diálogo modelo · lee cada intervención y muestra la traducción cuando quieras.');const p=panel(),r=el('div','row'),translation=btn('Mostrar traducciones',()=>{show=!show;translation.textContent=show?'Ocultar traducciones':'Mostrar traducciones';draw() },'btn secondary');let show=false;add(r,translation);p.append(r);const container=el('div','speaking-dialog');p.append(container);app.append(p);function draw(){container.replaceChildren();scene.turns.forEach(t=>{[[scene.role,t.prompt,t.promptEs],["Tú",t.reply,t.replyEs]].forEach(([who,en,es])=>{const d=el('div','speaking-bubble'+(who==='Tú'?' mine':''));add(d,el('small','',who),el('strong','',en));if(show)d.append(el('span','speaking-es',es));container.append(d)})})}draw();app.append(btn('Practicar este diálogo →',()=>speakingPractice(scene,'guided')))}
function speakingPractice(scene,mode){let index=0,score=0;const turns=scene.turns;function draw(){clear();nav('Situación',()=>speakingScene(scene));if(index>=turns.length){speakingSave(scene.id);title('¡Conversación terminada!',mode==='guided'?`Has elegido ${score} de ${turns.length} respuestas adecuadas.`:'Has completado las '+turns.length+' intervenciones.');const p=panel();add(p,el('p','','La práctica queda registrada en este navegador.'),btn('Repetir',()=>speakingPractice(scene,mode)),btn('Volver a diálogos',speakingHome,'btn secondary'));app.append(p);return}const t=turns[index];title(scene.title,`Intervención ${index+1} de ${turns.length}`);const p=panel();add(p,el('span','tag',scene.role),el('div','question',t.prompt));const translation=el('p','muted');p.append(btn('Ver traducción de la pregunta',()=>{translation.textContent=t.promptEs},'btn ghost'),translation);const feedback=el('div');if(mode==='guided'){const others=turns.filter((_,i)=>i!==index).map(x=>x.reply);const opts=[t.reply,...others.slice(0,2)].sort((a,b)=>((a.length*13+index*7)%19)-((b.length*13+index*7)%19));const choices=el('div','choices');opts.forEach(option=>{const b=btn(option,()=>{const ok=option===t.reply;if(ok)score++;Array.from(choices.children).forEach(x=>x.disabled=true);feedback.replaceChildren(el('div','answer'+(ok?'':' bad'),(ok?'✓ Respuesta adecuada.':'La respuesta adecuada sería: '+t.reply)+'\n'+t.replyEs),btn('Continuar →',()=>{index++;draw()}))},'choice');choices.append(b)});p.append(choices)}else{add(p,el('p','hint','Responde en inglés con tus palabras. Después compárala con la frase modelo.' ));const input=el('textarea','field');input.rows=3;input.placeholder='Escribe lo que dirías en inglés...';p.append(input);p.append(btn('Comparar con un ejemplo',()=>{if(!input.value.trim())return;feedback.replaceChildren(el('div','answer','Una posible respuesta: '+t.reply+'\n'+t.replyEs),el('p','muted','Tu respuesta puede ser igualmente válida aunque sea diferente. Aquí no se evalúa automáticamente la gramática.'),btn('Siguiente →',()=>{index++;draw()}))}))}p.append(feedback);app.append(p)}draw()}

function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`english365-progreso-${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
document.getElementById('importFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>2e6)throw Error('El archivo es demasiado grande.');const x=JSON.parse(await file.text());if(!x||x.version!==1||!x.cards||!x.grammar||typeof x.cards!=='object'||Array.isArray(x.cards)||typeof x.grammar!=='object'||Array.isArray(x.grammar))throw Error('Formato no compatible.');for(const v of Object.values(x.cards)){if(!v||typeof v.due!=='number'||!Number.isFinite(v.due)||typeof v.reps!=='number')throw Error('Datos de tarjetas no válidos.')}if(!confirm('Importar sustituirá el progreso guardado en este dispositivo. ¿Continuar?'))return;state={version:1,cards:x.cards,grammar:x.grammar,practice:(x.practice&&typeof x.practice==='object'&&!Array.isArray(x.practice))?x.practice:{},wordExamples:window.WordExamples?window.WordExamples.cleanCustom(x.wordExamples,new Set(DATA.vocab.map(c=>c.id))):{},learningSessions:(x.learningSessions&&typeof x.learningSessions==='object'&&!Array.isArray(x.learningSessions))?x.learningSessions:{},learningStats:(x.learningStats&&typeof x.learningStats==='object'&&!Array.isArray(x.learningStats))?x.learningStats:{},usageLab:window.UsageLab?window.UsageLab.sanitize(x.usageLab):undefined,updatedAt:new Date().toISOString()};save();home();alert('Progreso importado correctamente.')}catch(err){alert('No se pudo importar: '+err.message)}finally{e.target.value=''}});
document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>({home,vocab:vocabHome,lab:labHome,grammar:grammarHome,dialogs:speakingHome})[b.dataset.nav]());
window.addEventListener('hashchange',()=>{if(location.hash==='#home')home()});if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));home();
})();

