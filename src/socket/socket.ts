import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server;

export const initializeSocket = (
  server: HttpServer
): Server => {

  io = new Server(server, {
    cors: {
      origin: "*"
    }
  });

  io.on(
    "connection",
    socket => {

      socket.on(
        "join_tenant",
        (tenantId: string) => {

          socket.join(
            `tenant:${tenantId}`
          );
        }
      );
    }
  );

  return io;
};

export const getIO = (): Server => {

  if (!io) {
    throw new Error(
      "Socket not initialized"
    );
  }

  return io;
};