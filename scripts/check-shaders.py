"""Compile/link production GLSL with local Mesa EGL ES3. Not browser/GPU visual validation."""
import ctypes as C, json, subprocess, sys
E=C.CDLL('libEGL.so.1')
def egl(name,ret,args):
 f=getattr(E,name);f.restype=ret;f.argtypes=args;return f
getproc=egl('eglGetProcAddress',C.c_void_p,[C.c_char_p])
def gl(name,ret,args):
 p=getproc(name.encode());assert p,name
 return C.CFUNCTYPE(ret,*args)(p)
ptr=C.c_void_p;I=C.c_int;U=C.c_uint
getdisplay=gl('eglGetPlatformDisplayEXT',ptr,[U,ptr,C.POINTER(I)])
display=getdisplay(0x31DD,None,None)
init=egl('eglInitialize',U,[ptr,C.POINTER(I),C.POINTER(I)])
major,minor=I(),I()
if not init(display,C.byref(major),C.byref(minor)):sys.exit('EGL unavailable: shader compilation NOT executed')
egl('eglBindAPI',U,[U])(0x30A0)
attrs=(I*13)(0x3033,1,0x3040,0x0040,0x3024,8,0x3023,8,0x3022,8,0x3021,8,0x3038)
config=ptr();count=I();assert egl('eglChooseConfig',U,[ptr,C.POINTER(I),C.POINTER(ptr),I,C.POINTER(I)])(display,attrs,C.byref(config),1,C.byref(count)) and count.value
render_images='--render' in sys.argv
surface=egl('eglCreatePbufferSurface',ptr,[ptr,ptr,C.POINTER(I)])(display,config,(I*5)(0x3057,960 if render_images else 32,0x3056,540 if render_images else 32,0x3038))
context=egl('eglCreateContext',ptr,[ptr,ptr,ptr,C.POINTER(I)])(display,config,None,(I*3)(0x3098,3,0x3038))
assert egl('eglMakeCurrent',U,[ptr,ptr,ptr,ptr])(display,surface,surface,context)
getstring=gl('glGetString',C.c_char_p,[U]);print('Renderer:',getstring(0x1F01).decode());print('Version:',getstring(0x1F02).decode())
create=gl('glCreateShader',U,[U]);source=gl('glShaderSource',None,[U,I,C.POINTER(C.c_char_p),C.POINTER(I)]);compile_=gl('glCompileShader',None,[U]);get=gl('glGetShaderiv',None,[U,U,C.POINTER(I)]);log=gl('glGetShaderInfoLog',None,[U,I,C.POINTER(I),C.c_char_p]);delete=gl('glDeleteShader',None,[U])
program=gl('glCreateProgram',U,[]);attach=gl('glAttachShader',None,[U,U]);link=gl('glLinkProgram',None,[U]);getp=gl('glGetProgramiv',None,[U,U,C.POINTER(I)]);logp=gl('glGetProgramInfoLog',None,[U,I,C.POINTER(I),C.c_char_p]);deletep=gl('glDeleteProgram',None,[U])
sources=json.loads(subprocess.check_output(['node','scripts/shader-sources.mjs']+(['--render'] if render_images else [])))
fixtures=sources.pop('_physics');render_data=sources.pop('_render',None);programs={}
for name,pair in sources.items():
 ids=[]
 for stage,kind in [('vertex',0x8B31),('fragment',0x8B30)]:
  sid=create(kind);text=C.c_char_p(pair[stage].encode());source(sid,1,C.byref(text),None);compile_(sid);ok=I();get(sid,0x8B81,C.byref(ok))
  if not ok.value:
   buf=C.create_string_buffer(16384);log(sid,len(buf),None,buf);sys.exit(f'{name} {stage}: {buf.value.decode()}')
  ids.append(sid)
 pid=program()
 if name=='Média':
  varying=(C.c_char_p*1)(b'vWorld');gl('glTransformFeedbackVaryings',None,[U,I,C.POINTER(C.c_char_p),U])(pid,1,varying,0x8C8C)
 for sid in ids:attach(pid,sid)
 link(pid);ok=I();getp(pid,0x8B82,C.byref(ok))
 if not ok.value:
  buf=C.create_string_buffer(16384);logp(pid,len(buf),None,buf);sys.exit(f'{name} link: {buf.value.decode()}')
 print(name+': vertex + fragment compiled, linked successfully')
 for sid in ids:delete(sid)
 programs[name]=pid
# Execute the production vertex shader and compare its displacement against CPU physics.
use=gl('glUseProgram',None,[U]);loc=gl('glGetUniformLocation',I,[U,C.c_char_p]);u1=gl('glUniform1f',None,[I,C.c_float]);u2=gl('glUniform2f',None,[I,C.c_float,C.c_float]);u4v=gl('glUniform4fv',None,[I,I,C.POINTER(C.c_float)]);matrix=gl('glUniformMatrix4fv',None,[I,I,U,C.POINTER(C.c_float)])
genbuf=gl('glGenBuffers',None,[I,C.POINTER(U)]);bindbuf=gl('glBindBuffer',None,[U,U]);bufferdata=gl('glBufferData',None,[U,C.c_ssize_t,ptr,U]);bindbase=gl('glBindBufferBase',None,[U,U,U]);genvao=gl('glGenVertexArrays',None,[I,C.POINTER(U)]);bindvao=gl('glBindVertexArray',None,[U]);attr=gl('glGetAttribLocation',I,[U,C.c_char_p]);enableattr=gl('glEnableVertexAttribArray',None,[U]);attrib=gl('glVertexAttribPointer',None,[U,I,U,U,I,ptr]);enable=gl('glEnable',None,[U]);disable=gl('glDisable',None,[U]);draw=gl('glDrawArrays',None,[U,I,I])
pid=programs['Média'];use(pid)
for key,values in [('uWaves',fixtures['waves']),('uMotion',fixtures['motion'])]:u4v(loc(pid,key.encode()),6,(C.c_float*24)(*values))
u1(loc(pid,b'uIntensity'),fixtures['intensity']);u1(loc(pid,b'uTime'),fixtures['time']);u2(loc(pid,b'uCenter'),0,0)
identity=(C.c_float*16)(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)
for key in ['projectionMatrix','viewMatrix']:matrix(loc(pid,key.encode()),1,0,identity)
vao=U();genvao(1,C.byref(vao));bindvao(vao);vbo=U();genbuf(1,C.byref(vbo));bindbuf(0x8892,vbo)
values=[v for point in fixtures['points'] for v in point];array=(C.c_float*len(values))(*values);bufferdata(0x8892,C.sizeof(array),array,0x88E4)
index=attr(pid,b'position');enableattr(index);attrib(index,3,0x1406,0,0,None)
out=U();genbuf(1,C.byref(out));bindbuf(0x8C8E,out);bufferdata(0x8C8E,len(values)*4,None,0x88E1);bindbase(0x8C8E,0,out)
enable(0x8C89);gl('glBeginTransformFeedback',None,[U])(0);draw(0,0,len(fixtures['points']));gl('glEndTransformFeedback',None,[])();disable(0x8C89);gl('glFinish',None,[])()
mapbuf=gl('glMapBufferRange',ptr,[U,C.c_ssize_t,C.c_ssize_t,U]);mapped=mapbuf(0x8C8E,0,len(values)*4,1);assert mapped,'transform feedback mapping failed'
actual=list(C.cast(mapped,C.POINTER(C.c_float*len(values))).contents);expected=[v for point in fixtures['expected'] for v in point];error=max(abs(a-b) for a,b in zip(actual,expected));assert error<.0001,error
print(f'GPU/CPU Gerstner parity: 12 points, maximum displacement error {error:.8f} metres')
gl('glUnmapBuffer',U,[U])(0x8C8E)
if render_data:
 from PIL import Image
 u3=gl('glUniform3f',None,[I,C.c_float,C.c_float,C.c_float]);uniform_i=gl('glUniform1i',None,[I,I]);viewport=gl('glViewport',None,[I,I,I,I]);clear=gl('glClear',None,[U]);clearcolor=gl('glClearColor',None,[C.c_float]*4);depthmask=gl('glDepthMask',None,[U]);elements=gl('glDrawElements',None,[U,I,U,ptr]);readpixels=gl('glReadPixels',None,[I,I,I,I,U,U,ptr])
 # Bind a complete black reflection texture. Diagnostic capture tests the shared-sky fallback only.
 texture=U();gl('glGenTextures',None,[I,C.POINTER(U)])(1,C.byref(texture));gl('glBindTexture',None,[U,U])(0x0DE1,texture)
 for param in [0x2801,0x2800]:gl('glTexParameteri',None,[U,U,I])(0x0DE1,param,0x2601)
 gl('glTexImage2D',None,[U,I,I,I,I,I,U,U,ptr])(0x0DE1,0,0x1908,1,1,0,0x1908,0x1401,(C.c_ubyte*4)(0,0,0,255))
 def draw_geometry(pid,geometry):
  vertices=(C.c_float*len(geometry['positions']))(*geometry['positions']);indices=(U*len(geometry['indices']))(*geometry['indices']);v=U();ib=U();genbuf(1,C.byref(v));bindbuf(0x8892,v);bufferdata(0x8892,C.sizeof(vertices),vertices,0x88E4);index=attr(pid,b'position');enableattr(index);attrib(index,3,0x1406,0,0,None);genbuf(1,C.byref(ib));bindbuf(0x8893,ib);bufferdata(0x8893,C.sizeof(indices),indices,0x88E4);elements(4,len(geometry['indices']),0x1405,None)
  gl('glDeleteBuffers',None,[I,C.POINTER(U)])(1,C.byref(v));gl('glDeleteBuffers',None,[I,C.POINTER(U)])(1,C.byref(ib))
 def set_uniforms(pid):
  use(pid)
  for key,val in [('time',23.4),('uTime',23.4),('light',.9),('uLight',.9),('storm',0),('uStorm',0),('uIntensity',.72),('toneMappingExposure',1.15),('uHasReflection',0)]:u1(loc(pid,key.encode()),val)
  u3(loc(pid,b'cameraPosition'),*render_data['camera']);u3(loc(pid,b'uSun'),-.518,.356,-.777);u3(loc(pid,b'sunDirection'),-.518,.356,-.777);u3(loc(pid,b'uFog'),.387,.495,.531);u3(loc(pid,b'uBoat'),10000,0,10000);u2(loc(pid,b'uCenter'),0,0);u2(loc(pid,b'uForward'),0,-1)
  for key,values in [('projectionMatrix',render_data['projection']),('viewMatrix',render_data['view']),('modelViewMatrix',render_data['skyModelView']),('modelMatrix',render_data['legacyModel'])]:matrix(loc(pid,key.encode()),1,0,(C.c_float*16)(*values))
  for key,values in [('uWaves',fixtures['waves']),('uMotion',fixtures['motion'])]:u4v(loc(pid,key.encode()),6,(C.c_float*24)(*values))
  uniform_i(loc(pid,b'uReflection'),0)
 viewport(0,0,960,540);disable(0x0B44);enable(0x0B71)
 for label,sky_name,water_name,geometry in [('before','legacySky','legacyWater',render_data['legacyGeometry']),('after','sky','Média',render_data['geometry'])]:
  depthmask(1);clearcolor(.2,.3,.4,1);clear(0x00004000|0x00000100);depthmask(0);set_uniforms(programs[sky_name]);draw_geometry(programs[sky_name],render_data['skyGeometry']);depthmask(1);set_uniforms(programs[water_name]);draw_geometry(programs[water_name],geometry);gl('glFinish',None,[])();pixels=(C.c_ubyte*(960*540*4))();readpixels(0,0,960,540,0x1908,0x1401,pixels);im=Image.frombytes('RGBA',(960,540),bytes(pixels)).transpose(Image.Transpose.FLIP_TOP_BOTTOM);im.convert('RGB').save('docs/ocean-'+label+'.png');print('Offscreen shader diagnostic: docs/ocean-'+label+'.png')
for pid in programs.values():deletep(pid)
egl('eglMakeCurrent',U,[ptr,ptr,ptr,ptr])(display,None,None,None)
egl('eglDestroyContext',U,[ptr,ptr])(display,context);egl('eglDestroySurface',U,[ptr,ptr])(display,surface);egl('eglTerminate',U,[ptr])(display)
