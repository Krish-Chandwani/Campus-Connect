import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { Club } from "../models/Club";
import { Event } from "../models/Event";

export async function requireEventOrganizer(
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
      return res.status(400).json({ message: "Invalid event id" });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (req.user.role === "admin") {
      req.event = event;
      return next();
    }

    const club = await Club.findById(event.clubId);
    if (!club) {
      return res.status(404).json({ message: "Club for this event not found" });
    }

    const isOrganizer = club.organizerIds.some((organizerId) =>
      organizerId.equals(req.user!.id)
    );

    if (!isOrganizer) {
      return res
        .status(403)
        .json({ message: "Only club organizers can manage this event" });
    }

    req.event = event;
    req.club = club;
    next();
  } catch (error) {
    console.error("Event organizer check failed:", error);
    return res.status(500).json({ message: "Could not verify event access" });
  }
}
