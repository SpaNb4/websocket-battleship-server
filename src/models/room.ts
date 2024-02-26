import { User } from './user';

export interface Room {
  roomId: string;
  roomUsers: User[];
}
