import {SETTINGS} from '../data/config';
export class Player {
 x:number=SETTINGS.start.x;y:number=SETTINGS.start.y;facing=1;vx=0;vy=0;walk=0;
 health=100;stamina=100;hunger=90;temperature=36.8;invulnerable=0;attackTimer=0;actionTimer=0;
 update(dt:number,input:{x:number;y:number;sprint:boolean},blocked:(x:number,y:number)=>boolean){
  this.invulnerable=Math.max(0,this.invulnerable-dt);this.attackTimer=Math.max(0,this.attackTimer-dt);this.actionTimer=Math.max(0,this.actionTimer-dt);
  const moving=!!(input.x||input.y);const sprint=input.sprint&&moving&&this.stamina>5&&this.actionTimer===0;
  const speed=this.actionTimer?0:sprint?SETTINGS.player.sprint:SETTINGS.player.speed;
  const length=Math.hypot(input.x,input.y)||1;this.vx=input.x/length*speed;this.vy=input.y/length*speed;
  const steps=Math.max(1,Math.ceil(speed*dt/6));for(let i=0;i<steps;i++){const x=this.x+this.vx*dt/steps,y=this.y+this.vy*dt/steps;if(!blocked(x,this.y))this.x=x;if(!blocked(this.x,y))this.y=y;}
  if(input.x)this.facing=input.x>0?1:-1;if(moving)this.walk+=dt*(sprint?15:10);
  this.stamina=Math.max(0,Math.min(100,this.stamina+(sprint?-23:13)*dt));
 }
 damage(n:number){if(this.invulnerable>0)return false;this.health=Math.max(0,this.health-n);this.invulnerable=1.2;return true;}
 snapshot(){return {x:this.x,y:this.y,health:this.health,stamina:this.stamina,hunger:this.hunger,temperature:this.temperature};}
}
