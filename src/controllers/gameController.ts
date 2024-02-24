import { randomUUID as uuidv4 } from 'crypto';
import { WebSocket } from 'ws';
import { wss } from '../index';
import { Game } from '../models/game';
import { Player } from '../models/player';
import * as gameService from '../services/gameService';
import * as roomService from '../services/roomService';
import { broadcastToAll } from '../utils/utils';
import { addWinner } from './winnerController';

export const createGame = (userId: string) => {
  const roomUsers = roomService.getRoomByUserId(userId)?.roomUsers;

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

  gameService.createGame(newGame);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && roomUsers?.find((user) => user.index === (client as any).id)) {
      const response = {
        type: 'create_game',
        data: JSON.stringify({ idGame: gameId, idPlayer: (client as any).id }),
        id: 0,
      };

      client.send(JSON.stringify(response));
    }
  });
};

export const startGame = (userId: string) => {
  const game = gameService.getGameByPlayerId(userId);

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

export const setPlayerShips = (data: any, userId: string) => {
  const { ships: shipPositions, gameId } = data;

  const player: Player = {
    userId,
    // Add healthPoints to each ship to keep track of their health
    ships: shipPositions.map((ship: any) => ({ ...ship, healthPoints: ship.length })),
  };

  gameService.addPlayerToGame(gameId, player);
};

export const isGameReady = (userId: string) => {
  return gameService.isGameReady(userId);
};

export const attack = (data: any) => {
  const { x = Math.floor(Math.random() * 10), y = Math.floor(Math.random() * 10), indexPlayer } = data;

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
  } else {
    game.turn = enemyPlayer?.userId;
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
