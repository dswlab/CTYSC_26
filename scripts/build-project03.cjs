// Run locally: node scripts/build-project03.cjs [path-to-entry-drone-maze]
// Teacher originals and the password must never be committed to this public repository.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const repo=path.resolve(__dirname,'..');
const source=path.resolve(process.argv[2]||path.join(repo,'..','entry-drone-maze'));
const out=path.join(repo,'project_03');
const privateDir=path.join(repo,'..','.private');
const secretPath=path.join(privateDir,'project03-password.txt');
fs.mkdirSync(privateDir,{recursive:true});
if(!process.env.TEACHER_PASSWORD&&!fs.existsSync(secretPath))fs.writeFileSync(secretPath,crypto.randomBytes(18).toString('base64url'),{mode:0o600});
const password=process.env.TEACHER_PASSWORD||fs.readFileSync(secretPath,'utf8').trim();
if(password.length<16)throw Error('Use a strong password of at least 16 characters.');
const base='https://dswlab.github.io/CTYSC_26/project_03/';
const read=name=>fs.readFileSync(path.join(source,name),'utf8');
function write(name,data){const dest=path.join(out,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,data);}
for(let n=1;n<=3;n++){
 const suffix=n===1?'':`_맵${n}`;
 write(`student/downloads/student-maze-map${n}.ent`,fs.readFileSync(path.join(source,`학생용_센서미로${suffix}.ent`)));
 write(`assets/map${n}.png`,fs.readFileSync(path.join(source,`맵${n}_미리보기.png`)));
}
let guide=read('엔트리_사용안내.html');
// Keep block documentation public; reserve complete algorithms and worked examples for teachers.
guide=guide.replace(/<h3 style="margin-top:24px">오른손 규칙 예시<\/h3>[\s\S]*?(?=<\/section>\s*<section id="test">)/,'<div class="tip"><strong>우리 팀의 규칙을 설계하세요.</strong> 오른손 규칙은 오른쪽 → 앞 → 왼쪽 → 뒤돌기 순서, 왼손 규칙은 왼쪽 → 앞 → 오른쪽 → 뒤돌기 순서로 확인합니다. 기본 조건문과 비교 블록, 제공된 행동 함수를 조립하세요. 완성 예시는 교사가 안내합니다.</div>');
guide=guide.replace(/<div class="box"><h3>검증된 오른손 규칙 결과<\/h3>[\s\S]*?<\/div>/,'<div class="box"><h3>시험하고 기록하세요</h3><p>도착 여부, 정지 이유, 이동 횟수를 기록하고 다른 맵에서도 같은 규칙을 시험하세요.</p><p class="small">어떤 규칙도 임의의 모든 미로 탈출을 보장하지는 않습니다.</p></div>');
guide=guide.replace(/<li><code>교사용_오른손규칙.ent<\/code> 및 맵별 파일: 완성 예시<\/li>/,'');
guide=guide.replace(/<script>[\s\S]*?<\/script>/,'<script>document.getElementById("print").addEventListener("click",()=>window.print());</script>');
for(let n=3;n>=1;n--){const old=n===1?'학생용_센서미로.ent':`학생용_센서미로_맵${n}.ent`;guide=guide.split(old).join(`downloads/student-maze-map${n}.ent`);}
guide=guide.split('미리보기.html').join('preview.html');
guide=guide.replace('<main>','<main><p><a href="./">← 학생 자료 홈</a></p>');
write('student/guide.html',guide);
let preview=read('미리보기.html');
preview=preview.replace('<option value="right">교사용 예시 · 오른손 규칙</option>','').replace('<option value="left">비교 실험 · 왼손 규칙</option>','');
preview=preview.split(/\r?\n/).filter(line=>!line.trimStart().startsWith("if(rule==='right')")&&!line.trimStart().startsWith("if(rule==='left')")).join('\n');
preview=preview.replace(/\$\('code'\)\.textContent=\$\('rule'\)\.value[\s\S]*?;\}/,"$('code').textContent='전진하기（学生用開始状態）';}");
preview=preview.replace('전진하기（学生用開始状態）','전진하기 — 학생용 시작 상태');
preview=preview.replace('학생용_센서미로.ent','student-maze-map1.ent');
preview=preview.replace('<main>','<main><p><a href="./">← 학생 자료 홈</a></p>');
write('student/preview.html',preview);
const files=[];
const aliases=new Map();
function add(old,name,title,description,mime){
 aliases.set(old,name);files.push({name,title,description,mime,data:fs.readFileSync(path.join(source,old))});
}
for(let n=1;n<=3;n++)add(`교사용_오른손규칙${n===1?'':`_맵${n}`}.ent`,`teacher-solution-map${n}.ent`,`맵 ${n} · 오른손 규칙 완성 파일`,'엔트리에서 열어 학생 코드와 비교하는 교사용 예시입니다.','application/octet-stream');
add('미리보기.html','teacher-simulator.html','전체 시뮬레이터','오른손·왼손 규칙을 선택하여 세 맵을 시험합니다.','text/html');
add('수업슬라이드_센서미로_3교시.html','lesson-slides.html','3교시 수업 슬라이드','활동 순서, 교사 노트와 완성 규칙 비교를 포함합니다.','text/html');
add('엔트리_사용안내.html','full-guide.html','전체 사용 안내서','완성 코드와 검증 결과를 포함한 교사용 전체 안내입니다.','text/html');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
files.push({name:'teacher-manual.html',title:'교사용 상세 매뉴얼',description:'엔진 구조, 검증 범위, 안전 정지와 실습 운영 안내입니다.',mime:'text/html',data:Buffer.from(`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>교사용 상세 매뉴얼</title><style>body{max-width:980px;margin:30px auto;padding:20px;font:16px/1.8 system-ui}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}</style><h1>교사용 상세 매뉴얼</h1><pre>${escape(read('시작하기.md'))}</pre></html>`)});
for(const file of files){
 if(file.mime==='text/html'){
  let html=file.data.toString('utf8');
  // Replace source names in longest-first order so map-specific names remain distinct.
  for(const [old,name] of [...aliases].sort((a,b)=>b[0].length-a[0].length))html=html.split(old).join(name);
  for(let n=3;n>=1;n--){const old=`학생용_센서미로${n===1?'':`_맵${n}`}.ent`;html=html.split(old).join(base+`student/downloads/student-maze-map${n}.ent`);}
  html=html.split('시작하기.md').join('teacher-manual.html').split('엔트리_사용안내.html').join('full-guide.html');
  file.data=Buffer.from(html);
 }
 file.data=file.data.toString('base64');
}
const salt=crypto.randomBytes(16),iv=crypto.randomBytes(12),iterations=600000;
const key=crypto.pbkdf2Sync(password,salt,iterations,32,'sha256');
const cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
const encrypted=Buffer.concat([cipher.update(JSON.stringify({files}),'utf8'),cipher.final(),cipher.getAuthTag()]);
write('teacher/resources.enc.json',JSON.stringify({version:1,iterations,salt:salt.toString('base64'),iv:iv.toString('base64'),data:encrypted.toString('base64')}));
console.log('Built student resources and encrypted teacher vault. Password stays outside the repository in .private/project03-password.txt.');
