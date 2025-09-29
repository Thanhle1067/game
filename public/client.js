const socket = io();
let seconds = 0;
let barsShown = false;
let zeroBurstDone = false;

const barsEl = document.getElementById('bars');
const counterEl = document.getElementById('counter');
const bonusEl = document.getElementById('bonus');
const ting = document.getElementById('ting');
const boom = document.getElementById('boom');
const clack = document.getElementById('clack');
const bombEl = document.getElementById('bomb');

const fx = document.getElementById('fx');
const ctx = fx.getContext('2d');
function resizeCanvas(){ fx.width = window.innerWidth; fx.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas); resizeCanvas();

let particles = [];
function spawnBurst(x, y, count=60){
  for (let i=0;i<count;i++){
    const ang = Math.random()*Math.PI*2;
    const spd = 2 + Math.random()*4;
    particles.push({ x, y, vx: Math.cos(ang)*spd, vy: Math.sin(ang)*spd, life: 40 + Math.random()*20, age: 0 });
  }
}
function updateFx(){
  ctx.clearRect(0,0,fx.width,fx.height);
  particles = particles.filter(p => p.age < p.life);
  for (const p of particles){
    p.age++;
    p.vy += 0.04;
    p.x += p.vx;
    p.y += p.vy;
    const t = 1 - p.age/p.life;
    ctx.globalAlpha = t;
    ctx.fillStyle = 'white';
    ctx.fillRect(p.x, p.y, 3, 3);
  }
  requestAnimationFrame(updateFx);
}
updateFx();
function fireworksBurst(){
  const cx = fx.width/2, cy = fx.height*0.4;
  spawnBurst(cx, cy, 80);
  setTimeout(()=> spawnBurst(cx-150, cy+40, 60), 120);
  setTimeout(()=> spawnBurst(cx+160, cy+10, 60), 180);
}

function render(){ counterEl.textContent = String(Math.max(0, seconds)); }
function showBars(){ if (!barsShown){ barsShown=true; barsEl.classList.add('show'); } }
function hideBars(){ barsEl.classList.remove('show'); barsShown=false; }
function flash(text){ bonusEl.textContent = text; bonusEl.classList.add('show'); setTimeout(()=>bonusEl.classList.remove('show'), 900); }
function shakeBars(){ barsEl.classList.add('shake'); setTimeout(()=> barsEl.classList.remove('shake'), 650); }

function dropBomb(){
  bombEl.className = 'bomb';
  setTimeout(()=> bombEl.classList.add('drop'), 20);
  setTimeout(()=> { bombEl.classList.add('explode'); try { boom.currentTime = 0; boom.play(); } catch(e){} }, 1200);
}

setInterval(()=>{
  if (seconds > 0) {
    if (!barsShown) showBars();
    seconds -= 1;
    if (seconds <= 0) { seconds = 0; hideBars(); if (!zeroBurstDone){ zeroBurstDone = true; fireworksBurst(); } }
    render();
  }
}, 1000);

socket.on('gift', data => {
  const amount = parseInt(data?.amount || 1, 10);
  const isRescue = data?.type === 'rescue';
  const hasSec = (data?.sec !== undefined && data.sec !== null && data.sec !== '');
  let delta = hasSec ? parseInt(data.sec, 10) : 10 * (isNaN(amount) ? 1 : amount);
  if (isRescue && delta > 0) delta = -delta;

  if (isRescue) { dropBomb(); shakeBars(); try { clack.currentTime = 0; clack.play(); } catch(e){} }

  const wasPositive = seconds > 0;
  seconds = Math.max(0, seconds + delta);
  if (delta > 0){ flash('+'+delta+'s'); try{ ting.currentTime = 0; ting.play(); }catch(e){}; zeroBurstDone = false; }
  else if (delta < 0){ flash(delta+'s'); }

  if (seconds > 0) showBars(); else { hideBars(); if (wasPositive && seconds===0){ fireworksBurst(); } }
  render();
});

socket.on('hello', ()=>console.log('connected'));
render();
