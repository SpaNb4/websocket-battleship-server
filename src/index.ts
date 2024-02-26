import { randomUUID as uuidv4 } from 'crypto';
import { WebSocketServer } from 'ws';
import { handleCommands } from './commands/commands';
import { updateUser } from './services/userService';
import { CustomWebSocket, CustomWebSocketServer } from './types/websocket';
import { logReceivedData, parseCommand, parseData } from './utils/utils';
// import { getAllRooms, removeRoomByUserId } from './controllers/roomController';
// import { removeGameByUserId } from './services/gameService';

export const wss = new WebSocketServer({
  port: 3000,
}) as CustomWebSocketServer;

wss.on('connection', (ws: CustomWebSocket) => {
  const userId = uuidv4();

  // if it's a bot, set id to it
  if (ws.protocol) {
    ws.id = ws.protocol;
  } else {
    ws.id = userId;
  }

  console.log('connected: ', userId);

  ws.on('close', () => {
    console.log('disconnected: ', userId);

    updateUser(userId, { isLoggedIn: false });

    // // Remove user from room if it's in one?
    // removeRoomByUserId(userId);

    // // Remove user from game if it's in one?
    // removeGameByUserId(userId);

    // User who leaves loses the game
    // addWinner(userId);

    // getAllRooms();
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
