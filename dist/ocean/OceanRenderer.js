import * as T from '../vendor/three.module.js';
import {oceanPhysics} from './OceanPhysics.js';
import {waterVertex,waterFragment} from './WaterShader.js';
export const OCEAN_QUALITY=Object.freeze({
  Baixa:{segments:96,near:48,middle:16,far:12,reflection:256,interval:1/10,micro:2,ripples:12},
  Média:{segments:192,near:96,middle:32,far:20,reflection:512,interval:1/20,micro:3,ripples:24},
  Alta:{segments:256,near:128,middle:48,far:24,reflection:1024,interval:1/30,micro:4,ripples:32}
});
/** A single stitched concentric mesh: dense local triangles, coarse far rings, no overlapping tiles. */
export function createOceanGeometry(preset){
  const radii=[];
  for(let i=1;i<=preset.near;i++)radii.push(i/preset.near*64);
  for(let i=1;i<=preset.middle;i++)radii.push(64+Math.pow(i/preset.middle,1.4)*192);
  for(let i=1;i<=preset.far;i++)radii.push(256+Math.pow(i/preset.far,1.6)*1644);
  const n=preset.segments,positions=new Float32Array((1+n*radii.length)*3),indices=[];
  radii.forEach((r,j)=>{for(let i=0;i<n;i++){const a=i/n*Math.PI*2,k=(1+j*n+i)*3;positions[k]=Math.cos(a)*r;positions[k+2]=Math.sin(a)*r;}});
  for(let i=0;i<n;i++)indices.push(0,1+(i+1)%n,1+i);
  for(let j=1;j<radii.length;j++)for(let i=0;i<n;i++){const a=1+(j-1)*n+i,b=1+(j-1)*n+(i+1)%n,c=1+j*n+i,d=1+j*n+(i+1)%n;indices.push(a,b,c,b,d,c);}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setIndex(indices);
  geometry.computeBoundingSphere();geometry.boundingSphere.radius+=4;return geometry;
}
export class OceanRenderer {
  constructor(scene,renderer,physics=oceanPhysics){
    this.scene=scene;this.renderer=renderer;this.physics=physics;this.disposed=false;this.time=0;this.reflectClock=Infinity;this.emitClock=0;this.nextRipple=0;
    this.group=new T.Group();this.group.name='OceanRenderer';scene.add(this.group);
    this.ripples=Array.from({length:32},()=>new T.Vector4(0,0,-100,1));
    this.rippleMotion=Array.from({length:32},()=>new T.Vector4(0,1,0,0));
    this.uniforms={uWaves:{value:physics.waves},uMotion:{value:physics.motion},uIntensity:{value:physics.intensity},uTime:{value:0},uCenter:{value:new T.Vector2()},
      uBoat:{value:new T.Vector3()},uForward:{value:new T.Vector2(0,-1)},uSpeed:{value:0},uEngine:{value:0},
      uLight:{value:1},uStorm:{value:0},uSun:{value:new T.Vector3(-80,55,-120).normalize()},uFog:{value:new T.Color()},
      uReflection:{value:null},uReflectionMatrix:{value:new T.Matrix4()},uHasReflection:{value:0},uRipples:{value:this.ripples},uRippleMotion:{value:this.rippleMotion}};
    this.material=new T.ShaderMaterial({uniforms:this.uniforms,vertexShader:waterVertex,fragmentShader:waterFragment,depthWrite:true,transparent:false,toneMapped:true});
    this.material.name='GerstnerWater';this.mesh=new T.Mesh(new T.BufferGeometry(),this.material);this.mesh.frustumCulled=false;this.group.add(this.mesh);
    this.reflectionCamera=new T.PerspectiveCamera();this.look=new T.Vector3();this.direction=new T.Vector3();this.up=new T.Vector3();this.plane=new T.Plane();this.clip=new T.Vector4();this.q=new T.Vector4();this.viewport=new T.Vector4();this.scissor=new T.Vector4();this.clearColor=new T.Color();
    this.bias=new T.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);
    this.stats={mainCalls:0,mainTriangles:0,reflectionCalls:0,reflectionTriangles:0,reflectionCpuMs:0};
    this.setQuality('Média');
  }
  setQuality(name){
    if(this.quality===name)return;const preset=OCEAN_QUALITY[name]||OCEAN_QUALITY.Média;
    this.quality=name;this.preset=preset;this.mesh.geometry.dispose();this.mesh.geometry=createOceanGeometry(preset);
    this.material.defines={MICRO_LAYERS:preset.micro,RIPPLE_COUNT:preset.ripples};this.material.needsUpdate=true;
    this.target?.dispose();this.target=new T.WebGLRenderTarget(preset.reflection,preset.reflection,{type:this.renderer.extensions?.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType,depthBuffer:true,stencilBuffer:false,minFilter:T.LinearFilter,magFilter:T.LinearFilter,generateMipmaps:false});
    this.target.texture.name='OceanPlanarReflection';this.target.texture.colorSpace=T.LinearSRGBColorSpace;
    this.uniforms.uReflection.value=this.target.texture;this.uniforms.uHasReflection.value=0;this.reflectClock=Infinity;this.nextRipple=0;
    for(const r of this.ripples)r.z=-100;
  }
  ripple(x,z,size=1,power=.8,engine=0,dx=0,dz=1){
    const i=this.nextRipple++%this.preset.ripples;
    this.ripples[i].set(x,z,this.time,size);this.rippleMotion[i].set(dx,dz,power,engine);
  }
  update(dt,time,boat,light,storm,sun,fog){
    this.time=time;this.physics.setStorm(storm);const u=this.uniforms;
    u.uTime.value=time;u.uIntensity.value=this.physics.intensity;
    // Waves are evaluated in world space. Continuous recentering only changes sampling density.
    u.uCenter.value.set(boat.x,boat.z);u.uBoat.value.set(boat.x,0,boat.z);
    u.uForward.value.set(-Math.sin(boat.angle),-Math.cos(boat.angle));u.uSpeed.value=Math.abs(boat.speed);
    u.uEngine.value=boat.enginePower||0;u.uLight.value=light;u.uStorm.value=storm;u.uSun.value.copy(sun);u.uFog.value.copy(fog);
    this.reflectClock+=dt;this.emitClock+=dt;
    if(Math.abs(boat.speed)>.2&&this.emitClock>.19){
      const sign=Math.sign(boat.speed),dx=u.uForward.value.x*sign,dz=u.uForward.value.y*sign;
      this.ripple(boat.x-dx*3,boat.z-dz*3,.5,Math.min(Math.abs(boat.speed)/7,1.5),u.uEngine.value,dx,dz);this.emitClock=0;
    }
  }
  /** Planar environment pass at mean sea level. Dynamic waves distort its projective lookup. */
  renderReflection(camera,sky){
    if(this.disposed||this.reflectClock<this.preset.interval||camera.position.y<=.3)return;
    this.reflectClock=0;const r=this.renderer,c=this.reflectionCamera,u=this.uniforms;
    camera.updateMatrixWorld();camera.getWorldDirection(this.direction);this.look.copy(camera.position).add(this.direction);this.look.y*=-1;
    c.position.copy(camera.position);c.position.y*=-1;
    // Reflect the real camera up vector, including camera orientation.
    this.up.set(0,1,0).applyQuaternion(camera.quaternion);this.up.y*=-1;c.up.copy(this.up);c.lookAt(this.look);
    c.near=camera.near;c.far=camera.far;c.projectionMatrix.copy(camera.projectionMatrix);c.updateMatrixWorld();c.matrixWorldInverse.copy(c.matrixWorld).invert();
    u.uReflectionMatrix.value.copy(this.bias).multiply(c.projectionMatrix).multiply(c.matrixWorldInverse);
    // Oblique near plane clips objects below mean water, eliminating reflected underwater geometry.
    this.plane.setComponents(0,1,0,-.04).applyMatrix4(c.matrixWorldInverse);
    this.clip.set(this.plane.normal.x,this.plane.normal.y,this.plane.normal.z,this.plane.constant);
    const e=c.projectionMatrix.elements;
    this.q.set((Math.sign(this.clip.x)+e[8])/e[0],(Math.sign(this.clip.y)+e[9])/e[5],-1,(1+e[10])/e[14]);
    this.clip.multiplyScalar(2/this.clip.dot(this.q));e[2]=this.clip.x;e[6]=this.clip.y;e[10]=this.clip.z+1-.0001;e[14]=this.clip.w;
    c.projectionMatrixInverse.copy(c.projectionMatrix).invert();
    const oldTarget=r.getRenderTarget(),oldTone=r.toneMapping,oldXR=r.xr.enabled,oldShadow=r.shadowMap.autoUpdate,oldAuto=r.autoClear,oldScissor=r.getScissorTest();
    r.getViewport(this.viewport);r.getScissor(this.scissor);const oldAlpha=r.getClearAlpha();r.getClearColor(this.clearColor);
    const sx=sky.position.x,sy=sky.position.y,sz=sky.position.z;const wasVisible=this.group.visible;
    const start=performance.now();
    try{
      this.group.visible=false;sky.position.copy(c.position);r.xr.enabled=false;r.shadowMap.autoUpdate=false;r.autoClear=true;r.toneMapping=T.NoToneMapping;
      r.setRenderTarget(this.target);r.setScissorTest(false);r.setClearColor(u.uFog.value,1);r.clear();r.render(this.scene,c);
      u.uHasReflection.value=1;this.stats.reflectionCalls=r.info.render.calls;this.stats.reflectionTriangles=r.info.render.triangles;
    }finally{
      this.group.visible=wasVisible;sky.position.set(sx,sy,sz);r.xr.enabled=oldXR;r.shadowMap.autoUpdate=oldShadow;r.toneMapping=oldTone;r.autoClear=oldAuto;
      r.setRenderTarget(oldTarget);r.setViewport(this.viewport);r.setScissor(this.scissor);r.setScissorTest(oldScissor);r.setClearColor(this.clearColor,oldAlpha);
      this.stats.reflectionCpuMs=performance.now()-start;
    }
  }
  resize(){this.reflectClock=Infinity;}
  dispose(){if(this.disposed)return;this.disposed=true;this.scene.remove(this.group);this.mesh.geometry.dispose();this.material.dispose();this.target.dispose();}
}
