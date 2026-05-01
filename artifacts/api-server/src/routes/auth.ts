import { Router } from "express";
import bcrypt from "bcrypt";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";

const router = Router();

router.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.email, email.toLowerCase()) });
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  if (user.role !== "admin" && user.status !== "approved") {
    res.status(403).json({ error: user.status === "pending" ? "Account pending approval" : "Account rejected" });
    return;
  }
  req.session.userId = user.id;
  req.session.role = user.role;
  res.json({ id: user.id, email: user.email, role: user.role, status: user.status });
});

router.post("/auth/register", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  const existing = await db.query.usersTable.findFirst({ where: eq(usersTable.email, email.toLowerCase()) });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [newUser] = await db.insert(usersTable).values({
    email: email.toLowerCase(),
    passwordHash,
    role: "member",
    status: "pending",
  }).returning();
  res.status(201).json({ id: newUser.id, email: newUser.email, role: newUser.role, status: newUser.status });
});

router.post("/auth/logout", (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get("/auth/me", async (req: Request, res: Response) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, req.session.userId) });
  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ id: user.id, email: user.email, role: user.role, status: user.status });
});

export default router;
