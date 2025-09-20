import { Server, Socket } from "socket.io";
import Player from "../../types/player";
import Room from "../../types/room";
import { generateRandomInventory } from "../utils";

const PLAYERS_PER_ROOM = 2;

const rooms: Record<string, Room> = {};

export default function registerGameHandlers(io: Server, socket: Socket) {
  socket.on("disconnect", () => {
    console.log(`Socket ${socket.id} disconnected`);

    // Remove player from rooms

    // TODO: Change the data structure for more efficient for example
    // a HashMap of socketId to roomId/player
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(
        (p) => p.socketId === socket.id
      );

      if (playerIndex !== -1) {
        // remove the room and disconnect all players
        room.players.forEach((p) => {
          io.sockets.sockets.get(p.socketId)?.leave(roomId);
          io.sockets.sockets.get(p.socketId)?.emit("roomClosed");
          io.sockets.sockets.get(p.socketId)?.disconnect();
        });
        delete rooms[roomId];
        console.log(`Room ${roomId} closed due to player disconnect`);
        break;
      }
    }

    console.log(
      `Player with socket ID ${socket.id} removed from rooms and disconnected.`
    );
  });

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
      socketId: socket.id,
      nickname,
      inventory: generateRandomInventory(),
    };

    rooms[roomId].players.push(player);

    socket.join(roomId);
    socket.emit("joinedRoom", { roomId, player }, () => {
      console.log(`Player ${nickname} joined room ${roomId}`);

      if (rooms[roomId].players.length === PLAYERS_PER_ROOM) {
        // Notify players that the game is starting
        io.to(roomId).emit("gameStarting", {
          players: rooms[roomId].players,
        });
      }
    });
  });
}
