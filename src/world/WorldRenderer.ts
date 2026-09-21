import Phaser from 'phaser';
import {SETTINGS,NODE_DATA,ENEMIES,CAVE,type BuildingId} from '../data/config';
import {seeded,riverX,distance,type World} from './World';
import type {GameModel,GameEvent} from '../systems/GameModel';

const FRAMES:Record<string,[number,number,number,number]>={
 tree:[17,9,290,307],pine:[360,3,218,314],rock:[643,89,273,211],berry:[953,29,289,274],grass:[18,346,265,252],branch:[325,366,286,220],pebble:[660,412,248,150],wood:[952,367,291,215],
 fire:[45,643,233,224],canopy:[321,626,295,276],hut:[637,618,290,293],cabin:[951,619,283,279],hero:[87,890,145,343],hare:[355,931,199,272],boar:[635,964,279,243],tower:[979,902,225,338],
};
const heights:Record<string,number>={tree:225,pine:262,rock:80,berry:61,grass:32,branch:25,pebble:24,wood:34,fire:69,canopy:122,hut:154,workbench:72,cabin:150,hero:78,hare:37,boar:68,tower:310};
function makeWorkbenchTexture(scene:Phaser.Scene){
 if(scene.textures.exists('workbench'))return;
 // Draw at high resolution and scale down in-game for a soft painted look matching the atlas art.
 const W=560,H=400,t=scene.textures.createCanvas('workbench',W,H)!;const c=t.getContext();
 c.clearRect(0,0,W,H);c.imageSmoothingEnabled=true;

 // Ground/contact shadow painted into the sprite so the bench sits naturally in the world.
 const shadow=c.createRadialGradient(282,344,12,282,344,210);
 shadow.addColorStop(0,'rgba(12,22,18,.42)');shadow.addColorStop(1,'rgba(12,22,18,0)');
 c.fillStyle=shadow;c.beginPath();c.ellipse(282,344,210,38,0,0,Math.PI*2);c.fill();

 // Rear legs.
 const leg=(x:number,y:number,w:number,h:number,flip=false)=>{
  const g=c.createLinearGradient(x,y,x+w,y+h);
  g.addColorStop(0,flip?'#5e4630':'#79583a');g.addColorStop(.48,'#4d3828');g.addColorStop(1,'#2c231d');
  c.fillStyle=g;c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y+3);c.lineTo(x+w-9,y+h);c.lineTo(x+5,y+h);c.closePath();c.fill();
  c.strokeStyle='rgba(232,201,149,.12)';c.lineWidth=3;c.beginPath();c.moveTo(x+5,y+7);c.lineTo(x+4,y+h-10);c.stroke();
 };
 leg(94,196,52,151);leg(414,196,52,151,true);leg(204,202,38,132);leg(323,202,38,132,true);

 // Lower support beam.
 let g=c.createLinearGradient(112,286,448,316);g.addColorStop(0,'#3b2e25');g.addColorStop(.5,'#60452f');g.addColorStop(1,'#30251e');
 c.fillStyle=g;c.beginPath();c.roundRect(111,281,338,32,8);c.fill();
 c.strokeStyle='rgba(229,194,137,.12)';c.lineWidth=3;c.beginPath();c.moveTo(131,291);c.bezierCurveTo(222,300,336,287,428,299);c.stroke();

 // Thick front apron.
 g=c.createLinearGradient(72,161,72,252);g.addColorStop(0,'#735338');g.addColorStop(.45,'#503a2b');g.addColorStop(1,'#31251e');
 c.fillStyle=g;c.beginPath();c.roundRect(66,159,428,84,10);c.fill();
 c.strokeStyle='rgba(31,23,19,.55)';c.lineWidth=5;c.beginPath();c.moveTo(83,218);c.lineTo(478,218);c.stroke();

 // Top board in mild perspective.
 g=c.createLinearGradient(0,92,0,166);g.addColorStop(0,'#9a734b');g.addColorStop(.45,'#755538');g.addColorStop(1,'#503927');
 c.fillStyle=g;c.beginPath();c.moveTo(48,106);c.lineTo(492,101);c.lineTo(526,159);c.lineTo(26,165);c.closePath();c.fill();
 c.strokeStyle='rgba(35,25,19,.6)';c.lineWidth=5;c.stroke();
 c.strokeStyle='rgba(236,204,150,.28)';c.lineWidth=4;c.beginPath();c.moveTo(58,115);c.lineTo(486,111);c.stroke();

 // Irregular wood grain and age marks.
 c.lineCap='round';
 for(let i=0;i<18;i++){
  const y=121+i*5.5,offset=Math.sin(i*1.7)*17;
  c.strokeStyle=i%3===0?'rgba(52,35,24,.34)':'rgba(221,178,116,.14)';c.lineWidth=i%3===0?2.6:1.8;
  c.beginPath();c.moveTo(54,y);c.bezierCurveTo(154+offset,y-7,339-offset,y+8,500,y-2);c.stroke();
 }
 // Small nicks along the front edge.
 c.strokeStyle='rgba(32,24,20,.5)';c.lineWidth=3;
 for(let x=91;x<478;x+=47){c.beginPath();c.moveTo(x,160);c.lineTo(x+8,169);c.stroke();}

 // Hammer: dark wooden handle and forged steel head.
 c.save();c.translate(185,101);c.rotate(-.18);
 g=c.createLinearGradient(0,0,82,9);g.addColorStop(0,'#4b3020');g.addColorStop(.5,'#7b5131');g.addColorStop(1,'#39251b');
 c.fillStyle=g;c.beginPath();c.roundRect(-4,13,94,13,6);c.fill();
 g=c.createLinearGradient(61,-5,100,20);g.addColorStop(0,'#b8b7ae');g.addColorStop(.42,'#777b78');g.addColorStop(1,'#3d4443');
 c.fillStyle=g;c.beginPath();c.roundRect(62,-2,43,24,5);c.fill();
 c.fillStyle='#555c5b';c.beginPath();c.moveTo(65,1);c.lineTo(51,8);c.lineTo(65,17);c.closePath();c.fill();c.restore();

 // Whetstone and a short metal file/chisel.
 g=c.createLinearGradient(299,112,367,142);g.addColorStop(0,'#878b7e');g.addColorStop(1,'#454b46');
 c.fillStyle=g;c.beginPath();c.roundRect(296,118,76,25,8);c.fill();c.strokeStyle='rgba(220,219,190,.18)';c.lineWidth=2;c.stroke();
 c.save();c.translate(391,120);c.rotate(.12);c.fillStyle='#4b3123';c.beginPath();c.roundRect(-2,10,34,14,6);c.fill();
 g=c.createLinearGradient(29,8,100,20);g.addColorStop(0,'#bab9ac');g.addColorStop(1,'#555d5b');c.fillStyle=g;c.beginPath();c.roundRect(28,12,76,7,4);c.fill();c.restore();

 // A small forged metal blank for the Shalt upgrades.
 g=c.createLinearGradient(424,105,472,147);g.addColorStop(0,'#9b9c91');g.addColorStop(.45,'#626864');g.addColorStop(1,'#383f3d');
 c.fillStyle=g;c.beginPath();c.moveTo(431,121);c.lineTo(467,117);c.lineTo(481,139);c.lineTo(441,145);c.closePath();c.fill();
 c.strokeStyle='rgba(232,226,197,.2)';c.lineWidth=2;c.stroke();

 // Leather strip hanging from the corner.
 c.strokeStyle='#5f3e2c';c.lineWidth=10;c.beginPath();c.moveTo(90,164);c.bezierCurveTo(81,201,98,220,85,254);c.stroke();
 c.strokeStyle='rgba(207,151,96,.25)';c.lineWidth=2;c.beginPath();c.moveTo(91,168);c.bezierCurveTo(84,201,99,222,88,250);c.stroke();

 t.refresh();
}

function makeEnemyTexture(scene:Phaser.Scene,kind:'dagger'|'shield'|'chaborz'){
 const key='enemy-'+kind;if(scene.textures.exists(key))return;
 const boss=kind==='chaborz',strong=kind==='shield';
 const W=boss?420:360,H=boss?620:540,t=scene.textures.createCanvas(key,W,H)!;const c=t.getContext(),cx=W/2;
 c.clearRect(0,0,W,H);c.imageSmoothingEnabled=true;

 // Reuse the illustrated hero as the anatomical/painterly base. This keeps enemies in the exact
 // same visual language as the player's character instead of looking like flat UI shapes.
 const atlasSource=scene.textures.get('atlas').getSourceImage() as CanvasImageSource;
 const [sx,sy,sw,sh]=FRAMES.hero;
 const bodyH=boss?520:strong?455:440,bodyW=bodyH*sw/sh*(strong?1.08:boss?1.12:.96),bodyX=cx-bodyW/2,bodyY=boss?40:48;
 c.save();
 if(kind==='dagger'){c.translate(cx,0);c.scale(.94,1);c.translate(-cx,0);}
 c.drawImage(atlasSource,sx,sy,sw,sh,bodyX,bodyY,bodyW,bodyH);
 c.restore();

 // Darken the original clothing while preserving illustrated texture and folds.
 c.save();c.beginPath();c.rect(cx-bodyW*.49,bodyY+bodyH*.20,bodyW*.98,bodyH*.72);c.clip();
 c.globalCompositeOperation='source-atop';c.fillStyle=boss?'rgba(31,31,32,.66)':strong?'rgba(35,38,40,.62)':'rgba(41,43,44,.58)';
 c.fillRect(bodyX-5,bodyY,bodyW+10,bodyH);c.restore();c.globalCompositeOperation='source-over';

 const shoulderY=bodyY+bodyH*.24,waistY=bodyY+bodyH*.48,hemY=bodyY+bodyH*.76;
 // Cherkesska silhouette: no gazyrs, deliberately worn/torn hem.
 let cloth=c.createLinearGradient(cx-bodyW*.35,shoulderY,cx+bodyW*.35,hemY);
 cloth.addColorStop(0,boss?'#292a2c':'#34373a');cloth.addColorStop(.48,strong?'#292d30':'#2d3032');cloth.addColorStop(1,'#1d2021');
 c.fillStyle=cloth;c.beginPath();
 c.moveTo(cx-bodyW*.34,shoulderY);c.quadraticCurveTo(cx,shoulderY-18,cx+bodyW*.34,shoulderY);
 c.lineTo(cx+bodyW*.30,waistY);c.lineTo(cx+bodyW*.39,hemY-18);
 c.lineTo(cx+bodyW*.26,hemY+17);c.lineTo(cx+bodyW*.13,hemY+1);c.lineTo(cx,hemY+24);
 c.lineTo(cx-bodyW*.12,hemY+3);c.lineTo(cx-bodyW*.27,hemY+19);c.lineTo(cx-bodyW*.39,hemY-14);
 c.lineTo(cx-bodyW*.30,waistY);c.closePath();c.fill();

 // Subtle folds/highlights to avoid a flat vector look.
 c.strokeStyle='rgba(179,184,181,.14)';c.lineWidth=boss?5:4;c.lineCap='round';
 for(const dx of [-.20,-.08,.08,.20]){c.beginPath();c.moveTo(cx+bodyW*dx,shoulderY+24);c.quadraticCurveTo(cx+bodyW*dx*.7,waistY,cx+bodyW*dx*1.1,hemY-9);c.stroke();}
 c.strokeStyle='rgba(5,8,8,.28)';c.lineWidth=5;c.beginPath();c.moveTo(cx,shoulderY+16);c.lineTo(cx,hemY-8);c.stroke();

 // Plain belt, intentionally without gazyrs.
 const beltY=waistY+3;let belt=c.createLinearGradient(cx-bodyW*.3,beltY,cx+bodyW*.3,beltY);
 belt.addColorStop(0,'#171819');belt.addColorStop(.5,'#39332c');belt.addColorStop(1,'#151718');
 c.fillStyle=belt;c.beginPath();c.roundRect(cx-bodyW*.31,beltY-7,bodyW*.62,15,6);c.fill();
 c.fillStyle='#777367';c.beginPath();c.roundRect(cx-10,beltY-8,20,17,4);c.fill();

 // Triangular scarf covering nose, mouth and chin. Eyes are the only exposed face detail.
 const faceY=bodyY+bodyH*.105,faceW=boss?62:strong?55:50;
 cloth=c.createLinearGradient(cx-faceW,faceY,cx+faceW,faceY+92);
 cloth.addColorStop(0,'#222426');cloth.addColorStop(.5,'#343638');cloth.addColorStop(1,'#17191a');
 c.fillStyle=cloth;c.beginPath();c.moveTo(cx-faceW,faceY+20);c.quadraticCurveTo(cx,faceY+9,cx+faceW,faceY+20);c.lineTo(cx,faceY+92);c.closePath();c.fill();
 // Cloth fold and knots.
 c.strokeStyle='rgba(181,184,180,.16)';c.lineWidth=3;c.beginPath();c.moveTo(cx-faceW+9,faceY+28);c.lineTo(cx,faceY+78);c.lineTo(cx+faceW-9,faceY+28);c.stroke();
 c.fillStyle='#1b1d1e';c.beginPath();c.moveTo(cx-faceW+3,faceY+23);c.lineTo(cx-faceW-25,faceY+41);c.lineTo(cx-faceW+2,faceY+48);c.closePath();c.fill();

 // Dark cloth around brow/hairline frames the exposed eyes.
 c.fillStyle='rgba(28,30,31,.9)';c.beginPath();c.ellipse(cx,faceY-7,faceW*.88,boss?26:22,0,Math.PI,Math.PI*2);c.fill();
 c.strokeStyle='rgba(10,11,12,.72)';c.lineWidth=4;
 c.beginPath();c.moveTo(cx-27,faceY+10);c.lineTo(cx-7,faceY+7);c.moveTo(cx+7,faceY+7);c.lineTo(cx+27,faceY+10);c.stroke();

 // Arms/sleeve overlays make the clothing read as one garment.
 c.strokeStyle=strong?'#292d30':'#303335';c.lineWidth=boss?30:24;c.lineCap='round';
 c.beginPath();c.moveTo(cx-bodyW*.30,shoulderY+20);c.lineTo(cx-bodyW*.39,waistY+24);c.moveTo(cx+bodyW*.30,shoulderY+20);c.lineTo(cx+bodyW*.39,waistY+24);c.stroke();

 if(kind==='dagger'){
  // Compact Caucasian-style dagger / shalt.
  c.save();c.translate(cx+bodyW*.42,waistY+24);c.rotate(-.58);
  let metal=c.createLinearGradient(0,-12,0,84);metal.addColorStop(0,'#f0ead8');metal.addColorStop(.42,'#aeb4ad');metal.addColorStop(1,'#5b6461');
  c.fillStyle=metal;c.beginPath();c.moveTo(-7,-4);c.lineTo(7,-4);c.lineTo(2,73);c.lineTo(0,88);c.lineTo(-2,73);c.closePath();c.fill();
  c.fillStyle='#5a3e29';c.beginPath();c.roundRect(-10,-30,20,31,7);c.fill();c.fillStyle='#90866f';c.fillRect(-16,-5,32,5);c.restore();
 }else if(kind==='shield'){
  // Larger fighter: weathered round shield and longer sword.
  const shX=cx-bodyW*.48,shY=waistY+16,shW=92,shH=122;
  let sg=c.createRadialGradient(shX-16,shY-25,8,shX,shY,70);sg.addColorStop(0,'#6b655a');sg.addColorStop(.52,'#454945');sg.addColorStop(1,'#252a28');
  c.fillStyle=sg;c.beginPath();c.ellipse(shX,shY,shW/2,shH/2,-.08,0,Math.PI*2);c.fill();
  c.strokeStyle='#8f8c7b';c.lineWidth=7;c.stroke();c.strokeStyle='rgba(210,207,184,.18)';c.lineWidth=3;
  c.beginPath();c.moveTo(shX-26,shY-42);c.lineTo(shX+21,shY+37);c.moveTo(shX+31,shY-26);c.lineTo(shX-22,shY+31);c.stroke();
  c.fillStyle='#79796f';c.beginPath();c.arc(shX,shY,13,0,Math.PI*2);c.fill();
  c.save();c.translate(cx+bodyW*.38,waistY+42);c.rotate(.38);
  let metal=c.createLinearGradient(0,-110,0,62);metal.addColorStop(0,'#e6e3d5');metal.addColorStop(.55,'#969d98');metal.addColorStop(1,'#4a5350');
  c.fillStyle=metal;c.beginPath();c.moveTo(-7,-108);c.lineTo(7,-108);c.lineTo(5,35);c.lineTo(-5,35);c.closePath();c.fill();
  c.fillStyle='#553a29';c.beginPath();c.roundRect(-10,32,20,48,6);c.fill();c.fillStyle='#8a826f';c.fillRect(-18,28,36,7);c.restore();
 }else{
  // Chaborz: oversized two-handed axe; heavier proportions come from the scaled illustrated body.
  c.save();c.translate(cx+18,waistY+64);c.rotate(-.48);
  const haft=c.createLinearGradient(-8,-190,9,140);haft.addColorStop(0,'#78543a');haft.addColorStop(.55,'#4d3426');haft.addColorStop(1,'#2c211b');
  c.fillStyle=haft;c.beginPath();c.roundRect(-8,-185,16,335,7);c.fill();
  let metal=c.createLinearGradient(-80,-230,48,-160);metal.addColorStop(0,'#c4c3b6');metal.addColorStop(.5,'#7d8580');metal.addColorStop(1,'#3f4845');
  c.fillStyle=metal;c.beginPath();c.moveTo(-11,-196);c.lineTo(-90,-226);c.quadraticCurveTo(-76,-162,-18,-145);c.lineTo(5,-183);c.lineTo(63,-209);c.quadraticCurveTo(50,-164,12,-145);c.lineTo(8,-195);c.closePath();c.fill();
  c.strokeStyle='rgba(235,231,207,.3)';c.lineWidth=4;c.stroke();c.restore();
 }

 // Ground shadow within the transparent sprite strengthens the illustrated cutout.
 const shad=c.createRadialGradient(cx,H-48,5,cx,H-48,boss?105:82);shad.addColorStop(0,'rgba(7,18,14,.34)');shad.addColorStop(1,'rgba(7,18,14,0)');
 c.fillStyle=shad;c.beginPath();c.ellipse(cx,H-48,boss?100:78,boss?21:17,0,0,Math.PI*2);c.fill();

 t.refresh();
}

function makeWolfTexture(scene:Phaser.Scene){
 if(scene.textures.exists('black-wolf'))return;
 const W=620,H=390,t=scene.textures.createCanvas('black-wolf',W,H)!;const c=t.getContext();
 c.clearRect(0,0,W,H);c.imageSmoothingEnabled=true;
 const shadow=c.createRadialGradient(315,330,10,315,330,235);shadow.addColorStop(0,'rgba(0,0,0,.52)');shadow.addColorStop(1,'rgba(0,0,0,0)');
 c.fillStyle=shadow;c.beginPath();c.ellipse(315,330,235,39,0,0,Math.PI*2);c.fill();
 let g=c.createLinearGradient(80,90,500,320);g.addColorStop(0,'#242a2b');g.addColorStop(.4,'#111617');g.addColorStop(1,'#050809');
 c.fillStyle=g;c.beginPath();c.ellipse(290,215,192,92,-.06,0,Math.PI*2);c.fill();
 c.beginPath();c.ellipse(445,165,88,70,-.25,0,Math.PI*2);c.fill();
 c.beginPath();c.moveTo(405,123);c.lineTo(419,40);c.lineTo(462,117);c.closePath();c.fill();
 c.beginPath();c.moveTo(458,111);c.lineTo(505,45);c.lineTo(501,139);c.closePath();c.fill();
 c.beginPath();c.moveTo(486,165);c.quadraticCurveTo(560,151,585,187);c.quadraticCurveTo(545,214,480,201);c.closePath();c.fill();
 c.strokeStyle='#090d0e';c.lineWidth=34;c.lineCap='round';
 c.beginPath();c.moveTo(165,245);c.lineTo(119,332);c.moveTo(245,253);c.lineTo(224,338);c.moveTo(365,250);c.lineTo(390,336);c.moveTo(435,226);c.lineTo(475,329);c.stroke();
 c.strokeStyle='#1d2425';c.lineWidth=13;c.beginPath();c.moveTo(98,205);c.quadraticCurveTo(25,176,43,111);c.quadraticCurveTo(75,157,122,172);c.stroke();
 c.strokeStyle='rgba(128,139,137,.13)';c.lineWidth=8;
 for(let i=0;i<12;i++){const x=145+i*25;c.beginPath();c.moveTo(x,155+Math.sin(i)*22);c.quadraticCurveTo(x+30,205,x+4,268);c.stroke();}
 c.fillStyle='#c31318';c.shadowColor='#ff2328';c.shadowBlur=19;c.beginPath();c.ellipse(456,153,8,5,-.1,0,Math.PI*2);c.fill();c.shadowBlur=0;
 c.fillStyle='#0b0c0c';c.beginPath();c.ellipse(572,184,10,7,0,0,Math.PI*2);c.fill();
 c.fillStyle='#ded3b5';for(const x of [510,528,546]){c.beginPath();c.moveTo(x,202);c.lineTo(x+5,223);c.lineTo(x+10,200);c.closePath();c.fill();}
 c.strokeStyle='rgba(228,225,204,.18)';c.lineWidth=3;c.beginPath();c.moveTo(510,174);c.lineTo(565,168);c.moveTo(510,181);c.lineTo(566,187);c.stroke();
 t.refresh();
}
function makeMantleTexture(scene:Phaser.Scene){
 if(scene.textures.exists('wolf-mantle'))return;
 const W=260,H=430,t=scene.textures.createCanvas('wolf-mantle',W,H)!;const c=t.getContext(),cx=W/2;
 c.clearRect(0,0,W,H);c.imageSmoothingEnabled=true;
 let g=c.createLinearGradient(45,120,220,390);g.addColorStop(0,'rgba(29,34,35,.98)');g.addColorStop(.55,'rgba(12,16,17,.98)');g.addColorStop(1,'rgba(4,7,8,.98)');
 c.fillStyle=g;c.beginPath();c.moveTo(72,126);c.quadraticCurveTo(cx,104,188,126);c.lineTo(229,376);c.lineTo(183,350);c.lineTo(147,402);c.lineTo(112,352);c.lineTo(62,382);c.closePath();c.fill();
 c.fillStyle='#111617';c.beginPath();c.ellipse(cx,88,69,58,0,0,Math.PI*2);c.fill();
 c.beginPath();c.moveTo(77,70);c.lineTo(86,9);c.lineTo(121,49);c.closePath();c.fill();c.beginPath();c.moveTo(139,48);c.lineTo(177,10);c.lineTo(184,73);c.closePath();c.fill();
 c.beginPath();c.moveTo(96,91);c.quadraticCurveTo(cx,68,164,91);c.lineTo(151,121);c.lineTo(109,121);c.closePath();c.fill();
 c.fillStyle='#252b2c';c.beginPath();c.ellipse(108,83,6,4,0,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(152,83,6,4,0,0,Math.PI*2);c.fill();
 c.strokeStyle='rgba(152,160,155,.13)';c.lineWidth=4;c.beginPath();c.moveTo(82,151);c.quadraticCurveTo(127,220,108,348);c.moveTo(179,151);c.quadraticCurveTo(141,230,151,367);c.stroke();
 t.refresh();
}
function makeBonesTexture(scene:Phaser.Scene){
 if(scene.textures.exists('cave-bones'))return;
 const W=220,H=120,t=scene.textures.createCanvas('cave-bones',W,H)!;const c=t.getContext();
 c.clearRect(0,0,W,H);c.strokeStyle='#b8ad8f';c.fillStyle='#c5b99a';c.lineWidth=9;c.lineCap='round';
 c.beginPath();c.moveTo(22,96);c.lineTo(105,31);c.moveTo(42,25);c.lineTo(131,99);c.stroke();
 for(const [x,y] of [[20,96],[105,31],[42,25],[131,99]]){c.beginPath();c.arc(x,y,7,0,Math.PI*2);c.fill();}
 c.beginPath();c.ellipse(169,55,34,30,0,0,Math.PI*2);c.fill();c.fillRect(147,66,44,22);
 c.fillStyle='#242422';c.beginPath();c.ellipse(157,52,7,9,0,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(180,52,7,9,0,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(169,66,5,4,0,0,Math.PI*2);c.fill();
 c.strokeStyle='#7c735d';c.lineWidth=2;for(let x=152;x<188;x+=9){c.beginPath();c.moveTo(x,72);c.lineTo(x,84);c.stroke();}
 t.refresh();
}
function makeTorchTexture(scene:Phaser.Scene){
 if(scene.textures.exists('cave-torch'))return;
 const W=90,H=180,t=scene.textures.createCanvas('cave-torch',W,H)!;const c=t.getContext();
 c.clearRect(0,0,W,H);c.strokeStyle='#5b3c26';c.lineWidth=13;c.lineCap='round';c.beginPath();c.moveTo(47,165);c.lineTo(43,70);c.stroke();
 const g=c.createRadialGradient(43,47,5,43,47,43);g.addColorStop(0,'#fff0a6');g.addColorStop(.35,'#e99b38');g.addColorStop(1,'#8c321c');
 c.fillStyle=g;c.beginPath();c.moveTo(44,9);c.bezierCurveTo(15,42,28,69,43,76);c.bezierCurveTo(70,62,68,35,44,9);c.fill();
 c.fillStyle='#fff3bd';c.beginPath();c.moveTo(44,28);c.bezierCurveTo(31,48,38,62,44,65);c.bezierCurveTo(54,55,55,43,44,28);c.fill();t.refresh();
}

export function setupFrames(scene:Phaser.Scene){
 const t=scene.textures.get('atlas');for(const [name,b]of Object.entries(FRAMES))if(!t.has(name))t.add(name,0,...b);
 makeWorkbenchTexture(scene);makeEnemyTexture(scene,'dagger');makeEnemyTexture(scene,'shield');makeEnemyTexture(scene,'chaborz');makeWolfTexture(scene);makeMantleTexture(scene);makeBonesTexture(scene);makeTorchTexture(scene);
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
 player:Phaser.GameObjects.Image;playerMantle:Phaser.GameObjects.Image;playerShadow:Phaser.GameObjects.Ellipse;ring:Phaser.GameObjects.Graphics;effects:Phaser.GameObjects.Graphics;atmosphere:Phaser.GameObjects.Graphics;ghost:Phaser.GameObjects.Image;
 caveWolfSprite:Phaser.GameObjects.Image;caveWolfShadow:Phaser.GameObjects.Ellipse;caveObjects:Phaser.GameObjects.GameObject[]=[];caveLights:Phaser.GameObjects.Image[]=[];
 glow:Phaser.GameObjects.Image[]=[];lightTexture:Phaser.Textures.CanvasTexture;wind=0;
 constructor(public scene:Phaser.Scene,public model:GameModel){
  setupFrames(scene);makeTerrain(scene,model.world);
  if(scene.textures.exists('glow'))scene.textures.remove('glow');this.lightTexture=scene.textures.createCanvas('glow',256,256)!;
  const lightContext=this.lightTexture.getContext(),lightGradient=lightContext.createRadialGradient(128,128,0,128,128,125);lightGradient.addColorStop(0,'rgba(255,174,59,.85)');lightGradient.addColorStop(.3,'rgba(255,155,47,.45)');lightGradient.addColorStop(1,'rgba(255,155,47,0)');lightContext.fillStyle=lightGradient;lightContext.fillRect(0,0,256,256);this.lightTexture.refresh();
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
  this.playerMantle=scene.add.image(model.player.x,model.player.y,'wolf-mantle').setOrigin(.5,.89).setDisplaySize(76,102).setDepth(model.player.y+.2).setVisible(false);
  this.caveWolfShadow=scene.add.ellipse(CAVE.wolfSpawn.x,CAVE.wolfSpawn.y,150,27,0x030404,.58).setDepth(CAVE.wolfSpawn.y-1).setVisible(false);
  this.caveWolfSprite=scene.add.image(CAVE.wolfSpawn.x,CAVE.wolfSpawn.y,'black-wolf').setOrigin(.5,.82).setDisplaySize(186,118).setDepth(CAVE.wolfSpawn.y).setVisible(false);
  const caveBg=scene.add.rectangle(CAVE.bounds.cx,CAVE.bounds.cy,1150,920,0x080d0d,.99).setDepth(-42).setVisible(false);
  const caveFloor=scene.add.ellipse(CAVE.bounds.cx,CAVE.bounds.cy,890,710,0x171c1b,1).setDepth(-41).setVisible(false);
  this.caveObjects.push(caveBg,caveFloor);
  const wallRand=seeded(7801);for(let i=0;i<22;i++){const a=i/22*Math.PI*2,rx=CAVE.bounds.rx*(.96+wallRand()*.10),ry=CAVE.bounds.ry*(.95+wallRand()*.09);const x=CAVE.bounds.cx+Math.cos(a)*rx,y=CAVE.bounds.cy+Math.sin(a)*ry;const rock=this.sprite('rock',x,y).setDisplaySize(120+wallRand()*95,78+wallRand()*75).setVisible(false);this.caveObjects.push(rock);}
  for(const [x,y,s] of [[1500,545,.72],[1895,612,.82],[1585,676,.62],[1810,405,.66],[1425,475,.55]] as const){const bones=scene.add.image(x,y,'cave-bones').setDisplaySize(105*s,58*s).setRotation((wallRand()-.5)*1.7).setDepth(y-2).setVisible(false);this.caveObjects.push(bones);}
  for(const [x,y] of [[1450,500],[1970,515],[1510,720],[1905,705]] as const){const torch=scene.add.image(x,y,'cave-torch').setDisplaySize(30,61).setDepth(y).setVisible(false);this.caveObjects.push(torch);const light=scene.add.image(x,y-28,'glow').setDisplaySize(310,250).setBlendMode(Phaser.BlendModes.ADD).setDepth(9999).setVisible(false);this.caveLights.push(light);}
  this.ring=scene.add.graphics().setDepth(5000);this.effects=scene.add.graphics().setDepth(5001);
  this.atmosphere=scene.add.graphics().setScrollFactor(0).setDepth(9998);
  this.ghost=this.sprite('fire',0,0).setAlpha(.65).setVisible(false).setDepth(4900);
 }
 sprite(frame:string,x:number,y:number){const img=frame==='workbench'?this.scene.add.image(x,y,'workbench'):this.scene.add.image(x,y,'atlas',frame);img.setOrigin(.5,.89).setDepth(y);const h=heights[frame]??64;img.setScale(h/img.height);return img;}
 draw(dt:number,building:BuildingId|null,placement:PointLike){
  const m=this.model,p=m.player,s=this.scene,camera=s.cameras.main;this.wind+=dt;
  const moving=Math.hypot(p.vx,p.vy)>2&&!m.paused;const bob=moving?Math.abs(Math.sin(p.walk))*3:Math.sin(this.wind*2)*.6;
  this.player.setPosition(p.x,p.y-bob+(p.actionTimer>0?8:0)).setFlipX(p.facing<0).setDepth(p.y).setAngle(moving?Math.sin(p.walk)*2:0).setAlpha(p.invulnerable>0&&Math.sin(this.wind*32)>0?.45:1);
  const normal=heights.hero/this.player.height;this.player.setScale(normal*(1+(p.actionTimer>0?.035:0)),normal*(p.actionTimer>0?.87:1));
  this.playerShadow.setPosition(p.x,p.y+1).setDepth(p.y-1);
  const mantle=m.inventory.equipment.mantle==='wolfMantle';this.playerMantle.setVisible(mantle).setPosition(p.x,p.y-bob-4+(p.actionTimer>0?8:0)).setFlipX(p.facing<0).setDepth(p.y+.25).setAngle(moving?Math.sin(p.walk)*1.5:0).setAlpha(this.player.alpha);
  const cave=m.location==='cave';for(const obj of this.caveObjects)(obj as any).setVisible(cave);
  const view=camera.worldView;
  for(const n of m.world.nodes){const img=this.nodeSprites[n.id];const visible=!cave&&!n.depleted&&n.x>view.x-270&&n.x<view.right+270&&n.y>view.y-100&&n.y<view.bottom+310;img.setVisible(visible);if(!visible)continue;if(n.kind==='tree'||n.kind==='pine'){const hide=p.y<n.y&&p.y>n.y-img.displayHeight&&Math.abs(p.x-n.x)<img.displayWidth*.4;img.setAlpha(hide?.48:1);img.setRotation(Math.sin(this.wind*.6+n.id)*.007);}}
  for(const a of m.animals){const img=this.animalSprites[a.id],shadow=this.animalShadows[a.id];img.setVisible(!cave&&(a.state!=='dead'||!!(a.lootMeat||a.lootHide))).setPosition(a.x,a.y-(a.state==='flee'?Math.abs(Math.sin(a.walk))*5:0)).setDepth(a.y).setFlipX(a.facing<0).setAngle(a.state==='dead'?80:0).setAlpha(a.state==='dead'?.65:1);shadow.setPosition(a.x,a.y).setDepth(a.y-1).setVisible(img.visible);}
  for(const e of m.enemies){const img=this.enemySprites[e.id],shadow=this.enemyShadows[e.id],visible=!cave&&e.active&&(e.state!=='dead'||Object.values(e.loot).some(n=>n));const bob=e.state==='chase'?Math.abs(Math.sin(e.walk))*2:0;img.setVisible(visible).setPosition(e.x,e.y-bob).setDepth(e.y).setFlipX(e.facing<0).setAngle(e.state==='dead'?82:e.state==='windup'?(e.facing>0?-7:7):0).setAlpha(e.state==='dead'?.62:1);shadow.setVisible(visible).setPosition(e.x,e.y).setDepth(e.y-1);}
  for(const b of m.buildings.objects){if(!this.buildingSprites.has(b.id)){this.buildingSprites.set(b.id,this.sprite(b.kind,b.x,b.y));if(b.kind==='fire'){const light=s.add.image(b.x,b.y-20,'glow').setDisplaySize(360,290).setBlendMode(Phaser.BlendModes.ADD).setDepth(9999);light.setData('id',b.id);this.glow.push(light);}}const img=this.buildingSprites.get(b.id)!;img.setVisible(!cave);if(b.kind==='fire')img.setScale(heights.fire/img.height*(.98+Math.sin(this.wind*9+b.id)*.025));img.setAlpha(Math.min(1,b.born/1.5));}
  const wolf=m.caveWolf,wolfVisible=cave&&wolf.active&&(wolf.state!=='dead'||Object.values(wolf.loot).some(n=>!!n));const wolfBob=wolf.state==='chase'?Math.abs(Math.sin(wolf.walk))*3:0;
  this.caveWolfSprite.setVisible(wolfVisible).setPosition(wolf.x,wolf.y-wolfBob).setDepth(wolf.y).setFlipX(wolf.facing<0).setAngle(wolf.state==='dead'?86:wolf.state==='windup'?(wolf.facing>0?-6:6):0).setAlpha(wolf.state==='dead'?.70:1);
  this.caveWolfShadow.setVisible(wolfVisible).setPosition(wolf.x,wolf.y).setDepth(wolf.y-1);
  this.ring.clear();const interaction=m.interaction();if(interaction&&!m.paused&&!building){const n=interaction.target;this.ring.lineStyle(1.5,0xe1d2a2,.85);this.ring.strokeEllipse(n.x,n.y+2,interaction.kind==='node'&&NODE_DATA[interaction.target.kind].tool?67:43,19);}
  if(building){const valid=m.buildings.valid(building,placement.x,placement.y,p);this.ghost.setVisible(true);if(building==='workbench')this.ghost.setTexture('workbench');else this.ghost.setTexture('atlas',building);this.ghost.setPosition(placement.x,placement.y).setTint(valid?0xbddaad:0xe48476).setScale(heights[building]/this.ghost.height);this.ring.lineStyle(2,valid?0xbddaad:0xe48476,.9);this.ring.strokeEllipse(placement.x,placement.y,BUILDING_RADIUS[building]*2,BUILDING_RADIUS[building]);}else this.ghost.setVisible(false);
  this.effects.clear();
  if(!cave)for(const a of m.animals){if(a.state==='windup'){this.effects.lineStyle(2,0xdc825f,.9).strokeEllipse(a.x,a.y,75,31);this.effects.fillStyle(0xf1b780,1).fillTriangle(a.x,a.y-84,a.x-5,a.y-95,a.x+5,a.y-95);}if(a.hp< (a.kind==='boar'?105:24)&&a.state!=='dead'){this.effects.fillStyle(0x13281d,.8).fillRoundedRect(a.x-22,a.y-80,44,4,2);this.effects.fillStyle(0xc6835c,1).fillRoundedRect(a.x-22,a.y-80,44*a.hp/(a.kind==='boar'?105:24),4,2);}}
  if(!cave)for(const e of m.enemies){if(!e.active||e.state==='dead')continue;const max=ENEMIES[e.kind].hp,w=e.kind==='chaborz'?70:48,y=e.y-(e.kind==='chaborz'?145:105);if(e.state==='windup'){this.effects.lineStyle(e.kind==='chaborz'?4:2,e.kind==='chaborz'?0xd5a25e:0xd87b62,.92).strokeEllipse(e.x,e.y,e.kind==='chaborz'?132:82,e.kind==='chaborz'?48:30);}if(e.hp<max){this.effects.fillStyle(0x13281d,.85).fillRoundedRect(e.x-w/2,y,w,5,2);this.effects.fillStyle(e.kind==='chaborz'?0xb77a4e:0xc6835c,1).fillRoundedRect(e.x-w/2,y,w*e.hp/max,5,2);}}
  if(cave&&wolf.active&&wolf.state!=='dead'){if(wolf.state==='windup'){this.effects.lineStyle(4,0xc31d24,.9).strokeEllipse(wolf.x,wolf.y,158,58);this.effects.fillStyle(0xe6373d,.95).fillTriangle(wolf.x,wolf.y-103,wolf.x-7,wolf.y-117,wolf.x+7,wolf.y-117);}if(wolf.hp<wolf.maxHp){this.effects.fillStyle(0x090b0b,.9).fillRoundedRect(wolf.x-58,wolf.y-117,116,7,3);this.effects.fillStyle(0xb51f25,1).fillRoundedRect(wolf.x-58,wolf.y-117,116*wolf.hp/wolf.maxHp,7,3);}}
  if(p.attackTimer>.36){const progress=(.6-p.attackTimer)/.24;this.effects.lineStyle(3,0xf6e7bd,.8*(1-progress));this.effects.beginPath();this.effects.arc(p.x+p.facing*8,p.y-30,53,p.facing>0?-.9+progress:Math.PI-.9+progress,p.facing>0?.5+progress:Math.PI+.5+progress);this.effects.strokePath();}
  // Moving glints in the river; no continuously rebuilt terrain texture.
  if(!cave){this.effects.lineStyle(1,0xc5e9db,.24);for(let i=0;i<40;i++){const y=(i*71+this.wind*16)%2600,x=riverX(y)+Math.sin(i*6)*35;if(y>view.y&&y<view.bottom)this.effects.lineBetween(x,y,x+10+Math.sin(i)*8,y+2);}}
  const w=s.scale.width,h=s.scale.height;this.atmosphere.clear();const dark=m.day.darkness;
  if(cave){
   this.atmosphere.fillStyle(0x020607,.34).fillRect(0,0,w,h);
   for(let i=0;i<this.caveLights.length;i++)this.caveLights[i].setVisible(true).setAlpha(.62+Math.sin(this.wind*8+i*2.1)*.10);
   for(const glow of this.glow)glow.setVisible(false);
  }else{
   for(const light of this.caveLights)light.setVisible(false);
   if(dark>0)this.atmosphere.fillStyle(0x071b31,dark).fillRect(0,0,w,h);
   if(m.day.hour>=17&&m.day.hour<20)this.atmosphere.fillStyle(0xc77d3b,.07*Math.sin((m.day.hour-17)/3*Math.PI)).fillRect(0,0,w,h);
   if(m.weather.kind!=='clear'){
    this.atmosphere.fillStyle(m.weather.kind==='rain'?0x133544:0xbcd9df,(m.weather.kind==='rain'?.10:.08)*m.weather.blend).fillRect(0,0,w,h);
    const rain=m.weather.kind==='rain';this.atmosphere.lineStyle(1,0xccdddc,.4*m.weather.blend);this.atmosphere.fillStyle(0xf4f5ed,.68*m.weather.blend);
    const count=Math.min(110,Math.round(w*h/10000));for(let i=0;i<count;i++){const x=(i*197.3+this.wind*(rain?70:14)+Math.sin(i+this.wind)*8)%(w+100)-50,y=(i*73.7+this.wind*(rain?450:39))%(h+100)-50;if(rain)this.atmosphere.lineBetween(x,y,x-6,y+16);else this.atmosphere.fillCircle(x,y,1.3+i%2);}
   }
   for(const glow of this.glow)glow.setVisible(true).setAlpha((.2+dark*.8)*(.95+Math.sin(this.wind*8)*.05));
  }
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
