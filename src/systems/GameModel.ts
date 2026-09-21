import {SETTINGS,REGIONS,NODE_DATA,ITEMS,RECIPES,BUILDINGS,ANIMALS,ENEMIES,CAVE,type RecipeId,type BuildingId,type ResourceId,type ToolId,type EnemyKind,type EquipmentSlot} from '../data/config';
import {World,distance,seeded,type ResourceNode,type Point} from '../world/World';
import {Player} from '../entities/Player';
import {Animal} from '../entities/Animal';
import {Enemy} from '../entities/Enemy';
import {InventorySystem} from './InventorySystem';
import {CraftingSystem} from './CraftingSystem';
import {ResourceSystem} from './ResourceSystem';
import {BuildingSystem,type BuiltObject} from './BuildingSystem';
import {ExperienceSystem} from './ExperienceSystem';
import {DayNightSystem} from './DayNightSystem';
import {WeatherSystem} from './WeatherSystem';
import {AgeSystem} from './AgeSystem';
import {SaveSystem} from './SaveSystem';

export type GameEvent={type:'toast'|'gather'|'hit'|'attack'|'damage'|'build'|'cook'|'level'|'discover'|'death'|'trial'|'adulthood'|'location'|'wolfVictory';text?:string;x?:number;y?:number;kind?:string;amount?:number};
export type Interaction=
 |{kind:'node';target:ResourceNode;label:string}
 |{kind:'loot';target:Animal;label:string}
 |{kind:'enemyLoot';target:Enemy;label:string}
 |{kind:'wolfLoot';target:Enemy;label:string}
 |{kind:'caveEnter';target:Point;label:string}
 |{kind:'caveExit';target:Point;label:string}
 |{kind:'fire';target:BuiltObject;label:string}
 |{kind:'shelter';target:BuiltObject;label:string}
 |{kind:'workbench';target:BuiltObject;label:string};

const ENEMY_SEEDS:{kind:EnemyKind;x:number;y:number}[]=[
 {kind:'dagger',x:1740,y:920},{kind:'dagger',x:1810,y:990},{kind:'shield',x:1900,y:930},
 {kind:'dagger',x:2700,y:1010},{kind:'dagger',x:2810,y:1080},{kind:'shield',x:2900,y:980},
 {kind:'dagger',x:820,y:720},{kind:'shield',x:980,y:650},
 {kind:'chaborz',x:1050,y:470},
];

export class GameModel {
 world=new World();player=new Player();inventory=new InventorySystem();xp=new ExperienceSystem();day=new DayNightSystem();weather=new WeatherSystem();
 crafting=new CraftingSystem(this.inventory,this.xp);resources=new ResourceSystem(this.world,this.inventory,this.xp);buildings=new BuildingSystem(this.world,this.inventory,this.xp);
 animals=this.world.animalSeeds.map((a,i)=>new Animal(i,a.kind,a.x,a.y));
 enemies:Enemy[]=[];
 elapsed=0;nights=0;discovered=new Set<string>(['meadow']);events:GameEvent[]=[];paused=false;dead=false;resting=false;region='Солнечные луга';saveTimer=0;lastLevel=1;dirty=0;
 adult=false;trialNotified=false;bossDefeated=false;
 location:'world'|'cave'='world';caveWolf=new Enemy(99,'wolf',CAVE.wolfSpawn.x,CAVE.wolfSpawn.y);caveFirstDefeated=false;caveLastDefeatDay=0;caveNextAvailableDay=0;
 constructor(save?:ReturnType<typeof SaveSystem.pack>|null){
  this.enemies=ENEMY_SEEDS.map((e,i)=>{const p=this.safeSpawn(e.x,e.y);return new Enemy(i,e.kind,p.x,p.y);});
  if(save){SaveSystem.restore(this,save);this.lastLevel=this.xp.level;}
  this.syncCaveWolf();this.applyLevelCaps(false);
  const boss=this.enemies.find(e=>e.kind==='chaborz');if(boss)boss.active=this.trialNotified&&!this.bossDefeated;
  if(this.player.health<=0)this.dead=true;
 }
 safeSpawn(x:number,y:number){if(!this.world.blocked(x,y,18))return {x,y};for(let r=30;r<=240;r+=30)for(let a=0;a<Math.PI*2;a+=.45){const p={x:x+Math.cos(a)*r,y:y+Math.sin(a)*r};if(!this.world.blocked(p.x,p.y,18))return p;}return {x,y};}
 get age(){return AgeSystem.fromLevel(this.xp.level,this.adult);}
 caveBlocked(x:number,y:number){const b=CAVE.bounds,dx=(x-b.cx)/b.rx,dy=(y-b.cy)/b.ry;return dx*dx+dy*dy>.94;}
 blocked=(x:number,y:number)=>this.location==='cave'?this.caveBlocked(x,y):this.world.blocked(x,y)||this.buildings.blocked(x,y);
 syncCaveWolf(){
  const w=this.caveWolf,hasLoot=w.state==='dead'&&Object.values(w.loot).some(n=>!!n);
  if(hasLoot){w.active=true;return;}
  if(this.caveFirstDefeated&&this.day.day<this.caveNextAvailableDay){w.active=false;w.state='dead';w.hp=0;w.loot={};return;}
  if(!w.active||w.state==='dead'){w.reset();w.x=CAVE.wolfSpawn.x;w.y=CAVE.wolfSpawn.y;w.home={...CAVE.wolfSpawn};w.active=true;}
 }
 enterCave(){
  if(this.location==='cave')return;this.location='cave';this.player.x=CAVE.playerSpawn.x;this.player.y=CAVE.playerSpawn.y;this.player.vx=this.player.vy=0;this.player.invulnerable=1.2;
  this.syncCaveWolf();this.region=CAVE.name;this.discovered.add('cave');this.emit({type:'location',text:CAVE.name});
  if(this.caveWolf.active&&this.caveWolf.state!=='dead')this.toast('В темноте слышится рычание. Чёрный Волк рядом.');
  else this.toast(`Логово пусто. Волк вернётся на ${this.caveNextAvailableDay}-й игровой день.`);
  this.save();
 }
 exitCave(){
  if(this.location!=='cave')return;this.location='world';this.player.x=CAVE.entrance.x;this.player.y=CAVE.entrance.y+145;this.player.vx=this.player.vy=0;this.player.invulnerable=1.2;
  this.region='Вход в пещеру';this.emit({type:'location',text:'Вход в пещеру'});this.save();
 }
 rewardWolf(){
  const w=this.caveWolf,first=!this.caveFirstDefeated;this.caveLastDefeatDay=this.day.day;this.caveNextAvailableDay=this.day.day+CAVE.respawnDays;
  if(first){
   w.loot={wolfFang:2,wolfHide:1,wolfMantle:1};const from=this.xp.level,target=Math.min(SETTINGS.levels.length,from+5);
   this.xp.total=Math.max(this.xp.total,SETTINGS.levels[target-1]);this.caveFirstDefeated=true;
   this.emit({type:'wolfVictory',text:`Чёрный Волк повержен · уровень ${from} → ${target}`,x:w.x,y:w.y});
  }else{
   const rand=seeded(7701+this.day.day*131+w.kills*977);const loot:Partial<Record<ResourceId,number>>={};
   if(rand()>.35)loot.wolfFang=1;if(rand()>.78)loot.wolfHide=1;w.loot=loot;
   const half=Math.max(1,Math.floor((this.xp.next-this.xp.floor)*.5));this.xp.total+=half;
   this.emit({type:'wolfVictory',text:`Чёрный Волк снова повержен · +${half} опыта`,x:w.x,y:w.y});
  }
  this.save();
 }
 emit(event:GameEvent){this.events.push(event);this.dirty++;}
 toast(text:string){this.emit({type:'toast',text});}
 applyLevelCaps(grantIncrease:boolean,previousLevel=this.xp.level){
  const oldHealth=100+(Math.max(1,previousLevel)-1)*2,oldStamina=100+(Math.max(1,previousLevel)-1);
  const newHealth=100+(this.xp.level-1)*2,newStamina=100+(this.xp.level-1);
  this.player.maxHealth=newHealth;this.player.maxStamina=newStamina;
  if(grantIncrease){this.player.health=Math.min(newHealth,this.player.health+Math.max(0,newHealth-oldHealth));this.player.stamina=Math.min(newStamina,this.player.stamina+Math.max(0,newStamina-oldStamina));}
  else{this.player.health=Math.min(newHealth,this.player.health);this.player.stamina=Math.min(newStamina,this.player.stamina);}
 }
 update(dt:number,input:{x:number;y:number;sprint:boolean}){
  if(this.paused||this.dead)return;dt=Math.min(dt,.05);this.elapsed+=dt;this.saveTimer+=dt;
  this.player.update(dt,input,this.blocked);this.resources.update(dt);this.weather.update(dt);
  if(this.day.update(dt)){this.nights++;this.xp.award('night',SETTINGS.xp.night,10);this.toast('Ты пережил ночь. +30 опыта');this.syncCaveWolf();}
  if(this.location==='world'){
   for(const a of this.animals){
    a.update(dt,this.player,(x,y)=>this.world.blocked(x,y,12)||this.buildings.blocked(x,y,12),p=>this.buildings.nearFire(p),n=>{if(this.player.damage(n))this.emit({type:'damage',amount:n});});
    if(a.state==='dead'&&!a.lootMeat&&!a.lootHide){a.respawn+=dt;if(a.respawn>300&&distance(a,this.player)>600){const next=new Animal(a.id,a.kind,a.home.x,a.home.y);Object.assign(a,next);}}
   }
   for(const e of this.enemies){
    e.update(dt,this.player,(x,y)=>this.world.blocked(x,y,14)||this.buildings.blocked(x,y,14),n=>{if(this.player.damage(n))this.emit({type:'damage',amount:n,x:this.player.x,y:this.player.y});});
    if(e.kind!=='chaborz'&&e.state==='dead'&&Object.values(e.loot).every(n=>!n)&&e.respawn>420&&distance(e,this.player)>650)e.reset();
   }
  }else{
   this.syncCaveWolf();const w=this.caveWolf;
   if(w.active)w.update(dt,this.player,(x,y)=>this.caveBlocked(x,y),n=>{if(this.player.damage(n))this.emit({type:'damage',amount:n,x:this.player.x,y:this.player.y});});
  }
  const p=this.player,fire=this.location==='world'&&this.buildings.nearFire(p),shelter=this.location==='world'?this.buildings.shelter(p):null;
  if(input.x||input.y||!shelter)this.resting=false;
  const target=fire?37.1:shelter?36.6:36.8-(this.day.night?1.6:0)-(this.location==='cave'?.35:this.weather.chill);
  p.temperature+=(target-p.temperature)*dt*.012;
  p.hunger=Math.max(0,p.hunger-dt*SETTINGS.hungerLoss*(input.sprint?1.35:1));
  if(p.hunger<1||p.temperature<33.5)p.health=Math.max(0,p.health-dt*.7);
  else if(this.resting&&shelter){p.health=Math.min(p.maxHealth,p.health+dt*(shelter.kind==='hut'?1.2:.65));p.stamina=Math.min(p.maxStamina,p.stamina+dt*20);}
  else if(p.hunger>65&&p.health<p.maxHealth)p.health=Math.min(p.maxHealth,p.health+dt*.10);
  if(this.location==='world'){
   for(const b of this.buildings.objects)b.born+=dt;
   const region=REGIONS.filter(r=>distance(p,r)<r.radius).sort((a,b)=>distance(p,a)-distance(p,b))[0];
   if(region){this.region=region.name;if(!this.discovered.has(region.id)){this.discovered.add(region.id);this.xp.award('area:'+region.id,SETTINGS.xp.area);this.emit({type:'discover',text:region.name});}}
  }else this.region=CAVE.name;
  if(this.xp.level>this.lastLevel){
   const previous=this.lastLevel;this.lastLevel=this.xp.level;this.applyLevelCaps(true,previous);
   this.emit({type:'level',text:`Уровень ${this.xp.level} · здоровье ${p.maxHealth} · выносливость ${p.maxStamina}`});
  }
  if(this.location==='world'&&this.xp.level>=20&&!this.adult&&!this.trialNotified){
   this.trialNotified=true;const boss=this.enemies.find(e=>e.kind==='chaborz');if(boss)boss.active=true;
   this.emit({type:'trial',text:'Бой за жизнь'});this.save();
  }
  if(p.health<=0){this.dead=true;this.emit({type:'death'});this.save();}
  if(this.saveTimer>18){this.saveTimer=0;this.save();}
 }
 interaction():Interaction|null{
  const p=this.player;const candidates:({d:number}&Interaction)[]=[];
  if(this.location==='cave'){
   const exitD=distance(p,CAVE.exit);if(exitD<165)candidates.push({d:exitD-70,kind:'caveExit',target:CAVE.exit,label:'Выйти из пещеры'});
   const w=this.caveWolf,d=distance(p,w);if(w.state==='dead'&&Object.values(w.loot).some(n=>!!n)&&d<120)candidates.push({d:d-35,kind:'wolfLoot',target:w,label:'Забрать трофеи Чёрного Волка'});
   return candidates.sort((a,b)=>a.d-b.d)[0]??null;
  }
  const caveD=distance(p,CAVE.entrance);if(caveD<135)candidates.push({d:caveD-30,kind:'caveEnter',target:CAVE.entrance,label:'Войти в пещеру'});
  for(const n of this.world.nodes){if(n.depleted)continue;const d=distance(p,n);if(d<92)candidates.push({d,kind:'node',target:n,label:(NODE_DATA[n.kind].tool?'Добыть: ':'Собрать: ')+NODE_DATA[n.kind].name});}
  for(const a of this.animals){const d=distance(p,a);if(a.state==='dead'&&(a.lootMeat||a.lootHide)&&d<95)candidates.push({d:d-30,kind:'loot',target:a,label:'Забрать добычу'});}
  for(const e of this.enemies){const d=distance(p,e);if(e.active&&e.state==='dead'&&Object.values(e.loot).some(n=>n)&&d<105)candidates.push({d:d-35,kind:'enemyLoot',target:e,label:e.kind==='chaborz'?'Осмотреть Чаборза':'Обыскать разбойника'});}
  for(const b of this.buildings.objects){const d=distance(p,b);if(d>=110)continue;if(b.kind==='fire')candidates.push({d:d+20,kind:'fire',target:b,label:this.inventory.count('meat')?'Приготовить мясо':'Погреться у костра'});else if(b.kind==='workbench')candidates.push({d:d+10,kind:'workbench',target:b,label:'Работать за верстаком'});else candidates.push({d:d+20,kind:'shelter',target:b,label:'Отдохнуть под кровом'});}
  return candidates.sort((a,b)=>a.d-b.d)[0]??null;
 }
 interact(){
  if(this.paused||this.dead||this.player.actionTimer>0)return;
  const i=this.interaction();if(!i){this.toast(this.location==='cave'?'Подойди к выходу или к поверженному волку':'Подойди ближе к ресурсу, добыче, лагерю или входу в пещеру');return;}
  if(i.kind==='caveEnter'){this.enterCave();return;}
  if(i.kind==='caveExit'){this.exitCave();return;}
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
  }else if(i.kind==='enemyLoot'||i.kind==='wolfLoot'){
   let gained=0;for(const [id,count]of Object.entries(i.target.loot) as [ResourceId,number][]){if(!count)continue;const take=Math.min(count,this.inventory.freeFor(id));if(take>0&&this.inventory.add(id,take)){i.target.loot[id]=count-take;gained+=take;this.emit({type:'gather',x:i.target.x,y:i.target.y,text:`+${take} ${ITEMS[id].short}`});}}
   if(!gained)this.toast('Не хватает места. Добыча останется здесь.');else{this.player.actionTimer=.45;if(i.kind==='wolfLoot'&&Object.values(i.target.loot).every(n=>!n))this.toast('Трофеи Чёрного Волка убраны в сумку.');}
  }else if(i.kind==='fire'){if(this.inventory.count('meat'))this.cook();else this.toast('Костёр согревает. Мясо можно приготовить здесь.');}
  else if(i.kind==='workbench'){this.toast('Верстак готов. Открой «Ремесло» — здесь доступны улучшения III уровня.');}
  else{this.resting=!this.resting;this.toast(this.resting?'Отдых. Здоровье восстанавливается. Двинься, чтобы встать.':'Ты поднялся.');}
  this.dirty++;
 }
 craft(id:RecipeId){
  if(this.dead)return false;const recipe=RECIPES[id];
  if(recipe.bench&&!this.buildings.nearWorkbench(this.player)){this.toast('Для этого улучшения встань рядом с верстаком');return false;}
  const error=this.crafting.craft(id);if(error){this.toast(error);return false;}
  const messages:Partial<Record<RecipeId,string>>={
   bag:'Кожаная сумка II готова. Теперь 16 ячеек.',
   bag3:'Укреплённая сумка III готова. Теперь 24 ячейки.',
   shalt2:'Шалт улучшен до II уровня. Урон: 38.',
   shalt3:'Шалт закалён до III уровня. Урон: 44.',
  };
  this.toast(messages[id]??`${RECIPES[id].name} готов`);this.emit({type:'cook'});this.save();return true;
 }
 equip(id:ToolId){if(!this.inventory.tools.includes(id))return false;this.inventory.equipped=id;this.inventory.equipment.weapon=id;this.dirty++;return true;}
 equipWearable(id:'wolfMantle'){const ok=this.inventory.equipWearable(id);if(ok){this.toast('Накидка Чёрного Волка надета');this.dirty++;this.save();}return ok;}
 unequip(slot:EquipmentSlot){const ok=this.inventory.unequip(slot);if(ok){this.dirty++;this.save();}return ok;}
 eat(id:ResourceId){if(this.dead||!['berry','cooked'].includes(id)||!this.inventory.remove(id,1))return false;this.player.hunger=Math.min(100,this.player.hunger+(id==='berry'?12:36));if(id==='berry')this.player.health=Math.min(this.player.maxHealth,this.player.health+5);else this.player.health=Math.min(this.player.maxHealth,this.player.health+8);this.toast(id==='berry'?'Ягоды · +12 сытости · +5 HP':'Жареное мясо · +36 сытости · +8 HP');this.dirty++;return true;}
 cook(){if(this.dead||!this.buildings.nearFire(this.player)){this.toast('Подойди к костру');return false;}if(!this.inventory.count('meat')){this.toast('Нет сырого мяса');return false;}
  const before=this.inventory.slots.map(s=>({...s}));this.inventory.remove('meat',1);if(!this.inventory.add('cooked',1)){this.inventory.slots=before;this.toast('Освободи место для приготовленного мяса');return false;}
  this.player.actionTimer=1.4;this.xp.award('cook',3,7);this.emit({type:'cook'});this.toast('Мясо приготовлено');this.dirty++;return true;
 }
 makeEnemyLoot(e:Enemy){
  const rand=seeded(9301+e.id*173+e.kills*997+this.day.day*31);const pool:ResourceId[]=['branch','wood','stone','grass','berry','meat','hide','cooked','metal'];
  const loot:Partial<Record<ResourceId,number>>={};const rolls=e.kind==='shield'?4:3;
  for(let i=0;i<rolls;i++){const id=pool[Math.floor(rand()*pool.length)];loot[id]=(loot[id]??0)+1+Math.floor(rand()*(id==='metal'?2:3));}
  if(e.kind==='dagger'&&rand()>.45)loot.metal=(loot.metal??0)+1;
  if(e.kind==='shield')loot.metal=(loot.metal??0)+2;
  if(e.kind==='chaborz'){loot.metal=8;loot.hide=4;loot.cooked=3;}
  e.loot=loot;
 }
 attack(){
  if(this.paused||this.dead||this.player.attackTimer>0||this.player.actionTimer>0)return;const p=this.player;if(p.stamina<9){this.toast('Нужно перевести дух');return;}
  this.inventory.equipped='shalt';this.inventory.equipment.weapon='shalt';p.attackTimer=.6;p.stamina-=9;this.emit({type:'attack',x:p.x,y:p.y});
  const damage=[0,32,38,44][this.inventory.shaltLevel]??32;
  if(this.location==='cave'){
   const w=this.caveWolf;if(!w.active||w.state==='dead'||distance(w,p)>=118)return;p.facing=w.x>p.x?1:-1;
   const result=w.hit(damage,p);this.emit({type:'hit',x:w.x,y:w.y,text:String(result.damage)});
   if(result.killed)this.rewardWolf();return;
  }
  const nearbyAnimals=this.animals.filter(a=>a.state!=='dead'&&distance(a,p)<105).map(a=>({d:distance(a,p),kind:'animal' as const,target:a}));
  const nearbyEnemies=this.enemies.filter(e=>e.active&&e.state!=='dead'&&distance(e,p)<112).map(e=>({d:distance(e,p),kind:'enemy' as const,target:e}));
  const target=[...nearbyAnimals,...nearbyEnemies].sort((a,b)=>a.d-b.d)[0];
  if(!target)return;
  p.facing=target.target.x>p.x?1:-1;
  if(target.kind==='animal'){
   const a=target.target;const killed=a.hit(damage,p);this.emit({type:'hit',x:a.x,y:a.y,text:String(damage)});
   if(killed){this.xp.award('hunt:'+a.kind,ANIMALS[a.kind].xp,15);this.toast(`${ANIMALS[a.kind].name}: подойди и забери добычу`);}
  }else{
   const e=target.target;const result=e.hit(damage,p);this.emit({type:'hit',x:e.x,y:e.y,text:String(result.damage)});
   if(result.killed){
    this.makeEnemyLoot(e);this.xp.award('bandit:'+e.id,ENEMIES[e.kind].xp,25);
    if(e.kind==='chaborz'){
     this.adult=true;this.bossDefeated=true;e.active=true;this.emit({type:'adulthood',text:'Бой за жизнь завершён'});this.save();
    }else this.toast(`${ENEMIES[e.kind].name} повержен. Обыщи его.`);
   }
  }
 }
 build(kind:BuildingId,x:number,y:number){if(this.dead)return false;if(this.location==='cave'){this.toast('В пещере нельзя строить лагерь');return false;}const error=this.buildings.place(kind,x,y,this.player);if(error){this.toast(error);return false;}this.player.actionTimer=1.8;this.emit({type:'build',kind,x,y,text:BUILDINGS[kind].name});this.save();return true;}
 save(){return SaveSystem.save(this);}
 respawn(){this.dead=false;this.location='world';this.player.health=Math.min(this.player.maxHealth,75);this.player.hunger=65;this.player.temperature=36.8;this.player.stamina=this.player.maxStamina;const shelter=this.buildings.objects.find(b=>b.kind==='canopy'||b.kind==='hut');const base=shelter?{x:shelter.x,y:shelter.y+115}:SETTINGS.start;this.player.x=base.x;this.player.y=base.y;this.player.invulnerable=6;this.toast('Ты пришёл в себя. Припасы и лагерь сохранены.');this.save();}
 goal(){
  if(!this.inventory.tools.includes('axe'))return {title:'Первый инструмент',text:'Собери ветки и камни для топора.',progress:`Ветки ${Math.min(3,this.inventory.count('branch'))}/3 · Камни ${Math.min(2,this.inventory.count('stone'))}/2`,action:'Ремесло',panel:'craft'};
  if(!this.buildings.objects.some(b=>b.kind==='fire'))return {title:'Тепло до темноты',text:'Добудь древесину и поставь костёр.',progress:`Древесина ${Math.min(2,this.inventory.count('wood'))}/2 · Ветки ${Math.min(3,this.inventory.count('branch'))}/3`,action:'Лагерь',panel:'build'};
  if(this.inventory.bagLevel<2)return {title:'Место для нужного',text:'Охоться на зайцев. Собери шкуры для сумки II.',progress:`Шкуры ${Math.min(3,this.inventory.count('hide'))}/3 · Трава ${Math.min(4,this.inventory.count('grass'))}/4`,action:'Ремесло',panel:'craft'};
  if(!this.buildings.objects.some(b=>b.kind==='hut'))return {title:'Свой кров',text:'Устрой лагерь и построй шалаш.',progress:`Уровень ${this.xp.level} · Открыто мест ${this.discovered.size}/${REGIONS.length}`,action:'Лагерь',panel:'build'};
  if(this.xp.level>=20&&!this.adult)return {title:'Бой за жизнь',text:'В Предгорьях тебя ждёт Чаборз — легендарный воин с двуручной секирой.',progress:'Победи Чаборза, чтобы достичь 18-летия.',action:'Карта',panel:'map'};
  if(!this.buildings.objects.some(b=>b.kind==='workbench'))return {title:'Верстак',text:'Разбойники носят металл. Собери ресурсы и построй верстак для улучшений III уровня.',progress:`Металл ${this.inventory.count('metal')}/2 · Древесина ${Math.min(12,this.inventory.count('wood'))}/12`,action:'Лагерь',panel:'build'};
  if(this.inventory.shaltLevel<2)return {title:'Укрепить шалт',text:'Используй металл, камень и кожу, чтобы улучшить свой первый шалт.',progress:`Металл ${this.inventory.count('metal')}/2 · Камень ${this.inventory.count('stone')}/2`,action:'Ремесло',panel:'craft'};
  if(this.inventory.bagLevel<3)return {title:'Сумка III',text:'У верстака сделай большую укреплённую сумку.',progress:`Шкуры ${this.inventory.count('hide')}/6 · Металл ${this.inventory.count('metal')}/3`,action:'Ремесло',panel:'craft'};
  if(this.inventory.shaltLevel<3)return {title:'Закалить шалт',text:'У верстака доведи шалт до III уровня.',progress:`Металл ${this.inventory.count('metal')}/5 · Камень ${this.inventory.count('stone')}/3`,action:'Ремесло',panel:'craft'};
  return {title:'Путь продолжается',text:'Исследуй долину, сражайся с разбойниками и переживай ночи в своём лагере.',progress:`Ночей пережито: ${this.nights} · Мест ${this.discovered.size}/${REGIONS.length}`,action:'Карта',panel:'map'};
 }
}
