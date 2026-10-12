(()=>{
'use strict';
const $=id=>document.getElementById(id);
const byId=new Map((window.PFO_REGIONS||[]).map(r=>[r.id,r]));
const map=window.PFO_MAP;
const publicContent=window.PFO_CONTENT||{};
const STORAGE='constructive-pfo-drafts-v1';
const HISTORY='constructive-pfo-history-v1';
const BASE='https://github.com/lordlis5631-max/-';
const FIELDS=[
 {id:'trend',number:'01',title:'Краткая нейтральная формулировка тенденции или проблемы',placeholder:'Опишите наблюдаемую тенденцию кратко, без оценочных суждений и персональных данных.'},
 {id:'support',number:'02',title:'Кому нужна поддержка?',placeholder:'Укажите группы, которым особенно важна профилактическая поддержка.'},
 {id:'where',number:'03',title:'Где проявляется проблема?',placeholder:'Обозначьте среды, ситуации и площадки, где проявляется тенденция.'},
 {id:'missing',number:'04',title:'Чего не хватает?',placeholder:'Укажите недостающие ресурсы, компетенции и инструменты.'},
 {id:'risks',number:'05',title:'Что усиливает риски и проблемы в профилактике?',placeholder:'Опишите факторы риска, ограничения и трудности профилактической работы.'},
 {id:'resources',number:'06',title:'На что можно опереться?',placeholder:'Перечислите существующие сильные стороны, партнёров, ресурсы и инициативы.'}
];
const ALL_KEYS=FIELDS.map(f=>f.id).concat(['practiceDescription','presentationUrl','contactName','socialUrl','phone']);
const LABELS={
'bashkortostan':{p:[546,448],lines:['Башкортостан']},
'mari-el':{p:[274,366],lines:['Марий Эл']},
'mordovia':{p:[171,547],lines:['Мордовия']},
'tatarstan':{p:[360,458],lines:['Татарстан']},
'udmurtia':{p:[476,380],lines:['Удмуртия']},
'chuvashia':{p:[243,431],lines:['Чувашия']},
'perm':{p:[593,293],lines:['Пермский','край']},
'kirov':{p:[343,257],lines:['Кировская','область']},
'nizhny':{p:[121,408],lines:['Нижегородская','область']},
'orenburg':{p:[559,738],lines:['Оренбургская','область']},
'penza':{p:[166,643],lines:['Пензенская','область']},
'samara':{p:[370,630],lines:['Самарская','область']},
'saratov':{p:[202,752],lines:['Саратовская','область']},
'ulyanovsk':{p:[298,542],lines:['Ульяновская','область']}
};
const svgNS='http://www.w3.org/2000/svg';
function el(tag,cls,text){const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x}
function svg(tag,attrs){const x=document.createElementNS(svgNS,tag);Object.entries(attrs||{}).forEach(([a,v])=>x.setAttribute(a,String(v)));return x}
function readStore(key){try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch{return {}}}
let drafts=readStore(STORAGE);
let history=readStore(HISTORY);
let current=null,editing=null,zoom=1,tx=0,ty=0,toastTimer=null;
let dragged=false, pointers=new Map(),oneStart=null,pinchStart=null;
const pathEls=new Map(),labelEls=new Map();
const stage=$('map-stage'), geo=$('map-geo'), tip=$('map-tooltip');
if(!map||!Array.isArray(map.shapes)||!byId.size){$('chosen-description').textContent='Не удалось загрузить географические данные.';return}
const shapesGroup=svg('g'),labelsGroup=svg('g');geo.append(shapesGroup,labelsGroup);
function viewData(id){return Object.assign({},publicContent[id]||{},drafts[id]||{})}
function hasValue(val){return typeof val==='string'&&val.trim().length>0}
function saveStores(){try{localStorage.setItem(STORAGE,JSON.stringify(drafts));localStorage.setItem(HISTORY,JSON.stringify(history));return true}catch{showToast('Браузер запретил локальное сохранение. Разрешите хранение данных в браузере.');return false}}
function showToast(message){const t=$('toast');t.textContent=message;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),4600)}
function confirmSwitch(){if(!editing)return true;if(confirm('Есть несохранённые изменения. Точно выйти без сохранения?')){editing=null;return true}return false}
function paintSelected(){pathEls.forEach((path,id)=>{const is=id===current;path.classList.toggle('selected',is);path.setAttribute('aria-pressed',String(is))});labelEls.forEach((nodes,id)=>{nodes.forEach(node=>node.classList.toggle('selected',id===current))})}
function selectRegion(id,opts={}){if(!byId.has(id))return;if(id!==current&&!confirmSwitch())return;current=id;editing=null;paintSelected();renderChips();renderSummary();renderForms();if(location.hash.slice(1)!==id&&window.history.replaceState)window.history.replaceState(null,'','#'+id);
if(opts.scroll&&window.innerWidth<=770)document.querySelector('.intro-card').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderChips(){const list=$('region-chips'),q=$('region-search').value.trim().toLocaleLowerCase('ru');list.replaceChildren();let found=0;byId.forEach(r=>{if(q&&!(r.name+' '+r.capital).toLocaleLowerCase('ru').includes(q))return;found++;const b=el('button','region-chip'+(r.id===current?' active':''),r.short);b.type='button';b.setAttribute('aria-pressed',r.id===current?'true':'false');b.title=r.name+' · '+r.capital;b.addEventListener('click',()=>selectRegion(r.id,{scroll:window.innerWidth<=770}));list.appendChild(b)});if(!found)list.appendChild(el('span','region-chip','Ничего не найдено'))}
function renderSummary(){const r=byId.get(current);const d=viewData(current);$('chosen-name').textContent=r.name;$('chosen-capital').textContent=r.capital;$('chosen-description').textContent='Выбранный субъект Приволжского федерального округа. Здесь собираются наблюдения, профилактические практики и контакты для обмена опытом.';$('editing-region-label').textContent='Регион: '+r.name+'. Нажмите на карандаш, чтобы изменить нужный ответ.';
const questionsDone=FIELDS.filter(f=>hasValue(d[f.id])).length;
const practiceDone=hasValue(d.practiceDescription)||hasValue(d.presentationUrl);
const contactDone=hasValue(d.contactName)||hasValue(d.socialUrl)||hasValue(d.phone);
const total=questionsDone+Number(practiceDone)+Number(contactDone);
$('completion-text').textContent=total+' из 8 блоков';$('completion-bar').style.width=(total/8*100)+'%';
$('draft-status').textContent=drafts[current]?'Есть локальные изменения. Они видны на этом устройстве, пока не одобрена публикация.':'Локальных изменений нет. Новые сведения можно предложить к публикации.';
}
function iconPencil(){const s=el('span');s.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4z"/></svg>';return s.firstChild}
function saveChanges(field,updates){if(!current)return false;const old=viewData(current),changed=Object.entries(updates).some(([key,val])=>String(old[key]||'')!==val);
if(!changed){editing=null;renderForms();showToast('Изменений нет.');return true}
for(const [key,val] of Object.entries(updates)){if(hasValue(old[key])&&!hasValue(val)){if(!confirm('Вы собираетесь удалить сохранённые данные. Точно очистить поле?'))return false}}
if(!confirm('Вы точно хотите сохранить изменения в разделе «'+field+'» для региона «'+byId.get(current).name+'»?'))return false;
history[current]=Object.fromEntries(ALL_KEYS.map(key=>[key,String(old[key]||'')]));
drafts[current]=Object.assign({},drafts[current]||{},updates);
if(!saveStores()){return false}
editing=null;renderSummary();renderForms();showToast('Изменения сохранены в браузере. Для публикации отправьте предложение.');
return true}
function createCard(number,title,fieldId,renderer,fields){const card=el('article','answer-card');card.dataset.field=fieldId;
const header=el('div','answer-top');const hbox=el('div');
hbox.append(el('div','answer-index',number),el('h3','answer-question',title));
const pencil=el('button','pencil');pencil.type='button';pencil.title='Изменить данные — потребуется подтверждение';pencil.setAttribute('aria-label','Изменить: '+title);pencil.appendChild(iconPencil());header.append(hbox,pencil);
const display=el('div','answer-display');const editor=el('div','editor');
const data=viewData(current);
const controls={};
fields.forEach(f=>{if(f.label){const label=el('label','form-label',f.label);label.htmlFor='fld-'+fieldId+'-'+f.key;editor.appendChild(label)}const inp=el(f.multiline?'textarea':'input');inp.id='fld-'+fieldId+'-'+f.key;inp.maxLength=f.maxLength||1000;inp.placeholder=f.placeholder||'';if(f.multiline){inp.rows=f.rows||4}else{inp.type=f.type||'text'}inp.value=String(data[f.key]||'');controls[f.key]=inp;editor.appendChild(inp)});
const actions=el('div','editor-actions');
const save=el('button','small-save','Сохранить ответ');save.type='button';
const cancel=el('button','small-cancel','Отменить');cancel.type='button';
actions.append(save,cancel);editor.appendChild(actions);card.append(header,display,editor);
renderer(display,data);
pencil.addEventListener('click',()=>{
 if(!current)return;
 if(editing&&editing!==fieldId&&!confirmSwitch())return;
 if(!confirm('Вы точно хотите изменить данные раздела «'+title+'»?'))return;
 editing=fieldId;renderForms();
 const focus=document.querySelector('[data-field="'+fieldId+'"] .editor textarea, [data-field="'+fieldId+'"] .editor input');
 if(focus)focus.focus({preventScroll:true});
});
save.addEventListener('click',()=>{const updates={};for(const [key,input] of Object.entries(controls)){const v=input.value.trim();if((key==='presentationUrl'||key==='socialUrl')&&v&&!/^https?:\/\/[^\s.]+\.[^\s]+/i.test(v)){showToast('Ссылка должна начинаться с https:// и вести на существующий адрес.');input.focus();return}updates[key]=v}saveChanges(title,updates)});
cancel.addEventListener('click',()=>{editing=null;renderForms()});
if(editing===fieldId)card.classList.add('editing');
return card
}
function renderText(block,data,key){const txt=String(data[key]||'');block.appendChild(el('p','answer-value'+(!txt?' empty':''),txt||'Ответ пока не добавлен.'))}
function safeUrl(val){try{const u=new URL(val);return (u.protocol==='https:'||u.protocol==='http:')?u.href:null}catch{return null}}
function addLink(block,url,defaultLabel){const safe=safeUrl(url);if(!safe)return;const a=el('a','safe-link',defaultLabel);a.href=safe;a.target='_blank';a.rel='noopener noreferrer';block.appendChild(a)}
function renderForms(){if(!current)return;const data=viewData(current),root=$('answer-cards');root.replaceChildren();
FIELDS.forEach(f=>{const card=createCard(f.number,f.title,f.id,(block,d)=>renderText(block,d,f.id),[{key:f.id,multiline:true,placeholder:f.placeholder,maxLength:1000}]);root.appendChild(card)});
const extras=$('practices');extras.replaceChildren();
const practice=createCard('ПРАКТИКИ','Лучшие региональные практики в профилактике','practice',(block,d)=>{
if(!hasValue(d.practiceDescription)&&!hasValue(d.presentationUrl))block.appendChild(el('p','empty-data','Добавьте название практики и ссылку на презентацию.'));
else{if(hasValue(d.practiceDescription))block.appendChild(el('p','answer-value',d.practiceDescription));if(hasValue(d.presentationUrl))addLink(block,d.presentationUrl,'Открыть презентацию ↗')}
},[
{key:'practiceDescription',label:'Описание практики',multiline:true,rows:3,maxLength:1000,placeholder:'Название, краткое описание и результат практики'},
{key:'presentationUrl',label:'Ссылка на презентацию',type:'url',maxLength:500,placeholder:'https://...'}
]);practice.classList.add('extra-card');
const contact=createCard('ВЗАИМОДЕЙСТВИЕ','Контактные данные для обмена практиками','contact',(block,d)=>{
if(!hasValue(d.contactName)&&!hasValue(d.socialUrl)&&!hasValue(d.phone))block.appendChild(el('p','empty-data','Добавьте ФИО, социальную сеть и телефон контактного лица.'));
else{if(hasValue(d.contactName))block.appendChild(el('p','data-line','ФИО: '+d.contactName));if(hasValue(d.socialUrl))addLink(block,d.socialUrl,'Социальная сеть ↗');if(hasValue(d.phone)){const p=el('p','data-line');p.appendChild(document.createTextNode('Телефон: '));const a=el('a','safe-link',d.phone);a.href='tel:'+d.phone.replace(/[^+0-9]/g,'');p.appendChild(a);block.appendChild(p)}}
},[
{key:'contactName',label:'ФИО контактного лица',maxLength:140,placeholder:'Фамилия Имя Отчество'},
{key:'socialUrl',label:'Ссылка на профиль в социальной сети',type:'url',maxLength:500,placeholder:'https://vk.com/...'},
{key:'phone',label:'Номер телефона',type:'tel',maxLength:50,placeholder:'+7 (900) 000-00-00'}
]);contact.classList.add('extra-card');extras.append(practice,contact);renderUndo()
}
let undoButton=null;
function renderUndo(){if(!undoButton){undoButton=el('button','small-cancel','↶ Отменить последнее сохранение');undoButton.type='button';undoButton.style.marginLeft='auto';undoButton.style.flex='none';undoButton.addEventListener('click',()=>{
 if(!current||!history[current])return;
 if(!confirm('Восстановить предыдущую версию данных региона «'+byId.get(current).name+'»? Текущие локальные изменения будут заменены.'))return;
 const old=viewData(current);const prev=history[current];history[current]=Object.fromEntries(ALL_KEYS.map(key=>[key,String(old[key]||'')]));
 drafts[current]=Object.assign({},drafts[current]||{},prev);
 if(!saveStores())return;
 editing=null;renderSummary();renderForms();showToast('Предыдущая версия восстановлена.');
});document.querySelector('.section-notice').appendChild(undoButton)}
undoButton.style.display=history[current]?'inline-block':'none'}
const mapPaths=new Map();
map.shapes.forEach(shape=>{
 const region=byId.get(shape.id);if(!region)return;
 const path=svg('path',{d:shape.d,fill:region.color,tabindex:'0',role:'button','aria-label':region.name,'aria-pressed':'false'});
 path.classList.add('region-path');path.dataset.id=shape.id;
 path.addEventListener('click',()=>{if(!dragged)selectRegion(shape.id,{scroll:window.innerWidth<=770})});
 path.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectRegion(shape.id)}});
 path.addEventListener('pointerenter',e=>showTip(e,region));
 path.addEventListener('pointermove',e=>moveTip(e));
 path.addEventListener('pointerleave',()=>{tip.style.display='none'});
 shapesGroup.appendChild(path);pathEls.set(shape.id,path);
 const info=LABELS[shape.id]||{p:[shape.labelX,shape.labelY],lines:[region.short]};
 const label=svg('g',{tabindex:'0',role:'button','aria-label':'Выбрать '+region.name});
 label.classList.add('map-name');label.dataset.id=shape.id;
 const [x,y]=info.p,lines=info.lines;
 const width=Math.max(...lines.map(t=>t.length))*7.5+16, height=lines.length===2?37:25;
 const rect=svg('rect',{x:x-width/2,y:y-height/2,width,height,rx:8});rect.classList.add('map-label-box');
 const text=svg('text',{x,y:y-(lines.length-1)*7+4});text.classList.add('map-label-text');
 lines.forEach((line,index)=>{const t=svg('tspan',{x,dy:index===0?0:14});t.textContent=line;text.appendChild(t)});
 label.append(rect,text);label.addEventListener('click',e=>{e.stopPropagation();if(!dragged)selectRegion(shape.id,{scroll:window.innerWidth<=770})});
 label.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectRegion(shape.id)}});
 label.addEventListener('pointerenter',e=>showTip(e,region));label.addEventListener('pointerleave',()=>tip.style.display='none');
 labelsGroup.appendChild(label);labelEls.set(shape.id,[rect,text]);
});
function showTip(e,r){if(e.pointerType==='touch')return;tip.replaceChildren();tip.append(el('strong',null,r.name),el('span',null,'Центр: '+r.capital));tip.style.display='block';moveTip(e)}
function moveTip(e){const b=$('map-frame').getBoundingClientRect(),width=tip.offsetWidth||185;let left=e.clientX-b.left+15,top=e.clientY-b.top-47;if(left+width>b.width-10)left=e.clientX-b.left-width-14;tip.style.left=Math.max(5,left)+'px';tip.style.top=Math.max(7,top)+'px'}
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function redraw(){zoom=clamp(zoom,1,4.8);tx=clamp(tx,-(zoom-1)*425,(zoom-1)*425);ty=clamp(ty,-(zoom-1)*447,(zoom-1)*447);geo.setAttribute('transform','translate('+(425+tx)+' '+(447+ty)+') scale('+zoom+') translate(-425 -447)')}
function scaleBy(factor){zoom*=factor;redraw()}
$('zoom-in').onclick=()=>scaleBy(1.35);$('zoom-out').onclick=()=>scaleBy(1/1.35);$('zoom-reset').onclick=()=>{zoom=1;tx=0;ty=0;redraw()};
function distance(){const a=[...pointers.values()];return Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)}
stage.addEventListener('pointerdown',e=>{tip.style.display='none';pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});dragged=false;if(pointers.size===1)oneStart={x:e.clientX,y:e.clientY,tx,ty};if(pointers.size===2){pinchStart={distance:distance(),zoom};oneStart=null}stage.classList.add('dragging')});
stage.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2&&pinchStart){dragged=true;zoom=pinchStart.zoom*distance()/Math.max(1,pinchStart.distance);redraw()}else if(pointers.size===1&&oneStart){const dx=e.clientX-oneStart.x,dy=e.clientY-oneStart.y;if(Math.hypot(dx,dy)>6)dragged=true;if(!dragged)return;if(!stage.hasPointerCapture(e.pointerId))stage.setPointerCapture(e.pointerId);const r=stage.getBoundingClientRect(),scale=850/(r.width||850);tx=oneStart.tx+dx*scale;ty=oneStart.ty+dy*scale;redraw()}});
function finishPointer(e){pointers.delete(e.pointerId);if(!pointers.size){stage.classList.remove('dragging');oneStart=pinchStart=null;setTimeout(()=>dragged=false,50)}else if(pointers.size===1){const p=[...pointers.values()][0];oneStart={x:p.x,y:p.y,tx,ty};pinchStart=null}}
stage.addEventListener('pointerup',finishPointer);stage.addEventListener('pointercancel',finishPointer);
stage.addEventListener('wheel',e=>{e.preventDefault();scaleBy(e.deltaY<0?1.14:1/1.14)},{passive:false});
$('region-search').addEventListener('input',renderChips);
window.addEventListener('hashchange',()=>{const id=decodeURIComponent(location.hash.slice(1));if(byId.has(id)&&id!==current)selectRegion(id)});
async function copyText(text){try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);return true}}catch{}
const temp=el('textarea');temp.value=text;temp.style.position='fixed';temp.style.left='-99999px';document.body.appendChild(temp);temp.select();let ok=false;try{ok=document.execCommand('copy')}catch{}temp.remove();return ok}
$('submit-proposal').addEventListener('click',async()=>{
 if(!current)return;
 if(!drafts[current]){showToast('Для публикации сначала заполните или измените хотя бы одно поле.');return}
 if(editing){showToast('Сначала сохраните открытый ответ.');return}
 const d=viewData(current);
 if([d.contactName,d.socialUrl,d.phone].some(hasValue)&&!confirm('Контактное лицо согласилось на публичное размещение ФИО и указанных контактов?'))return;
 if(!confirm('Вы точно хотите отправить сведения по региону «'+byId.get(current).name+'» на модерацию для публичного размещения?'))return;
 const clean={};ALL_KEYS.forEach(k=>clean[k]=String(d[k]||''));
 const payload={region:current,data:clean};
 const body='Предложение по региону: '+byId.get(current).name+'\n\n### REGION_DATA_JSON\n'+String.fromCharCode(96,96,96)+'json\n'+JSON.stringify(payload,null,2)+'\n'+String.fromCharCode(96,96,96)+'\n\nДля публикации требуется проверка владельца репозитория и метка publish-approved.';
 const title='Публикация данных: '+byId.get(current).name;
 const url=BASE+'/issues/new?template=region-data.md&title='+encodeURIComponent(title);
 const copied=await copyText(body);
 if(!copied){showToast('Не удалось скопировать данные. Разрешите доступ к буферу обмена и попробуйте снова.');return}
 showToast('Данные скопированы! В открывшейся форме GitHub вставьте их в описание и отправьте заявку.');
 const popup=window.open(url,'_blank','noopener,noreferrer');
 if(!popup){const a=el('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.click()}
});
function resizeLabels(){const mobile=stage.getBoundingClientRect().width<570;const font=mobile?20:12;labelEls.forEach((pair,id)=>{const [rect,text]=pair,info=LABELS[id],lines=info.lines,[x,y]=info.p;const lineHeight=mobile?22:14;const width=Math.max(...lines.map(t=>t.length))*(mobile?11.4:7.5)+16;const height=lines.length===2?(mobile?55:37):(mobile?34:25);rect.setAttribute('x',x-width/2);rect.setAttribute('y',y-height/2);rect.setAttribute('width',width);rect.setAttribute('height',height);text.style.fontSize=font+'px';text.setAttribute('y',y-(lines.length-1)*lineHeight/2+font*.36);text.querySelectorAll('tspan').forEach((span,i)=>span.setAttribute('dy',i===0?'0':lineHeight))})}
window.addEventListener('resize',resizeLabels);resizeLabels();
renderChips();redraw();const initial=decodeURIComponent(location.hash.slice(1));selectRegion(byId.has(initial)?initial:'bashkortostan'); 
})();
