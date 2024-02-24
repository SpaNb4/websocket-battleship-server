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
import { Command } from '../types/command';
import { RequestData } from '../types/request';
import {
  isAddUserToRoomData,
  isAttackData,
  isPlayerShipsData,
  isRandomAttackData,
  isRegistrationData,
} from '../utils/type-guards';

export const handleCommands = (ws: WebSocket, command: Command, data: RequestData, userId: string) => {
  switch (command) {
    case Command.Reg:
      handleRegistration(ws, data, userId);
      break;
    case Command.CreateRoom:
      handleCreateRoom(userId);
      break;
    case Command.AddUserToRoom:
      handleAddUserToRoom(data, userId);
      break;
    case Command.AddShips:
      handleAddShips(data, userId);
      break;

    case Command.RandomAttack:
      handleRandomAttack(data, userId);
      break;

    case Command.Attack:
      handleAttack(data, userId);
      break;

    case Command.SinglePlay:
      handleSinglePlay(userId);
      break;

    default:
      handleUnknownCommand(command);
  }
};

export const handleRegistration = (ws: WebSocket, data: RequestData, userId: string) => {
  if (isRegistrationData(data)) {
    registerUser(ws, data, userId);
    getAllRooms();
    getAllWinners();
  }
};

export const handleCreateRoom = (userId: string) => {
  createRoomWithUser(userId);
};

export const handleAddUserToRoom = (data: RequestData, userId: string) => {
  if (isAddUserToRoomData(data)) {
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
  }
};

export const handleAddShips = (data: RequestData, userId: string) => {
  if (isPlayerShipsData(data)) {
    setPlayerShips(data, userId);

    if (isGameReady(userId)) {
      startGame(userId);
      switchTurn(userId);
    }
  }
};

export const handleRandomAttack = (data: RequestData, userId: string) => {
  if (isRandomAttackData(data) && isPlayerTurn(userId)) {
    attack(data);
    switchTurn(userId);
    // TODO remove game if it's ended?
    checkIfGameEnded(data);
  }
};

export const handleAttack = (data: RequestData, userId: string) => {
  if (isAttackData(data) && isPlayerTurn(userId)) {
    attack(data);
    switchTurn(userId);
    // TODO remove game if it's ended?
    checkIfGameEnded(data);
  }
};

export const handleSinglePlay = (userId: string) => {
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

  setPlayerShips({ ships: getPredefinedField(), gameId: game.gameId }, 'BOT_ID');
};

export const handleUnknownCommand = (command: Command) => {
  console.log(`Unknown command: ${command}`);
};
