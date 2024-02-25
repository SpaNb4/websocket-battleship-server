import { db } from '../db/db';
import { User } from '../models/user';

export const getUserByName = (name: string) => {
  return db.users.find((user) => user.name === name);
};

export const getUserById = (id: string) => {
  return db.users.find((user) => user.index === id);
};

export const createUser = (newUser: User) => {
  db.users.push(newUser);
};

export const updateUser = (userId: string, changes: Partial<User>) => {
  const indexForUpdate = db.users.findIndex((user) => user.index === userId);

  if (indexForUpdate === -1) {
    return;
  }

  const updatedUser = {
    ...db.users[indexForUpdate],
    ...changes,
  };

  db.users[indexForUpdate] = updatedUser;
};
