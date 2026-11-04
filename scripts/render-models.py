"""Software EGL diagnostic of real model geometry/textures, not a screenshot of gameplay.
Uses a compact GGX inspection shader; does not claim to be Three.js's full PBR pipeline.
"""
from pathlib import Path
import sys
sys.argv.append('--render')
setup=Path('scripts/check-shaders.py').read_text().split('sources=json.loads')[0]
setup=setup.replace('attrs=(I*13)','attrs=(I*15)').replace('0x3021,8,0x3038)','0x3021,8,0x3025,24,0x3038)')
exec(setup)
from PIL import Image
vertex='''#version 300 es
precision highp float;in vec3 position;in vec3 normal;in vec2 uv;uniform mat4 projectionMatrix,viewMatrix;out vec3 vP,vN;out vec2 vUv;
void main(){vP=position;vN=normal;vUv=uv;gl_Position=projectionMatrix*viewMatrix*vec4(position,1.0);}
'''
fragment='''#version 300 es
precision highp float;in vec3 vP,vN;in vec2 vUv;out vec4 outputColor;uniform vec3 baseColor,cameraPosition;uniform float roughness,metalness,hasTexture;uniform sampler2D colorMap,normalMap,roughMap;
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.0,1.0);}
void main(){vec3 n=normalize(vN);if(!gl_FrontFacing)n=-n;vec3 albedo=baseColor;float rough=roughness;if(hasTexture>0.5){albedo*=pow(texture(colorMap,vUv).rgb,vec3(2.2));rough*=texture(roughMap,vUv).r;vec3 dp1=dFdx(vP),dp2=dFdy(vP);vec2 du1=dFdx(vUv),du2=dFdy(vUv);vec3 tangent=dp1*du2.y-dp2*du1.y,bitangent=-dp1*du2.x+dp2*du1.x;if(length(tangent)>.00001&&length(bitangent)>.00001){vec3 mapped=texture(normalMap,vUv).xyz*2.0-1.0;mapped.xy*=.65;n=normalize(mat3(normalize(tangent),normalize(bitangent),n)*mapped);}}
vec3 l=normalize(vec3(-.6,1.0,.7)),v=normalize(cameraPosition-vP),h=normalize(l+v);float nl=max(dot(n,l),0.0),nv=max(dot(n,v),.01),nh=max(dot(n,h),0.0);float a=max(.04,rough*rough),a2=a*a;float d=a2/(3.14159*pow(nh*nh*(a2-1.0)+1.0,2.0));vec3 f0=mix(vec3(.04),albedo,metalness),f=f0+(1.0-f0)*pow(1.0-max(dot(v,h),0.0),5.0);float k=pow(rough+1.0,2.0)/8.0;float geom=nv/(nv*(1.0-k)+k)*nl/(nl*(1.0-k)+k);vec3 spec=d*geom*f/max(4.0*nv*nl,.01);vec3 color=albedo*(.25+.25*max(n.y,0.0))+(albedo*(1.0-metalness)/3.14159+spec)*nl*2.7;color=aces(color*1.15);outputColor=vec4(pow(color,vec3(1.0/2.2)),1.0);}
'''
ids=[]
for text,kind in [(vertex,0x8B31),(fragment,0x8B30)]:
 sid=create(kind);p=C.c_char_p(text.encode());source(sid,1,C.byref(p),None);compile_(sid);ok=I();get(sid,0x8B81,C.byref(ok));assert ok.value,'diagnostic shader failed';ids.append(sid)
pid=program()
for sid in ids:attach(pid,sid)
link(pid);ok=I();getp(pid,0x8B82,C.byref(ok));assert ok.value
gl('glUseProgram',None,[U])(pid)
loc=gl('glGetUniformLocation',I,[U,C.c_char_p]);u1=gl('glUniform1f',None,[I,C.c_float]);u3=gl('glUniform3fv',None,[I,I,C.POINTER(C.c_float)]);um=gl('glUniformMatrix4fv',None,[I,I,U,C.POINTER(C.c_float)]);ui=gl('glUniform1i',None,[I,I]);gb=gl('glGenBuffers',None,[I,C.POINTER(U)]);bb=gl('glBindBuffer',None,[U,U]);bd=gl('glBufferData',None,[U,C.c_ssize_t,ptr,U]);attr=gl('glGetAttribLocation',I,[U,C.c_char_p]);ea=gl('glEnableVertexAttribArray',None,[U]);ap=gl('glVertexAttribPointer',None,[U,I,U,U,I,ptr]);draw=gl('glDrawElements',None,[U,I,U,ptr]);dt=gl('glDeleteBuffers',None,[I,C.POINTER(U)])
vao=U();gl('glGenVertexArrays',None,[I,C.POINTER(U)])(1,C.byref(vao));gl('glBindVertexArray',None,[U])(vao)
gl('glEnable',None,[U])(0x0B71);gl('glDisable',None,[U])(0x0B44);gl('glViewport',None,[I,I,I,I])(0,0,960,540)
textures={}
def texture(set_,kind,unit):
 key=(set_,kind)
 if key not in textures:
  image=Image.open('dist/assets/materials/'+set_+'/'+kind+('.png' if kind=='normal' else '.jpg')).convert('RGBA').transpose(Image.Transpose.FLIP_TOP_BOTTOM)
  tex=U();gl('glGenTextures',None,[I,C.POINTER(U)])(1,C.byref(tex));textures[key]=tex
  gl('glActiveTexture',None,[U])(0x84C0+unit);gl('glBindTexture',None,[U,U])(0x0DE1,tex)
  for param,val in [(0x2801,0x2703),(0x2800,0x2601),(0x2802,0x2901),(0x2803,0x2901)]:gl('glTexParameteri',None,[U,U,I])(0x0DE1,param,val)
  raw=image.tobytes();gl('glTexImage2D',None,[U,I,I,I,I,I,U,U,ptr])(0x0DE1,0,0x1908,image.width,image.height,0,0x1908,0x1401,C.c_char_p(raw));gl('glGenerateMipmap',None,[U])(0x0DE1)
 else:gl('glActiveTexture',None,[U])(0x84C0+unit);gl('glBindTexture',None,[U,U])(0x0DE1,textures[key])
 ui(loc(pid,{'color':b'colorMap','normal':b'normalMap','roughness':b'roughMap'}[kind]),unit)
scenes=json.loads(subprocess.check_output(['node','scripts/model-sources.mjs']))
for name,scene in scenes.items():
 gl('glClearColor',None,[C.c_float]*4)(.09,.13,.16,1);gl('glClear',None,[U])(0x00004000|0x00000100)
 for key in ['projection','view']:um(loc(pid,(key+'Matrix').encode()),1,0,(C.c_float*16)(*scene[key]))
 u3(loc(pid,b'cameraPosition'),1,(C.c_float*3)(*scene['camera']))
 for obj in scene['objects']:
  buffers=[]
  for field,attribute,count in [('positions','position',3),('normals','normal',3),('uv','uv',2)]:
   data=(C.c_float*len(obj[field]))(*obj[field]);buffer=U();gb(1,C.byref(buffer));bb(0x8892,buffer);bd(0x8892,C.sizeof(data),data,0x88E4);idx=attr(pid,attribute.encode());ea(idx);ap(idx,count,0x1406,0,0,None);buffers.append(buffer)
  indices=(U*len(obj['indices']))(*obj['indices']);buffer=U();gb(1,C.byref(buffer));bb(0x8893,buffer);bd(0x8893,C.sizeof(indices),indices,0x88E4);buffers.append(buffer)
  u3(loc(pid,b'baseColor'),1,(C.c_float*3)(*obj['color']));u1(loc(pid,b'roughness'),obj['roughness']);u1(loc(pid,b'metalness'),obj['metalness']);u1(loc(pid,b'hasTexture'),1 if obj['texture'] else 0)
  if obj['texture']:
   for unit,kind in enumerate(['color','normal','roughness']):texture(obj['texture'],kind,unit)
  draw(4,len(obj['indices']),0x1405,None)
  for b in buffers:dt(1,C.byref(b))
 gl('glFinish',None,[])();pixels=(C.c_ubyte*(960*540*4))();gl('glReadPixels',None,[I,I,I,I,U,U,ptr])(0,0,960,540,0x1908,0x1401,pixels);Image.frombytes('RGBA',(960,540),bytes(pixels)).transpose(Image.Transpose.FLIP_TOP_BOTTOM).convert('RGB').save('docs/model-'+name+'.png');print('Model diagnostic:',name)
