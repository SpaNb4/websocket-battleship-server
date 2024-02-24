import { WebSocket } from 'ws';
import {
  attack,
  checkIfGameEnded,
  createGame,
  isGameReady,
  isPlayerTurn,
  setPlayerShips,
  startGame,
  switchTurn,
} from '../controllers/gameController';
import {
  addUserToRoom,
  isUserInRoom,
  createRoomWithUser,
  getAllRooms,
  removeRoom,
} from '../controllers/roomController';
import { registerUser } from '../controllers/userController';
import { getAllWinners } from '../controllers/winnerController';

type Command = 'reg' | 'create_room' | 'add_user_to_room' | 'add_ships' | 'randomAttack' | 'attack';

export const handleCommands = (ws: WebSocket, command: Command, data: any, userId: string) => {
  switch (command) {
    case 'reg':
      registerUser(ws, data, userId);
      getAllRooms();
      getAllWinners();
      break;
    case 'create_room':
      createRoomWithUser(userId);
      break;
    case 'add_user_to_room':
      if (isUserInRoom(userId, data.indexRoom)) {
        return;
      }

      // Add second user to the room
      addUserToRoom(data, userId);

      // When two players are in the room, start the game and remove the room from the list
      // and then send updated rooms to all clients
      createGame(userId);
      removeRoom(data.indexRoom);
      getAllRooms();
      break;
    case 'add_ships':
      setPlayerShips(data, userId);

      if (isGameReady(userId)) {
        startGame(userId);
        // First to set the ships is the first to play
        switchTurn(userId);
      }
      break;

    case 'randomAttack':
      if (isPlayerTurn(userId)) {
        attack(data);
        switchTurn(userId);
        checkIfGameEnded(userId);
      }
      break;

    case 'attack':
      if (isPlayerTurn(userId)) {
        attack(data);
        switchTurn(userId);
        checkIfGameEnded(data);
      }
      break;
  }
};
