export interface User {
  index: string;
  name: string;
  isReady: boolean;
}

export interface Winners {
  name: string;
  winds: number;
}

export interface Rooms {
  roomId: string;
  roomUsers: User[];
}

interface ShipPosition {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  healthPoints: number;
  type: 'small' | 'medium' | 'large' | 'huge';
}

export interface Ships {
  userId: string;
  shipPositions: ShipPosition[];
}

export const winners: Winners[] = [];

// Store passwords?
export const users: User[] = [];

export const rooms: Rooms[] = [];

export const ships: Ships[] = [];

let currentTurn: User | null = null;

export const getCurrentTurn = () => currentTurn;

export const setCurrentTurn = (user: User) => {
  currentTurn = user;
};

let lastAttackStatus: string = '';

export const getLastAttackStatus = () => lastAttackStatus;

export const setLastAttackStatus = (status: string) => {
  lastAttackStatus = status;
};
