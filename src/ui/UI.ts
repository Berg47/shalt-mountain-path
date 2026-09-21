import {icon,itemIcon} from './icons';
import {ITEMS,TOOLS,RECIPES,BUILDINGS,REGIONS,SETTINGS,type RecipeId,type ResourceId,type ToolId,type BuildingId,type Cost} from '../data/config';
import type {GameModel} from '../systems/GameModel';
import type {AudioSystem} from '../systems/AudioSystem';

export type Panel='inventory'|'craft'|'build'|'map'|'pause'|'help'|null;
export interface UIActions {build:(kind:BuildingId)=>void;cancelBuild:()=>void;confirmBuild:()=>void;exit:()=>void;stick:{x:number;y:number;sprint:boolean};audio:AudioSystem}
export class UI {
 root=document.getElementById('ui')!;panel:Panel=null;selected:ResourceId|null=null;lastHash='';lastFocus:HTMLElement|null=null;abort=new AbortController();toastTimer:ReturnType<typeof setTimeout>|null=null;
 constructor(public model:GameModel,public actions:UIActions){
  this.root.innerHTML=`<div class="hud" id="hud">
   <header class="game-brand"><span class="brand-mark">${icon('shalt')}</span><div>ШАЛТ<small>ПУТЬ В ГОРЫ</small></div></header>
   <section class="vitals glass" aria-label="Показатели героя"><div class="identity"><div class="level-seal" id="level" title="Уровень">1</div><div><strong id="age">15 лет</strong><span id="xp-text" title="Опыт">Начало пути</span></div><button class="icon-button" data-panel="help" aria-label="Управление">${icon('help')}</button></div><div class="xp-track"><span id="xp-fill"></span></div>
   ${[['health','heart','Здоровье'],['stamina','stamina','Выносливость'],['hunger','food','Сытость'],['temperature','temp','Температура']].map(([id,i,label])=>`<div class="vital ${id}"><span title="${label}">${icon(i)}</span><div class="bar" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" id="${id}-meter"><i id="${id}-bar"></i></div><b id="${id}-value"></b></div>`).join('')}
   </section>
   <div class="place-label"><span id="region">Солнечные луга</span><small id="rest-status"></small></div>
   <section class="world-cluster glass" aria-label="Время и карта"><div class="world-status"><span id="time-symbol">${icon('sun')}</span><div><b id="clock">08:00</b><span id="day-label">День 1 · Утро</span><small class="weather-line" id="weather">Ясно</small></div></div>
   <button class="minimap" data-panel="map" aria-label="Открыть карту долины"><span class="north">С</span><div class="mini-map-field"><i class="mini-river"></i><span class="mini-home">⌂</span><i id="minimap-player"></i></div><small>ДОЛИНА</small></button></section>
   <div class="top-actions"><button class="icon-button glass" data-action="sound" aria-label="Переключить звук" id="sound-button">${icon('sound')}</button><button class="icon-button glass" data-panel="pause" aria-label="Меню игры">${icon('menu')}</button></div>
   <section class="goal glass" id="goal-panel" aria-label="Следующий шаг" hidden><div class="goal-detail" id="goal-detail"><button class="goal-close" data-action="close-goal" aria-label="Свернуть задание">${icon('close')}</button><span class="eyebrow">СЛЕДУЮЩИЙ ШАГ</span><h2 id="goal-title"></h2><p id="goal-text"></p><div id="goal-progress"></div><button id="goal-action" data-panel="craft">Лагерь ${icon('arrow')}</button></div></section>
   <div id="interaction" class="interaction"></div>
   <div class="hotbar glass" aria-label="Быстрый доступ">${(['shalt','axe','pickaxe','berry','cooked'] as const).map((id,index)=>`<button data-hotbar="${id}" id="hot-${id}" aria-label="${id in TOOLS?TOOLS[id as ToolId].name:ITEMS[id as ResourceId].name}" title="${id in TOOLS?TOOLS[id as ToolId].name:ITEMS[id as ResourceId].name}"><kbd>${index+1}</kbd>${icon(id)}<span class="hot-count" id="hot-count-${id}"></span></button>`).join('')}</div>
   <nav class="bottom-actions"><button data-action="toggle-goal" id="goal-button" aria-label="Следующий шаг" aria-expanded="false" aria-controls="goal-panel">${icon('goal')}<span>Задание</span></button><button data-panel="inventory" aria-label="Рюкзак">${icon('bag')}<span>Рюкзак</span><kbd>I</kbd></button><button data-panel="craft" aria-label="Ремесло">${icon('craft')}<span>Ремесло</span><kbd>C</kbd></button><button data-panel="build" aria-label="Лагерь">${icon('canopy')}<span>Лагерь</span><kbd>B</kbd></button></nav>
   <div class="control-hint">WASD <span>идти</span> · Shift <span>бежать</span> · E <span>действие</span> · Пробел <span>шалт</span></div>
   <div id="toast" class="toast" role="status"></div><div id="discovery" class="discovery"></div>
   <div class="touch-controls"><div class="joystick" id="joystick" aria-label="Стик движения"><i></i></div><div class="touch-buttons"><button class="touch-run" id="touch-run" aria-label="Бежать">${icon('stamina')}</button><button class="touch-action" data-action="interact" aria-label="Собрать или использовать">${icon('leaf')}</button><button class="touch-attack" data-action="attack" aria-label="Атаковать шалтом">${icon('shalt')}</button></div></div>
   <div id="placement-panel" class="placement-panel glass" hidden><span id="placement-name"></span><small>Выбери свободное место рядом</small><div><button class="button secondary" data-action="cancel-build">Отмена</button><button class="button" data-action="confirm-build">Поставить</button></div></div>
  </div><div id="modal-root"></div>`;
  this.root.addEventListener('click',e=>this.click(e),{signal:this.abort.signal});
  document.addEventListener('keydown',e=>this.keyboard(e),{signal:this.abort.signal});this.setupTouch();this.update(true);
 }
 click(e:Event){
  const target=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!target||target.disabled)return;
  this.actions.audio.unlock();if(target.dataset.panel){this.open(target.dataset.panel as Panel);return;}
  if(target.dataset.hotbar){const id=target.dataset.hotbar;if(id in TOOLS)this.model.equip(id as ToolId);else this.model.eat(id as ResourceId);this.update(true);return;}
  if(target.dataset.item){this.selected=target.dataset.item as ResourceId;this.renderPanel();return;}
  if(target.dataset.craft){this.model.craft(target.dataset.craft as RecipeId);this.renderPanel();this.update(true);return;}
  if(target.dataset.build){this.open(null);this.actions.build(target.dataset.build as BuildingId);return;}
  const action=target.dataset.action;
  if(action==='close')this.open(null);
  else if(action==='eat'&&this.selected){this.model.eat(this.selected);this.renderPanel();}
  else if(action==='discard'&&this.selected){this.model.inventory.remove(this.selected,1);this.model.dirty++;this.renderPanel();this.model.toast('Один предмет оставлен');}
  else if(action==='cook'){this.model.cook();this.renderPanel();}
  else if(action==='interact')this.model.interact();
  else if(action==='attack')this.model.attack();
  else if(action==='sound'){this.actions.audio.toggle();this.root.querySelector('#sound-button')!.innerHTML=icon(this.actions.audio.enabled?'sound':'mute');this.update(true);if(this.panel)this.renderPanel();}
  else if(action==='save'){this.model.toast(this.model.save()?'Путь сохранён':'Не удалось сохранить: браузер запретил запись.');}
  else if(action==='exit'){this.model.save();this.actions.exit();}
  else if(action==='cancel-build')this.actions.cancelBuild();
  else if(action==='confirm-build')this.actions.confirmBuild();
  else if(action==='respawn'){this.model.respawn();this.open(null);}
  else if(action==='fullscreen'){if(document.fullscreenElement)void document.exitFullscreen();else void document.documentElement.requestFullscreen().catch(()=>this.model.toast('Полный экран недоступен в этом браузере'));}
  else if(action==='toggle-goal')this.setGoalOpen(!this.root.querySelector('.goal')!.classList.contains('is-open'));
  else if(action==='close-goal')this.setGoalOpen(false);
 }
 setGoalOpen(open:boolean){
  const panel=this.root.querySelector<HTMLElement>('#goal-panel')!;
  const toggle=this.root.querySelector<HTMLButtonElement>('#goal-button')!;
  if(!open&&panel.contains(document.activeElement))toggle.focus();
  panel.classList.toggle('is-open',open);panel.hidden=!open;
  toggle.setAttribute('aria-expanded',String(open));
 }
 keyboard(e:KeyboardEvent){
  if(this.panel&&e.key==='Tab'){const buttons=Array.from(this.root.querySelectorAll<HTMLElement>('#modal-root button:not(:disabled)'));const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}return;}
  if(e.repeat)return;const key=e.code;
  if(key==='Escape'){e.preventDefault();if(!this.panel&&this.root.querySelector('.goal.is-open')){this.setGoalOpen(false);return;}this.actions.cancelBuild();this.open(this.panel?null:'pause');return;}
  const panels:Record<string,Panel>={KeyI:'inventory',KeyC:'craft',KeyB:'build',KeyM:'map'};if(panels[key]){e.preventDefault();this.open(this.panel===panels[key]?null:panels[key]);return;}
  if(this.panel)return;
  if(/^Digit[1-5]$/.test(key)){const ids=['shalt','axe','pickaxe','berry','cooked'];const id=ids[Number(key.slice(-1))-1];if(id in TOOLS)this.model.equip(id as ToolId);else this.model.eat(id as ResourceId);}
 }
 open(panel:Panel){
  if(this.model.dead&&panel!==null){this.death();return;}
  if(panel){this.actions.cancelBuild();this.setGoalOpen(false);}
  this.panel=panel;this.model.paused=!!panel;this.actions.stick.x=0;this.actions.stick.y=0;
  if(panel){this.lastFocus=document.activeElement as HTMLElement;this.renderPanel();requestAnimationFrame(()=>this.root.querySelector<HTMLElement>('#modal-root button')?.focus());}
  else{this.root.querySelector('#modal-root')!.innerHTML='';this.lastFocus?.focus();this.lastFocus=null;}
  this.root.querySelector('#hud')!.classList.toggle('panel-open',!!panel);
 }
 costs(cost:Cost){return `<div class="costs">${Object.entries(cost).map(([id,n])=>`<span class="${this.model.inventory.count(id as ResourceId)>=n!?'enough':'missing'}">${itemIcon(id)} ${this.model.inventory.count(id as ResourceId)}/${n} <small>${ITEMS[id as ResourceId].short}</small></span>`).join('')}</div>`;}
 renderPanel(){
  if(!this.panel)return;const m=this.model;let body='';const names={inventory:'Всё, что с собой',craft:'Ремесло',build:'Твой лагерь',map:'Долина',pause:'Твой путь',help:'Управление'};
  if(this.panel==='inventory'){
   body=`<div class="inventory-summary"><span>${m.inventory.bag?'Кожаная сумка':'Припасы в поясе'} · <b>${m.inventory.slots.length}/${m.inventory.capacity}</b> ячеек</span><small>До ${SETTINGS.inventory.stack} предметов в ячейке</small></div><div class="inventory-grid">${Array.from({length:m.inventory.capacity},(_,i)=>{const s=m.inventory.slots[i];return s?`<button class="item-slot ${this.selected===s.id?'selected':''}" data-item="${s.id}">${itemIcon(s.id)}<strong>${s.count}</strong><span>${ITEMS[s.id].name}</span></button>`:`<div class="item-slot empty-slot"><span>${i+1}</span></div>`;}).join('')}</div>`;
   if(this.selected&&m.inventory.count(this.selected)){const i=ITEMS[this.selected];body+=`<div class="item-detail"><div>${itemIcon(this.selected)}<h3>${i.name}</h3></div><p>${i.description}</p><div class="item-actions">${['berry','cooked'].includes(this.selected)?'<button class="button small" data-action="eat">Съесть один</button>':''}${this.selected==='meat'?`<button class="button small" data-action="cook" ${!m.buildings.nearFire(m.player)?'disabled':''}>Приготовить на костре</button>`:''}<button class="text-button" data-action="discard">Оставить один</button></div></div>`;}
   else body+='<p class="panel-note">Выбери предмет. Инструменты хранятся отдельно на поясе.</p>';
   body+=`<div class="equipment">${m.inventory.tools.map(t=>`<button data-hotbar="${t}" class="${m.inventory.equipped===t?'selected':''}">${icon(t)}${TOOLS[t].name}${m.inventory.equipped===t?icon('check'):''}</button>`).join('')}</div>`;
  }else if(this.panel==='craft'){
   body='<p class="panel-intro">Простые вещи, сделанные своими руками.</p><div class="recipe-list">'+Object.entries(RECIPES).map(([id,r])=>{const owned=m.crafting.owned(id as RecipeId),unlocked=!r.requires||m.inventory.tools.includes(r.requires);return `<article class="recipe"><div class="recipe-symbol">${icon(id==='bag'?'bag':id)}</div><div class="recipe-content"><h3>${r.name}</h3><p>${r.description}</p>${!owned?this.costs(r.cost):'<span class="made">'+icon('check')+' Изготовлено</span>'}</div><button class="button small" data-craft="${id}" ${owned||!unlocked||!m.inventory.canAfford(r.cost)?'disabled':''}>${owned?'Готово':!unlocked?'После топора':'Создать'}</button></article>`;}).join('')+'</div>';
  }else if(this.panel==='build'){
   body='<p class="panel-intro">Выбери постройку, затем свободное место рядом с собой.</p><div class="recipe-list">'+Object.entries(BUILDINGS).map(([id,b])=>`<article class="recipe"><div class="recipe-symbol">${icon(id)}</div><div class="recipe-content"><h3>${b.name}</h3><p>${b.description}</p>${this.costs(b.cost)}</div><button class="button small" data-build="${id}" ${!m.inventory.canAfford(b.cost)?'disabled':''}>Выбрать место</button></article>`).join('')+'</div><p class="panel-note">У костра используй действие, чтобы приготовить мясо. Рядом с укрытием — чтобы отдохнуть.</p>';
  }else if(this.panel==='map'){
   body=`<div class="valley-map"><div class="map-river"></div><span class="map-north">СЕВЕР ↑</span>${REGIONS.map(r=>`<span class="map-place ${m.discovered.has(r.id)?'discovered':''}" style="left:${r.x/34}%;top:${r.y/26}%"><i></i>${m.discovered.has(r.id)?r.name:'Неизведано'}</span>`).join('')}<span class="map-you" style="left:${m.player.x/34}%;top:${m.player.y/26}%"><i></i>Ты</span>${m.buildings.objects.map(b=>`<span class="map-camp" style="left:${b.x/34}%;top:${b.y/26}%" title="${BUILDINGS[b.kind].name}">${icon(b.kind)}</span>`).join('')}</div><p class="panel-note">Реку можно пересечь у Каменного брода. Проход в глубину пещеры пока закрыт.</p>`;
  }else if(this.panel==='help'){
   body=`<div class="help-grid"><div><h3>Исследуй</h3><p><kbd>WASD</kbd> или стрелки — идти<br><kbd>Shift</kbd> — бежать<br><kbd>E</kbd> — собрать, добыть, использовать</p></div><div><h3>Устройся</h3><p><kbd>I</kbd> — рюкзак<br><kbd>C</kbd> — ремесло<br><kbd>B</kbd> — строительство<br><kbd>M</kbd> — карта</p></div><div><h3>Защищайся</h3><p><kbd>Пробел</kbd> или <kbd>F</kbd> — удар шалтом<br><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> — инструмент<br><kbd>4</kbd> <kbd>5</kbd> — ягоды и еда</p></div><div><h3>На телефоне</h3><p>Стик слева — движение.<br>Лист — действие. Кинжал — удар.<br>Молния — удерживай для бега.</p></div></div><p class="panel-note">Заяц убегает. Кабан перед броском замирает — успей отойти в сторону. Костёр отпугивает кабанов.</p>`;
  }else{
   body=`<div class="pause-stats"><span><b>${m.age}</b> лет</span><span><b>${m.xp.level}</b> уровень</span><span><b>${m.day.day}</b> день в горах</span></div><div class="pause-buttons"><button class="button" data-action="close">Продолжить путь ${icon('arrow')}</button><button class="button secondary" data-action="save">${icon('save')} Сохранить</button><button class="button secondary" data-action="fullscreen">${icon('expand')} Во весь экран</button><button class="button secondary" data-panel="help">${icon('help')} Управление</button><button class="text-button" data-action="exit">Сохранить и выйти в главное меню</button></div><p class="panel-note">Прогресс сохраняется автоматически в этом браузере.</p>`;
  }
  const tabs=['inventory','craft','build','map'].includes(this.panel)?`<nav class="panel-tabs" aria-label="Разделы">${[['inventory','bag','Рюкзак'],['craft','craft','Ремесло'],['build','canopy','Лагерь'],['map','map','Карта']].map(([id,i,label])=>`<button data-panel="${id}" class="${id===this.panel?'active':''}">${icon(i)}${label}</button>`).join('')}</nav>`:'';
  this.root.querySelector('#modal-root')!.innerHTML=`<div class="modal-backdrop"><section class="game-panel ${this.panel==='map'?'map-panel':''}" role="dialog" aria-modal="true" aria-labelledby="panel-title"><header><div><span class="eyebrow">ШАЛТ · ПУТЬ В ГОРЫ</span><h2 id="panel-title">${names[this.panel]}</h2></div><button class="icon-button" data-action="close" aria-label="Закрыть">${icon('close')}</button></header>${tabs}<div class="panel-body">${body}</div><footer><span>${m.region}</span><span>День ${m.day.day} · ${m.day.clock}</span></footer></section></div>`;
 }
 update(force=false){
  const m=this.model,p=m.player;const set=(id:string,text:string)=>{const e=this.root.querySelector<HTMLElement>('#'+id);if(e&&e.textContent!==text)e.textContent=text;};
  set('level',String(m.xp.level));set('age',`${m.age} лет`);set('xp-text',`${m.xp.total-m.xp.floor} / ${m.xp.next-m.xp.floor}`);this.root.querySelector<HTMLElement>('#xp-fill')!.style.width=`${(m.xp.total-m.xp.floor)/(m.xp.next-m.xp.floor)*100}%`;
  for(const [id,value,label]of [['health',p.health,String(Math.ceil(p.health))],['stamina',p.stamina,String(Math.ceil(p.stamina))],['hunger',p.hunger,String(Math.ceil(p.hunger))],['temperature',(p.temperature-30)/8*100,p.temperature.toFixed(1)+'°']] as const){set(id+'-value',label);this.root.querySelector<HTMLElement>('#'+id+'-bar')!.style.width=`${Math.max(0,Math.min(100,value))}%`;this.root.querySelector('#'+id+'-meter')!.setAttribute('aria-valuenow',String(Math.round(value)));}
  set('clock',m.day.clock);set('day-label',`День ${m.day.day} · ${m.day.phase}`);set('weather',m.weather.label);set('region',m.region);set('rest-status',m.resting?'Отдых под кровом':m.buildings.nearFire(p)?'Тепло костра':p.temperature<34.5?'Ты замерзаешь':p.hunger<20?'Нужно поесть':'');
  const marker=this.root.querySelector<HTMLElement>('#minimap-player')!;marker.style.left=`${p.x/34}%`;marker.style.top=`${p.y/26}%`;
  const goal=m.goal();set('goal-title',goal.title);set('goal-text',goal.text);set('goal-progress',goal.progress);const gb=this.root.querySelector<HTMLButtonElement>('#goal-action')!;gb.dataset.panel=goal.panel;gb.innerHTML=goal.action+icon('arrow');
  const interaction=m.interaction();this.root.querySelector('#interaction')!.innerHTML=interaction&&!m.paused?`<kbd>E</kbd><span>${interaction.label}</span>`:'';
  const hash=`${m.dirty}/${m.inventory.equipped}/${m.inventory.slots.map(s=>s.id+s.count).join('/')}/${m.day.phase}`;
  if(hash!==this.lastHash||force){this.lastHash=hash;for(const id of ['shalt','axe','pickaxe','berry','cooked']){const btn=this.root.querySelector<HTMLButtonElement>('#hot-'+id)!;const isTool=id in TOOLS;const available=isTool?m.inventory.tools.includes(id as ToolId):m.inventory.count(id as ResourceId)>0;btn.classList.toggle('unavailable',!available);btn.classList.toggle('active',m.inventory.equipped===id);btn.disabled=!available;set('hot-count-'+id,isTool?'':String(m.inventory.count(id as ResourceId)));}this.root.querySelector('#time-symbol')!.innerHTML=icon(m.day.night?'moon':'sun');}
 }
 toast(text:string){const el=this.root.querySelector<HTMLElement>('#toast')!;el.textContent=text;el.classList.add('visible');if(this.toastTimer)clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>el.classList.remove('visible'),3600);}
 discover(text:string,level=false){const el=this.root.querySelector<HTMLElement>('#discovery')!;el.innerHTML=`<small>${level?'НОВАЯ СТУПЕНЬ':'ОТКРЫТО НОВОЕ МЕСТО'}</small><strong>${text}</strong><span>◆</span>`;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');}
 placement(kind:BuildingId|null){const el=this.root.querySelector<HTMLElement>('#placement-panel')!;el.hidden=!kind;if(kind)this.root.querySelector('#placement-name')!.textContent=BUILDINGS[kind].name;}
 death(){this.panel='pause';this.model.paused=true;this.root.querySelector('#modal-root')!.innerHTML=`<div class="modal-backdrop"><section class="game-panel death-panel" role="dialog" aria-modal="true"><span class="eyebrow">СИЛЫ ПОКИНУЛИ ТЕБЯ</span><h2>Путь не окончен</h2><p>Ты придёшь в себя у своего укрытия или на первой поляне. Лагерь и припасы останутся.</p><button class="button" data-action="respawn">Вернуться к пути ${icon('arrow')}</button></section></div>`;}
 setupTouch(){
  const joystick=this.root.querySelector<HTMLElement>('#joystick')!,knob=joystick.querySelector<HTMLElement>('i')!;let active:number|null=null;
  const move=(e:PointerEvent)=>{if(active!==e.pointerId)return;const r=joystick.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,len=Math.hypot(x,y),max=38,scale=len>max?max/len:1;knob.style.transform=`translate(${x*scale}px,${y*scale}px)`;this.actions.stick.x=x*scale/max;this.actions.stick.y=y*scale/max;};
  joystick.addEventListener('pointerdown',e=>{if(this.panel)return;e.preventDefault();active=e.pointerId;joystick.setPointerCapture(e.pointerId);move(e);this.actions.audio.unlock();},{signal:this.abort.signal});
  joystick.addEventListener('pointermove',move,{signal:this.abort.signal});
  const end=()=>{active=null;knob.style.transform='translate(0,0)';this.actions.stick.x=0;this.actions.stick.y=0;};for(const type of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(type,end,{signal:this.abort.signal});
  const run=this.root.querySelector<HTMLElement>('#touch-run')!;run.addEventListener('pointerdown',e=>{e.preventDefault();run.setPointerCapture(e.pointerId);this.actions.stick.sprint=true;},{signal:this.abort.signal});for(const type of ['pointerup','pointercancel','lostpointercapture'])run.addEventListener(type,()=>this.actions.stick.sprint=false,{signal:this.abort.signal});
 }
 destroy(){this.abort.abort();if(this.toastTimer)clearTimeout(this.toastTimer);this.root.innerHTML='';}
}
