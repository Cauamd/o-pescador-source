import {GLTFLoader} from '../vendor/addons/loaders/GLTFLoader.js';
/** Optional STATIC glTF assets. No nonexistent model URLs are requested by the game. */
export class AssetManager {
 constructor({loader=new GLTFLoader(),dracoLoader=null,meshoptDecoder=null}={}){this.loader=loader;if(dracoLoader)loader.setDRACOLoader(dracoLoader);if(meshoptDecoder)loader.setMeshoptDecoder(meshoptDecoder);this.cache=new Map();this.disposed=false;}
 async acquire(url,{scale=1,yaw=0,fallback=null}={}){
  if(this.disposed)throw Error('AssetManager disposed');
  if(!url){if(fallback)return {root:fallback(),release(){}};throw Error('No asset URL');}
  let record=this.cache.get(url);if(!record){record={refs:0,promise:null,gltf:null};record.promise=this.loader.loadAsync(url).then(gltf=>{record.gltf=gltf;return gltf;}).catch(error=>{if(this.cache.get(url)===record)this.cache.delete(url);throw error;});this.cache.set(url,record);}record.refs++;
  try{const gltf=await record.promise;if(this.disposed){this.destroy(record);throw Error('AssetManager disposed during load');}let skinned=false;gltf.scene.traverse(o=>{if(o.isSkinnedMesh)skinned=true;});if(skinned)throw Error('Animated/skinned assets require a skeleton-aware clone pipeline');
   const root=gltf.scene.clone(true);root.scale.multiplyScalar(scale);root.rotation.y+=yaw;root.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});let released=false;return {root,release:()=>{if(released)return;released=true;root.removeFromParent();record.refs--;}};
  }catch(error){record.refs=Math.max(0,record.refs-1);if(fallback)return {root:fallback(),error,release(){}};throw error;}
 }
 evict(url){const r=this.cache.get(url);if(!r||r.refs)return false;if(!r.gltf)return false;this.destroy(r);this.cache.delete(url);return true;}
 destroy(record){if(record.destroyed||!record.gltf)return;record.destroyed=true;const geometries=new Set(),materials=new Set(),textures=new Set();record.gltf.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});for(const m of materials)for(const v of Object.values(m))if(v?.isTexture)textures.add(v);for(const t of textures)t.dispose();for(const m of materials)m.dispose();for(const g of geometries)g.dispose();}
 dispose(){if(this.disposed)return;this.disposed=true;for(const r of this.cache.values()){if(r.gltf)this.destroy(r);else r.promise.then(()=>this.destroy(r),()=>{});}this.cache.clear();}
}
