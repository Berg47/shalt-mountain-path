import {RECIPES,type RecipeId} from '../data/config';
import type {InventorySystem} from './InventorySystem';
import type {ExperienceSystem} from './ExperienceSystem';
export class CraftingSystem {
 constructor(public inventory:InventorySystem,public xp:ExperienceSystem){}
 owned(id:RecipeId){
  if(id==='bag')return this.inventory.bagLevel>=2;
  if(id==='bag3')return this.inventory.bagLevel>=3;
  if(id==='shalt2')return this.inventory.shaltLevel>=2;
  if(id==='shalt3')return this.inventory.shaltLevel>=3;
  return this.inventory.tools.includes(id);
 }
 craft(id:RecipeId){
  const r=RECIPES[id];if(this.owned(id))return 'Уже изготовлено';
  if(r.requires&&!this.inventory.tools.includes(r.requires))return 'Сначала изготовь топор';
  if(id==='bag3'&&this.inventory.bagLevel<2)return 'Сначала изготовь кожаную сумку II';
  if(id==='shalt3'&&this.inventory.shaltLevel<2)return 'Сначала улучши шалт до II уровня';
  if(!this.inventory.pay(r.cost))return 'Не хватает ресурсов';
  if(id==='bag'){this.inventory.bag=true;this.inventory.bagLevel=2;}
  else if(id==='bag3'){this.inventory.bag=true;this.inventory.bagLevel=3;}
  else if(id==='shalt2')this.inventory.shaltLevel=2;
  else if(id==='shalt3')this.inventory.shaltLevel=3;
  else{this.inventory.tools.push(id);this.inventory.equipped=id;}
  this.xp.award('craft:'+id,r.xp);return null;
 }
}
