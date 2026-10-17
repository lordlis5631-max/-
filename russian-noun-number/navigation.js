(function setupNavigation(){
'use strict';
const LAST_KEY='russian-noun-number-last-question-v1';
const days=DAYS.map(d=>d.id);
let lastId=null;
try{lastId=localStorage.getItem(LAST_KEY)}catch(e){}
function saveLast(id){lastId=id;try{localStorage.setItem(LAST_KEY,id)}catch(e){}}
function resume(){
 const last=lastId&&getItem(lastId);
 if(last&&!done(last))return last;
 const all=days.flatMap(d=>dayItems(d));
 const i=last?all.findIndex(q=>q.id===last.id):-1;
 return (i<0?null:all.slice(i+1).find(q=>!done(q)))||all.find(q=>!done(q))||last||all[0];
}
function weakItems(){return MAIN.filter(q=>['second','revealed'].includes(status(q)))}
const openBase=openQuestion;
openQuestion=function(id,review=false){if(!review&&getItem(id))saveLast(id);return openBase(id,review)};
const homeBase=renderHome;
renderHome=function(){
 homeBase();
 const q=resume(),btn=document.getElementById('continue-btn');
 if(q&&btn){
  const list=dayItems(q.day),d=DAYS.find(d=>d.id===q.day);
  const i=list.findIndex(x=>x.id===q.id);
  btn.id='smart-continue-btn';
  btn.textContent=MAIN.every(x=>done(x))?'Просмотреть последнее задание':`Продолжить: ${d.name.toLowerCase()}, ${i+1}/${list.length}`;
  const sub=document.createElement('p');
  sub.className='resume-note';
  sub.innerHTML=MAIN.every(x=>done(x))?'Основная программа выполнена. Можно повторить сложные задания.':`Следующее задание: <strong>${safe(q.prompt)}</strong>`;
  btn.parentElement.insertAdjacentElement('afterend',sub);
 }
 const count=weakItems().length;
 if(count){
  const actions=document.querySelector('#app .panel .actions');
  if(actions){const b=document.createElement('button');b.type='button';b.id='quick-review-btn';b.className='btn light';b.textContent=`↻ Повторить сложные задания (${count})`;actions.appendChild(b)}
 }
};
const dayBase=renderDay;
renderDay=function(){
 dayBase();
 const tasks=document.querySelector('#app .tasks');
 if(!tasks)return;
 const symbols={first:'✓',second:'✦',revealed:'!',pending:'○'};
 const labels={first:'верно с первой попытки',second:'верно после подсказки',revealed:'открыт разбор после ошибок',pending:'ещё не завершено'};
 for(const b of tasks.querySelectorAll('button[data-q]')){
  const q=getItem(b.dataset.q);if(!q)continue;
  const st=status(q);
  b.innerHTML=`<span class="task-number">${q.warm?'Р'+q.num:q.num}</span><span class="task-symbol" aria-hidden="true">${symbols[st]}</span>`;
  b.title=`${q.warm?'Разминка':'Задание'} ${q.num}: ${q.prompt} — ${labels[st]}`;
  b.setAttribute('aria-label',b.title);b.dataset.tip=q.prompt;
  if(q.id===lastId){b.classList.add('is-last');b.setAttribute('aria-description','Последнее открытое задание')}
 }
 const legend=document.createElement('div');legend.className='tasks-legend';
 legend.innerHTML='<span><b>✓</b> С первой</span><span><b>✦</b> С подсказкой</span><span><b>!</b> Разбор после ошибок</span><span><b>○</b> Не завершено</span>';
 tasks.insertAdjacentElement('afterend',legend);
};
const questionBase=renderQuestion;
renderQuestion=function(){
 questionBase();
 const q=getItem(currentId);if(!q)return;
 const items=retryMode?retryIds.map(id=>getItem(id)).filter(Boolean):dayItems(q.day);
 const i=items.findIndex(x=>x.id===q.id),n=items.filter(x=>done(x,retryMode)).length;
 const panel=document.querySelector('#app .panel'),top=panel?.querySelector('.qtop');
 if(!top)return;
 const day=DAYS.find(d=>d.id===q.day);
 const route=document.createElement('div');route.className='question-route';
 route.innerHTML=`<button type="button" class="question-day-link" data-go-day="${q.day}">${retryMode?'← К результатам':'← К заданиям дня'}</button><span>${retryMode?'Повторение':day.name} · ${i+1} из ${items.length}</span>`;
 top.insertAdjacentElement('beforebegin',route);
 const bar=document.createElement('div');bar.className='question-progress';
 bar.setAttribute('role','progressbar');bar.setAttribute('aria-label','Выполнено заданий в разделе');
 bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax',String(items.length));bar.setAttribute('aria-valuenow',String(n));
 bar.innerHTML=`<span style="width:${items.length?100*n/items.length:0}%"></span>`;
 top.insertAdjacentElement('afterend',bar);
 const label=document.createElement('p');label.className='question-progress-label';label.textContent=`Выполнено: ${n} из ${items.length}`;bar.insertAdjacentElement('afterend',label);
 const foot=panel.querySelector('.qfoot');if(foot){
  const back=document.createElement('button');back.type='button';back.className='btn mobile-day-btn';back.dataset.goDay=q.day;
  back.textContent=retryMode?'К отчёту':'К списку';
  foot.insertBefore(back,foot.lastElementChild);
 }
};
document.addEventListener('click',function(e){
 const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.id==='smart-continue-btn'){const q=resume();if(q)openQuestion(q.id)}
 else if(b.id==='quick-review-btn')reviewErrors();
 else if(b.hasAttribute('data-go-day')){if(retryMode)openReport();else openDay(b.dataset.goDay)}
});
document.addEventListener('click',function(e){
 if(e.target.closest('#confirm-reset')){lastId=null;try{localStorage.removeItem(LAST_KEY)}catch(e){}}
},true);
render();
})();