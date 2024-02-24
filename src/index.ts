import { randomUUID as uuidv4 } from 'crypto';
import { WebSocket, WebSocketServer } from 'ws';
import { handleCommands } from './commands/commands';
import { parseCommand, parseData } from './utils/utils';
// import { getAllRooms, removeRoomByUserId } from './controllers/roomController';
// import { removeGameByUserId } from './services/gameService';

export const wss = new WebSocketServer({
  port: 3000,
});

wss.on('connection', (ws: WebSocket) => {
  const userId = uuidv4();
  (ws as any).id = userId;

  console.log('connected: ', userId);

  ws.on('close', () => {
    console.log('disconnected: ', userId);

    // // Remove user from room if it's in one
    // removeRoomByUserId(userId);

    // // Remove user from game if it's in one
    // removeGameByUserId(userId);

    // getAllRooms();
  });

  ws.on('error', console.error);

  ws.on('message', (message: string) => {
    const parsedData = JSON.parse(message);

    // logReceivedData(rawData)
    // console.log('received: ', parsedData);

    const command = parseCommand(parsedData);
    const data = parsedData.data ? parseData(parsedData.data) : null;

    handleCommands(ws, command, data, userId);
  });
});
