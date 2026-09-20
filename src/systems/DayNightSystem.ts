import {SETTINGS} from '../data/config';
export class DayNightSystem {
 time:number=SETTINGS.startTime;day=1;
 update(dt:number){const before=this.time;this.time+=dt/SETTINGS.daySeconds;if(this.time>=1){this.time%=1;this.day++;}return before<6/24&&this.time>=6/24;}
 get hour(){return this.time*24;}
 get night(){return this.hour<6||this.hour>=19;}
 get phase(){const h=this.hour;return h<6?'Ночь':h<10?'Утро':h<17?'День':h<20?'Вечер':'Ночь';}
 get darkness(){const h=this.hour;return h<5?0.57:h<8?0.57*(8-h)/3:h<17?0:h<21?0.57*(h-17)/4:0.57;}
 get clock(){return `${Math.floor(this.hour).toString().padStart(2,'0')}:${Math.floor(this.hour%1*60).toString().padStart(2,'0')}`;}
}
