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
import { AttackData, RequestData } from '../types/request';
import { isAddUserToRoomData, isPlayerShipsData, isRandomAttackData, isRegistrationData } from '../utils/type-guards';

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
      handleAttack(data as AttackData, userId);
      break;

    case Command.SinglePlay:
      handleSinglePlay(userId);
      break;
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
    attack(data, userId);
    switchTurn(userId);
    checkIfGameEnded(data);
  }
};

export const handleAttack = (data: AttackData, userId: string) => {
  if (isPlayerTurn(userId)) {
    attack(data, userId);
    switchTurn(userId);
    checkIfGameEnded(data);
  }
};

export const handleSinglePlay = (userId: string) => {
  const { botId } = createBot();

  userService.createUser({ name: 'BOT', index: botId, hash: 'BOT_HASH' });
  createRoomWithUser(userId);

  const room = roomService.getRoomByUserId(userId);

  if (!room) {
    return;
  }

  addUserToRoom({ indexRoom: room.roomId }, botId);

  createGame(userId);

  removeRoomById(room.roomId);
  getAllRooms();

  const game = gameService.getGameByPlayerId(userId);

  if (!game) {
    return;
  }

  const ships = getPredefinedField();

  setPlayerShips({ ships, gameId: game.gameId }, botId);
};

export const handleUnknownCommand = (command: Command) => {
  console.log(`Unknown command: ${command}`);
};
