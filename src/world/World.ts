import {SETTINGS,NODE_DATA,type NodeKind,type AnimalKind} from '../data/config';
export interface ResourceNode{id:number;kind:NodeKind;x:number;y:number;hits:number;depleted:boolean;regrow:number}
export interface Point{x:number;y:number}
export const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
export function seeded(seed:number){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export function riverX(y:number){return 2310+Math.sin(y/320)*125+Math.sin(y/145)*26;}
export function inRiver(x:number,y:number){return Math.abs(x-riverX(y))<57&&!(y>1500&&y<1610);}
export function onPath(x:number,y:number){return Math.abs(y-(1780-(x-620)*0.32+Math.sin(x/250)*40))<50&&x<2200;}
export class World {
 nodes:ResourceNode[]=[];
 animalSeeds:{kind:AnimalKind;x:number;y:number}[]=[];
 rand=seeded(SETTINGS.seed);
 constructor(){
  const add=(kind:NodeKind,x:number,y:number)=>{this.nodes.push({id:this.nodes.length,kind,x,y,hits:0,depleted:false,regrow:0});};
  // An intentionally readable clearing: the first axe is under a minute away.
  add('branch',1325,1500);add('branch',1362,1522);add('pebble',1380,1460);add('berry',1207,1503);add('grass',1425,1562);add('tree',1465,1400);add('rock',1510,1528);add('pebble',1400,1640);add('pebble',1505,1600);add('pebble',1530,1455);
  for(let i=0;i<850;i++){
   const x=150+this.rand()*3100,y=180+this.rand()*2220;
   if(distance({x,y},SETTINGS.start)<200||inRiver(x,y)||Math.abs(x-riverX(y))<100||onPath(x,y))continue;
   if(x<950&&y>1630)continue;
   const r=this.rand();const dense=(x>2500&&y<1350)||(y<1250&&x>1100&&x<2000);const rockZone=y<650||x<750;
   let kind:NodeKind= r<(dense?.56:rockZone?.08:.23)?(y<1000?'pine':'tree'):r<.62?(rockZone?'rock':'grass'):r<.73?'branch':r<.84?'pebble':r<.94?'berry':'rock';
   if(this.nodes.some(n=>distance(n,{x,y})<(NODE_DATA[kind].radius?62:35)))continue;
   add(kind,x,y);
  }
  this.animalSeeds=[{kind:'hare',x:1550,y:1780},{kind:'hare',x:1480,y:1870},{kind:'hare',x:1700,y:1800},{kind:'hare',x:1870,y:1390},{kind:'hare',x:1020,y:1450},{kind:'hare',x:2640,y:1660},{kind:'hare',x:2900,y:1390},{kind:'hare',x:1150,y:900},{kind:'boar',x:1710,y:890},{kind:'boar',x:1960,y:1080},{kind:'boar',x:2770,y:990},{kind:'boar',x:2820,y:1880}];
 }
 blocked(x:number,y:number,radius=13,ignoreNode=-1){
  if(x<100||y<150||x>3300||y>2490||inRiver(x,y))return true;
  // Solid village towers and the closed cave mouth.
  if(distance({x,y},{x:600,y:1730})<radius+50||distance({x,y},{x:810,y:1810})<radius+44)return true;
  if(x>1610&&x<1810&&y<310)return true;
  return this.nodes.some(n=>!n.depleted&&n.id!==ignoreNode&&NODE_DATA[n.kind].radius>0&&distance(n,{x,y})<NODE_DATA[n.kind].radius+radius);
 }
}
