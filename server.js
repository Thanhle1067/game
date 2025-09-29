import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

function makeRoom() {
  return {
    remaining: 0,
    lastUpdate: Date.now(),
    clients: new Set(),
    ticker: null,
  };
}
const rooms = new Map();

function getRoom(u) {
  if (!rooms.has(u)) rooms.set(u, makeRoom());
  return rooms.get(u);
}

function broadcast(u, data) {
  const room = getRoom(u);
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of room.clients) {
    try { res.write(payload); } catch { /* ignore */ }
  }
}

function startTicker(u) {
  const room = getRoom(u);
  if (room.ticker) return;
  room.ticker = setInterval(() => {
    if (room.remaining > 0) {
      room.remaining -= 1;
      broadcast(u, {type:"tick", remaining: room.remaining});
    }
  }, 1000);
}

app.get("/api/stream", (req,res) => {
  const u = (req.query.u || "default").toString();
  const init = parseInt(req.query.init || "0", 10);
  const room = getRoom(u);
  if (init && room.remaining === 0) {
    room.remaining = init;
  }
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*"
  });
  res.write(`event: hello\ndata: ${JSON.stringify({u, remaining: room.remaining})}\n\n`);

  room.clients.add(res);
  startTicker(u);

  req.on("close", () => {
    room.clients.delete(res);
  });
});

app.get("/api/state", (req,res) => {
  const u = (req.query.u || "default").toString();
  const room = getRoom(u);
  res.json({u, remaining: room.remaining});
});

// Add time (gift)
app.get("/api/gift", (req,res) => {
  const u = (req.query.u || "default").toString();
  const sec = parseInt(req.query.sec || "5", 10); // default +5
  const room = getRoom(u);
  room.remaining += sec;
  broadcast(u, {type:"gift", delta: sec, remaining: room.remaining});
  startTicker(u);
  res.json({ok:true, u, remaining: room.remaining});
});

// Rescue (subtract)
app.get("/api/rescue", (req,res) => {
  const u = (req.query.u || "default").toString();
  const sec = parseInt(req.query.sec || "5", 10); // default -5
  const room = getRoom(u);
  room.remaining = Math.max(0, room.remaining - sec);
  broadcast(u, {type:"rescue", delta: -sec, remaining: room.remaining});
  startTicker(u);
  res.json({ok:true, u, remaining: room.remaining});
});

// Backward compatibility with previous 'type=rescue' param
app.get("/api/gift-route", (req,res)=>{
  const type = req.query.type;
  if (type === "rescue") return app._router.handle(req,res,()=>{});
  res.json({err: "use /api/gift or /api/rescue"});
});

// Simple debug viewer
app.get("/debug", (req,res) => {
  const u = (req.query.u || "default").toString();
  res.send(`<!doctype html>
  <meta charset="utf-8"/>
  <title>Debug - ${u}</title>
  <style>
    body{font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0b0b0b;color:#eee;padding:20px}
    .log{white-space:pre-wrap;background:#111;border:1px solid #222;padding:12px;border-radius:8px;height:60vh;overflow:auto}
    a{color:#7fd7ff}
    code{background:#222;padding:2px 6px;border-radius:6px}
  </style>
  <h1>🔌 Webhook Debug: <code>${u}</code></h1>
  <p>Use these URLs (GET):</p>
  <ul>
    <li>Add +5s (gift): <code>/api/gift?u=${u}</code></li>
    <li>Add custom seconds: <code>/api/gift?u=${u}&sec=15</code></li>
    <li>Rescue -5s: <code>/api/rescue?u=${u}</code></li>
    <li>Rescue custom: <code>/api/rescue?u=${u}&sec=15</code></li>
  </ul>
  <p>OBS Overlay: <code>/overlay.html?u=${u}</code></p>
  <div class="log" id="log"></div>
  <script>
    const u = "${u}";
    const log = (m)=>{
      const el = document.getElementById('log');
      const at = new Date().toLocaleTimeString();
      el.textContent += "\\n["+at+"] "+m;
      el.scrollTop = el.scrollHeight;
    };
    const es = new EventSource('/api/stream?u='+encodeURIComponent(u));
    es.onmessage = e => log(e.data);
    es.addEventListener('hello', e => log("hello "+e.data));
  </script>
  `);
});

app.listen(PORT, () => {
  console.log("Server running on http://localhost:"+PORT);
});
