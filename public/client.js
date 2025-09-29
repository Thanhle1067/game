const socket = io();
let seconds = 0;
let barsShown = false;
const barsEl = document.getElementById('bars');
const counterEl = document.getElementById('counter');
const bonusEl = document.getElementById('bonus');
const ting = document.getElementById('ting');
const boom = document.getElementById('boom');
const bombEl = document.getElementById('bomb');

function render(){ counterEl.textContent = String(Math.max(0, seconds)); }
function showBars(){ if (!barsShown){ barsShown=true; barsEl.classList.add('show'); } }
function hideBars(){ barsEl.classList.remove('show'); barsShown=false; }
function flash(text){ bonusEl.textContent = text; bonusEl.classList.add('show'); setTimeout(()=>bonusEl.classList.remove('show'), 900); }

function dropBomb(){
  bombEl.className = 'bomb';
  setTimeout(()=> bombEl.classList.add('drop'), 20);
  setTimeout(()=> { bombEl.classList.add('explode'); try { boom.currentTime = 0; boom.play(); } catch(e){} }, 1200);
}

setInterval(()=>{ if (seconds>0){ seconds -= 1; if (seconds<=0){ seconds=0; hideBars(); } render(); } },1000);

socket.on('gift', data => {
  const amount = parseInt(data?.amount || 1, 10);
  const isRescue = data?.type === 'rescue';
  const hasSec = (data?.sec !== undefined && data.sec !== null && data.sec !== '');
  let delta = hasSec ? parseInt(data.sec, 10) : 10 * (isNaN(amount) ? 1 : amount);
  if (isRescue && delta > 0) delta = -delta;

  if (isRescue) dropBomb();

  seconds = Math.max(0, seconds + delta);
  if (delta > 0){ flash('+'+delta+'s'); try{ ting.currentTime = 0; ting.play(); }catch(e){} }
  else if (delta < 0){ flash(delta+'s'); }
  if (seconds > 0) showBars(); else hideBars();
  render();
});

socket.on('hello', ()=>console.log('connected'));
render();