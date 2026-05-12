import { Router, type IRouter } from "express";
import healthRouter from "./health";
import devicesRouter from "./devices";
import authRouter from "./auth";
import membersRouter from "./members";

const router: IRouter = Router();

// 1. Rota de teste rápido (O que o Kodular vai chamar)
router.get('/check', (req, res) => {
  const version = req.query.version || "desconhecida";
  console.log("--- DISPOSITIVO APEX DETECTADO ---");
  console.log("Versão:", version);
  res.status(200).json({ status: "success", message: "Apex Online" });
});

// 2. Outras rotas do sistema
router.use(healthRouter);
router.use(authRouter);
router.use(membersRouter);
router.use(devicesRouter);

export default router;

