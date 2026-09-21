import {SETTINGS} from '../data/config';
export class AgeSystem {
 static fromLevel(level:number,adult=false){
  if(adult&&level>=20)return 18;
  let age=15;for(const threshold of SETTINGS.ages)if(level>=threshold.level)age=threshold.age;
  return Math.min(age,17);
 }
}
