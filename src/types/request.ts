import { ShipWithoutHealth } from '../models/ship';
import { User } from '../models/user';
import { Command } from './command';

export interface Request {
  type: Command;
  data: string;
  id: number;
}

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
