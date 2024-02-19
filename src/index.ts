import { randomUUID as uuidv4 } from 'crypto';
import { WebSocket, WebSocketServer } from 'ws';
import {
  Ships,
  User,
  getCurrentTurn,
  getLastAttackStatus,
  rooms,
  setCurrentTurn,
  setLastAttackStatus,
  ships,
  users,
  winners,
} from './db';
import { broadcastToAll } from './utils/utils';

const wss = new WebSocketServer({
  port: 3000,
});

wss.on('connection', (ws: WebSocket, req) => {
  const userId = uuidv4();
  (ws as any).id = userId;

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
        getAllRooms();
        getAllWinners();
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
      case 'add_ships':
        setUserReady(userId);
        addShips(data, userId);

        if (checkRoomReady(userId)) {
          startGame();
          // First to set the ships is the first to play
          switchTurn(userId);
        }
        break;

      case 'randomAttack':
        if (getCurrentTurn()!.index !== userId) {
          console.log('Not your turn');
          return;
        }
        attack(data);
        switchTurn(userId);
        break;

      case 'attack':
        if (getCurrentTurn()!.index !== userId) {
          console.log('Not your turn');
          return;
        }
        attack(data);
        switchTurn(userId);
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

  const newUser: User = { name, index: userId, isReady: false };
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

const getAllRooms = () => {
  const response = {
    type: 'update_room',
    data: JSON.stringify(rooms),
    id: 0,
  };

  broadcastToAll(wss.clients, response);
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

  const user = users.find((user) => user.index === userId);

  if (!user) {
    return;
  }

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

const getAllWinners = () => {
  const response = {
    type: 'update_winners',
    data: JSON.stringify(winners),
    id: 0,
  };

  broadcastToAll(wss.clients, response);
};

const handleCreateGame = (ws: WebSocket, data: any, userId: string) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const response: RegistrationResponse = {
        type: 'create_game',
        data: JSON.stringify({ idGame: uuidv4(), idPlayer: (client as any).id }),
        id: 0,
      };

      client.send(JSON.stringify(response));
    }
  });
};

const startGame = () => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const response = {
        type: 'start_game',
        data: JSON.stringify({
          ships: ships.find((ship) => ship.userId === (client as any).id)!.shipPositions,
          currentPlayerIndex: (client as any).id,
        }),
        id: 0,
      };

      client.send(JSON.stringify(response));
    }
  });
};

const addShips = (data: any, userId: string) => {
  const { ships: shipPositions } = data;

  const newShips: Ships = {
    userId,
    shipPositions: shipPositions.map((ship: any) => ({ ...ship, healthPoints: ship.length })),
  };

  ships.push(newShips);
};

const checkRoomReady = (userId: string) => {
  const roomId = rooms.find((room) => room.roomUsers.find((user) => user.index === userId))?.roomId;

  if (!roomId) {
    return false;
  }

  const usersInRoom = rooms.find((room) => room.roomId === roomId)?.roomUsers;

  const allReady = usersInRoom!.every((user) => user.isReady);

  if (allReady) {
    return true;
  }

  return false;
};

const setUserReady = (userId: string) => {
  const roomId = rooms.find((room) => room.roomUsers.find((user) => user.index === userId))?.roomId;

  if (!roomId) {
    return false;
  }

  const userIndex = rooms.find((room) => room.roomId === roomId)?.roomUsers.findIndex((user) => user.index === userId);

  if (userIndex === -1) {
    return;
  }

  const updatedUser: User = {
    ...(rooms.find((room) => room.roomId === roomId)?.roomUsers[userIndex!] as User),
    isReady: true,
  };

  rooms.find((room) => room.roomId === roomId)!.roomUsers[userIndex!] = updatedUser;
};

const attack = (data: any) => {
  const { x, y, indexPlayer } = data;

  const attackStatus = getAttackStatus(x, y, indexPlayer);
  setLastAttackStatus(attackStatus);

  const response = {
    type: 'attack',
    data: JSON.stringify({
      position: { x, y },
      currentPlayer: indexPlayer,
      status: attackStatus,
    }),
    id: 0,
  };

  broadcastToAll(wss.clients, response);

  // TODO move it to a function
  if (attackStatus === 'killed') {
    const killedShip = ships
      .find((ship) => ship.userId !== indexPlayer)
      ?.shipPositions.find((ship) => ship.healthPoints === 0);

    if (killedShip) {
      if (killedShip?.direction) {
        for (let i = killedShip.position.x - 1; i <= killedShip.position.x + 1; i++)
          for (let y = killedShip.position.y - 1; y <= killedShip.position.y + killedShip.length; y++) {
            if (i >= 0 && i < 10 && y >= 0 && y < 10) {
              const response = {
                type: 'attack',
                data: JSON.stringify({
                  position: { x: i, y },
                  currentPlayer: indexPlayer,
                  status: attackStatus,
                }),
                id: 0,
              };

              broadcastToAll(wss.clients, response);
            }
          }
      } else {
        for (let i = killedShip.position.x - 1; i <= killedShip.position.x + killedShip.length; i++)
          for (let y = killedShip.position.y - 1; y <= killedShip.position.y + 1; y++) {
            if (i >= 0 && i < 10 && y >= 0 && y < 10) {
              const response = {
                type: 'attack',
                data: JSON.stringify({
                  position: { x: i, y },
                  currentPlayer: indexPlayer,
                  status: attackStatus,
                }),
                id: 0,
              };

              broadcastToAll(wss.clients, response);
            }
          }
      }
    }
  }
};

const getAttackStatus = (x: number, y: number, userId: string) => {
  const shipsForUser = ships.find((ship) => ship.userId !== userId)?.shipPositions;

  if (!shipsForUser) {
    return 'miss';
  }

  const hitShip = shipsForUser.find((ship) => {
    if (ship.direction) {
      return x === ship.position.x && y >= ship.position.y && y <= ship.position.y + ship.length;
    } else {
      return y === ship.position.y && x >= ship.position.x && x <= ship.position.x + ship.length;
    }
  });

  if (hitShip) {
    hitShip.healthPoints = hitShip.healthPoints - 1;
    if (hitShip.healthPoints) {
      return 'shot';
    } else {
      // TODO remove killed ship from array?
      // const shipIndex = shipsForUser.indexOf(hitShip);
      // shipsForUser.splice(shipIndex, 1);
      return 'killed';
    }
  }

  return 'miss';
};

const switchTurn = (userId: string) => {
  const user = users.find((user) => user.index !== userId);

  const lastAttackStatus = getLastAttackStatus();
  if (lastAttackStatus === 'shot' || lastAttackStatus === 'killed') {
    const currentTurn = getCurrentTurn();
    setCurrentTurn(currentTurn!);
  } else {
    setCurrentTurn(user!);
  }

  console.log(`Now it's ${getCurrentTurn()!.name}'s turn`);
  console.log('id', getCurrentTurn()!.index);

  const response = {
    type: 'turn',
    data: JSON.stringify({
      currentPlayer: getCurrentTurn()!.index,
    }),
    id: 0,
  };

  broadcastToAll(wss.clients, response);
};

interface RegistrationResponse {
  type: string;
  data: string;
  id: number;
}

// TODO remove? or hide room when two users are in it
// TOOT broadcast messages not to all clients but to all clients in the room
