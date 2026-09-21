import {BUILDINGS,type BuildingId} from '../data/config';
import {distance,type World,type Point} from '../world/World';
import type {InventorySystem} from './InventorySystem';
import type {ExperienceSystem} from './ExperienceSystem';
export interface BuiltObject extends Point {id:number;kind:BuildingId;born:number}
export class BuildingSystem {
 objects:BuiltObject[]=[];
 constructor(public world:World,public inventory:InventorySystem,public xp:ExperienceSystem){}
 valid(kind:BuildingId,x:number,y:number,player:Point){const r=BUILDINGS[kind].radius;return distance({x,y},player)<210&&distance({x,y},player)>r+18&&!this.world.blocked(x,y,r)&&!this.objects.some(b=>distance(b,{x,y})<BUILDINGS[b.kind].radius+r+20);}
 place(kind:BuildingId,x:number,y:number,player:Point){
  if(!this.valid(kind,x,y,player))return 'Выбери свободное место рядом с собой';
  if(!this.inventory.pay(BUILDINGS[kind].cost))return 'Не хватает ресурсов';
  this.objects.push({id:this.objects.length+1,kind,x,y,born:0});this.xp.award('build:'+kind,BUILDINGS[kind].xp,10);return null;
 }
 nearFire(p:Point){return this.objects.some(b=>b.kind==='fire'&&distance(b,p)<170);}
 shelter(p:Point){return this.objects.find(b=>(b.kind==='canopy'||b.kind==='hut')&&distance(b,p)<115);}
 nearWorkbench(p:Point){return this.objects.some(b=>b.kind==='workbench'&&distance(b,p)<125);}
 blocked(x:number,y:number,r=13){return this.objects.some(b=>b.kind!=='fire'&&distance(b,{x,y})<BUILDINGS[b.kind].radius+r);}
}
