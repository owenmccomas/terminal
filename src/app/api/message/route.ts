import { Server as SocketIOServer, Socket } from "socket.io";
import type { NextApiRequest, NextApiResponse } from "next";
import { Server as HTTPServer } from "http";

type ExtendedHTTPServer = HTTPServer & {
  io?: SocketIOServer;
};

type Room = {
  [roomName: string]: string[];
};

const rooms: Room = {};

export const GET = (req: NextApiRequest, res: NextApiResponse) => {
  const socket = req.socket as any;
  const server = socket.server as ExtendedHTTPServer;

  if (!server.io) {
    console.log("Initializing Socket.IO");
    const io = new SocketIOServer(server);

    io.on("connection", (socket: Socket) => {
      console.log(`New connection: ${socket.id}`);

      socket.on("createRoom", (roomName: string) => {
        if (!rooms[roomName]) {
          rooms[roomName] = [];
        }
        socket.join(roomName);
        rooms[roomName]?.push(socket.id);
        socket.emit("roomCreated", roomName);
      });

      socket.on("joinRoom", (roomName: string) => {
        if (rooms[roomName]) {
          socket.join(roomName);
          rooms[roomName]?.push(socket.id);
          socket.emit("roomJoined", roomName);
          socket
            .to(roomName)
            .emit("newUserJoined", `A new user joined ${roomName}`);
        } else {
          socket.emit("error", `Room ${roomName} does not exist`);
        }
      });

      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        // Remove the user from any rooms they are in
        for (const roomName in rooms) {
          if (rooms[roomName]?.includes(socket.id)) {
            rooms[roomName] =
              rooms[roomName]?.filter((id) => id !== socket.id) || [];
            if (rooms[roomName]?.length === 0) {
              delete rooms[roomName]; // Optional: Delete empty room
            }
          }
        }
      });

      // Other event handlers...
    });

    server.io = io;
  } else {
    console.log("Socket.IO already running");
  }

  res.end();
};
