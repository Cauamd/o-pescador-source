import * as T from '../vendor/three.module.js';
import {mesh,box,tube,cylinderBetween,batchStatic,seeded} from './ModelUtils.js';
import {terrainHeight,createTerrainGeometry,plantable} from './Terrain.js';
import {Village} from './Village.js';import {Vegetation} from './Vegetation.js';import {createBoatModel} from './BoatModel.js';
function tree(materials,detailed){const g=new T.Group(),wood=materials.get('tree-bark',0x8d8066,{texture:'wood'}),leaf=materials.get('tree-leaves',0x4e6044,{roughness:.95});const profile=[[.7,0],[.46,1.3],[.35,3.6],[.16,6],[.07,7.6]].map(p=>new T.Vector2(...p));mesh(g,new T.LatheGeometry(profile,detailed?14:7),wood);const rng=seeded(42);for(let i=0;i<(detailed?10:4);i++){const a=i*2.3999,rad=1.5+rng()*.8,y=4.3+rng()*3.4,x=Math.sin(a)*rad,z=Math.cos(a)*rad;if(detailed)cylinderBetween(g,wood,[0,y-1.9,0],[x,y,z],.10,7);const canopy=mesh(g,new T.SphereGeometry(1,detailed?12:7,detailed?8:5),leaf,x,y,z);canopy.scale.set(1.5+rng()*.8,1.3+rng()*.6,1.7+rng()*.7);}return batchStatic(g);}
function rockGeometry(seed){const g=new T.SphereGeometry(1,24,16),p=g.attributes.position,random=seeded(seed),phase=random()*9;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=1+.12*Math.sin(x*7+phase)*Math.cos(z*5-y*4)+.05*Math.sin(y*13+x*8);p.setXYZ(i,x*r,y*r,z*r);}g.computeVertexNormals();return g;}
function crate(parent,wood,x,y,z){for(let k=0;k<4;k++){for(const side of [-1,1]){box(parent,wood,.04,.15,1, x+side*.5,y+.1+k*.21,z);box(parent,wood,1,.15,.04,x,y+.1+k*.21,z+side*.5);}}for(const sx of [-.45,.45])for(const sz of [-.45,.45])box(parent,wood,.09,.9,.09,x+sx,y+.4,z+sz);}
function makePort(materials){const root=new T.Group(),wood=materials.get('pier-wood',0xc9c1aa,{texture:'wood'}),metal=materials.get('boat-metal',0x6e7775,{metalness:.75,roughness:.38}),rope=materials.get('rope',0x9e9476,{texture:'wood'}),stone=materials.get('masonry'),white=materials.get('canvas',0xd3c5a0,{roughness:.98}),red=materials.get('canvas-stripe',0x9d6149,{roughness:.95});
 for(let i=0;i<53;i++)box(root,wood,5.9,.18,.49,0,1.12,9.2+i*.52);
 for(const x of [-2.5,2.5]){box(root,wood,.35,.5,28,x,.75,23);for(let z=10;z<38;z+=5){mesh(root,new T.CylinderGeometry(.19,.25,4.3,14),wood,x,.15,z);for(let k=0;k<3;k++){const hoop=mesh(root,new T.TorusGeometry(.22,.026,6,16),rope,x,1.45+k*.065,z);hoop.rotation.x=Math.PI/2;}cylinderBetween(root,wood,[x,-.8,z],[x,.8,z+4],.10);}}
 tube(root,rope,[[-2.5,1.55,10],[-2.5,1.12,12.5],[-2.5,1.55,15],[-2.5,1.1,17.5],[-2.5,1.55,20]],.035,60);
 // Fish market, fully on the existing blocked shore side of the dock.
 const x=13,z=47,y=terrainHeight(x,z);box(root,wood,5,.2,2.2,x,y+1.2,z);
 for(const dx of [-2.4,2.4])for(const dz of [-1,1])box(root,wood,.13,3,.13,x+dx,y+1.5,z+dz);
 for(let i=0;i<12;i++){const strip=box(root,i%2?white:red,.44,.055,3.2,x-2.6+i*.46,y+3.1,z);strip.rotation.x=-.10;}
 for(let i=0;i<5;i++)crate(root,wood,x-2+i,y+.2,z+.9);
 const fishMat=materials.get('market-fish',0x8daba9,{metalness:.3,roughness:.48});for(let i=0;i<9;i++){const fish=mesh(root,new T.SphereGeometry(1,12,6),fishMat,x-2+i*.48,y+1.38,z-.2);fish.scale.set(.15,.09,.38);fish.rotation.y=i*.8;}
 for(let i=0;i<12;i++){const px=-36+i*3.3,pz=50,py=terrainHeight(px,pz);box(root,stone,3.1,.13,2.5,px,py+.07,pz);}
 for(let i=0;i<12;i++){const px=-146+i*3,pz=75,py=terrainHeight(px,pz);box(root,wood,.13,1.2,.13,px,py+.5,pz);for(const h of [.3,.85])box(root,wood,3,.1,.1,px+1.5,py+h,pz);}
 for(let i=0;i<6;i++)crate(root,wood,-3+i*1.1,1.3,32+(i%2)*1.2);
 batchStatic(root);root.name='WorkingHarbor';return root;
}
export class CoastModel {
 constructor(scene,materials){this.group=new T.Group();this.group.name='CoastV2';scene.add(this.group);this.materials=materials;
 const terrainMat=materials.get('rocky-ground',0xffffff,{texture:'rocky-terrain',roughness:1});this.land=mesh(this.group,createTerrainGeometry(),terrainMat);this.land.name='RockyTerrain';this.land.castShadow=false;
 this.village=new Village(this.group,materials);this.vegetation=new Vegetation(this.group,materials);this.group.add(makePort(materials));
 const random=seeded(731),object=new T.Object3D();this.rocks=[];
 for(let v=0;v<3;v++){const rmat=materials.get('coastal-rock',0xb5b6a5,{texture:'stone'}),rocks=new T.InstancedMesh(rockGeometry(34+v),rmat,28);for(let i=0;i<28;i++){const a=Math.PI*1.05+random()*Math.PI*.95,px=-80+Math.cos(a)*164,pz=95+Math.sin(a)*62,py=terrainHeight(px,pz);object.position.set(px,py-.8,pz);object.rotation.set(random()*.5,random()*6.28,random()*.3);object.scale.set(2+random()*4,1.5+random()*3,2+random()*3);object.updateMatrix();rocks.setMatrixAt(i,object.matrix);}rocks.castShadow=rocks.receiveShadow=true;rocks.computeBoundingSphere();this.group.add(rocks);this.rocks.push(rocks);}
 // Trees use two reusable model levels, with seeded placement only on safe ground.
 const trees=[tree(materials,true),tree(materials,false)];this.trees=[];let attempts=0;while(this.trees.length<26&&attempts++<500){const x=-235+random()*300,z=76+random()*65;if(!plantable(x,z))continue;const lod=new T.LOD();lod.addLevel(trees[0].clone(true),0);lod.addLevel(trees[1].clone(true),120,.15);lod.position.set(x,terrainHeight(x,z),z);lod.scale.setScalar(.6+random()*.45);lod.rotation.y=random()*6.28;this.group.add(lod);this.trees.push(lod);}
 // Shared barrels, body and hoops separately instanced.
 const barrelGeo=new T.LatheGeometry([[.38,0],[.46,.15],[.51,.6],[.46,1.05],[.38,1.2]].map(p=>new T.Vector2(...p)),18);
 const barrels=new T.InstancedMesh(barrelGeo,materials.get('pier-wood'),12),hoops=new T.InstancedMesh(new T.TorusGeometry(.49,.025,6,20),materials.get('boat-metal'),24);
 for(let i=0;i<12;i++){const x=-40+i*5.5,z=55+(i%2)*4,y=terrainHeight(x,z);object.position.set(x,y,z);object.scale.setScalar(.9);object.rotation.set(0,i,0);object.updateMatrix();barrels.setMatrixAt(i,object.matrix);for(let k=0;k<2;k++){object.position.y=y+.22+k*.65;object.rotation.set(Math.PI/2,0,0);object.updateMatrix();hoops.setMatrixAt(i*2+k,object.matrix);}}
 for(const im of [barrels,hoops]){im.castShadow=im.receiveShadow=true;im.computeBoundingSphere();this.group.add(im);}
 this.moored=[];for(const [x,z,a] of [[-10,24,.3],[10,28,-.4]]){const lod=new T.LOD();lod.addLevel(createBoatModel(materials,{detail:true}).group,0);lod.addLevel(createBoatModel(materials,{detail:false}).group,90,.15);lod.position.set(x,.15,z);lod.rotation.y=a;this.group.add(lod);this.moored.push(lod);}
 // Distant islands retain their original offshore region; silhouettes gain tessellation.
 for(let i=0;i<8;i++){const island=mesh(this.group,rockGeometry(100+i),terrainMat,-700+i*200,-8,-700-random()*150);island.scale.set(45+random()*70,20+random()*45,40);island.castShadow=false;}
 }
 setQuality(q){this.vegetation.setQuality(q);this.village.setQuality(q);for(const t of this.trees)t.levels[1].distance=q==='Baixa'?70:q==='Alta'?170:120;for(const b of this.moored)b.levels[1].distance=q==='Baixa'?45:90;}
 update(dt,time,camera){this.vegetation.update(dt,time,camera);}
 dispose(){this.vegetation.dispose();this.group.traverse(o=>{if(o.isInstancedMesh)o.dispose();});}
}
