import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import registerGameHandlers from "./sockets/game";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: [],
  }
});

app.get("/", (req, res) => {
  res.send("Socket.IO TypeScript Server is running!");
});

io.on("connection", (socket) => {
  registerGameHandlers(io, socket);
});

export default server;
