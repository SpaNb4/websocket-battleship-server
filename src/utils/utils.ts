import { WebSocket } from 'ws';

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

export const sendResponse = (ws: WebSocket, data: any) => {
  ws.send(JSON.stringify(data));
};

// TODO add another function that broadcast messages not to all clients but to all clients in the game
