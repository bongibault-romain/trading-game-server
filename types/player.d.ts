import { Socket } from "socket.io";

export default interface Player {
  id: string;
  nickname: string;
  inventory: string[];
  socket: Socket;
}