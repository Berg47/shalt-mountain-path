type PapakhaMode='wear'|'icon';

function mulberry32(seed:number){
 let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
}

export const PAPAKHA_FIT={
 world:{width:34,height:27,foreheadY:.915,originY:.80},
 preview:{width:58,height:45,left:50,top:3},
} as const;

export function drawWhitePapakha(ctx:CanvasRenderingContext2D,width:number,height:number,mode:PapakhaMode='wear'){
 const rand=mulberry32(mode==='icon'?90417:4815);
 ctx.clearRect(0,0,width,height);ctx.imageSmoothingEnabled=true;
 const sx=width/420,sy=height/320;
 ctx.save();ctx.scale(sx,sy);
 if(mode==='icon'){ctx.translate(210,160);ctx.rotate(-.065);ctx.scale(.94,1);ctx.translate(-210,-160);}
 const path=()=>{
  ctx.beginPath();
  ctx.moveTo(101,253);
  ctx.bezierCurveTo(91,224,88,176,95,125);
  ctx.bezierCurveTo(104,64,151,34,207,31);
  ctx.bezierCurveTo(267,27,313,56,326,116);
  ctx.bezierCurveTo(336,164,334,215,322,252);
  ctx.bezierCurveTo(292,269,256,277,210,276);
  ctx.bezierCurveTo(165,277,129,269,101,253);
  ctx.closePath();
 };
 const shadow=ctx.createRadialGradient(210,265,18,210,265,128);
 shadow.addColorStop(0,'rgba(45,42,36,.28)');shadow.addColorStop(1,'rgba(45,42,36,0)');
 ctx.fillStyle=shadow;ctx.beginPath();ctx.ellipse(210,265,128,19,0,0,Math.PI*2);ctx.fill();
 const base=ctx.createLinearGradient(128,49,292,267);
 base.addColorStop(0,'#fffdf1');base.addColorStop(.27,'#f1ecdd');base.addColorStop(.56,'#ded8c8');base.addColorStop(.80,'#c9c2b3');base.addColorStop(1,'#aaa497');
 ctx.fillStyle=base;path();ctx.fill();
 ctx.save();path();ctx.clip();
 // Broad tonal modeling: brighter crown, darker side/lower edge.
 let light=ctx.createRadialGradient(170,84,12,192,126,150);
 light.addColorStop(0,'rgba(255,255,248,.48)');light.addColorStop(.55,'rgba(255,250,235,.12)');light.addColorStop(1,'rgba(255,250,235,0)');
 ctx.fillStyle=light;ctx.fillRect(70,20,290,270);
 let side=ctx.createLinearGradient(82,0,342,0);
 side.addColorStop(0,'rgba(93,88,80,.16)');side.addColorStop(.19,'rgba(93,88,80,0)');side.addColorStop(.72,'rgba(96,91,82,0)');side.addColorStop(1,'rgba(76,72,67,.20)');
 ctx.fillStyle=side;ctx.fillRect(78,45,270,230);
 // Dense wool curls. Larger curled loops remain visible when scaled to game size.
 ctx.lineCap='round';ctx.lineJoin='round';
 for(let i=0;i<390;i++){
  const x=103+rand()*220,y=48+rand()*202;
  const edge=Math.min((x-95)/30,(330-x)/30,(y-34)/35,(270-y)/32);
  if(edge<rand()*.75)continue;
  const r=3.2+rand()*8.2,turn=.9+rand()*1.45,ang=rand()*Math.PI*2;
  ctx.strokeStyle=rand()>.72?'rgba(255,255,250,.72)':rand()>.28?'rgba(173,166,151,.34)':'rgba(102,98,91,.22)';
  ctx.lineWidth=1.35+rand()*2.7;
  ctx.beginPath();
  for(let s=0;s<=9;s++){
   const a=ang+s/9*Math.PI*2*turn,rr=r*(.62+s/22);
   const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr*.62;
   if(s===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
  }
  ctx.stroke();
 }
 // Soft tufts and deeper curl shadows.
 for(let i=0;i<95;i++){
  const x=112+rand()*198,y=56+rand()*185,rx=5+rand()*11,ry=3+rand()*7;
  ctx.strokeStyle=rand()>.55?'rgba(255,255,246,.32)':'rgba(87,84,78,.13)';
  ctx.lineWidth=1.1+rand()*2;ctx.beginPath();ctx.ellipse(x,y,rx,ry,rand()*1.2,0,Math.PI*1.55);ctx.stroke();
 }
 // Lower fur band that visually hugs the forehead rather than floating above it.
 const band=ctx.createLinearGradient(0,228,0,278);
 band.addColorStop(0,'rgba(216,210,195,.12)');band.addColorStop(.55,'rgba(118,113,102,.20)');band.addColorStop(1,'rgba(65,62,57,.28)');
 ctx.fillStyle=band;ctx.beginPath();ctx.moveTo(101,247);ctx.bezierCurveTo(145,260,174,265,210,264);ctx.bezierCurveTo(248,265,282,260,322,246);ctx.lineTo(322,258);ctx.bezierCurveTo(281,276,248,282,210,281);ctx.bezierCurveTo(170,282,135,275,101,257);ctx.closePath();ctx.fill();
 ctx.restore();
 // Fine irregular silhouette fibers so it never reads as a smooth cylinder.
 ctx.strokeStyle='rgba(241,236,221,.76)';ctx.lineWidth=1.3;
 for(let i=0;i<64;i++){
  const sidePick=rand();
  let x:number,y:number,dx:number,dy:number;
  if(sidePick<.26){x=102+rand()*35;y=92+rand()*148;dx=-2-rand()*5;dy=(rand()-.5)*7;}
  else if(sidePick<.52){x=318-rand()*31;y=91+rand()*149;dx=2+rand()*5;dy=(rand()-.5)*7;}
  else{x=132+rand()*158;y=40+rand()*17;dx=(rand()-.5)*7;dy=-2-rand()*5;}
  ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+dx*.5,y+dy*.35,x+dx,y+dy);ctx.stroke();
 }
 // Defined but soft bottom contour.
 ctx.strokeStyle='rgba(75,71,64,.30)';ctx.lineWidth=4.5;
 ctx.beginPath();ctx.moveTo(104,252);ctx.bezierCurveTo(145,269,176,273,210,272);ctx.bezierCurveTo(245,273,279,268,318,251);ctx.stroke();
 ctx.restore();
}

let wearUrl='',iconUrl='';
function makeUrl(mode:PapakhaMode){
 if(typeof document==='undefined')return '';
 const canvas=document.createElement('canvas');
 canvas.width=mode==='icon'?420:420;canvas.height=320;
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
