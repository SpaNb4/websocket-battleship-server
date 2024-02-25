import { Ship } from './ship';

export interface Player {
  userId: string;
  ships: Ship[];
  targetedCoordinates: Set<string>;
}
