import { randomUUID as uuidv4 } from 'crypto';
import { WebSocket, WebSocketServer } from 'ws';
import { User, rooms, users, winners } from './db';
import { broadcastToAll } from './utils/utils';

const wss = new WebSocketServer({
  port: 3000,
});

wss.on('connection', (ws: WebSocket, req) => {
  const userId = req.headers['sec-websocket-key'] as string;
  console.log('connected: ', userId);

  ws.on('error', console.error);

  ws.on('message', (rawData: string) => {
    const parsedData = JSON.parse(rawData);
    console.log('received: ', parsedData);

    const command = parseCommand(parsedData);
    const data = parsedData.data ? parseData(parsedData.data) : null;

    switch (command) {
      case 'reg':
        registerUser(ws, data, userId);
        getAllRooms(ws);
        getAllWinners(ws);
        break;
      case 'create_room':
        createRoomWithUser(ws, userId);
        break;
      case 'add_user_to_room':
        if (rooms.find((room) => room.roomUsers.find((user) => user.index === userId))) {
          console.log('user already in room');
          return;
        }
        addUserToRoom(ws, data, userId);
        handleCreateGame(ws, data, userId);
        break;
    }
  });
});

const parseCommand = (parsedData: any) => {
  return parsedData.type;
};

const parseData = (data: any) => {
  return JSON.parse(data);
};

const registerUser = (ws: WebSocket, data: any, userId: string) => {
  const { name } = data;

  const newUser = { name, index: userId };
  users.push(newUser);

  const response: RegistrationResponse = {
    type: 'reg',
    data: JSON.stringify({
      ...newUser,
      error: false,
      errorText: '',
    }),
    id: 0,
  };

  ws.send(JSON.stringify(response));
};

const getAllRooms = (ws: WebSocket) => {
  const response = {
    type: 'update_room',
    data: JSON.stringify(rooms),
    id: 0,
  };

  ws.send(JSON.stringify(response));
};

const createRoomWithUser = (ws: WebSocket, userId: string) => {
  const user = users.find((user) => user.index === userId) as User;

  if (rooms.find((room) => room.roomUsers.find((user) => user.index === userId))) {
    console.log("You can't create a room if you're already in one");
    return;
  }

  const newRoom = { roomId: uuidv4(), roomUsers: [user] };

  rooms.push(newRoom);

  const response = {
    type: 'update_room',
    data: JSON.stringify(rooms),
    id: 0,
  };

  ws.send(JSON.stringify(response));
};

const addUserToRoom = (ws: WebSocket, data: any, userId: string) => {
  const { indexRoom } = data;

  const indexForUpdate = rooms.findIndex((room) => room.roomId === indexRoom);

  if (indexForUpdate === -1) {
    return;
  }

  const user = users.find((user) => user.index === userId) as User;

  const updatedRoom = {
    ...rooms[indexForUpdate],
    roomUsers: [...rooms[indexForUpdate].roomUsers, user],
  };

  rooms[indexForUpdate] = updatedRoom;

  const response = {
    type: 'update_room',
    data: JSON.stringify(rooms),
    id: 0,
  };

  broadcastToAll(wss.clients, response);
};

const getAllWinners = (ws: WebSocket) => {
  const response = {
    type: 'update_winners',
    data: JSON.stringify(winners),
    id: 0,
  };

  ws.send(JSON.stringify(response));
};

const handleCreateGame = (ws: WebSocket, data: any, userId: string) => {
  const response: RegistrationResponse = {
    type: 'create_game',
    data: JSON.stringify({ idGame: uuidv4(), idPlayer: userId }),
    id: 0,
  };

  broadcastToAll(wss.clients, response);
};

interface RegistrationResponse {
  type: string;
  data: string;
  id: number;
}
