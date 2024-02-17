export interface User {
  index: string;
  name: string;
}

export interface Winners {
  name: string;
  winds: number;
}

export interface Rooms {
  roomId: string;
  roomUsers: User[];
}


export const winners: Winners[] = [];

// Store passwords?
export const users: User[] = [];

export const rooms: Rooms[] = [];
