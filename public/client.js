/* global io */
const socket = io();
const url = new URL(window.location.href);
const params = url.searchParams;

const punishments = (params.get("segments") || "Hít đất 10 cái,Uống nước 1 ly,Nhảy 30s,Múa 1 bài,Hát 1 câu,Kể chuyện cười,Chụp ảnh hài,Squat 15 cái,Đứng im 30s,IM LẶNG 30 GIÂY").split(",").map(s=>s.trim()).filter(Boolean);

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
let width, height, radius;
let spinAngle = 0;
let spinVelocity = 0;
let spinning = false;
let currentUser = null;
const lastUserEl = document.querySelector(".username");
const resultEl = document.querySelector(".result");
const pointerEl = document.querySelector(".pointer");
const spinBtn = document.getElementById("spinBtn");
const fullscreenBtn = document.getElementById("fsBtn");
const autoSpin = params.get("autospin") !== "0"; // default true

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const smaller = Math.min(w, h);
  const scale = Math.max(0.6, Math.min(1.0, smaller / 900));
  const wrap = document.querySelector(".canvas-wrap");
  wrap.style.transform = `scale(${scale})`;

  width = 800;
  height = 800;
  radius = 350;
  canvas.width = width;
  canvas.height = height;
  draw();
}
window.addEventListener("resize", resize);
resize();

function drawWheelSegments() {
  const n = punishments.length;
  const anglePer = (Math.PI * 2) / n;
  for (let i = 0; i < n; i++) {
    const start = i * anglePer + spinAngle;
    const end = start + anglePer;
    ctx.beginPath();
    ctx.moveTo(width/2, height/2);
    ctx.arc(width/2, height/2, radius, start, end);
    ctx.closePath();
    // alternating fill (no specific colors per instructions would apply to charts; here ok to use defaults)
    ctx.fillStyle = i % 2 ? "#4f46e5" : "#22c55e";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,.6)";
    ctx.stroke();

    // Text
    const mid = start + (end - start)/2;
    ctx.save();
    ctx.translate(width/2 + Math.cos(mid) * (radius - 90), height/2 + Math.sin(mid) * (radius - 90));
    ctx.rotate(mid + Math.PI/2);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px Inter, system-ui, sans-serif";
    const text = punishments[i];
    // wrap text
    wrapText(ctx, text, 0, 0, 160, 22);
    ctx.restore();
  }
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let ty = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      context.fillText(line, x - context.measureText(line).width/2, ty);
      line = words[n] + ' ';
      ty += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line, x - context.measureText(line).width/2, ty);
}

function drawCenter() {
  ctx.beginPath();
  ctx.arc(width/2, height/2, 70, 0, Math.PI*2);
  ctx.fillStyle = "#111827";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "700 20px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SPIN", width/2, height/2 + 6);
}

function draw() {
  ctx.clearRect(0,0,width,height);
  // outer glow
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.35)";
  ctx.shadowBlur = 30;
  drawWheelSegments();
  ctx.restore();
  drawCenter();
  // pointer is separate DOM
}

function tick() {
  if (spinning) {
    spinAngle += spinVelocity;
    spinVelocity *= 0.991; // friction
    if (spinVelocity < 0.005) {
      spinning = false;
      spinVelocity = 0;
      onSpinEnd();
    }
    draw();
  }
  requestAnimationFrame(tick);
}
tick();

function spin(extraSpins = 4, duration = 4000) {
  if (spinning) return;
  // random target segment
  const n = punishments.length;
  const targetIndex = Math.floor(Math.random() * n);
  const anglePer = (Math.PI * 2) / n;
  const currentRotation = (spinAngle % (Math.PI*2) + Math.PI*2) % (Math.PI*2);
  const targetAngle = (Math.PI * 3/2) - (targetIndex * anglePer) - (anglePer/2); // pointer at top
  let delta = targetAngle - currentRotation;
  if (delta < 0) delta += Math.PI*2;
  const totalRotation = delta + extraSpins * Math.PI*2;

  const frames = duration / 16;
  spinVelocity = totalRotation / frames;
  spinning = true;
  resultEl.dataset.target = targetIndex;
  resultEl.textContent = "ĐANG QUAY...";
}

function onSpinEnd() {
  const n = punishments.length;
  const anglePer = (Math.PI * 2) / n;
  const currentRotation = (spinAngle % (Math.PI*2) + Math.PI*2) % (Math.PI*2);
  const selectedIndex = Math.floor((n - ((currentRotation - Math.PI/2) / anglePer) % n) % n);
  const selected = punishments[selectedIndex];
  resultEl.textContent = selected;
}

// SOCKET EVENTS
socket.on("hello", () => {});

socket.on("spinRequest", (payload) => {
  currentUser = payload.username || "Anonymous";
  lastUserEl.textContent = currentUser;
  if (autoSpin) spin();
});

// Buttons
spinBtn?.addEventListener("click", () => spin());
fullscreenBtn?.addEventListener("click", () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
});
