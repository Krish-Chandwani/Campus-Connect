import type { Request, Response } from "express";
import mongoose from "mongoose";
import { toPublicUser, User, USER_ROLES, type UserRole } from "../models/User";

function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

export async function listUsers(req: Request, res: Response) {
  try {
    const filter: Record<string, unknown> = {};

    const search = req.query.search ? String(req.query.search).trim() : "";
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const role = req.query.role ? String(req.query.role) : undefined;
    if (role) {
      if (!isUserRole(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      filter.role = role;
    }

    const users = await User.find(filter).sort({ createdAt: -1 });
    return res.json({ users: users.map(toPublicUser) });
  } catch (error) {
    console.error("List users failed:", error);
    return res.status(500).json({ message: "Could not load users" });
  }
}

export async function updateUserRole(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const role = String(req.body.role ?? "").trim();
    if (!isUserRole(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (role === "admin") {
      return res.status(403).json({
        message: "Cannot promote users to admin. Campus Connect has a single admin.",
      });
    }

    if (req.user!.id === id) {
      return res.status(400).json({
        message: "You cannot change your own role",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        message: "Cannot change the admin account role",
      });
    }

    user.role = role;
    await user.save();

    return res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error("Update user role failed:", error);
    return res.status(500).json({ message: "Could not update user role" });
  }
}
