/** SI units: metres, seconds, Y up; XZ is the navigation plane. */
export const WAVE_CONFIG = Object.freeze([
  { length: 38, amplitude: .95, direction: .25, steepness: .72, phase: .2 },
  { length: 21, amplitude: .45, direction: 1.1, steepness: .62, phase: 2.3 },
  { length: 11.3, amplitude: .23, direction: -.7, steepness: .58, phase: 4.1 },
  { length: 5.8, amplitude: .105, direction: 1.9, steepness: .48, phase: 1.4 },
  { length: 2.9, amplitude: .052, direction: -.22, steepness: .42, phase: 5.2 },
  { length: 1.47, amplitude: .026, direction: 2.6, steepness: .32, phase: 3.7 }
].map(Object.freeze));
const TAU = Math.PI * 2;
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
export function createSurfaceSample() {
  return { x:0, z:0, height:0, normal:{x:0,y:1,z:0}, velocity:{x:0,y:0,z:0}, direction:{x:0,y:0,z:0},
    dx:{x:1,y:0,z:0}, dz:{x:0,y:0,z:1}, residual:0 };
}
export class OceanPhysics {
  constructor({windSpeed=7,windDirection=0,intensity=.72}={}) {
    // Packed once, shared verbatim with GPU uniforms: (dx,dz,k,amplitude), (omega,q,phase,unused).
    this.waves = new Float32Array(WAVE_CONFIG.length*4);
    this.motion = new Float32Array(WAVE_CONFIG.length*4);
    this.scratch = createSurfaceSample();
    this.configure({windSpeed,windDirection,intensity});
  }
  configure({windSpeed=this.windSpeed,windDirection=this.windDirection,intensity=this.baseIntensity}={}) {
    this.windSpeed=clamp(windSpeed,0,20);this.windDirection=windDirection;this.baseIntensity=clamp(intensity,0,1.4);this.intensity=this.baseIntensity;
    WAVE_CONFIG.forEach((w,i)=>{
      const k=TAU/w.length,a=w.direction+windDirection,n=i*4;
      this.waves.set([Math.cos(a),Math.sin(a),k,w.amplitude],n);
      this.motion.set([Math.sqrt(9.81*k)*(.86+this.windSpeed*.02),w.steepness,w.phase,0],n);
    });
  }
  setStorm(storm) { this.intensity=clamp(this.baseIntensity*(1+clamp(storm,0,1)*.72),0,1.4); }
  /** Parametric Gerstner evaluation, also used to test the inverse world-space sampler. */
  evaluate(qx,qz,time,out=createSurfaceSample()) {
    out.x=qx;out.z=qz;out.height=0;
    const dx=out.dx,dz=out.dz,v=out.velocity;
    dx.x=1;dx.y=0;dx.z=0;dz.x=0;dz.y=0;dz.z=1;v.x=v.y=v.z=0;
    for(let i=0;i<this.waves.length;i+=4){
      const x=this.waves[i],z=this.waves[i+1],k=this.waves[i+2],a=this.waves[i+3]*this.intensity;
      const omega=this.motion[i],q=this.motion[i+1],phase=k*(x*qx+z*qz)-omega*time+this.motion[i+2];
      const sn=Math.sin(phase),cs=Math.cos(phase),qa=q*a,der=qa*k*sn;
      out.x+=qa*x*cs;out.z+=qa*z*cs;out.height+=a*sn;
      dx.x-=der*x*x;dx.z-=der*x*z;dx.y+=a*k*x*cs;
      dz.x-=der*x*z;dz.z-=der*z*z;dz.y+=a*k*z*cs;
      v.x+=qa*x*omega*sn;v.z+=qa*z*omega*sn;v.y-=a*omega*cs;
    }
    // dz × dx points upwards.
    const nx=dz.y*dx.z-dz.z*dx.y,ny=dz.z*dx.x-dz.x*dx.z,nz=dz.x*dx.y-dz.y*dx.x;
    const len=Math.hypot(nx,ny,nz);out.normal.x=nx/len;out.normal.y=ny/len;out.normal.z=nz/len;
    const speed=Math.hypot(v.x,v.y,v.z)||1;out.direction.x=v.x/speed;out.direction.y=v.y/speed;out.direction.z=v.z/speed;
    return out;
  }
  sampleOceanSurface(worldX,worldZ,time,out=createSurfaceSample()) {
    // Gerstner displaces XZ too. Newton inversion prevents physics/render phase mismatch.
    let qx=worldX,qz=worldZ;
    for(let i=0;i<6;i++){
      this.evaluate(qx,qz,time,out);
      const ex=out.x-worldX,ez=out.z-worldZ;
      if(ex*ex+ez*ez<1e-12)break;
      const det=out.dx.x*out.dz.z-out.dz.x*out.dx.z;
      qx-=(out.dz.z*ex-out.dz.x*ez)/det;
      qz-=(-out.dx.z*ex+out.dx.x*ez)/det;
    }
    this.evaluate(qx,qz,time,out);out.residual=Math.hypot(out.x-worldX,out.z-worldZ);
    return out;
  }
}
export const oceanPhysics=new OceanPhysics();
export function sampleOceanSurface(worldX,worldZ,time,out) {
  return oceanPhysics.sampleOceanSurface(worldX,worldZ,time,out);
}
/** Controls still own X/Z/yaw. This class owns ONLY visual heave/pitch/roll. */
export class BoatFloat {
  constructor(physics=oceanPhysics){
    this.physics=physics;this.samples=Array.from({length:5},createSurfaceSample);
    this.offsets=[[0,0],[0,-3],[0,2.5],[-1.4,0],[1.4,0]];
    this.pose={y:0,pitch:0,roll:0};this.initialized=false;
  }
  update(x,z,yaw,time,dt){
    const c=Math.cos(yaw),s=Math.sin(yaw),a=this.samples;
    for(let i=0;i<5;i++){const [lx,lz]=this.offsets[i];this.physics.sampleOceanSurface(x+c*lx+s*lz,z-s*lx+c*lz,time,a[i]);}
    const pitch=clamp(Math.atan2(a[1].height-a[2].height,5.5),-.28,.28);
    const roll=clamp(Math.atan2(a[4].height-a[3].height,2.8),-.28,.28);
    const y=(a[0].height*2+a[1].height+a[2].height+a[3].height+a[4].height)/6+.24;
    const blend=this.initialized?1-Math.exp(-dt*7):1,p=this.pose;this.initialized=true;
    p.y+=(y-p.y)*blend;p.pitch+=(pitch-p.pitch)*blend;p.roll+=(roll-p.roll)*blend;
    // Keep deck freeboard >= 0.18 m at the sampled hull points, even during a steep crest.
    // Exact local Y from YXZ Euler rotation, not a small-angle approximation.
    let floor=-Infinity;
    for(let i=0;i<5;i++){const [lx,lz]=this.offsets[i];const tilt=lx*Math.sin(p.roll)*Math.cos(p.pitch)-lz*Math.sin(p.pitch);
      floor=Math.max(floor,a[i].height-tilt-.68*Math.cos(p.roll)*Math.cos(p.pitch)+.18);}
    p.y=Math.max(p.y,floor);return p;
  }
}
