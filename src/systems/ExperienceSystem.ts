import {SETTINGS} from '../data/config';
export class ExperienceSystem {
 total=0; actions:Record<string,number>={};
 get level(){let level=1;for(let i=1;i<SETTINGS.levels.length;i++)if(this.total>=SETTINGS.levels[i])level=i+1;return level;}
 get floor(){return SETTINGS.levels[this.level-1];}
 get next(){return SETTINGS.levels[this.level]??this.floor+25000;}
 award(key:string,base:number,firstBonus=0){const count=this.actions[key]??0;this.actions[key]=count+1;const multiplier=Math.max(SETTINGS.xp.repeatFloor,1/(1+Math.floor(count/SETTINGS.xp.repeatEvery)*0.45));const amount=Math.round(base*multiplier+(count===0?firstBonus:0));this.total+=amount;return amount;}
}
