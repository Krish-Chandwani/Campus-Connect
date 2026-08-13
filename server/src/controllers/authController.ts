import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { toPublicUser, User } from "../models/User";
import { signAuthToken } from "../utils/jwt";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function register(req: Request, res: Response) {
  try {
    const name = String(req.body.name ?? "").trim();
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");
    const department = req.body.department
      ? String(req.body.department).trim()
      : undefined;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Enter a valid email" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      department,
      role: "student",
    });

    const token = signAuthToken(user.id);

    return res.status(201).json({
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error("Register failed:", error);
    return res.status(500).json({ message: "Could not register user" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signAuthToken(user.id);

    return res.json({
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ message: "Could not log in" });
  }
}

export async function me(req: Request, res: Response) {
  return res.json({ user: req.user ? toPublicUser(req.user) : null });
}
