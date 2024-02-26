import { WebSocket } from 'ws';
import { getGameByPlayerId } from '../services/gameService';
import { Request } from '../types/request';
import { CustomWebSocket } from '../types/websocket';

export const parseCommand = (parsedData: Request) => {
  return parsedData.type;
};

export const parseData = (data: unknown) => {
  return JSON.parse(data as string);
};

export const broadcastToAll = (clients: Set<CustomWebSocket>, message: unknown) => {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
  console.log('sent to all: ', message);
};

export interface MessagesForTwoPlayers<T> {
  player1: T;
  player2: T;
}

export const broadcastToAllInGame = <T>(
  clients: Set<CustomWebSocket>,
  messagesForTwoPlayers: MessagesForTwoPlayers<T>,
  gameId: string
) => {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const game = getGameByPlayerId(client.id);

      if (game?.gameId === gameId) {
        if (client.id === game.players[0].userId) {
          client.send(JSON.stringify(messagesForTwoPlayers.player1));
          console.log(`sent to player 1 ${client.id}:`, messagesForTwoPlayers.player2);
        } else {
          client.send(JSON.stringify(messagesForTwoPlayers.player2));
          console.log(`sent to player 2 ${client.id}: `, messagesForTwoPlayers.player2);
        }
      }
    }
  });
};

export const sendResponse = (ws: CustomWebSocket, data: unknown) => {
  ws.send(JSON.stringify(data));
  console.log(`sent to ${ws.id}: `, data);
};

export const logReceivedData = (ws: CustomWebSocket, data: unknown) => {
  console.log(`received from ${ws.id}: `, data);
};
