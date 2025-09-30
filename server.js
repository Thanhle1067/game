const express = require('express');
const path = require('path');
const app = express();
app.use(express.static(path.join(__dirname,'public')));

let seconds = 0, lastEventId = 0, lastDelta = 0, lastType = 'normal', active = false;
setInterval(()=>{ if(seconds>0){ seconds--; if(seconds<=0){ seconds=0; active=false; } } },1000);

app.get('/api/add',(req,res)=>{ const s=parseInt(req.query.sec||'10',10)||10; seconds+=s; lastDelta=s; lastType='normal'; lastEventId++; active=true; res.json({ok:true,seconds,lastDelta,lastType,lastEventId,active}); });
app.get('/api/rescue',(req,res)=>{ const s=parseInt(req.query.sec||'10',10)||10; const b=seconds; seconds=Math.max(0,seconds-s); lastDelta=seconds-b; lastType='rescue'; lastEventId++; if(seconds===0) active=false; res.json({ok:true,seconds,lastDelta,lastType,lastEventId,active}); });
app.get('/api/state',(req,res)=>res.json({ok:true,seconds,lastDelta,lastType,lastEventId,active}));

const PORT=process.env.PORT||3000; app.listen(PORT,()=>console.log('Server on '+PORT));
