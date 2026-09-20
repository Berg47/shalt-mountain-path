import {SETTINGS,REGIONS,NODE_DATA,ITEMS,RECIPES,BUILDINGS,ANIMALS,type RecipeId,type BuildingId,type ResourceId,type ToolId} from '../data/config';
import {World,distance,type ResourceNode,type Point} from '../world/World';
import {Player} from '../entities/Player';
import {Animal} from '../entities/Animal';
import {InventorySystem} from './InventorySystem';
import {CraftingSystem} from './CraftingSystem';
import {ResourceSystem} from './ResourceSystem';
import {BuildingSystem,type BuiltObject} from './BuildingSystem';
import {ExperienceSystem} from './ExperienceSystem';
import {DayNightSystem} from './DayNightSystem';
import {WeatherSystem} from './WeatherSystem';
import {AgeSystem} from './AgeSystem';
import {SaveSystem} from './SaveSystem';

export type GameEvent={type:'toast'|'gather'|'hit'|'attack'|'damage'|'build'|'cook'|'level'|'discover'|'death';text?:string;x?:number;y?:number;kind?:string;amount?:number};
export type Interaction={kind:'node';target:ResourceNode;label:string}|{kind:'loot';target:Animal;label:string}|{kind:'fire';target:BuiltObject;label:string}|{kind:'shelter';target:BuiltObject;label:string};
export class GameModel {
 world=new World();player=new Player();inventory=new InventorySystem();xp=new ExperienceSystem();day=new DayNightSystem();weather=new WeatherSystem();
 crafting=new CraftingSystem(this.inventory,this.xp);resources=new ResourceSystem(this.world,this.inventory,this.xp);buildings=new BuildingSystem(this.world,this.inventory,this.xp);
 animals=this.world.animalSeeds.map((a,i)=>new Animal(i,a.kind,a.x,a.y));
 elapsed=0;nights=0;discovered=new Set<string>(['meadow']);events:GameEvent[]=[];paused=false;dead=false;resting=false;region='Солнечные луга';saveTimer=0;lastLevel=1;dirty=0;
 constructor(save?:ReturnType<typeof SaveSystem.pack>|null){if(save){SaveSystem.restore(this,save);this.lastLevel=this.xp.level;}if(this.player.health<=0)this.dead=true;}
 get age(){return AgeSystem.fromLevel(this.xp.level);}
 blocked=(x:number,y:number)=>this.world.blocked(x,y)||this.buildings.blocked(x,y);
 emit(event:GameEvent){this.events.push(event);this.dirty++;}
 toast(text:string){this.emit({type:'toast',text});}
 update(dt:number,input:{x:number;y:number;sprint:boolean}){
  if(this.paused||this.dead)return;dt=Math.min(dt,.05);this.elapsed+=dt;this.saveTimer+=dt;
  this.player.update(dt,input,this.blocked);this.resources.update(dt);this.weather.update(dt);
  if(this.day.update(dt)){this.nights++;this.xp.award('night',SETTINGS.xp.night,10);this.toast('Ты пережил ночь. +30 опыта');}
  for(const a of this.animals){
   a.update(dt,this.player,(x,y)=>this.world.blocked(x,y,12)||this.buildings.blocked(x,y,12),p=>this.buildings.nearFire(p),n=>{if(this.player.damage(n))this.emit({type:'damage',amount:n});});
   if(a.state==='dead'&&!a.lootMeat&&!a.lootHide){a.respawn+=dt;if(a.respawn>300&&distance(a,this.player)>600){const next=new Animal(a.id,a.kind,a.home.x,a.home.y);Object.assign(a,next);}}
  }
  const p=this.player,fire=this.buildings.nearFire(p),shelter=this.buildings.shelter(p);
  if(input.x||input.y||!shelter)this.resting=false;
  const target=fire?37.1:shelter?36.6:36.8-(this.day.night?1.6:0)-this.weather.chill;
  p.temperature+=(target-p.temperature)*dt*.012;
  p.hunger=Math.max(0,p.hunger-dt*SETTINGS.hungerLoss*(input.sprint?1.35:1));
  if(p.hunger<1||p.temperature<33.5)p.health=Math.max(0,p.health-dt*.7);
  else if(this.resting&&shelter){p.health=Math.min(100,p.health+dt*(shelter.kind==='hut'?1.2:.65));p.stamina=Math.min(100,p.stamina+dt*20);}
  else if(p.hunger>65&&p.health<100)p.health=Math.min(100,p.health+dt*.10);
  for(const b of this.buildings.objects)b.born+=dt;
  const region=REGIONS.filter(r=>distance(p,r)<r.radius).sort((a,b)=>distance(p,a)-distance(p,b))[0];
  if(region){this.region=region.name;if(!this.discovered.has(region.id)){this.discovered.add(region.id);this.xp.award('area:'+region.id,SETTINGS.xp.area);this.emit({type:'discover',text:region.name});}}
  if(this.xp.level>this.lastLevel){this.lastLevel=this.xp.level;this.emit({type:'level',text:`Уровень ${this.xp.level} · ${this.age} лет`});}
  if(p.health<=0){this.dead=true;this.emit({type:'death'});this.save();}
  if(this.saveTimer>18){this.saveTimer=0;this.save();}
 }
 interaction():Interaction|null{
  const p=this.player;const candidates:({d:number}&Interaction)[]=[];
  for(const n of this.world.nodes){if(n.depleted)continue;const d=distance(p,n);if(d<92)candidates.push({d,kind:'node',target:n,label:(NODE_DATA[n.kind].tool?'Добыть: ':'Собрать: ')+NODE_DATA[n.kind].name});}
  for(const a of this.animals){const d=distance(p,a);if(a.state==='dead'&&(a.lootMeat||a.lootHide)&&d<95)candidates.push({d:d-30,kind:'loot',target:a,label:'Забрать добычу'});}
  for(const b of this.buildings.objects){const d=distance(p,b);if(d<110)candidates.push({d:d+20,kind:b.kind==='fire'?'fire':'shelter',target:b,label:b.kind==='fire'?(this.inventory.count('meat')?'Приготовить мясо':'Погреться у костра'):'Отдохнуть под кровом'});}
  return candidates.sort((a,b)=>a.d-b.d)[0]??null;
 }
 interact(){
  if(this.paused||this.dead||this.player.actionTimer>0)return;
  const i=this.interaction();if(!i){this.toast('Подойди ближе к ресурсу или лагерю');return;}
  if(i.kind==='node'){
   const result=this.resources.gather(i.target);if(result.error){this.toast(result.error);return;}
   this.player.actionTimer=.38;
   this.emit({type:result.hit?'hit':'gather',kind:i.target.kind,x:i.target.x,y:i.target.y,text:result.item?`+${result.count} ${ITEMS[result.item].short}`:undefined});
   if(!this.inventory.tools.includes('axe')&&this.inventory.canAfford(RECIPES.axe.cost)&&!this.xp.actions['hint:axe']){this.xp.actions['hint:axe']=1;this.toast('Теперь можно создать топор. Открой «Ремесло».');}
  }else if(i.kind==='loot'){
   let gained=0;const a=i.target;
   if(a.lootHide&&this.inventory.add('hide',a.lootHide)){gained+=a.lootHide;this.emit({type:'gather',x:a.x,y:a.y,text:`+${a.lootHide} шкуры`});a.lootHide=0;}
   if(a.lootMeat&&this.inventory.add('meat',a.lootMeat)){gained+=a.lootMeat;this.emit({type:'gather',x:a.x,y:a.y,text:`+${a.lootMeat} мяса`});a.lootMeat=0;}
   if(!gained)this.toast('Не хватает места. Добыча останется здесь.');else this.player.actionTimer=.4;
  }else if(i.kind==='fire'){if(this.inventory.count('meat'))this.cook();else this.toast('Костёр согревает. Мясо можно приготовить здесь.');}
  else{this.resting=!this.resting;this.toast(this.resting?'Отдых. Здоровье восстанавливается. Двинься, чтобы встать.':'Ты поднялся.');}
  this.dirty++;
 }
 craft(id:RecipeId){if(this.dead)return;const error=this.crafting.craft(id);if(error){this.toast(error);return false;}this.toast(id==='bag'?'Кожаная сумка готова. Теперь 16 ячеек.':`${RECIPES[id].name} готов`);this.emit({type:'cook'});this.save();return true;}
 equip(id:ToolId){if(!this.inventory.tools.includes(id))return false;this.inventory.equipped=id;this.dirty++;return true;}
 eat(id:ResourceId){if(this.dead||!['berry','cooked'].includes(id)||!this.inventory.remove(id,1))return false;this.player.hunger=Math.min(100,this.player.hunger+(id==='berry'?12:36));if(id==='cooked')this.player.health=Math.min(100,this.player.health+8);this.toast(id==='berry'?'Ягоды · +12 сытости':'Жареное мясо · +36 сытости');this.dirty++;return true;}
 cook(){if(this.dead||!this.buildings.nearFire(this.player)){this.toast('Подойди к костру');return false;}if(!this.inventory.count('meat')){this.toast('Нет сырого мяса');return false;}
  // Free the ingredient slot before checking output capacity. Roll back on failure.
  const before=this.inventory.slots.map(s=>({...s}));this.inventory.remove('meat',1);if(!this.inventory.add('cooked',1)){this.inventory.slots=before;this.toast('Освободи место для приготовленного мяса');return false;}
  this.player.actionTimer=1.4;this.xp.award('cook',3,7);this.emit({type:'cook'});this.toast('Мясо приготовлено');this.dirty++;return true;
 }
 attack(){if(this.paused||this.dead||this.player.attackTimer>0||this.player.actionTimer>0)return;const p=this.player;if(p.stamina<9){this.toast('Нужно перевести дух');return;}
  this.inventory.equipped='shalt';p.attackTimer=.6;p.stamina-=9;this.emit({type:'attack',x:p.x,y:p.y});
  const a=this.animals.filter(a=>a.state!=='dead'&&distance(a,p)<105).sort((a,b)=>distance(a,p)-distance(b,p))[0];
  if(a){p.facing=a.x>p.x?1:-1;const killed=a.hit(32,p);this.emit({type:'hit',x:a.x,y:a.y,text:'32'});if(killed){this.xp.award('hunt:'+a.kind,ANIMALS[a.kind].xp,15);this.toast(`${ANIMALS[a.kind].name}: подойди и забери добычу`);}}
 }
 build(kind:BuildingId,x:number,y:number){if(this.dead)return false;const error=this.buildings.place(kind,x,y,this.player);if(error){this.toast(error);return false;}this.player.actionTimer=1.8;this.emit({type:'build',kind,x,y,text:BUILDINGS[kind].name});this.save();return true;}
 save(){return SaveSystem.save(this);}
 respawn(){this.dead=false;this.player.health=75;this.player.hunger=65;this.player.temperature=36.8;this.player.stamina=100;const shelter=this.buildings.objects.find(b=>b.kind!=='fire');const base=shelter?{x:shelter.x,y:shelter.y+115}:SETTINGS.start;this.player.x=base.x;this.player.y=base.y;this.player.invulnerable=6;this.toast('Ты пришёл в себя. Припасы и лагерь сохранены.');this.save();}
 goal(){
  if(!this.inventory.tools.includes('axe'))return {title:'Первый инструмент',text:'Собери ветки и камни для топора.',progress:`Ветки ${Math.min(3,this.inventory.count('branch'))}/3 · Камни ${Math.min(2,this.inventory.count('stone'))}/2`,action:'Ремесло',panel:'craft'};
  if(!this.buildings.objects.some(b=>b.kind==='fire'))return {title:'Тепло до темноты',text:'Добудь древесину и поставь костёр.',progress:`Древесина ${Math.min(2,this.inventory.count('wood'))}/2 · Ветки ${Math.min(3,this.inventory.count('branch'))}/3`,action:'Лагерь',panel:'build'};
  if(!this.inventory.bag)return {title:'Место для нужного',text:'Охоться на зайцев. Собери шкуры для сумки.',progress:`Шкуры ${Math.min(3,this.inventory.count('hide'))}/3 · Трава ${Math.min(4,this.inventory.count('grass'))}/4`,action:'Ремесло',panel:'craft'};
  if(!this.buildings.objects.some(b=>b.kind==='hut'))return {title:'Свой кров',text:'Устрой лагерь и построй шалаш.',progress:`Уровень ${this.xp.level} · Открыто мест ${this.discovered.size}/${REGIONS.length}`,action:'Лагерь',panel:'build'};
  return {title:'Путь продолжается',text:'Исследуй долину и переживи ночь в своём лагере.',progress:`Ночей пережито: ${this.nights} · Мест ${this.discovered.size}/${REGIONS.length}`,action:'Карта',panel:'map'};
 }
}
