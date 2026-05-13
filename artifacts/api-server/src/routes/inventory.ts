import { Router, type Request, type Response } from "express";
import { db, devicesTable, eventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Server as SocketIoServer } from "socket.io";
import { z } from "zod";

const router = Router();

const InventoryReportBody = z.object({
  model: z.string().optional(),
  brand: z.string().optional(),
  osName: z.string().optional(),
  osVersion: z.string().optional(),
  deviceName: z.string().optional(),
  reportedAt: z.string().optional(),
});

function getClientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0]!.trim();
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

router.post("/inventory/report", async (req: Request, res: Response) => {
  const parsed = InventoryReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.issues });
    return;
  }

  const data = parsed.data;
  const name =
    data.deviceName ||
    [data.brand, data.model].filter(Boolean).join(" ") ||
    "Unknown device";
  const model = data.model || "unknown";
  const os = data.osName || "unknown";
  const osVersion = data.osVersion || "unknown";
  const ip = getClientIp(req);

  const existing = await db.query.devicesTable.findFirst({
    where: eq(devicesTable.name, name),
  });

  let deviceId: number;
  let isNew = false;

  if (existing) {
    deviceId = existing.id;
    await db
      .update(devicesTable)
      .set({ model, os, osVersion, ipAddress: ip, lastSeen: new Date() })
      .where(eq(devicesTable.id, existing.id));
  } else {
    const [inserted] = await db
      .insert(devicesTable)
      .values({ name, model, os, osVersion, ipAddress: ip })
      .returning({ id: devicesTable.id });
    deviceId = inserted!.id;
    isNew = true;
  }

  await db.insert(eventsTable).values({
    deviceId,
    type: "inventory",
    message: isNew
      ? `Device ${name} registered (${model}, ${os} ${osVersion})`
      : `Inventory updated for ${name}`,
  });

  const io: SocketIoServer | undefined = req.app.get("io");
  if (io) {
    io.emit("event:new", {
      deviceId,
      deviceName: name,
      type: "inventory",
      message: isNew ? `Device ${name} registered` : `Inventory updated for ${name}`,
      createdAt: new Date().toISOString(),
    });
    if (isNew) {
      io.emit("device:connected", {
        deviceId,
        deviceName: name,
        createdAt: new Date().toISOString(),
      });
    }
  }

  res.json({ success: true, deviceId, isNew });
});

export default router;
