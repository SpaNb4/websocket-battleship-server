import { randomUUID as uuidv4 } from 'crypto';
import { WebSocketServer } from 'ws';
import { handleCommands } from './commands/commands';
import { getAllRooms, removeRoomById } from './controllers/roomController';
import { addWinner } from './controllers/winnerController';
import { getEnemyPlayer, getGameByPlayerId, removeGameById } from './services/gameService';
import { getRoomById, getRoomByUserId, updateRoom } from './services/roomService';
import { updateUser } from './services/userService';
import { Command } from './types/command';
import { FinishResponse } from './types/response';
import { CustomWebSocket, CustomWebSocketServer } from './types/websocket';
import { MessagesForTwoPlayers, broadcastToAllInGame, logReceivedData, parseCommand, parseData } from './utils/utils';

export const wss = new WebSocketServer({
  port: 3000,
}) as CustomWebSocketServer;

wss.on('connection', (ws: CustomWebSocket) => {
  const userId = uuidv4();

  // If it's a bot
  if (ws.protocol) {
    ws.id = ws.protocol;
  } else {
    ws.id = userId;
  }

  console.log('connected: ', userId);

  ws.on('close', () => {
    handleDisconnect(ws, userId);
  });

  ws.on('error', console.error);

  ws.on('message', (message: string) => {
    const parsedData = JSON.parse(message);

    logReceivedData(parsedData);

    const command = parseCommand(parsedData);
    const data = parsedData.data ? parseData(parsedData.data) : null;

    handleCommands(ws, command, data, userId);
  });
});

const handleDisconnect = (ws: CustomWebSocket, userId: string) => {
  console.log('disconnected: ', userId);

  updateUser(userId, { isLoggedIn: false });

  const room = getRoomByUserId(userId);

  if (room) {
    // Remove user from room if it's in one
    updateRoom(room.roomId, { roomUsers: room.roomUsers.filter((user) => user.index !== userId) });

    // Check if room is empty and remove it
    if (getRoomById(room.roomId)?.roomUsers.length === 0) {
      removeRoomById(room.roomId);
    }
  }

  getAllRooms();

  // User who leaves loses the game
  const game = getGameByPlayerId(userId);
  const winner = getEnemyPlayer(userId);

  if (winner && game) {
    const response: MessagesForTwoPlayers<FinishResponse> = {
      player1: {
        type: Command.Finish,
        data: JSON.stringify({ winPlayer: winner.userId }),
        id: 0,
      },
      player2: {
        type: Command.Finish,
        data: JSON.stringify({ winPlayer: winner.userId }),
        id: 0,
      },
    };

    broadcastToAllInGame(wss.clients, response, game.gameId);
    addWinner(winner.userId);
    removeGameById(game.gameId);
  }
};
