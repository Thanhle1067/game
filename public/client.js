const socket = io();
const container=document.querySelector(".container");
const usernameEl=document.querySelector(".username");
const resultEl=document.querySelector(".result");
const canvas=document.getElementById("wheel");
const ctx=canvas.getContext("2d");
let spinAngle=0,spinVel=0,spinning=false,segs=["Hít đất 10 cái","Uống nước 1 ly","Nhảy 30s"];

function draw(){
  ctx.clearRect(0,0,800,800);
  const angle=2*Math.PI/segs.length;
  segs.forEach((s,i)=>{
    ctx.beginPath();
    ctx.moveTo(400,400);
    ctx.arc(400,400,350,spinAngle+i*angle,spinAngle+(i+1)*angle);
    ctx.fillStyle=i%2?"#4f46e5":"#22c55e";
    ctx.fill();
    ctx.save();
    ctx.translate(400+Math.cos(spinAngle+i*angle+angle/2)*260,400+Math.sin(spinAngle+i*angle+angle/2)*260);
    ctx.rotate(spinAngle+i*angle+angle/2+Math.PI/2);
    ctx.fillStyle="#fff";
    ctx.fillText(s,-ctx.measureText(s).width/2,0);
    ctx.restore();
  });
}
function tick(){
  if(spinning){spinAngle+=spinVel;spinVel*=0.98;if(spinVel<0.002){spinning=false;endSpin();}draw();}
  requestAnimationFrame(tick);
}
function startSpin(){
  if(spinning)return;
  spinVel=0.3;spinning=true;
}
function endSpin(){
  const n=segs.length;
  const idx=Math.floor(n-((spinAngle%(2*Math.PI))/(2*Math.PI))*n)%n;
  resultEl.textContent=segs[idx];
}
socket.on("spinRequest",d=>{
  usernameEl.textContent=d.username;
  container.classList.remove("hidden");
  setTimeout(()=>container.classList.add("hidden"),10000);
  startSpin();
});
socket.on("segmentsUpdated",d=>{segs=d.segments;draw();});
draw();tick();
