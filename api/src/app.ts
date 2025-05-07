import "dotenv/config";
import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import db from "./utils/database";

import routes from "./routes/";

const app: Express = express();

db.connect().catch((e: Error) => console.error("DB Connection Error:", e));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const applySecurityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
};
app.use(applySecurityHeaders);

const handleError = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({
    status: "error",
    message: "Internal Server Error",
  });
};
app.use(handleError);

app.use("/api", routes);

export default app;
