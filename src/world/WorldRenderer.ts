import Phaser from 'phaser';
import {SETTINGS,NODE_DATA,ENEMIES,type BuildingId} from '../data/config';
import {seeded,riverX,distance,type World} from './World';
import type {GameModel,GameEvent} from '../systems/GameModel';

const FRAMES:Record<string,[number,number,number,number]>={
 tree:[17,9,290,307],pine:[360,3,218,314],rock:[643,89,273,211],berry:[953,29,289,274],grass:[18,346,265,252],branch:[325,366,286,220],pebble:[660,412,248,150],wood:[952,367,291,215],
 fire:[45,643,233,224],canopy:[321,626,295,276],hut:[637,618,290,293],cabin:[951,619,283,279],hero:[87,890,145,343],hare:[355,931,199,272],boar:[635,964,279,243],tower:[979,902,225,338],
};
const heights:Record<string,number>={tree:225,pine:262,rock:80,berry:61,grass:32,branch:25,pebble:24,wood:34,fire:69,canopy:122,hut:154,workbench:72,cabin:150,hero:78,hare:37,boar:68,tower:310};
function makeWorkbenchTexture(scene:Phaser.Scene){
 if(scene.textures.exists('workbench'))return;
 const t=scene.textures.createCanvas('workbench',140,100)!;const c=t.getContext();
 c.clearRect(0,0,140,100);c.fillStyle='#493728';c.fillRect(18,38,104,18);c.fillStyle='#6e5339';c.fillRect(14,31,112,12);
 c.fillStyle='#3a2b21';c.fillRect(24,50,10,42);c.fillRect(106,50,10,42);c.fillRect(54,51,7,35);c.fillRect(80,51,7,35);
 c.strokeStyle='#a2a08c';c.lineWidth=4;c.beginPath();c.moveTo(42,29);c.lineTo(62,12);c.moveTo(60,13);c.lineTo(67,24);c.stroke();
 c.strokeStyle='#797567';c.lineWidth=5;c.beginPath();c.moveTo(92,14);c.lineTo(103,31);c.stroke();t.refresh();
}
function makeEnemyTexture(scene:Phaser.Scene,kind:'dagger'|'shield'|'chaborz'){
 const key='enemy-'+kind;if(scene.textures.exists(key))return;
 const boss=kind==='chaborz',w=boss?190:150,h=boss?270:220,t=scene.textures.createCanvas(key,w,h)!;const c=t.getContext(),cx=w/2;
 c.clearRect(0,0,w,h);
 // Boots and legs.
 c.fillStyle='#251f1a';c.fillRect(cx-26,h-58,16,46);c.fillRect(cx+10,h-58,16,46);
 // Ragged cherkesska without gazyrs.
 c.fillStyle=boss?'#3a3029':'#4a4035';c.beginPath();c.moveTo(cx-38,72);c.lineTo(cx+38,72);c.lineTo(cx+45,h-54);c.lineTo(cx+24,h-44);c.lineTo(cx+10,h-53);c.lineTo(cx-5,h-42);c.lineTo(cx-20,h-52);c.lineTo(cx-43,h-43);c.closePath();c.fill();
 c.fillStyle='#2b241f';c.fillRect(cx-43,92,12,62);c.fillRect(cx+31,92,12,62);
 // Head and triangular face scarf; only eyes remain visible.
 c.fillStyle='#c2a078';c.beginPath();c.ellipse(cx,48,boss?25:21,boss?29:25,0,0,Math.PI*2);c.fill();
 c.fillStyle='#2a2926';c.beginPath();c.moveTo(cx-(boss?28:24),48);c.lineTo(cx+(boss?28:24),48);c.lineTo(cx,82);c.closePath();c.fill();
 c.fillStyle='#171714';c.fillRect(cx-15,40,10,3);c.fillRect(cx+5,40,10,3);
 // Belt.
 c.fillStyle='#1c1815';c.fillRect(cx-39,119,78,8);
 if(kind==='dagger'){
  c.strokeStyle='#ddd7c2';c.lineWidth=5;c.beginPath();c.moveTo(cx+35,128);c.lineTo(cx+61,104);c.stroke();c.strokeStyle='#5a4530';c.lineWidth=7;c.beginPath();c.moveTo(cx+31,133);c.lineTo(cx+40,124);c.stroke();
 }else if(kind==='shield'){
  c.fillStyle='#594b3b';c.strokeStyle='#aaa487';c.lineWidth=4;c.beginPath();c.ellipse(cx-47,125,28,38,0,0,Math.PI*2);c.fill();c.stroke();
  c.strokeStyle='#d3ceb8';c.lineWidth=5;c.beginPath();c.moveTo(cx+35,145);c.lineTo(cx+63,85);c.stroke();
 }else{
  // Large two-handed battle axe.
  c.strokeStyle='#5b4432';c.lineWidth=9;c.beginPath();c.moveTo(cx+43,174);c.lineTo(cx-31,52);c.stroke();
  c.fillStyle='#9d9a8f';c.beginPath();c.moveTo(cx-42,39);c.lineTo(cx-6,50);c.lineTo(cx-23,78);c.lineTo(cx-56,65);c.closePath();c.fill();
 }
 t.refresh();
}
export function setupFrames(scene:Phaser.Scene){
 const t=scene.textures.get('atlas');for(const [name,b]of Object.entries(FRAMES))if(!t.has(name))t.add(name,0,...b);
 makeWorkbenchTexture(scene);makeEnemyTexture(scene,'dagger');makeEnemyTexture(scene,'shield');makeEnemyTexture(scene,'chaborz');
}

function makeTerrain(scene:Phaser.Scene,world:World){
 const W=SETTINGS.world.width,H=SETTINGS.world.height;
 if(scene.textures.exists('terrain'))scene.textures.remove('terrain');
 const texture=scene.textures.createCanvas('terrain',W,H)!;const c=texture.getContext();const rand=seeded(442);
 // Smooth multi-scale colour fields keep the terrain free of visible tiles.
 const small=document.createElement('canvas');small.width=W/4;small.height=H/4;const sc=small.getContext('2d')!;const pixels=sc.createImageData(small.width,small.height);
 for(let py=0;py<small.height;py++)for(let px=0;px<small.width;px++){
  const x=px*4,y=py*4;const v=Math.sin(x/143+Math.sin(y/121))*4+Math.cos(y/87+x/112)*3+Math.sin(x/38+y/52)*2+rand()*6;
  const forest=Math.max(0,Math.min(1,(1350-y)/550))*Math.max(0,1-Math.abs(x-1800)/1500);const hills=Math.max(0,1-y/720);const idx=(py*small.width+px)*4;
  pixels.data[idx]=86+v-forest*22+hills*18;pixels.data[idx+1]=109+v-forest*22+hills*7;pixels.data[idx+2]=62+v*.5-forest*4+hills*17;pixels.data[idx+3]=255;
 }
 sc.putImageData(pixels,0,0);c.imageSmoothingEnabled=true;c.drawImage(small,0,0,W,H);
 for(let i=0;i<390;i++){
  const x=rand()*W,y=rand()*H,r=30+rand()*145;const g=c.createRadialGradient(x,y,1,x,y,r);
  g.addColorStop(0,rand()>.5?'rgba(183,175,100,.11)':'rgba(18,54,36,.19)');g.addColorStop(1,'rgba(50,70,30,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
 }
 for(let i=0;i<36000;i++){
  const x=rand()*W,y=rand()*H;c.strokeStyle=rand()>.4?'rgba(182,188,113,.17)':'rgba(20,57,29,.20)';c.lineWidth=.7+rand();c.beginPath();c.moveTo(x,y);c.lineTo(x-1+rand()*4,y-2-rand()*5);c.stroke();
 }
 // The home trail curves naturally through the glade.
 const path=()=>{c.beginPath();c.moveTo(420,1940);c.bezierCurveTo(640,1780,1050,1760,1260,1580);c.bezierCurveTo(1450,1380,1600,1400,1810,1350);c.bezierCurveTo(2090,1270,2040,1620,2370,1555);c.bezierCurveTo(2620,1510,2780,1480,2950,1260);};
 c.save();c.lineCap='round';c.filter='blur(9px)';path();c.strokeStyle='rgba(125,123,77,.30)';c.lineWidth=101;c.stroke();path();c.strokeStyle='rgba(165,146,97,.44)';c.lineWidth=63;c.stroke();path();c.strokeStyle='rgba(178,154,103,.26)';c.lineWidth=35;c.stroke();c.restore();
 c.lineWidth=63;path();for(let i=0;i<14000;i++){const x=390+rand()*2580,y=1160+rand()*830;if(!c.isPointInStroke(x,y))continue;c.fillStyle=rand()>.5?'rgba(69,78,43,.15)':'rgba(209,188,133,.17)';c.fillRect(x,y,1+rand()*3,1+rand()*2);}
 for(const n of world.nodes){if(n.kind!=='tree'&&n.kind!=='pine')continue;const g=c.createRadialGradient(n.x+39,n.y+9,4,n.x+39,n.y+9,91);g.addColorStop(0,'rgba(9,39,22,.25)');g.addColorStop(.6,'rgba(9,39,22,.12)');g.addColorStop(1,'rgba(9,39,22,0)');c.save();c.translate(n.x+39,n.y+9);c.scale(1,.46);c.translate(-n.x-39,-n.y-9);c.fillStyle=g;c.fillRect(n.x-60,n.y-95,200,205);c.restore();}
 const river=()=>{c.beginPath();for(let y=-40;y<H+40;y+=12){const x=riverX(y);if(y===-40)c.moveTo(x,y);else c.lineTo(x,y);}};
 river();c.strokeStyle='#636e55';c.lineWidth=166;c.stroke();river();c.strokeStyle='#919279';c.lineWidth=143;c.stroke();river();c.strokeStyle='#91a692';c.lineWidth=123;c.stroke();river();c.strokeStyle='#578c87';c.lineWidth=103;c.stroke();river();c.strokeStyle='#487976';c.lineWidth=65;c.stroke();
 for(let i=0;i<800;i++){const y=rand()*H,x=riverX(y)+(rand()-.5)*103;c.fillStyle='rgba(186,224,200,.16)';c.beginPath();c.ellipse(x,y,rand()*9+2,1,0,0,Math.PI*2);c.fill();}
 // A shallow ford, with a continuous walkable band matching World.inRiver.
 c.fillStyle='rgba(166,166,126,.75)';c.beginPath();c.ellipse(riverX(1555),1555,93,51,-.12,0,Math.PI*2);c.fill();
 for(let i=0;i<27;i++){const x=riverX(1555)+(rand()-.5)*135,y=1515+rand()*77;c.fillStyle=i%2?'#a9b0a0':'#808e81';c.beginPath();c.ellipse(x,y,5+rand()*11,3+rand()*5,rand(),0,Math.PI*2);c.fill();}
 for(const n of world.nodes){if(NODE_DATA[n.kind].radius){const r=n.kind==='rock'?43:55;const g=c.createRadialGradient(n.x,n.y,0,n.x,n.y,r);g.addColorStop(0,'rgba(16,43,25,.30)');g.addColorStop(1,'rgba(16,43,25,0)');c.fillStyle=g;c.fillRect(n.x-r,n.y-r,r*2,r*2);}}
 texture.refresh();scene.add.image(0,0,'terrain').setOrigin(0).setDepth(-100);
}

export class WorldRenderer {
 nodeSprites:Phaser.GameObjects.Image[]=[];animalSprites:Phaser.GameObjects.Image[]=[];animalShadows:Phaser.GameObjects.Ellipse[]=[];enemySprites:Phaser.GameObjects.Image[]=[];enemyShadows:Phaser.GameObjects.Ellipse[]=[];buildingSprites=new Map<number,Phaser.GameObjects.Image>();
 player:Phaser.GameObjects.Image;playerShadow:Phaser.GameObjects.Ellipse;ring:Phaser.GameObjects.Graphics;effects:Phaser.GameObjects.Graphics;atmosphere:Phaser.GameObjects.Graphics;ghost:Phaser.GameObjects.Image;
 glow:Phaser.GameObjects.Image[]=[];lightTexture:Phaser.Textures.CanvasTexture;wind=0;
 constructor(public scene:Phaser.Scene,public model:GameModel){
  setupFrames(scene);makeTerrain(scene,model.world);
  this.nodeSprites=model.world.nodes.map(n=>{const img=this.sprite(n.kind,n.x,n.y);if(n.kind==='tree'||n.kind==='pine')img.setScale(img.scaleX*(.82+seeded(n.id+99)()*.38));return img;});
  // Village edge and rugged northern boundary, using the same painted atlas.
  this.sprite('tower',600,1730);this.sprite('cabin',810,1810);this.sprite('cabin',440,1870);
  const rand=seeded(191);for(let x=80;x<3300;x+=125){if(x>1550&&x<1850)continue;const rock=this.sprite('rock',x,160+rand()*110);rock.setDisplaySize(180+rand()*90,125+rand()*90);}
  const cave=scene.add.ellipse(1710,282,170,128,0x192b29).setDepth(280);scene.add.ellipse(1710,300,114,86,0x14201f).setDepth(281);this.sprite('rock',1620,310).setDisplaySize(116,178);this.sprite('rock',1797,300).setDisplaySize(145,200);this.sprite('rock',1710,243).setDisplaySize(183,90).setDepth(312);cave.setAlpha(.98);
  this.animalSprites=model.animals.map(a=>this.sprite(a.kind,a.x,a.y));this.animalShadows=model.animals.map(a=>scene.add.ellipse(a.x,a.y,a.kind==='hare'?23:49,10,0x0a2119,.25).setDepth(a.y-1));
  this.enemySprites=model.enemies.map(e=>scene.add.image(e.x,e.y,'enemy-'+e.kind).setOrigin(.5,.9).setDisplaySize(e.kind==='chaborz'?104:e.kind==='shield'?74:68,e.kind==='chaborz'?148:e.kind==='shield'?108:102).setDepth(e.y));
  this.enemyShadows=model.enemies.map(e=>scene.add.ellipse(e.x,e.y,e.kind==='chaborz'?60:42,e.kind==='chaborz'?18:13,0x081c17,.34).setDepth(e.y-1));
  this.playerShadow=scene.add.ellipse(model.player.x,model.player.y,33,13,0x081c17,.36);
  this.player=this.sprite('hero',model.player.x,model.player.y);
  this.ring=scene.add.graphics().setDepth(5000);this.effects=scene.add.graphics().setDepth(5001);
  this.atmosphere=scene.add.graphics().setScrollFactor(0).setDepth(9998);
  this.ghost=this.sprite('fire',0,0).setAlpha(.65).setVisible(false).setDepth(4900);
  if(scene.textures.exists('glow'))scene.textures.remove('glow');this.lightTexture=scene.textures.createCanvas('glow',256,256)!;
  const c=this.lightTexture.getContext(),g=c.createRadialGradient(128,128,0,128,128,125);g.addColorStop(0,'rgba(255,174,59,.85)');g.addColorStop(.3,'rgba(255,155,47,.45)');g.addColorStop(1,'rgba(255,155,47,0)');c.fillStyle=g;c.fillRect(0,0,256,256);this.lightTexture.refresh();
 }
 sprite(frame:string,x:number,y:number){const img=frame==='workbench'?this.scene.add.image(x,y,'workbench'):this.scene.add.image(x,y,'atlas',frame);img.setOrigin(.5,.89).setDepth(y);const h=heights[frame]??64;img.setScale(h/img.height);return img;}
 draw(dt:number,building:BuildingId|null,placement:PointLike){
  const m=this.model,p=m.player,s=this.scene,camera=s.cameras.main;this.wind+=dt;
  const moving=Math.hypot(p.vx,p.vy)>2&&!m.paused;const bob=moving?Math.abs(Math.sin(p.walk))*3:Math.sin(this.wind*2)*.6;
  this.player.setPosition(p.x,p.y-bob+(p.actionTimer>0?8:0)).setFlipX(p.facing<0).setDepth(p.y).setAngle(moving?Math.sin(p.walk)*2:0).setAlpha(p.invulnerable>0&&Math.sin(this.wind*32)>0?.45:1);
  const normal=heights.hero/this.player.height;this.player.setScale(normal*(1+(p.actionTimer>0?.035:0)),normal*(p.actionTimer>0?.87:1));
  this.playerShadow.setPosition(p.x,p.y+1).setDepth(p.y-1);
  const view=camera.worldView;
  for(const n of m.world.nodes){const img=this.nodeSprites[n.id];const visible=!n.depleted&&n.x>view.x-270&&n.x<view.right+270&&n.y>view.y-100&&n.y<view.bottom+310;img.setVisible(visible);if(!visible)continue;if(n.kind==='tree'||n.kind==='pine'){const hide=p.y<n.y&&p.y>n.y-img.displayHeight&&Math.abs(p.x-n.x)<img.displayWidth*.4;img.setAlpha(hide?.48:1);img.setRotation(Math.sin(this.wind*.6+n.id)*.007);}}
  for(const a of m.animals){const img=this.animalSprites[a.id],shadow=this.animalShadows[a.id];img.setVisible(a.state!=='dead'||!!(a.lootMeat||a.lootHide)).setPosition(a.x,a.y-(a.state==='flee'?Math.abs(Math.sin(a.walk))*5:0)).setDepth(a.y).setFlipX(a.facing<0).setAngle(a.state==='dead'?80:0).setAlpha(a.state==='dead'?.65:1);shadow.setPosition(a.x,a.y).setDepth(a.y-1).setVisible(img.visible);}
  for(const e of m.enemies){const img=this.enemySprites[e.id],shadow=this.enemyShadows[e.id],visible=e.active&&(e.state!=='dead'||Object.values(e.loot).some(n=>n));const bob=e.state==='chase'?Math.abs(Math.sin(e.walk))*2:0;img.setVisible(visible).setPosition(e.x,e.y-bob).setDepth(e.y).setFlipX(e.facing<0).setAngle(e.state==='dead'?82:e.state==='windup'?(e.facing>0?-7:7):0).setAlpha(e.state==='dead'?.62:1);shadow.setVisible(visible).setPosition(e.x,e.y).setDepth(e.y-1);}
  for(const b of m.buildings.objects){if(!this.buildingSprites.has(b.id)){this.buildingSprites.set(b.id,this.sprite(b.kind,b.x,b.y));if(b.kind==='fire'){const light=s.add.image(b.x,b.y-20,'glow').setDisplaySize(360,290).setBlendMode(Phaser.BlendModes.ADD).setDepth(9999);light.setData('id',b.id);this.glow.push(light);}}const img=this.buildingSprites.get(b.id)!;if(b.kind==='fire')img.setScale(heights.fire/img.height*(.98+Math.sin(this.wind*9+b.id)*.025));img.setAlpha(Math.min(1,b.born/1.5));}
  this.ring.clear();const interaction=m.interaction();if(interaction&&!m.paused&&!building){const n=interaction.target;this.ring.lineStyle(1.5,0xe1d2a2,.85);this.ring.strokeEllipse(n.x,n.y+2,interaction.kind==='node'&&NODE_DATA[interaction.target.kind].tool?67:43,19);}
  if(building){const valid=m.buildings.valid(building,placement.x,placement.y,p);this.ghost.setVisible(true);if(building==='workbench')this.ghost.setTexture('workbench');else this.ghost.setTexture('atlas',building);this.ghost.setPosition(placement.x,placement.y).setTint(valid?0xbddaad:0xe48476).setScale(heights[building]/this.ghost.height);this.ring.lineStyle(2,valid?0xbddaad:0xe48476,.9);this.ring.strokeEllipse(placement.x,placement.y,BUILDING_RADIUS[building]*2,BUILDING_RADIUS[building]);}else this.ghost.setVisible(false);
  this.effects.clear();
  for(const a of m.animals){if(a.state==='windup'){this.effects.lineStyle(2,0xdc825f,.9).strokeEllipse(a.x,a.y,75,31);this.effects.fillStyle(0xf1b780,1).fillTriangle(a.x,a.y-84,a.x-5,a.y-95,a.x+5,a.y-95);}if(a.hp< (a.kind==='boar'?105:24)&&a.state!=='dead'){this.effects.fillStyle(0x13281d,.8).fillRoundedRect(a.x-22,a.y-80,44,4,2);this.effects.fillStyle(0xc6835c,1).fillRoundedRect(a.x-22,a.y-80,44*a.hp/(a.kind==='boar'?105:24),4,2);}}
  for(const e of m.enemies){if(!e.active||e.state==='dead')continue;const max=ENEMIES[e.kind].hp,w=e.kind==='chaborz'?70:48,y=e.y-(e.kind==='chaborz'?145:105);if(e.state==='windup'){this.effects.lineStyle(e.kind==='chaborz'?4:2,e.kind==='chaborz'?0xd5a25e:0xd87b62,.92).strokeEllipse(e.x,e.y,e.kind==='chaborz'?132:82,e.kind==='chaborz'?48:30);}if(e.hp<max){this.effects.fillStyle(0x13281d,.85).fillRoundedRect(e.x-w/2,y,w,5,2);this.effects.fillStyle(e.kind==='chaborz'?0xb77a4e:0xc6835c,1).fillRoundedRect(e.x-w/2,y,w*e.hp/max,5,2);}}
  if(p.attackTimer>.36){const progress=(.6-p.attackTimer)/.24;this.effects.lineStyle(3,0xf6e7bd,.8*(1-progress));this.effects.beginPath();this.effects.arc(p.x+p.facing*8,p.y-30,53,p.facing>0?-.9+progress:Math.PI-.9+progress,p.facing>0?.5+progress:Math.PI+.5+progress);this.effects.strokePath();}
  // Moving glints in the river; no continuously rebuilt terrain texture.
  this.effects.lineStyle(1,0xc5e9db,.24);for(let i=0;i<40;i++){const y=(i*71+this.wind*16)%2600,x=riverX(y)+Math.sin(i*6)*35;if(y>view.y&&y<view.bottom)this.effects.lineBetween(x,y,x+10+Math.sin(i)*8,y+2);}
  const w=s.scale.width,h=s.scale.height;this.atmosphere.clear();const dark=m.day.darkness;
  if(dark>0)this.atmosphere.fillStyle(0x071b31,dark).fillRect(0,0,w,h);
  if(m.day.hour>=17&&m.day.hour<20)this.atmosphere.fillStyle(0xc77d3b,.07*Math.sin((m.day.hour-17)/3*Math.PI)).fillRect(0,0,w,h);
  if(m.weather.kind!=='clear'){
   this.atmosphere.fillStyle(m.weather.kind==='rain'?0x133544:0xbcd9df,(m.weather.kind==='rain'?.10:.08)*m.weather.blend).fillRect(0,0,w,h);
   const rain=m.weather.kind==='rain';this.atmosphere.lineStyle(1,0xccdddc,.4*m.weather.blend);this.atmosphere.fillStyle(0xf4f5ed,.68*m.weather.blend);
   const count=Math.min(110,Math.round(w*h/10000));for(let i=0;i<count;i++){const x=(i*197.3+this.wind*(rain?70:14)+Math.sin(i+this.wind)*8)%(w+100)-50,y=(i*73.7+this.wind*(rain?450:39))%(h+100)-50;if(rain)this.atmosphere.lineBetween(x,y,x-6,y+16);else this.atmosphere.fillCircle(x,y,1.3+i%2);}
  }
  for(const glow of this.glow)glow.setAlpha((.2+dark*.8)*(.95+Math.sin(this.wind*8)*.05));
 }
 event(event:GameEvent){
  if(event.x===undefined||event.y===undefined)return;const {x,y}=event;
  if(event.text){const text=this.scene.add.text(x,y-65,event.text,{fontFamily:'Georgia, serif',fontSize:'18px',color:'#f8edca',stroke:'#1b3629',strokeThickness:4}).setOrigin(.5).setDepth(6000);this.scene.tweens.add({targets:text,y:y-112,alpha:0,duration:1500,ease:'Cubic.Out',onComplete:()=>text.destroy()});}
  if(event.type==='hit'||event.type==='gather'||event.type==='build'){
   const colors=event.kind==='rock'||event.kind==='pebble'?[0xc4c9b6,0x969b8c]:[0xe5ca87,0xb1c584,0xebe3bd];
   for(let i=0;i<7;i++){const particle=this.scene.add.circle(x,y-18,2+i%2,colors[i%3]).setDepth(5800);this.scene.tweens.add({targets:particle,x:x+Math.sin(i*2.4)*(25+i*3),y:y-32-Math.cos(i*2.2)*28,alpha:0,duration:450+i*50,onComplete:()=>particle.destroy()});}
  }
 }
}
const BUILDING_RADIUS:Record<BuildingId,number>={fire:25,canopy:42,hut:48,workbench:36};
interface PointLike{x:number;y:number}
