import * as T from '../vendor/three.module.js';
import {mesh,box,tube,cylinderBetween,batchStatic,seeded} from './ModelUtils.js';
import {HOUSE_LAYOUT,terrainHeight} from './Terrain.js';
function roofGeometry(w,d,wallHeight,rise,detail){const pos=[],uv=[],idx=[];const add=(a,b,c,u,v,q)=>{const n=pos.length/3;pos.push(...a,...b,...c);uv.push(...u,...v,...q);idx.push(n,n+1,n+2);};
 for(const side of [-1,1]){const slope=(x)=>wallHeight+rise*(1-Math.abs(x)/(w/2+.5));if(!detail){const a=[0,wallHeight+rise,-d/2-.5],b=[side*(w/2+.5),wallHeight,-d/2-.5],c=[0,wallHeight+rise,d/2+.5],e=[side*(w/2+.5),wallHeight,d/2+.5];add(a,b,c,[0,0],[1,0],[0,1]);add(b,e,c,[1,0],[1,1],[0,1]);continue;}
 const rows=Math.ceil((w/2+.5)/.55),columns=Math.ceil((d+1)/.42);for(let i=0;i<rows;i++)for(let j=0;j<columns;j++){for(let k=0;k<5;k++){const x1=side*(i/rows*(w/2+.5)),x2=side*((i+1)/rows*(w/2+.5)+.035),z1=-d/2-.5+(j+k/5)/columns*(d+1),z2=-d/2-.5+(j+(k+1)/5)/columns*(d+1);const h1=Math.sin(k/5*Math.PI)*.11,h2=Math.sin((k+1)/5*Math.PI)*.11;const a=[x1,slope(x1)+h1+.08,z1],b=[x2,slope(x2)+h1+.08,z1],c=[x1,slope(x1)+h2+.08,z2],e=[x2,slope(x2)+h2+.08,z2];add(a,b,c,[0,k/5],[1,k/5],[0,(k+1)/5]);add(b,e,c,[1,k/5],[1,(k+1)/5],[0,(k+1)/5]);}}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
export function createHouse(materials,type=0,detail=true){const g=new T.Group(),w=9+type,d=8+(type%2),h=4.3+type*.7;
 const plaster=materials.get('plaster-'+type,[0xfff4db,0xe7d8bd,0xc6d2ce][type],{texture:'plaster'}),stone=materials.get('masonry',0xe1ddd0,{texture:'stone'}),wood=materials.get('house-wood',0xd9c5a4,{texture:'wood'}),paint=materials.get('shutters-'+type,[0x426f72,0x806146,0x45665c][type],{roughness:.82}),roof=materials.get('roof-'+type,[0xe1b899,0xb5ada3,0xcb9d83][type],{texture:'tile',side:T.DoubleSide}),glass=materials.get('window-glass',0x233e47,{metalness:.15,roughness:.22});
 box(g,stone,w+.4,.9,d+.4,0,.15,0);box(g,plaster,w,h,d,0,h/2+.4,0);
 // Gable end triangles, with actual pitched ridge and overhanging roof.
 const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(0,2);shape.closePath();const gable=new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false});mesh(g,gable,plaster,0,h+.4,-d/2);
 mesh(g,roofGeometry(w,d,h+.4,2,detail),roof);
 if(detail){
  box(g,wood,1.3,2.4,.12,0,1.62,-d/2-.08);
  for(const dx of [-.8,.8])box(g,stone,.21,2.7,.3,dx,1.67,-d/2-.1);box(g,stone,1.8,.25,.3,0,3.05,-d/2-.1);
  for(const x of [-w*.29,w*.29]){box(g,glass,1.25,1.4,.12,x,2.8,-d/2-.08);for(const dx of [-.72,.72])box(g,wood,.13,1.64,.2,x+dx,2.8,-d/2-.15);for(const y of [1.98,3.62])box(g,wood,1.56,.13,.2,x,y,-d/2-.15);box(g,wood,.07,1.5,.17,x,2.8,-d/2-.2);box(g,wood,1.42,.07,.17,x,2.8,-d/2-.2);
   for(const side of [-1,1]){const shutter=new T.Group();g.add(shutter);shutter.position.set(x+side*1.04,2.8,-d/2-.15);shutter.rotation.y=side*.18;for(let j=0;j<9;j++)box(shutter,paint,.54,.13,.065,0,-.66+j*.165,0);for(const a of [-.28,.28])box(shutter,paint,.06,1.53,.12,a,0,0);}}
  box(g,stone,1.1,2.8,1.05,w*.25,h+1.5,d*.22);box(g,stone,1.4,.22,1.34,w*.25,h+3,d*.22);box(g,glass,.85,.04,.8,w*.25,h+3.12,d*.22);
  for(let i=0;i<4;i++)box(g,stone,2.5,.2+i*.16,.56,0,.1+i*.08,-d/2-2+i*.53);
  if(type!==1){box(g,wood,w*.66,.2,2.5,0,.63,-d/2-1.3);for(const x of [-w*.32,w*.32])for(const z of [-d/2-.3,-d/2-2.5])box(g,wood,.13,1.2,.13,x,1.25,z);box(g,wood,w*.66,.12,.12,0,1.8,-d/2-2.5);for(let i=0;i<11;i++)box(g,wood,.06,.9,.06,-w*.31+i*w*.062,1.18,-d/2-2.5);}
  if(type===2)for(let i=0;i<8;i++)box(g,stone,1.6,.25+i*.35,.65,w/2+1,.2+i*.175,-d/2+i*.62);
 }
 g.updateMatrixWorld(true);
 // Continuous plaster texel density across wall boxes and extruded gables.
 const point=new T.Vector3();g.traverse(o=>{if(!o.isMesh||o.material!==plaster)return;const p=o.geometry.attributes.position,n=o.geometry.attributes.normal,uv=o.geometry.attributes.uv;for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);uv.setXY(i,(Math.abs(n.getX(i))>.5?point.z:point.x)/2.5,point.y/2.5);}uv.needsUpdate=true;});
 batchStatic(g);g.name='FisherHouse-'+type;return g;
}
export class Village {
 constructor(parent,materials){this.group=new T.Group();this.group.name='FishingVillage';parent.add(this.group);this.houses=[];
 const templates=[0,1,2].map(t=>[createHouse(materials,t,true),createHouse(materials,t,false)]);
 HOUSE_LAYOUT.forEach((h,i)=>{const lod=new T.LOD();const near=templates[h.type][0].clone(true),far=templates[h.type][1].clone(true);lod.addLevel(near,0);lod.addLevel(far,120,.12);const heights=[terrainHeight(h.x,h.z),terrainHeight(h.x-5,h.z-4),terrainHeight(h.x+5,h.z+4)];lod.position.set(h.x,Math.max(...heights)+.1,h.z);if(i===5){let homeMaterial;for(const level of [near,far])level.traverse(o=>{if(o.isMesh&&o.material.name==='roof-2'){if(!homeMaterial)homeMaterial=o.material.clone();o.material=homeMaterial;this.homeRoof=o;}});}this.group.add(lod);this.houses.push(lod);const stone=materials.get('masonry');box(this.group,stone,h.width+.8,3,h.depth+.8,h.x,lod.position.y-1.6,h.z);});

 }
 setQuality(q){const d=q==='Baixa'?75:q==='Alta'?180:120;for(const h of this.houses)h.levels[1].distance=d;}
}
