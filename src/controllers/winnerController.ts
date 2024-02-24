import { wss } from '../index';
import * as userService from '../services/userService';
import * as winnerService from '../services/winnerService';
import { Command } from '../types/command';
import { UpdateWinnersResponse } from '../types/response';
import { broadcastToAll } from '../utils/utils';

export const getAllWinners = () => {
  const winners = winnerService.getAllWinners();

  const response: UpdateWinnersResponse = {
    type: Command.UpdateWinners,
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

  const response: UpdateWinnersResponse = {
    type: Command.UpdateWinners,
    data: JSON.stringify(winners),
    id: 0,
  };

  broadcastToAll(wss.clients, response);
};
