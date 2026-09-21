import Phaser from 'phaser';
import {SaveSystem} from '../systems/SaveSystem';
import {icon} from '../ui/icons';
import {AudioSystem} from '../systems/AudioSystem';

type IntroSceneId='belt'|'brother-one'|'brother-two'|'decision'|'father'|'grandfather-farewell'|'mother-farewell'|'valley';
type MaleRole='hero'|'grandfather'|'father'|'brother';

const STORY=[
 {scene:'belt' as IntroSceneId,chapter:'I · ПОЯС',speaker:'Дедушка',text:'Сегодня ты принимаешь свой первый шалт. Носи его с достоинством. Пусть твоя рука прежде умеет помогать, чем защищать.',note:'Юкъ йехкар · семейное вручение пояса и кинжала'},
 {scene:'brother-one' as IntroSceneId,chapter:'I · ПОЯС',speaker:'Старший брат',text:'Ну что, пояс надел, шалт получил — теперь уже взрослым себя считаешь?',note:''},
 {scene:'brother-two' as IntroSceneId,chapter:'I · ПОЯС',speaker:'Второй брат',text:'Шалт на поясе — ещё не сила. Важно, чего стоит тот, кто его носит.',note:''},
 {scene:'decision' as IntroSceneId,chapter:'II · РЕШЕНИЕ',speaker:'Юноша',text:'Я не стану спорить. Уйду в горы, найду себе кров и пищу. Вернусь — сами увидите, чему я научился.',note:''},
 {scene:'father' as IntroSceneId,chapter:'II · РЕШЕНИЕ',speaker:'Отец',text:'Горы не прощают беспечности. Смотри на погоду, береги силы. И помни дорогу домой.',note:''},
 {scene:'grandfather-farewell' as IntroSceneId,chapter:'III · ПРОЩАНИЕ',speaker:'Дедушка',text:'Вижу, ты уже решил. Учись у гор терпению. Вернуться за помощью — не стыдно.',note:''},
 {scene:'mother-farewell' as IntroSceneId,chapter:'III · ПРОЩАНИЕ',speaker:'Мать',text:'Береги себя, сын. Не рискуй зря. Возвращайся.',note:''},
 {scene:'valley' as IntroSceneId,chapter:'IV · ПЕРВЫЙ ШАГ',speaker:'Путь в горы',text:'За спиной осталось селение. Впереди — лес, вода и незнакомые тропы. Тебе пятнадцать. На поясе — шалт. Всё остальное ты сделаешь своими руками.',note:'Уход в горы — художественная история героя, а не часть обряда.'},
];

const sceneLabel:Record<IntroSceneId,string>={
 belt:'Дедушка вручает юноше первый шалт',
 'brother-one':'Разговор со старшим братом',
 'brother-two':'Разговор со вторым братом',
 decision:'Юноша принимает решение уйти в горы',
 father:'Отец даёт сыну короткий совет перед дорогой',
 'grandfather-farewell':'Прощание с дедушкой',
 'mother-farewell':'Юноша отдельно прощается с матерью',
 valley:'Юноша в черкеске выходит из селения к горной долине',
};

function maleFigure(role:MaleRole,x:number,y:number,scale=1,facing:1|-1=1,coat?:string){
 const isHero=role==='hero';
 const isGrandfather=role==='grandfather';
 const isFather=role==='father';
 const coatColor=coat??(isHero?'#313f36':isGrandfather?'#3c3933':isFather?'#303b3a':'#41463d');
 const beard=isGrandfather?`<path d="M-19 -198 Q-7 -178 0 -176 Q8 -178 20 -198 Q13 -168 0 -162 Q-13 -168 -19 -198Z" fill="#ddd4bf" opacity=".92"/>`:isFather?`<path d="M-17 -197 Q-9 -181 0 -179 Q10 -181 18 -197 Q13 -173 0 -169 Q-13 -173 -17 -197Z" fill="#302923" opacity=".9"/>`:`<path d="M-13 -192 Q0 -184 13 -192 Q7 -181 0 -180 Q-7 -181 -13 -192Z" fill="#302923" opacity=".52"/>`;
 const headwear=isHero?`<path d="M-23 -223 Q-2 -242 23 -224 L21 -214 Q0 -223 -21 -213Z" fill="#211f1c"/>`:`<path d="M-29 -232 Q0 -252 29 -232 L26 -211 Q0 -218 -26 -211Z" fill="#272724"/><ellipse cx="0" cy="-231" rx="29" ry="11" fill="#34332f"/>`;
 return `<g class="intro-person intro-${role}" transform="translate(${x} ${y}) scale(${facing*scale} ${scale})">
  <ellipse cx="0" cy="4" rx="50" ry="10" fill="#081813" opacity=".3"/>
  <path d="M-21 -57 L-15 -3 L-2 -3 L0 -57Z" fill="#252923"/><path d="M21 -57 L15 -3 L2 -3 L0 -57Z" fill="#20251f"/>
  <path d="M-17 -7 L-3 -7 L-1 0 L-20 0Z" fill="#171b18"/><path d="M17 -7 L3 -7 L1 0 L20 0Z" fill="#171b18"/>
  <path d="M-35 -159 Q-29 -171 -16 -174 L16 -174 Q29 -171 35 -159 L30 -115 L46 -57 Q23 -47 0 -53 Q-23 -47 -46 -57 L-30 -115Z" fill="${coatColor}" stroke="#131d18" stroke-width="3"/>
  <path d="M-6 -173 L-6 -154 L6 -154 L6 -173Z" fill="#46554a"/>
  <path d="M-28 -157 Q-45 -130 -48 -90" fill="none" stroke="${coatColor}" stroke-width="16" stroke-linecap="round"/><path d="M28 -157 Q45 -130 48 -90" fill="none" stroke="${coatColor}" stroke-width="16" stroke-linecap="round"/>
  <circle cx="-49" cy="-86" r="7" fill="#b89070"/><circle cx="49" cy="-86" r="7" fill="#b89070"/>
  <rect x="-34" y="-121" width="68" height="8" rx="2" fill="#6a543c"/><circle cx="0" cy="-117" r="4" fill="#b9a46d"/>
  <path d="M22 -116 L32 -69 L38 -70 L28 -118Z" fill="#2a2520" stroke="#b8a571" stroke-width="2"/><path d="M26 -69 L44 -65 L35 -57 L25 -59Z" fill="#b7a06d"/>
  <ellipse cx="0" cy="-203" rx="25" ry="29" fill="#b98c68"/>
  <path d="M-13 -205 Q-5 -208 0 -207" stroke="#2a231e" stroke-width="3" stroke-linecap="round"/><path d="M4 -207 Q11 -209 16 -205" stroke="#2a231e" stroke-width="3" stroke-linecap="round"/>
  <ellipse cx="-8" cy="-201" rx="2.3" ry="2" fill="#171412"/><ellipse cx="9" cy="-201" rx="2.3" ry="2" fill="#171412"/>
  <path d="M2 -199 L5 -187 L-1 -187" fill="none" stroke="#7f5e49" stroke-width="2" stroke-linecap="round"/>
  ${beard}${headwear}
 </g>`;
}

function motherFigure(x:number,y:number,scale=1,facing:1|-1=1){
 return `<g class="intro-person intro-mother" transform="translate(${x} ${y}) scale(${facing*scale} ${scale})">
  <ellipse cx="0" cy="4" rx="47" ry="10" fill="#081813" opacity=".28"/>
  <path d="M-31 -154 Q0 -174 31 -154 L43 -25 Q0 -11 -43 -25Z" fill="#4c5147" stroke="#202a23" stroke-width="3"/>
  <path d="M-22 -149 Q-39 -124 -43 -91" fill="none" stroke="#4c5147" stroke-width="15" stroke-linecap="round"/><path d="M22 -149 Q38 -127 43 -98" fill="none" stroke="#4c5147" stroke-width="15" stroke-linecap="round"/>
  <circle cx="-43" cy="-89" r="6" fill="#b88b69"/><circle cx="43" cy="-96" r="6" fill="#b88b69"/>
  <ellipse cx="0" cy="-193" rx="23" ry="28" fill="#b88b69"/>
  <path d="M-34 -201 Q0 -236 34 -201 Q27 -166 18 -157 Q4 -171 -20 -158 Q-31 -174 -34 -201Z" fill="#353a34"/>
  <path d="M-15 -199 Q-8 -203 -2 -200" stroke="#30251f" stroke-width="2.5" stroke-linecap="round"/><path d="M4 -200 Q11 -203 16 -198" stroke="#30251f" stroke-width="2.5" stroke-linecap="round"/>
  <ellipse cx="-8" cy="-194" rx="2" ry="2" fill="#171412"/><ellipse cx="9" cy="-194" rx="2" ry="2" fill="#171412"/>
  <path d="M1 -191 L4 -181 L-1 -181" fill="none" stroke="#815f4b" stroke-width="1.7"/>
 </g>`;
}

function backdrop(scene:IntroSceneId){
 const dawn=scene==='mother-farewell'||scene==='valley';
 const inside=scene==='belt'||scene==='brother-one'||scene==='brother-two';
 if(inside)return `<rect width="1600" height="900" fill="url(#indoor)"/><path d="M0 620 L1600 560 L1600 900 L0 900Z" fill="#2b3029"/><rect x="155" y="145" width="360" height="430" rx="3" fill="#4d5148"/><rect x="187" y="178" width="296" height="365" fill="#202a24"/><path d="M1140 120 H1420 V610 H1140Z" fill="#4a4d44"/><path d="M1180 160 H1380 V560 H1180Z" fill="#1a2621"/><path d="M1180 160 L1380 160 L1300 350 L1250 350Z" fill="#5e6c5b" opacity=".45"/><path d="M0 610 Q440 530 760 595 T1600 565" fill="none" stroke="#777264" stroke-width="12" opacity=".4"/>`;
 return `<rect width="1600" height="900" fill="url(#${dawn?'dawn':'sky'})"/><circle cx="1250" cy="155" r="62" fill="#f0d5a0" opacity="${dawn?'.52':'.22'}"/><path d="M0 470 L230 258 L390 402 L610 190 L820 405 L1010 235 L1210 410 L1390 250 L1600 445 L1600 900 L0 900Z" fill="#34483f"/><path d="M0 535 L240 360 L430 505 L720 300 L920 518 L1170 330 L1390 500 L1600 390 L1600 900 L0 900Z" fill="#405448" opacity=".93"/><path d="M0 620 Q250 520 500 594 T980 580 T1600 560 L1600 900 L0 900Z" fill="#53604b"/><path d="M0 700 Q380 600 700 675 T1200 650 T1600 625 L1600 900 L0 900Z" fill="#4b5643"/><g opacity=".88"><path d="M200 590 H315 V710 H200Z" fill="#747066"/><path d="M184 590 L258 540 L332 590Z" fill="#4c5148"/><path d="M350 570 H450 V700 H350Z" fill="#777168"/><path d="M334 570 L400 526 L467 570Z" fill="#50554b"/><path d="M515 488 H590 V698 H515Z" fill="#64635b"/><path d="M505 488 L552 430 L600 488Z" fill="#464d45"/><rect x="542" y="525" width="20" height="34" fill="#28342e"/><rect x="542" y="585" width="20" height="34" fill="#28342e"/></g><path d="M580 900 Q760 706 1010 660 Q1260 615 1600 700 L1600 900Z" fill="#70664d" opacity=".5"/>`;
}

function sceneFigures(scene:IntroSceneId){
 switch(scene){
  case 'belt':return `${maleFigure('grandfather',690,745,1.18,1)}${maleFigure('hero',935,748,1.08,-1,'#2f4036')}<path d="M765 545 Q810 565 850 547" fill="none" stroke="#ba9f6f" stroke-width="7" stroke-linecap="round" opacity=".75"/>`;
  case 'brother-one':return `${maleFigure('brother',700,748,1.18,1,'#3d4038')}${maleFigure('hero',935,748,1.08,-1,'#2f4036')}`;
  case 'brother-two':return `${maleFigure('hero',725,748,1.08,1,'#2f4036')}${maleFigure('brother',970,748,1.16,-1,'#41443b')}`;
  case 'decision':return `${maleFigure('hero',880,748,1.18,1,'#2f4036')}<path d="M955 622 Q1008 600 1044 632 L1032 705 Q985 722 946 697Z" fill="#6a543b" stroke="#2b2a24" stroke-width="4"/>`;
  case 'father':return `${maleFigure('father',700,752,1.2,1,'#303a38')}${maleFigure('hero',938,752,1.08,-1,'#2f4036')}`;
  case 'grandfather-farewell':return `${maleFigure('grandfather',702,752,1.18,1)}${maleFigure('hero',950,752,1.08,-1,'#2f4036')}`;
  case 'mother-farewell':return `${motherFigure(700,752,1.18,1)}${maleFigure('hero',940,752,1.08,-1,'#2f4036')}<path d="M758 624 Q800 606 836 619" fill="none" stroke="#b88b69" stroke-width="7" stroke-linecap="round" opacity=".8"/>`;
  case 'valley':return `${maleFigure('hero',1035,755,.98,1,'#2f4036')}<path d="M1065 620 Q1115 600 1144 632 L1132 706 Q1091 720 1055 699Z" fill="#69543b" stroke="#2a2822" stroke-width="4"/>`;
 }
}

function storyArt(scene:IntroSceneId){
 return `<div class="intro-art intro-illustration" role="img" aria-label="${sceneLabel[scene]}" style="overflow:hidden;pointer-events:none"><svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style="width:100%;height:100%;display:block"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fa8a0"/><stop offset=".55" stop-color="#697c6f"/><stop offset="1" stop-color="#425748"/></linearGradient><linearGradient id="dawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a9588"/><stop offset=".42" stop-color="#817c6d"/><stop offset="1" stop-color="#47594a"/></linearGradient><linearGradient id="indoor" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#606054"/><stop offset=".45" stop-color="#3a433a"/><stop offset="1" stop-color="#1f2d27"/></linearGradient></defs>${backdrop(scene)}${sceneFigures(scene)}</svg></div>`;
}

export class IntroScene extends Phaser.Scene {
 root=document.getElementById('ui')!;abort=new AbortController();index=-1;audio=new AudioSystem();
 constructor(){super('IntroScene');}
 create(){this.abort=new AbortController();this.index=-1;this.title();const img=new Image();img.src='/art/shalt-valley.png';this.root.addEventListener('click',e=>{const target=(e.target as HTMLElement).closest<HTMLElement>('button');if(!target)return;this.audio.unlock();const a=target.dataset.action;if(a==='new'){if(SaveSystem.read())this.confirmNew();else this.next();}else if(a==='confirm-new'){this.index=-1;this.next();}else if(a==='continue')this.startGame(true);else if(a==='next')this.next();else if(a==='skip')this.startGame(false);else if(a==='back')this.title();else if(a==='intro-help')this.help();},{signal:this.abort.signal});document.addEventListener('keydown',e=>{if(this.index>=0&&(e.code==='Space'||e.code==='Enter')){e.preventDefault();this.next();}},{signal:this.abort.signal});this.events.once('shutdown',()=>{this.abort.abort();this.root.innerHTML='';if(this.audio.ambient)this.audio.ambient.gain.value=0;});}
 title(){this.index=-1;const save=SaveSystem.read();this.root.innerHTML=`<section class="title-screen"><img class="title-art" src="/art/shalt-valley.png" alt="Юноша на тропе над горной долиной"><div class="title-shade"></div><div class="title-top"><span>ГОРНАЯ ЧЕЧНЯ</span><span>НАЧАЛО XVIII ВЕКА</span></div><div class="title-content"><span class="title-kicker">ПЕРВЫЙ САМОСТОЯТЕЛЬНЫЙ ПУТЬ</span><h1>Шалт<span>Путь в горы</span></h1><p>Всё начинается с первого шага.</p><div class="title-buttons">${save?`<button class="button title-primary" data-action="continue">Продолжить путь ${icon('arrow')}</button><small class="save-description">День ${save.day.day} · ${save.age} лет · Уровень ${save.level}</small><button class="text-button" data-action="new">Начать заново</button>`:`<button class="button title-primary" data-action="new">Начать путь ${icon('arrow')}</button>`}<button class="text-button title-help" data-action="intro-help">Управление</button></div></div><div class="title-chapter"><i></i><span>ГЛАВА ПЕРВАЯ</span><strong>Своими руками</strong></div><footer class="title-footer"><span>Выживание · Исследование · Ремесло</span><span>Версия 0.1</span></footer></section>`;}
 confirmNew(){this.root.innerHTML+=`<div class="modal-backdrop"><section class="game-panel death-panel" role="dialog" aria-modal="true"><h2>Начать новый путь?</h2><p>Новое прохождение заменит сохранённый прогресс в этом браузере.</p><button class="button" data-action="confirm-new">Начать заново</button><button class="text-button" data-action="back">Вернуться</button></section></div>`;}
 help(){this.root.innerHTML+=`<div class="modal-backdrop"><section class="game-panel death-panel" role="dialog" aria-modal="true"><h2>Твой первый путь</h2><p>WASD — движение. Shift — бег.<br>E — собрать или использовать.<br>Пробел — удар шалтом.<br>I — рюкзак. C — ремесло. B — лагерь.</p><p>На телефоне используй стик слева и кнопки действия справа. Удобнее играть горизонтально.</p><button class="button" data-action="back">Понятно</button></section></div>`;}
 next(){this.index++;if(this.index>=STORY.length){this.startGame(false);return;}const s=STORY[this.index];this.root.innerHTML=`<section class="intro-screen">${storyArt(s.scene)}<div class="intro-shade"></div><header class="intro-header"><span>${s.chapter}</span><button class="text-button" data-action="skip">Пропустить вступление</button></header><div class="dialogue"><span class="eyebrow">${s.speaker}</span><p>${s.text}</p>${s.note?`<small>${s.note}</small>`:''}<div class="dialogue-bottom"><div class="story-progress">${STORY.map((_,i)=>`<i class="${i<=this.index?'seen':''}"></i>`).join('')}</div><button class="button secondary" data-action="next">${this.index===STORY.length-1?'Войти в долину':'Далее'} ${icon('arrow')}</button></div></div></section>`;}
 startGame(resume:boolean){this.root.classList.add('fade-out');this.time.delayedCall(350,()=>{this.root.classList.remove('fade-out');this.scene.start('GameScene',{save:resume?SaveSystem.read():null});});}
}
