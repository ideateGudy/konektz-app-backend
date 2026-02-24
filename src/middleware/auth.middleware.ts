import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization?.split(" ")[1];

  if (!authHeader) {
    res.status(403).json({ status: "error", message: "Missing token" });
    return;
  }

  const decoded = jwt.verify(authHeader, env.JWT_SECRET) as {
    id: string;
    email: string;
  };
  req.user = { id: decoded.id, email: decoded.email };
  next();
};
