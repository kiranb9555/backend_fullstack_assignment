import { Server as HttpServer } from "http";
import { Server } from "socket.io";

import { prisma } from "../db/prisma.js";
import { logger } from "../logger/logger.js";
import { verifyAccessToken } from "../utils/jwt.js";

let io: Server | null = null;

const tenantRoom = (tenantId: string) =>
  `tenant:${tenantId}`;

const extractAccessToken = (
  authToken: unknown,
  authorizationHeader: string | undefined
): string | null => {
  if (
    typeof authToken === "string" &&
    authToken.trim().length > 0
  ) {
    return authToken.trim();
  }

  if (
    typeof authorizationHeader === "string" &&
    authorizationHeader.startsWith("Bearer ")
  ) {
    return authorizationHeader
      .replace("Bearer ", "")
      .trim();
  }

  return null;
};

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

  io.use(async (socket, next) => {
    const token = extractAccessToken(
      socket.handshake.auth?.token,
      socket.handshake.headers.authorization
    );

    if (!token) {
      return next(
        new Error("Missing access token")
      );
    }

    try {
      const payload =
        verifyAccessToken(token);

      const tenant =
        await prisma.tenant.findUnique({
          where: {
            id: payload.tenantId
          }
        });

      if (!tenant) {
        return next(
          new Error("Tenant not found")
        );
      }

      socket.data.tenantId =
        tenant.id;

      return next();
    } catch {
      return next(
        new Error("Invalid access token")
      );
    }
  });

  io.on("connection", socket => {
    const tenantId =
      socket.data.tenantId;

    void socket.join(
      tenantRoom(tenantId)
    );

    logger.info({
      event: "socket_connected",
      socketId: socket.id,
      tenantId,
      room: tenantRoom(tenantId)
    });

    socket.on(
      "join_tenant_room",
      (requestedTenantId: string) => {
        if (
          requestedTenantId !==
          socket.data.tenantId
        ) {
          logger.warn({
            event: "socket_cross_tenant_join_blocked",
            socketId: socket.id,
            tenantId:
              socket.data.tenantId,
            requestedTenantId
          });

          socket.emit(
            "error",
            {
              message:
                "Cannot join another tenant room"
            }
          );

          return;
        }

        void socket.join(
          tenantRoom(requestedTenantId)
        );

        logger.info({
          event: "socket_joined_room",
          socketId: socket.id,
          tenantId: requestedTenantId,
          room: tenantRoom(requestedTenantId)
        });
      }
    );

    socket.on("disconnect", () => {
      logger.info({
        event: "socket_disconnected",
        socketId: socket.id,
        tenantId
      });
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    return createNoopIo();
  }

  return io;
};

export const emitToTenantRoom = async (
  tenantId: string,
  eventName: string,
  payload: unknown
) => {
  const room = tenantRoom(tenantId);

  if (!io) {
    logger.info({
      event: "socket_emit",
      socketEvent: eventName,
      tenantId,
      room,
      recipientCount: 0,
      payload
    });
    return 0;
  }

  const recipients =
    await io.in(room).fetchSockets();

  io.to(room).emit(eventName, payload);

  logger.info({
    event: "socket_emit",
    socketEvent: eventName,
    tenantId,
    room,
    recipientCount: recipients.length,
    payload
  });

  return recipients.length;
};
