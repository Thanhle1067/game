let seconds=0, stage=1, lastEventId=0;
const params=new URLSearchParams(location.search);
const T2=parseInt(params.get('t2')||'10000',10);
const IMG_TIER1='./bars-default.png', IMG_TIER2='./bars-gold.png';

const root=document.getElementById('root');
const baseBars=document.getElementById('bars');
const counter=document.getElementById('counter');
const popup=document.getElementById('popup');

const sndTing=document.getElementById('snd-ting');
const sndClack=document.getElementById('snd-clack');
const sndBoom=document.getElementById('snd-boom');

[IMG_TIER1,IMG_TIER2].forEach(src=>{const i=new Image();i.src=src;});

function showBars(){
  baseBars.classList.remove('hidden','exit');
  baseBars.classList.add('enter');
  // ensure base image is tier1 at first show
  if(!baseBars.style.backgroundImage) baseBars.style.backgroundImage = `url(${IMG_TIER1})`;
  setTimeout(()=> baseBars.classList.remove('enter'), 900);
}
function hideBars(){
  baseBars.classList.add('exit');
  setTimeout(()=>{
    baseBars.classList.add('hidden');
    baseBars.classList.remove('exit');
  }, 900);
}

function render(){
  if(seconds>0){
    counter.textContent = seconds + ' giây';
    counter.classList.remove('hidden');
  } else {
    counter.classList.add('hidden');
  }
}

function showPopupText(text, negative=false){
  popup.textContent = text;
  popup.className = 'popup show' + (negative ? ' negative' : '');
  setTimeout(()=>{ popup.className = 'popup'; }, 1000);
}

function swapBars(url){
  const incoming=document.createElement('div');
  incoming.className='bars next';
  incoming.style.backgroundImage=`url(${url})`;
  root.appendChild(incoming);
  incoming.addEventListener('animationend',()=>{
    baseBars.style.backgroundImage=`url(${url})`;
    root.removeChild(incoming);
  },{once:true});
}

function updateStageBySeconds(s){
  const newStage=(s>=T2)?2:1;
  if(newStage===stage) return;
  stage=newStage;
  swapBars(stage===2?IMG_TIER2:IMG_TIER1); // vertical slide for stage swap
}

async function poll(){
  try{
    const r=await fetch('/api/state'); const j=await r.json(); if(!j.ok) return;

    // first activation -> slide in from left
    if((j.active||j.seconds>0) && baseBars.classList.contains('hidden')){
      showBars();
    }

    // New event? play sound + popup
    if(j.lastEventId && j.lastEventId!==lastEventId){
      const d=j.lastDelta||0;
      if(d>0){
        try{ sndTing.currentTime=0; sndTing.play(); }catch(e){}
        showPopupText('+'+d+' giây', false);
      }else if(d<0){
        try{ sndClack.currentTime=0; sndClack.play(); }catch(e){}
        if(j.lastType==='rescue'){ try{ sndBoom.currentTime=0; sndBoom.play(); }catch(e){} }
        showPopupText(d+' giây', true);
      }
      lastEventId=j.lastEventId;
    }

    seconds=j.seconds|0;
    updateStageBySeconds(seconds);
    render();

    // when zero and inactive -> slide out to right
    if(!j.active && seconds<=0 && !baseBars.classList.contains('hidden')){
      hideBars();
    }
  }catch(e){
    // ignore
  }finally{
    setTimeout(poll,700);
  }
}
poll();
