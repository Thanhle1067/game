import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for overlay/admin
app.use("/", express.static(path.join(__dirname, "public")));

// In-memory state
let recentEvents = [];
const MAX_EVENTS = 50;
let spinLock = false;

// Helper to broadcast state
function broadcast(event, payload) {
  io.emit(event, payload);
}

// Gift API - trigger spin
// Accepts both GET and POST
app.all("/api/gift", (req, res) => {
  const q = req.method === "GET" ? req.query : req.body;
  let { u, username, amount, type, sec } = q;
  username = username || u || "Anonymous";
  amount = Number(amount || 1);
  type = (type || "gift").toString();
  sec = Number(sec || 0);

  const event = {
    username,
    amount,
    type,
    sec,
    at: Date.now()
  };
  recentEvents.unshift(event);
  recentEvents = recentEvents.slice(0, MAX_EVENTS);

  // Broadcast raw event to any dashboards
  broadcast("giftEvent", event);
  // Trigger a spin for overlays
  broadcast("spinRequest", event);

  res.json({ ok: true, received: event });
});

// Endpoint to test without gifts (manual spin)
app.post("/api/spin", (req, res) => {
  const payload = { username: req.body.username || "Admin", type: "manual", amount: 0, at: Date.now() };
  broadcast("spinRequest", payload);
  res.json({ ok: true });
});

// Fetch recent events
app.get("/api/events", (req, res) => {
  res.json({ ok: true, events: recentEvents });
});

// Socket connections
io.on("connection", (socket) => {
  socket.emit("hello", { message: "Connected to punishment wheel server" });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Overlay: http://localhost:${PORT}/overlay.html`);
  console.log(`Admin:   http://localhost:${PORT}/admin.html`);
  console.log(`Test:    http://localhost:${PORT}/api/gift?u=Tester&type=rescue&amount=1`);
});
