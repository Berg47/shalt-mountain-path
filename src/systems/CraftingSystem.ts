import {RECIPES,type RecipeId} from '../data/config';
import type {InventorySystem} from './InventorySystem';
import type {ExperienceSystem} from './ExperienceSystem';

const BAG_RECIPE_LEVEL:Partial<Record<RecipeId,number>>={bag:2,bag3:3,bag4:4,bag5:5,bag6:6};
export class CraftingSystem {
 constructor(public inventory:InventorySystem,public xp:ExperienceSystem){}
 owned(id:RecipeId){
  const bagLevel=BAG_RECIPE_LEVEL[id];if(bagLevel)return this.inventory.bagLevel>=bagLevel;
  if(id==='shalt2')return this.inventory.shaltLevel>=2;
  if(id==='shalt3')return this.inventory.shaltLevel>=3;
  return this.inventory.tools.includes(id);
 }
 craft(id:RecipeId){
  const r=RECIPES[id];if(this.owned(id))return 'Уже изготовлено';
  if(r.requires&&!this.inventory.tools.includes(r.requires))return 'Сначала изготовь топор';
  const targetBagLevel=BAG_RECIPE_LEVEL[id];
  if(targetBagLevel&&this.inventory.bagLevel<targetBagLevel-1)return `Сначала улучши сумку до ${targetBagLevel-1} уровня`;
  if(id==='shalt3'&&this.inventory.shaltLevel<2)return 'Сначала улучши шалт до II уровня';
  if(!this.inventory.pay(r.cost))return 'Не хватает ресурсов';
  if(targetBagLevel){this.inventory.bag=true;this.inventory.bagLevel=targetBagLevel;}
  else if(id==='shalt2')this.inventory.shaltLevel=2;
  else if(id==='shalt3')this.inventory.shaltLevel=3;
  else{this.inventory.tools.push(id);this.inventory.equipped=id;}
  this.xp.award('craft:'+id,r.xp);return null;
 }
}
