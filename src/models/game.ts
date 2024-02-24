import { Player } from "./player";

export interface Game {
  gameId: string;
  players: Player[];
  turn: string;
  lastAttackStatus: string | null;
}
