import crypto from "crypto";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Club } from "../models/Club";
import {
  EVENT_STATUSES,
  Event,
  toPublicEvent,
  type EventStatus,
} from "../models/Event";

function parseObjectId(id: string | undefined) {
  if (!id || !mongoose.isValidObjectId(id)) {
    return null;
  }
  return id;
}

function isEventStatus(value: string): value is EventStatus {
  return (EVENT_STATUSES as readonly string[]).includes(value);
}

async function userCanManageClub(userId: string, clubId: string, role: string) {
  if (role === "admin") {
    return true;
  }

  const club = await Club.findById(clubId);
  if (!club) {
    return false;
  }

  return club.organizerIds.some((organizerId) => organizerId.equals(userId));
}

export async function listEvents(req: Request, res: Response) {
  try {
    const filter: Record<string, unknown> = {};

    const clubId = req.query.clubId ? String(req.query.clubId) : undefined;
    if (clubId) {
      if (!mongoose.isValidObjectId(clubId)) {
        return res.status(400).json({ message: "Invalid club id" });
      }
      filter.clubId = clubId;
    }

    const statusQuery = req.query.status ? String(req.query.status) : undefined;
    const canSeeDrafts =
      req.user?.role === "admin" ||
      Boolean(
        await Club.findOne({ organizerIds: req.user!.id }).select("_id").lean()
      );

    if (statusQuery === "all") {
      if (!canSeeDrafts) {
        return res
          .status(403)
          .json({ message: "Only organizers can list all event statuses" });
      }
      // no status filter — all statuses for managed views
    } else if (statusQuery) {
      if (!isEventStatus(statusQuery)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      if (statusQuery !== "published" && !canSeeDrafts) {
        return res
          .status(403)
          .json({ message: "Only organizers can filter non-published events" });
      }
      filter.status = statusQuery;
    } else {
      filter.status = "published";
    }

    if (req.query.upcoming === "true") {
      filter.startAt = { $gte: new Date() };
    }

    const search = req.query.search ? String(req.query.search).trim() : "";
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { venue: { $regex: search, $options: "i" } },
      ];
    }

    const events = await Event.find(filter).sort({ startAt: 1 });
    return res.json({ events: events.map(toPublicEvent) });
  } catch (error) {
    console.error("List events failed:", error);
    return res.status(500).json({ message: "Could not load events" });
  }
}

export async function getEvent(req: Request, res: Response) {
  try {
    const id = parseObjectId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status !== "published") {
      const canManage = await userCanManageClub(
        req.user!.id,
        String(event.clubId),
        req.user!.role
      );
      if (!canManage) {
        return res.status(404).json({ message: "Event not found" });
      }
    }

    return res.json({ event: toPublicEvent(event) });
  } catch (error) {
    console.error("Get event failed:", error);
    return res.status(500).json({ message: "Could not load event" });
  }
}

export async function createEvent(req: Request, res: Response) {
  try {
    const title = String(req.body.title ?? "").trim();
    const description = String(req.body.description ?? "").trim();
    const venue = String(req.body.venue ?? "").trim();
    const clubId = String(req.body.clubId ?? "").trim();
    const coverImage = req.body.coverImage
      ? String(req.body.coverImage).trim()
      : undefined;
    const capacity = Number(req.body.capacity);
    const startAt = req.body.startAt ? new Date(req.body.startAt) : null;
    const endAt = req.body.endAt ? new Date(req.body.endAt) : null;

    if (!title || !description || !venue || !clubId) {
      return res.status(400).json({
        message: "Title, description, venue, and clubId are required",
      });
    }

    if (!mongoose.isValidObjectId(clubId)) {
      return res.status(400).json({ message: "Invalid club id" });
    }

    if (!Number.isFinite(capacity) || capacity < 1) {
      return res.status(400).json({ message: "Capacity must be at least 1" });
    }

    if (!startAt || Number.isNaN(startAt.getTime())) {
      return res.status(400).json({ message: "Valid startAt is required" });
    }

    if (!endAt || Number.isNaN(endAt.getTime())) {
      return res.status(400).json({ message: "Valid endAt is required" });
    }

    if (endAt <= startAt) {
      return res.status(400).json({ message: "endAt must be after startAt" });
    }

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const canManage = await userCanManageClub(
      req.user!.id,
      clubId,
      req.user!.role
    );
    if (!canManage) {
      return res
        .status(403)
        .json({ message: "Only organizers of this club can create events" });
    }

    const event = await Event.create({
      title,
      description,
      venue,
      clubId,
      capacity,
      startAt,
      endAt,
      coverImage,
      status: "published",
      checkInToken: crypto.randomBytes(32).toString("hex"),
      createdBy: req.user!.id,
    });

    return res.status(201).json({ event: toPublicEvent(event) });
  } catch (error) {
    console.error("Create event failed:", error);
    return res.status(500).json({ message: "Could not create event" });
  }
}

export async function updateEvent(req: Request, res: Response) {
  try {
    const event = req.event!;

    if (req.body.title !== undefined) {
      const title = String(req.body.title).trim();
      if (!title) {
        return res.status(400).json({ message: "Title cannot be empty" });
      }
      event.title = title;
    }

    if (req.body.description !== undefined) {
      const description = String(req.body.description).trim();
      if (!description) {
        return res.status(400).json({ message: "Description cannot be empty" });
      }
      event.description = description;
    }

    if (req.body.venue !== undefined) {
      const venue = String(req.body.venue).trim();
      if (!venue) {
        return res.status(400).json({ message: "Venue cannot be empty" });
      }
      event.venue = venue;
    }

    if (req.body.coverImage !== undefined) {
      event.coverImage = String(req.body.coverImage).trim() || undefined;
    }

    if (req.body.capacity !== undefined) {
      const capacity = Number(req.body.capacity);
      if (!Number.isFinite(capacity) || capacity < 1) {
        return res.status(400).json({ message: "Capacity must be at least 1" });
      }
      event.capacity = capacity;
    }

    if (req.body.startAt !== undefined) {
      const startAt = new Date(req.body.startAt);
      if (Number.isNaN(startAt.getTime())) {
        return res.status(400).json({ message: "Invalid startAt" });
      }
      event.startAt = startAt;
    }

    if (req.body.endAt !== undefined) {
      const endAt = new Date(req.body.endAt);
      if (Number.isNaN(endAt.getTime())) {
        return res.status(400).json({ message: "Invalid endAt" });
      }
      event.endAt = endAt;
    }

    if (event.endAt <= event.startAt) {
      return res.status(400).json({ message: "endAt must be after startAt" });
    }

    if (req.body.status !== undefined) {
      const status = String(req.body.status);
      if (!isEventStatus(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      event.status = status;
    }

    await event.save();
    return res.json({ event: toPublicEvent(event) });
  } catch (error) {
    console.error("Update event failed:", error);
    return res.status(500).json({ message: "Could not update event" });
  }
}

export async function deleteEvent(req: Request, res: Response) {
  try {
    await req.event!.deleteOne();
    return res.json({ message: "Event deleted" });
  } catch (error) {
    console.error("Delete event failed:", error);
    return res.status(500).json({ message: "Could not delete event" });
  }
}
