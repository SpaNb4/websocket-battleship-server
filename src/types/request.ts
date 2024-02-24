import { ShipWithoutHealth } from '../models/ship';
import { User } from '../models/user';

export type RequestData =
  | RegistrationData
  | UpdateRoomData
  | PlayerShipsData
  | AttackData
  | RandomAttackData
  | AddUserToRoomData;

export interface RegistrationData {
  name: string;
  password: string;
}

export interface UpdateRoomData {
  roomId: string;
  roomUsers: User[];
}

export interface PlayerShipsData {
  ships: ShipWithoutHealth[];
  gameId: string;
}

export interface AttackData {
  x: number;
  y: number;
  gameId: string;
  indexPlayer: string;
}

export interface RandomAttackData {
  gameId: string;
  indexPlayer: string;
}

export interface AddUserToRoomData {
  indexRoom: string;
}
