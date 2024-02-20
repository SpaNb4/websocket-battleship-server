export interface User {
  index: string;
  name: string;
}

export interface Winners {
  name: string;
  wins: number;
}

export interface Rooms {
  roomId: string;
  roomUsers: User[];
}

export interface Ship {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  healthPoints: number;
  type: 'small' | 'medium' | 'large' | 'huge';
}

export interface Player {
  userId: string;
  ships: Ship[];
}

export interface Game {
  gameId: string;
  players: Player[];
  turn: string;
  lastAttackStatus: string | null;
}

export const winners: Winners[] = [];

// TODO Store passwords?
export const users: User[] = [];

export const rooms: Rooms[] = [];

export const games: Game[] = [];

// let currentTurn: User | null = null;

// export const getCurrentTurn = () => currentTurn;

// export const setCurrentTurn = (user: User) => {
//   currentTurn = user;
// };

// let lastAttackStatus: string = '';

// export const getLastAttackStatus = () => lastAttackStatus;

// export const setLastAttackStatus = (status: string) => {
//   lastAttackStatus = status;
// };
