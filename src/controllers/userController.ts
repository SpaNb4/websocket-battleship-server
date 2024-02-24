import { WebSocket } from 'ws';
import { User } from '../models/user';
import { checkPassword, hashPassword } from '../services/authService';
import * as userService from '../services/userService';
import { Command } from '../types/command';
import { RegistrationData } from '../types/request';
import { RegistrationResponse } from '../types/response';
import { sendResponse } from '../utils/utils';

export const registerUser = async (ws: WebSocket, data: RegistrationData, userId: string) => {
  const { name, password } = data;

  const user = userService.getUserByName(name);

  if (user) {
    const isPasswordCorrect = await checkPassword(password, user.hash);

    if (!isPasswordCorrect) {
      const response: RegistrationResponse = {
        type: Command.Reg,
        data: JSON.stringify({
          error: true,
          errorText: 'Invalid password for the provided username. Please try again.',
        }),
        id: 0,
      };

      sendResponse(ws, response);
      return;
    }
  }

  const hash = await hashPassword(password);
  const newUser: User = { name, index: userId, hash };
  userService.createUser(newUser);

  const response: RegistrationResponse = {
    type: Command.Reg,
    data: JSON.stringify({
      ...newUser,
      error: false,
      errorText: '',
    }),
    id: 0,
  };

  sendResponse(ws, response);
};
