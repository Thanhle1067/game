const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname,'public')));

let seconds = 0;
let lastEventId = 0;
let lastDelta = 0;
let lastType = 'normal'; // 'normal' | 'rescue'
let active = false;

// countdown tick (server-authoritative)
setInterval(() => {
  if (seconds > 0) {
    seconds -= 1;
    if (seconds <= 0) {
      seconds = 0;
      active = false;
    }
  }
}, 1000);

// APIs
app.get('/api/add', (req, res) => {
  const sec = parseInt(req.query.sec || '10', 10);
  const s = Number.isFinite(sec) ? sec : 10;
  seconds += s;
  lastDelta = s;
  lastType = 'normal';
  lastEventId += 1;
  active = true;
  res.json({ ok: true, seconds, lastDelta, lastType, lastEventId });
});

app.get('/api/rescue', (req, res) => {
  const sec = parseInt(req.query.sec || '10', 10);
  const s = Number.isFinite(sec) ? sec : 10;
  const before = seconds;
  seconds = Math.max(0, seconds - s);
  lastDelta = seconds - before; // negative or zero
  lastType = 'rescue';
  lastEventId += 1;
  if (seconds === 0) active = false;
  res.json({ ok: true, seconds, lastDelta, lastType, lastEventId });
});

app.get('/api/state', (req, res) => {
  res.json({ ok: true, seconds, lastDelta, lastType, lastEventId, active });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on ' + PORT));
