import { Server as HttpServer } from "http";
import { Server } from "socket.io";

let io: Server | null = null;

const createNoopIo = () => {
  return {
    to: () => ({
      emit: () => undefined
    })
  };
};

export const initializeSocket = (
  server: HttpServer
) => {
  io = new Server(server, {
    cors: {
      origin: "*"
    }
  });

  io.on("connection", socket => {
    socket.on(
      "join_tenant_room",
      (tenantId: string) => {
        socket.join(`tenant:${tenantId}`);
      }
    );
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    return createNoopIo();
  }

  return io;
};