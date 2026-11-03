(()=>{'use strict';
const ALL=(window.ENGLISH_CONTENT?.vocab||[]).filter(c=>c.id.startsWith('pdfb2_'));
const KEY='english365_progress_v1';
const root=document.getElementById('pdf-app');
let progress={version:1,cards:{},grammar:{},practice:{}};
try{const p=JSON.parse(localStorage.getItem(KEY));if(p?.version===1&&p.cards&&p.grammar)progress=p;}catch(e){}
let queue=[], current=null, lastView='home';
const E=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
function save(){progress.updatedAt=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(progress))}
function cardStatus(c){return progress.cards[c.id]||{step:0,interval:0,due:0,reps:0,lapses:0}}
function known(c){return cardStatus(c).bucket==='known'}
function due(c){return !known(c)&&(!progress.cards[c.id]||cardStatus(c).due<=Date.now())}
function shuffled(a){return [...a].sort(()=>Math.random()-.5)}
function button(text,fn,secondary=false){const b=E('button','btn'+(secondary?' secondary':''),text);b.onclick=fn;return b}
function clear(){root.replaceChildren()}
function top(h,desc){root.append(E('h1','',h),E('p','lead',desc))}
function home(){lastView='home';clear();top('Mi vocabulario B2',`${ALL.length} palabras del documento · tarjetas con repetición espaciada`);
 const fresh=ALL.filter(c=>!progress.cards[c.id]);const pending=ALL.filter(due);const studied=ALL.length-fresh.length;
 const p=E('section','panel');p.append(E('h2','','Tu progreso'),E('p','',`${studied} estudiadas · ${fresh.length} nuevas · ${pending.length} nuevas o pendientes`));
 const actions=E('div','row');actions.append(button('Aprender 10 nuevas',()=>start((fresh.length?fresh:pending).slice(0,10))),button('Repasar 10 pendientes',()=>start(pending.slice(0,10)),true),button('20 aleatorias',()=>start(shuffled(ALL.filter(c=>!known(c))).slice(0,20)),true));actions.append(button('📂 Mis palabras clasificadas',folders,true));p.append(actions);root.append(p);
 const section=E('section','panel spaced');section.append(E('h3','','Buscar vocabulario'));const input=E('input','field');input.placeholder='Busca en inglés o español';const results=E('div');section.append(input,results);root.append(section);
 function draw(){const q=input.value.trim().toLowerCase();const found=(q?ALL.filter(c=>`${c.en} ${c.es}`.toLowerCase().includes(q)):ALL).slice(0,30);results.replaceChildren();for(const c of found){const row=E('div','word-row');row.append(E('strong','',c.en),E('span','',c.es));results.append(row)}if(!found.length)results.append(E('p','muted','Sin resultados'))}input.oninput=draw;draw();
}
function start(cards,includeKnown=false){cards=cards.filter(c=>includeKnown||!known(c));if(!cards.length){clear();top('Todo al día','No hay tarjetas pendientes en esta selección.');root.append(button('Volver',home));return}queue=cards.map(c=>({c,ready:0}));next()}
function rate(c,n){const x={...cardStatus(c)};x.reps++;let d=x.interval||0;if(n===0){x.step=0;x.interval=0;x.lapses++;x.due=Date.now()+60000}else{d=n===1?Math.max(1,Math.round((d||1)*1.3)):n===2?(d===0?1:d===1?3:Math.round(d*2.2)):(d===0?4:Math.max(4,Math.round(d*3)));x.step++;x.interval=d;x.due=Date.now()+d*86400000}x.bucket=['again','hard','good','known'][n];if(n===3)x.due=0;progress.cards[c.id]=x;save();return x}
function next(){clear();const i=queue.findIndex(x=>x.ready<=Date.now());if(i<0){if(!queue.length){top('Sesión terminada','Tus palabras se han guardado según tu última valoración.');root.append(button('Ver mis palabras clasificadas',folders),button('Volver a mi vocabulario',home,true));return}top('Repasa las difíciles','Puedes volver a estudiar cuando toque su siguiente repaso.');root.append(button('Terminar por ahora',home));return}
 const e=queue.splice(i,1)[0],c=e.c;top('Flashcards · PDF B2',`${queue.length+1} tarjetas por completar en esta sesión`);root.append(button('← Salir',home,true));const p=E('section','panel spaced');p.append(E('span','tag',`Página ${c.example.match(/\d+/)?.[0]||'—'} del PDF`));const flip=E('button','flip');let flipped=false;const controls=E('div');
 function draw(){flip.replaceChildren(E('small','',flipped?'TRADUCCIÓN':'INGLÉS'),E('strong','',flipped?c.es:c.en),E('small','',flipped?'Fácil: archivar · Difícil / Otra vez: guardar para repasar':'Toca para ver la respuesta'));controls.replaceChildren();if(flipped){const r=E('div','ratings');['Otra vez','Difícil','Bien','Fácil'].forEach((t,n)=>{r.append(button(t,()=>{const outcome=rate(c,n);if(n===0)queue.push({c,ready:outcome.due});next()},true))});controls.append(r)}else controls.append(E('p','muted','Intenta recordarla antes de girar la tarjeta.'))}
 flip.onclick=()=>{flipped=!flipped;draw()};draw();p.append(flip,controls);root.append(p);
}
const FOLDERS=[['known','✅ Ya me las sé','Archivadas: no aparecerán en el repaso habitual ni en las tarjetas aleatorias.'],['hard','🟠 Difícil','Estudia cuando quieras las palabras que has marcado como difíciles.'],['again','🔴 Otra vez','Vuelve a estudiar estas palabras sin esperar al siguiente repaso.'],['good','🔵 Bien','Palabras que siguen en el repaso espaciado.']];
function folders(){
 clear();top('Mis palabras clasificadas · PDF B2','Cada palabra se guarda según tu última valoración. Las respuestas anteriores a esta actualización conservan su progreso, sin carpeta.');root.append(button('← Mi vocabulario',home,true));
 const grid=E('div','category-grid');FOLDERS.forEach(([key,label,desc])=>{const b=E('button','category-card');b.append(E('strong','',label),E('small','',ALL.filter(c=>cardStatus(c).bucket===key).length+' palabras'),E('span','',desc));b.onclick=()=>folder(key);grid.append(b)});root.append(grid);
}
function folder(key){
 const entry=FOLDERS.find(f=>f[0]===key);if(!entry)return;
 clear();top(entry[1],entry[2]);root.append(button('← Mis palabras',folders,true));
 const cards=ALL.filter(c=>cardStatus(c).bucket===key),study=button('Estudiar esta carpeta ('+cards.length+')',()=>start(cards,true));study.disabled=!cards.length;root.append(study);
 const input=E('input','field');input.placeholder='Buscar en inglés o español';input.setAttribute('aria-label','Buscar palabras en esta carpeta');const list=E('section','panel folder-list');root.append(input,list);
 function draw(){list.replaceChildren();const q=input.value.trim().toLowerCase(),found=cards.filter(c=>(c.en+' '+c.es).toLowerCase().includes(q));if(!found.length)list.append(E('p','muted',cards.length?'Sin resultados.':'Todavía no hay palabras en esta carpeta.'));
 found.forEach(c=>{const row=E('div','word-row'),actions=E('div','row');row.append(E('strong','',c.en),E('span','',c.es));actions.append(button('Estudiar',()=>start([c],true),true));if(key==='known')actions.append(button('Devolver al repaso',()=>{progress.cards[c.id]={...cardStatus(c),bucket:'good',due:Date.now()};save();folder(key)},true));row.append(actions);list.append(row)})}input.oninput=draw;draw();
}

home();
})();

