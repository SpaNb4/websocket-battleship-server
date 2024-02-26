import { randomUUID as uuidv4 } from 'crypto';
import { WebSocket } from 'ws';
import { handleCommands } from '../commands/commands';
import { Command } from '../types/command';
import { CustomWebSocket } from '../types/websocket';
import { logReceivedData, parseCommand, parseData, sendResponse } from '../utils/utils';

export const createBot = () => {
  const botId = uuidv4();
  const botWebSocket = new WebSocket('ws://localhost:3000', botId) as CustomWebSocket;

  botWebSocket.on('open', () => {
    console.log('WebSocket connection established for the bot.');

    sendResponse(botWebSocket, { type: Command.RegBot });

    botWebSocket.on('message', (message: string) => {
      const parsedData = JSON.parse(message);

      logReceivedData(parsedData);

      const command = parseCommand(parsedData);
      const data = parsedData.data ? parseData(parsedData.data) : null;

      handleCommands(botWebSocket, command, data, botId);
    });
  });

  botWebSocket.on('close', () => {
    console.log('WebSocket connection closed for the bot.');
  });

  botWebSocket.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  return { botId, botWebSocket };
};
