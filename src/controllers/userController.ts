import { User } from '../models/user';
import { checkPassword, hashPassword } from '../services/authService';
import * as userService from '../services/userService';
import { Command } from '../types/command';
import { RegistrationData } from '../types/request';
import { RegistrationResponse } from '../types/response';
import { CustomWebSocket } from '../types/websocket';
import { sendResponse } from '../utils/utils';

export const registerUser = async (ws: CustomWebSocket, data: RegistrationData, userId: string) => {
  const { name, password } = data;

  const user = userService.getUserByName(name);

  if (user) {
    const isPasswordCorrect = await checkPassword(password, user.hash);

    if (isPasswordCorrect && !isUserLoggedIn(user.name)) {
      const updatedUser: User = { ...user, index: userId, isLoggedIn: true };

      userService.updateUser(user.index, updatedUser);

      const response: RegistrationResponse = {
        type: Command.Reg,
        data: JSON.stringify({
          ...user,
          error: false,
          errorText: '',
        }),
        id: 0,
      };

      sendResponse(ws, response);
    } else if (isPasswordCorrect && isUserLoggedIn(user.name)) {
      const response: RegistrationResponse = {
        type: Command.Reg,
        data: JSON.stringify({
          error: true,
          errorText: 'You are already logged in. Please log out in another tab and try again.',
        }),
        id: 0,
      };

      sendResponse(ws, response);
    } else if (!isPasswordCorrect) {
      const response: RegistrationResponse = {
        type: Command.Reg,
        data: JSON.stringify({
          error: true,
          errorText: 'Sorry, the password you entered is incorrect. Please double-check your password and try again',
        }),
        id: 0,
      };

      sendResponse(ws, response);
    }
  } else {
    const hash = await hashPassword(password);
    const newUser: User = { name, index: userId, hash, isLoggedIn: true };
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
  }
};

export const isUserLoggedIn = (name: string): boolean => {
  const user = userService.getUserByName(name);

  if (!user) {
    return false;
  }

  return user.isLoggedIn;
};
