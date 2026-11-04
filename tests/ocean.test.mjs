import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {OceanPhysics,BoatFloat,createSurfaceSample,WAVE_CONFIG} from '../dist/ocean/OceanPhysics.js';
import {createOceanGeometry,OCEAN_QUALITY,OceanRenderer} from '../dist/ocean/OceanRenderer.js';
import {waterVertex,waterFragment} from '../dist/ocean/WaterShader.js';
const near=(a,b,eps=1e-5)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);
test('six Gerstner components share packed Float32 parameters and stay invertible',()=>{
  const p=new OceanPhysics();assert.equal(WAVE_CONFIG.length,6);p.setStorm(1);
  for(let t=0;t<40;t+=3.7)for(let x=-150;x<150;x+=29){const a=p.evaluate(x,x*.7,t);assert.ok(a.dx.x*a.dz.z-a.dz.x*a.dx.z>.25);const b=p.sampleOceanSurface(a.x,a.z,t);near(b.height,a.height);assert.ok(b.residual<1e-5);near(Math.hypot(b.normal.x,b.normal.y,b.normal.z),1);assert.ok(b.normal.y>0);}
});
test('analytic normal agrees with finite differences of world-space height',()=>{
  const p=new OceanPhysics();p.setStorm(.8);for(let i=0;i<20;i++){const x=i*2.27,z=-i*3.1,t=4.3,e=.0001,s=p.sampleOceanSurface(x,z,t);const hx=(p.sampleOceanSurface(x+e,z,t).height-p.sampleOceanSurface(x-e,z,t).height)/(2*e),hz=(p.sampleOceanSurface(x,z+e,t).height-p.sampleOceanSurface(x,z-e,t).height)/(2*e),len=Math.hypot(hx,1,hz);near(s.normal.x,-hx/len,1e-4);near(s.normal.y,1/len,1e-4);near(s.normal.z,-hz/len,1e-4);}
});
test('material velocity matches time derivative and samples can reuse storage',()=>{
 const p=new OceanPhysics(),out=createSurfaceSample(),e=.00001,a=p.evaluate(13,-28,8),before=p.evaluate(13,-28,8-e),after=p.evaluate(13,-28,8+e);
 near(a.velocity.x,(after.x-before.x)/(2*e));near(a.velocity.y,(after.height-before.height)/(2*e));near(a.velocity.z,(after.z-before.z)/(2*e));assert.equal(p.sampleOceanSurface(2,3,8,out),out);
});
test('wind and intensity are configurable without changing wave identities',()=>{const p=new OceanPhysics(),waves=p.waves,motion=p.motion;p.configure({windSpeed:12,windDirection:.4,intensity:0});assert.equal(p.waves,waves);assert.equal(p.motion,motion);const a=p.sampleOceanSurface(10,-11,20);near(a.height,0);near(a.normal.y,1);p.setStorm(1);near(p.sampleOceanSurface(10,-11,20).height,0);});
test('five-point flotation preserves heading/XZ and sampled deck clearance',()=>{
 const p=new OceanPhysics();p.setStorm(1);const float=new BoatFloat(p),yaw=.83;const matrix=new T.Matrix4(),rot=new T.Euler(0,0,0,'YXZ'),v=new T.Vector3();
 for(let i=0;i<600;i++){const x=5+i*.03,z=-30-i*.06,t=i/60,pose=float.update(x,z,yaw,t,1/60);assert.ok(Number.isFinite(pose.y));assert.ok(Math.abs(pose.pitch)<=.28&&Math.abs(pose.roll)<=.28);rot.set(pose.pitch,yaw,pose.roll,'YXZ');matrix.makeRotationFromEuler(rot);
 for(let n=0;n<5;n++){const [lx,lz]=float.offsets[n];v.set(lx,.68,lz).applyMatrix4(matrix);assert.ok(pose.y+v.y>=float.samples[n].height+.17999);}}
});
test('LOD is a single manifold disk, upward-facing with no interior cracks',()=>{
 for(const config of Object.values(OCEAN_QUALITY)){const g=createOceanGeometry(config),p=g.attributes.position,idx=g.index.array,edges=new Map();for(let i=0;i<idx.length;i+=3){const [a,b,c]=idx.slice(i,i+3);const crossY=(p.getZ(b)-p.getZ(a))*(p.getX(c)-p.getX(a))-(p.getX(b)-p.getX(a))*(p.getZ(c)-p.getZ(a));assert.ok(crossY>0);for(const [u,v] of [[a,b],[b,c],[c,a]]){const key=u<v?u+','+v:v+','+u;edges.set(key,(edges.get(key)||0)+1);}}
 assert.equal([...edges.values()].filter(n=>n===1).length,config.segments);assert.ok([...edges.values()].every(n=>n===1||n===2));g.dispose();}
});
test('shader color pipeline, world coordinates and wave count are explicit',()=>{assert.ok(waterVertex.includes('position.xz+uCenter'));assert.ok(waterVertex.includes('uWaves[6]'));assert.ok(waterFragment.includes('#include <tonemapping_fragment>'));assert.ok(waterFragment.includes('#include <colorspace_fragment>'));});
test('ocean quality change and disposal free GPU resources; repeated preset does not rebuild',()=>{
 const scene=new T.Scene(),o=new OceanRenderer(scene,{});const geometry=o.mesh.geometry;let disposed=0;geometry.addEventListener('dispose',()=>disposed++);o.setQuality('Média');assert.equal(o.mesh.geometry,geometry);o.setQuality('Baixa');assert.equal(disposed,1);assert.equal(o.target.width,256);o.dispose();o.dispose();assert.equal(scene.children.length,0);
});
test('reflection clips underwater objects and restores renderer state even on failure',()=>{
 const scene=new T.Scene(),sky=new T.Object3D();sky.position.set(5,8,23);scene.add(sky);const viewport=new T.Vector4(1,2,800,600),scissor=viewport.clone(),color=new T.Color(.2,.3,.4),originalTarget={name:'original'};
 let target=originalTarget,alpha=.7,scissorTest=true,shouldThrow=false;
 const renderer={xr:{enabled:true},shadowMap:{autoUpdate:true},autoClear:false,toneMapping:T.ACESFilmicToneMapping,info:{render:{calls:5,triangles:50}},getRenderTarget:()=>target,setRenderTarget:t=>target=t,getViewport:v=>v.copy(viewport),setViewport:v=>viewport.copy(v),getScissor:v=>v.copy(scissor),setScissor:v=>scissor.copy(v),getScissorTest:()=>scissorTest,setScissorTest:v=>scissorTest=v,getClearAlpha:()=>alpha,getClearColor:v=>v.copy(color),setClearColor:(v,a)=>{color.copy(v);alpha=a;},clear(){},render(scene,camera){
   assert.equal(o.group.visible,false);assert.equal(this.toneMapping,T.NoToneMapping);
   const above=new T.Vector4(0,1,0,1).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix),below=new T.Vector4(0,-1,0,1).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
   assert.ok(above.z>=-above.w);assert.ok(below.z< -below.w);
   if(shouldThrow)throw new Error('synthetic render failure');
 }};
 const o=new OceanRenderer(scene,renderer),camera=new T.PerspectiveCamera(53,4/3,.1,3000);camera.position.set(0,8,23);camera.lookAt(0,0,0);
 o.renderReflection(camera,sky);assert.equal(o.uniforms.uHasReflection.value,1);assert.equal(target,originalTarget);assert.equal(o.group.visible,true);assert.equal(renderer.xr.enabled,true);assert.equal(renderer.shadowMap.autoUpdate,true);assert.equal(renderer.autoClear,false);assert.equal(renderer.toneMapping,T.ACESFilmicToneMapping);assert.equal(alpha,.7);assert.equal(scissorTest,true);assert.deepEqual(sky.position.toArray(),[5,8,23]);
 shouldThrow=true;o.resize();assert.throws(()=>o.renderReflection(camera,sky),/synthetic/);assert.equal(target,originalTarget);assert.equal(o.group.visible,true);assert.equal(renderer.xr.enabled,true);o.dispose();
});
