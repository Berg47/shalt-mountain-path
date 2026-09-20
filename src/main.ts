import Phaser from 'phaser';
import {IntroScene} from './scenes/IntroScene';
import {GameScene} from './scenes/GameScene';
import './style.css';

new Phaser.Game({type:Phaser.AUTO,parent:'game',backgroundColor:'#18372a',scale:{mode:Phaser.Scale.RESIZE,width:window.innerWidth,height:window.innerHeight,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true,pixelArt:false,powerPreference:'high-performance'},input:{activePointers:4},scene:[IntroScene,GameScene],audio:{noAudio:true},fps:{target:60,smoothStep:true}});
