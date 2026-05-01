import { type Server as SocketIoServer } from "socket.io";
import { db } from "@workspace/db";
import { devicesTable, eventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./lib/logger";

export function setupSocket(io: SocketIoServer) {
  io.on("connection", async (socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    const deviceId = socket.handshake.query.deviceId;

    if (deviceId && typeof deviceId === "string") {
      const id = Number(deviceId);
      await db
        .update(devicesTable)
        .set({ status: "online", socketId: socket.id, lastSeen: new Date() })
        .where(eq(devicesTable.id, id));

      const device = await db.query.devicesTable.findFirst({
        where: eq(devicesTable.id, id),
      });

      if (device) {
        await db.insert(eventsTable).values({
          deviceId: id,
          type: "connection",
          message: `Device ${device.name} connected`,
        });

        io.emit("device:status", { deviceId: id, status: "online", socketId: socket.id });
        io.emit("event:new", {
          deviceId: id,
          deviceName: device.name,
          type: "connection",
          message: `Device ${device.name} connected`,
          createdAt: new Date().toISOString(),
        });
      }
    }

    socket.on("device:stream", (data: { deviceId: number; frame: string }) => {
      socket.broadcast.emit("stream:frame", data);
    });

    socket.on("device:event", async (data: { deviceId: number; type: string; message: string }) => {
      const device = await db.query.devicesTable.findFirst({
        where: eq(devicesTable.id, data.deviceId),
      });
      if (!device) return;
      await db.insert(eventsTable).values({
        deviceId: data.deviceId,
        type: data.type,
        message: data.message,
      });
      await db.update(devicesTable).set({ lastSeen: new Date() }).where(eq(devicesTable.id, data.deviceId));
      io.emit("event:new", {
        deviceId: data.deviceId,
        deviceName: device.name,
        type: data.type,
        message: data.message,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on("command:send", async (data: { deviceId: number; command: string }) => {
      const device = await db.query.devicesTable.findFirst({
        where: eq(devicesTable.id, data.deviceId),
      });
      if (!device || !device.socketId) return;
      io.to(device.socketId).emit("command:received", { command: data.command });
      await db.insert(eventsTable).values({
        deviceId: data.deviceId,
        type: "command",
        message: `Command sent: ${data.command}`,
      });
      io.emit("event:new", {
        deviceId: data.deviceId,
        deviceName: device.name,
        type: "command",
        message: `Command sent to ${device.name}: ${data.command}`,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on("disconnect", async () => {
      logger.info({ socketId: socket.id }, "Socket disconnected");

      const devices = await db.query.devicesTable.findMany({
        where: eq(devicesTable.socketId, socket.id),
      });

      for (const device of devices) {
        await db
          .update(devicesTable)
          .set({ status: "offline", socketId: null, lastSeen: new Date() })
          .where(eq(devicesTable.id, device.id));

        await db.insert(eventsTable).values({
          deviceId: device.id,
          type: "disconnection",
          message: `Device ${device.name} disconnected`,
        });

        io.emit("device:status", { deviceId: device.id, status: "offline", socketId: null });
        io.emit("event:new", {
          deviceId: device.id,
          deviceName: device.name,
          type: "disconnection",
          message: `Device ${device.name} disconnected`,
          createdAt: new Date().toISOString(),
        });
      }
    });
  });
}
