import { randomUUID as uuidv4 } from 'crypto';
import { WebSocket, WebSocketServer } from 'ws';
import { Game, Player, Ship, User, games, rooms, users, winners } from './db';
import { broadcastToAll } from './utils/utils';

const wss = new WebSocketServer({
  port: 3000,
});

wss.on('connection', (ws: WebSocket) => {
  const userId = uuidv4();
  (ws as any).id = userId;

  console.log('connected: ', userId);

  ws.on('error', console.error);

  ws.on('message', (rawData: string) => {
    const parsedData = JSON.parse(rawData);
    // console.log('received: ', parsedData);

    const command = parseCommand(parsedData);
    const data = parsedData.data ? parseData(parsedData.data) : null;

    const game = games.find((game) => game.players.find((player) => player.userId === userId));

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
        if (
          rooms.find((room) => room.roomId === data.indexRoom && room.roomUsers.find((user) => user.index === userId))
        ) {
          console.log('You are already in this room');
          return;
        }
        // Add second user to the room
        addUserToRoom(ws, data, userId);

        // If user is already in his own room and wants to join another room, remove him from his own room
        handleUserInOwnRoom(data, userId);

        // When two players are in the room, start the game and remove the room from the list
        createGame(userId);
        removeUserRoom(data);

        // Send updated rooms to all clients
        getAllRooms();
        break;
      case 'add_ships':
        setUserReady(userId);
        addPlayerShips(data, userId);

        if (checkGameReady(userId)) {
          startGame(userId);
          // First to set the ships is the first to play
          switchTurn(userId);
        }
        break;

      case 'randomAttack':
        if (game?.turn !== userId) {
          console.log('Not your turn');
          return;
        }
        attack(data);
        switchTurn(userId);
        checkIfGameEnded(userId);
        break;

      case 'attack':
        if (game?.turn !== userId) {
          console.log('Not your turn');
          return;
        }
        attack(data);
        switchTurn(userId);
        checkIfGameEnded(userId);
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

  const newUser: User = { name, index: userId };
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

const handleUserInOwnRoom = (data: any, userId: string) => {
  const { indexRoom } = data;

  if (rooms.find((room) => room.roomId !== indexRoom && room.roomUsers.find((user) => user.index === userId))) {
    removeUserRoom(userId);
  }
};

const removeUserRoom = (userId: string) => {
  const indexForRemove = rooms.findIndex((room) => room.roomUsers.find((user) => user.index === userId));

  if (indexForRemove) {
    rooms.splice(indexForRemove, 1);
  }
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

  broadcastToAll(wss.clients, response);
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

const createGame = (userId: string) => {
  const roomUsers = rooms.find((room) => room.roomUsers.find((user) => user.index === userId))?.roomUsers;

  if (!roomUsers) {
    return;
  }

  const gameId = uuidv4();

  const newGame: Game = {
    gameId,
    players: [],
    turn: roomUsers![0].index,
    lastAttackStatus: null,
  };

  games.push(newGame);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && roomUsers?.find((user) => user.index === (client as any).id)) {
      const response: RegistrationResponse = {
        type: 'create_game',
        data: JSON.stringify({ idGame: gameId, idPlayer: (client as any).id }),
        id: 0,
      };

      client.send(JSON.stringify(response));
    }
  });
};

const startGame = (userId: string) => {
  const game = games.find((game) => game.players.find((player) => player.userId === userId));

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && game?.players.find((player) => player.userId === (client as any).id)) {
      const response = {
        type: 'start_game',
        data: JSON.stringify({
          ships: game.players.find((player) => player.userId === (client as any).id)?.ships,
          currentPlayerIndex: (client as any).id,
        }),
        id: 0,
      };

      client.send(JSON.stringify(response));
    }
  });
};

const addPlayerShips = (data: any, userId: string) => {
  const { ships: shipPositions, gameId } = data;

  const player: Player = {
    userId,
    // Adding healthPoints to each ship to keep track of their health
    ships: shipPositions.map((ship: any) => ({ ...ship, healthPoints: ship.length })),
  };

  games.find((game) => game.gameId === gameId)!.players.push(player);
};

const checkGameReady = (userId: string) => {
  const game = games.find((game) => game.players.find((player) => player.userId === userId));

  if (!game) {
    return false;
  }

  if (game.players.length === 2) {
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
  };

  rooms.find((room) => room.roomId === roomId)!.roomUsers[userIndex!] = updatedUser;
};

const attack = (data: any) => {
  const { x, y, indexPlayer } = data;

  const attackStatus = getAttackStatus(x, y, indexPlayer);
  const game = games.find((game) => game.players.find((player) => player.userId === indexPlayer));

  if (!game) {
    return;
  }

  game.lastAttackStatus = attackStatus;
  // console.log('attackStatus', attackStatus);

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
};

const markKilledShip = (ship: Ship, userId: string) => {
  if (ship.direction) {
    for (let y = ship.position.y; y < ship.position.y + ship.length; y++) {
      const response = {
        type: 'attack',
        data: JSON.stringify({
          position: { x: ship.position.x, y },
          currentPlayer: userId,
          status: 'killed',
        }),
        id: 0,
      };

      broadcastToAll(wss.clients, response);
    }
  } else {
    for (let x = ship.position.x; x < ship.position.x + ship.length; x++) {
      const response = {
        type: 'attack',
        data: JSON.stringify({
          position: { x, y: ship.position.y },
          currentPlayer: userId,
          status: 'killed',
        }),
        id: 0,
      };

      broadcastToAll(wss.clients, response);
    }
  }
};

const shootAroundShip = (ship: Ship, userId: string) => {
  if (ship.direction) {
    for (let x = ship.position.x - 1; x <= ship.position.x + 1; x++)
      for (let y = ship.position.y - 1; y <= ship.position.y + ship.length; y++) {
        if (x === ship.position.x && y >= ship.position.y && y < ship.position.y + ship.length) {
          continue;
        }
        const response = {
          type: 'attack',
          data: JSON.stringify({
            position: { x, y },
            currentPlayer: userId,
            status: 'boom',
          }),
          id: 0,
        };

        broadcastToAll(wss.clients, response);
      }
  } else {
    for (let x = ship.position.x - 1; x <= ship.position.x + ship.length; x++)
      for (let y = ship.position.y - 1; y <= ship.position.y + 1; y++) {
        if (x >= 0 && x < 10 && y >= 0 && y < 10) {
          if (x >= ship.position.x && x < ship.position.x + ship.length && y === ship.position.y) {
            continue;
          }

          const response = {
            type: 'attack',
            data: JSON.stringify({
              position: { x, y },
              currentPlayer: userId,
              status: 'boom',
            }),
            id: 0,
          };

          broadcastToAll(wss.clients, response);
        }
      }
  }
};

const getAttackStatus = (x: number, y: number, userId: string) => {
  const game = games.find((game) => game.players.find((player) => player.userId === userId));
  const shipsForUser = game?.players.find((player) => player.userId !== userId)?.ships;

  if (!shipsForUser) {
    return 'miss';
  }

  const hitShip = shipsForUser.find((ship) => {
    if (ship.direction) {
      return x === ship.position.x && y >= ship.position.y && y < ship.position.y + ship.length;
    } else {
      return y === ship.position.y && x >= ship.position.x && x < ship.position.x + ship.length;
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
      markKilledShip(hitShip, userId);
      shootAroundShip(hitShip, userId);
      return 'killed';
    }
  }

  return 'miss';
};

const switchTurn = (userId: string) => {
  const enemyUser = users.find((user) => user.index !== userId);
  const game = games.find((game) => game.players.find((player) => player.userId === userId));

  if (!game || !enemyUser) {
    return;
  }

  const lastAttackStatus = game.lastAttackStatus;
  if (lastAttackStatus === 'shot' || lastAttackStatus === 'killed') {
    game.turn = userId;
  } else {
    game.turn = enemyUser?.index;
  }

  // console.log(`Now it's ${getCurrentTurn()!.name}'s turn`);
  // console.log('id', getCurrentTurn()!.index);

  const response = {
    type: 'turn',
    data: JSON.stringify({
      currentPlayer: game.turn,
    }),
    id: 0,
  };

  broadcastToAll(wss.clients, response);
};

const checkIfGameEnded = (userId: string) => {
  // const losingPlayer = ships.find((ship) => ship.shipPositions.every((ship) => ship.healthPoints === 0));
  const losingPlayer = games.find((game) =>
    game.players.find((player) => player.userId === userId)!.ships.every((ship) => ship.healthPoints === 0)
  );

  if (losingPlayer) {
    const response: RegistrationResponse = {
      type: 'finish',
      data: JSON.stringify({
        winPlayer: userId,
      }),
      id: 0,
    };

    broadcastToAll(wss.clients, response);
    addWinner(userId);
  }
};

const addWinner = (userId: string) => {
  const user = users.find((user) => user.index === userId);

  if (!user) {
    return;
  }

  const newWinner = { name: user.name, wins: 1 };

  winners.push(newWinner);

  const response = {
    type: 'update_winners',
    data: JSON.stringify(winners),
    id: 0,
  };

  broadcastToAll(wss.clients, response);
};

interface RegistrationResponse {
  type: string;
  data: string;
  id: number;
}

// TOOT broadcast messages not to all clients but to all clients in the game
