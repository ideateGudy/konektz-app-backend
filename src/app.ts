import express, { Request, Response } from "express";
import { json } from "body-parser";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

// Routes
import healthRoute from "./routes/health.route";
import authRoute from "./routes/auth.route";

const app = express();

// ─── Core Middleware ───────────────────────────────────────────────────────────
app.use(cors());
app.use(json());

// ─── Swagger Docs ─────────────────────────────────────────────────────────────
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/docs.json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get("/", (_req: Request, res: Response) => {
  res.json({ status: "success", message: "Welcome to Konektz API" });
});

app.use("/health", healthRoute);
app.use("/auth", authRoute);

// ─── Error Handling ────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
