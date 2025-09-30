let seconds=0, stage=1, lastEventId=0;
const params=new URLSearchParams(location.search);
const T2=parseInt(params.get('t2')||'10000',10);
const IMG_TIER1='./bars-default.png', IMG_TIER2='./bars-gold.png';
const root=document.getElementById('root');
const baseBars=document.getElementById('bars');
const counter=document.getElementById('counter');
const sndTing=document.getElementById('snd-ting'), sndClack=document.getElementById('snd-clack'), sndBoom=document.getElementById('snd-boom');
[IMG_TIER1,IMG_TIER2].forEach(src=>{const i=new Image();i.src=src;});

function showUI(){ baseBars.classList.remove('hidden'); }
function hideUI(){ baseBars.classList.add('hidden'); counter.classList.add('hidden'); }
function render(){ if(seconds>0){ counter.textContent=seconds+'s'; counter.classList.remove('hidden'); } else { counter.classList.add('hidden'); } }
function swapBars(url){ const incoming=document.createElement('div'); incoming.className='bars next'; incoming.style.backgroundImage=`url(${url})`; root.appendChild(incoming); incoming.addEventListener('animationend',()=>{ baseBars.style.backgroundImage=`url(${url})`; root.removeChild(incoming); },{once:true}); }
function updateStageBySeconds(s){ const newStage=(s>=T2)?2:1; if(newStage===stage) return; stage=newStage; swapBars(stage===2?IMG_TIER2:IMG_TIER1); }

async function poll(){ try{ const r=await fetch('/api/state'); const j=await r.json(); if(!j.ok) return;
  if((j.active||j.seconds>0) && baseBars.classList.contains('hidden')){ baseBars.style.backgroundImage=`url(${IMG_TIER1})`; showUI(); }
  if(j.lastEventId && j.lastEventId!==lastEventId){ const d=j.lastDelta||0; if(d>0){ try{sndTing.currentTime=0;sndTing.play()}catch(e){} } else if(d<0){ try{sndClack.currentTime=0;sndClack.play()}catch(e){} if(j.lastType==='rescue'){ try{sndBoom.currentTime=0;sndBoom.play()}catch(e){} } } lastEventId=j.lastEventId; }
  seconds=j.seconds|0; updateStageBySeconds(seconds); render();
  if(!j.active && seconds<=0) hideUI();
} catch(e){} finally{ setTimeout(poll,700); } } poll();
