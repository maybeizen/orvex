import express, { Request, Response } from "express";

// src/controllers/HealthCheckController.ts
class HealthCheckController {
  static async check(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  }
}

export default HealthCheckController;
