import {ENEMIES,type EnemyKind,type ResourceId} from '../data/config';
import {distance,type Point} from '../world/World';

export type EnemyState='idle'|'chase'|'windup'|'recover'|'dead';
export type EnemyLoot=Partial<Record<ResourceId,number>>;

export class Enemy {
 hp:number;maxHp:number;state:EnemyState='idle';timer=0;cooldown=0;facing=1;walk=0;respawn=0;active=true;kills=0;loot:EnemyLoot={};
 home:Point;
 constructor(public id:number,public kind:EnemyKind,public x:number,public y:number){
  const c=ENEMIES[kind];this.hp=this.maxHp=c.hp;this.home={x,y};this.active=kind!=='chaborz';
 }
 get alive(){return this.state!=='dead';}
 hit(damage:number,player:Point){
  if(this.state==='dead'||!this.active)return {killed:false,damage:0};
  let actual=damage;
  if(this.kind==='shield'){
   const playerInFront=(player.x>=this.x&&this.facing>0)||(player.x<this.x&&this.facing<0);
   if(playerInFront)actual=Math.max(1,Math.round(damage*.48));
  }else if(this.kind==='chaborz')actual=Math.max(1,Math.round(damage*.84));
  else if(this.kind==='wolf')actual=Math.max(1,Math.round(damage*.90));
  this.hp-=actual;
  if(this.hp<=0){this.hp=0;this.state='dead';this.respawn=0;this.kills++;return {killed:true,damage:actual};}
  this.state='chase';this.timer=0;return {killed:false,damage:actual};
 }
 update(dt:number,player:Point,blocked:(x:number,y:number)=>boolean,damage:(n:number)=>void){
  if(!this.active)return;
  if(this.state==='dead'){this.respawn+=dt;return;}
  const c=ENEMIES[this.kind],d=distance(this,player);
  this.cooldown=Math.max(0,this.cooldown-dt);this.timer-=dt;
  if(this.state==='idle'){
   if(d<c.aggro){this.state='chase';}
   else return;
  }
  if(this.state==='windup'){
   this.facing=player.x>=this.x?1:-1;
   if(this.timer<=0){
    if(d<c.range+18&&this.cooldown<=0){damage(c.damage);this.cooldown=this.kind==='chaborz'?2.2:this.kind==='wolf'?1.05:1.55;}
    this.state='recover';this.timer=this.kind==='chaborz'?.78:this.kind==='wolf'?.30:.45;
   }
   return;
  }
  if(this.state==='recover'){if(this.timer<=0)this.state=d<c.aggro*1.2?'chase':'idle';return;}
  if(d<c.range&&this.cooldown<=0){this.state='windup';this.timer=this.kind==='chaborz'?1.08:this.kind==='shield'?.68:this.kind==='wolf'?.24:.45;return;}
  if(d>c.aggro*1.75&&distance(this,this.home)>520){this.state='idle';return;}
  const angle=Math.atan2(player.y-this.y,player.x-this.x);const enraged=this.kind==='wolf'&&this.hp<this.maxHp*.35?1.24:1;const speed=c.speed*enraged*(d<c.range+45?.58:1);
  const nx=this.x+Math.cos(angle)*speed*dt,ny=this.y+Math.sin(angle)*speed*dt;
  if(!blocked(nx,this.y))this.x=nx;if(!blocked(this.x,ny))this.y=ny;
  this.walk+=dt*8;this.facing=Math.cos(angle)>=0?1:-1;
 }
 reset(){
  const c=ENEMIES[this.kind];this.x=this.home.x;this.y=this.home.y;this.hp=this.maxHp=c.hp;this.state='idle';this.timer=0;this.cooldown=0;this.respawn=0;this.loot={};this.active=true;
 }
}
