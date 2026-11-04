import {atmosphereGLSL} from './AtmosphereShader.js';
export const waveGLSL=`
uniform vec4 uWaves[6];uniform vec4 uMotion[6];uniform float uTime;uniform float uIntensity;
void gerstner(vec2 q,float distanceToCenter,out vec3 p,out vec3 tx,out vec3 tz,out float compression){
p=vec3(q.x,0.0,q.y);tx=vec3(1,0,0);tz=vec3(0,0,1);
for(int i=0;i<6;i++){
vec4 w=uWaves[i];vec4 m=uMotion[i];
// Short waves vanish smoothly before the sparse outer LOD. All six are full strength at the boat.
float end=max(110.0,18.0*6.28318530718/w.z);float lod=1.0-smoothstep(end*.55,end,distanceToCenter);
float a=w.w*uIntensity*lod;float f=w.z*dot(w.xy,q)-m.x*uTime+m.z;
float sn=sin(f),cs=cos(f),qa=m.y*a,der=qa*w.z*sn;
p+=vec3(qa*w.x*cs,a*sn,qa*w.y*cs);
tx+=vec3(-der*w.x*w.x,a*w.z*w.x*cs,-der*w.x*w.y);
tz+=vec3(-der*w.x*w.y,a*w.z*w.y*cs,-der*w.y*w.y);
}compression=1.0-(tx.x*tz.z-tz.x*tx.z);
}`;
export const waterVertex=`
uniform vec2 uCenter;varying vec3 vWorld;varying vec2 vBase;
${waveGLSL}
void main(){vBase=position.xz+uCenter;vec3 p,tx,tz;float compression;
gerstner(vBase,length(position.xz),p,tx,tz,compression);vWorld=p;
gl_Position=projectionMatrix*viewMatrix*vec4(p,1.0);}
`;
export const waterFragment=`
uniform vec2 uCenter;uniform vec3 uBoat;uniform vec2 uForward;uniform float uSpeed;uniform float uEngine;
uniform float uLight;uniform float uStorm;uniform vec3 uSun;uniform vec3 uFog;
uniform sampler2D uReflection;uniform mat4 uReflectionMatrix;uniform float uHasReflection;
uniform vec4 uRipples[RIPPLE_COUNT];uniform vec4 uRippleMotion[RIPPLE_COUNT];
varying vec3 vWorld;varying vec2 vBase;
${waveGLSL}
${atmosphereGLSL}
float hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash2(i),hash2(i+vec2(1,0)),f.x),mix(hash2(i+vec2(0,1)),hash2(i+vec2(1,1)),f.x),f.y);}
vec2 noiseGradient(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f),du=6.0*f*(1.0-f);float a=hash2(i),b=hash2(i+vec2(1,0)),c=hash2(i+vec2(0,1)),d=hash2(i+vec2(1,1));return vec2((b-a+(a-b-c+d)*u.y)*du.x,(c-a+(a-b-c+d)*u.x)*du.y);}
// Analytic bathymetry aligned to the existing elliptical coastline; no screen-depth approximation.
float waterDepth(vec2 p){float coast=length((p-vec2(-80,95))/vec2(180,70));return clamp((coast-.9113)*40.0,0.25,180.0);}
void main(){
vec3 p,tx,tz;float compression;float centerDistance=length(vBase-uCenter);
gerstner(vBase,centerDistance,p,tx,tz,compression);vec3 n=normalize(cross(tz,tx));
float cameraDistance=length(cameraPosition-vWorld);float microFade=1.0-smoothstep(70.0,320.0,cameraDistance);
vec2 micro=vec2(0);if(microFade>0.0){for(int i=0;i<MICRO_LAYERS;i++){float f=1.7*pow(1.93,float(i));float a=float(i)*2.39996;mat2 rotation=mat2(cos(a),-sin(a),sin(a),cos(a));vec2 detail=rotation*vBase*f+vec2(uTime*.43,uTime*.21)+float(i)*17.13;micro+=rotation*noiseGradient(detail)*(.045/pow(1.5,float(i)));}}
n=normalize(n+vec3(micro.x,0,micro.y)*microFade*(.7+uStorm*.6));
float trailFoam=0.0;
if(centerDistance<115.0){for(int i=0;i<RIPPLE_COUNT;i++){
vec4 stamp=uRipples[i];float age=uTime-stamp.z;if(age<0.0||age>7.0)continue;
vec2 delta=vWorld.xz-stamp.xy;float radius=stamp.w+age*1.1;float dist=length(delta);if(dist>radius+9.0)continue;
vec4 motion=uRippleMotion[i];float fade=pow(1.0-age/7.0,2.0);
float ring=exp(-pow((dist-radius)*2.1,2.0));
trailFoam+=ring*motion.z*fade*.28;
float wakeAlong=dot(delta,motion.xy),wakeSide=dot(delta,vec2(motion.y,-motion.x));
float spread=.8+age*.7;float churn=exp(-wakeSide*wakeSide/(spread*spread)-wakeAlong*wakeAlong/7.0);
trailFoam+=churn*motion.w*fade*noise2(vWorld.xz*3.7+uTime*.13)*.5;
n=normalize(n+vec3(delta.x,0,delta.y)*sin(dist*5.0-age*6.0)*exp(-abs(dist-radius)*2.0)*fade*.012);
}}
float depth=waterDepth(vWorld.xz);vec3 view=normalize(cameraPosition-vWorld);float NoV=max(dot(n,view),.001);
float fresnel=.02037+.97963*pow(1.0-NoV,5.0);
// Beer-Lambert absorption; depth is procedural, not the real terrain depth buffer.
vec3 transmittance=exp(-vec3(.19,.072,.035)*depth/max(NoV,.25));
vec3 scatter=vec3(.003,.028,.065);vec3 bottom=vec3(.025,.22,.15);
vec3 water=mix(scatter,bottom,transmittance)*(.23+.77*uLight);
float crestLight=pow(max(dot(normalize(vec3(-uSun.x,.35,-uSun.z)),view),0.0),3.0)*smoothstep(.12,1.0,p.y)*.13;
water+=vec3(.025,.23,.17)*crestLight*uLight;
vec3 reflected=reflect(-view,n);vec3 environment=atmosphere(reflected,uTime,uLight,uStorm,uSun);
vec4 projected=uReflectionMatrix*vec4(vWorld,1.0);vec2 uv=projected.xy/max(projected.w,.001);
uv+=n.xz*.012*microFade;float edge=min(min(uv.x,1.0-uv.x),min(uv.y,1.0-uv.y));
float valid=smoothstep(.015,.09,edge)*step(.001,projected.w)*uHasReflection;
vec3 planar=texture2D(uReflection,clamp(uv,vec2(.002),vec2(.998))).rgb;
environment=mix(environment,planar,valid);
vec3 color=mix(water,environment,fresnel);
// Anisotropic distribution creates a broad, broken solar trail without a blown-out white plane.
vec3 halfVector=normalize(view+uSun);float NoL=max(dot(n,uSun),0.0),NoH=max(dot(n,halfVector),.001);
vec3 tangent=normalize(vec3(uSun.z,0,-uSun.x));vec3 bitangent=normalize(cross(n,tangent));tangent=normalize(cross(bitangent,n));
float ax=.12+uStorm*.055,ay=.035+uStorm*.025;
float hX=dot(halfVector,tangent)/ax,hY=dot(halfVector,bitangent)/ay;
float distribution=1.0/(3.14159265*ax*ay*pow(hX*hX+hY*hY+NoH*NoH,2.0));
float masking=NoL/(NoL*(1.0-.18)+.18)*NoV/(NoV*(1.0-.18)+.18);
float solar=min(distribution*masking*.02037/(4.0*NoV*max(NoL,.02)),6.0)*NoL;
color+=vec3(1.0,.87,.64)*solar*uLight;
float grain=noise2(vWorld.xz*3.7+uTime*.13);float crestFoam=smoothstep(.26,.45,compression)*smoothstep(.36,.68,grain)*(.28+uStorm*.5);
float shoreFoam=(1.0-smoothstep(.7,3.3,depth))*smoothstep(.35,.72,noise2(vWorld.xz*1.7-uTime*.3))*.55;
vec2 relative=vWorld.xz-uBoat.xz;float along=dot(relative,uForward),side=dot(relative,vec2(uForward.y,-uForward.x));
float hullEdge=length(vec2(side/1.8,along/3.5));float hullFoam=exp(-pow((hullEdge-1.0)*8.0,2.0))*(.05+min(uSpeed*.065,.5))*grain;
float foam=clamp(crestFoam+shoreFoam+hullFoam+trailFoam,0.0,.82);
color=mix(color,vec3(.68,.78,.76)*(.25+.75*uLight),foam);
float fog=1.0-exp(-cameraDistance*.0017);color=mix(color,uFog,fog);
gl_FragColor=vec4(max(color,vec3(0.0)),1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
