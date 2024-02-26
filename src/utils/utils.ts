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
        } else {
          client.send(JSON.stringify(messagesForTwoPlayers.player2));
        }
      }
    }
  });
};

export const sendResponse = (ws: CustomWebSocket, data: unknown) => {
  ws.send(JSON.stringify(data));
};

export const logReceivedData = (data: unknown) => {
  console.log('received: ', data);
};
