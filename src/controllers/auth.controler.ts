import { Request, Response } from "express";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import prisma from "../models/db";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

const SALT = 12;

export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new AppError("username, email and password are required", 400);
  }

  const hashedPassword = await bcrypt.hash(password, SALT);

  const user = await prisma.user.create({
    data: { username, email, password: hashedPassword },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.status(201).json({
    status: "success",
    message: "User registered successfully",
    data: { user },
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("email and password are required", 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.status(200).json({
    status: "success",
    message: "Login successful",
    token,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    },
  });
};
