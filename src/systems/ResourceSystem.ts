import {NODE_DATA,SETTINGS} from '../data/config';
import type {InventorySystem} from './InventorySystem';
import type {ExperienceSystem} from './ExperienceSystem';
import type {World,ResourceNode} from '../world/World';
export class ResourceSystem {
 constructor(public world:World,public inventory:InventorySystem,public xp:ExperienceSystem){}
 gather(node:ResourceNode){
  const def=NODE_DATA[node.kind];if(node.depleted)return {error:'Здесь пока ничего нет'};
  if(def.tool&&!this.inventory.tools.includes(def.tool))return {error:def.tool==='axe'?'Нужен каменный топор':'Нужна каменная кирка'};
  if(def.tool&&this.inventory.equipped!==def.tool){this.inventory.equipped=def.tool;}
  if(!this.inventory.canAdd(def.item,def.count))return {error:'Нет места. Съешь ягоды или освободи ячейку.'};
  node.hits++;if(node.hits<def.hits)return {hit:true};
  this.inventory.add(def.item,def.count);node.depleted=true;node.regrow=def.tool?900:270;
  this.xp.award('gather:'+def.item,SETTINGS.xp.repeat,SETTINGS.xp.first);
  return {item:def.item,count:def.count};
 }
 update(dt:number){for(const node of this.world.nodes){if(!node.depleted)continue;node.regrow-=dt;if(node.regrow<=0){node.depleted=false;node.hits=0;}}}
}
