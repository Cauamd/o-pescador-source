import * as T from '../vendor/three.module.js';
import {mesh,box,tube,cylinderBetween,batchStatic} from './ModelUtils.js';
export const BOAT_ANCHORS=Object.freeze({rodTip:[1.75,4.2,-1],motor:[0,.55,3],character:[0,0,0],deckHeight:.68});
export function hullProfile(t,angle,inner=false){const width=(.035+1.86*Math.pow(Math.sin(t*Math.PI/2),.68)*(1-.19*t))-(inner?.09:0),sheer=1.02+.38*Math.pow(1-t,3)+.04*t,keel=-.40+.31*Math.pow(1-t,5)+.1*t*t;return [Math.sin(angle)*Math.max(.015,width),keel+(sheer-keel)*(1-Math.cos(angle)/Math.cos(0))/(1-Math.cos(1.43))+(inner?.09:0),-4+6.8*t];}
/** Closed shell, outer/inner skin + rim/transom/stem. UVs follow the longitudinal grain. */
export function createHullGeometry(lengthSegments=64,sectionSegments=28){
 const pos=[],uv=[],idx=[],row=sectionSegments+1,skin=(lengthSegments+1)*row;
 for(let layer=0;layer<2;layer++)for(let i=0;i<=lengthSegments;i++)for(let j=0;j<=sectionSegments;j++){pos.push(...hullProfile(i/lengthSegments,-1.43+j/sectionSegments*2.86,!!layer));uv.push(i/lengthSegments*3,j/sectionSegments);}
 for(let l=0;l<2;l++)for(let i=0;i<lengthSegments;i++)for(let j=0;j<sectionSegments;j++){const a=l*skin+i*row+j,b=a+1,c=a+row,d=c+1;if(l===0)idx.push(a,b,c,b,d,c);else idx.push(a,c,b,b,c,d);}
 // Boundary ring in consistent order; stitch outer to inner.
 const boundary=[];for(let i=0;i<=lengthSegments;i++)boundary.push(i*row);for(let j=1;j<=sectionSegments;j++)boundary.push(lengthSegments*row+j);for(let i=lengthSegments-1;i>=0;i--)boundary.push(i*row+sectionSegments);for(let j=sectionSegments-1;j>0;j--)boundary.push(j);
 for(let i=0;i<boundary.length;i++){const a=boundary[i],b=boundary[(i+1)%boundary.length];idx.push(a,a+skin,b,b,a+skin,b+skin);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();g.computeBoundingBox();return g;
}
export function createBoatModel(materials,{detail=true}={}){
 const group=new T.Group();group.name='TraditionalFishingBoat';const structure=new T.Group();group.add(structure);
 const wood=materials.get('boat-wood',0xd3c2a0,{texture:'wood'}),lightwood=materials.get('boat-wood-light',0xf4e5c5,{texture:'wood'}),darkwood=materials.get('boat-wood-dark',0xb39c76,{texture:'wood'});
 const hullMaterial=materials.get('boat-hull',0xffffff,{texture:'paint',roughness:.68}),rim=materials.get('boat-rim',0xe9dfc6,{roughness:.72}),red=materials.get('boat-red',0x864837,{roughness:.72}),metal=materials.get('boat-metal',0x6e7775,{metalness:.75,roughness:.38}),rubber=materials.get('rubber',0x202a29,{roughness:.94}),rope=materials.get('rope',0x9e9476,{texture:'wood'});
 const hull=mesh(group,createHullGeometry(detail?64:24,detail?28:12),hullMaterial);hull.name='CurvedHull';
 // Curved structural gunwales and a second painted rubbing strake.
 for(const side of [-1,1]){const pts=[];for(let i=0;i<=40;i++){const p=hullProfile(i/40,side*1.43);p[1]+=.06;pts.push(p);}tube(structure,rim,pts,.075,detail?80:32);tube(structure,red,pts.map(p=>[p[0]*1.01,p[1]-.18,p[2]]),.045,detail?80:32);}
 cylinderBetween(structure,rim,[-1.48,1.11,2.8],[1.48,1.11,2.8],.08);
 // Separate floor boards, all at the original gameplay deck datum.
 for(let i=0;i<19;i++){const t=.14+i*.041,z=-4+t*6.8,w=Math.max(.3,hullProfile(t,1.12,true)[0]*2-.12);box(structure,[wood,lightwood,darkwood][i%3],w,.09,.258,0,.635,z);}
 const benches=[];for(const z of [-2.05,-.85,1.45]){const t=(z+4)/6.8,w=hullProfile(t,1.38,true)[0]*2-.04;const bench=box(structure,lightwood,w,.13,.41,0,1.01,z);bench.name='Bench';benches.push(z);for(const x of [-w*.39,w*.39])box(structure,darkwood,.09,.34,.33,x,.80,z);}
 if(detail){
  // Curved frames, nail heads and stern corner metal brackets.
  for(let i=1;i<8;i++){const t=i/9,pts=[];for(let j=0;j<=16;j++){const p=hullProfile(t,-1.38+j/16*2.76,true);p[1]+=.045;pts.push(p);}tube(structure,wood,pts,.045,24);}
  for(const side of [-1,1])for(let i=1;i<15;i++){const p=hullProfile(i/16,side*1.43);mesh(structure,new T.SphereGeometry(.022,6,4),metal,p[0],p[1]+.10,p[2]);}
  for(const side of [-1,1]){
   // Oars: round shafts, carved blades and a metal oarlock.
   cylinderBetween(structure,wood,[side*1.52,1.14,-2.2],[side*1.76,1.23,1.75],.045,12);
   const blade=mesh(structure,new T.SphereGeometry(1,14,8),lightwood,side*1.78,1.23,2.08);blade.scale.set(.18,.045,.64);
   const lock=mesh(structure,new T.TorusGeometry(.1,.022,6,12),metal,side*1.66,1.19,.5);lock.rotation.x=Math.PI/2;
   box(structure,metal,.16,.19,.55,side*1.38,1.08,2.35);
   const tire=mesh(structure,new T.TorusGeometry(.23,.085,8,20),rubber,side*1.6,.72,.5);tire.rotation.y=Math.PI/2;
  }
  // A true spiral rope coil and a fishing net draped over the port gunwale.
  const coil=[];for(let i=0;i<160;i++){const a=i/159*Math.PI*8,r=.13+.21*i/159;coil.push([.75+Math.cos(a)*r,.75+Math.sin(a*2)*.012,2.03+Math.sin(a)*r]);}tube(structure,rope,coil,.024,160);
  for(let i=0;i<9;i++){const z=.1+i*.12;tube(structure,rope,[[-1.12,.73,z],[-1.5,1.04,z],[-1.64,.45,z+.08]],.009,10);}
  for(let i=0;i<7;i++){const y=.48+i*.085;tube(structure,rope,[[-1.64,y,.1],[-1.69,y-.07,.55],[-1.64,y,1.07]],.009,10);}
  // Slatted gear crate and an anchor under the forward bench.
  for(const x of [-.68,-.12])for(let j=0;j<4;j++)box(structure,wood,.04,.075,.55,x,.78+j*.1,1.95);
  for(const z of [1.68,2.22])for(let j=0;j<4;j++)box(structure,darkwood,.6,.075,.04,-.4,.78+j*.1,z);
  cylinderBetween(structure,metal,[-.7,.75,-2.65],[-.7,.77,-1.95],.035);
  tube(structure,metal,[[-1.05,.76,-2.3],[-.7,.76,-2.6],[-.35,.76,-2.3]],.037,16);
 }
 batchStatic(structure);
 // Motor is separate so the propeller responds to actual throttle without rebuilding geometry.
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
 return {group,hull,hullMaterial,motor,propeller,update(time,power){propeller.rotation.z=time*(power?35:0);}};
}
