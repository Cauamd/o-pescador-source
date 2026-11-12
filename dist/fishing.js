// Sistema de pesca: força de lançamento, fisgada por tempo e minigame de captura.
// Independente do renderer para poder ser testado em Node.
import {FISH,RARITIES} from './config.js';

export function rarityInfo(fishOrRarity){
  const key=typeof fishOrRarity==='string'?fishOrRarity:fishOrRarity?.rarity;
  return RARITIES[key]||RARITIES['Comum'];
}

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
// Onda triangular 0 → 1 → 0, período 2.
export const pingPong=p=>1-Math.abs((((p%2)+2)%2)-1);

export const CAST={minDistance:4,maxDistance:24,perfectMin:.72,perfectMax:.9,biteTime:4.5,hookTries:2};

// Traduz a força (0–1) em distância, tempo de espera e chance de raros.
export function castProfile(power=.5){
  const p=clamp(Number(power)||0,0,1);
  const perfect=p>=CAST.perfectMin&&p<=CAST.perfectMax;
  const label=perfect?'Lançamento perfeito!':p<.25?'Lançamento fraco':p>CAST.perfectMax?'Forte demais, a isca espirrou':p<CAST.perfectMin?'Bom lançamento':'Lançamento';
  return {
    power:p,perfect,label,
    distance:CAST.minDistance+p*(CAST.maxDistance-CAST.minDistance),
    waitMul:(1.3-p*.6)*(perfect?.8:1),
    rareBonus:Math.round(p*3)+(perfect?2:0)
  };
}

// Posição da boia no mundo: à frente do barco, levemente para estibordo (lado da vara).
export function bobberPos(b,distance=9.2){
  const s=Math.sin(b.angle),c=Math.cos(b.angle),side=3;
  return {x:b.x-s*distance+c*side,z:b.z-c*distance-s*side};
}

export class FishingSystem{
  constructor(s,rng=Math.random){this.s=s;this.rng=rng;this.state='idle';this.tension=.3;this.progress=0;this.timer=0;this.castDistance=castProfile().distance;this.castT=1;this.profile=castProfile();}

  cast(zone,shoal,weather,power=.5){
    if(this.state!=='idle')return false;
    const profile=castProfile(power);this.profile=profile;
    const pool=FISH.filter(f=>f.rod<=this.s.upgrades.rod&&f.zone<=zone);
    const weighted=pool.flatMap(f=>{const r=rarityInfo(f),rare=r.tier>=3;return Array(r.weight+(f.zone===zone?3:0)+(f.weather===weather?2:0)+(rare?profile.rareBonus:0)).fill(f);});
    this.fish=weighted[Math.floor(this.rng()*weighted.length)];
    this.weight=this.fish.min+this.rng()*(this.fish.max-this.fish.min);
    this.timer=((shoal?2:5)+this.rng()*5)*profile.waitMul;
    this.castDistance=profile.distance;this.castT=0;
    this.state='waiting';this.tension=.3;this.progress=0;
    return true;
  }

  // --- Fase 1: fisgada (agulha oscilando sobre uma barra com janela-alvo) ---
  startBite(){
    const d=this.fish.difficulty,rod=this.s.upgrades.rod;
    this.state='bite';this.timer=CAST.biteTime;this.biteTotal=CAST.biteTime;
    this.needle=0;this.needlePhase=0;this.needleSpeed=.9+d*.55;
    this.hookWindow=clamp(.26-(d-1)*.12+rod*.025,.1,.34);
    this.hookTarget=.25+this.rng()*.5;this.hookTries=CAST.hookTries;
  }
  get inWindow(){return this.state==='bite'&&Math.abs(this.needle-this.hookTarget)<=this.hookWindow/2;}

  // Retorna true quando fisga. Errar gasta uma tentativa; sem tentativas o peixe foge.
  hook(){
    if(this.state!=='bite')return false;
    if(this.inWindow){this.startCatch();return true;}
    this.hookTries--;this.hookWindow*=.8;
    if(this.hookTries<=0){this.state='idle';this.lastFail='missed';}
    return false;
  }

  // --- Fase 2: captura (manter o peixe dentro da zona controlada pelo jogador) ---
  startCatch(){
    const d=this.fish.difficulty,rod=this.s.upgrades.rod;
    this.state='reeling';this.timer=0;
    this.zoneSize=clamp(.3+rod*.04-(d-1)*.1,.16,.42);
    this.zonePos=0;this.zoneVel=0;
    this.fishPos=.5;this.fishTarget=.08+this.rng()*.84;this.retarget=(.5+this.rng()*1.2)/d;
    this.progress=.3;this.inside=false;this.tension=.3;
  }
  get zoneCenter(){return this.zonePos+this.zoneSize/2;}

  cancel(){this.state='idle';}

  update(dt,reel,storm=0){
    if(this.state==='waiting'){
      this.castT=Math.min(1,this.castT+dt/.7);this.timer-=dt;
      if(this.timer<=0)this.startBite();
      return;
    }
    if(this.state==='bite'){
      this.timer-=dt;this.needlePhase+=dt*this.needleSpeed;this.needle=pingPong(this.needlePhase);
      if(this.timer<=0){this.state='idle';this.lastFail='timeout';return 'escaped';}
      return;
    }
    if(this.state!=='reeling')return;
    const d=this.fish.difficulty,rod=this.s.upgrades.rod;
    this.timer+=dt;
    // Zona do jogador: sobe enquanto recolhe, afunda quando solta.
    this.zoneVel+=(reel?2.7:-2.3)*dt;this.zoneVel*=Math.exp(-dt*1.2);
    this.zonePos+=this.zoneVel*dt;
    const top=1-this.zoneSize;
    if(this.zonePos<0){this.zonePos=0;this.zoneVel*=-.3;}
    if(this.zonePos>top){this.zonePos=top;this.zoneVel*=-.3;}
    // Peixe: troca de alvo de tempos em tempos e nada até ele.
    this.retarget-=dt;
    if(this.retarget<=0){this.fishTarget=.08+this.rng()*.84;this.retarget=(.5+this.rng()*1.2)/d;}
    const speed=(.25+.25*d)*(1+storm*.3);
    this.fishPos+=clamp(this.fishTarget-this.fishPos,-speed*dt,speed*dt);
    this.fishPos=clamp(this.fishPos+Math.sin(this.timer*7*d)*.004*d,0,1);
    this.inside=this.fishPos>=this.zonePos&&this.fishPos<=this.zonePos+this.zoneSize;
    this.progress=clamp(this.progress+dt*(this.inside?.3*(1+rod*.12)/(.6+.4*d):-(.16+.06*d)),0,1);
    this.tension=this.inside?.25:.85;
    if(this.progress<=0){this.state='idle';this.lastFail='lost';return 'escaped';}
    if(this.progress>=1){this.state='idle';return {id:globalThis.crypto?.randomUUID?.()||String(Date.now()+this.rng()),species:this.fish.id,weight:Math.round(this.weight*100)/100};}
  }
}
