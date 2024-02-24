import { db } from '../db/db';
import { Room } from '../models/room';
import { User } from '../models/user';

export const getAllRooms = () => {
  return db.rooms;
};

export const createRoom = (room: Room) => {
  db.rooms.push(room);
};

export const getRoomById = (roomId: string) => {
  return db.rooms.find((room) => room.roomId === roomId);
};

export const getRoomByUserId = (userId: string) => {
  return db.rooms.find((room) => room.roomUsers.find((user) => user.index === userId));
};

export const removeRoomById = (roomId: string) => {
  const indexForRemove = db.rooms.findIndex((room) => room.roomId === roomId);

  if (indexForRemove) {
    db.rooms.splice(indexForRemove, 1);
  }
};

export const removeRoomByUserId = (userId: string) => {
  const indexForRemove = db.rooms.findIndex((room) => room.roomUsers.find((user) => user.index === userId));

  if (indexForRemove) {
    db.rooms.splice(indexForRemove, 1);
  }
};

export const addUserToRoom = (roomId: string, user: User) => {
  const room = getRoomById(roomId);

  if (room) {
    room.roomUsers.push(user);
  }
};

// If user is already in his own room and joins another room, remove his own room
export const removeUserFromOwnRoomOnJoin = (roomId: string, userId: string) => {
  const rooms = getAllRooms();

  rooms.forEach((room) => {
    if (room.roomId !== roomId && room.roomUsers.find((user) => user.index === userId)) {
      removeRoomById(room.roomId);
    }
  });
};
