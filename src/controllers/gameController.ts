import { randomUUID as uuidv4 } from 'crypto';
import { wss } from '../index';
import { Game } from '../models/game';
import * as gameService from '../services/gameService';
import * as roomService from '../services/roomService';
import { broadcastToAll, broadcastToAllInGame } from '../utils/utils';
import { addWinner } from './winnerController';

export const createGame = (userId: string) => {
  const userRooms = roomService.getRoomsByUserId(userId);

  if (!userRooms) {
    return;
  }

  const roomWithTwoUsers = userRooms.find((room) => room.roomUsers.length === 2);

  if (!roomWithTwoUsers) {
    return;
  }

  const roomUsers = roomWithTwoUsers.roomUsers;

  const gameId = uuidv4();
  const players = roomUsers.map((user) => ({ userId: user.index, ships: [] }));

  const newGame: Game = {
    gameId,
    players,
    turn: roomUsers[0].index,
    lastAttackStatus: null,
  };

  gameService.createGame(newGame);

  const responses: any[] = [];

  for (let i = 0; i < players.length; i++) {
    const response = {
      type: 'create_game',
      data: JSON.stringify({ idGame: gameId, idPlayer: players[i].userId }),
      id: 0,
    };

    responses.push(response);
  }

  broadcastToAllInGame(wss.clients, responses, gameId);
};

export const startGame = (userId: string) => {
  const game = gameService.getGameByPlayerId(userId);

  if (!game) {
    return;
  }

  const responses: any[] = [];

  for (let i = 0; i < game.players.length; i++) {
    const response = {
      type: 'start_game',
      data: JSON.stringify({
        ships: game.players[i].ships,
        currentPlayerIndex: game.players[i].userId,
      }),
      id: 0,
    };

    responses.push(response);
  }

  broadcastToAllInGame(wss.clients, responses, game?.gameId);
};

export const setPlayerShips = (data: any, userId: string) => {
  const { ships: shipPositions, gameId } = data;

  const player = gameService.getPlayerById(userId, gameId);

  if (!player) {
    return;
  }

  // Add healthPoints to each ship to keep track of their health
  const ships = shipPositions.map((ship: any) => ({ ...ship, healthPoints: ship.length }));

  player.ships = ships;
};

export const isGameReady = (userId: string) => {
  return gameService.isGameReady(userId);
};

export const attack = (data: any) => {
  const { x = Math.floor(Math.random() * 10), y = Math.floor(Math.random() * 10), indexPlayer = 'BOT_ID' } = data;

  const attackStatus = gameService.getAttackStatus(x, y, indexPlayer);
  const game = gameService.getGameByPlayerId(indexPlayer);
  const enemyShips = gameService.getEnemyShips(indexPlayer);

  if (!enemyShips) {
    return;
  }

  const hitShip = gameService.getHitShip(x, y, enemyShips);

  if (attackStatus === 'killed' && hitShip) {
    gameService.markKilledShip(hitShip, indexPlayer).forEach((response) => {
      broadcastToAll(wss.clients, response);
    });
    gameService.shootAroundShip(hitShip, indexPlayer).forEach((response) => {
      broadcastToAll(wss.clients, response);
    });
  }

  if (!game) {
    return;
  }

  game.lastAttackStatus = attackStatus;

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

export const switchTurn = (userId: string) => {
  const enemyPlayer = gameService.getEnemyPlayer(userId);
  const game = gameService.getGameByPlayerId(userId);

  if (!game || !enemyPlayer) {
    return;
  }

  const lastAttackStatus = game.lastAttackStatus;

  if (lastAttackStatus === 'shot' || lastAttackStatus === 'killed') {
    game.turn = userId;
  } else if (lastAttackStatus === 'miss') {
    game.turn = enemyPlayer?.userId;
  } else {
    // If it's the first turn, the first player to set the ships is the first to play
    game.turn = userId;
  }

  const response = {
    type: 'turn',
    data: JSON.stringify({
      currentPlayer: game.turn,
    }),
    id: 0,
  };

  broadcastToAll(wss.clients, response);
};

export const checkIfGameEnded = (data: any) => {
  const { gameId } = data;

  const winner = gameService.getWinner(gameId);

  if (winner) {
    const response = {
      type: 'finish',
      data: JSON.stringify({
        winPlayer: winner.userId,
      }),
      id: 0,
    };

    broadcastToAll(wss.clients, response);
    addWinner(winner.userId);
  }
};

export const isPlayerTurn = (userId: string) => {
  const game = gameService.getGameByPlayerId(userId);

  if (game?.turn !== userId) {
    console.log('Not your turn');
    return false;
  }

  return true;
};

export const removeGameById = (gameId: string) => {
  gameService.removeGameById(gameId);
};

export const removeGameByUserId = (userId: string) => {
  gameService.removeGameByUserId(userId);
};
