// Minigame subaquático e animação de apresentação do peixe capturado em Canvas 2D.
import {rarityInfo} from './fishing.js';

export function drawSpeciesFish(c,fish,x,y,size,dir,wiggle,t=0,alpha=1){
  const r=rarityInfo(fish),tier=r.tier,shape=fish?.shape||'standard';
  const color=fish?.tint||r.color,belly=fish?.belly||'#eef9f6',pat=fish?.pattern||'';
  const tail=Math.sin(wiggle)*.38,fin=Math.cos(wiggle*.8)*.2;
  c.save();c.globalAlpha=alpha;c.translate(x,y);

  // Aura progressiva conforme a raridade (Tier 2+)
  if(tier>=2&&alpha>.75){
    const pulse=1+Math.sin(t*5)*.12,rad=size*(1.25+tier*.28)*pulse;
    const ag=c.createRadialGradient(0,0,size*.15,0,0,rad);
    ag.addColorStop(0,r.glow);ag.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=ag;c.beginPath();c.arc(0,0,rad,0,Math.PI*2);c.fill();
  }
  // Anéis celestiais giratórios para Épico e Lendário
  if(tier>=4&&alpha>.75){
    c.save();c.rotate(t*1.3);c.strokeStyle=r.color;c.globalAlpha=alpha*.45;c.lineWidth=1.3;
    c.setLineDash([5,5]);c.beginPath();c.arc(0,0,size*1.42,0,Math.PI*2);c.stroke();
    if(tier>=5){
      c.rotate(-t*2.6);c.strokeStyle='#ffd86b';c.setLineDash([2,6]);
      c.beginPath();c.arc(0,0,size*1.72,0,Math.PI*2);c.stroke();
    }
    c.restore();
  }

  c.scale(dir,1);
  if(tier>=3&&alpha>.75){c.shadowColor=r.color;c.shadowBlur=4+tier*2.5;}

  // Cardume acompanhante para o estilo 'school' (Manjuba)
  if(shape==='school'&&alpha>.7){
    for(const [ox,oy,sc] of [[-size*.9,-size*.58,.42],[-size*1.1,size*.52,.38]]){
      c.save();c.translate(ox+Math.sin(t*6+oy)*3,oy);
      c.fillStyle=color;c.beginPath();c.ellipse(0,0,size*sc,size*sc*.3,0,0,Math.PI*2);c.fill();
      c.restore();
    }
  }

  // Cauda personalizada por estilo de peixe
  c.fillStyle=r.accent;
  c.beginPath();
  if(['sword','sail','marlin','tuna','mackerel','trevally'].includes(shape)){
    // Cauda em meia-lua / bifurcada profunda de peixes oceânicos velozes
    c.moveTo(-size*.86,0);
    c.lineTo(-size*1.68,-size*.68+tail*size*.45);
    c.quadraticCurveTo(-size*1.22,tail*size*.12,-size*1.68,size*.68+tail*size*.45);
  }else if(shape==='dragon'){
    // Cauda tripla real em leque
    c.moveTo(-size*.9,0);
    c.lineTo(-size*1.82,-size*.75+tail*size*.5);
    c.lineTo(-size*1.42,-size*.18+tail*size*.3);
    c.lineTo(-size*1.95,tail*size*.42);
    c.lineTo(-size*1.42,size*.18+tail*size*.3);
    c.lineTo(-size*1.82,size*.75+tail*size*.5);
  }else if(shape==='eel'){
    // Ponta de cauda em chama para serpente marinha
    c.moveTo(-size*1.15,tail*size*.25);
    c.lineTo(-size*1.85,-size*.32+tail*size*.55);
    c.lineTo(-size*2.05,tail*size*.55);
    c.lineTo(-size*1.85,size*.32+tail*size*.55);
  }else if(['grouper','drum','emperor','abyssal'].includes(shape)){
    // Cauda larga arredondada de peixes de fundo
    c.moveTo(-size*.85,-size*.15);
    c.lineTo(-size*1.46,-size*.48+tail*size*.35);
    c.quadraticCurveTo(-size*1.62,tail*size*.35,-size*1.46,size*.48+tail*size*.35);
    c.lineTo(-size*.85,size*.15);
  }else{
    // Cauda furcada costeira clássica
    c.moveTo(-size*.84,0);
    c.lineTo(-size*1.5,-size*.48+tail*size*.4);
    c.lineTo(-size*1.28,tail*size*.12);
    c.lineTo(-size*1.5,size*.48+tail*size*.4);
  }
  c.closePath();c.fill();

  // Nadadeiras dorsais e ventrais conforme o estilo
  if(shape==='sail'){
    // Grande vela dorsal estriada e pontilhada
    const sg=c.createLinearGradient(0,-size*1.4,0,-size*.2);
    sg.addColorStop(0,r.color);sg.addColorStop(1,r.accent);
    c.fillStyle=sg;c.beginPath();
    c.moveTo(-size*.72,-size*.24);
    c.quadraticCurveTo(-size*.2,-size*1.55+fin*size*.22,size*.5,-size*.28);
    c.closePath();c.fill();
    c.strokeStyle='rgba(255,255,255,.38)';c.lineWidth=1;
    for(let i=-3;i<=2;i++){c.beginPath();c.moveTo(i*size*.15,-size*.28);c.lineTo(i*size*.11,-size*1.05);c.stroke();}
  }else if(shape==='crest'){
    // Crista frontal alta de Dourado-do-mar (Mahi-mahi)
    c.fillStyle=r.accent;c.beginPath();
    c.moveTo(-size*.75,-size*.3);
    c.quadraticCurveTo(size*.15,-size*.92+fin*size*.15,size*.82,-size*.42);
    c.lineTo(size*.72,-size*.1);c.closePath();c.fill();
  }else if(shape==='dragon'){
    // Crista imperial dourada com múltiplos espinhos solares
    c.fillStyle='#ffd86b';c.beginPath();
    for(let i=-3;i<=2;i++){
      const sx=i*size*.23;
      c.moveTo(sx-size*.11,-size*.3);c.lineTo(sx-size*.03,-size*.92+fin*size*.18);c.lineTo(sx+size*.11,-size*.3);
    }
    c.fill();
  }else if(shape==='trevally'){
    // Nadadeira dorsal e anal em foice longa (Xaréu)
    c.fillStyle=r.accent;c.beginPath();
    c.moveTo(-size*.15,-size*.48);c.quadraticCurveTo(-size*.55,-size*1.1,size*.35,-size*.45);
    c.moveTo(-size*.15,size*.48);c.quadraticCurveTo(-size*.55,size*1.05,size*.35,size*.45);
    c.fill();
  }else if(shape==='abyssal'){
    // Espinhos dorsais + antena bioluminescente de águas abissais (Cherne-abissal)
    c.fillStyle=r.accent;c.beginPath();
    c.moveTo(-size*.45,-size*.46);c.lineTo(-size*.1,-size*.82);c.lineTo(size*.35,-size*.44);c.closePath();c.fill();
    c.strokeStyle=r.color;c.lineWidth=1.8;c.beginPath();
    c.moveTo(size*.45,-size*.38);c.quadraticCurveTo(size*.88,-size*.95,size*1.12,-size*.55+fin*size*.2);c.stroke();
    c.fillStyle='#fff6b0';c.beginPath();c.arc(size*1.12,-size*.55+fin*size*.2,size*.1,0,Math.PI*2);c.fill();
  }else if(shape==='mullet'||shape==='bass'){
    // Duas nadadeiras dorsais separadas (Tainha / Robalo)
    c.fillStyle=r.accent;c.beginPath();
    c.moveTo(-size*.55,-size*.32);c.lineTo(-size*.32,-size*.66+fin*size*.1);c.lineTo(-size*.1,-size*.34);
    c.moveTo(size*.05,-size*.35);c.lineTo(size*.28,-size*.68+fin*size*.1);c.lineTo(size*.5,-size*.3);
    c.fill();
  }else{
    c.fillStyle=r.accent;c.beginPath();
    c.moveTo(-size*.25,-size*.34);c.lineTo(size*.12,-size*(shape==='marlin'||shape==='sword'?.92:.7)+fin*size*.12);c.lineTo(size*.48,-size*.28);
    c.closePath();c.fill();
  }

  // Pínulas amarelas para Atum e Cavala
  if(pat==='finlets'||shape==='tuna'||shape==='mackerel'){
    c.fillStyle='#ffd86b';
    for(let i=0;i<4;i++){
      const px=-size*(.42+i*.12);
      c.beginPath();c.arc(px,-size*.32+i*size*.03,size*.045,0,Math.PI*2);
      c.arc(px,size*.32-i*size*.03,size*.045,0,Math.PI*2);c.fill();
    }
  }

  // Gradiente dorso -> ventre do corpo principal
  const bg=c.createLinearGradient(0,-size*.55,0,size*.55);
  bg.addColorStop(0,color);bg.addColorStop(.62,color);bg.addColorStop(1,belly);
  c.fillStyle=bg;c.beginPath();

  if(shape==='sleek'||shape==='school'||shape==='mackerel'||shape==='torpedo'){
    c.ellipse(0,0,size*1.1,size*.32,0,0,Math.PI*2);
  }else if(shape==='trevally'){
    c.ellipse(0,0,size*.92,size*.6,0,0,Math.PI*2);
  }else if(['grouper','drum','emperor','abyssal'].includes(shape)){
    c.ellipse(0,0,size*.98,size*.54,0,0,Math.PI*2);
  }else if(shape==='crest'){
    c.moveTo(size*.95,-.05*size);
    c.quadraticCurveTo(size*.85,-size*.52,0,-size*.44);
    c.quadraticCurveTo(-size*.75,-size*.32,-size*.98,0);
    c.quadraticCurveTo(-size*.65,size*.42,size*.85,size*.36);
    c.closePath();
  }else if(shape==='eel'){
    c.moveTo(size*1.1,0);
    c.bezierCurveTo(size*.45,-size*.34,-size*.4,-size*.3+tail*size*.3,-size*1.28,tail*size*.25);
    c.bezierCurveTo(-size*.4,size*.3+tail*size*.3,size*.45,size*.34,size*1.1,0);
  }else{
    c.ellipse(0,0,size,size*.43,0,0,Math.PI*2);
  }
  c.fill();

  // Lança / espada frontal (Peixe-vela, Peixe-espada, Marlim) ou barbilhões e chifres (Leviatã)
  if(['sword','sail','marlin'].includes(shape)){
    c.fillStyle=shape==='marlin'?'#ffd86b':color;c.beginPath();
    c.moveTo(size*.82,-size*.09);c.lineTo(size*1.85,-size*.02);c.lineTo(size*.82,size*.07);
    c.closePath();c.fill();
  }else if(shape==='dragon'){
    c.strokeStyle='#ffd86b';c.lineWidth=1.8;c.beginPath();
    c.moveTo(size*.82,size*.08);c.quadraticCurveTo(size*1.35,size*.5+fin*size*.3,size*1.68,size*.22);
    c.moveTo(size*.72,-size*.2);c.quadraticCurveTo(size*1.25,-size*.75,size*1.58,-size*.5);
    c.stroke();
  }

  // Padrões de pele/escamas exclusivos de cada espécie
  c.shadowBlur=0;
  if(pat==='stripe'||pat==='lateral'||pat==='scutes'){
    c.strokeStyle=pat==='lateral'?'rgba(20,45,65,.65)':'rgba(255,255,255,.55)';
    c.lineWidth=size*.07;c.beginPath();c.moveTo(-size*.82,0);c.lineTo(size*.68,0);c.stroke();
  }else if(pat==='bars'||pat==='tiger'||pat==='royal'){
    c.strokeStyle=pat==='royal'?'#ffd86b':'rgba(25,45,55,.38)';
    c.lineWidth=size*.07;
    for(let i=-2;i<=2;i++){
      const bx=i*size*.24;
      c.beginPath();c.moveTo(bx,-size*.36);c.lineTo(bx-size*.08,size*.22);c.stroke();
    }
  }else if(pat==='spots'||pat==='saildots'){
    c.fillStyle=tier>=3?'#3582d4':'rgba(90,30,25,.48)';
    for(const [sx,sy] of [[-.45,-.12],[-.2,.1],[.05,-.14],[.28,.08],[-.1,-.02]]){
      c.beginPath();c.arc(sx*size,sy*size,size*.055,0,Math.PI*2);c.fill();
    }
  }else if(pat==='scales'||tier===2){
    c.strokeStyle='rgba(255,255,255,.28)';c.lineWidth=1;
    for(let i=-2;i<=2;i++){c.beginPath();c.arc(i*size*.22,0,size*.14,-Math.PI*.4,Math.PI*.4);c.stroke();}
  }
  if(pat==='biolum'||pat==='stars'||pat==='dragon'||tier>=4){
    c.fillStyle=tier>=5?'#ffd86b':'#e9d4ff';
    for(let i=-2;i<=2;i++){
      const py=pat==='stars'?Math.sin(i*1.7)*size*.12:size*.04;
      c.beginPath();c.arc(i*size*.24,py,size*.05,0,Math.PI*2);c.fill();
    }
  }

  // Brilho superior, opérculo (guelra), nadadeira peitoral e olho expressivo
  c.fillStyle='rgba(255,255,255,.28)';c.beginPath();
  c.ellipse(size*.08,-size*.14,size*.56,size*.11,0,0,Math.PI*2);c.fill();
  c.strokeStyle='rgba(10,35,45,.35)';c.lineWidth=1.2;c.beginPath();
  c.arc(size*.32,0,size*.24,Math.PI*.65,Math.PI*1.35);c.stroke();

  c.fillStyle=r.accent;c.beginPath();
  c.moveTo(size*.15,size*.1);c.lineTo(-size*.22,size*.4+fin*size*.16);c.lineTo(size*.06,size*.28);c.closePath();c.fill();

  c.fillStyle=tier>=4?'#fff6b0':'#fff';c.beginPath();c.arc(size*.58,-size*.08,size*.125,0,Math.PI*2);c.fill();
  c.fillStyle='#061c24';c.beginPath();c.arc(size*.61,-size*.08,size*.068,0,Math.PI*2);c.fill();
  c.fillStyle='#fff';c.beginPath();c.arc(size*.63,-size*.11,size*.028,0,Math.PI*2);c.fill();
  c.restore();
}

export class MinigameView{
  constructor(canvas){
    this.canvas=canvas;this.c=canvas.getContext('2d');this.w=canvas.width;this.h=canvas.height;
    this.t=0;this.reelAngle=0;this.flashColor=null;this.flashT=0;this.lastSpecies=null;
    this.bubbles=Array.from({length:60},()=>this.newBubble(true));
    this.sparkles=Array.from({length:80},()=>this.newSparkle(true));
    this.weeds=Array.from({length:9},(_,i)=>({x:12+i*37+Math.random()*14,h:40+Math.random()*55,p:Math.random()*6}));
    this.school=Array.from({length:8},(_,i)=>({x:Math.random()*this.w,y:45+i*28,s:5+Math.random()*4,v:18+Math.random()*18,dir:i%2?1:-1}));
    this.jellies=Array.from({length:6},(_,i)=>({x:35+i*48,y:60+Math.random()*220,p:Math.random()*6,s:9+Math.random()*5}));
    this.splash=[];this.trail=[];this.rings=[];this.bolts=[];this.ringTimer=0;this.boltTimer=0;
  }
  newBubble(anywhere){return {x:Math.random()*this.w,y:anywhere?Math.random()*this.h:this.h+5,r:1+Math.random()*3,v:14+Math.random()*28,p:Math.random()*6};}
  newSparkle(anywhere){return {x:Math.random()*this.w,y:anywhere?Math.random()*this.h:this.h+8,s:1.2+Math.random()*2.6,v:16+Math.random()*32,p:Math.random()*6};}
  flash(color){this.flashColor=color;this.flashT=.35;}
  color(fish){return rarityInfo(fish).color;}

  draw(dt,f,reel){
    this.t+=dt;const c=this.c,r=rarityInfo(f.fish);
    if(this.lastSpecies!==f.fish?.id){this.lastSpecies=f.fish?.id;this.trail=[];this.rings=[];this.bolts=[];}
    this.background(dt,r);
    if(f.state==='bite')this.drawBite(dt,f,r);
    else if(f.state==='reeling')this.drawCatch(dt,f,reel,r);
    if(this.flashT>0){this.flashT-=dt;c.fillStyle=this.flashColor;c.globalAlpha=Math.max(0,this.flashT/.35)*.35;c.fillRect(0,0,this.w,this.h);c.globalAlpha=1;}
  }

  background(dt,r){
    const {c,w,h,t}=this,tier=r.tier;
    const g=c.createLinearGradient(0,0,0,h);
    if(tier>=5){g.addColorStop(0,'#3b235a');g.addColorStop(.25,'#1b3c63');g.addColorStop(.65,'#0b2239');g.addColorStop(1,'#040c18');}
    else if(tier===4){g.addColorStop(0,'#274172');g.addColorStop(.25,'#153d63');g.addColorStop(.65,'#09253b');g.addColorStop(1,'#04111d');}
    else{g.addColorStop(0,'#2a8597');g.addColorStop(.18,'#14596b');g.addColorStop(.6,'#0a3442');g.addColorStop(1,'#041820');}
    c.fillStyle=g;c.fillRect(0,0,w,h);

    // Raios de luz progressivos
    c.save();c.globalCompositeOperation='lighter';
    const rays=r.fx.rays;
    for(let i=0;i<rays;i++){
      const x=15+(i/(rays-1||1))*(w-30)+Math.sin(t*.5+i)*18;
      const rg=c.createLinearGradient(0,0,0,h*.88);
      rg.addColorStop(0,tier>=3?r.glow:'rgba(190,240,235,.13)');
      rg.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=rg;c.beginPath();c.moveTo(x-10,0);c.lineTo(x+12,0);c.lineTo(x+48,h*.88);c.lineTo(x+6,h*.88);c.closePath();c.fill();
    }
    c.restore();

    if(tier>=2){
      c.fillStyle='rgba(180,235,245,.16)';
      for(const s of this.school){
        s.x+=s.v*s.dir*dt;
        if(s.dir>0&&s.x>w+20)s.x=-20;if(s.dir<0&&s.x<-20)s.x=w+20;
        const sy=s.y+Math.sin(t*2+s.x*.05)*4;
        c.beginPath();c.ellipse(s.x,sy,s.s,s.s*.38,0,0,Math.PI*2);c.fill();
      }
    }

    for(let i=0;i<r.fx.jellies;i++){
      const j=this.jellies[i],pulse=Math.sin(t*2.6+j.p),jy=(j.y-t*8)%h+h;
      const y=jy%h;
      c.save();c.translate(j.x+Math.sin(t+j.p)*10,y);
      c.strokeStyle=r.glow;c.fillStyle=r.glow;c.lineWidth=1.2;
      c.beginPath();c.arc(0,0,j.s*(.85+pulse*.12),Math.PI,0);c.fill();
      for(let k=-1;k<=1;k++){
        c.beginPath();c.moveTo(k*j.s*.4,0);
        c.quadraticCurveTo(k*j.s*.6+Math.sin(t*4+k+j.p)*4,j.s*.9,k*j.s*.3,j.s*1.7);c.stroke();
      }
      c.restore();
    }

    if(tier>=5){
      c.save();c.translate(w*.5,h*.48);c.rotate(t*.35);
      c.strokeStyle='rgba(255,216,107,.14)';c.lineWidth=1.5;
      c.beginPath();c.arc(0,0,115,0,Math.PI*2);c.stroke();
      for(let i=0;i<8;i++){c.rotate(Math.PI/4);c.beginPath();c.moveTo(92,0);c.lineTo(115,0);c.stroke();}
      c.restore();
    }

    c.fillStyle='rgba(200,245,240,.18)';c.beginPath();c.moveTo(0,0);
    for(let x=0;x<=w;x+=8)c.lineTo(x,7+Math.sin(x*.05+t*2.2)*3);
    c.lineTo(w,0);c.closePath();c.fill();

    c.fillStyle='#3b4a3c';c.beginPath();c.moveTo(0,h);for(let x=0;x<=w;x+=10)c.lineTo(x,h-12-Math.sin(x*.04)*5);c.lineTo(w,h);c.fill();
    c.lineCap='round';
    for(const s of this.weeds){c.strokeStyle=tier>=4?'rgba(120,175,155,.7)':'rgba(78,140,96,.75)';c.lineWidth=4;c.beginPath();c.moveTo(s.x,h-8);for(let k=1;k<=6;k++){const y=h-8-s.h*k/6;c.lineTo(s.x+Math.sin(t*1.3+s.p+k*.6)*k*1.6,y);}c.stroke();}

    c.strokeStyle='rgba(220,250,250,.45)';c.lineWidth=1;
    for(let i=0;i<r.fx.bubbles;i++){
      const b=this.bubbles[i];b.y-=b.v*dt;b.x+=Math.sin(t*2+b.p)*.25;
      if(b.y<10)Object.assign(b,this.newBubble(false));
      c.beginPath();c.arc(b.x,b.y,b.r,0,Math.PI*2);c.stroke();
    }

    for(let i=0;i<r.fx.sparkles;i++){
      const sp=this.sparkles[i];sp.y-=sp.v*dt*(.6+tier*.15);sp.x+=Math.cos(t*2.5+sp.p)*.45;
      if(sp.y<8)Object.assign(sp,this.newSparkle(false));
      const a=.35+.65*Math.abs(Math.sin(t*4+sp.p));
      c.fillStyle=i%2?r.color:'#fff8d6';c.globalAlpha=a;
      c.beginPath();c.arc(sp.x,sp.y,sp.s,0,Math.PI*2);c.fill();
    }
    c.globalAlpha=1;
  }

  updateTrailAndRings(dt,fx,fy,dir,f,r){
    const {c,t}=this,tier=r.tier;
    if(r.fx.trail>0){
      this.trail.unshift({x:fx,y:fy,dir,wiggle:t*(10+f.fish.difficulty*6)});
      if(this.trail.length>r.fx.trail)this.trail.length=r.fx.trail;
      for(let i=this.trail.length-1;i>=1;i--){
        const tr=this.trail[i],a=(1-i/this.trail.length)*.32;
        drawSpeciesFish(c,f.fish,tr.x,tr.y,15,tr.dir,tr.wiggle,t,a);
      }
    }
    if(tier>=3){
      this.ringTimer-=dt;
      if(this.ringTimer<=0){
        this.ringTimer=1.05-tier*.13;
        this.rings.push({x:fx,y:fy,r:6,max:26+tier*10,a:.75});
      }
      for(const rg of this.rings){
        rg.r+=dt*55;rg.a=Math.max(0,1-rg.r/rg.max);
        c.strokeStyle=r.color;c.globalAlpha=rg.a*.65;c.lineWidth=1.8;
        c.beginPath();c.arc(rg.x,rg.y,rg.r,0,Math.PI*2);c.stroke();
      }
      c.globalAlpha=1;
      this.rings=this.rings.filter(rg=>rg.a>0.02);
    }
    if(r.fx.lightning>0){
      this.boltTimer-=dt;
      if(this.boltTimer<=0){
        this.boltTimer=.38-(tier-4)*.14;
        const pts=[{x:fx+(Math.random()-.5)*60,y:Math.max(18,fy-65)}];
        for(let k=1;k<=5;k++)pts.push({x:fx+(Math.random()-.5)*55,y:pts[0].y+k*26});
        this.bolts.push({pts,life:.16,color:tier>=5?'#ffd86b':r.color});
      }
      for(const b of this.bolts){
        b.life-=dt;c.strokeStyle=b.color;c.globalAlpha=Math.max(0,b.life*6);c.lineWidth=1.8;
        c.beginPath();c.moveTo(b.pts[0].x,b.pts[0].y);
        for(let i=1;i<b.pts.length;i++)c.lineTo(b.pts[i].x,b.pts[i].y);
        c.stroke();
      }
      c.globalAlpha=1;
      this.bolts=this.bolts.filter(b=>b.life>0);
    }
  }

  drawBite(dt,f,r){
    const {c,w,t}=this,hx=w/2,hy=122,tier=r.tier;
    c.strokeStyle='rgba(235,245,230,.8)';c.lineWidth=1.2;c.beginPath();c.moveTo(hx,0);c.lineTo(hx,hy);c.stroke();
    c.strokeStyle='#d9dde0';c.lineWidth=2.5;c.beginPath();c.moveTo(hx,hy);c.lineTo(hx,hy+12);c.arc(hx-7,hy+12,7,0,Math.PI,false);c.stroke();
    c.fillStyle=r.color;c.beginPath();c.arc(hx-13,hy+10,4.5,0,Math.PI*2);c.fill();

    for(let i=0;i<Math.min(3,tier);i++){
      const rad=((t*38+i*18)%46);
      c.strokeStyle=r.color;c.globalAlpha=(1-rad/46)*.5;c.lineWidth=1.4;
      c.beginPath();c.arc(hx-10,hy+12,rad,0,Math.PI*2);c.stroke();
    }
    c.globalAlpha=1;

    const a=t*(1.4+tier*.15),nib=Math.max(0,Math.sin(t*9))*6;
    const fx=hx-14+Math.cos(a)*(58-nib*4),fy=hy+18+Math.sin(a*2)*16,dir=Math.sin(a)>0?-1:1;
    this.updateTrailAndRings(dt,fx,fy,dir,f,r);
    drawSpeciesFish(c,f.fish,fx,fy,19+tier*2,dir,t*(10+tier*2),t,1);

    const bx=26,bw=w-52,by=236,bh=20;
    c.fillStyle='rgba(4,20,26,.78)';this.round(bx-6,by-26,bw+12,bh+58,10);c.fill();
    c.fillStyle=r.color;c.font='700 10px DM Sans, sans-serif';c.textAlign='left';
    c.fillText(`${f.fish.rarity.toUpperCase()} ${r.stars} · FISGADA`,bx,by-10);
    c.fillStyle='#d6ece4';c.textAlign='right';
    c.fillText('TENTATIVAS '+'●'.repeat(Math.max(0,f.hookTries))+'○'.repeat(Math.max(0,2-f.hookTries)),bx+bw,by-10);
    c.fillStyle='rgba(255,255,255,.1)';this.round(bx,by,bw,bh,6);c.fill();
    const wx=bx+(f.hookTarget-f.hookWindow/2)*bw,ww=f.hookWindow*bw,glow=f.inWindow?.95:.65;
    c.fillStyle=f.inWindow?r.color:`rgba(243,207,130,${glow})`;this.round(wx,by,ww,bh,5);c.fill();
    const nx=bx+f.needle*bw;c.fillStyle='#fff';c.shadowColor='#fff';c.shadowBlur=10;c.fillRect(nx-2,by-5,4,bh+10);c.shadowBlur=0;
    const left=Math.max(0,f.timer/f.biteTotal);c.fillStyle='rgba(255,255,255,.12)';c.fillRect(bx,by+bh+10,bw,4);c.fillStyle=left<.3?'#e8806b':r.color;c.fillRect(bx,by+bh+10,bw*left,4);
  }

  drawCatch(dt,f,reel,r){
    const {c,w,h,t}=this,top=22,bottom=h-24,H=bottom-top,colX=78,colW=60,tier=r.tier;
    const Y=v=>bottom-v*H;
    c.fillStyle='rgba(2,16,22,.58)';this.round(colX-colW/2,top-4,colW,H+8,12);c.fill();
    c.strokeStyle=tier>=3?r.glow:'rgba(180,230,225,.25)';c.lineWidth=tier>=4?2:1;this.round(colX-colW/2,top-4,colW,H+8,12);c.stroke();

    const zy=Y(f.zonePos+f.zoneSize),zh=f.zoneSize*H;
    c.fillStyle=f.inside?'rgba(130,230,150,.45)':'rgba(200,225,215,.22)';this.round(colX-colW/2+4,zy,colW-8,zh,8);c.fill();
    c.strokeStyle=f.inside?'#9ff0b0':'rgba(220,240,235,.6)';c.lineWidth=2;this.round(colX-colW/2+4,zy,colW-8,zh,8);c.stroke();

    const fy=Y(f.fishPos),fx=colX+Math.sin(t*(4+tier))*4,dir=f.fishTarget>f.fishPos?1:-1;
    c.strokeStyle=tier>=4?r.color:'rgba(235,245,230,.75)';c.lineWidth=tier>=4?1.6:1.2;
    c.beginPath();c.moveTo(colX+2,0);c.quadraticCurveTo(colX+28,fy/2,fx+6,fy);c.stroke();

    this.updateTrailAndRings(dt,fx,fy,dir,f,r);
    drawSpeciesFish(c,f.fish,fx,fy,15+Math.min(4,tier),dir,t*(10+f.fish.difficulty*6),t,1);

    if(f.inside&&Math.random()<dt*(18+tier*8)){
      this.splash.push({x:fx,y:fy,vx:(Math.random()-.5)*(45+tier*12),vy:-20-Math.random()*(35+tier*8),life:.55,color:Math.random()<.5?r.color:'#e8fff8'});
    }
    this.splash=this.splash.filter(p=>{
      p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=55*dt;
      c.fillStyle=p.color;c.globalAlpha=Math.max(0,p.life*1.9);
      c.beginPath();c.arc(p.x,p.y,1.6+tier*.2,0,Math.PI*2);c.fill();
      return p.life>0;
    });
    c.globalAlpha=1;

    const px=128,pw=12;c.fillStyle='rgba(2,16,22,.55)';this.round(px,top-4,pw,H+8,6);c.fill();
    const ph=f.progress*H;c.fillStyle=tier>=4?r.color:`hsl(${Math.round(f.progress*120)},65%,58%)`;this.round(px+2,bottom-ph,pw-4,ph,4);c.fill();

    const rx=226,ry=120;this.reelAngle+=dt*(reel?14+tier:-3);
    c.save();c.translate(rx,ry);
    if(tier>=3&&reel){
      c.strokeStyle=r.glow;c.lineWidth=6;c.beginPath();c.arc(0,0,42+Math.sin(t*12)*2,0,Math.PI*2);c.stroke();
    }
    c.strokeStyle='rgba(225,240,230,.85)';c.lineWidth=3;c.beginPath();c.arc(0,0,38,0,Math.PI*2);c.stroke();
    c.rotate(this.reelAngle);for(let i=0;i<6;i++){c.rotate(Math.PI/3);c.beginPath();c.moveTo(0,0);c.lineTo(34,0);c.stroke();}
    c.fillStyle=r.color;c.beginPath();c.arc(30,0,6,0,Math.PI*2);c.fill();c.restore();

    c.textAlign='center';
    c.fillStyle=r.color;c.font='700 10px DM Sans, sans-serif';c.fillText(`${f.fish.rarity.toUpperCase()} ${r.stars}`,rx,ry-52);
    c.fillStyle='#d6ece4';c.font='700 11px DM Sans, sans-serif';c.fillText(reel?'RECOLHENDO':'LINHA SOLTA',rx,ry+60);
    c.font='800 30px Manrope, sans-serif';c.fillStyle=f.inside?'#9ff0b0':r.color;c.fillText(Math.round(f.progress*100)+'%',rx,ry+100);
    c.font='600 10px DM Sans, sans-serif';c.fillStyle='rgba(214,236,228,.8)';c.fillText(f.inside?'Peixe na zona!':'Alcance o peixe',rx,ry+120);
  }

  round(x,y,w,h,r){const c=this.c;r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
}

// Animação cinematográfica na tela mostrando o peixe capturado, seu peso e seu valor.
export class CatchReveal{
  constructor(canvas,container,elems={}){
    this.canvas=canvas;this.container=container;this.elems=elems;this.c=canvas.getContext('2d');
    this.w=canvas.width;this.h=canvas.height;this.active=false;this.t=0;this.duration=5;
    this.fish=null;this.caught=null;this.price=0;this.particles=[];this.splash=[];this.rings=[];this.bolts=[];this.trail=[];
  }

  show(caught,fishDef,price){
    const r=rarityInfo(fishDef),tier=r.tier;
    this.caught=caught;this.fish=fishDef;this.price=price;this.r=r;
    this.t=0;this.duration=r.fx.duration;this.active=true;this.trail=[];
    this.container.dataset.rarity=fishDef.rarity;
    this.container.classList.add('show');

    // Jato de gotas d'água do salto inicial do peixe saindo do mar
    this.splash=Array.from({length:24+tier*8},()=>({
      x:this.w/2+(Math.random()-.5)*70,y:this.h-18,
      vx:(Math.random()-.5)*(90+tier*18),vy:-95-Math.random()*(95+tier*22),
      r:1.8+Math.random()*2.5,life:.9+Math.random()*.5
    }));

    // Partículas de celebração proporcionais à raridade
    const count=22+tier*20;
    this.particles=Array.from({length:count},(_,i)=>{
      const ang=Math.random()*Math.PI*2,spd=35+Math.random()*(50+tier*30);
      return {
        x:this.w/2,y:this.h*.46,
        vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd-20,
        s:2+Math.random()*(1.6+tier*.85),
        color:i%3===0?'#ffffff':i%2===0?r.color:r.accent,
        star:tier>=2&&i%2===0,
        life:1.1+Math.random()*(.9+tier*.45)
      };
    });

    this.rings=Array.from({length:r.fx.rings},(_,i)=>({
      delay:.15+i*.22,r:10,max:85+tier*24+i*20,color:i%2?r.accent:r.color
    }));
    this.bolts=[];
  }

  hide(){
    this.active=false;
    this.container.classList.remove('show');
  }

  draw(dt){
    if(!this.active||!this.fish)return;
    this.t+=dt;
    if(this.t>=this.duration){this.hide();return;}
    const {c,w,h,t,r,fish,caught,price,elems}=this,tier=r.tier,cx=w/2,cy=h*.46;

    // Atualiza os contadores animados de peso e valor na UI
    const countP=Math.min(1,t/.65),ease=1-Math.pow(1-countP,3);
    if(elems.weight)elems.weight.textContent=(caught.weight*ease).toFixed(2)+' kg';
    if(elems.price)elems.price.textContent='◈ '+Math.round(price*ease);

    // Fundo aquático profundo de acordo com a raridade
    const bg=c.createRadialGradient(cx,cy,12,cx,cy,w*.72);
    bg.addColorStop(0,r.glow);
    bg.addColorStop(.55,tier>=4?'#142544':'#0e3c49');
    bg.addColorStop(1,'#04141b');
    c.fillStyle=bg;c.fillRect(0,0,w,h);

    // Feixes solares giratórios
    const beams=r.fx.rays;
    c.save();c.translate(cx,cy);c.rotate(t*(.32+tier*.12));
    for(let i=0;i<beams;i++){
      c.rotate(Math.PI*2/beams);
      const lg=c.createLinearGradient(0,0,w*.68,0);
      lg.addColorStop(0,r.glow);lg.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=lg;c.beginPath();c.moveTo(0,0);c.lineTo(w*.68,-14);c.lineTo(w*.68,14);c.closePath();c.fill();
    }
    if(tier>=4){
      c.rotate(-t*1.1);
      for(let i=0;i<beams/2;i++){
        c.rotate(Math.PI*4/beams);
        c.fillStyle='rgba(255,245,200,.13)';
        c.beginPath();c.moveTo(0,0);c.lineTo(w*.56,-8);c.lineTo(w*.56,8);c.closePath();c.fill();
      }
    }
    c.restore();

    // Círculo rúnico/náutico para Raro, Épico e Lendário
    if(tier>=3){
      c.save();c.translate(cx,cy);c.rotate(-t*.55);
      c.strokeStyle=r.color;c.globalAlpha=.38;c.lineWidth=1.5;
      c.beginPath();c.arc(0,0,76,0,Math.PI*2);c.stroke();
      if(tier>=4){
        c.setLineDash([6,6]);c.beginPath();c.arc(0,0,92,0,Math.PI*2);c.stroke();c.setLineDash([]);
        for(let i=0;i<12;i++){c.rotate(Math.PI/6);c.beginPath();c.moveTo(74,0);c.lineTo(94,0);c.stroke();}
      }
      c.restore();c.globalAlpha=1;
    }

    // Anéis de onda de choque
    for(const rg of this.rings){
      if(t<rg.delay)continue;
      const p=Math.min(1,(t-rg.delay)/1.15),rad=rg.r+p*(rg.max-rg.r);
      c.strokeStyle=rg.color;c.globalAlpha=(1-p)*.75;c.lineWidth=2.5*(1-p*.5);
      c.beginPath();c.arc(cx,cy,rad,0,Math.PI*2);c.stroke();
    }
    c.globalAlpha=1;

    // Relâmpagos para Épico/Lendário
    if(r.fx.lightning>0&&Math.random()<dt*(4+tier*2)){
      const ang=Math.random()*Math.PI*2,pts=[{x:cx+Math.cos(ang)*22,y:cy+Math.sin(ang)*22}];
      for(let k=1;k<=5;k++){
        const rad=22+k*22,a=ang+(Math.random()-.5)*.45;
        pts.push({x:cx+Math.cos(a)*rad,y:cy+Math.sin(a)*rad});
      }
      this.bolts.push({pts,life:.16});
    }
    for(const b of this.bolts){
      b.life-=dt;c.strokeStyle=tier>=5?'#ffd86b':r.color;c.globalAlpha=Math.max(0,b.life*6);c.lineWidth=2;
      c.beginPath();c.moveTo(b.pts[0].x,b.pts[0].y);
      for(let i=1;i<b.pts.length;i++)c.lineTo(b.pts[i].x,b.pts[i].y);
      c.stroke();
    }
    c.globalAlpha=1;this.bolts=this.bolts.filter(b=>b.life>0);

    // Salto inicial da água (0 -> 0.55s) + coreografia por raridade
    const leap=Math.min(1,t/.55),leapY=(1-leap)*(1-leap)*(h*.62)-Math.sin(leap*Math.PI)*24;
    const scale=.45+.55*(1-Math.pow(1-leap,3));
    let fx=cx,fy=cy+leapY,dir=1;
    if(t>.55){
      const st=t-.55;
      if(tier===1){fy=cy+Math.sin(st*3.5)*8;}
      else if(tier===2){fx=cx+Math.sin(st*2.8)*20;fy=cy-Math.abs(Math.cos(st*2.8))*12+4;dir=Math.cos(st*2.8)>=0?1:-1;}
      else if(tier===3){fx=cx+Math.sin(st*3.2)*30;fy=cy+Math.sin(st*6.4)*11;dir=Math.cos(st*3.2)>=0?1:-1;}
      else if(tier===4){fx=cx+Math.cos(st*3.6)*34;fy=cy+Math.sin(st*3.6)*16;dir=-Math.sin(st*3.6)>=0?1:-1;}
      else{fx=cx+Math.sin(st*4)*42;fy=cy+Math.sin(st*8)*16;dir=Math.cos(st*4)>=0?1:-1;}
    }

    const fishSize=(34+tier*3.5)*scale;
    if(tier>=2){
      this.trail.unshift({x:fx,y:fy,dir,wiggle:t*(10+tier*3)});
      if(this.trail.length>r.fx.trail)this.trail.length=r.fx.trail;
      for(let i=this.trail.length-1;i>=1;i--){
        const tr=this.trail[i];
        drawSpeciesFish(c,fish,tr.x,tr.y,fishSize,tr.dir,tr.wiggle,t,(1-i/this.trail.length)*.3);
      }
    }

    drawSpeciesFish(c,fish,fx,fy,fishSize,dir,t*(10+tier*3),t,1);

    // Gotas do salto inicial
    c.fillStyle='#d8f8ff';
    for(const sp of this.splash){
      sp.life-=dt;if(sp.life<=0)continue;
      sp.x+=sp.vx*dt;sp.y+=sp.vy*dt;sp.vy+=210*dt;
      c.globalAlpha=Math.min(1,sp.life*1.6);
      c.beginPath();c.arc(sp.x,sp.y,sp.r,0,Math.PI*2);c.fill();
    }

    // Partículas e estrelas
    for(const p of this.particles){
      p.life-=dt;if(p.life<=0)continue;
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=38*dt;
      c.fillStyle=p.color;c.globalAlpha=Math.min(1,p.life*1.5);
      if(p.star){
        c.save();c.translate(p.x,p.y);c.rotate(t*4);
        c.fillRect(-p.s,-p.s*.3,p.s*2,p.s*.6);c.fillRect(-p.s*.3,-p.s,p.s*.6,p.s*2);
        c.restore();
      }else{
        c.beginPath();c.arc(p.x,p.y,p.s,0,Math.PI*2);c.fill();
      }
    }
    c.globalAlpha=1;

    // Etiquetas flutuantes no próprio canvas destacando Peso e Valor junto ao peixe
    if(t>.25){
      const tagA=Math.min(1,(t-.25)/.3);
      c.save();c.globalAlpha=tagA;
      c.font='700 11px DM Sans, sans-serif';
      c.fillStyle='rgba(4,20,27,.78)';
      c.fillRect(14,14,118,26);c.fillRect(w-132,14,118,26);
      c.strokeStyle=r.color;c.lineWidth=1;
      c.strokeRect(14,14,118,26);c.strokeRect(w-132,14,118,26);
      c.fillStyle='#edf4ee';c.textAlign='center';
      c.fillText(`⚖ ${(caught.weight*ease).toFixed(2)} kg`,73,31);
      c.fillStyle='#f1cf92';
      c.fillText(`◈ ${Math.round(price*ease)} moedas`,w-73,31);
      c.restore();
    }

    // Ondas na base do cartão
    for(let layer=0;layer<Math.min(3,1+Math.floor(tier/2));layer++){
      c.fillStyle=layer===0?'rgba(180,240,235,.24)':r.glow;
      c.beginPath();c.moveTo(0,h);
      for(let x=0;x<=w;x+=10){
        const wy=h-16-layer*7+Math.sin(x*.04+t*(3+layer)+layer)*5;
        c.lineTo(x,wy);
      }
      c.lineTo(w,h);c.closePath();c.fill();
    }

    // Clarão inicial para Lendário
    if(tier>=5&&t<.35){
      c.fillStyle='#fff6d6';c.globalAlpha=(1-t/.35)*.65;c.fillRect(0,0,w,h);c.globalAlpha=1;
    }
  }
}
