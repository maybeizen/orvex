import { Router } from "express";
import healthRouter from "./health";
import waitlistRouter from "./waitlist";

const router: Router = Router();

router.use("/", healthRouter);
router.use("/", waitlistRouter);

export default router;
