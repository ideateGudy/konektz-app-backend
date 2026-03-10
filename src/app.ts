import express, { Request, Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

// Routes
import healthRoute from "./routes/health.route";
import authRoute from "./routes/auth.route";
import conversationRoute from "./routes/conversation.route";
import messageRoute from "./routes/message.route";

const app = express();

// ─── Core Middleware ───────────────────────────────────────────────────────────
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);
app.use(express.json());

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
app.use("/conversations", conversationRoute);
app.use("/messages", messageRoute);

export default app;
