import {RECIPES,type RecipeId} from '../data/config';
import type {InventorySystem} from './InventorySystem';
import type {ExperienceSystem} from './ExperienceSystem';
export class CraftingSystem {
 constructor(public inventory:InventorySystem,public xp:ExperienceSystem){}
 owned(id:RecipeId){return id==='bag'?this.inventory.bag:this.inventory.tools.includes(id);}
 craft(id:RecipeId){const r=RECIPES[id];if(this.owned(id))return 'Уже изготовлено';if(r.requires&&!this.inventory.tools.includes(r.requires))return 'Сначала изготовь топор';if(!this.inventory.pay(r.cost))return 'Не хватает ресурсов';if(id==='bag')this.inventory.bag=true;else{this.inventory.tools.push(id);this.inventory.equipped=id;}this.xp.award('craft:'+id,r.xp);return null;}
}
