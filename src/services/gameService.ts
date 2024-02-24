import { db } from '../db/db';
import { Game } from '../models/game';
import { Ship } from '../models/ship';
import { Command } from '../types/command';
import { AttackResponse } from '../types/response';

export const getGameById = (gameId: string) => {
  return db.games.find((game) => game.gameId === gameId);
};

export const createGame = (game: Game) => {
  db.games.push(game);
};

export const removeGameById = (gameId: string) => {
  const indexForRemove = db.games.findIndex((game) => game.gameId === gameId);

  if (indexForRemove) {
    db.games.splice(indexForRemove, 1);
  }
};

export const removeGameByUserId = (userId: string) => {
  const game = getGameByPlayerId(userId);

  if (!game) {
    return;
  }

  removeGameById(game.gameId);
};

export const getPlayerById = (userId: string, gameId: string) => {
  const game = getGameById(gameId);

  if (!game) {
    return;
  }

  return game.players.find((player) => player.userId === userId);
};

export const getGameByPlayerId = (userId: string) => {
  return db.games.find((game) => game.players.find((player) => player.userId === userId));
};

export const isGameReady = (userId: string) => {
  const game = getGameByPlayerId(userId);

  if (!game) {
    return false;
  }

  if (game.players.every((player) => player.ships.length)) {
    return true;
  }

  return false;
};

export const getPlayerShips = (userId: string) => {
  const game = getGameByPlayerId(userId);

  if (!game) {
    return;
  }

  return game.players.find((player) => player.userId === userId)?.ships;
};

export const getEnemyPlayer = (userId: string) => {
  const game = getGameByPlayerId(userId);

  if (!game) {
    return;
  }

  return game.players.find((player) => player.userId !== userId);
};

export const getEnemyShips = (userId: string) => {
  const enemyPlayer = getEnemyPlayer(userId);

  if (!enemyPlayer) {
    return;
  }

  return enemyPlayer.ships;
};

export const getAttackStatus = (x: number, y: number, userId: string) => {
  const enemyShips = getEnemyShips(userId);

  if (!enemyShips) {
    return 'miss';
  }

  const hitShip = getHitShip(x, y, enemyShips);

  if (hitShip) {
    hitShip.healthPoints = hitShip.healthPoints - 1;
    if (hitShip.healthPoints) {
      return 'shot';
    } else {
      return 'killed';
    }
  }

  return 'miss';
};

export const getHitShip = (x: number, y: number, enemyShips: Ship[]) => {
  return enemyShips.find((ship) => {
    if (ship.direction) {
      return x === ship.position.x && y >= ship.position.y && y < ship.position.y + ship.length;
    } else {
      return y === ship.position.y && x >= ship.position.x && x < ship.position.x + ship.length;
    }
  });
};

// TODO remove killed ship from array?
export const markKilledShip = (ship: Ship, userId: string) => {
  const result: AttackResponse[] = [];

  if (ship.direction) {
    for (let y = ship.position.y; y < ship.position.y + ship.length; y++) {
      const response: AttackResponse = {
        type: Command.Attack,
        data: JSON.stringify({
          position: { x: ship.position.x, y },
          currentPlayer: userId,
          status: 'killed',
        }),
        id: 0,
      };

      result.push(response);
    }
  } else {
    for (let x = ship.position.x; x < ship.position.x + ship.length; x++) {
      const response: AttackResponse = {
        type: Command.Attack,
        data: JSON.stringify({
          position: { x, y: ship.position.y },
          currentPlayer: userId,
          status: 'killed',
        }),
        id: 0,
      };

      result.push(response);
    }
  }

  return result;
};

export const shootAroundShip = (ship: Ship, userId: string) => {
  const result: AttackResponse[] = [];

  if (ship.direction) {
    for (let x = ship.position.x - 1; x <= ship.position.x + 1; x++)
      for (let y = ship.position.y - 1; y <= ship.position.y + ship.length; y++) {
        if (x === ship.position.x && y >= ship.position.y && y < ship.position.y + ship.length) {
          continue;
        }
        const response: AttackResponse = {
          type: Command.Attack,
          data: JSON.stringify({
            position: { x, y },
            currentPlayer: userId,
            status: 'miss',
          }),
          id: 0,
        };

        result.push(response);
      }
  } else {
    for (let x = ship.position.x - 1; x <= ship.position.x + ship.length; x++)
      for (let y = ship.position.y - 1; y <= ship.position.y + 1; y++) {
        if (x >= 0 && x < 10 && y >= 0 && y < 10) {
          if (x >= ship.position.x && x < ship.position.x + ship.length && y === ship.position.y) {
            continue;
          }

          const response: AttackResponse = {
            type: Command.Attack,
            data: JSON.stringify({
              position: { x, y },
              currentPlayer: userId,
              status: 'miss',
            }),
            id: 0,
          };

          result.push(response);
        }
      }
  }

  return result;
};

export const getWinner = (gameId: string) => {
  const game = getGameById(gameId);

  if (!game) {
    return;
  }

  const losingPlayer = game.players.find((player) => player.ships.every((ship) => ship.healthPoints === 0));

  if (!losingPlayer) {
    return;
  }

  const winner = game.players.find((player) => player.userId !== losingPlayer?.userId);

  return winner;
};
