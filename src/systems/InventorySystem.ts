import {SETTINGS,type ResourceId,type Cost,type ToolId,type EquipmentSlot,type EquipmentId} from '../data/config';
export interface Stack {id:ResourceId;count:number}
export class InventorySystem {
 slots:Stack[]=[];
 tools:ToolId[]=['shalt'];
 equipped:ToolId='shalt';
 bag=false;bagLevel=1;shaltLevel=1;
 equipment:Record<EquipmentSlot,EquipmentId|null>={weapon:'shalt',headwear:null,clothing:null,mantle:null,shoes:null,belt:null};
 get capacity(){return SETTINGS.inventory.bagSlots[Math.max(0,Math.min(2,this.bagLevel-1))];}
 count(id:ResourceId){return this.slots.filter(s=>s.id===id).reduce((n,s)=>n+s.count,0);}
 canAfford(cost:Cost){return Object.entries(cost).every(([id,n])=>this.count(id as ResourceId)>=n!);}
 canAdd(id:ResourceId,count:number){return this.freeFor(id)>=count;}
 freeFor(id:ResourceId){return (this.capacity-this.slots.length)*SETTINGS.inventory.stack+this.slots.filter(s=>s.id===id).reduce((n,s)=>n+SETTINGS.inventory.stack-s.count,0);}
 add(id:ResourceId,count:number){
  if(!Number.isInteger(count)||count<1||!this.canAdd(id,count))return false;
  let left=count;
  for(const s of this.slots){if(s.id!==id)continue;const n=Math.min(left,SETTINGS.inventory.stack-s.count);s.count+=n;left-=n;}
  while(left){const n=Math.min(left,SETTINGS.inventory.stack);this.slots.push({id,count:n});left-=n;}
  return true;
 }
 remove(id:ResourceId,count:number){
  if(!Number.isInteger(count)||count<1||this.count(id)<count)return false;
  let left=count;
  for(let i=this.slots.length-1;i>=0&&left;i--){const s=this.slots[i];if(s.id!==id)continue;const n=Math.min(left,s.count);s.count-=n;left-=n;if(!s.count)this.slots.splice(i,1);}
  return true;
 }
 pay(cost:Cost){if(!this.canAfford(cost))return false;for(const [id,n]of Object.entries(cost))this.remove(id as ResourceId,n!);return true;}
 equipWearable(id:'wolfMantle'|'whitePapakha'){return this.equipItem(id==='whitePapakha'?'headwear':'mantle',id);}
 equipItem(slot:EquipmentSlot,id:EquipmentId){
  if(slot==='weapon'){
   if(!this.tools.includes(id as ToolId))return false;
   this.equipped=id as ToolId;this.equipment.weapon=id;return true;
  }
  if(slot==='mantle'){
   if(id!=='wolfMantle'||!this.count('wolfMantle'))return false;
   this.equipment.mantle=id;return true;
  }
  if(slot==='headwear'){
   if(id!=='whitePapakha'||!this.count('whitePapakha'))return false;
   this.equipment.headwear=id;return true;
  }
  return false;
 }
 unequip(slot:EquipmentSlot){if(slot==='weapon')return false;this.equipment[slot]=null;return true;}
 snapshot(){return {slots:this.slots.map(s=>({...s})),tools:[...this.tools],equipped:this.equipped,bag:this.bag,bagLevel:this.bagLevel,shaltLevel:this.shaltLevel,equipment:{...this.equipment}};}
}
