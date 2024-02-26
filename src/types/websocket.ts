import { WebSocket, WebSocketServer } from 'ws';

export interface CustomWebSocket extends WebSocket {
  id: string;
}

export interface CustomWebSocketServer extends Omit<WebSocketServer, 'clients'> {
  clients: Set<CustomWebSocket>;
}
