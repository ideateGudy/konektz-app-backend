import "./config/env"; // Loads .env and validates required vars

import app from "./app";

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// ─── Process-level crash guards ───────────────────────────────────────────────
process.on("unhandledRejection", (reason: unknown) => {
  console.error("Unhandled Promise Rejection:", reason);
  // Graceful shutdown: let in-flight requests finish, then exit
  server.close(() => {
    process.exit(1);
  });
});

process.on("uncaughtException", (err: Error) => {
  console.error("Uncaught Exception:", err);
  server.close(() => {
    process.exit(1);
  });
});
