import { Game } from '../models/game';
import { Room } from '../models/room';
import { User } from '../models/user';
import { Winner } from '../models/winner';

const winners: Winner[] = [];

const users: User[] = [];

const rooms: Room[] = [];

const games: Game[] = [];

export const db = {
  winners,
  users,
  rooms,
  games,
};
