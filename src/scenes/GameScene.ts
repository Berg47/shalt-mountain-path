import Phaser from 'phaser';
import {GameModel} from '../systems/GameModel';
import {SaveSystem} from '../systems/SaveSystem';
import {WorldRenderer} from '../world/WorldRenderer';
import {SETTINGS,type BuildingId} from '../data/config';
import {UI} from '../ui/UI';
import {AudioSystem} from '../systems/AudioSystem';
import {riverX} from '../world/World';
import {registerGameTools} from '../webmcp';

export class GameScene extends Phaser.Scene {
 model!:GameModel;worldRenderer!:WorldRenderer;ui!:UI;audio=new AudioSystem();stick={x:0,y:0,sprint:false};keys!:Record<string,Phaser.Input.Keyboard.Key>;
 building:BuildingId|null=null;placement={x:0,y:0};uiTimer=0;focus!:Phaser.GameObjects.Zone;abort=new AbortController();cleanupTools=()=>{};
 constructor(){super('GameScene');}
 preload(){if(!this.textures.exists('atlas')){const label=this.add.text(this.scale.width/2,this.scale.height/2,'Тропа открывается…',{fontFamily:'Georgia',fontSize:'22px',color:'#d8ceac'}).setOrigin(.5);this.load.image('atlas','/art/shalt-sprite-atlas.png');this.load.once('complete',()=>label.destroy());this.load.on('loaderror',()=>{document.getElementById('ui')!.innerHTML='<div class="fatal">Не удалось загрузить рисунки. Обнови страницу, когда появится соединение.</div>';});}}
 create(data:{save:ReturnType<typeof SaveSystem.pack>|null}){
  this.abort=new AbortController();this.model=new GameModel(data.save);this.worldRenderer=new WorldRenderer(this,this.model);this.building=null;
  this.focus=this.add.zone(this.model.player.x,this.model.player.y-25,1,1);const cam=this.cameras.main;cam.setBounds(0,0,SETTINGS.world.width,SETTINGS.world.height);cam.setZoom(this.zoom());cam.startFollow(this.focus,true,.085,.085);cam.centerOn(this.model.player.x,this.model.player.y);cam.fadeIn(650,12,31,24);
  this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SHIFT,E,F,SPACE') as Record<string,Phaser.Input.Keyboard.Key>;
  this.input.keyboard!.addCapture(['SPACE','UP','DOWN','LEFT','RIGHT']);
  const actionKey=(event:KeyboardEvent)=>{if(event.repeat||this.model.paused)return;this.audio.unlock();if(this.building)this.confirmBuild();else this.model.interact();};
  const attackKey=(event:KeyboardEvent)=>{if(event.repeat||this.model.paused||this.building)return;this.audio.unlock();this.model.attack();};
  this.input.keyboard!.on('keydown-E',actionKey);this.input.keyboard!.on('keydown-F',attackKey);this.input.keyboard!.on('keydown-SPACE',attackKey);
  this.events.once('shutdown',()=>{this.input.keyboard?.off('keydown-E',actionKey);this.input.keyboard?.off('keydown-F',attackKey);this.input.keyboard?.off('keydown-SPACE',attackKey);});
  this.ui=new UI(this.model,{audio:this.audio,stick:this.stick,build:kind=>this.beginBuild(kind),cancelBuild:()=>this.cancelBuild(),confirmBuild:()=>this.confirmBuild(),exit:()=>{this.scene.start('IntroScene');}});
  this.input.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{this.audio.unlock();if(this.model.paused)return;if(this.building){this.updatePlacement(pointer);if(!pointer.wasTouch)this.confirmBuild();}});
  this.input.on('pointermove',(pointer:Phaser.Input.Pointer)=>{if(this.building&&!this.model.paused)this.updatePlacement(pointer);});
  this.scale.on('resize',this.resize,this);this.audio.unlock();
  document.addEventListener('visibilitychange',()=>{if(document.hidden){this.model.save();this.stick.x=this.stick.y=0;this.input.keyboard?.resetKeys();if(!this.model.dead)this.ui.open('pause');}},{signal:this.abort.signal});
  window.addEventListener('pagehide',()=>this.model.save(),{signal:this.abort.signal});
  this.cleanupTools=registerGameTools(this.model,()=>this.ui.update(true));
  this.model.toast(data.save?'С возвращением в долину':'Подойди к веткам. Нажми E или кнопку с листом.');
  this.events.once('shutdown',()=>{this.model.save();this.ui.destroy();this.abort.abort();this.scale.off('resize',this.resize,this);this.cleanupTools();this.input.removeAllListeners();if(this.audio.ambient)this.audio.ambient.gain.value=0;});
  if(this.model.dead)this.ui.death();else this.model.save();
 }
 zoom(){return this.scale.width<650?1.05:this.scale.width<1000?1.12:1.22;}
 resize(){this.cameras.main.setZoom(this.zoom());}
 beginBuild(kind:BuildingId){this.building=kind;this.placement={x:this.model.player.x+100*this.model.player.facing,y:this.model.player.y+50};this.ui.placement(kind);}
 cancelBuild(){this.building=null;this.ui?.placement(null);}
 updatePlacement(pointer:Phaser.Input.Pointer){const p=this.cameras.main.getWorldPoint(pointer.x,pointer.y);this.placement={x:p.x,y:p.y};}
 confirmBuild(){if(this.building&&this.model.build(this.building,this.placement.x,this.placement.y))this.cancelBuild();}
 update(_time:number,delta:number){
  if(!this.model||!this.keys)return;const dt=Math.min(delta/1000,.05),k=this.keys;
  const input={x:this.stick.x+(k.D.isDown||k.RIGHT.isDown?1:0)-(k.A.isDown||k.LEFT.isDown?1:0),y:this.stick.y+(k.S.isDown||k.DOWN.isDown?1:0)-(k.W.isDown||k.UP.isDown?1:0),sprint:this.stick.sprint||k.SHIFT.isDown};
  if(this.building){input.x=input.y=0;}
  this.model.update(dt,input);this.focus.setPosition(this.model.player.x,this.model.player.y-30);this.worldRenderer.draw(dt,this.building,this.placement);
  this.uiTimer+=dt;if(this.uiTimer>.12){this.uiTimer=0;this.ui.update();}
  for(const event of this.model.events.splice(0)){
   if(event.type==='toast')this.ui.toast(event.text!);else if(event.type==='discover')this.ui.discover(event.text!);else if(event.type==='level'){this.ui.discover(event.text!,true);this.audio.play('level');}else if(event.type==='trial'){this.ui.trial();this.audio.play('level');}else if(event.type==='adulthood'){this.ui.adulthood();this.audio.play('level');}else if(event.type==='death')this.ui.death();else{this.worldRenderer.event(event);this.audio.play(event.type);if(event.type==='damage')this.cameras.main.shake(100,.003);}
  }
  if(!this.model.paused)this.audio.update(dt,this.model.day.night,Math.abs(this.model.player.x-riverX(this.model.player.y))<240,this.model.buildings.nearFire(this.model.player));
 }
}
