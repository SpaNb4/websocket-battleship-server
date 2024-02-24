import { WebSocket } from 'ws';
import { createBot } from '../bot/bot';
import { getPredefinedField } from '../bot/fields';
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
  createRoomWithUser,
  getAllRooms,
  isUserInRoom,
  removeRoomById,
} from '../controllers/roomController';
import { registerUser } from '../controllers/userController';
import { getAllWinners } from '../controllers/winnerController';
import * as gameService from '../services/gameService';
import * as roomService from '../services/roomService';
import * as userService from '../services/userService';

type Command = 'reg' | 'create_room' | 'add_user_to_room' | 'add_ships' | 'randomAttack' | 'attack' | 'single_play';

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
      removeRoomById(data.indexRoom);
      getAllRooms();
      break;
    case 'add_ships':
      setPlayerShips(data, userId);

      if (isGameReady(userId)) {
        startGame(userId);
        switchTurn(userId);
      }
      break;

    case 'randomAttack':
      if (isPlayerTurn(userId)) {
        attack(data);
        switchTurn(userId);
        // TODO remove game if it's ended?
        checkIfGameEnded(userId);
      }
      break;

    case 'attack':
      if (isPlayerTurn(userId)) {
        attack(data);
        switchTurn(userId);
        // TODO remove game if it's ended?
        checkIfGameEnded(data);
      }
      break;

    case 'single_play':
      createBot();
      userService.createUser({ name: 'BOT_ID', index: 'BOT_ID', hash: 'BOT_HASH' });
      createRoomWithUser(userId);

      const room = roomService.getRoomByUserId(userId);

      if (!room) {
        return;
      }

      addUserToRoom({ indexRoom: room.roomId }, 'BOT_ID');

      createGame(userId);

      removeRoomById(room.roomId);
      getAllRooms();

      const game = gameService.getGameByPlayerId(userId);

      if (!game) {
        return;
      }

      const ships = getPredefinedField();

      setPlayerShips({ ships, gameId: game.gameId }, 'BOT_ID');
      break;
  }
};
