// import { randomUUID as uuidv4 } from 'crypto';
import { WebSocket } from 'ws';
import { handleCommands } from '../commands/commands';
import { parseCommand, parseData } from '../utils/utils';

export const createBot = () => {
  const botWebSocket = new WebSocket('ws://localhost:3000');

  botWebSocket.on('open', () => {
    console.log('WebSocket connection established for the bot.');

    const userId = 'BOT_ID';
    (botWebSocket as any).id = userId;

    botWebSocket.on('message', (message: string) => {
      const parsedData = JSON.parse(message);

      const command = parseCommand(parsedData);
      const data = parsedData.data ? parseData(parsedData.data) : null;
      
      handleCommands(botWebSocket, command, data, userId);
    });
  });

  botWebSocket.on('close', () => {
    console.log('WebSocket connection closed for the bot.');
  });

  botWebSocket.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
};
