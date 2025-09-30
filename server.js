const express = require('express');
const path = require('path');
const app = express();

// --- middleware để nhận POST từ TikFinity ---
app.use(express.urlencoded({ extended: true })); // form-data, x-www-form-urlencoded
app.use(express.json());                          // application/json
// ------------------------------------------------

app.use(express.static(path.join(__dirname,'public')));

let seconds = 0, lastEventId = 0, lastDelta = 0, lastType = 'normal', active = false;

// đếm ngược server-side
setInterval(()=>{ if(seconds>0){ seconds--; if(seconds<=0){ seconds=0; active=false; } } },1000);

// helper: đọc "sec" từ nhiều nguồn TikFinity
function pickSeconds(req, def = 10) {
  const q = req.query || {};
  const b = req.body  || {};
  // ưu tiên theo thứ tự: query.sec -> body.sec -> amount -> repeatCount -> value1 -> value2
  let s = q.sec ?? b.sec ?? b.amount ?? b.repeatCount ?? b.value1 ?? b.value2;
  s = parseInt(String(s || def), 10);
  return Number.isFinite(s) && s > 0 ? s : def;
}

// -------- GET API (giữ nguyên) ----------
app.get('/api/add',(req,res)=>{
  const s = pickSeconds(req, 10);
  seconds += s; lastDelta = s; lastType='normal'; lastEventId++; active=true;
  res.json({ok:true,seconds,lastDelta,lastType,lastEventId,active});
});

app.get('/api/rescue',(req,res)=>{
  const s = pickSeconds(req, 10);
  const before = seconds; seconds = Math.max(0, seconds - s);
  lastDelta = seconds - before; lastType='rescue'; lastEventId++; if(seconds===0) active=false;
  res.json({ok:true,seconds,lastDelta,lastType,lastEventId,active});
});

app.get('/api/state',(req,res)=>res.json({ok:true,seconds,lastDelta,lastType,lastEventId,active}));

// -------- NEW: Webhook POST cho TikFinity ----------
app.post('/hook/add',(req,res)=>{
  const s = pickSeconds(req, 10);
  seconds += s; lastDelta = s; lastType='normal'; lastEventId++; active=true;
  res.json({ok:true,via:'webhook-add',received:req.body,seconds,lastDelta,lastType,lastEventId,active});
});

app.post('/hook/rescue',(req,res)=>{
  const s = pickSeconds(req, 10);
  const before = seconds; seconds = Math.max(0, seconds - s);
  lastDelta = seconds - before; lastType='rescue'; lastEventId++; if(seconds===0) active=false;
  res.json({ok:true,via:'webhook-rescue',received:req.body,seconds,lastDelta,lastType,lastEventId,active});
});
// ---------------------------------------------------

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('Server on '+PORT));
