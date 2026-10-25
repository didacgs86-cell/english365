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
function due(c){return !progress.cards[c.id]||cardStatus(c).due<=Date.now()}
function shuffled(a){return [...a].sort(()=>Math.random()-.5)}
function button(text,fn,secondary=false){const b=E('button','btn'+(secondary?' secondary':''),text);b.onclick=fn;return b}
function clear(){root.replaceChildren()}
function top(h,desc){root.append(E('h1','',h),E('p','lead',desc))}
function home(){lastView='home';clear();top('Mi vocabulario B2',`${ALL.length} palabras del documento · tarjetas con repetición espaciada`);
 const fresh=ALL.filter(c=>!progress.cards[c.id]);const pending=ALL.filter(due);const studied=ALL.length-fresh.length;
 const p=E('section','panel');p.append(E('h2','','Tu progreso'),E('p','',`${studied} estudiadas · ${fresh.length} nuevas · ${pending.length} nuevas o pendientes`));
 const actions=E('div','row');actions.append(button('Aprender 10 nuevas',()=>start((fresh.length?fresh:pending).slice(0,10))),button('Repasar 10 pendientes',()=>start(pending.slice(0,10)),true),button('20 aleatorias',()=>start(shuffled(ALL).slice(0,20)),true));p.append(actions);root.append(p);
 const section=E('section','panel spaced');section.append(E('h3','','Buscar vocabulario'));const input=E('input','field');input.placeholder='Busca en inglés o español';const results=E('div');section.append(input,results);root.append(section);
 function draw(){const q=input.value.trim().toLowerCase();const found=(q?ALL.filter(c=>`${c.en} ${c.es}`.toLowerCase().includes(q)):ALL).slice(0,30);results.replaceChildren();for(const c of found){const row=E('div','word-row');row.append(E('strong','',c.en),E('span','',c.es));results.append(row)}if(!found.length)results.append(E('p','muted','Sin resultados'))}input.oninput=draw;draw();
}
function start(cards){if(!cards.length){clear();top('Todo al día','No hay tarjetas pendientes en esta selección.');root.append(button('Volver',home));return}queue=cards.map(c=>({c,ready:0}));next()}
function rate(c,n){const x={...cardStatus(c)};x.reps++;let d=x.interval||0;if(n===0){x.step=0;x.interval=0;x.lapses++;x.due=Date.now()+60000}else{d=n===1?Math.max(1,Math.round((d||1)*1.3)):n===2?(d===0?1:d===1?3:Math.round(d*2.2)):(d===0?4:Math.max(4,Math.round(d*3)));x.step++;x.interval=d;x.due=Date.now()+d*86400000}progress.cards[c.id]=x;save();return x}
function next(){clear();const i=queue.findIndex(x=>x.ready<=Date.now());if(i<0){if(!queue.length){top('Sesión terminada','Tus resultados están guardados para el siguiente repaso.');root.append(button('Volver a mi vocabulario',home));return}top('Repasa las difíciles','Puedes volver a estudiar cuando toque su siguiente repaso.');root.append(button('Terminar por ahora',home));return}
 const e=queue.splice(i,1)[0],c=e.c;top('Flashcards · PDF B2',`${queue.length+1} tarjetas por completar en esta sesión`);root.append(button('← Salir',home,true));const p=E('section','panel spaced');p.append(E('span','tag',`Página ${c.example.match(/\d+/)?.[0]||'—'} del PDF`));const flip=E('button','flip');let flipped=false;const controls=E('div');
 function draw(){flip.replaceChildren(E('small','',flipped?'TRADUCCIÓN':'INGLÉS'),E('strong','',flipped?c.es:c.en),E('small','',flipped?'Valora cómo la has recordado':'Toca para ver la respuesta'));controls.replaceChildren();if(flipped){const r=E('div','ratings');['Otra vez','Difícil','Bien','Fácil'].forEach((t,n)=>{r.append(button(t,()=>{const outcome=rate(c,n);if(n===0)queue.push({c,ready:outcome.due});next()},true))});controls.append(r)}else controls.append(E('p','muted','Intenta recordarla antes de girar la tarjeta.'))}
 flip.onclick=()=>{flipped=!flipped;draw()};draw();p.append(flip,controls);root.append(p);
}
home();
})();
