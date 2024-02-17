import { WebSocket } from 'ws';

export const broadcastToAll = (clients: Set<WebSocket>, message: any) => {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};
