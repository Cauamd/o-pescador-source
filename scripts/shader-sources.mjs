import * as T from '../dist/vendor/three.module.js';
import {readFileSync} from 'node:fs';
import {createOceanGeometry,OCEAN_QUALITY} from '../dist/ocean/OceanRenderer.js';
// Expand the installed r180 chunks for EGL compilation; no alternate game or renderer.
import {OceanPhysics} from '../dist/ocean/OceanPhysics.js';
import {ShaderChunk} from '../dist/vendor/three.module.js';
import {waterVertex,waterFragment} from '../dist/ocean/WaterShader.js';
import {skyVertex,skyFragment} from '../dist/ocean/AtmosphereShader.js';
const expand=s=>s.replace(/#include <(\w+)>/g,(_,name)=>{if(!ShaderChunk[name])throw Error(name);return expand(ShaderChunk[name]);});
const common='#version 300 es\nprecision highp float;precision highp int;\n';
const vp=common+'#define attribute in\n#define varying out\nuniform mat4 modelMatrix,modelViewMatrix,projectionMatrix,viewMatrix;uniform vec3 cameraPosition;in vec3 position;\n';
const fp=common+'#define varying in\n#define texture2D texture\nout vec4 pc_fragColor;\n#define gl_FragColor pc_fragColor\nuniform vec3 cameraPosition;\n#define TONE_MAPPING\n'+ShaderChunk.tonemapping_pars_fragment+'\nvec3 toneMapping(vec3 color){return ACESFilmicToneMapping(color);}\n'+ShaderChunk.colorspace_pars_fragment+'\nvec4 linearToOutputTexel(vec4 value){return sRGBTransferOETF(value);}\n';
const result={};for(const [name,micro,ripples] of [['Baixa',2,12],['Média',3,24],['Alta',4,32]])result[name]={vertex:vp+expand(waterVertex),fragment:fp+`\n#define MICRO_LAYERS ${micro}\n#define RIPPLE_COUNT ${ripples}\n`+expand(waterFragment)};
result.sky={vertex:vp+expand(skyVertex),fragment:fp+expand(skyFragment)};const physics=new OceanPhysics();const points=Array.from({length:12},(_,i)=>[-18+i*3,0,-14+i*1.7]);result._physics={waves:[...physics.waves],motion:[...physics.motion],intensity:physics.intensity,time:23.4,points,expected:points.map(p=>{const v=physics.evaluate(p[0],p[2],23.4);return [v.x,v.height,v.z];})};if(process.argv.includes('--render')){
 const old=JSON.parse(readFileSync('tests/fixtures/ocean-v0.json','utf8'));
 result.legacyWater={vertex:vp+old.seaVertex,fragment:fp+old.seaFrag};
 result.legacySky={vertex:vp+skyVertex,fragment:fp+old.skyFrag};
 const camera=new T.PerspectiveCamera(53,960/540,.1,3000);camera.position.set(13,7,23);camera.lookAt(0,1,-20);camera.updateMatrixWorld();
 const encode=g=>({positions:[...g.attributes.position.array],indices:[...g.index.array]});
 const model=new T.Matrix4().makeRotationX(-Math.PI/2),skyModel=new T.Matrix4().makeTranslation(...camera.position.toArray());
 result._render={camera:camera.position.toArray(),projection:camera.projectionMatrix.toArray(),view:camera.matrixWorldInverse.toArray(),skyModelView:camera.matrixWorldInverse.clone().multiply(skyModel).toArray(),legacyModel:model.toArray(),geometry:encode(createOceanGeometry(OCEAN_QUALITY.Média)),legacyGeometry:encode(new T.PlaneGeometry(2200,2200,240,240)),skyGeometry:encode(new T.SphereGeometry(1300,40,24))};
}
console.log(JSON.stringify(result));
