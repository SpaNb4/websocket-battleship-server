import { randomUUID as uuidv4 } from 'crypto';
import { wss } from '../index';
import * as roomService from '../services/roomService';
import * as userService from '../services/userService';
import { broadcastToAll } from '../utils/utils';

export const getAllRooms = () => {
  const rooms = roomService.getAllRooms();

  const response = {
    type: 'update_room',
    data: JSON.stringify(rooms),
    id: 0,
  };

  broadcastToAll(wss.clients, response);
};

export const removeRoomById = (roomId: string) => {
  roomService.removeRoomById(roomId);
};

export const removeRoomByUserId = (userId: string) => {
  roomService.removeRoomByUserId(userId);
};

export const isUserInRoom = (userId: string, roomId: string) => {
  if (roomService.isUserInRoom(userId, roomId)) {
    console.log('You are already in this room');
    return true;
  }

  return false;
};

export const createRoomWithUser = (userId: string) => {
  const user = userService.getUserById(userId);

  if (!user) {
    console.log('User not found');
    return;
  }

  const room = roomService.getRoomByUserId(userId);

  if (room) {
    console.log("You can't create a room if you're already in one");
    return;
  }

  const newRoom = { roomId: uuidv4(), roomUsers: [user] };

  roomService.createRoom(newRoom);

  const rooms = roomService.getAllRooms();

  const response = {
    type: 'update_room',
    data: JSON.stringify(rooms),
    id: 0,
  };

  broadcastToAll(wss.clients, response);
};

export const addUserToRoom = (data: any, userId: string) => {
  const { indexRoom } = data;

  const user = userService.getUserById(userId);

  if (!user) {
    console.log('User not found');
    return;
  }

  roomService.addUserToRoom(indexRoom, user);

  const rooms = roomService.getAllRooms();

  roomService.removeUserFromOwnRoomOnJoin(indexRoom, userId);

  const response = {
    type: 'update_room',
    data: JSON.stringify(rooms),
    id: 0,
  };

  broadcastToAll(wss.clients, response);
};
