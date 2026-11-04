"""Deterministic authored PBR textures. User-supplied Rocky Terrain 02 kept separately."""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
import zipfile,io,json,sys
ROOT=Path('dist/assets/materials');ROOT.mkdir(parents=True,exist_ok=True)
n=512;y,x=np.mgrid[0:n,0:n]/n;rng=np.random.default_rng(2718)
def noise(s):
 a=Image.fromarray(np.uint8(rng.random((s,s))*255));return np.asarray(a.resize((n,n),Image.Resampling.BICUBIC),dtype=float)/255
fine=noise(128);medium=noise(32);broad=noise(8)
warp=x+.014*np.sin(y*6.28)+.025*(broad-.5)
grain=(np.sin(warp*6.28*63+np.sin(y*12.56)*1.5)*.5+.5)
wood=np.clip(.28+.38*grain+.17*medium+.12*fine,0,1)
# Thin, lengthwise fissures and coarse grain on a weathered board.
cracks=np.maximum(0,1-np.abs(np.sin(warp*6.28*19))*16)*(medium>.52)
wood=np.clip(wood-cracks*.30,0,1)
height=wood*.12
col=np.stack([62+wood*106,41+wood*83,26+wood*60],axis=-1)
def save(name,col,h,rough):
 d=ROOT/name;d.mkdir(exist_ok=True)
 Image.fromarray(np.uint8(np.clip(col,0,255))).save(d/'color.jpg',quality=88)
 gy,gx=np.gradient(h);norm=np.stack([-gx*22,gy*22,np.ones_like(h)],-1);norm/=np.linalg.norm(norm,axis=-1,keepdims=True)
 Image.fromarray(np.uint8((norm*.5+.5)*255)).save(d/'normal.png',optimize=True)
 Image.fromarray(np.uint8(np.clip(rough,0,1)*255)).save(d/'roughness.jpg',quality=85)
save('wood',col,height,.66+.2*fine)
peel=(medium*.65+broad*.35)>.73;paint=np.stack([31+fine*24,88+fine*31,84+fine*30],-1);paint[peel]=col[peel]
save('paint',paint,height+peel*.025,.48+.2*fine+peel*.18)
plaster=np.stack([186+fine*35,180+fine*35,158+fine*35],-1);stain=np.clip(broad-.52,0,1)*65;plaster-=stain[...,None]
save('plaster',plaster,.05*fine+.04*medium,.87+.1*fine)
row=np.floor(y*8);xx=(x*5+(row%2)*.5)%1;yy=(y*8)%1;mortar=(xx<.035)|(yy<.045);stone=(.42+.25*medium+.15*fine);stone[mortar]=.23
save('stone',np.stack([stone*150,stone*148,stone*132],-1),stone*.22,.85+.12*fine)
roof=.5+.3*fine+.2*medium
save('tile',np.stack([roof*148,roof*67,roof*40],-1),roof*.05,.75+.15*fine)
# The attachment names this source asset; Poly Haven's matching asset/license was checked.
if len(sys.argv)<2:
 print('Created authored maps; retaining committed Rocky Terrain maps. Pass the source ZIP to regenerate them.');sys.exit(0)
with zipfile.ZipFile(sys.argv[1]) as z:
 d=ROOT/'rocky-terrain';d.mkdir(exist_ok=True)
 for name in ['color.jpg','normal.png','roughness.jpg']:
  im=Image.open(io.BytesIO(z.read('public/textures/rocky-terrain/'+name))).convert('RGB').resize((1024,1024),Image.Resampling.LANCZOS)
  im.save(d/name,**({'quality':89} if name.endswith('jpg') else {'optimize':True}))
 im=Image.open(io.BytesIO(z.read('public/textures/rocky-terrain/height.png'))).resize((64,64),Image.Resampling.BILINEAR)
 data=np.asarray(im,dtype=float);lo,hi=float(data.min()),float(data.max());data=np.uint16((data-lo)/max(1,hi-lo)*65535)
 Path('dist/models/RockyHeight.js').write_text('export const ROCKY_SIZE=64;\nexport const ROCKY_HEIGHT=new Uint16Array('+json.dumps(data.flatten().tolist(),separators=(',',':'))+');\n')
print('Created 5 authored PBR sets and adapted Rocky Terrain 02 at 1K.')
