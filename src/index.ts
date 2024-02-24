import { randomUUID as uuidv4 } from 'crypto';
import { WebSocket, WebSocketServer } from 'ws';
import { handleCommands } from './commands/commands';
import { parseCommand, parseData } from './utils/utils';

export const wss = new WebSocketServer({
  port: 3000,
});

wss.on('connection', (ws: WebSocket) => {
  const userId = uuidv4();
  (ws as any).id = userId;

  console.log('connected: ', userId);

  ws.on('error', console.error);

  ws.on('message', (rawData: string) => {
    const parsedData = JSON.parse(rawData);
    // console.log('received: ', parsedData);

    const command = parseCommand(parsedData);
    const data = parsedData.data ? parseData(parsedData.data) : null;

    handleCommands(ws, command, data, userId);
  });
});
