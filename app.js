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
const APP_VER='1.12',APP_DATE='26.10.2026';
let plan=ld('fb_plan',null)||defPlan(), logs=ld('fb_logs',[]), sess=ld('fb_sess',null), view='train', pick='', VERTEXT=`${APP_VER} · ${APP_DATE}`;
const HINT='Верхняя граница достигнута! Пора усложнять упражнение или добавлять вес.';
const fmt=d=>new Date(d).toLocaleDateString('ru-RU',{day:'numeric',month:'short',year:'numeric'});
const card='rounded-2xl bg-panel border border-line p-5';
const btn='min-h-[48px] px-4 rounded-xl font-medium active:scale-[.98] transition';
const prim=btn+' bg-accent text-ink', sec=btn+' bg-raise border border-line';
const first=it=>it.sets[0]?.reps||0;
const seq=sets=>sets.map(s=>`${s.reps}${s.fail?'<span class="text-accent">✱</span>':''}`).join(' · ');
const paintVer=()=>{if(VERTEXT)document.querySelectorAll('[data-ver]').forEach(el=>el.textContent=VERTEXT)};
function prevOf(name){for(let i=logs.length-1;i>=0;i--){const it=logs[i].items.find(x=>x.name===name);if(it)return it}return null}
const repHint=(it,j)=>{const p=prevOf(it.name);const b=p?((p.sets[j]||p.sets[p.sets.length-1]||{}).reps||0):0;return b?Math.min(it.max,b+1):it.min};
function nextDay(){const last=logs[logs.length-1];return !last?'A':(last.day==='A'?'B':'A')}
function beginSession(){const d=nextDay();sess={day:d,title:plan[d].title,date:new Date().toISOString(),items:plan[d].ex.map(x=>({name:x.name,muscles:x.muscles,smin:x.smin,smax:x.smax,min:x.min,max:x.max,sets:Array.from({length:x.smax},()=>({reps:'',fail:false}))}))};sv('fb_sess',sess)}

/* ---------- Таймер отдыха ---------- */
const rest={end:0,pref:(p=>[120,150,180].includes(p)?p:150)(ld('fb_rest',150)),iv:null};
function beep(){try{const a=new (window.AudioContext||window.webkitAudioContext)();[0,.3,.6].forEach(t=>{const o=a.createOscillator(),g=a.createGain();o.frequency.value=880;g.gain.value=.15;o.connect(g);g.connect(a.destination);o.start(a.currentTime+t);o.stop(a.currentTime+t+.18)})}catch{}navigator.vibrate?.([200,100,200])}
function startRest(s){stopRest();rest.pref=s;sv('fb_rest',s);rest.end=Date.now()+s*1000;rest.iv=setInterval(()=>{if(left()<=0){stopRest();beep()}else paintTimer()},500);paintTimer()}
function stopRest(){clearInterval(rest.iv);rest.iv=null;rest.end=0;paintTimer()}
const left=()=>Math.max(0,Math.ceil((rest.end-Date.now())/1000));
const mm=s=>`${(s/60)|0}:${String(s%60).padStart(2,'0')}`;
function paintTimer(){const t=$('#timer');if(!sess||view!=='train'){t.classList.add('hidden');return}t.classList.remove('hidden');
const run=!!rest.iv,s=left(),pct=run?100*s/rest.pref:0;
t.innerHTML=`<div class="mx-auto w-full max-w-[36rem] min-h-[5.25rem] px-4 py-3 flex items-center justify-center text-center">
${run?`<div class="flex w-full items-center gap-3"><div class="num text-3xl font-semibold text-accent w-20 shrink-0 text-center">${mm(s)}</div><div class="flex-1"><div class="h-2 rounded bg-line overflow-hidden"><div class="h-full bg-accent" style="width:${pct}%"></div></div></div><button data-act="skip" class="${sec} !min-h-[40px] shrink-0">Пропустить</button></div>`:
`<div class="w-full"><div class="text-sm text-mute mb-2">Отдых между подходами</div>
<div class="flex gap-2">${[120,150,180].map(v=>`<button data-act="rest" data-v="${v}" class="${v===rest.pref?prim:sec} !min-h-[40px] flex-1 text-sm">${mm(v)}</button>`).join('')}</div></div>`}
</div>`}

/* ---------- Экраны ---------- */
const head=(t,r='',mb='mb-4')=>`<div class="grid grid-cols-[1fr_auto_1fr] items-center ${mb}"><span></span><h1 class="text-2xl font-semibold">${t}</h1><div class="justify-self-end">${r}</div></div>`;
function trainView(){
return `${head(esc(plan[sess.day].title),'<button data-act="cancel" class="text-mute text-sm min-h-[48px] px-1">Сбросить</button>','mb-1')}
<p class="text-mute text-sm mb-4">Удерживайте кружок — засчитается подсказка. Вправо или влево — изменить число (чем дальше от точки касания, тем быстрее). Вниз — «до отказа», вверх — снять отказ.</p>
<div class="space-y-4">${sess.items.map((it,i)=>{const p=prevOf(it.name);
return `<section class="${card} !p-4"><div class="font-medium">${esc(it.name)}</div>
<div class="text-mute text-sm mb-1">${esc(it.muscles)}</div>
<div class="text-sm mb-4">${it.smin===it.smax?it.smax:it.smin+'–'+it.smax} подх. × <b>${it.min}–${it.max}</b> повт.${p?` <span class="text-mute">· в прошлый раз ${seq(p.sets)}</span>`:''}</div>
<div class="grid gap-2 items-start" style="grid-template-columns:repeat(${Math.min(it.sets.length,4)},minmax(0,1fr))">${it.sets.map((s,j)=>`<div class="flex flex-col items-center">
<div class="text-xs text-mute mb-2">Подход ${j+1}</div>
<div class="rep ${s.reps?'done':''} ${s.fail?'fail':''}" data-rep="${i}.${j}" role="slider" tabindex="0" aria-label="Повторения, подход ${j+1}" aria-valuemin="0" aria-valuenow="${s.reps||0}"><span class="rep-fill"></span><span class="rep-val num">${s.reps||repHint(it,j)}</span></div>
<div class="failtxt ${s.fail?'on':''}" data-fl="${i}.${j}">${s.fail?'до отказа':'подход без отказа'}</div></div>`).join('')}</div>
<p id="h${i}" class="mt-3 rounded-lg bg-raise px-3 py-2.5 text-good text-sm ${first(it)>=it.max?'':'hidden'}">${HINT}</p></section>`}).join('')}</div>
<button data-act="finish" class="${prim} w-full mt-6">Завершить тренировку</button>`}

function diaryView(){
if(!logs.length)return `<h1 class="text-2xl font-semibold mb-2">Дневник</h1><p class="text-mute">Пока пусто. Завершённые тренировки появятся здесь.</p>`;
return `<h1 class="text-2xl font-semibold mb-4">Дневник</h1><div class="space-y-4">${[...logs].reverse().map(l=>`<section class="${card}">
<div class="grid grid-cols-[1fr_auto_1fr] items-start mb-3"><span></span><div><div class="font-medium">${esc(l.title)}</div><div class="text-mute text-sm">${fmt(l.date)}</div></div>
<button data-act="delLog" data-v="${l.id}" class="text-mute min-h-[48px] px-1 text-sm justify-self-end">Удалить</button></div>
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
<div class="${card} !p-2 overflow-x-auto"><table class="w-full text-center num"><thead class="text-mute text-sm"><tr><th class="px-3 py-2 font-normal">Дата</th><th class="px-3 py-2 font-normal">Подходы</th><th class="px-3 py-2 font-normal">1-й</th></tr></thead>
<tbody class="divide-y divide-line">${[...rows].reverse().map(r=>`<tr><td class="px-3 py-3">${fmt(r.d)}</td><td class="px-3 py-3">${seq(r.it.sets)}</td><td class="px-3 py-3 ${first(r.it)>=r.it.max?'text-good':''}">${first(r.it)}</td></tr>`).join('')}</tbody></table></div>`
:'<p class="text-mute">По этому упражнению ещё нет записей.</p>'}`}

function planView(){
const f=(d,i,k,v)=>`<input data-p="${d}.${i}.${k}" type="text" value="${esc(v)}">`;
const nc=(d,i,k,v)=>`<div class="numcell" data-num="${d}.${i}.${k}" role="slider" tabindex="0" aria-valuenow="${v}"><span class="nv num">${v}</span></div>`;
const rng=(t,d,i,a,b,e)=>`<div><div class="text-sm text-mute mb-2">${t}</div><div class="flex items-center justify-center gap-3">${nc(d,i,a,e[a])}<span class="text-mute">—</span>${nc(d,i,b,e[b])}</div></div>`;
return `<h1 class="text-2xl font-semibold mb-4">План</h1>
${['A','B'].map(d=>`<section class="${card} mb-4"><div class="font-medium mb-3">${esc(plan[d].title)}</div><div class="space-y-4">
${plan[d].ex.map((e,i)=>`<div class="space-y-2 pb-4 border-b border-line last:border-0 last:pb-0">
${f(d,i,'name',e.name)}${f(d,i,'muscles',e.muscles)}
<div class="space-y-4 py-2">${rng('Подходы',d,i,'smin','smax',e)}${rng('Повторения',d,i,'min','max',e)}</div>
<button data-act="delEx" data-v="${d}.${i}" class="text-mute text-sm min-h-[40px]">Удалить упражнение</button></div>`).join('')}</div>
<button data-act="addEx" data-v="${d}" class="${sec} w-full mt-4">Добавить упражнение</button></section>`).join('')}
<div class="flex gap-3"><button data-act="export" class="${sec} flex-1">Экспорт данных</button><button data-act="reset" class="${sec} flex-1">Сбросить план</button></div>
<p data-ver class="text-center text-[10px] text-mute mt-6"></p>`}

const TABS=[['train','Тренировка'],['diary','Дневник'],['progress','Прогресс'],['plan','План']];
function render(){
$('#nav').innerHTML=`<div class="hidden md:block px-4 pb-6 text-lg font-semibold">Fullbody <span data-ver class="text-xs font-normal text-mute align-middle"></span></div>`+TABS.map(([k,l])=>`<button data-act="nav" data-v="${k}" class="flex-1 md:flex-none md:text-left md:px-4 md:h-12 text-sm md:text-base ${view===k?'text-accent border-t-2 md:border-t-0 md:border-l-2 border-accent bg-raise':'text-mute border-t-2 md:border-l-2 border-transparent'}">${l}</button>`).join('');
if(view==='train'&&!sess)beginSession();
$('#app').innerHTML={train:trainView,diary:diaryView,progress:progressView,plan:planView}[view]();paintTimer();paintVer()}

/* ---------- События ---------- */
let lpT=null,lpF=false;
const lpStop=()=>{clearTimeout(lpT);lpT=null};
document.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-act="rest"]');if(!b)return lpStop();lpF=false;lpT=setTimeout(()=>{lpF=true;startRest(+b.dataset.v)},500)});
['pointerup','pointercancel'].forEach(ev=>document.addEventListener(ev,lpStop));
document.addEventListener('contextmenu',e=>{if(e.target.closest('[data-act="rest"],.rep,.numcell'))e.preventDefault()});
document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(!t)return;const a=t.dataset.act,v=t.dataset.v;
if(a==='nav'){view=v;render();$('#app').scrollTop=0}
else if(a==='cancel'){if(confirm('Сбросить тренировку? Введённые данные пропадут.')){sess=null;localStorage.removeItem('fb_sess');stopRest();render()}}
else if(a==='finish'){const items=sess.items.map(it=>({...it,sets:it.sets.filter(s=>s.reps>0)})).filter(it=>it.sets.length);
if(!items.length&&!confirm('Нет ни одного подхода. Завершить без записи?'))return;
if(items.length){logs.push({id:uid(),day:sess.day,title:sess.title,date:sess.date,items});sv('fb_logs',logs)}
sess=null;localStorage.removeItem('fb_sess');stopRest();view='diary';render();$('#app').scrollTop=0}
else if(a==='quit'){window.close();setTimeout(()=>alert('Закрыть приложение можно системным жестом: свайп вверх от нижнего края экрана или кнопка «Домой».'),400)}
else if(a==='rest'){if(lpF){lpF=false;return}rest.pref=+v;sv('fb_rest',+v);paintTimer()}
else if(a==='skip')stopRest();
else if(a==='delLog'){if(confirm('Удалить запись?')){logs=logs.filter(l=>l.id!==v);sv('fb_logs',logs);render()}}
else if(a==='addEx'){plan[v].ex.push(X('Новое упражнение','',2,3,8,12));sv('fb_plan',plan);render()}
else if(a==='delEx'){const[d,i]=v.split('.');if(confirm('Удалить упражнение из плана?')){plan[d].ex.splice(+i,1);sv('fb_plan',plan);render()}}
else if(a==='reset'){if(confirm('Вернуть стартовую программу? Ваши правки плана будут потеряны, история останется.')){plan=defPlan();sv('fb_plan',plan);render()}}
else if(a==='export'){const b=new Blob([JSON.stringify({plan,logs},null,1)],{type:'application/json'}),u=URL.createObjectURL(b),l=document.createElement('a');l.href=u;l.download='fullbody-backup.json';l.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}});

document.addEventListener('change',e=>{const t=e.target;
if(t.dataset.p){const[d,i,k]=t.dataset.p.split('.');plan[d].ex[+i][k]=t.value;sv('fb_plan',plan)}
else if('pick' in t.dataset){pick=t.value;render()}});

if(matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches||navigator.standalone)document.documentElement.classList.add('app-mode');

/* ---------- Управление числами без клавиатуры ----------
   Тренировка: удержание = засчитать подсказку; вправо/влево = изменить число (скорость растёт со смещением);
               вниз = «до отказа», вверх = снять отказ.
   План: вправо/влево = изменить границу, при отпускании значение сохраняется. */
const HOLD_MS=670,MOVE_PX=10,SWIPE_PX=40,MAXREP=99;
const rateOf=d=>Math.min(30,1+Math.pow(d/20,1.5)); // изменений/сек в зависимости от смещения d (px) от точки касания
document.documentElement.style.setProperty('--hold',HOLD_MS+'ms');
const vib=(()=>{let t=0;return ms=>{const n=Date.now();if(n-t<45)return;t=n;navigator.vibrate?.(ms)}})();
const TICK_VIB=20,DONE_VIB=70;                      // щелчок при смене числа / длинная вибрация при «выполнено»
const repEl=(i,j)=>document.querySelector(`[data-rep="${i}.${j}"]`);
const flEl=(i,j)=>document.querySelector(`[data-fl="${i}.${j}"]`);
function paintSet(i,j){const it=sess.items[i],s=it.sets[j],el=repEl(i,j);if(!el)return;
el.classList.toggle('done',!!s.reps);el.setAttribute('aria-valuenow',s.reps||0);el.querySelector('.rep-val').textContent=s.reps||repHint(it,j);
$('#h'+i).classList.toggle('hidden',!(first(it)>=it.max))}
function setFail(i,j,on){const s=sess.items[i].sets[j];s.fail=!!on;sv('fb_sess',sess);repEl(i,j)?.classList.toggle('fail',!!on);
const f=flEl(i,j);if(f){f.classList.toggle('on',!!on);f.textContent=on?'до отказа':'подход без отказа'}}
function setReps(i,j,v){const s=sess.items[i].sets[j];s.reps=v>0?v:'';if(!s.reps&&s.fail)setFail(i,j,false);else sv('fb_sess',sess);paintSet(i,j)}
function paintNum(d,i){const e=plan[d].ex[i];['smin','smax','min','max'].forEach(k=>{const el=document.querySelector(`[data-num="${d}.${i}.${k}"]`);
if(el){el.querySelector('.nv').textContent=e[k];el.setAttribute('aria-valuenow',e[k])}})}
const bump=(el,c)=>{el.classList.remove(c);void el.offsetWidth;el.classList.add(c)};
/* адаптер: что именно крутит жест — подход на тренировке или граница в плане */
function adapt(el){
if(el.dataset.rep){if(!sess)return null;const[i,j]=el.dataset.rep.split('.').map(Number),it=sess.items[i],s=it.sets[j],hint=()=>repHint(it,j);
return{lo:0,hi:MAXREP,vert:true,val:el.querySelector('.rep-val'),holdable:()=>!s.reps,isFail:()=>!!s.fail,
get:()=>s.reps||hint(),set:v=>setReps(i,j,v),
hold(){const v=hint();setReps(i,j,v);navigator.vibrate?.(DONE_VIB);startRest(rest.pref);return v},
swipe(down){if(down){if(!s.reps){setReps(i,j,hint());startRest(rest.pref)}setFail(i,j,true);navigator.vibrate?.([50,40,50])}
else if(s.fail){setFail(i,j,false);navigator.vibrate?.(30)}},
end(drag){if(drag&&s.reps)startRest(rest.pref)}}}
const[d,n,k]=el.dataset.num.split('.'),i=+n,e=plan[d].ex[i],pair={smin:['smax',1],smax:['smin',-1],min:['max',1],max:['min',-1]}[k];
return{lo:1,hi:k[0]==='s'?20:MAXREP,vert:false,val:el.querySelector('.nv'),get:()=>e[k],
set:v=>{e[k]=v;const[o,sg]=pair;if((v-e[o])*sg>0)e[o]=v;paintNum(d,i)},end(){sv('fb_plan',plan)}}}
let g=null;
const endHold=()=>{if(g?.hold){clearTimeout(g.hold);g.hold=null}g?.el.classList.remove('holding')};
function step(k,sg){const v=Math.max(k.tg.lo,Math.min(k.tg.hi,k.cur+sg));if(v===k.cur)return;k.cur=v;k.tg.set(v);bump(k.tg.val,'tick');vib(TICK_VIB)}
function loop(t){if(!g||g.axis!=='h')return;const dt=Math.min(.05,(t-g.tm)/1000);g.tm=t;
const dx=g.lx-g.x,d=Math.abs(dx)-MOVE_PX;
if(d>0){const sg=Math.sign(dx);if(sg!==g.sg){g.sg=sg;g.acc=.5}
g.acc+=rateOf(d)*dt;while(g.acc>=1){g.acc-=1;step(g,sg)}}
else{g.sg=0;g.acc=0}
requestAnimationFrame(loop)}
document.addEventListener('pointerdown',e=>{const el=e.target.closest('.rep,.numcell');if(!el||g)return;if(e.pointerType==='mouse'&&e.button)return;
const tg=adapt(el);if(!tg)return;
g={el,tg,id:e.pointerId,x:e.clientX,y:e.clientY,lx:e.clientX,ly:e.clientY,cur:tg.get(),axis:'',hold:null,sg:0,acc:0,tm:0,acted:false};
try{el.setPointerCapture(e.pointerId)}catch{}
if(tg.holdable?.()){el.classList.add('holding');
g.hold=setTimeout(()=>{const k=g;if(!k)return;k.hold=null;el.classList.remove('holding');k.cur=tg.hold();k.x=k.lx;k.y=k.ly;bump(el,'pop')},HOLD_MS)}});
document.addEventListener('pointermove',e=>{if(!g||e.pointerId!==g.id)return;g.lx=e.clientX;g.ly=e.clientY;const dx=g.lx-g.x,dy=g.ly-g.y;
if(!g.axis){if(Math.max(Math.abs(dx),Math.abs(dy))<MOVE_PX)return;
g.axis=g.tg.vert&&Math.abs(dy)>Math.abs(dx)?'v':'h';endHold();g.el.classList.add('drag');
if(g.axis==='h'){g.sg=Math.sign(dx)||1;g.acc=0;step(g,g.sg);g.tm=performance.now();requestAnimationFrame(loop)}}
if(g.axis==='v'&&!g.acted&&Math.abs(dy)>=SWIPE_PX){g.acted=true;g.tg.swipe(dy>0);g.cur=g.tg.get()}});
document.addEventListener('pointerup',e=>{if(!g||e.pointerId!==g.id)return;endHold();const{el,tg,axis}=g;el.classList.remove('drag');g=null;tg.end?.(axis==='h')});
document.addEventListener('pointercancel',e=>{if(!g||e.pointerId!==g.id)return;endHold();const{el,tg}=g;el.classList.remove('drag');g=null;tg.end?.(false)});
/* клавиатура (для компьютера): стрелки — число, Enter/пробел — засчитать подсказку, F — «до отказа» */
document.addEventListener('keydown',e=>{const el=e.target.closest?.('.rep,.numcell');if(!el)return;const tg=adapt(el);if(!tg)return;const k=e.key;
if(tg.vert){const und=tg.holdable(),b=tg.get();let v=null;
if(k==='Enter'||k===' ')v=b;
else if(k==='ArrowRight'||k==='ArrowUp')v=Math.min(tg.hi,und?b:b+1);
else if(k==='ArrowLeft'||k==='ArrowDown')v=und?0:b-1;
else if(k==='f'||k==='F'){e.preventDefault();tg.swipe(!tg.isFail());return}
if(v===null)return;e.preventDefault();tg.set(v);if(v>0){startRest(rest.pref);if(und)navigator.vibrate?.(DONE_VIB)}}
else{const dl=(k==='ArrowRight'||k==='ArrowUp')?1:(k==='ArrowLeft'||k==='ArrowDown')?-1:0;if(!dl)return;e.preventDefault();
tg.set(Math.max(tg.lo,Math.min(tg.hi,tg.get()+dl)));tg.end()}});

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
