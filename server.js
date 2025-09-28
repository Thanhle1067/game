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
const io = new SocketIOServer(server, { cors: { origin: "*"} });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/", express.static(path.join(__dirname, "public")));

let recentEvents = [];
let currentSegments = [
  "Hít đất 10 cái","Uống nước 1 ly","Nhảy 30s","Múa 1 bài","Hát 1 câu",
  "Kể chuyện cười","Chụp ảnh hài","Squat 15 cái","Đứng im 30s","IM LẶNG 30 GIÂY"
];

app.get("/api/config",(req,res)=>res.json({segments:currentSegments}));
app.post("/api/config",(req,res)=>{
  const {segments}=req.body;
  if(Array.isArray(segments)&&segments.length){
    currentSegments=segments.map(s=>String(s).trim()).filter(Boolean);
    io.emit("segmentsUpdated",{segments:currentSegments});
    return res.json({ok:true,segments:currentSegments});
  }
  res.status(400).json({ok:false});
});

app.all("/api/gift",(req,res)=>{
  const q=req.method==="GET"?req.query:req.body;
  const username=q.username||q.u||"Anonymous";
  const event={username,amount:Number(q.amount||1),type:String(q.type||"gift"),at:Date.now()};
  recentEvents.unshift(event); recentEvents=recentEvents.slice(0,50);
  io.emit("spinRequest",event);
  res.json({ok:true,received:event});
});

app.post("/api/spin",(req,res)=>{
  io.emit("spinRequest",{username:req.body.username||"Admin"});
  res.json({ok:true});
});

const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log(`http://localhost:${PORT}`));
