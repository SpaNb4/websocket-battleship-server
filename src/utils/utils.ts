import { WebSocket } from 'ws';
import { getGameByPlayerId } from '../services/gameService';
import { Ship } from '../models/ship';

export const parseCommand = (parsedData: any) => {
  return parsedData.type;
};

export const parseData = (data: any) => {
  return JSON.parse(data);
};

export const broadcastToAll = (clients: Set<WebSocket>, message: any) => {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

export const broadcastToAllInGame = (clients: Set<WebSocket>, messagesForTwoPlayers: any[], gameId: string) => {
  clients.forEach((client: any) => {
    if (client.readyState === WebSocket.OPEN) {
      const game = getGameByPlayerId(client.id);

      if (game?.gameId === gameId) {
        if (client.id === game.players[0].userId) {
          client.send(JSON.stringify(messagesForTwoPlayers[0]));
        } else {
          client.send(JSON.stringify(messagesForTwoPlayers[1]));
        }
      }
    }
  });
};

export const sendResponse = (ws: WebSocket, data: any) => {
  ws.send(JSON.stringify(data));
};
