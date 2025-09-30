const socket=io();
let seconds=0,barsShown=false,zeroBurstDone=false,stage=1;
const baseBars=document.getElementById('bars'),root=document.getElementById('root');
const counterEl=document.getElementById('counter'),bonusEl=document.getElementById('bonus');
const ting=document.getElementById('ting'),boom=document.getElementById('boom'),clack=document.getElementById('clack'),bombEl=document.getElementById('bomb');
const fx=document.getElementById('fx'),ctx=fx.getContext('2d');function resize(){fx.width=innerWidth;fx.height=innerHeight}addEventListener('resize',resize);resize();
let particles=[];function spawn(x,y,c=60){for(let i=0;i<c;i++){const a=Math.random()*Math.PI*2,s=2+Math.random()*4;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:40+Math.random()*20,age:0})}}(function loop(){ctx.clearRect(0,0,fx.width,fx.height);particles=particles.filter(p=>p.age<p.life);for(const p of particles){p.age++;p.vy+=0.04;p.x+=p.vx;p.y+=p.vy;const t=1-p.age/p.life;ctx.globalAlpha=t;ctx.fillStyle='white';ctx.fillRect(p.x,p.y,3,3)}requestAnimationFrame(loop)})();function burst(){const cx=fx.width/2,cy=fx.height*0.4;spawn(cx,cy,80);setTimeout(()=>spawn(cx-150,cy+40,60),120);setTimeout(()=>spawn(cx+160,cy+10,60),180)}
const params=new URLSearchParams(location.search);const T2=parseInt(params.get('t2')||'1000',10);const T3=parseInt(params.get('t3')||'3000',10);
const BARS_L1='./bars-default.png';const BARS_L23='./bars-gold.png';
function swapBars(img){const incoming=document.createElement('div');incoming.className='bars next';incoming.style.backgroundImage=`url(${img})`;root.appendChild(incoming);incoming.addEventListener('animationend',()=>{baseBars.style.backgroundImage=`url(${img})`;root.removeChild(incoming)},{once:true});}
function showBars(){if(!barsShown){barsShown=true;baseBars.classList.add('show');}}
function hideBars(){baseBars.classList.remove('show');barsShown=false;}
function render(){counterEl.textContent=String(Math.max(0,seconds));}
function flash(t){bonusEl.textContent=t;bonusEl.classList.add('show');setTimeout(()=>bonusEl.classList.remove('show'),900)}
function shake(){baseBars.classList.add('shake');setTimeout(()=>baseBars.classList.remove('shake'),650)}
function bomb(){bombEl.className='bomb';setTimeout(()=>bombEl.classList.add('drop'),20);setTimeout(()=>{bombEl.classList.add('explode');try{boom.currentTime=0;boom.play();}catch(e){}},1200)}
function applyStage(n){if(stage===n)return;stage=n;const img=(stage>=2)?BARS_L23:BARS_L1;swapBars(img);}
function updateStage(){if(seconds>=T3)applyStage(3);else if(seconds>=T2)applyStage(2);else applyStage(1);}
setInterval(()=>{if(seconds>0){if(!barsShown)showBars();seconds-=1;if(seconds<=0){seconds=0;hideBars();if(!zeroBurstDone){zeroBurstDone=true;burst();}}updateStage();render();}},1000);
socket.on('gift',d=>{const isRescue=d?.type==='rescue';const hasSec=d?.sec!==undefined&&d.sec!==null&&d.sec!=='';let delta=hasSec?parseInt(d.sec,10):10*parseInt(d?.amount||1,10);if(isRescue&&delta>0)delta=-delta;
 if(isRescue){bomb();shake();try{clack.currentTime=0;clack.play();}catch(e){}}const wasPos=seconds>0;seconds=Math.max(0,seconds+delta);
 if(delta>0){flash('+'+delta+'s');try{ting.currentTime=0;ting.play();}catch(e){};zeroBurstDone=false;}else if(delta<0){flash(delta+'s');}
 if(seconds>0)showBars();else{hideBars();if(wasPos&&seconds===0){burst();}}updateStage();render();});
socket.on('hello',()=>console.log('connected'));baseBars.style.backgroundImage=`url(${BARS_L1})`;render();