import * as T from '../vendor/three.module.js';
import {ROCKY_SIZE,ROCKY_HEIGHT} from './RockyHeight.js';
export const HOUSE_LAYOUT=Object.freeze(Array.from({length:8},(_,i)=>({x:-105+i*20,z:65+Math.sin(i*2)*12,type:i%3,width:9+(i%3),depth:8+(i%2)})));
function rocky(x,z){let u=((x/90)%1+1)%1*(ROCKY_SIZE-1),v=((z/90)%1+1)%1*(ROCKY_SIZE-1);const ix=Math.floor(u),iz=Math.floor(v),fx=u-ix,fz=v-iz;const a=ROCKY_HEIGHT[iz*ROCKY_SIZE+ix],b=ROCKY_HEIGHT[iz*ROCKY_SIZE+ix+1],c=ROCKY_HEIGHT[(iz+1)*ROCKY_SIZE+ix],d=ROCKY_HEIGHT[(iz+1)*ROCKY_SIZE+ix+1];return (a*(1-fx)*(1-fz)+b*fx*(1-fz)+c*(1-fx)*fz+d*fx*fz)/65535;}
export function terrainHeight(x,z){const r2=((x+80)/180)**2+((z-95)/70)**2;if(r2>=1)return -7;const base=-7+17*Math.sqrt(1-r2),fade=Math.max(0,Math.min(1,(base-1)/5));return base+fade*(rocky(x,z)-.5)*1.35;}
export function terrainSlope(x,z){const e=.3,hx=(terrainHeight(x+e,z)-terrainHeight(x-e,z))/(2*e),hz=(terrainHeight(x,z+e)-terrainHeight(x,z-e))/(2*e);return Math.hypot(hx,hz);}
export function excludedGround(x,z){for(const h of HOUSE_LAYOUT)if(Math.abs(x-h.x)<h.width/2+3&&Math.abs(z-h.z)<h.depth/2+4)return true;return Math.abs(z-50)<3.5||Math.abs(x)<5&&z<63||x>4&&x<22&&z>36&&z<55;}
export function plantable(x,z){return terrainHeight(x,z)>1.8&&terrainSlope(x,z)<.65&&!excludedGround(x,z);}
export function createTerrainGeometry(nx=180,nz=72){const g=new T.PlaneGeometry(360,140,nx,nz);g.rotateX(-Math.PI/2);g.translate(-80,0,95);const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,terrainHeight(x,z));uv.setXY(i,x/90,z/90);}g.computeVertexNormals();g.computeBoundingSphere();return g;}
