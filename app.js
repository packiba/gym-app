(()=>{
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ld=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const sv=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const uid=()=>Math.random().toString(36).slice(2,9);
const X=(name,muscles,smin,smax,min,max)=>({id:uid(),name,muscles,smin,smax,min,max});
const defPlan=()=>({
A:{title:'Тренировка А',ex:[
X('Подтягивания прямым средним или широким хватом','широчайшие, бицепс',2,3,8,12),
X('Отжимания на брусьях','грудные, трицепс',2,3,8,12),
X('Австралийские подтягивания на низком турнике','средняя часть спины, трапеции',2,3,10,15),
X('Болгарские выпады','квадрицепсы, ягодицы',2,2,10,12)]},
B:{title:'Тренировка Б',ex:[
X('Подтягивания обратным или узким нейтральным хватом','бицепс, широчайшие',2,3,8,12),
X('Отжимания от пола с ногами на возвышении','верх груди, трицепс',2,3,10,15),
X('Подъёмы согнутых ног к груди в висе (до технического отказа)','пресс, кор',2,3,8,15),
X('Приседания на одной ноге («пистолетики» с опорой)','ноги, стабилизаторы',2,2,8,12)]}});
let plan=ld('fb_plan',null)||defPlan(), logs=ld('fb_logs',[]), sess=ld('fb_sess',null), view='train', pick='', VERTEXT='';
const HINT='Верхняя граница достигнута! Пора усложнять упражнение или добавлять вес.';
const fmt=d=>new Date(d).toLocaleDateString('ru-RU',{day:'numeric',month:'short',year:'numeric'});
const card='rounded-2xl bg-panel border border-line p-5';
const btn='min-h-[48px] px-4 rounded-xl font-medium active:scale-[.98] transition';
const prim=btn+' bg-accent text-ink', sec=btn+' bg-raise border border-line';
const first=it=>it.sets[0]?.reps||0;
const seq=sets=>sets.map(s=>`${s.reps}${s.fail?'<span class="text-accent">✱</span>':''}`).join(' · ');
const paintVer=()=>{if(VERTEXT)document.querySelectorAll('[data-ver]').forEach(el=>el.textContent=VERTEXT)};
function prevOf(name){for(let i=logs.length-1;i>=0;i--){const it=logs[i].items.find(x=>x.name===name);if(it)return it}return null}

/* ---------- Таймер отдыха ---------- */
const rest={end:0,pref:150,iv:null};
function beep(){try{const a=new (window.AudioContext||window.webkitAudioContext)();[0,.3,.6].forEach(t=>{const o=a.createOscillator(),g=a.createGain();o.frequency.value=880;g.gain.value=.15;o.connect(g);g.connect(a.destination);o.start(a.currentTime+t);o.stop(a.currentTime+t+.18)})}catch{}navigator.vibrate?.([200,100,200])}
function startRest(s){stopRest();rest.pref=s;rest.end=Date.now()+s*1000;rest.iv=setInterval(()=>{if(left()<=0){stopRest();beep();flash()}else paintTimer()},500);paintTimer()}
function stopRest(){clearInterval(rest.iv);rest.iv=null;rest.end=0;paintTimer()}
const left=()=>Math.max(0,Math.ceil((rest.end-Date.now())/1000));
function flash(){const t=$('#timer');t.firstElementChild?.classList.add('ring-2','ring-good')}
function paintTimer(){const t=$('#timer');if(!sess){t.classList.add('hidden');return}t.classList.remove('hidden');
const run=!!rest.iv,s=left(),pct=run?100*s/rest.pref:0;
t.innerHTML=`<div class="mx-3 mb-2 md:mx-4 rounded-2xl bg-raise border border-line p-3 flex items-center gap-3 shadow-xl">
<div class="num text-3xl font-semibold w-20 ${run?'text-accent':'text-mute'}">${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}</div>
<div class="flex-1">${run?`<div class="h-2 rounded bg-line overflow-hidden"><div class="h-full bg-accent" style="width:${pct}%"></div></div>`:
`<div class="flex gap-2">${[120,150,180].map(v=>`<button data-act="rest" data-v="${v}" class="${sec} !min-h-[40px] !px-3 text-sm">${v/60|0}:${String(v%60).padStart(2,'0')}</button>`).join('')}</div>`}</div>
${run?`<button data-act="skip" class="${sec} !min-h-[40px]">Пропустить</button>`:'<span class="text-mute text-sm">Отдых</span>'}</div>`}

/* ---------- Экраны ---------- */
function trainView(){
if(!sess){const last=logs[logs.length-1];
return `<h1 class="text-2xl font-semibold mb-1">Тренировка</h1>
<p class="text-mute mb-6">${last?`Последняя: ${esc(last.title)}, ${fmt(last.date)}`:'Выберите день, чтобы начать'}</p>
<div class="grid gap-3 md:grid-cols-2">${['A','B'].map(d=>`<div class="${card}"><div class="text-lg font-medium mb-2">${esc(plan[d].title)}</div>
<ul class="text-mute text-sm mb-4 space-y-1">${plan[d].ex.map(e=>`<li>${esc(e.name)}</li>`).join('')}</ul>
<button data-act="start" data-v="${d}" class="${prim} w-full">Начать</button></div>`).join('')}</div>`}
return `<div class="flex items-center justify-between mb-4"><h1 class="text-2xl font-semibold">${esc(plan[sess.day].title)}</h1>
<button data-act="cancel" class="text-mute min-h-[48px] px-2">Отменить</button></div>
<div class="space-y-4">${sess.items.map((it,i)=>{const p=prevOf(it.name);
return `<section class="${card}"><div class="font-medium">${esc(it.name)}</div>
<div class="text-mute text-sm mb-1">${esc(it.muscles)}</div>
<div class="text-sm mb-3">${it.smin===it.smax?it.smax:it.smin+'–'+it.smax} подх. × <b>${it.min}–${it.max}</b> повт.${p?` <span class="text-mute">· в прошлый раз ${seq(p.sets)}</span>`:''}</div>
<div class="space-y-2">${it.sets.map((s,j)=>`<div class="flex items-center gap-3"><span class="text-mute w-6 num">${j+1}</span>
<input type="number" inputmode="numeric" enterkeyhint="done" min="0" placeholder="повт." data-s="${i}.${j}" value="${s.reps}" class="num">
<label class="flex items-center gap-2 text-sm text-mute shrink-0 min-h-[48px]"><input type="checkbox" data-f="${i}.${j}" ${s.fail?'checked':''}>отказ</label></div>`).join('')}</div>
<p id="h${i}" class="mt-3 rounded-lg bg-raise px-3 py-2.5 text-good text-sm ${first(it)>=it.max?'':'hidden'}">${HINT}</p></section>`}).join('')}</div>
<button data-act="finish" class="${prim} w-full mt-6">Завершить тренировку</button>`}

function diaryView(){
if(!logs.length)return `<h1 class="text-2xl font-semibold mb-2">Дневник</h1><p class="text-mute">Пока пусто. Завершённые тренировки появятся здесь.</p>`;
return `<h1 class="text-2xl font-semibold mb-4">Дневник</h1><div class="space-y-4">${[...logs].reverse().map(l=>`<section class="${card}">
<div class="flex justify-between items-start mb-3"><div><div class="font-medium">${esc(l.title)}</div><div class="text-mute text-sm">${fmt(l.date)}</div></div>
<button data-act="delLog" data-v="${l.id}" class="text-mute min-h-[48px] px-2 text-sm">Удалить</button></div>
<div class="divide-y divide-line">${l.items.map(it=>`<div class="py-3"><div class="text-sm">${esc(it.name)}</div>
<div class="num text-lg">${seq(it.sets)}</div>${first(it)>=it.max?`<div class="mt-2 rounded-lg bg-raise px-3 py-2.5 text-good text-sm">${HINT}</div>`:''}</div>`).join('')}</div></section>`).join('')}</div>`}

function chart(pts){if(pts.length<2)return'';const W=300,H=90,mx=Math.max(...pts),mn=Math.min(...pts),r=mx-mn||1;
const c=pts.map((v,i)=>`${(i/(pts.length-1)*W).toFixed(1)},${(H-8-(v-mn)/r*(H-16)).toFixed(1)}`).join(' ');
return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="w-full h-28"><polyline points="${c}" fill="none" stroke="#6fa8dc" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`}

function progressView(){
const names=[...new Set([...plan.A.ex,...plan.B.ex].map(e=>e.name).concat(logs.flatMap(l=>l.items.map(i=>i.name))))];
if(!pick||!names.includes(pick))pick=names[0]||'';
const rows=logs.map(l=>({d:l.date,it:l.items.find(i=>i.name===pick)})).filter(r=>r.it);
return `<h1 class="text-2xl font-semibold mb-4">Прогресс</h1>
<select data-pick class="mb-4">${names.map(n=>`<option ${n===pick?'selected':''}>${esc(n)}</option>`).join('')}</select>
${rows.length?`<div class="${card} mb-4"><div class="text-mute text-sm mb-1">Повторения в первом подходе</div>${chart(rows.map(r=>first(r.it)))}</div>
<div class="${card} !p-2 overflow-x-auto"><table class="w-full text-left num"><thead class="text-mute text-sm"><tr><th class="px-3 py-2 font-normal">Дата</th><th class="px-3 py-2 font-normal">Подходы</th><th class="px-3 py-2 font-normal text-right">1-й</th></tr></thead>
<tbody class="divide-y divide-line">${[...rows].reverse().map(r=>`<tr><td class="px-3 py-3">${fmt(r.d)}</td><td class="px-3 py-3">${seq(r.it.sets)}</td><td class="px-3 py-3 text-right ${first(r.it)>=r.it.max?'text-good':''}">${first(r.it)}</td></tr>`).join('')}</tbody></table></div>`
:'<p class="text-mute">По этому упражнению ещё нет записей.</p>'}`}

function planView(){
const f=(d,i,k,v,t='text')=>`<input data-p="${d}.${i}.${k}" type="${t}" ${t==='number'?'inputmode="numeric" min="1"':''} value="${esc(v)}" class="num">`;
return `<h1 class="text-2xl font-semibold mb-4">План</h1>
${['A','B'].map(d=>`<section class="${card} mb-4"><div class="font-medium mb-3">${esc(plan[d].title)}</div><div class="space-y-4">
${plan[d].ex.map((e,i)=>`<div class="space-y-2 pb-4 border-b border-line last:border-0 last:pb-0">
${f(d,i,'name',e.name)}${f(d,i,'muscles',e.muscles)}
<div class="grid grid-cols-4 gap-2 text-xs text-mute"><label>Подх. от${f(d,i,'smin',e.smin,'number')}</label><label>до${f(d,i,'smax',e.smax,'number')}</label><label>Повт. от${f(d,i,'min',e.min,'number')}</label><label>до${f(d,i,'max',e.max,'number')}</label></div>
<button data-act="delEx" data-v="${d}.${i}" class="text-mute text-sm min-h-[40px]">Удалить упражнение</button></div>`).join('')}</div>
<button data-act="addEx" data-v="${d}" class="${sec} w-full mt-4">Добавить упражнение</button></section>`).join('')}
<div class="flex gap-3"><button data-act="export" class="${sec} flex-1">Экспорт данных</button><button data-act="reset" class="${sec} flex-1">Сбросить план</button></div>
<p data-ver class="text-center text-[10px] text-mute mt-6"></p>`}

const TABS=[['train','Тренировка'],['diary','Дневник'],['progress','Прогресс'],['plan','План']];
function render(){
$('#nav').innerHTML=`<div class="hidden md:block px-4 pb-6 text-lg font-semibold">Fullbody</div>`+TABS.map(([k,l])=>`<button data-act="nav" data-v="${k}" class="flex-1 md:flex-none md:text-left md:px-4 md:h-12 text-sm md:text-base ${view===k?'text-accent border-t-2 md:border-t-0 md:border-l-2 border-accent bg-raise':'text-mute border-t-2 md:border-l-2 border-transparent'}">${l}</button>`).join('');
$('#app').innerHTML={train:trainView,diary:diaryView,progress:progressView,plan:planView}[view]();paintTimer();paintVer()}

/* ---------- События ---------- */
document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(!t)return;const a=t.dataset.act,v=t.dataset.v;
if(a==='nav'){view=v;render();scrollTo(0,0)}
else if(a==='start'){sess={day:v,title:plan[v].title,date:new Date().toISOString(),items:plan[v].ex.map(x=>({name:x.name,muscles:x.muscles,smin:x.smin,smax:x.smax,min:x.min,max:x.max,sets:Array.from({length:x.smax},()=>({reps:'',fail:false}))}))};sv('fb_sess',sess);render()}
else if(a==='cancel'){if(confirm('Отменить тренировку? Введённые данные пропадут.')){sess=null;localStorage.removeItem('fb_sess');stopRest();render()}}
else if(a==='finish'){const items=sess.items.map(it=>({...it,sets:it.sets.filter(s=>s.reps>0)})).filter(it=>it.sets.length);
if(!items.length&&!confirm('Нет ни одного подхода. Завершить без записи?'))return;
if(items.length){logs.push({id:uid(),day:sess.day,title:sess.title,date:sess.date,items});sv('fb_logs',logs)}
sess=null;localStorage.removeItem('fb_sess');stopRest();view='diary';render()}
else if(a==='quit'){window.close();setTimeout(()=>alert('Закрыть приложение можно системным жестом: свайп вверх от нижнего края экрана или кнопка «Домой».'),400)}
else if(a==='rest')startRest(+v);
else if(a==='skip')stopRest();
else if(a==='delLog'){if(confirm('Удалить запись?')){logs=logs.filter(l=>l.id!==v);sv('fb_logs',logs);render()}}
else if(a==='addEx'){plan[v].ex.push(X('Новое упражнение','',2,3,8,12));sv('fb_plan',plan);render()}
else if(a==='delEx'){const[d,i]=v.split('.');if(confirm('Удалить упражнение из плана?')){plan[d].ex.splice(+i,1);sv('fb_plan',plan);render()}}
else if(a==='reset'){if(confirm('Вернуть стартовую программу? Ваши правки плана будут потеряны, история останется.')){plan=defPlan();sv('fb_plan',plan);render()}}
else if(a==='export'){const b=new Blob([JSON.stringify({plan,logs},null,1)],{type:'application/json'}),u=URL.createObjectURL(b),l=document.createElement('a');l.href=u;l.download='fullbody-backup.json';l.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}});

document.addEventListener('change',e=>{const t=e.target;
if(t.dataset.s){const[i,j]=t.dataset.s.split('.').map(Number),s=sess.items[i].sets[j];s.reps=Math.max(0,parseInt(t.value)||0)||'';sv('fb_sess',sess);
$('#h'+i).classList.toggle('hidden',!(first(sess.items[i])>=sess.items[i].max));if(s.reps)startRest(rest.pref)}
else if(t.dataset.f){const[i,j]=t.dataset.f.split('.').map(Number);sess.items[i].sets[j].fail=t.checked;sv('fb_sess',sess)}
else if(t.dataset.p){const[d,i,k]=t.dataset.p.split('.');plan[d].ex[+i][k]=t.type==='number'?Math.max(1,parseInt(t.value)||1):t.value;sv('fb_plan',plan)}
else if('pick' in t.dataset){pick=t.value;render()}});

if(matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches||navigator.standalone)document.documentElement.classList.add('app-mode');

/* Кнопка «Готово» над клавиатурой: убирает цифровую клавиатуру */
const dn=$('#done'),vv=window.visualViewport,isSet=el=>el&&el.dataset&&el.dataset.s!==undefined;
const placeDone=()=>{dn.style.bottom=(vv?Math.max(0,innerHeight-vv.height-vv.offsetTop):0)+8+'px'};
document.addEventListener('focusin',e=>{if(isSet(e.target)){dn.classList.remove('hidden');placeDone()}});
document.addEventListener('focusout',()=>setTimeout(()=>{if(!isSet(document.activeElement))dn.classList.add('hidden')},60));
vv?.addEventListener('resize',placeDone);vv?.addEventListener('scroll',placeDone);
dn.addEventListener('pointerdown',e=>{e.preventDefault();document.activeElement?.blur()});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&isSet(e.target)){e.preventDefault();e.target.blur()}});

render();
if('serviceWorker' in navigator){
  const had=!!navigator.serviceWorker.controller;let rl=false;
  navigator.serviceWorker.addEventListener('message',e=>{const m=e.data;if(m?.type==='VERSION'){VERTEXT=`${m.version} · ${m.date}`;paintVer()}});
  const ask=n=>n?.postMessage({type:'GET_VERSION'});
  if(had)ask(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had&&!rl&&!sess){rl=true;location.reload()}else ask(navigator.serviceWorker.controller)});
  addEventListener('load',()=>navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>{r.update();document.addEventListener('visibilitychange',()=>{if(!document.hidden)r.update()})}));
}
})();
