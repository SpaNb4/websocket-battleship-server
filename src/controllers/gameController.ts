import { randomUUID as uuidv4 } from 'crypto';
import { wss } from '../index';
import { Game } from '../models/game';
import * as gameService from '../services/gameService';
import * as roomService from '../services/roomService';
import { Command } from '../types/command';
import { AttackData, PlayerShipsData, RandomAttackData } from '../types/request';
import { AttackResponse, CreateGameResponse, FinishResponse, StartGameResponse, TurnResponse } from '../types/response';
import { MessagesForTwoPlayers, broadcastToAllInGame } from '../utils/utils';
import { addWinner } from './winnerController';
import { Player } from '../models/player';

export const createGame = (userId: string) => {
  const userRooms = roomService.getRoomsByUserId(userId);

  if (!userRooms) {
    return;
  }

  const roomWithTwoUsers = roomService.getRoomWithTwoUsers(userRooms);

  if (!roomWithTwoUsers) {
    return;
  }

  const roomUsers = roomWithTwoUsers.roomUsers;

  const gameId = uuidv4();
  const targetedCoordinates = new Set<string>();
  const players: Player[] = roomUsers.map((user) => ({ userId: user.index, ships: [], targetedCoordinates }));

  const newGame: Game = {
    gameId,
    players,
    turn: roomUsers[0].index,
    lastAttackStatus: null,
  };

  gameService.createGame(newGame);

  const response: MessagesForTwoPlayers<CreateGameResponse> = {
    player1: {
      type: Command.CreateGame,
      data: JSON.stringify({ idGame: gameId, idPlayer: roomUsers[0].index }),
      id: 0,
    },
    player2: {
      type: Command.CreateGame,
      data: JSON.stringify({ idGame: gameId, idPlayer: roomUsers[1].index }),
      id: 0,
    },
  };

  broadcastToAllInGame(wss.clients, response, gameId);
};

export const startGame = (userId: string) => {
  const game = gameService.getGameByPlayerId(userId);

  if (!game) {
    return;
  }

  const response: MessagesForTwoPlayers<StartGameResponse> = {
    player1: {
      type: Command.StartGame,
      data: JSON.stringify({
        ships: game.players[0].ships,
        currentPlayerIndex: game.players[0].userId,
      }),
      id: 0,
    },
    player2: {
      type: Command.StartGame,
      data: JSON.stringify({
        ships: game.players[1].ships,
        currentPlayerIndex: game.players[1].userId,
      }),
      id: 0,
    },
  };

  broadcastToAllInGame(wss.clients, response, game.gameId);
};

export const setPlayerShips = (data: PlayerShipsData, userId: string) => {
  const { ships: shipPositions, gameId } = data;

  const player = gameService.getPlayerById(userId, gameId);

  if (!player) {
    return;
  }

  // Add healthPoints to each ship to keep track of their health
  const ships = shipPositions.map((ship) => ({ ...ship, healthPoints: ship.length }));

  player.ships = ships;
};

export const isGameReady = (userId: string) => {
  return gameService.isGameReady(userId);
};

export const attack = (data: AttackData | RandomAttackData, userId: string) => {
  const {
    x = Math.floor(Math.random() * 10),
    y = Math.floor(Math.random() * 10),
    indexPlayer = userId,
  } = data as AttackData;

  const attackStatus = gameService.getAttackStatus(x, y, indexPlayer);
  const game = gameService.getGameByPlayerId(indexPlayer);
  const enemyShips = gameService.getEnemyShips(indexPlayer);

  if (!enemyShips || !game) {
    return;
  }

  if (attackStatus === 'same_target') {
    game.lastAttackStatus = 'miss';

    return;
  }

  const hitShip = gameService.getHitShip(x, y, enemyShips);

  if (attackStatus === 'killed' && hitShip) {
    gameService.markKilledShip(hitShip, indexPlayer).forEach((response) => {
      const responseForTwoPlayers: MessagesForTwoPlayers<AttackResponse> = {
        player1: response,
        player2: response,
      };

      broadcastToAllInGame(wss.clients, responseForTwoPlayers, game.gameId);
    });
    gameService.shootAroundShip(hitShip, indexPlayer).forEach((response) => {
      const responseForTwoPlayers: MessagesForTwoPlayers<AttackResponse> = {
        player1: response,
        player2: response,
      };

      broadcastToAllInGame(wss.clients, responseForTwoPlayers, game.gameId);
    });
  }

  if (!game) {
    return;
  }

  game.lastAttackStatus = attackStatus;

  const response: MessagesForTwoPlayers<AttackResponse> = {
    player1: {
      type: Command.Attack,
      data: JSON.stringify({ position: { x, y }, currentPlayer: indexPlayer, status: attackStatus }),
      id: 0,
    },
    player2: {
      type: Command.Attack,
      data: JSON.stringify({ position: { x, y }, currentPlayer: indexPlayer, status: attackStatus }),
      id: 0,
    },
  };

  broadcastToAllInGame(wss.clients, response, game.gameId);
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

  const response: MessagesForTwoPlayers<TurnResponse> = {
    player1: {
      type: Command.Turn,
      data: JSON.stringify({ currentPlayer: game.turn }),
      id: 0,
    },
    player2: {
      type: Command.Turn,
      data: JSON.stringify({ currentPlayer: game.turn }),
      id: 0,
    },
  };

  broadcastToAllInGame(wss.clients, response, game.gameId);
};

export const checkIfGameEnded = (data: AttackData | RandomAttackData) => {
  const { gameId } = data;

  const winner = gameService.getWinner(gameId);

  if (winner) {
    const response: MessagesForTwoPlayers<FinishResponse> = {
      player1: {
        type: Command.Finish,
        data: JSON.stringify({ winPlayer: winner.userId }),
        id: 0,
      },
      player2: {
        type: Command.Finish,
        data: JSON.stringify({ winPlayer: winner.userId }),
        id: 0,
      },
    };

    broadcastToAllInGame(wss.clients, response, gameId);
    addWinner(winner.userId);
    removeGameById(gameId);
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
