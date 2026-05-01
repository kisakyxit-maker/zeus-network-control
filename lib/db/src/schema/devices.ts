import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const deviceStatusEnum = pgEnum("device_status", ["online", "offline", "idle", "busy"]);

export const devicesTable = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  model: text("model").notNull(),
  os: text("os").notNull(),
  osVersion: text("os_version").notNull(),
  ipAddress: text("ip_address").notNull(),
  status: deviceStatusEnum("status").notNull().default("offline"),
  batteryLevel: integer("battery_level").notNull().default(100),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
  socketId: text("socket_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDeviceSchema = createInsertSchema(devicesTable).omit({ id: true, createdAt: true });
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof devicesTable.$inferSelect;
