// Shared linear-light environment for the sky and water's off-screen reflection fallback.
export const atmosphereGLSL=`
float skyHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float skyNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
return mix(mix(mix(skyHash(i),skyHash(i+vec3(1,0,0)),f.x),mix(skyHash(i+vec3(0,1,0)),skyHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(skyHash(i+vec3(0,0,1)),skyHash(i+vec3(1,0,1)),f.x),mix(skyHash(i+vec3(0,1,1)),skyHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float skyFbm(vec3 p){float s=0.0,a=.55;for(int i=0;i<4;i++){s+=a*skyNoise(p);p=p*2.03+7.0;a*=.5;}return s;}
vec3 atmosphere(vec3 d,float t,float daylight,float storm,vec3 sunDir){
float y=max(d.y,0.0);vec3 sky=mix(vec3(.22,.36,.49),vec3(.025,.10,.24),pow(y,.42));
vec3 p=d*4.2+vec3(t*.006,0,0);float cloud=skyFbm(p);
float mask=smoothstep(.42-storm*.08,.66,cloud)*smoothstep(-.03,.14,d.y);
vec3 cloudColor=mix(vec3(.25,.32,.39),vec3(.65,.70,.72),smoothstep(.25,.65,skyFbm(p+vec3(0,.25,0))));
sky=mix(sky,cloudColor,mask);float alignment=max(dot(d,sunDir),0.0);
sky+=vec3(1.0,.79,.48)*pow(alignment,40.0)*.23*(1.0-mask);
sky+=vec3(4.0,3.4,2.5)*smoothstep(.99965,.99994,alignment)*(1.0-mask*.85);
return sky*daylight;
}`;
export const skyVertex=`varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
export const skyFragment=`uniform float time;uniform float light;uniform float storm;uniform vec3 sunDirection;varying vec3 vP;
${atmosphereGLSL}
void main(){gl_FragColor=vec4(atmosphere(normalize(vP),time,light,storm,sunDirection),1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
