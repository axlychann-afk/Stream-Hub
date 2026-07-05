import { Router, type IRouter } from "express";
import healthRouter from "./health";
import donghuaRouter from "./donghua/index.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/donghua", donghuaRouter);

export default router;
