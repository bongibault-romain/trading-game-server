import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config();

console.log(process.env.TEST);

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*", // adjust for security in production
    methods: ["GET", "POST"]
  }
});

// Middleware example
app.get("/", (req, res) => {
  res.send("Socket.IO TypeScript Server is running!");
});

// Import socket handlers
// import registerChatHandlers from "./sockets/chat";
// io.on("connection", (socket) => {
//   console.log(`User connected: ${socket.id}`);
//   registerChatHandlers(io, socket);
// });

export default server;
