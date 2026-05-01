import { Router } from "express";
import { db } from "@workspace/db";
import { devicesTable, eventsTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import {
  GetDeviceParams,
  ListEventsQueryParams,
  SendCommandBody,
} from "@workspace/api-zod";
import type { Request, Response } from "express";
import type { Server as SocketIoServer } from "socket.io";

const router = Router();

router.get("/devices", async (req: Request, res: Response) => {
  const devices = await db.query.devicesTable.findMany({
    orderBy: desc(devicesTable.lastSeen),
  });
  res.json(devices);
});

router.get("/devices/stats", async (req: Request, res: Response) => {
  const rows = await db
    .select({ status: devicesTable.status, count: sql<number>`count(*)::int` })
    .from(devicesTable)
    .groupBy(devicesTable.status);

  const stats = { total: 0, online: 0, offline: 0, idle: 0, busy: 0 };
  for (const row of rows) {
    const s = row.status as keyof typeof stats;
    stats[s] = row.count;
    stats.total += row.count;
  }
  res.json(stats);
});

router.get("/devices/:id", async (req: Request, res: Response) => {
  const parsed = GetDeviceParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }
  const device = await db.query.devicesTable.findFirst({
    where: eq(devicesTable.id, parsed.data.id),
  });
  if (!device) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(device);
});

router.get("/events", async (req: Request, res: Response) => {
  const parsed = ListEventsQueryParams.safeParse(req.query);
  const query = parsed.success ? parsed.data : {};
  const limit = query.limit ?? 50;

  const events = await db
    .select({
      id: eventsTable.id,
      deviceId: eventsTable.deviceId,
      deviceName: devicesTable.name,
      type: eventsTable.type,
      message: eventsTable.message,
      createdAt: eventsTable.createdAt,
    })
    .from(eventsTable)
    .innerJoin(devicesTable, eq(eventsTable.deviceId, devicesTable.id))
    .where(query.deviceId ? eq(eventsTable.deviceId, query.deviceId) : undefined)
    .orderBy(desc(eventsTable.createdAt))
    .limit(limit);

  res.json(events);
});

router.get("/commands", async (_req: Request, res: Response) => {
  res.json([
    { id: "launch_app", label: "Launch App", description: "Launch the default application", icon: "play" },
    { id: "lock", label: "Lock", description: "Lock the device screen", icon: "lock" },
    { id: "update_status", label: "Update Status", description: "Request device status update", icon: "refresh-cw" },
    { id: "screenshot", label: "Screenshot", description: "Request a screenshot from the device", icon: "camera" },
    { id: "reboot", label: "Reboot", description: "Reboot the device remotely", icon: "power" },
    { id: "factory_reset", label: "Factory Reset", description: "Factory reset the device", icon: "trash-2" },
  ]);
});

router.post("/commands", async (req: Request, res: Response) => {
  const parsed = SendCommandBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { deviceId, command } = parsed.data;

  const device = await db.query.devicesTable.findFirst({
    where: eq(devicesTable.id, deviceId),
  });

  if (!device) {
    res.status(404).json({ success: false, message: "Device not found" });
    return;
  }

  const io: SocketIoServer = req.app.get("io");

  if (device.socketId) {
    io.to(device.socketId).emit("command:received", { command });
  }

  await db.insert(eventsTable).values({
    deviceId,
    type: "command",
    message: `Command sent: ${command}`,
  });

  io.emit("event:new", {
    deviceId,
    deviceName: device.name,
    type: "command",
    message: `Command sent to ${device.name}: ${command}`,
    createdAt: new Date().toISOString(),
  });

  res.json({ success: true, message: `Command '${command}' sent to ${device.name}` });
});

export default router;
