import { db } from '../db/db';
import { Winner } from '../models/winner';

export const getAllWinners = () => {
  return db.winners;
};

export const addWinner = (newWinner: Winner) => {
  const winner = db.winners.find((winner) => winner.name === newWinner.name);

  if (winner) {
    winner.wins += 1;
  } else {
    db.winners.push(newWinner);
  }
};
