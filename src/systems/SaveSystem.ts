import {SETTINGS,ITEMS,ANIMALS,ENEMIES,type ToolId,type EquipmentSlot} from '../data/config';
import type {GameModel} from './GameModel';

export const SAVE_KEY='shalt.mountain-path.v1';
export const SAVE_BACKUP_KEY='shalt.mountain-path.v1.backup';
const EQUIPMENT_SLOTS:EquipmentSlot[]=['weapon','headwear','clothing','mantle','shoes']; // belt is optional for older saves

export class SaveSystem {
 static progressScore(d:any){return (Number(d?.level)||0)*1e12+(Number(d?.day?.day)||0)*1e9+(Number(d?.experience?.total)||0);}
 static raw(key:string){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
 static save(model:GameModel){
  try{
   const payload=this.pack(model),current=this.raw(SAVE_KEY),backup=this.raw(SAVE_BACKUP_KEY);
   const candidates=[current,backup,payload].filter(Boolean);
   const best=candidates.sort((a,b)=>this.progressScore(b)-this.progressScore(a))[0];
   if(best)localStorage.setItem(SAVE_BACKUP_KEY,JSON.stringify(best));
   localStorage.setItem(SAVE_KEY,JSON.stringify(payload));return true;
  }catch{return false;}
 }
 static pack(m:GameModel){return {
  version:SETTINGS.version,savedAt:Date.now(),player:m.player.snapshot(),inventory:m.inventory.snapshot(),
  experience:{total:m.xp.total,actions:m.xp.actions},level:m.xp.level,age:m.age,location:m.location,
  progress:{
   adult:m.adult,trialNotified:m.trialNotified,bossDefeated:m.bossDefeated,
   caveFirstDefeated:m.caveFirstDefeated,caveLastDefeatDay:m.caveLastDefeatDay,caveNextAvailableDay:m.caveNextAvailableDay,
  },
  caveWolf:{x:m.caveWolf.x,y:m.caveWolf.y,hp:m.caveWolf.hp,state:m.caveWolf.state,loot:{...m.caveWolf.loot},respawn:m.caveWolf.respawn,kills:m.caveWolf.kills,active:m.caveWolf.active},
  buildings:m.buildings.objects.map(b=>({...b})),day:{time:m.day.time,day:m.day.day},
  weather:{kind:m.weather.kind,target:m.weather.target,elapsed:m.weather.elapsed,index:m.weather.index,blend:m.weather.blend},
  nodes:m.world.nodes.filter(n=>n.depleted||n.hits).map(n=>({id:n.id,hits:n.hits,depleted:n.depleted,regrow:n.regrow})),
  animals:m.animals.map(a=>({id:a.id,x:a.x,y:a.y,hp:a.hp,state:a.state,lootMeat:a.lootMeat,lootHide:a.lootHide,respawn:a.respawn})),
  enemies:m.enemies.map(e=>({id:e.id,kind:e.kind,x:e.x,y:e.y,hp:e.hp,state:e.state,loot:{...e.loot},respawn:e.respawn,kills:e.kills,active:e.active})),
  discovered:[...m.discovered],elapsed:m.elapsed,nights:m.nights,
 };}
 static read(){const main=this.validate(this.raw(SAVE_KEY));if(main)return main;const backup=this.validate(this.raw(SAVE_BACKUP_KEY));return backup;}
 static readBackup(){return this.validate(this.raw(SAVE_BACKUP_KEY));}
 static backupIsAhead(){const main=this.validate(this.raw(SAVE_KEY)),backup=this.readBackup();return !!backup&&(!main||this.progressScore(backup)>this.progressScore(main));}
 static restoreBackup(){const backup=this.readBackup();if(!backup)return null;try{localStorage.setItem(SAVE_KEY,JSON.stringify(backup));return backup;}catch{return null;}}
 static validate(value:unknown):ReturnType<typeof SaveSystem.pack>|null{
  if(!value||typeof value!=='object')return null;const d=value as any;
  const number=(x:unknown,min:number,max:number)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
  if(d.version!==1||!d.player||!d.inventory||!d.experience||!d.day||!d.weather)return null;
  if(!number(d.player.x,100,3300)||!number(d.player.y,150,2490)||!number(d.player.health,0,350)||!number(d.player.hunger,0,100)||!number(d.player.stamina,0,350)||!number(d.player.temperature,30,42))return null;
  const bagLevel=Number.isInteger(d.inventory.bagLevel)?d.inventory.bagLevel:(d.inventory.bag?2:1);
  if(!number(bagLevel,1,3))return null;
  const cap=SETTINGS.inventory.bagSlots[bagLevel-1];
  if(typeof d.inventory.bag!=='boolean'||!Array.isArray(d.inventory.slots)||d.inventory.slots.length>cap||!d.inventory.slots.every((s:any)=>s&&s.id in ITEMS&&number(s.count,1,20)&&Number.isInteger(s.count)))return null;
  const validTools=['shalt','axe','pickaxe'] as ToolId[];
  if(!Array.isArray(d.inventory.tools)||!d.inventory.tools.includes('shalt')||!d.inventory.tools.every((t:ToolId)=>validTools.includes(t))||new Set(d.inventory.tools).size!==d.inventory.tools.length||!d.inventory.tools.includes(d.inventory.equipped))return null;
  if(d.inventory.shaltLevel!==undefined&&!number(d.inventory.shaltLevel,1,3))return null;
  if(d.inventory.equipment!==undefined){
   const eq=d.inventory.equipment;if(!eq||typeof eq!=='object'||Array.isArray(eq))return null;
   for(const slot of EQUIPMENT_SLOTS)if(!(slot in eq))return null;
   if(eq.weapon!==null&&!validTools.includes(eq.weapon))return null;
   if(eq.headwear!==null||eq.clothing!==null||eq.shoes!==null)return null;
   if(eq.belt!==undefined&&eq.belt!==null)return null;
   if(eq.mantle!==null&&eq.mantle!=='wolfMantle')return null;
  }
  if(!number(d.experience.total,0,1e9)||!d.experience.actions||typeof d.experience.actions!=='object'||Array.isArray(d.experience.actions)||!Object.values(d.experience.actions).every(n=>number(n,0,1e9)))return null;
  if(!number(d.day.time,0,1)||!number(d.day.day,1,1e7)||!number(d.elapsed,0,1e9)||!number(d.nights,0,1e7))return null;
  if(!['clear','rain','snow'].includes(d.weather.kind)||!['clear','rain','snow'].includes(d.weather.target)||!number(d.weather.elapsed,0,200)||!number(d.weather.index,0,1e8)||!number(d.weather.blend,0,1))return null;
  if(!Array.isArray(d.buildings)||d.buildings.length>200||!d.buildings.every((b:any)=>['fire','canopy','hut','workbench'].includes(b.kind)&&number(b.x,100,3300)&&number(b.y,150,2490)&&number(b.id,1,201)&&number(b.born,0,1e9)))return null;
  if(!Array.isArray(d.nodes)||d.nodes.length>1000||!d.nodes.every((n:any)=>Number.isInteger(n.id)&&number(n.id,0,1000)&&number(n.hits,0,3)&&typeof n.depleted==='boolean'&&number(n.regrow,0,1000)))return null;
  if(!Array.isArray(d.animals)||d.animals.length>20||!d.animals.every((a:any)=>number(a.id,0,30)&&number(a.x,70,3330)&&number(a.y,120,2520)&&number(a.hp,-100,ANIMALS.boar.hp)&&['wander','flee','windup','charge','recover','dead'].includes(a.state)&&number(a.lootMeat,0,3)&&number(a.lootHide,0,2)&&number(a.respawn,0,1000)))return null;
  if(d.enemies!==undefined){
   if(!Array.isArray(d.enemies)||d.enemies.length>20)return null;
   for(const e of d.enemies){
    if(!number(e.id,0,30)||!ENEMIES[e.kind as keyof typeof ENEMIES]||e.kind==='wolf'||!number(e.x,70,3330)||!number(e.y,120,2520)||!number(e.hp,0,ENEMIES[e.kind as keyof typeof ENEMIES].hp)||!['idle','chase','windup','recover','dead'].includes(e.state)||!number(e.respawn,0,2000)||!number(e.kills,0,1e6)||typeof e.active!=='boolean')return null;
    if(!e.loot||typeof e.loot!=='object'||Array.isArray(e.loot))return null;
    for(const [id,n] of Object.entries(e.loot)){if(!(id in ITEMS)||!number(n,0,100))return null;}
   }
  }
  if(d.location!==undefined&&!['world','cave'].includes(d.location))return null;
  if(d.caveWolf!==undefined){
   const w=d.caveWolf;
   if(!w||!number(w.x,100,3300)||!number(w.y,150,2490)||!number(w.hp,0,ENEMIES.wolf.hp)||!['idle','chase','windup','recover','dead'].includes(w.state)||!number(w.respawn,0,1e7)||!number(w.kills,0,1e6)||typeof w.active!=='boolean'||!w.loot||typeof w.loot!=='object'||Array.isArray(w.loot))return null;
   for(const [id,n]of Object.entries(w.loot)){if(!(id in ITEMS)||!number(n,0,100))return null;}
  }
  if(d.progress!==undefined){
   if(!d.progress||typeof d.progress!=='object'||typeof d.progress.adult!=='boolean'||typeof d.progress.trialNotified!=='boolean'||typeof d.progress.bossDefeated!=='boolean')return null;
   for(const key of ['caveLastDefeatDay','caveNextAvailableDay'])if(d.progress[key]!==undefined&&!number(d.progress[key],0,1e7))return null;
   if(d.progress.caveFirstDefeated!==undefined&&typeof d.progress.caveFirstDefeated!=='boolean')return null;
  }
  if(!Array.isArray(d.discovered)||!d.discovered.every((s:any)=>typeof s==='string'))return null;
  return d as ReturnType<typeof SaveSystem.pack>;
 }
 static restore(m:GameModel,d:ReturnType<typeof SaveSystem.pack>){
  const data=d as any;
  Object.assign(m.player,data.player);m.inventory.slots=data.inventory.slots.map((s:any)=>({...s}));m.inventory.tools=[...data.inventory.tools];m.inventory.equipped=data.inventory.equipped;
  m.inventory.bagLevel=Number.isInteger(data.inventory.bagLevel)?data.inventory.bagLevel:(data.inventory.bag?2:1);m.inventory.bag=m.inventory.bagLevel>1;m.inventory.shaltLevel=Number.isInteger(data.inventory.shaltLevel)?data.inventory.shaltLevel:1;
  if(data.inventory.equipment)m.inventory.equipment={...m.inventory.equipment,...data.inventory.equipment};else m.inventory.equipment.weapon='shalt';
  m.xp.total=data.experience.total;m.xp.actions={...data.experience.actions};m.buildings.objects=data.buildings.map((b:any)=>({...b}));
  Object.assign(m.day,data.day);Object.assign(m.weather,data.weather);
  for(const saved of data.nodes){const node=m.world.nodes[saved.id];if(node)Object.assign(node,saved);}
  for(const saved of data.animals){const animal=m.animals.find(a=>a.id===saved.id);if(animal){Object.assign(animal,saved);if(animal.state!=='dead'){animal.state='wander';animal.timer=1;}}}
  if(Array.isArray(data.enemies))for(const saved of data.enemies){const enemy=m.enemies.find(e=>e.id===saved.id&&e.kind===saved.kind);if(enemy){Object.assign(enemy,saved);enemy.loot={...saved.loot};if(enemy.state!=='dead'){enemy.state='idle';enemy.timer=0;}}}
  m.adult=!!data.progress?.adult;m.trialNotified=!!data.progress?.trialNotified;m.bossDefeated=!!data.progress?.bossDefeated;
  m.caveFirstDefeated=!!data.progress?.caveFirstDefeated;m.caveLastDefeatDay=Number(data.progress?.caveLastDefeatDay)||0;m.caveNextAvailableDay=Number(data.progress?.caveNextAvailableDay)||0;
  m.location=data.location==='cave'?'cave':'world';
  if(data.caveWolf){Object.assign(m.caveWolf,data.caveWolf);m.caveWolf.loot={...data.caveWolf.loot};if(m.caveWolf.state!=='dead'){m.caveWolf.state='idle';m.caveWolf.timer=0;}}
  m.discovered=new Set(data.discovered);m.elapsed=data.elapsed;m.nights=data.nights;
  if(m.blocked(m.player.x,m.player.y)){
   let found=false;for(let r=20;r<=260&&!found;r+=20)for(let a=0;a<Math.PI*2;a+=.4){const x=data.player.x+Math.cos(a)*r,y=data.player.y+Math.sin(a)*r;if(!m.blocked(x,y)){m.player.x=x;m.player.y=y;found=true;break;}}
   if(!found){m.location='world';m.player.x=SETTINGS.start.x;m.player.y=SETTINGS.start.y;}
  }
 }
}
