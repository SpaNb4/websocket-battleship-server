import { wss } from '../index';
import * as winnerService from '../services/winnerService';
import * as userService from '../services/userService';
import { broadcastToAll } from '../utils/utils';

export const getAllWinners = () => {
  const winners = winnerService.getAllWinners();

  const response = {
    type: 'update_winners',
    data: JSON.stringify(winners),
    id: 0,
  };

  broadcastToAll(wss.clients, response);
};

export const addWinner = (userId: string) => {
  const user = userService.getUserById(userId);

  if (!user) {
    return;
  }

  const newWinner = { name: user.name, wins: 1 };

  winnerService.addWinner(newWinner);

  const winners = winnerService.getAllWinners();

  const response = {
    type: 'update_winners',
    data: JSON.stringify(winners),
    id: 0,
  };

  broadcastToAll(wss.clients, response);
};
