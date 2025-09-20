import { Server, Socket } from "socket.io";
import Player from "../../types/player";
import Room from "../../types/room";

const PLAYERS_PER_ROOM = 2;

const rooms: Record<string, Room> = {};

export default function registerGameHandlers(io: Server, socket: Socket) {
  socket.on("joinGame", ({ nickname }: { nickname: string }) => {
    console.log(
      `Player ${nickname} joined the game with socket ID: ${socket.id}`
    );

    // Place the player in a room
    // Find a room with available space or create
    let roomId = Object.keys(rooms).find(
      (id) => rooms[id].players.length < PLAYERS_PER_ROOM
    );

    if (!roomId) {
      // Create a new room
      roomId = crypto.randomUUID();
      rooms[roomId] = { id: roomId, players: [] };
    }

    const player: Player = {
      id: crypto.randomUUID(),
      nickname,
      inventory: [],
    };

    rooms[roomId].players.push(player);

    socket.join(roomId);
    socket.emit("joinedRoom", { roomId, player });
    
    console.log(`Player ${nickname} joined room ${roomId}`);
    
    if (rooms[roomId].players.length === PLAYERS_PER_ROOM) {
      // Notify players that the game is starting
      io.to(roomId).emit("gameStarting", {
        players: rooms[roomId].players,
      });
    }
  });
}
