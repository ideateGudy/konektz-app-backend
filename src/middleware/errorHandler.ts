import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

const isProduction = process.env.NODE_ENV === "production";

// ─── Prisma error type guards ─────────────────────────────────────────────────
interface PrismaKnownError {
  name: "PrismaClientKnownRequestError";
  code: string;
  meta?: Record<string, unknown>;
}

interface PrismaValidationError {
  name: "PrismaClientValidationError";
}

interface PrismaInitError {
  name: "PrismaClientInitializationError";
}

const isPrismaKnownError = (err: unknown): err is PrismaKnownError =>
  typeof err === "object" &&
  err !== null &&
  (err as PrismaKnownError).name === "PrismaClientKnownRequestError";

const isPrismaValidationError = (err: unknown): err is PrismaValidationError =>
  typeof err === "object" &&
  err !== null &&
  (err as PrismaValidationError).name === "PrismaClientValidationError";

const isPrismaInitError = (err: unknown): err is PrismaInitError =>
  typeof err === "object" &&
  err !== null &&
  (err as PrismaInitError).name === "PrismaClientInitializationError";

// ─── Map Prisma / library errors to AppErrors ─────────────────────────────────
const normalizeError = (err: unknown): AppError | null => {
  // Prisma known request errors (constraint violations, not found, etc.)
  if (isPrismaKnownError(err)) {
    switch (err.code) {
      case "P2002": {
        const raw = err.meta?.target;
        let field: string | undefined;

        if (Array.isArray(raw) && raw.length > 0) {
          field = (raw as string[]).join(", ");
        } else if (typeof raw === "string") {
          const constraintMatch = raw.match(/^[^_]+_(.+?)_key$/);
          field = constraintMatch ? constraintMatch[1] : raw;
        }

        if (!field) {
          const msgMatch = (err as unknown as Error).message?.match(
            /`(.+?)`\)/,
          );
          field = msgMatch ? msgMatch[1] : "Field";
        }

        return new AppError(`${field} already in use`, 409);
      }
      case "P2003":
        return new AppError("Referenced resource not found", 404);
      case "P2011":
        return new AppError("Missing required field", 400);
      case "P2025":
        return new AppError(
          (err.meta?.cause as string) ?? "Record not found",
          404,
        );
      default:
        return new AppError(`Database error (${err.code})`, 400);
    }
  }

  // Prisma validation errors (bad query shape, wrong types, etc.)
  if (isPrismaValidationError(err)) {
    return new AppError("Invalid request data", 400);
  }

  // Prisma initialisation / connection errors
  if (isPrismaInitError(err)) {
    return new AppError("Database unavailable", 503);
  }

  // JWT errors
  if (err instanceof Error) {
    if (err.name === "JsonWebTokenError")
      return new AppError("Invalid token", 401);
    if (err.name === "TokenExpiredError")
      return new AppError("Token expired", 401);
  }

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

  // Known Prisma / library errors — normalise to AppError
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
