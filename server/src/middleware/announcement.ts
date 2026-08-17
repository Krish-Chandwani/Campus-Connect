import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { Announcement } from "../models/Announcement";
import { Club } from "../models/Club";

export async function requireAnnouncementManager(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { id } = req.params;
    if (!id || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid announcement id" });
    }

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    if (req.user.role === "admin") {
      req.announcement = announcement;
      return next();
    }

    if (announcement.audience === "all") {
      return res
        .status(403)
        .json({ message: "Only admins can manage campus-wide announcements" });
    }

    if (!announcement.clubId) {
      return res.status(400).json({ message: "Club announcement is missing clubId" });
    }

    const club = await Club.findById(announcement.clubId);
    if (!club) {
      return res.status(404).json({ message: "Club for this announcement not found" });
    }

    const isOrganizer = club.organizerIds.some((organizerId) =>
      organizerId.equals(req.user!.id)
    );

    if (!isOrganizer) {
      return res.status(403).json({
        message: "Only club organizers can manage this announcement",
      });
    }

    req.announcement = announcement;
    req.club = club;
    next();
  } catch (error) {
    console.error("Announcement manager check failed:", error);
    return res
      .status(500)
      .json({ message: "Could not verify announcement access" });
  }
}
