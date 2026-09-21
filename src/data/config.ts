export type ResourceId = 'branch'|'wood'|'stone'|'grass'|'berry'|'meat'|'hide'|'cooked'|'metal';
export type ToolId = 'shalt'|'axe'|'pickaxe';
export type RecipeId = 'axe'|'pickaxe'|'bag'|'bag3'|'shalt2'|'shalt3';
export type BuildingId = 'fire'|'canopy'|'hut'|'workbench';
export type NodeKind = 'branch'|'pebble'|'berry'|'grass'|'tree'|'pine'|'rock';
export type AnimalKind = 'hare'|'boar';
export type WeatherKind = 'clear'|'rain'|'snow';
export type Cost = Partial<Record<ResourceId,number>>;

export const SETTINGS = {
  version:1, seed:1712, world:{width:3400,height:2600}, start:{x:1280,y:1530},
  inventory:{slots:8,bagSlots:[8,16,24],stack:20}, player:{speed:158,sprint:240,radius:13},
  daySeconds:720, startTime:8/24, hungerLoss:0.068,
  xp:{first:9,repeat:2,repeatEvery:8,repeatFloor:0.2,night:30,area:18},
  levels:[0,110,280,520,860,1300,1950,2850,4200,6500,10500,18000,30000,48000,65000,84000,105000,128000,153000,180000],
  ages:[{level:1,age:15},{level:3,age:16},{level:5,age:17}],
} as const;

export const ITEMS:Record<ResourceId,{name:string,short:string,icon:string,description:string}> = {
 branch:{name:'Ветки',short:'ветки',icon:'branch',description:'Для первых инструментов и строительства.'},
 wood:{name:'Древесина',short:'древесины',icon:'wood',description:'Добывается топором. Основа хорошего лагеря.'},
 stone:{name:'Камень',short:'камня',icon:'pebble',description:'Можно подобрать или добыть киркой.'},
 grass:{name:'Трава',short:'травы',icon:'grass',description:'Для крыши, перевязей и кожаной сумки.'},
 berry:{name:'Ягоды',short:'ягод',icon:'berry',description:'Можно съесть сразу. +12 к сытости.'},
 meat:{name:'Сырое мясо',short:'мяса',icon:'meat',description:'Приготовь на костре перед едой.'},
 hide:{name:'Шкуры',short:'шкур',icon:'hide',description:'Три шкуры и трава — твоя первая сумка.'},
 cooked:{name:'Жареное мясо',short:'мяса',icon:'cooked',description:'Сытная еда. +36 к сытости, +8 к здоровью.'},
 metal:{name:'Металл',short:'металла',icon:'metal',description:'Редкая добыча с разбойников. Нужен для верстака и улучшения шалта.'},
};
export const TOOLS:Record<ToolId,{name:string,description:string}> = {
 shalt:{name:'Шалт',description:'Первый кинжал, вручённый дедушкой. Для охоты и защиты.'},
 axe:{name:'Каменный топор',description:'Рубит деревья. Сначала собери ветки и камни.'},
 pickaxe:{name:'Каменная кирка',description:'Добывает камень из больших валунов.'},
};
export const RECIPES:Record<RecipeId,{name:string,cost:Cost,xp:number,requires?:ToolId,bench?:boolean,description:string}> = {
 axe:{name:'Каменный топор',cost:{branch:3,stone:2},xp:24,description:'Первый шаг к своему лагерю. Позволяет рубить деревья.'},
 pickaxe:{name:'Каменная кирка',cost:{branch:3,stone:5},xp:28,requires:'axe',description:'Крупные валуны станут источником камня.'},
 bag:{name:'Кожаная сумка II',cost:{hide:3,grass:4},xp:65,description:'Крепкая дорожная сумка. 8 → 16 ячеек.'},
 bag3:{name:'Укреплённая сумка III',cost:{hide:6,grass:6,metal:3},xp:120,bench:true,description:'Большая кожаная сумка с металлическим усилением. 16 → 24 ячейки.'},
 shalt2:{name:'Шалт II · Заточенный',cost:{metal:2,stone:2,hide:1},xp:90,description:'Заточить клинок и укрепить рукоять. Урон 32 → 38.'},
 shalt3:{name:'Шалт III · Закалённый',cost:{metal:5,stone:3,wood:2,hide:2},xp:180,bench:true,description:'Глубокая доработка на верстаке. Урон 38 → 44.'},
};
export const BUILDINGS:Record<BuildingId,{name:string,cost:Cost,xp:number,radius:number,description:string}> = {
 fire:{name:'Костёр',cost:{branch:3,wood:2},xp:24,radius:25,description:'Свет, тепло и приготовление мяса. Разгорается сам.'},
 canopy:{name:'Навес',cost:{branch:8,grass:5,wood:3},xp:35,radius:42,description:'Простой кров. Защищает от дождя и снега, позволяет отдыхать.'},
 hut:{name:'Шалаш',cost:{wood:15,branch:10,grass:10},xp:55,radius:48,description:'Надёжное укрытие. Быстрее восстанавливает здоровье во время отдыха.'},
 workbench:{name:'Верстак',cost:{wood:12,stone:8,hide:2,metal:2},xp:95,radius:36,description:'Нужен для улучшений III уровня: большой сумки и закалки шалта.'},
};
export const ANIMALS:Record<AnimalKind,{name:string,hp:number,speed:number,flee:number,damage:number,meat:number,hide:number,xp:number}> = {
 hare:{name:'Заяц',hp:24,speed:117,flee:195,damage:0,meat:1,hide:1,xp:16},
 boar:{name:'Дикий кабан',hp:105,speed:57,flee:186,damage:18,meat:3,hide:2,xp:34},
};
export const REGIONS=[
 {id:'home',name:'Край родного селения',x:610,y:1810,radius:490},
 {id:'meadow',name:'Солнечные луга',x:1290,y:1590,radius:410},
 {id:'forest',name:'Буковая роща',x:1550,y:990,radius:540},
 {id:'river',name:'Каменный брод',x:2310,y:1550,radius:270},
 {id:'dense',name:'Тихий лес',x:2750,y:860,radius:430},
 {id:'foothills',name:'Предгорья',x:900,y:570,radius:450},
 {id:'cave',name:'Вход в пещеру',x:1710,y:330,radius:230},
];
export const NODE_DATA:Record<NodeKind,{name:string,item:ResourceId,count:number,hits:number,tool?:ToolId,radius:number}>={
 branch:{name:'Сухие ветки',item:'branch',count:2,hits:1,radius:0},
 pebble:{name:'Камни',item:'stone',count:2,hits:1,radius:0},
 berry:{name:'Лесные ягоды',item:'berry',count:3,hits:1,radius:0},
 grass:{name:'Трава',item:'grass',count:3,hits:1,radius:0},
 tree:{name:'Бук',item:'wood',count:5,hits:3,tool:'axe',radius:20},
 pine:{name:'Сосна',item:'wood',count:5,hits:3,tool:'axe',radius:18},
 rock:{name:'Валун',item:'stone',count:6,hits:3,tool:'pickaxe',radius:29},
};


export type EnemyKind='dagger'|'shield'|'chaborz';
export const ENEMIES:Record<EnemyKind,{name:string,hp:number,speed:number,damage:number,aggro:number,range:number,xp:number}> = {
 dagger:{name:'Разбойник',hp:72,speed:112,damage:10,aggro:260,range:49,xp:75},
 shield:{name:'Опытный разбойник',hp:128,speed:92,damage:18,aggro:285,range:57,xp:140},
 chaborz:{name:'Чаборз',hp:360,speed:82,damage:30,aggro:420,range:86,xp:1500},
};
