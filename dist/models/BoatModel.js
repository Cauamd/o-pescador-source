import * as T from '../vendor/three.module.js';
import {mesh,box,tube,cylinderBetween,batchStatic} from './ModelUtils.js';
export const BOAT_ANCHORS=Object.freeze({rodTip:[1.75,4.2,-1],motor:[0,.55,3],character:[0,0,0],deckHeight:.68});
export function hullProfile(t,angle,inner=false){const width=(.035+1.86*Math.pow(Math.sin(t*Math.PI/2),.68)*(1-.19*t))-(inner?.09:0),sheer=1.02+.38*Math.pow(1-t,3)+.04*t,keel=-.40+.31*Math.pow(1-t,5)+.1*t*t;return [Math.sin(angle)*Math.max(.015,width),keel+(sheer-keel)*(1-Math.cos(angle)/Math.cos(0))/(1-Math.cos(1.43))+(inner?.09:0),-4+6.8*t];}

/** Closed shell, outer/inner skin + rim/transom/stem. UVs follow the longitudinal grain. */
export function createHullGeometry(lengthSegments=64,sectionSegments=28){
 const pos=[],uv=[],idx=[],row=sectionSegments+1,skin=(lengthSegments+1)*row;
 for(let layer=0;layer<2;layer++)for(let i=0;i<=lengthSegments;i++)for(let j=0;j<=sectionSegments;j++){pos.push(...hullProfile(i/lengthSegments,-1.43+j/sectionSegments*2.86,!!layer));uv.push(i/lengthSegments*3,j/sectionSegments);}
 for(let l=0;l<2;l++)for(let i=0;i<lengthSegments;i++)for(let j=0;j<sectionSegments;j++){const a=l*skin+i*row+j,b=a+1,c=a+row,d=c+1;if(l===0)idx.push(a,b,c,b,d,c);else idx.push(a,c,b,b,c,d);}
 const boundary=[];for(let i=0;i<=lengthSegments;i++)boundary.push(i*row);for(let j=1;j<=sectionSegments;j++)boundary.push(lengthSegments*row+j);for(let i=lengthSegments-1;i>=0;i--)boundary.push(i*row+sectionSegments);for(let j=sectionSegments-1;j>0;j--)boundary.push(j);
 for(let i=0;i<boundary.length;i++){const a=boundary[i],b=boundary[(i+1)%boundary.length];idx.push(a,a+skin,b,b,a+skin,b+skin);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();g.computeBoundingBox();return g;
}

/** Espelho de popa sólido (transom) que fecha completamente a traseira em U do casco. */
function createTransomGeometry(zPos=2.79,topY=1.11,inner=false,segments=28){
 const pos=[],uv=[],idx=[];
 for(let j=0;j<=segments;j++){
  const u=j/segments,ang=-1.43+u*2.86,p=hullProfile(1,ang,inner);
  pos.push(p[0],p[1],zPos,p[0],topY,zPos);
  uv.push(u,0,u,1);
 }
 for(let j=0;j<segments;j++){
  const a=j*2,b=a+1,c=a+2,d=a+3;
  if(inner)idx.push(a,c,b,b,c,d);else idx.push(a,b,c,b,d,c);
 }
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 g.setIndex(idx);g.computeVertexNormals();return g;
}

/** Piso estrutural contínuo sob as tábuas do convés para vedar 100% o fundo interno do barco. */
function createSubDeckGeometry(yPos=.58,segments=32){
 const pos=[],uv=[],idx=[];
 for(let i=0;i<=segments;i++){
  const t=.04+(i/segments)*.95,z=-4+t*6.8,w=Math.max(.08,hullProfile(t,1.06,true)[0]);
  pos.push(-w,yPos,z,w,yPos,z);
  uv.push(0,t*3,1,t*3);
 }
 for(let i=0;i<segments;i++){
  const a=i*2,b=a+1,c=a+2,d=a+3;
  idx.push(a,c,b,b,c,d);
 }
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 g.setIndex(idx);g.computeVertexNormals();return g;
}

export function createBoatModel(materials,{detail=true}={}){
 const group=new T.Group();group.name='TraditionalFishingBoat';const structure=new T.Group();group.add(structure);
 const wood=materials.get('boat-wood',0xd3c2a0,{texture:'wood'}),lightwood=materials.get('boat-wood-light',0xf4e5c5,{texture:'wood'}),darkwood=materials.get('boat-wood-dark',0xb39c76,{texture:'wood'});
 const hullMaterial=materials.get('boat-hull',0xffffff,{texture:'paint',roughness:.68}),rim=materials.get('boat-rim',0xe9dfc6,{roughness:.72}),red=materials.get('boat-red',0x864837,{roughness:.72}),metal=materials.get('boat-metal',0x6e7775,{metalness:.75,roughness:.38}),rubber=materials.get('rubber',0x202a29,{roughness:.94}),rope=materials.get('rope',0x9e9476,{texture:'wood'});
 const hull=mesh(group,createHullGeometry(detail?64:24,detail?28:12),hullMaterial);hull.name='CurvedHull';
 // Espelho de popa (transom) externo pintado e interno em madeira + piso contínuo vedado.
 mesh(structure,createTransomGeometry(2.8,1.11,false,detail?28:14),hullMaterial);
 mesh(structure,createTransomGeometry(2.71,1.1,true,detail?28:14),darkwood);
 mesh(structure,createSubDeckGeometry(.58,detail?32:16),darkwood);
 box(structure,wood,2.92,.14,.14,0,1.06,2.75);
 // Bordas curvas (gunwales) e friso lateral + fechamento traseiro na popa.
 for(const side of [-1,1]){const pts=[];for(let i=0;i<=40;i++){const p=hullProfile((i/40)*.992,side*1.43);p[1]+=.06;pts.push(p);}tube(structure,rim,pts,.075,detail?80:32);tube(structure,red,pts.map(p=>[p[0]*1.01,p[1]-.18,p[2]]),.045,detail?80:32);}
 cylinderBetween(structure,rim,[-1.52,1.12,2.78],[1.52,1.12,2.78],.085);
 cylinderBetween(structure,red,[-1.49,.94,2.82],[1.49,.94,2.82],.045);
 // Tábuas do piso estendidas até o espelho de popa.
 for(let i=0;i<22;i++){const t=.11+i*.039,z=-4+t*6.8,w=Math.max(.3,hullProfile(t,1.12,true)[0]*2-.1);box(structure,[wood,lightwood,darkwood][i%3],w,.09,.255,0,.635,z);}
 const benches=[];for(const z of [-2.05,-.85,1.45]){const t=(z+4)/6.8,w=hullProfile(t,1.38,true)[0]*2-.04;const bench=box(structure,lightwood,w,.13,.41,0,1.01,z);bench.name='Bench';benches.push(z);for(const x of [-w*.39,w*.39])box(structure,darkwood,.09,.34,.33,x,.80,z);}
 if(detail){
  // Cavernas internas apoiadas acima do piso vedado.
  for(let i=1;i<=8;i++){const t=i/9.4,pts=[];for(let j=0;j<=16;j++){const p=hullProfile(t,-1.38+j/16*2.76,true);p[1]=Math.max(.62,p[1]+.045);pts.push(p);}tube(structure,wood,pts,.042,24);}
  for(const side of [-1,1])for(let i=1;i<15;i++){const p=hullProfile(i/16,side*1.43);mesh(structure,new T.SphereGeometry(.022,6,4),metal,p[0],p[1]+.10,p[2]);}
  for(const side of [-1,1]){
   cylinderBetween(structure,wood,[side*1.52,1.14,-2.2],[side*1.76,1.23,1.75],.045,12);
   const blade=mesh(structure,new T.SphereGeometry(1,14,8),lightwood,side*1.78,1.23,2.08);blade.scale.set(.18,.045,.64);
   const lock=mesh(structure,new T.TorusGeometry(.1,.022,6,12),metal,side*1.66,1.19,.5);lock.rotation.x=Math.PI/2;
   box(structure,metal,.18,.19,.48,side*1.38,1.08,2.48);
   const tire=mesh(structure,new T.TorusGeometry(.23,.085,8,20),rubber,side*1.6,.72,.5);tire.rotation.y=Math.PI/2;
  }
  const coil=[];for(let i=0;i<160;i++){const a=i/159*Math.PI*8,r=.13+.21*i/159;coil.push([.75+Math.cos(a)*r,.75+Math.sin(a*2)*.012,2.03+Math.sin(a)*r]);}tube(structure,rope,coil,.024,160);
  for(let i=0;i<9;i++){const z=.1+i*.12;tube(structure,rope,[[-1.12,.73,z],[-1.5,1.04,z],[-1.64,.45,z+.08]],.009,10);}
  for(let i=0;i<7;i++){const y=.48+i*.085;tube(structure,rope,[[-1.64,y,.1],[-1.69,y-.07,.55],[-1.64,y,1.07]],.009,10);}
  for(const x of [-.68,-.12])for(let j=0;j<4;j++)box(structure,wood,.04,.075,.55,x,.78+j*.1,1.95);
  for(const z of [1.68,2.22])for(let j=0;j<4;j++)box(structure,darkwood,.6,.075,.04,-.4,.78+j*.1,z);
  cylinderBetween(structure,metal,[-.7,.75,-2.65],[-.7,.77,-1.95],.035);
  tube(structure,metal,[[-1.05,.76,-2.3],[-.7,.76,-2.6],[-.35,.76,-2.3]],.037,16);
 }
 batchStatic(structure);
 const motor=new T.Group();motor.name='OutboardMotor';motor.position.set(...BOAT_ANCHORS.motor);group.add(motor);
 const motorStatic=new T.Group();motor.add(motorStatic);
 const profile=[[.18,0],[.32,.08],[.36,.2],[.35,.57],[.27,.69],[.08,.73]].map(p=>new T.Vector2(...p));
 const cowling=mesh(motorStatic,new T.LatheGeometry(profile,detail?28:12),rubber,0,.3,.1);cowling.scale.set(1,.9,.7);
 for(const x of [-.24,.24])tube(motorStatic,metal,[[x,.4,-.35],[x,.25,-.12],[x,-.12,.08]],.04,12);
 cylinderBetween(motorStatic,metal,[0,.4,.1],[0,-.85,.18],.085,12);box(motorStatic,metal,.44,.04,.3,0,-.48,.16);
 cylinderBetween(motorStatic,rubber,[0,.47,-.13],[.1,.47,-.96],.035,10);
 if(detail)for(let i=0;i<5;i++)box(motorStatic,metal,.35,.018,.018,0,.65+i*.045,.27);
 batchStatic(motorStatic);
 const propeller=new T.Group();propeller.position.set(0,-.74,.25);motor.add(propeller);
 for(let i=0;i<3;i++){const blade=mesh(propeller,new T.SphereGeometry(1,10,6),metal);blade.scale.set(.07,.22,.025);blade.position.set(Math.sin(i*Math.PI*2/3)*.16,Math.cos(i*Math.PI*2/3)*.16,0);blade.rotation.z=-i*Math.PI*2/3;}
 batchStatic(propeller);
 group.userData.benches=benches;group.userData.anchors=BOAT_ANCHORS;
 return {group,hull,hullMaterial,rimMaterial:rim,redMaterial:red,motor,propeller,update(time,power){propeller.rotation.z=time*(power?35:0);}};
}

/**
 * Cria as 4 evoluções visuais da Vara de Pesca (Nível 0 a 3), mantendo a ponta em BOAT_ANCHORS.rodTip.
 * Nível 0: Bambu simples
 * Nível 1: Fibra marinha + molinete metálico + passadores
 * Nível 2: Carbono oceânico & ouro + carretilha dupla reforçada
 * Nível 3 (Máxima): "Soberana do Abismo" em ouro, platina, espiral bioluminescente e aro giratório
 */
export function createRodModel(materials){
 const root=new T.Group();root.name='FishingRodEvolutions';
 const start=[.05,1.45,-1],tip=BOAT_ANCHORS.rodTip;
 const pointAt=u=>[start[0]+(tip[0]-start[0])*u,start[1]+(tip[1]-start[1])*u,start[2]+(tip[2]-start[2])*u];

 const bamboo=materials.get('rod-bamboo',0xb5925b,{roughness:.85});
 const rope=materials.get('rod-rope',0x6e5536,{roughness:.9});
 const navy=materials.get('rod-navy',0x226888,{metalness:.35,roughness:.35});
 const carbon=materials.get('rod-carbon',0x1f262c,{metalness:.55,roughness:.28});
 const chrome=materials.get('rod-chrome',0xd5e0e5,{metalness:.88,roughness:.2});
 const gold=materials.get('rod-gold',0xf5c85c,{metalness:.88,roughness:.18,emissive:0x3a2805});
 const glow=materials.get('rod-glow',0x6cf5ff,{emissive:0x32d9f0,roughness:.15});

 // Nível 0: Vara de bambu artesanal com nós
 const lv0=new T.Group();
 cylinderBetween(lv0,bamboo,start,tip,.028,10);
 cylinderBetween(lv0,rope,start,pointAt(.22),.036,10);
 for(const u of [.28,.48,.68,.86]){const p=pointAt(u);mesh(lv0,new T.SphereGeometry(.032,8,6),rope,p[0],p[1],p[2]);}
 batchStatic(lv0);root.add(lv0);

 // Nível 1: Vara de fibra costeira com molinete lateral e passadores cromados
 const lv1=new T.Group();
 cylinderBetween(lv1,navy,start,tip,.03,12);
 cylinderBetween(lv1,carbon,start,pointAt(.25),.042,12);
 const pReel1=pointAt(.2);
 cylinderBetween(lv1,chrome,[pReel1[0],pReel1[1],pReel1[2]],[pReel1[0]+.12,pReel1[1]-.1,pReel1[2]],.025,8);
 mesh(lv1,new T.CylinderGeometry(.09,.09,.12,14),chrome,pReel1[0]+.14,pReel1[1]-.12,pReel1[2]+.02);
 for(const u of [.35,.55,.75,.95]){const p=pointAt(u),g=mesh(lv1,new T.TorusGeometry(.045,.009,6,12),chrome,p[0]+.03,p[1]-.02,p[2]);g.rotation.y=Math.PI/2;}
 batchStatic(lv1);root.add(lv1);

 // Nível 2: Vara oceânica de carbono & ouro com carretilha dupla
 const lv2=new T.Group();
 cylinderBetween(lv2,carbon,start,tip,.034,14);
 cylinderBetween(lv2,gold,start,pointAt(.08),.048,12);
 cylinderBetween(lv2,gold,pointAt(.24),pointAt(.3),.045,12);
 const pReel2=pointAt(.22);
 const drum2=mesh(lv2,new T.CylinderGeometry(.12,.12,.16,16),gold,pReel2[0]+.12,pReel2[1]-.08,pReel2[2]);drum2.rotation.x=Math.PI/2;
 mesh(lv2,new T.CylinderGeometry(.09,.09,.18,14),chrome,pReel2[0]+.12,pReel2[1]-.08,pReel2[2]);
 for(const u of [.32,.48,.64,.8,.96]){const p=pointAt(u);mesh(lv2,new T.TorusGeometry(.052,.012,8,14),gold,p[0]+.03,p[1]-.02,p[2]);}
 batchStatic(lv2);root.add(lv2);

 // Nível 3 (Máxima): Vara Lendária "Soberana do Abismo" com espiral luminosa e aro giratório
 const lv3=new T.Group(),lv3Static=new T.Group();lv3.add(lv3Static);
 cylinderBetween(lv3Static,gold,start,tip,.036,16);
 cylinderBetween(lv3Static,carbon,pointAt(.06),pointAt(.24),.048,14);
 mesh(lv3Static,new T.OctahedronGeometry(.085,0),glow,start[0],start[1],start[2]);
 // Espiral bioluminescente envolvendo a vara até a ponteira
 const spiral=[];
 for(let i=0;i<=48;i++){
  const u=.12+(i/48)*.86,p=pointAt(u),a=i*.55;
  spiral.push([p[0]+Math.cos(a)*.048,p[1]+Math.sin(a)*.048,p[2]]);
 }
 tube(lv3Static,glow,spiral,.011,64);
 // Guarda em coroa dourada e 6 passadores luminosos
 const pGuard=pointAt(.26);
 for(const s of [-1,1])tube(lv3Static,gold,[[pGuard[0],pGuard[1],pGuard[2]],[pGuard[0]+.12,pGuard[1]+s*.14,pGuard[2]+s*.12],[pGuard[0]+.04,pGuard[1]+s*.22,pGuard[2]]],.018,12);
 for(const u of [.34,.47,.6,.73,.86,.98]){const p=pointAt(u);mesh(lv3Static,new T.TorusGeometry(.058,.013,8,16),gold,p[0]+.03,p[1]-.02,p[2]);}
 mesh(lv3Static,new T.SphereGeometry(.055,12,10),glow,tip[0],tip[1],tip[2]);
 batchStatic(lv3Static);
 // Carretilha imperial com rotor luminoso que gira de verdade
 const pReel3=pointAt(.21),rotor=new T.Group();rotor.position.set(pReel3[0]+.13,pReel3[1]-.06,pReel3[2]);lv3.add(rotor);
 mesh(rotor,new T.TorusGeometry(.14,.02,8,20),gold);
 const rGlow=mesh(rotor,new T.TorusGeometry(.105,.014,8,18),glow);rGlow.rotation.x=Math.PI/2;
 for(let i=0;i<4;i++){const a=i*Math.PI/2;cylinderBetween(rotor,gold,[0,0,0],[Math.cos(a)*.13,Math.sin(a)*.13,0],.014,6);}
 batchStatic(rotor);
 root.add(lv3);

 const stages=[lv0,lv1,lv2,lv3];
 return {
  group:root,
  update(level=0,time=0,reeling=false){
   const lv=Math.max(0,Math.min(3,level|0));
   for(let i=0;i<stages.length;i++)stages[i].visible=i===lv;
   rotor.rotation.z=time*(reeling?16:2.2);
   rotor.rotation.y=time*1.4;
  }
 };
}

/**
 * Cria as evoluções visuais progressivas do Barco (Nível 0 → 1 → 2 → 3):
 * Nível 0: Bote de madeira rústico
 * Nível 1: Console de comando com timão, para-brisa, farol de proa e caixa térmica
 * Nível 2: Cabine aberta / T-Top marítimo, guarda-corpo de proa, luzes de navegação e motor duplo
 * Nível 3 (Máximo): Acabamento imperial Azul & Ouro, radar giratório no teto, holofotes, 4 porta-varas dourados, proa astral e hélices douradas
 */
export function createBoatEvolutions(materials,boatModel){
 const root=new T.Group();root.name='BoatUpgrades';
 boatModel.group.add(root);

 const chrome=materials.get('up-chrome',0xdbe4e8,{metalness:.85,roughness:.22});
 const navy=materials.get('up-navy',0x1e4e6e,{roughness:.45});
 const cream=materials.get('up-cream',0xf2ead7,{roughness:.55});
 const glass=materials.get('up-glass',0x8cd9ee,{metalness:.2,roughness:.12,transparent:true,opacity:.55});
 const gold=materials.get('up-gold',0xf2c14e,{metalness:.88,roughness:.2,emissive:0x332204});
 const glow=materials.get('up-glow',0x88f7ff,{emissive:0x3bd8f0,roughness:.15});
 const redLight=materials.get('up-red',0xff5252,{emissive:0xc62828,roughness:.2});
 const greenLight=materials.get('up-green',0x52ff88,{emissive:0x1b9e4b,roughness:.2});

 // --- Estágio 1 (aparece em boatTier >= 1): Console + Timão + Para-brisa + Farol de proa + Porão ---
 const tier1=new T.Group();
 box(tier1,cream,.78,.68,.46,0,1.02,-.52);
 box(tier1,navy,.82,.12,.5,0,1.38,-.52);
 // Para-brisa inclinado
 const shield=box(tier1,glass,.76,.42,.04,0,1.62,-.7);shield.rotation.x=-.32;
 // Timão (volante náutico)
 const wheel=mesh(tier1,new T.TorusGeometry(.19,.022,8,18),chrome,0,1.46,-.26);wheel.rotation.x=-.35;
 cylinderBetween(tier1,chrome,[0,1.38,-.42],[0,1.46,-.26],.028,8);
 // Caixa térmica / Porão de pesca com tampo creme
 box(tier1,navy,.92,.52,.68,-.48,.92,1.62);
 box(tier1,cream,.96,.08,.72,-.48,1.2,1.62);
 // Farol de proa
 cylinderBetween(tier1,chrome,[0,1.28,-3.72],[0,1.52,-3.72],.035,8);
 mesh(tier1,new T.SphereGeometry(.11,12,10),glow,0,1.56,-3.76);
 batchStatic(tier1);root.add(tier1);

 // --- Estágio 2 (aparece em boatTier >= 2): Cabine T-Top / Toldo rígido + Guarda-corpo de proa + Luzes + Motor Duplo ---
 const tier2=new T.Group();
 for(const x of [-.95,.95])for(const z of [-1.25,1.05]){
  cylinderBetween(tier2,chrome,[x,1.05,z],[x*.92,3.15,z],.04,10);
 }
 // Cobertura aerodinâmica do T-Top
 box(tier2,cream,2.08,.11,2.68,0,3.18,-.1);
 box(tier2,navy,1.94,.06,2.52,0,3.25,-.1);
 // Luzes de navegação (bombordo vermelha / estibordo verde) e antena
 mesh(tier2,new T.SphereGeometry(.065,10,8),redLight,-1.04,3.2,-.9);
 mesh(tier2,new T.SphereGeometry(.065,10,8),greenLight,1.04,3.2,-.9);
 cylinderBetween(tier2,chrome,[.65,3.24,-.9],[.65,4.15,-1.05],.018,8);
 // Guarda-corpo de proa (bow rails)
 for(const side of [-1,1]){
  const rail=[];
  for(let i=0;i<=12;i++){
   const t=(i/12)*.36,p=hullProfile(t,side*1.43);
   rail.push([p[0]*.96,p[1]+.34,p[2]]);
   if(i%4===0)cylinderBetween(tier2,chrome,[p[0]*.96,p[1]+.06,p[2]],[p[0]*.96,p[1]+.34,p[2]],.02,6);
  }
  tube(tier2,chrome,rail,.024,24);
 }
 // Segundo compartimento de carga a estibordo
 box(tier2,navy,.72,.48,.62,.58,.9,1.62);
 box(tier2,cream,.76,.07,.66,.58,1.16,1.62);
 batchStatic(tier2);root.add(tier2);

 // --- Estágio 3 (aparece em boatTier >= 3 - Evolução Máxima): Ouro Imperial, Radar Giratório, Porta-Varas Dourados e Brasão ---
 const tier3=new T.Group(),tier3Static=new T.Group();tier3.add(tier3Static);
 // Moldura dourada no teto da cabine + 4 porta-varas dourados (rocket launchers) + holofotes duplos
 box(tier3Static,gold,2.14,.06,2.74,0,3.18,-.1);
 for(const x of [-.65,-.22,.22,.65]){
  cylinderBetween(tier3Static,gold,[x,3.22,1.22],[x,3.62,1.42],.038,10);
 }
 for(const x of [-.42,.42]){
  box(tier3Static,gold,.22,.14,.18,x,3.3,-1.38);
  mesh(tier3Static,new T.SphereGeometry(.065,10,8),glow,x,3.3,-1.47);
 }
 // Brasão/friso imperial dourado nas duas laterais do casco e ornamento astral na proa
 for(const side of [-1,1]){
  const crest=[];
  for(let i=0;i<=24;i++){
   const t=.12+(i/24)*.78,p=hullProfile(t,side*1.32);
   crest.push([p[0]*1.015,p[1]-.08,p[2]]);
  }
  tube(tier3Static,gold,crest,.032,36);
  mesh(tier3Static,new T.OctahedronGeometry(.14,0),gold,side*1.12,1.02,-1.6);
 }
 // Púlpito de proa dourado com cristal luminoso
 cylinderBetween(tier3Static,gold,[0,1.35,-3.95],[0,1.78,-4.18],.045,10);
 mesh(tier3Static,new T.OctahedronGeometry(.16,0),glow,0,1.86,-4.22);
 batchStatic(tier3Static);

 // Domo de radar giratório no topo da cabine
 const radar=new T.Group();radar.position.set(0,3.38,-.1);tier3.add(radar);
 mesh(radar,new T.CylinderGeometry(.22,.26,.14,16),cream);
 box(radar,gold,.92,.1,.18,0,.14,0);
 mesh(radar,new T.SphereGeometry(.06,8,8),glow,0,.22,0);
 batchStatic(radar);
 root.add(tier3);

 // Segundo motor de popa para Nível 2+ (Twin Outboard)
 const twinMotor=boatModel.motor.clone();
 twinMotor.position.set(.42,.55,3);
 boatModel.group.add(twinMotor);
 const twinProp=twinMotor.children[1];

 // Paletas de cores por nível do barco (0: Madeira/Verde-mar, 1: Azul Costeiro, 2: Branco/Azul Oceânico, 3: Azul Imperial & Ouro)
 const HULL_COLORS=[0x6ba69a,0x4d8ec4,0xe8f1f8,0x1f496e];
 const RIM_COLORS=[0xe9dfc6,0xf2ead7,0xffffff,0xf5c85c];
 const STRIP_COLORS=[0x864837,0x23517a,0x1d4e89,0xd99b26];

 return {
  update(state,time,power){
   const u=state.upgrades;
   const boatTier=Math.max(u.hull||0,u.motor||0,u.hold||0);
   tier1.visible=boatTier>=1||u.hold>0||u.sonar>0;
   tier2.visible=boatTier>=2;
   tier3.visible=boatTier>=3;

   boatModel.hullMaterial.color.setHex(HULL_COLORS[boatTier]);
   boatModel.rimMaterial.color.setHex(RIM_COLORS[boatTier]);
   boatModel.redMaterial.color.setHex(STRIP_COLORS[boatTier]);

   // Motor simples nos níveis 0–1, motor duplo nos níveis 2–3
   if(boatTier>=2){
    boatModel.motor.position.x=-.42;
    twinMotor.visible=true;
    const s=boatTier>=3?1.18:1.06;
    boatModel.motor.scale.setScalar(s);
    twinMotor.scale.setScalar(s);
    if(twinProp)twinProp.rotation.z=-time*(power?38:0);
   }else{
    boatModel.motor.position.x=0;
    twinMotor.visible=false;
    boatModel.motor.scale.setScalar(boatTier===1?1.08:1);
   }

   if(tier3.visible)radar.rotation.y=time*2.2;
  }
 };
}
