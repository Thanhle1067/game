const express = require('express');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname,'public')));

let seconds = 0, lastEventId = 0, lastDelta = 0, lastType = 'normal', active = false;

setInterval(()=>{ if(seconds>0){ seconds--; if(seconds<=0){ seconds=0; active=false; } } },1000);

function pickSeconds(req, def = 10){
  const q = req.query || {};
  const b = req.body  || {};
  let s = q.sec ?? b.sec ?? b.amount ?? b.repeatCount ?? b.value1 ?? b.value2;
  s = parseInt(String(s || def), 10);
  return Number.isFinite(s) && s > 0 ? s : def;
}

app.all('/api/add',(req,res)=>{
  const s = pickSeconds(req, 10);
  seconds += s; lastDelta = s; lastType='normal'; lastEventId++; active=true;
  res.json({ok:true,method:req.method,seconds,lastDelta,lastType,lastEventId,active});
});

app.all('/api/rescue',(req,res)=>{
  const s = pickSeconds(req, 10);
  const before = seconds; seconds = Math.max(0, seconds - s);
  lastDelta = seconds - before; lastType='rescue'; lastEventId++; if(seconds===0) active=false;
  res.json({ok:true,method:req.method,seconds,lastDelta,lastType,lastEventId,active});
});

app.get('/api/state',(req,res)=>res.json({ok:true,seconds,lastDelta,lastType,lastEventId,active}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('Server on '+PORT));
