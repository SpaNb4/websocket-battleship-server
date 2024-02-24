/* eslint-disable @typescript-eslint/no-explicit-any */
import { AddUserToRoomData, AttackData, PlayerShipsData, RandomAttackData, RegistrationData } from '../types/request';

export const isRegistrationData = (data: any): data is RegistrationData => {
  return data && typeof data === 'object' && 'name' in data && 'password' in data;
};

export const isAddUserToRoomData = (data: any): data is AddUserToRoomData => {
  return data && typeof data === 'object' && 'indexRoom' in data;
};

export const isPlayerShipsData = (data: any): data is PlayerShipsData => {
  return data && typeof data === 'object' && 'gameId' in data && 'ships' in data && 'indexPlayer' in data;
};

export const isAttackData = (data: any): data is AttackData => {
  return data && typeof data === 'object' && 'x' in data && 'y' in data && 'gameId' in data && 'indexPlayer' in data;
};

export const isRandomAttackData = (data: any): data is RandomAttackData => {
  return data && typeof data === 'object' && 'gameId' in data && 'indexPlayer' in data;
};
