import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

const isProduction = process.env.NODE_ENV === "production";

// ─── Map raw DB/library errors to AppErrors ──────────────────────────────────
const normalizeError = (err: any): AppError | null => {
  // PostgreSQL error codes
  if (err.code === "23505")
    return new AppError("Email or username already in use", 409);
  if (err.code === "23503")
    return new AppError("Referenced resource not found", 404);
  if (err.code === "23502") return new AppError("Missing required field", 400);
  // JWT errors
  if (err.name === "JsonWebTokenError")
    return new AppError("Invalid token", 401);
  if (err.name === "TokenExpiredError")
    return new AppError("Token expired", 401);
  return null;
};

// ─── Global Error Handler ──────────────────────────────────────────────────────
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Operational errors (AppError): send the intended status + message
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
    return;
  }

  // Known DB / library errors — normalise to AppError
  const normalized = normalizeError(err);
  if (normalized) {
    res.status(normalized.statusCode).json({
      status: "error",
      message: normalized.message,
    });
    return;
  }

  // Unexpected / programmer errors
  console.error("Unhandled error:", err);

  res.status(500).json({
    status: "error",
    method: _req.method,
    path: _req.originalUrl,
    message: isProduction ? "Internal server error" : err.message,
    ...(!isProduction && { stack: err.stack }),
  });
};

// ─── 404 Not Found Handler ─────────────────────────────────────────────────────
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
};
