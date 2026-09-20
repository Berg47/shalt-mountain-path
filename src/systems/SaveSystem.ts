import {SETTINGS,ITEMS,ANIMALS,type ToolId} from '../data/config';
import type {GameModel} from './GameModel';
import {AgeSystem} from './AgeSystem';

export const SAVE_KEY='shalt.mountain-path.v1';
export class SaveSystem {
 static save(model:GameModel){
  try{const payload=this.pack(model);localStorage.setItem(SAVE_KEY,JSON.stringify(payload));return true;}catch{return false;}
 }
 static pack(m:GameModel){return {
  version:SETTINGS.version,savedAt:Date.now(),player:m.player.snapshot(),inventory:m.inventory.snapshot(),
  experience:{total:m.xp.total,actions:m.xp.actions},level:m.xp.level,age:AgeSystem.fromLevel(m.xp.level),
  buildings:m.buildings.objects.map(b=>({...b})),day:{time:m.day.time,day:m.day.day},
  weather:{kind:m.weather.kind,target:m.weather.target,elapsed:m.weather.elapsed,index:m.weather.index,blend:m.weather.blend},
  nodes:m.world.nodes.filter(n=>n.depleted||n.hits).map(n=>({id:n.id,hits:n.hits,depleted:n.depleted,regrow:n.regrow})),
  animals:m.animals.map(a=>({id:a.id,x:a.x,y:a.y,hp:a.hp,state:a.state,lootMeat:a.lootMeat,lootHide:a.lootHide,respawn:a.respawn})),
  discovered:[...m.discovered],elapsed:m.elapsed,nights:m.nights,
 };}
 static read(){try{return this.validate(JSON.parse(localStorage.getItem(SAVE_KEY)||'null'));}catch{return null;}}
 static validate(value:unknown):ReturnType<typeof SaveSystem.pack>|null{
  if(!value||typeof value!=='object')return null;const d=value as ReturnType<typeof SaveSystem.pack>;
  const number=(x:unknown,min:number,max:number)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
  if(d.version!==1||!d.player||!d.inventory||!d.experience||!d.day||!d.weather)return null;
  if(!number(d.player.x,100,3300)||!number(d.player.y,150,2490)||!number(d.player.health,0,100)||!number(d.player.hunger,0,100)||!number(d.player.stamina,0,100)||!number(d.player.temperature,30,42))return null;
  const cap=d.inventory.bag?SETTINGS.inventory.bagSlots:SETTINGS.inventory.slots;
  if(typeof d.inventory.bag!=='boolean'||!Array.isArray(d.inventory.slots)||d.inventory.slots.length>cap||!d.inventory.slots.every(s=>s&&s.id in ITEMS&&number(s.count,1,20)&&Number.isInteger(s.count)))return null;
  const validTools=['shalt','axe','pickaxe'] as ToolId[];
  if(!Array.isArray(d.inventory.tools)||!d.inventory.tools.includes('shalt')||!d.inventory.tools.every(t=>validTools.includes(t))||new Set(d.inventory.tools).size!==d.inventory.tools.length||!d.inventory.tools.includes(d.inventory.equipped))return null;
  if(!number(d.experience.total,0,1e8)||!d.experience.actions||typeof d.experience.actions!=='object'||Array.isArray(d.experience.actions)||!Object.values(d.experience.actions).every(n=>number(n,0,1e8)))return null;
  if(!number(d.day.time,0,1)||!number(d.day.day,1,1e7)||!number(d.elapsed,0,1e9)||!number(d.nights,0,1e7))return null;
  if(!['clear','rain','snow'].includes(d.weather.kind)||!['clear','rain','snow'].includes(d.weather.target)||!number(d.weather.elapsed,0,200)||!number(d.weather.index,0,1e8)||!number(d.weather.blend,0,1))return null;
  if(!Array.isArray(d.buildings)||d.buildings.length>200||!d.buildings.every(b=>['fire','canopy','hut'].includes(b.kind)&&number(b.x,100,3300)&&number(b.y,150,2490)&&number(b.id,1,201)&&number(b.born,0,1e9)))return null;
  if(!Array.isArray(d.nodes)||d.nodes.length>1000||!d.nodes.every(n=>Number.isInteger(n.id)&&number(n.id,0,1000)&&number(n.hits,0,3)&&typeof n.depleted==='boolean'&&number(n.regrow,0,1000)))return null;
  if(!Array.isArray(d.animals)||d.animals.length>20||!d.animals.every(a=>number(a.id,0,30)&&number(a.x,70,3330)&&number(a.y,120,2520)&&number(a.hp,-100,ANIMALS.boar.hp)&&['wander','flee','windup','charge','recover','dead'].includes(a.state)&&number(a.lootMeat,0,3)&&number(a.lootHide,0,2)&&number(a.respawn,0,1000)))return null;
  if(!Array.isArray(d.discovered)||!d.discovered.every(s=>typeof s==='string'))return null;
  return d;
 }
 static restore(m:GameModel,d:ReturnType<typeof SaveSystem.pack>){
  Object.assign(m.player,d.player);m.inventory.slots=d.inventory.slots.map(s=>({...s}));m.inventory.tools=[...d.inventory.tools];m.inventory.equipped=d.inventory.equipped;m.inventory.bag=d.inventory.bag;
  m.xp.total=d.experience.total;m.xp.actions={...d.experience.actions};m.buildings.objects=d.buildings.map(b=>({...b}));
  Object.assign(m.day,d.day);Object.assign(m.weather,d.weather);
  for(const saved of d.nodes){const node=m.world.nodes[saved.id];if(node)Object.assign(node,saved);}
  for(const saved of d.animals){const animal=m.animals.find(a=>a.id===saved.id);if(animal){Object.assign(animal,saved);if(animal.state!=='dead'){animal.state='wander';animal.timer=1;}}}
  m.discovered=new Set(d.discovered);m.elapsed=d.elapsed;m.nights=d.nights;
  // A new balance version may move obstacles. Restore to a nearby safe tile.
  if(m.blocked(m.player.x,m.player.y)){
   let found=false;for(let r=20;r<=260&&!found;r+=20)for(let a=0;a<Math.PI*2;a+=.4){const x=d.player.x+Math.cos(a)*r,y=d.player.y+Math.sin(a)*r;if(!m.blocked(x,y)){m.player.x=x;m.player.y=y;found=true;break;}}
   if(!found){m.player.x=SETTINGS.start.x;m.player.y=SETTINGS.start.y;}
  }
 }
}
