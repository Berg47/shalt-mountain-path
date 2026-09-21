import Phaser from 'phaser';
import {heroArt} from '../data/heroArt';
import {drawWhitePapakha,PAPAKHA_FIT} from '../data/papakhaArt';
import {SETTINGS,NODE_DATA,ANIMALS,ENEMIES,CAVE,ELDER_QUEST,type BuildingId} from '../data/config';
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
 const key='enemy-'+kind;if(scene.textures.exists(key))scene.textures.remove(key);
 const boss=kind==='chaborz',strong=kind==='shield',rand=seeded(boss?7711:strong?6617:5519);
 const W=boss?420:360,H=boss?620:540,t=scene.textures.createCanvas(key,W,H)!;const c=t.getContext(),cx=W/2;
 c.clearRect(0,0,W,H);c.imageSmoothingEnabled=true;

 // Start from the same painted hero artwork so anatomy, light and rendering language match the player.
 const atlasSource=scene.textures.get('atlas').getSourceImage() as CanvasImageSource;
 const [sx,sy,sw,sh]=FRAMES.hero;
 const bodyH=boss?520:strong?462:442,bodyW=bodyH*sw/sh*(boss?1.11:strong?1.06:.96),bodyX=cx-bodyW/2,bodyY=boss?40:48;
 c.save();
 if(kind==='dagger'){c.translate(cx,0);c.scale(.95,1);c.translate(-cx,0);}
 c.drawImage(atlasSource,sx,sy,sw,sh,bodyX,bodyY,bodyW,bodyH);
 // Muted charcoal glaze preserves the painted folds beneath it.
 c.globalCompositeOperation='source-atop';
 c.fillStyle=boss?'rgba(26,27,28,.63)':strong?'rgba(31,34,35,.59)':'rgba(38,40,40,.55)';
 c.fillRect(bodyX-8,bodyY,bodyW+16,bodyH);
 c.restore();c.globalCompositeOperation='source-over';

 const shoulderY=bodyY+bodyH*.245,waistY=bodyY+bodyH*.49,hemY=bodyY+bodyH*.77;
 // Worn mountain coat / cherkesska silhouette, deliberately without gazyrs.
 let cloth=c.createLinearGradient(cx-bodyW*.38,shoulderY,cx+bodyW*.36,hemY);
 cloth.addColorStop(0,boss?'#333435':strong?'#3a3d3e':'#414344');
 cloth.addColorStop(.48,boss?'#232526':strong?'#292c2d':'#303233');
 cloth.addColorStop(1,'#17191a');
 c.fillStyle=cloth;c.beginPath();
 c.moveTo(cx-bodyW*.35,shoulderY);c.quadraticCurveTo(cx,shoulderY-17,cx+bodyW*.35,shoulderY);
 c.lineTo(cx+bodyW*.30,waistY);c.lineTo(cx+bodyW*.39,hemY-16);
 c.lineTo(cx+bodyW*.29,hemY+17);c.lineTo(cx+bodyW*.17,hemY+2);c.lineTo(cx+bodyW*.04,hemY+20);
 c.lineTo(cx-bodyW*.09,hemY+4);c.lineTo(cx-bodyW*.23,hemY+18);c.lineTo(cx-bodyW*.39,hemY-13);
 c.lineTo(cx-bodyW*.30,waistY);c.closePath();c.fill();

 // Painterly cloth texture and worn highlights.
 c.save();c.beginPath();c.rect(cx-bodyW*.43,shoulderY-5,bodyW*.86,hemY-shoulderY+48);c.clip();
 c.lineCap='round';
 for(let i=0;i<(boss?120:88);i++){
  const x=cx-bodyW*.35+rand()*bodyW*.7,y=shoulderY+rand()*(hemY-shoulderY),len=10+rand()*34;
  c.strokeStyle=rand()>.65?'rgba(193,190,174,.10)':'rgba(8,10,10,.15)';
  c.lineWidth=1+rand()*2.4;c.beginPath();c.moveTo(x,y);c.lineTo(x+(rand()-.5)*8,y+len);c.stroke();
 }
 c.restore();

 // Simple leather belt, no decorative cartridge holders.
 const beltY=waistY+3;
 let belt=c.createLinearGradient(cx-bodyW*.31,beltY,cx+bodyW*.31,beltY);
 belt.addColorStop(0,'#171716');belt.addColorStop(.5,'#4a3b2e');belt.addColorStop(1,'#151616');
 c.fillStyle=belt;c.beginPath();c.roundRect(cx-bodyW*.31,beltY-7,bodyW*.62,15,5);c.fill();
 c.fillStyle='#787264';c.beginPath();c.roundRect(cx-9,beltY-8,18,17,4);c.fill();

 // Sleeves merge into the same garment instead of reading as pasted-on shapes.
 c.strokeStyle=strong?'#2b2e2f':'#333536';c.lineWidth=boss?29:24;c.lineCap='round';
 c.beginPath();c.moveTo(cx-bodyW*.29,shoulderY+18);c.lineTo(cx-bodyW*.39,waistY+24);c.moveTo(cx+bodyW*.29,shoulderY+18);c.lineTo(cx+bodyW*.39,waistY+24);c.stroke();
 c.strokeStyle='rgba(196,193,178,.10)';c.lineWidth=4;
 c.beginPath();c.moveTo(cx-bodyW*.29,shoulderY+22);c.lineTo(cx-bodyW*.37,waistY+18);c.moveTo(cx+bodyW*.29,shoulderY+22);c.lineTo(cx+bodyW*.37,waistY+18);c.stroke();

 // Face: a narrow natural skin/eye band, with a triangular dark scarf over nose, mouth and chin.
 const faceY=bodyY+bodyH*.105,faceW=boss?59:strong?53:49;
 const skin=c.createLinearGradient(cx-faceW,faceY-14,cx+faceW,faceY+26);
 skin.addColorStop(0,'#b99474');skin.addColorStop(.55,'#9d765b');skin.addColorStop(1,'#70523f');
 c.fillStyle=skin;c.beginPath();c.ellipse(cx,faceY+10,faceW*.76,boss?28:24,0,0,Math.PI*2);c.fill();
 c.fillStyle='rgba(27,25,24,.82)';c.beginPath();c.ellipse(cx,faceY-11,faceW*.88,boss?27:23,0,Math.PI,Math.PI*2);c.fill();
 c.strokeStyle='rgba(25,21,19,.86)';c.lineWidth=4;
 c.beginPath();c.moveTo(cx-25,faceY+5);c.lineTo(cx-7,faceY+2);c.moveTo(cx+7,faceY+2);c.lineTo(cx+25,faceY+5);c.stroke();
 c.fillStyle='#171819';c.beginPath();c.ellipse(cx-14,faceY+8,3.4,2.2,0,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(cx+14,faceY+8,3.4,2.2,0,0,Math.PI*2);c.fill();

 cloth=c.createLinearGradient(cx-faceW,faceY+12,cx+faceW,faceY+91);
 cloth.addColorStop(0,'#343536');cloth.addColorStop(.48,'#262829');cloth.addColorStop(1,'#151718');
 c.fillStyle=cloth;c.beginPath();c.moveTo(cx-faceW,faceY+18);c.quadraticCurveTo(cx,faceY+10,cx+faceW,faceY+18);c.lineTo(cx,faceY+91);c.closePath();c.fill();
 c.strokeStyle='rgba(194,193,183,.13)';c.lineWidth=3;c.beginPath();c.moveTo(cx-faceW+8,faceY+28);c.lineTo(cx,faceY+76);c.lineTo(cx+faceW-8,faceY+28);c.stroke();
 c.fillStyle='#1a1b1c';c.beginPath();c.moveTo(cx-faceW+1,faceY+22);c.lineTo(cx-faceW-24,faceY+40);c.lineTo(cx-faceW+2,faceY+46);c.closePath();c.fill();

 if(kind==='dagger'){
  // Compact Caucasian dagger.
  c.save();c.translate(cx+bodyW*.42,waistY+26);c.rotate(-.58);
  const metal=c.createLinearGradient(0,-10,0,88);metal.addColorStop(0,'#eee8d6');metal.addColorStop(.48,'#a9afaa');metal.addColorStop(1,'#505956');
  c.fillStyle=metal;c.beginPath();c.moveTo(-7,-4);c.lineTo(7,-4);c.lineTo(2,74);c.lineTo(0,90);c.lineTo(-2,74);c.closePath();c.fill();
  c.fillStyle='#5c3d29';c.beginPath();c.roundRect(-10,-31,20,32,7);c.fill();c.fillStyle='#8e826e';c.fillRect(-16,-5,32,5);c.restore();
 }else if(kind==='shield'){
  const shX=cx-bodyW*.49,shY=waistY+18;
  const sg=c.createRadialGradient(shX-13,shY-24,8,shX,shY,72);sg.addColorStop(0,'#777066');sg.addColorStop(.52,'#464a46');sg.addColorStop(1,'#242826');
  c.fillStyle=sg;c.beginPath();c.ellipse(shX,shY,48,63,-.08,0,Math.PI*2);c.fill();
  c.strokeStyle='#918b78';c.lineWidth=7;c.stroke();c.fillStyle='#76766d';c.beginPath();c.arc(shX,shY,13,0,Math.PI*2);c.fill();
  c.strokeStyle='rgba(218,210,184,.14)';c.lineWidth=3;c.beginPath();c.moveTo(shX-28,shY-42);c.lineTo(shX+23,shY+39);c.moveTo(shX+30,shY-30);c.lineTo(shX-23,shY+31);c.stroke();
  c.save();c.translate(cx+bodyW*.38,waistY+43);c.rotate(.38);
  const metal=c.createLinearGradient(0,-110,0,60);metal.addColorStop(0,'#e4dfce');metal.addColorStop(.56,'#959b96');metal.addColorStop(1,'#49514e');
  c.fillStyle=metal;c.beginPath();c.moveTo(-7,-108);c.lineTo(7,-108);c.lineTo(5,35);c.lineTo(-5,35);c.closePath();c.fill();
  c.fillStyle='#563a29';c.beginPath();c.roundRect(-10,32,20,48,6);c.fill();c.fillStyle='#8a816e';c.fillRect(-18,28,36,7);c.restore();
 }else{
  c.save();c.translate(cx+18,waistY+64);c.rotate(-.48);
  const haft=c.createLinearGradient(-8,-190,9,140);haft.addColorStop(0,'#775239');haft.addColorStop(.55,'#4c3326');haft.addColorStop(1,'#2b201a');
  c.fillStyle=haft;c.beginPath();c.roundRect(-8,-185,16,335,7);c.fill();
  const metal=c.createLinearGradient(-80,-230,48,-160);metal.addColorStop(0,'#c3c0b2');metal.addColorStop(.52,'#7b827d');metal.addColorStop(1,'#3d4542');
  c.fillStyle=metal;c.beginPath();c.moveTo(-11,-196);c.lineTo(-90,-226);c.quadraticCurveTo(-76,-162,-18,-145);c.lineTo(5,-183);c.lineTo(63,-209);c.quadraticCurveTo(50,-164,12,-145);c.lineTo(8,-195);c.closePath();c.fill();
  c.strokeStyle='rgba(235,230,205,.26)';c.lineWidth=4;c.stroke();c.restore();
 }

 const shad=c.createRadialGradient(cx,H-48,5,cx,H-48,boss?104:80);shad.addColorStop(0,'rgba(7,18,14,.34)');shad.addColorStop(1,'rgba(7,18,14,0)');
 c.fillStyle=shad;c.beginPath();c.ellipse(cx,H-48,boss?100:78,boss?21:17,0,0,Math.PI*2);c.fill();
 t.refresh();
}

function makeWolfTexture(scene:Phaser.Scene){
 if(scene.textures.exists('black-wolf'))scene.textures.remove('black-wolf');
 const W=920,H=560,t=scene.textures.createCanvas('black-wolf',W,H)!;const c=t.getContext(),rand=seeded(9142);
 c.clearRect(0,0,W,H);c.imageSmoothingEnabled=true;

 // Soft painted contact shadow, consistent with the atlas animals.
 let g=c.createRadialGradient(455,463,18,455,463,290);g.addColorStop(0,'rgba(5,11,10,.50)');g.addColorStop(.58,'rgba(5,11,10,.22)');g.addColorStop(1,'rgba(5,11,10,0)');
 c.fillStyle=g;c.beginPath();c.ellipse(455,463,286,44,0,0,Math.PI*2);c.fill();

 // Natural low tail rather than an exaggerated monster silhouette.
 c.strokeStyle='#171d1d';c.lineWidth=54;c.lineCap='round';c.beginPath();c.moveTo(260,316);c.bezierCurveTo(165,333,105,305,74,252);c.bezierCurveTo(60,228,64,205,81,188);c.stroke();
 c.strokeStyle='rgba(96,102,97,.16)';c.lineWidth=12;c.beginPath();c.moveTo(254,304);c.bezierCurveTo(164,318,113,290,87,245);c.stroke();

 // Long lean body, deep chest, strong shoulders.
 g=c.createLinearGradient(225,144,690,430);g.addColorStop(0,'#39403f');g.addColorStop(.25,'#262d2c');g.addColorStop(.60,'#151b1b');g.addColorStop(1,'#090d0d');
 c.fillStyle=g;c.beginPath();c.ellipse(423,298,236,119,-.035,0,Math.PI*2);c.fill();
 c.beginPath();c.ellipse(613,275,118,115,-.18,0,Math.PI*2);c.fill();
 c.beginPath();c.moveTo(551,221);c.quadraticCurveTo(620,153,690,176);c.quadraticCurveTo(734,207,728,294);c.quadraticCurveTo(700,337,617,352);c.quadraticCurveTo(573,289,551,221);c.closePath();c.fill();

 // Head in a restrained three-quarter profile.
 c.beginPath();c.moveTo(647,184);c.quadraticCurveTo(702,139,772,159);c.quadraticCurveTo(822,176,846,222);c.quadraticCurveTo(824,267,754,282);c.quadraticCurveTo(694,278,654,242);c.closePath();c.fill();
 c.fillStyle='#101515';c.beginPath();c.moveTo(765,215);c.quadraticCurveTo(839,209,886,241);c.quadraticCurveTo(853,271,776,266);c.quadraticCurveTo(760,245,765,215);c.closePath();c.fill();

 // Ears, less oversized and more natural.
 c.fillStyle='#191f1f';c.beginPath();c.moveTo(677,176);c.lineTo(690,92);c.lineTo(735,163);c.closePath();c.fill();
 c.beginPath();c.moveTo(739,162);c.lineTo(785,99);c.lineTo(797,183);c.closePath();c.fill();
 c.fillStyle='#4a4d49';c.globalAlpha=.28;c.beginPath();c.moveTo(692,157);c.lineTo(699,111);c.lineTo(724,158);c.closePath();c.fill();c.beginPath();c.moveTo(754,155);c.lineTo(780,116);c.lineTo(787,171);c.closePath();c.fill();c.globalAlpha=1;

 // Legs and paws with joint taper, painted rather than blocky.
 const leg=(x:number,y:number,lean:number,front=false)=>{
  const grad=c.createLinearGradient(x,y,x+lean,y+172);grad.addColorStop(0,front?'#1d2423':'#171d1d');grad.addColorStop(1,'#080c0c');
  c.strokeStyle=grad;c.lineWidth=43;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(x+lean*.55,y+82);c.lineTo(x+lean,y+166);c.stroke();
  c.fillStyle='#080c0c';c.beginPath();c.ellipse(x+lean+8,y+169,37,14,-.05,0,Math.PI*2);c.fill();
 };
 leg(314,355,-16);leg(414,361,13);leg(598,349,-7,true);leg(678,338,24,true);

 // Fur texture clipped to the filled animal, using the same soft, high-resolution-downscaled approach.
 c.save();c.globalCompositeOperation='source-atop';c.lineCap='round';
 for(let i=0;i<760;i++){
  const x=185+rand()*650,y=116+rand()*320,len=7+rand()*27,ang=-.62+rand()*1.05;
  c.strokeStyle=rand()>.78?'rgba(174,177,164,.18)':rand()>.37?'rgba(92,101,97,.17)':'rgba(224,220,198,.065)';
  c.lineWidth=.8+rand()*2;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(ang)*len,y+Math.sin(ang)*len);c.stroke();
 }
 c.restore();c.globalCompositeOperation='source-over';

 // Silver-gray shoulder/back planes give the black coat readable volume at mobile scale.
 c.strokeStyle='rgba(171,176,164,.18)';c.lineWidth=10;c.lineCap='round';c.beginPath();c.moveTo(300,212);c.quadraticCurveTo(475,153,620,220);c.stroke();
 c.strokeStyle='rgba(4,6,6,.34)';c.lineWidth=20;c.beginPath();c.moveTo(270,354);c.quadraticCurveTo(452,399,663,351);c.stroke();
 c.fillStyle='rgba(116,120,112,.16)';c.beginPath();c.moveTo(691,172);c.lineTo(775,175);c.lineTo(752,223);c.lineTo(683,219);c.closePath();c.fill();

 // Natural amber eyes instead of glowing red monster eyes.
 for(const [x,y,r] of [[739,197,6.7],[774,200,5.1]] as const){
  c.fillStyle='#b99b58';c.beginPath();c.ellipse(x,y,r,r*.58,-.05,0,Math.PI*2);c.fill();
  c.fillStyle='#1d1b14';c.beginPath();c.ellipse(x+1,y,1.8,2.8,0,0,Math.PI*2);c.fill();
  c.fillStyle='rgba(255,239,183,.78)';c.beginPath();c.arc(x-1,y-1,1.2,0,Math.PI*2);c.fill();
 }
 c.fillStyle='#050808';c.beginPath();c.ellipse(878,241,14,10,0,0,Math.PI*2);c.fill();

 // Restrained mouth detail; the wolf remains dangerous without looking like a creature from another genre.
 c.strokeStyle='#050808';c.lineWidth=7;c.beginPath();c.moveTo(779,257);c.quadraticCurveTo(829,267,872,252);c.stroke();
 c.fillStyle='#c7c0aa';for(const [x,h] of [[812,12],[842,14]] as const){c.beginPath();c.moveTo(x,259);c.lineTo(x+5,259);c.lineTo(x+3,259+h);c.closePath();c.fill();}
 c.strokeStyle='rgba(193,197,181,.12)';c.lineWidth=2.5;c.beginPath();c.moveTo(808,225);c.lineTo(885,217);c.moveTo(811,234);c.lineTo(888,238);c.stroke();
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

function makeCaveInteriorTexture(scene:Phaser.Scene){
 if(scene.textures.exists('cave-interior'))scene.textures.remove('cave-interior');
 const W=1500,H=1100,t=scene.textures.createCanvas('cave-interior',W,H)!;const c=t.getContext(),rand=seeded(48021);
 c.clearRect(0,0,W,H);c.imageSmoothingEnabled=true;
 // Deep stone chamber with a bright playable floor and darker walls.
 let g=c.createRadialGradient(W*.5,H*.58,80,W*.5,H*.58,760);g.addColorStop(0,'#363b36');g.addColorStop(.38,'#282e2b');g.addColorStop(.72,'#171c1b');g.addColorStop(1,'#080b0b');c.fillStyle=g;c.fillRect(0,0,W,H);
 // Irregular ceiling and wall masses.
 for(let i=0;i<105;i++){
  const x=rand()*W,y=rand()<.62?rand()*290:(210+rand()*790),rx=55+rand()*170,ry=38+rand()*105;
  const gg=c.createRadialGradient(x-rx*.22,y-ry*.28,8,x,y,Math.max(rx,ry));gg.addColorStop(0,'rgba(112,119,106,.24)');gg.addColorStop(.38,'rgba(64,72,65,.34)');gg.addColorStop(1,'rgba(6,9,9,.12)');
  c.fillStyle=gg;c.beginPath();c.ellipse(x,y,rx,ry,rand()*.8-.4,0,Math.PI*2);c.fill();
 }
 // Floor plane.
 g=c.createLinearGradient(0,410,0,H);g.addColorStop(0,'rgba(55,61,54,.18)');g.addColorStop(.35,'rgba(70,73,62,.30)');g.addColorStop(1,'rgba(26,30,27,.72)');
 c.fillStyle=g;c.beginPath();c.moveTo(200,380);c.quadraticCurveTo(W/2,320,W-200,380);c.lineTo(W,1100);c.lineTo(0,1100);c.closePath();c.fill();
 // Stone seams and cracks.
 c.lineCap='round';
 for(let i=0;i<165;i++){
  const x=rand()*W,y=260+rand()*800,len=20+rand()*90,ang=rand()*Math.PI;
  c.strokeStyle=rand()>.5?'rgba(8,12,11,.32)':'rgba(151,151,125,.08)';c.lineWidth=.8+rand()*2.2;
  c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(ang)*len,y+Math.sin(ang)*len);c.stroke();
  if(rand()>.72){c.beginPath();c.moveTo(x+len*.45*Math.cos(ang),y+len*.45*Math.sin(ang));c.lineTo(x+Math.cos(ang+.9)*len*.35,y+Math.sin(ang+.9)*len*.35);c.stroke();}
 }
 // Dark stalactites at top.
 c.fillStyle='rgba(7,10,10,.94)';for(let x=-30;x<W+40;x+=55+rand()*55){const w=25+rand()*55,h=45+rand()*150;c.beginPath();c.moveTo(x-w/2,0);c.lineTo(x+w/2,0);c.lineTo(x+rand()*12-6,h);c.closePath();c.fill();}
 // Subtle central worn fighting ground.
 g=c.createRadialGradient(W/2,680,10,W/2,680,330);g.addColorStop(0,'rgba(151,137,97,.11)');g.addColorStop(1,'rgba(151,137,97,0)');c.fillStyle=g;c.fillRect(W/2-360,330,720,700);
 t.refresh();
}
function makeCaveExitTexture(scene:Phaser.Scene){
 if(scene.textures.exists('cave-exit'))scene.textures.remove('cave-exit');
 const W=420,H=300,t=scene.textures.createCanvas('cave-exit',W,H)!;const c=t.getContext();
 c.clearRect(0,0,W,H);c.imageSmoothingEnabled=true;
 let g=c.createRadialGradient(W/2,165,20,W/2,165,155);g.addColorStop(0,'rgba(102,121,104,.24)');g.addColorStop(1,'rgba(10,14,13,0)');c.fillStyle=g;c.fillRect(0,0,W,H);
 // Stone arch.
 c.strokeStyle='#414941';c.lineWidth=54;c.beginPath();c.arc(W/2,177,105,Math.PI,Math.PI*2);c.moveTo(105,178);c.lineTo(105,285);c.moveTo(315,178);c.lineTo(315,285);c.stroke();
 c.strokeStyle='rgba(145,151,132,.20)';c.lineWidth=7;c.beginPath();c.arc(W/2,177,105,Math.PI,Math.PI*2);c.stroke();
 // Opening.
 g=c.createLinearGradient(0,100,0,280);g.addColorStop(0,'#050808');g.addColorStop(1,'#17211d');c.fillStyle=g;c.beginPath();c.arc(W/2,179,76,Math.PI,Math.PI*2);c.lineTo(286,285);c.lineTo(134,285);c.closePath();c.fill();
 // Downward path / exit indicator, in-world not UI-like.
 c.fillStyle='rgba(207,194,148,.55)';c.beginPath();c.moveTo(210,227);c.lineTo(193,248);c.lineTo(203,248);c.lineTo(203,272);c.lineTo(217,272);c.lineTo(217,248);c.lineTo(227,248);c.closePath();c.fill();
 t.refresh();
}


function makePapakhaTexture(scene:Phaser.Scene){
 if(scene.textures.exists('white-papakha'))scene.textures.remove('white-papakha');
 const W=420,H=320,t=scene.textures.createCanvas('white-papakha',W,H)!;
 drawWhitePapakha(t.getContext(),W,H,'wear');t.refresh();
}

function makeDeerTexture(scene:Phaser.Scene){
 if(scene.textures.exists('deer'))scene.textures.remove('deer');
 const W=640,H=500,t=scene.textures.createCanvas('deer',W,H)!;const c=t.getContext(),rand=seeded(27183);
 c.clearRect(0,0,W,H);c.imageSmoothingEnabled=true;

 // Contact shadow like the hare/boar atlas art.
 let g=c.createRadialGradient(310,414,18,310,414,190);g.addColorStop(0,'rgba(16,31,22,.33)');g.addColorStop(.65,'rgba(16,31,22,.13)');g.addColorStop(1,'rgba(16,31,22,0)');
 c.fillStyle=g;c.beginPath();c.ellipse(310,414,188,30,0,0,Math.PI*2);c.fill();

 // Body in a three-quarter top-down read, not a side-profile cutout.
 g=c.createLinearGradient(130,138,500,390);g.addColorStop(0,'#ad875c');g.addColorStop(.35,'#896445');g.addColorStop(.72,'#624833');g.addColorStop(1,'#3f3229');
 c.fillStyle=g;c.beginPath();c.ellipse(295,292,166,87,-.075,0,Math.PI*2);c.fill();

 // Shoulder and neck overlap the body to give depth.
 let neck=c.createLinearGradient(370,150,510,330);neck.addColorStop(0,'#99704a');neck.addColorStop(.52,'#76543a');neck.addColorStop(1,'#4e3c30');
 c.fillStyle=neck;c.beginPath();c.ellipse(433,229,57,107,-.30,0,Math.PI*2);c.fill();
 c.fillStyle='#805c3f';c.beginPath();c.ellipse(504,149,67,45,-.16,0,Math.PI*2);c.fill();

 // Muzzle and ears are broad enough to survive downscaling.
 c.fillStyle='#d7c39d';c.beginPath();c.ellipse(547,166,35,23,.03,0,Math.PI*2);c.fill();
 c.fillStyle='#b88d60';c.beginPath();c.moveTo(474,126);c.lineTo(445,75);c.lineTo(492,111);c.closePath();c.fill();
 c.beginPath();c.moveTo(522,116);c.lineTo(557,70);c.lineTo(542,127);c.closePath();c.fill();
 c.fillStyle='rgba(74,54,42,.34)';c.beginPath();c.moveTo(476,118);c.lineTo(456,88);c.lineTo(487,112);c.closePath();c.fill();c.beginPath();c.moveTo(527,113);c.lineTo(551,84);c.lineTo(540,121);c.closePath();c.fill();

 // Legs: tapered dark lower legs make the silhouette closer to the painted boar/hare.
 const leg=(x:number,y:number,dx:number,front=false)=>{
  const lg=c.createLinearGradient(x,y,x+dx,y+118);lg.addColorStop(0,front?'#72513a':'#684a36');lg.addColorStop(.70,'#4a392d');lg.addColorStop(1,'#282522');
  c.strokeStyle=lg;c.lineWidth=16;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(x+dx*.55,y+72);c.lineTo(x+dx,y+112);c.stroke();
  c.strokeStyle='#24221f';c.lineWidth=9;c.beginPath();c.moveTo(x+dx,y+108);c.lineTo(x+dx+(dx>=0?7:-7),y+128);c.stroke();
 };
 leg(204,341,-8);leg(286,350,8);leg(390,337,-5,true);leg(448,316,10,true);

 // Short tail.
 c.strokeStyle='#6a4d38';c.lineWidth=11;c.lineCap='round';c.beginPath();c.moveTo(150,271);c.quadraticCurveTo(102,245,82,219);c.stroke();
 c.strokeStyle='#e5d9bc';c.lineWidth=5;c.beginPath();c.moveTo(91,223);c.lineTo(75,208);c.stroke();

 // Antlers: slim and muted, integrated rather than oversized icon-like branches.
 c.strokeStyle='#66513d';c.lineWidth=7;c.lineCap='round';
 c.beginPath();c.moveTo(490,112);c.lineTo(472,62);c.lineTo(449,38);c.moveTo(472,71);c.lineTo(494,47);c.moveTo(518,108);c.lineTo(534,60);c.lineTo(555,38);c.moveTo(534,70);c.lineTo(515,47);c.stroke();

 // Painterly fur dabs, clipped to body/neck/head silhouette via source-atop.
 c.save();c.globalCompositeOperation='source-atop';c.lineCap='round';
 for(let i=0;i<430;i++){
  const x=128+rand()*430,y=105+rand()*278,len=5+rand()*18,ang=-.35+rand()*.75;
  c.strokeStyle=rand()>.72?'rgba(231,210,170,.17)':rand()>.30?'rgba(88,62,45,.15)':'rgba(255,238,196,.08)';
  c.lineWidth=.7+rand()*1.7;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(ang)*len,y+Math.sin(ang)*len);c.stroke();
 }
 c.restore();c.globalCompositeOperation='source-over';

 // Warm highlight on the back and pale throat/belly, matching the soft atlas lighting.
 c.strokeStyle='rgba(235,211,172,.22)';c.lineWidth=9;c.beginPath();c.arc(283,275,124,.15,2.64);c.stroke();
 c.fillStyle='rgba(231,218,190,.58)';c.beginPath();c.ellipse(473,205,22,42,-.28,0,Math.PI*2);c.fill();
 c.fillStyle='#171817';c.beginPath();c.arc(529,139,5,0,Math.PI*2);c.fill();
 c.fillStyle='#2f2822';c.beginPath();c.ellipse(569,166,5.5,4,0,0,Math.PI*2);c.fill();
 c.fillStyle='rgba(255,244,211,.65)';c.beginPath();c.arc(527,137,1.4,0,Math.PI*2);c.fill();
 t.refresh();
}

function makeElderTexture(scene:Phaser.Scene){
 if(scene.textures.exists('elder'))scene.textures.remove('elder');
 const W=420,H=620,t=scene.textures.createCanvas('elder',W,H)!;const c=t.getContext(),cx=W/2,rand=seeded(48211);
 c.clearRect(0,0,W,H);c.imageSmoothingEnabled=true;

 // Same illustrated human base as the player and bandits, then age/clothing are painted over it.
 const atlas=scene.textures.get('atlas').getSourceImage() as CanvasImageSource,[sx,sy,sw,sh]=FRAMES.hero;
 c.globalAlpha=.94;c.drawImage(atlas,sx,sy,sw,sh,111,82,198,474);c.globalAlpha=1;
 c.save();c.globalCompositeOperation='source-atop';c.fillStyle='rgba(88,79,65,.25)';c.fillRect(95,80,230,490);c.restore();c.globalCompositeOperation='source-over';

 // Heavy muted wool cloak with broad painted folds.
 let g=c.createLinearGradient(103,184,317,562);g.addColorStop(0,'#74644f');g.addColorStop(.44,'#574d3f');g.addColorStop(1,'#34312c');
 c.fillStyle=g;c.beginPath();c.moveTo(132,199);c.quadraticCurveTo(cx,171,289,199);c.lineTo(316,522);c.quadraticCurveTo(cx,565,104,522);c.closePath();c.fill();
 c.save();c.beginPath();c.moveTo(132,199);c.quadraticCurveTo(cx,171,289,199);c.lineTo(316,522);c.quadraticCurveTo(cx,565,104,522);c.closePath();c.clip();
 c.lineCap='round';
 for(let i=0;i<115;i++){
  const x=116+rand()*198,y=199+rand()*325;
  c.strokeStyle=rand()>.68?'rgba(216,198,160,.09)':'rgba(31,28,25,.13)';
  c.lineWidth=1+rand()*2.6;c.beginPath();c.moveTo(x,y);c.lineTo(x+(rand()-.5)*8,y+18+rand()*42);c.stroke();
 }
 c.restore();
 c.strokeStyle='rgba(219,198,158,.15)';c.lineWidth=4;for(const dx of [-47,-17,17,48]){c.beginPath();c.moveTo(cx+dx,219);c.lineTo(cx+dx*.70,516);c.stroke();}

 // Weathered face and gray beard, kept broad and painterly for the small world scale.
 const skin=c.createLinearGradient(174,112,250,196);skin.addColorStop(0,'#b99779');skin.addColorStop(.58,'#967157');skin.addColorStop(1,'#6d5140');
 c.fillStyle=skin;c.beginPath();c.ellipse(cx,151,45,55,0,0,Math.PI*2);c.fill();
 c.fillStyle='#d5cdbb';c.beginPath();c.moveTo(170,164);c.quadraticCurveTo(cx,150,251,165);c.lineTo(243,252);c.quadraticCurveTo(cx,286,179,250);c.closePath();c.fill();
 c.strokeStyle='rgba(105,99,89,.34)';c.lineWidth=2.4;
 for(let i=0;i<18;i++){const x=181+i*3.5;c.beginPath();c.moveTo(x,177+rand()*10);c.quadraticCurveTo(x+(rand()-.5)*8,214,x+(rand()-.5)*10,249-rand()*7);c.stroke();}
 c.strokeStyle='rgba(66,52,43,.55)';c.lineWidth=2.5;c.beginPath();c.moveTo(184,143);c.lineTo(199,139);c.moveTo(221,139);c.lineTo(237,143);c.stroke();
 c.fillStyle='#28231f';c.beginPath();c.ellipse(195,148,3.3,2.2,0,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(225,148,3.3,2.2,0,0,Math.PI*2);c.fill();

 // Low dark wool papakha: restrained, realistic, and clearly separate from the white quest reward.
 g=c.createLinearGradient(153,73,269,132);g.addColorStop(0,'#4a4941');g.addColorStop(.48,'#302f2b');g.addColorStop(1,'#1e201e');
 c.fillStyle=g;c.beginPath();c.moveTo(154,128);c.lineTo(159,92);c.quadraticCurveTo(171,70,cx,68);c.quadraticCurveTo(249,69,263,92);c.lineTo(268,128);c.quadraticCurveTo(cx,136,154,128);c.closePath();c.fill();
 c.strokeStyle='rgba(177,171,151,.16)';c.lineWidth=2;
 for(let i=0;i<54;i++){const x=160+rand()*101,y=76+rand()*50;c.beginPath();c.arc(x,y,2+rand()*5,rand()*Math.PI,rand()*Math.PI+Math.PI*1.2);c.stroke();}

 // Wooden staff reinforces the elder silhouette without changing gameplay.
 const staff=c.createLinearGradient(326,188,346,557);staff.addColorStop(0,'#8a6846');staff.addColorStop(.55,'#5b422f');staff.addColorStop(1,'#32271f');
 c.strokeStyle=staff;c.lineWidth=12;c.lineCap='round';c.beginPath();c.moveTo(326,183);c.lineTo(341,555);c.stroke();
 c.strokeStyle='rgba(222,181,122,.20)';c.lineWidth=2.2;c.beginPath();c.moveTo(324,198);c.lineTo(339,543);c.stroke();

 // Small contact shadow inside the sprite.
 const shadowGradient=c.createRadialGradient(cx,557,6,cx,557,92);shadowGradient.addColorStop(0,'rgba(8,17,13,.34)');shadowGradient.addColorStop(1,'rgba(8,17,13,0)');
 c.fillStyle=shadowGradient;c.beginPath();c.ellipse(cx,557,90,18,0,0,Math.PI*2);c.fill();
 t.refresh();
}

export function setupFrames(scene:Phaser.Scene){
 const t=scene.textures.get('atlas');for(const [name,b]of Object.entries(FRAMES))if(!t.has(name))t.add(name,0,...b);
 makeWorkbenchTexture(scene);makeEnemyTexture(scene,'dagger');makeEnemyTexture(scene,'shield');makeEnemyTexture(scene,'chaborz');makeWolfTexture(scene);makePapakhaTexture(scene);makeDeerTexture(scene);makeElderTexture(scene);makeBonesTexture(scene);makeTorchTexture(scene);makeCaveInteriorTexture(scene);makeCaveExitTexture(scene);
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
 player:Phaser.GameObjects.Image;playerHeadwear:Phaser.GameObjects.Image;playerShadow:Phaser.GameObjects.Ellipse;elderSprite:Phaser.GameObjects.Image;elderShadow:Phaser.GameObjects.Ellipse;elderQuestMarker:Phaser.GameObjects.Text;ring:Phaser.GameObjects.Graphics;effects:Phaser.GameObjects.Graphics;atmosphere:Phaser.GameObjects.Graphics;ghost:Phaser.GameObjects.Image;
 caveWolfSprite:Phaser.GameObjects.Image;caveWolfShadow:Phaser.GameObjects.Ellipse;caveObjects:Phaser.GameObjects.GameObject[]=[];caveLights:Phaser.GameObjects.Image[]=[];worldDecor:Phaser.GameObjects.GameObject[]=[];
 glow:Phaser.GameObjects.Image[]=[];lightTexture:Phaser.Textures.CanvasTexture;wind=0;
 constructor(public scene:Phaser.Scene,public model:GameModel){
  setupFrames(scene);makeTerrain(scene,model.world);
  if(scene.textures.exists('glow'))scene.textures.remove('glow');this.lightTexture=scene.textures.createCanvas('glow',256,256)!;
  const lightContext=this.lightTexture.getContext(),lightGradient=lightContext.createRadialGradient(128,128,0,128,128,125);lightGradient.addColorStop(0,'rgba(255,174,59,.85)');lightGradient.addColorStop(.3,'rgba(255,155,47,.45)');lightGradient.addColorStop(1,'rgba(255,155,47,0)');lightContext.fillStyle=lightGradient;lightContext.fillRect(0,0,256,256);this.lightTexture.refresh();
  this.nodeSprites=model.world.nodes.map(n=>{const img=this.sprite(n.kind,n.x,n.y);if(n.kind==='tree'||n.kind==='pine')img.setScale(img.scaleX*(.82+seeded(n.id+99)()*.38));return img;});
  // Village edge and rugged northern boundary. Track these so they disappear inside the cave.
  this.worldDecor.push(this.sprite('tower',600,1730),this.sprite('cabin',810,1810),this.sprite('cabin',440,1870));
  const elderTower=this.sprite('tower',ELDER_QUEST.tower.x,ELDER_QUEST.tower.y).setDisplaySize(168,252).setDepth(ELDER_QUEST.tower.y);
  this.elderShadow=scene.add.ellipse(ELDER_QUEST.elder.x,ELDER_QUEST.elder.y,38,12,0x071a13,.34).setDepth(ELDER_QUEST.elder.y-1);
  this.elderSprite=scene.add.image(ELDER_QUEST.elder.x,ELDER_QUEST.elder.y,'elder').setOrigin(.5,.92).setDisplaySize(62,92).setDepth(ELDER_QUEST.elder.y);
  this.elderQuestMarker=scene.add.text(ELDER_QUEST.elder.x,ELDER_QUEST.elder.y-104,'!',{fontFamily:'Georgia, serif',fontSize:'28px',fontStyle:'bold',color:'#f2df9b',stroke:'#183126',strokeThickness:5}).setOrigin(.5).setDepth(ELDER_QUEST.elder.y+2);
  this.worldDecor.push(elderTower,this.elderShadow,this.elderSprite,this.elderQuestMarker);
  const rand=seeded(191);for(let x=80;x<3300;x+=125){if(x>1540&&x<1880)continue;const rock=this.sprite('rock',x,160+rand()*110);rock.setDisplaySize(180+rand()*90,125+rand()*90);this.worldDecor.push(rock);}
  // The visible cave mouth is anchored exactly to the map region "Вход в пещеру".
  const ex=CAVE.entrance.x,ey=CAVE.entrance.y;
  const caveShadow=scene.add.ellipse(ex,ey-15,190,132,0x101918,.98).setDepth(ey-48);
  const caveMouth=scene.add.ellipse(ex,ey,126,98,0x060a0a,.995).setDepth(ey-47);
  const leftRock=this.sprite('rock',ex-92,ey+22).setDisplaySize(132,188).setDepth(ey+18);
  const rightRock=this.sprite('rock',ex+96,ey+18).setDisplaySize(148,202).setDepth(ey+19);
  const capRock=this.sprite('rock',ex,ey-73).setDisplaySize(210,96).setDepth(ey+20);
  const pathGlow=scene.add.ellipse(ex,ey+45,116,32,0x9c8b5d,.16).setDepth(ey+21);
  this.worldDecor.push(caveShadow,caveMouth,leftRock,rightRock,capRock,pathGlow);
  this.animalSprites=model.animals.map(a=>a.kind==='deer'?scene.add.image(a.x,a.y,'deer').setOrigin(.5,.88).setDisplaySize(94,73).setDepth(a.y):this.sprite(a.kind,a.x,a.y));this.animalShadows=model.animals.map(a=>scene.add.ellipse(a.x,a.y,a.kind==='hare'?23:a.kind==='deer'?58:49,a.kind==='deer'?13:10,0x0a2119,.25).setDepth(a.y-1));
  this.enemySprites=model.enemies.map(e=>scene.add.image(e.x,e.y,'enemy-'+e.kind).setOrigin(.5,.9).setDisplaySize(e.kind==='chaborz'?104:e.kind==='shield'?74:68,e.kind==='chaborz'?148:e.kind==='shield'?108:102).setDepth(e.y));
  this.enemyShadows=model.enemies.map(e=>scene.add.ellipse(e.x,e.y,e.kind==='chaborz'?60:42,e.kind==='chaborz'?18:13,0x081c17,.34).setDepth(e.y-1));
  this.playerShadow=scene.add.ellipse(model.player.x,model.player.y,33,13,0x081c17,.36);
  this.player=scene.add.image(model.player.x,model.player.y,heroArt(model.inventory.equipment.mantle).key).setOrigin(.5,.98).setDepth(model.player.y);
  this.player.setScale(heights.hero/this.player.height);
  this.playerHeadwear=scene.add.image(model.player.x,model.player.y-66,'white-papakha').setOrigin(.5,PAPAKHA_FIT.world.originY).setDisplaySize(PAPAKHA_FIT.world.width,PAPAKHA_FIT.world.height).setDepth(model.player.y+.45).setVisible(false);
  this.caveWolfShadow=scene.add.ellipse(CAVE.wolfSpawn.x,CAVE.wolfSpawn.y+6,172,30,0x020303,.62).setDepth(CAVE.wolfSpawn.y-1).setVisible(false);
  this.caveWolfSprite=scene.add.image(CAVE.wolfSpawn.x,CAVE.wolfSpawn.y,'black-wolf').setOrigin(.5,.84).setDisplaySize(218,133).setDepth(CAVE.wolfSpawn.y).setVisible(false);
  // Full-world blackout prevents the outside mountain art from bleeding into the interior on tall phones.
  const caveVoid=scene.add.rectangle(SETTINGS.world.width/2,SETTINGS.world.height/2,SETTINGS.world.width,SETTINGS.world.height,0x030606,1).setDepth(-52).setVisible(false);
  const caveInterior=scene.add.image(CAVE.bounds.cx,CAVE.bounds.cy+5,'cave-interior').setDisplaySize(1120,820).setDepth(-44).setVisible(false);
  this.caveObjects.push(caveVoid,caveInterior);
  const wallRand=seeded(7801);
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2,rx=CAVE.bounds.rx*(.95+wallRand()*.07),ry=CAVE.bounds.ry*(.94+wallRand()*.07);const x=CAVE.bounds.cx+Math.cos(a)*rx,y=CAVE.bounds.cy+Math.sin(a)*ry;const rock=this.sprite('rock',x,y).setDisplaySize(108+wallRand()*82,72+wallRand()*66).setDepth(y-8).setVisible(false);this.caveObjects.push(rock);}
  for(const [x,y,s,r] of [[1480,540,.80,-.25],[1930,585,.85,.42],[1570,660,.65,.28],[1830,400,.62,-.38],[1435,455,.58,.45],[1890,745,.72,-.2],[1530,760,.55,.22]] as const){
   const bones=scene.add.image(x,y,'cave-bones').setDisplaySize(112*s,61*s).setRotation(r).setDepth(y-3).setAlpha(.88).setVisible(false);this.caveObjects.push(bones);
  }
  const exitArch=scene.add.image(CAVE.exit.x,CAVE.exit.y+30,'cave-exit').setDisplaySize(188,134).setOrigin(.5,.88).setDepth(CAVE.exit.y+22).setVisible(false);
  const exitText=scene.add.text(CAVE.exit.x,CAVE.exit.y-50,'ВЫХОД',{fontFamily:'Arial, sans-serif',fontSize:'12px',fontStyle:'bold',color:'#d8cfad',stroke:'#101815',strokeThickness:3,letterSpacing:2}).setOrigin(.5).setDepth(CAVE.exit.y+24).setVisible(false);
  const exitGlow=scene.add.image(CAVE.exit.x,CAVE.exit.y+2,'glow').setDisplaySize(250,150).setBlendMode(Phaser.BlendModes.ADD).setDepth(CAVE.exit.y-3).setAlpha(.22).setVisible(false);
  this.caveObjects.push(exitArch,exitText,exitGlow);
  for(const [x,y] of [[1450,485],[1970,500],[1500,705],[1925,695]] as const){
   const torch=scene.add.image(x,y,'cave-torch').setDisplaySize(32,66).setDepth(y).setVisible(false);this.caveObjects.push(torch);
   const light=scene.add.image(x,y-28,'glow').setDisplaySize(360,285).setBlendMode(Phaser.BlendModes.ADD).setDepth(9999).setVisible(false);this.caveLights.push(light);
  }
  this.ring=scene.add.graphics().setDepth(5000);this.effects=scene.add.graphics().setDepth(5001);
  this.atmosphere=scene.add.graphics().setScrollFactor(0).setDepth(9998);
  this.ghost=this.sprite('fire',0,0).setAlpha(.65).setVisible(false).setDepth(4900);
 }
 sprite(frame:string,x:number,y:number){const img=frame==='workbench'?this.scene.add.image(x,y,'workbench'):this.scene.add.image(x,y,'atlas',frame);img.setOrigin(.5,.89).setDepth(y);const h=heights[frame]??64;img.setScale(h/img.height);return img;}
 draw(dt:number,building:BuildingId|null,placement:PointLike){
  const m=this.model,p=m.player,s=this.scene,camera=s.cameras.main;this.wind+=dt;
  const moving=Math.hypot(p.vx,p.vy)>2&&!m.paused;const bob=moving?Math.abs(Math.sin(p.walk))*3:Math.sin(this.wind*2)*.6;
  const art=heroArt(m.inventory.equipment.mantle);
  if(this.player.texture.key!==art.key)this.player.setTexture(art.key);
  this.player.setPosition(p.x,p.y-bob+(p.actionTimer>0?8:0)).setFlipX(p.facing<0).setDepth(p.y).setAngle(moving?Math.sin(p.walk)*2:0).setAlpha(p.invulnerable>0&&Math.sin(this.wind*32)>0?.45:1);
  const normal=heights.hero/this.player.height;this.player.setScale(normal*(1+(p.actionTimer>0?.035:0)),normal*(p.actionTimer>0?.87:1));
  this.playerShadow.setPosition(p.x,p.y+1).setDepth(p.y-1);
  const heroY=p.y-bob+(p.actionTimer>0?8:0),papakha=m.inventory.equipment.headwear==='whitePapakha',heroAngle=moving?Math.sin(p.walk)*2:0;
  // Hard-lock the papakha's lower fur edge to the hero hairline in local character space.
  // The artwork itself now opens the face; this attachment point must not be raised to reveal it.
  const headLocalY=-this.player.displayHeight*PAPAKHA_FIT.world.foreheadY,headRad=Phaser.Math.DegToRad(heroAngle);
  const headX=p.x-headLocalY*Math.sin(headRad),headY=heroY+headLocalY*Math.cos(headRad);
  const attackX=p.actionTimer>0?1.035:1,attackY=p.actionTimer>0?.87:1;
  this.playerHeadwear.setVisible(papakha).setPosition(headX,headY).setDepth(p.y+.45).setAngle(heroAngle).setAlpha(this.player.alpha).setDisplaySize(PAPAKHA_FIT.world.width*attackX,PAPAKHA_FIT.world.height*attackY);
  const cave=m.location==='cave';for(const obj of this.caveObjects)(obj as any).setVisible(cave);for(const obj of this.worldDecor)(obj as any).setVisible(!cave);
  this.playerHeadwear.setVisible(!cave?papakha:papakha);
  const elderMark=!m.elderQuestCompleted&&(!m.elderQuestStarted||m.elderQuestKills>=5);
  this.elderQuestMarker.setVisible(!cave&&elderMark).setText(!m.elderQuestStarted?'!':'?');
  const view=camera.worldView;
  for(const n of m.world.nodes){const img=this.nodeSprites[n.id];const visible=!cave&&!n.depleted&&n.x>view.x-270&&n.x<view.right+270&&n.y>view.y-100&&n.y<view.bottom+310;img.setVisible(visible);if(!visible)continue;if(n.kind==='tree'||n.kind==='pine'){const hide=p.y<n.y&&p.y>n.y-img.displayHeight&&Math.abs(p.x-n.x)<img.displayWidth*.4;img.setAlpha(hide?.48:1);img.setRotation(Math.sin(this.wind*.6+n.id)*.007);}}
  for(const a of m.animals){const img=this.animalSprites[a.id],shadow=this.animalShadows[a.id];img.setVisible(!cave&&(a.state!=='dead'||!!(a.lootMeat||a.lootHide))).setPosition(a.x,a.y-(a.state==='flee'?Math.abs(Math.sin(a.walk))*5:0)).setDepth(a.y).setFlipX(a.facing<0).setAngle(a.state==='dead'?80:0).setAlpha(a.state==='dead'?.65:1);shadow.setPosition(a.x,a.y).setDepth(a.y-1).setVisible(img.visible);}
  for(const e of m.enemies){const img=this.enemySprites[e.id],shadow=this.enemyShadows[e.id],visible=!cave&&e.active&&(e.state!=='dead'||Object.values(e.loot).some(n=>n));const bob=e.state==='chase'?Math.abs(Math.sin(e.walk))*2:0;img.setVisible(visible).setPosition(e.x,e.y-bob).setDepth(e.y).setFlipX(e.facing<0).setAngle(e.state==='dead'?82:e.state==='windup'?(e.facing>0?-7:7):0).setAlpha(e.state==='dead'?.62:1);shadow.setVisible(visible).setPosition(e.x,e.y).setDepth(e.y-1);}
  for(const b of m.buildings.objects){if(!this.buildingSprites.has(b.id)){this.buildingSprites.set(b.id,this.sprite(b.kind,b.x,b.y));if(b.kind==='fire'){const light=s.add.image(b.x,b.y-20,'glow').setDisplaySize(360,290).setBlendMode(Phaser.BlendModes.ADD).setDepth(9999);light.setData('id',b.id);this.glow.push(light);}}const img=this.buildingSprites.get(b.id)!;img.setVisible(!cave);if(b.kind==='fire')img.setScale(heights.fire/img.height*(.98+Math.sin(this.wind*9+b.id)*.025));img.setAlpha(Math.min(1,b.born/1.5));}
  const wolf=m.caveWolf,wolfVisible=cave&&wolf.active&&(wolf.state!=='dead'||Object.values(wolf.loot).some(n=>!!n));const wolfBob=wolf.state==='chase'?Math.abs(Math.sin(wolf.walk))*3:0;
  this.caveWolfSprite.setVisible(wolfVisible).setPosition(wolf.x,wolf.y-wolfBob).setDepth(wolf.y).setFlipX(wolf.facing<0).setAngle(wolf.state==='dead'?86:wolf.state==='windup'?(wolf.facing>0?-6:6):0).setAlpha(wolf.state==='dead'?.70:1);
  this.caveWolfShadow.setVisible(wolfVisible).setPosition(wolf.x,wolf.y).setDepth(wolf.y-1);
  this.ring.clear();const interaction=m.interaction();if(interaction&&!m.paused&&!building){const n=interaction.target;const exit=interaction.kind==='caveExit';this.ring.lineStyle(exit?2.2:1.5,exit?0xd7c691:0xe1d2a2,exit?.92:.85);this.ring.strokeEllipse(n.x,n.y+4,exit?104:interaction.kind==='node'&&NODE_DATA[interaction.target.kind].tool?67:43,exit?30:19);}
  if(building){const valid=m.buildings.valid(building,placement.x,placement.y,p);this.ghost.setVisible(true);if(building==='workbench')this.ghost.setTexture('workbench');else this.ghost.setTexture('atlas',building);this.ghost.setPosition(placement.x,placement.y).setTint(valid?0xbddaad:0xe48476).setScale(heights[building]/this.ghost.height);this.ring.lineStyle(2,valid?0xbddaad:0xe48476,.9);this.ring.strokeEllipse(placement.x,placement.y,BUILDING_RADIUS[building]*2,BUILDING_RADIUS[building]);}else this.ghost.setVisible(false);
  this.effects.clear();
  if(!cave)for(const a of m.animals){if(a.state==='windup'){this.effects.lineStyle(2,0xdc825f,.9).strokeEllipse(a.x,a.y,75,31);this.effects.fillStyle(0xf1b780,1).fillTriangle(a.x,a.y-84,a.x-5,a.y-95,a.x+5,a.y-95);}if(a.hp<ANIMALS[a.kind].hp&&a.state!=='dead'){const y=a.y-(a.kind==='deer'?92:80);this.effects.fillStyle(0x13281d,.8).fillRoundedRect(a.x-22,y,44,4,2);this.effects.fillStyle(0xc6835c,1).fillRoundedRect(a.x-22,y,44*a.hp/ANIMALS[a.kind].hp,4,2);}}
  if(!cave)for(const e of m.enemies){if(!e.active||e.state==='dead')continue;const max=ENEMIES[e.kind].hp,w=e.kind==='chaborz'?70:48,y=e.y-(e.kind==='chaborz'?145:105);if(e.state==='windup'){this.effects.lineStyle(e.kind==='chaborz'?4:2,e.kind==='chaborz'?0xd5a25e:0xd87b62,.92).strokeEllipse(e.x,e.y,e.kind==='chaborz'?132:82,e.kind==='chaborz'?48:30);}if(e.hp<max){this.effects.fillStyle(0x13281d,.85).fillRoundedRect(e.x-w/2,y,w,5,2);this.effects.fillStyle(e.kind==='chaborz'?0xb77a4e:0xc6835c,1).fillRoundedRect(e.x-w/2,y,w*e.hp/max,5,2);}}
  if(cave&&wolf.active&&wolf.state!=='dead'){if(wolf.state==='windup'){const dir=wolf.facing>0?0:Math.PI;this.effects.lineStyle(3,0xd24a4a,.62);this.effects.beginPath();this.effects.arc(wolf.x,wolf.y-8,92,dir-.62,dir+.62);this.effects.strokePath();this.effects.fillStyle(0xef6a63,.78).fillCircle(wolf.x+wolf.facing*62,wolf.y-58,3.5);}if(wolf.hp<wolf.maxHp){this.effects.fillStyle(0x080b0b,.88).fillRoundedRect(wolf.x-58,wolf.y-128,116,6,3);this.effects.fillStyle(0xa92228,1).fillRoundedRect(wolf.x-58,wolf.y-128,116*wolf.hp/wolf.maxHp,6,3);}}
  if(p.attackTimer>.36){const progress=(.6-p.attackTimer)/.24;this.effects.lineStyle(3,0xf6e7bd,.8*(1-progress));this.effects.beginPath();this.effects.arc(p.x+p.facing*8,p.y-30,53,p.facing>0?-.9+progress:Math.PI-.9+progress,p.facing>0?.5+progress:Math.PI+.5+progress);this.effects.strokePath();}
  // Moving glints in the river; no continuously rebuilt terrain texture.
  if(!cave){this.effects.lineStyle(1,0xc5e9db,.24);for(let i=0;i<40;i++){const y=(i*71+this.wind*16)%2600,x=riverX(y)+Math.sin(i*6)*35;if(y>view.y&&y<view.bottom)this.effects.lineBetween(x,y,x+10+Math.sin(i)*8,y+2);}}
  const w=s.scale.width,h=s.scale.height;this.atmosphere.clear();const dark=m.day.darkness;
  if(cave){
   this.atmosphere.fillStyle(0x020606,.18).fillRect(0,0,w,h);
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
