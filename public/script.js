let seconds = 0;
let stage = 1;
let lastEventId = 0;
const params = new URLSearchParams(location.search);
const T2 = parseInt(params.get('t2')||'10000',10);
const IMG_TIER1='./bars-default.png';
const IMG_TIER2='./bars-gold.png';
const root=document.getElementById('root');
const baseBars=document.getElementById('bars');
const timeEl=document.getElementById('time');
const sndTing=document.getElementById('snd-ting');
const sndClack=document.getElementById('snd-clack');
const sndBoom=document.getElementById('snd-boom');

// preload
[IMG_TIER1, IMG_TIER2].forEach(src=>{const i=new Image();i.src=src;});
baseBars.classList.add('hidden'); timeEl.classList.add('hidden');

function render(){ timeEl.textContent = seconds + ' giây'; }

function swapBars(imgUrl){
  const incoming=document.createElement('div');
  incoming.className='bars next';
  incoming.style.backgroundImage=`url(${imgUrl})`;
  root.appendChild(incoming);
  incoming.addEventListener('animationend',()=>{
    baseBars.style.backgroundImage=`url(${imgUrl})`;
    root.removeChild(incoming);
  },{once:true});
}

function updateStageBySeconds(s){
  const newStage=(s>=T2)?2:1;
  if(newStage===stage) return;
  stage=newStage;
  const nextImg=(stage===2)?IMG_TIER2:IMG_TIER1;
  swapBars(nextImg);
}

// poll server state every 700ms
async function poll(){
  try{
    const r = await fetch('/api/state');
    const j = await r.json();
    if(!j.ok) return;

    // first activation: show UI when active or seconds>0
    if((j.active || j.seconds>0) && baseBars.classList.contains('hidden')){
      baseBars.classList.remove('hidden');
      timeEl.classList.remove('hidden');
      // ensure base image is tier1 initially
      if(!baseBars.style.backgroundImage) baseBars.style.backgroundImage=`url(${IMG_TIER1})`;
    }

    // sound based on new events
    if(j.lastEventId && j.lastEventId !== lastEventId){
      const d = j.lastDelta || 0;
      if(d > 0){ try{ sndTing.currentTime=0; sndTing.play(); }catch(e){} }
      else if(d < 0){
        try{ sndClack.currentTime=0; sndClack.play(); }catch(e){};
        if(j.lastType==='rescue'){ try{ sndBoom.currentTime=0; sndBoom.play(); }catch(e){} }
      }
      lastEventId = j.lastEventId;
    }

    seconds = j.seconds|0;
    updateStageBySeconds(seconds);
    render();

    // hide when zero and not active
    if(!j.active && seconds<=0){
      baseBars.classList.add('hidden');
      timeEl.classList.add('hidden');
    }
  }catch(e){
    // ignore
  }finally{
    setTimeout(poll,700);
  }
}
poll();

// For manual local test in console:
// fetch('/api/add?sec=1000')  // add
// fetch('/api/rescue?sec=100') // rescue
render();
