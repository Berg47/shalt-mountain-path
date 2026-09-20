import {SETTINGS} from '../data/config';
export class AgeSystem { static fromLevel(level:number){let age=15;for(const threshold of SETTINGS.ages)if(level>=threshold.level)age=threshold.age;return age;} }
