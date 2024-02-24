import { Command } from './command';

export interface Response {
  type: Command;
  data: string;
  id: number;
}

export interface RegistrationResponse extends Response {
  type: Command.Reg;
}

export interface CreateGameResponse extends Response {
  type: Command.CreateGame;
}

export interface StartGameResponse extends Response {
  type: Command.StartGame;
}

export interface AttackResponse extends Response {
  type: Command.Attack;
}

export interface TurnResponse extends Response {
  type: Command.Turn;
}

export interface FinishResponse extends Response {
  type: Command.Finish;
}

export interface UpdateRoomResponse extends Response {
  type: Command.UpdateRoom;
}

export interface UpdateWinnersResponse extends Response {
  type: Command.UpdateWinners;
}
