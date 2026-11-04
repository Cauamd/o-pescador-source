import {access,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
for(const f of ['index.html','style.css','vendor/three.module.js','vendor/three.core.js']) await access('dist/'+f);
async function check(dir){for(const f of await readdir(dir,{withFileTypes:true})){if(f.isDirectory()&&f.name!=='vendor')await check(dir+'/'+f.name);else if(f.isFile()&&f.name.endsWith('.js'))execFileSync(process.execPath,['--check',dir+'/'+f.name]);}}
await check('dist');
for(const set of ['wood','paint','plaster','stone','tile','rocky-terrain'])for(const file of ['color.jpg','normal.png','roughness.jpg'])await access(`dist/assets/materials/${set}/${file}`);
for(const file of ['loaders/GLTFLoader.js','utils/BufferGeometryUtils.js'])await access('dist/vendor/addons/'+file);
console.log('Build estático validado: módulos e recursos locais presentes.');
