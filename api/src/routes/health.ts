import { Router } from "express";
import HealthCheckController from "../controllers/HealthCheckController";

const healthRouter: Router = Router();

healthRouter.get("/health", HealthCheckController.check);

export default healthRouter;
