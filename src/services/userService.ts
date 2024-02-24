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
