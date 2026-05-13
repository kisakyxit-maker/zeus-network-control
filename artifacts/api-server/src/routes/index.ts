import { Router, type IRouter } from "express";
import healthRouter from "./health";
import devicesRouter from "./devices";
import authRouter from "./auth";
import membersRouter from "./members";
import inventoryRouter from "./inventory";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(membersRouter);
router.use(devicesRouter);
router.use(inventoryRouter);

export default router;
