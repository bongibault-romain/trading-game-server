import { Socket } from "socket.io";

export default interface Player {
  id: string;
  nickname: string;
  socketId: string;
  inventory: { id: string; name: string; }[];
}