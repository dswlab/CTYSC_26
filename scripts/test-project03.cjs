'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),site=path.join(root,'project_03');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
for(const file of walk(site)){
 assert(/^[\x20-\x7e]+$/.test(path.relative(site,file)),'Non-English path');
 if(!file.endsWith('.html'))continue;
 const html=fs.readFileSync(file,'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,file);
 for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  const link=m[1];if(/^(https?:|blob:|data:|about:)/.test(link))continue;
  if(link.startsWith('#')){assert(ids.includes(link.slice(1)),`${file}: ${link}`);continue;}
  assert(fs.existsSync(path.resolve(path.dirname(file),link.split('#')[0])),`${file}: ${link}`);
 }
 for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
}
const guide=fs.readFileSync(path.join(site,'student/guide.html'),'utf8');
assert(!guide.includes('오른손 규칙 예시'));assert(!guide.includes('76회'));
const preview=fs.readFileSync(path.join(site,'student/preview.html'),'utf8');assert(!preview.includes("if(rule==='right')"));assert(!preview.includes('value="right"'));
const password=process.env.TEACHER_PASSWORD||fs.readFileSync(path.join(root,'../.private/project03-password.txt'),'utf8').trim();
const packet=JSON.parse(fs.readFileSync(path.join(site,'teacher/resources.enc.json')));
function decrypt(secret){
 const key=crypto.pbkdf2Sync(secret,Buffer.from(packet.salt,'base64'),packet.iterations,32,'sha256');
 const raw=Buffer.from(packet.data,'base64');const decipher=crypto.createDecipheriv('aes-256-gcm',key,Buffer.from(packet.iv,'base64'));decipher.setAuthTag(raw.subarray(-16));
 return JSON.parse(Buffer.concat([decipher.update(raw.subarray(0,-16)),decipher.final()]).toString());
}
assert.throws(()=>decrypt('incorrect-password'));
const data=decrypt(password);assert.equal(data.files.length,7);
const manual=Buffer.from(data.files.find(f=>f.name==='teacher-manual.html').data,'base64').toString('utf8');
assert(manual.includes('<h1>센서로 판단하는 미로'));
assert(manual.includes('<h2>'));
assert(manual.includes('<table>'));
assert(manual.includes('<pre><code'));
assert(!manual.includes('<pre># '));
for(let n=1;n<=3;n++){
 const f=data.files.find(f=>f.name===`teacher-solution-map${n}.ent`);assert(f);
 assert(Buffer.from(f.data,'base64').equals(fs.readFileSync(path.join(root,`../entry-drone-maze/교사용_오른손규칙${n===1?'':`_맵${n}`}.ent`))));
}
for(const file of walk(root).filter(f=>!f.includes(path.sep+'.git'+path.sep))){
 if(!file.endsWith('.ent')&&!file.endsWith('.png'))assert(!fs.readFileSync(file).includes(Buffer.from(password)),'Password leak');
}
const python=`import json, tarfile\nfrom pathlib import Path\nfor p in Path('project_03/student/downloads').glob('*.ent'):\n with tarfile.open(p) as t:\n  d=json.load(t.extractfile('temp/project.json'))\n  assert len(d['functions'])==5\n  s=json.loads(d['objects'][0]['script'])\n  assert len(s)==1 and len(s[0])==2\n  assert s[0][1]['type']=='func_move_forward'\nprint('Student archives: no completed decision rule')`;
cp.execFileSync('python',['-c',python],{cwd:root,stdio:'inherit'});
console.log('English paths, local links, scripts, student-only public files, encryption round trip, and wrong-password rejection: OK');
