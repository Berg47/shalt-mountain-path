import {ANIMALS,type AnimalKind} from '../data/config';
import {distance,type Point} from '../world/World';
export class Animal {
 hp:number;state:'wander'|'flee'|'windup'|'charge'|'recover'|'dead'='wander';timer=0;angle=0;facing=1;walk=0;cooldown=0;lootMeat:number;lootHide:number;
 home:Point;charge:Point={x:0,y:0};respawn=0;
 constructor(public id:number,public kind:AnimalKind,public x:number,public y:number){const c=ANIMALS[kind];this.hp=c.hp;this.home={x,y};this.angle=id*2.4;this.lootMeat=c.meat;this.lootHide=c.hide;}
 hit(damage:number,player:Point){if(this.state==='dead')return false;this.hp-=damage;if(this.hp<=0){this.state='dead';return true;}const passive=this.kind!=='boar';this.state=passive?'flee':'windup';this.timer=passive?2.4:0.8;this.angle=Math.atan2(this.y-player.y,this.x-player.x);return false;}
 update(dt:number,player:Point,blocked:(x:number,y:number)=>boolean,fire:(p:Point)=>boolean,damage:(n:number)=>void){
  if(this.state==='dead')return;
  const c=ANIMALS[this.kind],d=distance(this,player);this.timer-=dt;this.cooldown=Math.max(0,this.cooldown-dt);
  if((this.kind==='hare'||this.kind==='deer')&&d<(this.kind==='deer'?185:130)&&this.state!=='flee'){this.state='flee';this.timer=this.kind==='deer'?2.2:1.5;this.angle=Math.atan2(this.y-player.y,this.x-player.x);}
  if(this.kind==='boar'&&d<180&&this.state==='wander'&&!fire(player)){this.state='windup';this.timer=.85;}
  if(fire(this)&&this.state!=='flee'){this.state='flee';this.timer=2;this.angle=Math.atan2(this.y-player.y,this.x-player.x);}
  let speed=c.speed;
  if(this.state==='windup'){
   speed=0;this.angle=Math.atan2(player.y-this.y,player.x-this.x);
   if(this.timer<=0){this.state='charge';this.timer=.8;this.charge={x:Math.cos(this.angle),y:Math.sin(this.angle)};}
  }else if(this.state==='charge'){
   speed=c.flee;if(d<42&&this.cooldown===0){damage(c.damage);this.cooldown=1.8;this.state='recover';this.timer=1.4;}
   if(this.timer<=0){this.state='recover';this.timer=1.2;}
  }else if(this.state==='recover'){speed=0;if(this.timer<=0)this.state='wander';}
  else if(this.state==='flee'){speed=c.flee;if(this.timer<=0){this.state='wander';this.timer=1.5;}}
  else if(this.timer<=0){this.timer=2+(Math.sin(this.id+this.walk)+1)*1.5;this.angle+=1.3;if(distance(this,this.home)>360)this.angle=Math.atan2(this.home.y-this.y,this.home.x-this.x);}
  if(this.state==='wander'&&Math.sin(this.walk/2+this.id)>.35)speed=0;
  const x=this.x+Math.cos(this.angle)*speed*dt,y=this.y+Math.sin(this.angle)*speed*dt;
  if(!blocked(x,this.y))this.x=x;else this.angle+=1.6;if(!blocked(this.x,y))this.y=y;else this.angle-=1.2;
  if(speed){this.walk+=dt*9;this.facing=Math.cos(this.angle)>0?1:-1;}
 }
}
