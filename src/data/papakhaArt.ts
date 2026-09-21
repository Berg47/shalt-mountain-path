type PapakhaMode='wear'|'icon';

function mulberry32(seed:number){
 let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
}

export const PAPAKHA_FIT={
 // The anchor is the forehead/hairline, not a free-floating point above the hero.
 // Keep the world version only slightly wider than the head.
 world:{width:29,height:22,foreheadY:.885,originY:.856},
 preview:{width:46,height:38,left:50,top:1},
} as const;

export function drawWhitePapakha(ctx:CanvasRenderingContext2D,width:number,height:number,mode:PapakhaMode='wear'){
 const rand=mulberry32(mode==='icon'?90417:4815);
 ctx.clearRect(0,0,width,height);ctx.imageSmoothingEnabled=true;
 const sx=width/420,sy=height/320;
 ctx.save();ctx.scale(sx,sy);
 if(mode==='icon'){ctx.translate(210,160);ctx.rotate(-.055);ctx.scale(.96,1);ctx.translate(-210,-160);}

 const path=()=>{
  ctx.beginPath();
  // Tall sheepskin papakha: almost vertical sides, softly uneven crown, compact lower edge.
  ctx.moveTo(92,268);
  ctx.bezierCurveTo(85,226,85,160,92,105);
  ctx.bezierCurveTo(99,72,123,50,155,42);
  ctx.bezierCurveTo(184,34,205,36,218,33);
  ctx.bezierCurveTo(242,33,269,36,291,44);
  ctx.bezierCurveTo(321,55,335,78,339,108);
  ctx.bezierCurveTo(346,164,344,224,330,268);
  // The lower edge is deliberately shallow: it rests on the hairline instead of drooping over the eyes.
  ctx.bezierCurveTo(289,274,252,273,211,270);
  ctx.bezierCurveTo(170,273,133,274,92,268);
  ctx.closePath();
 };

 // Very soft object shadow. No dark "helmet opening".
 const shadow=ctx.createRadialGradient(210,278,15,210,278,143);
 shadow.addColorStop(0,'rgba(48,44,38,.18)');shadow.addColorStop(1,'rgba(48,44,38,0)');
 ctx.fillStyle=shadow;ctx.beginPath();ctx.ellipse(210,278,143,15,0,0,Math.PI*2);ctx.fill();

 const base=ctx.createLinearGradient(108,43,326,276);
 base.addColorStop(0,'#fffdf2');
 base.addColorStop(.25,'#f3eee0');
 base.addColorStop(.55,'#ded8c9');
 base.addColorStop(.78,'#cbc4b5');
 base.addColorStop(1,'#aaa397');
 ctx.fillStyle=base;path();ctx.fill();

 ctx.save();path();ctx.clip();

 // Volume: bright crown/front, restrained gray-cream side shading.
 let light=ctx.createRadialGradient(171,86,8,200,127,175);
 light.addColorStop(0,'rgba(255,255,250,.54)');
 light.addColorStop(.55,'rgba(255,250,237,.13)');
 light.addColorStop(1,'rgba(255,250,237,0)');
 ctx.fillStyle=light;ctx.fillRect(65,20,305,280);

 let side=ctx.createLinearGradient(78,0,350,0);
 side.addColorStop(0,'rgba(88,84,78,.18)');
 side.addColorStop(.18,'rgba(88,84,78,0)');
 side.addColorStop(.70,'rgba(92,87,80,0)');
 side.addColorStop(1,'rgba(72,69,64,.22)');
 ctx.fillStyle=side;ctx.fillRect(70,36,300,245);

 // Large curls survive downscaling and still read as sheep wool in the game.
 ctx.lineCap='round';ctx.lineJoin='round';
 for(let i=0;i<430;i++){
  const x=93+rand()*243,y=45+rand()*221;
  const edge=Math.min((x-86)/32,(343-x)/32,(y-36)/35,(278-y)/30);
  if(edge<rand()*.68)continue;
  const r=3.8+rand()*8.7,turn=.75+rand()*1.15,ang=rand()*Math.PI*2;
  ctx.strokeStyle=rand()>.70?'rgba(255,255,249,.75)':rand()>.28?'rgba(168,161,148,.36)':'rgba(96,91,84,.22)';
  ctx.lineWidth=1.4+rand()*2.5;
  ctx.beginPath();
  for(let s=0;s<=10;s++){
   const a=ang+s/10*Math.PI*2*turn,rr=r*(.58+s/24);
   const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr*.62;
   if(s===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
  }
  ctx.stroke();
 }

 // Softer wool tufts break up the surface without turning it into a white blob.
 for(let i=0;i<110;i++){
  const x=103+rand()*221,y=53+rand()*206,rx=4+rand()*10,ry=2.7+rand()*6;
  ctx.strokeStyle=rand()>.57?'rgba(255,255,246,.30)':'rgba(84,80,74,.12)';
  ctx.lineWidth=1+rand()*1.9;
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,rand()*1.2,0,Math.PI*1.6);ctx.stroke();
 }

 // Slightly darker, almost-horizontal lower fur edge that sits on the hairline.
 const band=ctx.createLinearGradient(0,244,0,274);
 band.addColorStop(0,'rgba(213,206,191,.04)');
 band.addColorStop(.62,'rgba(118,111,100,.16)');
 band.addColorStop(1,'rgba(64,60,55,.24)');
 ctx.fillStyle=band;
 ctx.beginPath();
 ctx.moveTo(92,255);
 ctx.bezierCurveTo(134,263,172,265,211,263);
 ctx.bezierCurveTo(251,265,290,263,330,255);
 ctx.lineTo(330,268);
 ctx.bezierCurveTo(289,274,251,273,211,270);
 ctx.bezierCurveTo(170,273,133,274,92,268);
 ctx.closePath();ctx.fill();

 ctx.restore();

 // Irregular fibers around the silhouette.
 ctx.strokeStyle='rgba(242,237,222,.78)';ctx.lineWidth=1.25;
 for(let i=0;i<72;i++){
  const sidePick=rand();let x:number,y:number,dx:number,dy:number;
  if(sidePick<.28){x=91+rand()*28;y=83+rand()*168;dx=-2-rand()*5;dy=(rand()-.5)*7;}
  else if(sidePick<.56){x=333-rand()*28;y=83+rand()*168;dx=2+rand()*5;dy=(rand()-.5)*7;}
  else{x=132+rand()*170;y=39+rand()*14;dx=(rand()-.5)*7;dy=-2-rand()*5;}
  ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+dx*.5,y+dy*.35,x+dx,y+dy);ctx.stroke();
 }

 // Clear lower contour helps the hat read at 20-30px without covering the face.
 ctx.strokeStyle='rgba(77,72,65,.30)';ctx.lineWidth=3.8;
 ctx.beginPath();ctx.moveTo(94,266);ctx.bezierCurveTo(136,272,173,272,211,269);ctx.bezierCurveTo(249,272,288,272,328,266);ctx.stroke();
 ctx.restore();
}

let wearUrl='',iconUrl='';
function makeUrl(mode:PapakhaMode){
 if(typeof document==='undefined')return '';
 const canvas=document.createElement('canvas');canvas.width=420;canvas.height=320;
 drawWhitePapakha(canvas.getContext('2d')!,canvas.width,canvas.height,mode);
 return canvas.toDataURL('image/png');
}
export function whitePapakhaUrl(mode:PapakhaMode='wear'){
 if(mode==='icon')return iconUrl||(iconUrl=makeUrl('icon'));
 return wearUrl||(wearUrl=makeUrl('wear'));
}
export function whitePapakhaImg(className:string,mode:PapakhaMode='icon',alt=''){
 return `<img class="${className}" src="${whitePapakhaUrl(mode)}" alt="${alt}" draggable="false">`;
}
