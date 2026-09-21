type PapakhaMode='wear'|'icon';

function mulberry32(seed:number){
 let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
}

export const PAPAKHA_FIT={
 // Anchor the lower fur edge directly to the hero hairline. The hat overlaps the head,
 // while its compact lower contour stays above the eyebrows so the face remains visible.
 world:{width:30,height:21,foreheadY:.815,originY:.80},
 preview:{width:44,height:34,left:50,top:8},
} as const;

export function drawWhitePapakha(ctx:CanvasRenderingContext2D,width:number,height:number,mode:PapakhaMode='wear'){
 const rand=mulberry32(mode==='icon'?90417:4815);
 ctx.clearRect(0,0,width,height);ctx.imageSmoothingEnabled=true;
 const sx=width/420,sy=height/320;
 ctx.save();ctx.scale(sx,sy);
 if(mode==='icon'){ctx.translate(210,160);ctx.rotate(-.035);ctx.scale(.98,1);ctx.translate(-210,-160);}

 const path=()=>{
  ctx.beginPath();
  // Compact Caucasian sheepskin papakha. The lower edge is deliberately shallow and
  // almost horizontal so it sits on the head instead of becoming a second "face" layer.
  ctx.moveTo(96,250);
  ctx.bezierCurveTo(90,213,90,151,98,104);
  ctx.bezierCurveTo(104,70,126,49,157,41);
  ctx.bezierCurveTo(181,34,198,36,211,33);
  ctx.bezierCurveTo(231,33,259,35,284,42);
  ctx.bezierCurveTo(315,51,331,73,335,104);
  ctx.bezierCurveTo(343,153,342,211,325,250);
  ctx.bezierCurveTo(287,255,249,255,211,253);
  ctx.bezierCurveTo(172,255,134,255,96,250);
  ctx.closePath();
 };

 // Soft contact shadow only at the lower fur edge; it makes the hat feel seated on the head.
 const contact=ctx.createRadialGradient(210,251,10,210,251,120);
 contact.addColorStop(0,'rgba(53,48,42,.23)');contact.addColorStop(.72,'rgba(53,48,42,.07)');contact.addColorStop(1,'rgba(53,48,42,0)');
 ctx.fillStyle=contact;ctx.beginPath();ctx.ellipse(210,251,121,12,0,0,Math.PI*2);ctx.fill();

 const base=ctx.createLinearGradient(104,45,327,254);
 base.addColorStop(0,'#fffdf3');
 base.addColorStop(.22,'#f5f0e3');
 base.addColorStop(.52,'#e5ddcd');
 base.addColorStop(.78,'#cec5b5');
 base.addColorStop(1,'#aca397');
 ctx.fillStyle=base;path();ctx.fill();

 ctx.save();path();ctx.clip();

 // Broad painterly lighting survives the very small in-game scale.
 let light=ctx.createRadialGradient(166,79,10,194,117,176);
 light.addColorStop(0,'rgba(255,255,250,.62)');
 light.addColorStop(.58,'rgba(255,250,235,.12)');
 light.addColorStop(1,'rgba(255,250,235,0)');
 ctx.fillStyle=light;ctx.fillRect(70,24,300,255);

 const side=ctx.createLinearGradient(82,0,344,0);
 side.addColorStop(0,'rgba(74,70,65,.20)');
 side.addColorStop(.17,'rgba(74,70,65,0)');
 side.addColorStop(.72,'rgba(76,72,66,0)');
 side.addColorStop(1,'rgba(66,62,58,.24)');
 ctx.fillStyle=side;ctx.fillRect(70,35,300,230);

 // Dense wool curls: large enough to remain visible after downscaling, irregular enough
 // to read as fur rather than a smooth white blob.
 ctx.lineCap='round';ctx.lineJoin='round';
 for(let i=0;i<500;i++){
  const x=96+rand()*232,y=43+rand()*205;
  const edge=Math.min((x-88)/28,(341-x)/28,(y-34)/29,(259-y)/23);
  if(edge<rand()*.72)continue;
  const r=3.4+rand()*7.9,turn=.72+rand()*1.12,ang=rand()*Math.PI*2;
  ctx.strokeStyle=rand()>.72?'rgba(255,255,248,.78)':rand()>.26?'rgba(161,154,142,.38)':'rgba(91,86,79,.22)';
  ctx.lineWidth=1.25+rand()*2.35;
  ctx.beginPath();
  for(let s=0;s<=9;s++){
   const a=ang+s/9*Math.PI*2*turn,rr=r*(.58+s/25);
   const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr*.61;
   if(s===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
  }
  ctx.stroke();
 }

 // Short directional tufts break up the silhouette and give a real sheepskin edge.
 for(let i=0;i<130;i++){
  const x=106+rand()*211,y=50+rand()*193,rx=3.5+rand()*8.5,ry=2.5+rand()*5;
  ctx.strokeStyle=rand()>.56?'rgba(255,255,246,.34)':'rgba(80,76,70,.13)';
  ctx.lineWidth=.9+rand()*1.7;
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,rand()*1.25,0,Math.PI*1.55);ctx.stroke();
 }

 // A narrow underside gives visual contact without covering the face.
 const band=ctx.createLinearGradient(0,235,0,255);
 band.addColorStop(0,'rgba(210,202,187,.02)');
 band.addColorStop(.58,'rgba(112,104,94,.12)');
 band.addColorStop(1,'rgba(61,56,51,.25)');
 ctx.fillStyle=band;
 ctx.beginPath();ctx.moveTo(97,242);ctx.bezierCurveTo(136,248,174,249,211,247);ctx.bezierCurveTo(249,249,287,248,324,242);ctx.lineTo(325,250);ctx.bezierCurveTo(287,255,249,255,211,253);ctx.bezierCurveTo(172,255,134,255,96,250);ctx.closePath();ctx.fill();

 ctx.restore();

 // Fine fibers along the outside contour.
 ctx.strokeStyle='rgba(242,237,222,.80)';ctx.lineWidth=1.15;
 for(let i=0;i<82;i++){
  const sidePick=rand();let x:number,y:number,dx:number,dy:number;
  if(sidePick<.29){x=96+rand()*24;y=78+rand()*155;dx=-2-rand()*4.5;dy=(rand()-.5)*6;}
  else if(sidePick<.58){x=325-rand()*22;y=78+rand()*155;dx=2+rand()*4.5;dy=(rand()-.5)*6;}
  else{x=133+rand()*158;y=38+rand()*14;dx=(rand()-.5)*6;dy=-2-rand()*4.5;}
  ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+dx*.55,y+dy*.35,x+dx,y+dy);ctx.stroke();
 }

 // Crisp lower contour is the registration line used by the world/character preview.
 ctx.strokeStyle='rgba(72,67,61,.33)';ctx.lineWidth=3.4;
 ctx.beginPath();ctx.moveTo(97,249);ctx.bezierCurveTo(136,254,174,254,211,252);ctx.bezierCurveTo(249,254,287,254,324,249);ctx.stroke();
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
