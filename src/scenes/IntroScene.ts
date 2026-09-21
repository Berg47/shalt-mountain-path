import Phaser from 'phaser';
import {SaveSystem} from '../systems/SaveSystem';
import {icon} from '../ui/icons';
import {AudioSystem} from '../systems/AudioSystem';

const FAMILY_ART='/art/shalt-family-final.webp';
const MOTHER_ART='/art/shalt-mother-farewell-final.webp';
const VALLEY_ART='/art/shalt-valley.png';

const STORY=[
 {art:FAMILY_ART,alt:'Дедушка вручает юноше первый шалт в кругу мужчин семьи',chapter:'I · ПОЯС',speaker:'Дедушка',text:'Сегодня ты принимаешь свой первый шалт. Носи его с достоинством. Пусть твоя рука прежде умеет помогать, чем защищать.',note:'Юкъ йехкар · семейное вручение пояса и кинжала'},
 {art:FAMILY_ART,alt:'Юноша и мужчины его семьи в горном селении',chapter:'I · ПОЯС',speaker:'Старший брат',text:'Ну что, пояс надел, шалт получил — теперь уже взрослым себя считаешь?',note:''},
 {art:FAMILY_ART,alt:'Юноша и мужчины его семьи в горном селении',chapter:'I · ПОЯС',speaker:'Второй брат',text:'Шалт на поясе — ещё не сила. Важно, чего стоит тот, кто его носит.',note:''},
 {art:FAMILY_ART,alt:'Юноша после разговора с мужчинами семьи',chapter:'II · РЕШЕНИЕ',speaker:'Юноша',text:'Я не стану спорить. Уйду в горы, найду себе кров и пищу. Вернусь — сами увидите, чему я научился.',note:''},
 {art:FAMILY_ART,alt:'Отец даёт сыну совет перед дорогой',chapter:'II · РЕШЕНИЕ',speaker:'Отец',text:'Горы не прощают беспечности. Смотри на погоду, береги силы. И помни дорогу домой.',note:''},
 {art:FAMILY_ART,alt:'Прощание юноши с дедушкой',chapter:'III · ПРОЩАНИЕ',speaker:'Дедушка',text:'Вижу, ты уже решил. Учись у гор терпению. Вернуться за помощью — не стыдно.',note:''},
 {art:MOTHER_ART,alt:'Юноша отдельно прощается с матерью в горном селении',chapter:'III · ПРОЩАНИЕ',speaker:'Мать',text:'Береги себя, сын. Не рискуй зря. Возвращайся.',note:''},
 {art:VALLEY_ART,alt:'Юноша отправляется в горную долину',chapter:'IV · ПЕРВЫЙ ШАГ',speaker:'Путь в горы',text:'За спиной осталось селение. Впереди — лес, вода и незнакомые тропы. Тебе пятнадцать. На поясе — шалт. Всё остальное ты сделаешь своими руками.',note:'Уход в горы — художественная история героя, а не часть обряда.'},
];

export class IntroScene extends Phaser.Scene {
 root=document.getElementById('ui')!;abort=new AbortController();index=-1;audio=new AudioSystem();
 constructor(){super('IntroScene');}
 create(){
  this.abort=new AbortController();this.index=-1;this.title();
  for(const src of [FAMILY_ART,MOTHER_ART,VALLEY_ART]){const img=new Image();img.src=src;}
  this.root.addEventListener('click',e=>{const target=(e.target as HTMLElement).closest<HTMLElement>('button');if(!target)return;this.audio.unlock();const a=target.dataset.action;if(a==='new'){if(SaveSystem.read())this.confirmNew();else this.next();}else if(a==='confirm-new'){this.index=-1;this.next();}else if(a==='continue')this.startGame(true);else if(a==='next')this.next();else if(a==='skip')this.startGame(false);else if(a==='back')this.title();else if(a==='intro-help')this.help();},{signal:this.abort.signal});
  document.addEventListener('keydown',e=>{if(this.index>=0&&(e.code==='Space'||e.code==='Enter')){e.preventDefault();this.next();}},{signal:this.abort.signal});
  this.events.once('shutdown',()=>{this.abort.abort();this.root.innerHTML='';if(this.audio.ambient)this.audio.ambient.gain.value=0;});
 }
 title(){this.index=-1;const save=SaveSystem.read();this.root.innerHTML=`<section class="title-screen"><img class="title-art" src="${VALLEY_ART}" alt="Юноша на тропе над горной долиной"><div class="title-shade"></div><div class="title-top"><span>ГОРНАЯ ЧЕЧНЯ</span><span>НАЧАЛО XVIII ВЕКА</span></div><div class="title-content"><span class="title-kicker">ПЕРВЫЙ САМОСТОЯТЕЛЬНЫЙ ПУТЬ</span><h1>Шалт<span>Путь в горы</span></h1><p>Всё начинается с первого шага.</p><div class="title-buttons">${save?`<button class="button title-primary" data-action="continue">Продолжить путь ${icon('arrow')}</button><small class="save-description">День ${save.day.day} · ${save.age} лет · Уровень ${save.level}</small><button class="text-button" data-action="new">Начать заново</button>`:`<button class="button title-primary" data-action="new">Начать путь ${icon('arrow')}</button>`}<button class="text-button title-help" data-action="intro-help">Управление</button></div></div><div class="title-chapter"><i></i><span>ГЛАВА ПЕРВАЯ</span><strong>Своими руками</strong></div><footer class="title-footer"><span>Выживание · Исследование · Ремесло</span><span>Версия 0.1</span></footer></section>`;}
 confirmNew(){this.root.innerHTML+=`<div class="modal-backdrop"><section class="game-panel death-panel" role="dialog" aria-modal="true"><h2>Начать новый путь?</h2><p>Новое прохождение заменит сохранённый прогресс в этом браузере.</p><button class="button" data-action="confirm-new">Начать заново</button><button class="text-button" data-action="back">Вернуться</button></section></div>`;}
 help(){this.root.innerHTML+=`<div class="modal-backdrop"><section class="game-panel death-panel" role="dialog" aria-modal="true"><h2>Твой первый путь</h2><p>WASD — движение. Shift — бег.<br>E — собрать или использовать.<br>Пробел — удар шалтом.<br>I — рюкзак. C — ремесло. B — лагерь.</p><p>На телефоне используй стик слева и кнопки действия справа. Удобнее играть горизонтально.</p><button class="button" data-action="back">Понятно</button></section></div>`;}
 next(){this.index++;if(this.index>=STORY.length){this.startGame(false);return;}const s=STORY[this.index];this.root.innerHTML=`<section class="intro-screen"><img class="intro-art" src="${s.art}" alt="${s.alt}"><div class="intro-shade"></div><header class="intro-header"><span>${s.chapter}</span><button class="text-button" data-action="skip">Пропустить вступление</button></header><div class="dialogue"><span class="eyebrow">${s.speaker}</span><p>${s.text}</p>${s.note?`<small>${s.note}</small>`:''}<div class="dialogue-bottom"><div class="story-progress">${STORY.map((_,i)=>`<i class="${i<=this.index?'seen':''}"></i>`).join('')}</div><button class="button secondary" data-action="next">${this.index===STORY.length-1?'Войти в долину':'Далее'} ${icon('arrow')}</button></div></div></section>`;}
 startGame(resume:boolean){this.root.classList.add('fade-out');this.time.delayedCall(350,()=>{this.root.classList.remove('fade-out');this.scene.start('GameScene',{save:resume?SaveSystem.read():null});});}
}
