import { Server, Socket } from "socket.io";
import Player from "../../types/player";
import Room from "../../types/room";
import { generateRandomInventory } from "../utils";
import { PLAYERS_PER_ROOM } from "../constants/game";


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
      rooms[roomId] = { id: roomId, players: [], offer: null };
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

  socket.on("chatMessage", ({ message }: { message: string }, callback) => {
    console.log(`Received message from ${socket.id}: ${message}`);

    // Find the room of the sender
    const room = Object.values(rooms).find((r) =>
      r.players.some((p) => p.socketId === socket.id)
    );
    const player = room?.players.find((p) => p.socketId === socket.id);

    if (room?.players.length !== PLAYERS_PER_ROOM) {
        callback(false, "The game has not started yet.");
        return;
    }

    if (room) {
      if (!message || message.trim().length === 0) {
        callback(false, "Message cannot be empty.");
        return;
      }

      if (message.length > 500) {
        callback(
          false,
          "Message is too long. Maximum length is 500 characters."
        );
        return;
      }

      // Broadcast the chat message to all players in the room
      io.to(room.id).emit("chatMessage", {
        playerId: player?.id,
        content: message,
        timestamp: Date.now(),
      });

      callback(true);
      return;
    }

    callback(false, "You are not in a room.");
  });

  socket.on("submitOffer", ({ offeredItemIds, receivedItemIds }: { offeredItemIds: string[]; receivedItemIds: string[] }, callback) => {
    console.log(`Received offer from ${socket.id}`);

    // Find the room of the sender
    const room = Object.values(rooms).find((r) =>
      r.players.some((p) => p.socketId === socket.id)
    );
    const player = room?.players.find((p) => p.socketId === socket.id);

    if (room?.players.length !== PLAYERS_PER_ROOM) {
        callback(false, "The game has not started yet.");
        return;
    }
    
    if (!room || !player) {
      callback(false, "You are not in a room.");
      return;
    }

    if (room.offer) {
        callback(false, "There is already an active offer in the room.");
        return;
    }

    const otherPlayer = room.players.find(p => p.id !== player.id);

    if (!otherPlayer) {
      callback(false, "No other player found in the room.");
      return;
    }

    // Validate offered items
    const playerHasAllOfferedItems = offeredItemIds.every(id => 
      player.inventory.some(item => item.id === id)
    );
    
    if (!playerHasAllOfferedItems) {
      callback(false, "You do not have all the items you are offering.");
      return;
    }

    // Validate received items
    const otherPlayerHasAllRequestedItems = receivedItemIds.every(id =>
        otherPlayer.inventory.some(item => item.id === id)
    );

    if (!otherPlayerHasAllRequestedItems) {
      callback(false, "The other player does not have all the items you are requesting.");
      return;
    }

    // Store the offer in the room
    room.offer = {
        playerId: player.id,
        offeredItemIds,
        receivedItemIds
    }

    // Notify the other player about the new offer
    io.to(room.id).emit("newOffer", { offer: { playerId: player.id, offeredItemIds, receivedItemIds } });

    callback(true);
  })

  socket.on("cancelOffer", (callback) => {
    console.log(`Offer cancelled by ${socket.id}`);

    // Find the room of the sender
    const room = Object.values(rooms).find((r) =>
      r.players.some((p) => p.socketId === socket.id)
    );
    const player = room?.players.find((p) => p.socketId === socket.id);

    if (room?.players.length !== PLAYERS_PER_ROOM) {
        callback(false, "The game has not started yet.");
        return;
    }

    if (!room || !player) {
      callback(false, "You are not in a room.");
      return;
    }

    if (!room.offer || room.offer.playerId !== player.id) {
        callback(false, "You have no active offer to cancel.");
        return;
    }

    // Remove the offer from the room
    room.offer = null;

    // Notify the other player about the offer cancellation
    io.to(room.id).emit("offerCancelled");

    callback(true);
  })

  socket.on("answerOffer", ({ accept }: { accept: boolean }, callback) => {
    console.log(`Offer answered by ${socket.id}: ${accept}`);

    // Find the room of the sender
    const room = Object.values(rooms).find((r) =>
      r.players.some((p) => p.socketId === socket.id)
    );
    const player = room?.players.find((p) => p.socketId === socket.id);

    if (room?.players.length !== PLAYERS_PER_ROOM) {
        callback(false, "The game has not started yet.");
        return;
    }

    if (!room || !player) {
        callback(false, "You are not in a room.");
        return;
    }

    if (!room.offer || room.offer.playerId === player.id) {
        callback(false, "There is no active offer to respond to.");
        return;
    }

    // Process the offer response
    if (accept) {
        // If accepted, finalize the trade
        const offeringPlayer = room.players.find(p => p.id === room.offer?.playerId);
        const receivingPlayer = player;

        if (!offeringPlayer || !receivingPlayer) {
            callback(false, "Players involved in the offer not found.");
            return;
        }

        // Validate that both players still have the items
        const offeringPlayerHasAllOfferedItems = room.offer.offeredItemIds.every(id => 
            offeringPlayer.inventory.some(item => item.id === id)
        );
        const receivingPlayerHasAllRequestedItems = room.offer.receivedItemIds.every(id =>
            receivingPlayer.inventory.some(item => item.id === id)
        );

        if (!offeringPlayerHasAllOfferedItems || !receivingPlayerHasAllRequestedItems) {
            room.offer = null;
            io.to(room.id).emit("offerCancelled");
            callback(false, "One of the players no longer has the required items. Offer cancelled.");
            return;
        }

        // Transfer offered items from offeringPlayer to receivingPlayer
        const offeredItems = offeringPlayer.inventory.filter(item => room.offer?.offeredItemIds.includes(item.id));
        offeringPlayer.inventory = offeringPlayer.inventory.filter(item => !room.offer?.offeredItemIds.includes(item.id));
        receivingPlayer.inventory.push(...offeredItems);

        // Transfer requested items from receivingPlayer to offeringPlayer
        const requestedItems = receivingPlayer.inventory.filter(item => room.offer?.receivedItemIds.includes(item.id));
        receivingPlayer.inventory = receivingPlayer.inventory.filter(item => !room.offer?.receivedItemIds.includes(item.id));
        offeringPlayer.inventory.push(...requestedItems);

        io.to(room.id).emit("offerAccepted", {
            offeringPlayerId: offeringPlayer.id,
            receivingPlayerId: receivingPlayer.id,
            offeredInventory: offeringPlayer.inventory,
            receivedInventory: receivingPlayer.inventory
        });
        room.offer = null;
    } else {
        room.offer = null;
        io.to(room.id).emit("offerCancelled");
    }

    callback(true); 
  })
}
