import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, ne } from "drizzle-orm";
import type { Request, Response } from "express";

const router = Router();

function requireAdmin(req: Request, res: Response, next: () => void) {
  if (!req.session.userId || req.session.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

router.get("/members", requireAdmin, async (_req: Request, res: Response) => {
  const members = await db.query.usersTable.findMany({
    where: ne(usersTable.role, "admin"),
    orderBy: (u, { desc }) => [desc(u.createdAt)],
  });
  res.json(members.map(m => ({ id: m.id, email: m.email, role: m.role, status: m.status, createdAt: m.createdAt })));
});

router.post("/members/:id/approve", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  await db.update(usersTable).set({ status: "approved", updatedAt: new Date() }).where(eq(usersTable.id, id));
  res.json({ success: true });
});

router.post("/members/:id/reject", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  await db.update(usersTable).set({ status: "rejected", updatedAt: new Date() }).where(eq(usersTable.id, id));
  res.json({ success: true });
});

router.delete("/members/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ success: true });
});

export default router;
