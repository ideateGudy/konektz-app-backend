import { Request, Response } from "express";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import pool from "../models/db";
import { AppError } from "../utils/AppError";

const SALT = 12;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Express 5 automatically forwards thrown errors and rejected promises
// to the global error handler — no try/catch or next(err) needed.

export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new AppError("username, email and password are required", 400);
  }

  const hashedPassword = await bcrypt.hash(password, SALT);

  const result = await pool.query(
    "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, created_at",
    [username, email, hashedPassword]
  );

  const user = result.rows[0];

  res.status(201).json({statusCode: 201, message: "User registered successfully", user });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("email and password are required", 400);
  }

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

  res.status(200).json({
    statusCode: 200,
    message: "Login successful",
    token,
    user: { id: user.id, username: user.username, email: user.email },
  });
};
