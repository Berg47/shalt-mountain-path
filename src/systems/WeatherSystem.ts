import type {WeatherKind} from '../data/config';
export class WeatherSystem {
 kind:WeatherKind='clear';target:WeatherKind='clear';elapsed=0;blend=0;index=0;
 update(dt:number){this.elapsed+=dt;if(this.elapsed>130){this.elapsed=0;this.index++;this.target=(['rain','clear','snow','clear'] as WeatherKind[])[(this.index-1)%4];}if(this.kind!==this.target){this.blend=Math.max(0,this.blend-dt/10);if(this.blend===0)this.kind=this.target;}else this.blend=Math.min(1,this.blend+dt/12);}
 get label(){return this.kind==='clear'?'Ясно':this.kind==='rain'?'Лёгкий дождь':'Лёгкий снег';}
 get chill(){return (this.kind==='snow'?2.4:this.kind==='rain'?1.2:0)*this.blend;}
}
