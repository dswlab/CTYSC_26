'use strict';
const $=id=>document.getElementById(id);
const decode=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
let urls=[],idleTimer=null,unlocked=false;
function lock(){
 unlocked=false;clearTimeout(idleTimer);$('viewer').src='about:blank';
 $('viewer-panel').hidden=true;$('workspace').hidden=true;$('login').hidden=false;
 $('resources').replaceChildren();for(const url of urls)URL.revokeObjectURL(url);urls=[];
 $('password').value='';$('message').textContent='';
}
function touch(){if(unlocked){clearTimeout(idleTimer);idleTimer=setTimeout(lock,15*60*1000);}}
function blobUrl(data,type){const url=URL.createObjectURL(new Blob([data],{type}));urls.push(url);return url;}
function showFiles(files){
 const links=new Map();
 for(const file of files)if(file.mime!=='text/html')links.set(file.name,blobUrl(decode(file.data),file.mime));
 // Only prepared, trusted lesson HTML is displayed. Child frames cannot access the parent origin.
 for(const file of files.filter(f=>f.mime==='text/html')){
  let html=new TextDecoder().decode(decode(file.data));
  for(const [name,url] of links)html=html.split(name).join(url);
  links.set(file.name,blobUrl(html,'text/html'));
 }
 for(const file of files){
  const card=document.createElement('article');card.className='card';
  const title=document.createElement('h2');title.textContent=file.title;
  const description=document.createElement('p');description.textContent=file.description;
  const download=document.createElement('a');download.className='button secondary';download.textContent='다운로드';download.download=file.name;download.href=links.get(file.name);
  card.append(title,description);
  if(file.mime==='text/html'){
   const open=document.createElement('button');open.type='button';open.textContent='웹으로 보기';
   open.addEventListener('click',()=>{$('viewer-title').textContent=file.title;$('viewer').src=links.get(file.name);$('viewer-panel').hidden=false;$('viewer-panel').scrollIntoView({behavior:'smooth'});touch();});
   card.append(open,document.createTextNode(' '));
  }
  card.append(download);$('resources').append(card);
 }
}
$('unlock-form').addEventListener('submit',async event=>{
 event.preventDefault();$('unlock').disabled=true;$('message').textContent='암호화된 자료를 여는 중입니다…';
 try{
  if(!globalThis.crypto?.subtle)throw new Error('insecure');
  const response=await fetch('resources.enc.json',{cache:'no-store'});
  if(!response.ok)throw new Error('network');
  const packet=await response.json();
  if(packet.version!==1||packet.iterations!==600000)throw new Error('format');
  const raw=await crypto.subtle.importKey('raw',new TextEncoder().encode($('password').value),'PBKDF2',false,['deriveKey']);
  $('password').value='';
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:decode(packet.salt),iterations:packet.iterations,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,['decrypt']);
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(packet.iv)},key,decode(packet.data));
  const payload=JSON.parse(new TextDecoder().decode(plain));
  showFiles(payload.files);unlocked=true;$('login').hidden=true;$('workspace').hidden=false;$('message').textContent='';touch();
 }catch(error){
  lock();$('message').textContent=error.message==='insecure'?'HTTPS 또는 localhost로 접속해 주세요.':error.message==='network'?'자료를 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.':'비밀번호가 올바르지 않거나 자료를 열 수 없습니다.';
 }finally{$('unlock').disabled=false;}
});
$('lock').addEventListener('click',lock);
for(const event of ['pointerdown','keydown'])document.addEventListener(event,touch);
window.addEventListener('pagehide',lock);
