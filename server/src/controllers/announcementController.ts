import type { Request, Response } from "express";
import mongoose from "mongoose";
import {
  ANNOUNCEMENT_AUDIENCES,
  Announcement,
  toPublicAnnouncement,
  type AnnouncementAudience,
} from "../models/Announcement";
import { Club } from "../models/Club";

function parseObjectId(id: string | undefined) {
  if (!id || !mongoose.isValidObjectId(id)) {
    return null;
  }
  return id;
}

function isAudience(value: string): value is AnnouncementAudience {
  return (ANNOUNCEMENT_AUDIENCES as readonly string[]).includes(value);
}

async function userCanPostForClub(userId: string, clubId: string, role: string) {
  if (role === "admin") {
    return true;
  }

  const club = await Club.findById(clubId);
  if (!club) {
    return false;
  }

  return club.organizerIds.some((organizerId) => organizerId.equals(userId));
}

export async function listAnnouncements(req: Request, res: Response) {
  try {
    const filter: Record<string, unknown> = {};

    if (req.query.pinned === "true") {
      filter.pinned = true;
    }

    if (req.query.audience) {
      const audience = String(req.query.audience);
      if (!isAudience(audience)) {
        return res.status(400).json({ message: "Invalid audience" });
      }
      filter.audience = audience;
    }

    if (req.query.clubId) {
      const clubId = String(req.query.clubId);
      if (!mongoose.isValidObjectId(clubId)) {
        return res.status(400).json({ message: "Invalid club id" });
      }
      filter.clubId = clubId;
    }

    const announcements = await Announcement.find(filter).sort({
      pinned: -1,
      createdAt: -1,
    });

    return res.json({
      announcements: announcements.map(toPublicAnnouncement),
    });
  } catch (error) {
    console.error("List announcements failed:", error);
    return res.status(500).json({ message: "Could not load announcements" });
  }
}

export async function getAnnouncement(req: Request, res: Response) {
  try {
    const id = parseObjectId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid announcement id" });
    }

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    return res.json({ announcement: toPublicAnnouncement(announcement) });
  } catch (error) {
    console.error("Get announcement failed:", error);
    return res.status(500).json({ message: "Could not load announcement" });
  }
}

export async function createAnnouncement(req: Request, res: Response) {
  try {
    const title = String(req.body.title ?? "").trim();
    const body = String(req.body.body ?? "").trim();
    const audienceRaw = String(req.body.audience ?? "all").trim();
    const pinned = Boolean(req.body.pinned);
    const clubIdRaw = req.body.clubId ? String(req.body.clubId).trim() : "";

    if (!title || !body) {
      return res.status(400).json({ message: "Title and body are required" });
    }

    if (!isAudience(audienceRaw)) {
      return res.status(400).json({ message: "Invalid audience" });
    }

    if (audienceRaw === "all") {
      if (req.user!.role !== "admin") {
        return res.status(403).json({
          message: "Only admins can post campus-wide announcements",
        });
      }

      const announcement = await Announcement.create({
        title,
        body,
        audience: "all",
        pinned,
        createdBy: req.user!.id,
      });

      return res
        .status(201)
        .json({ announcement: toPublicAnnouncement(announcement) });
    }

    if (!clubIdRaw || !mongoose.isValidObjectId(clubIdRaw)) {
      return res
        .status(400)
        .json({ message: "Valid clubId is required for club announcements" });
    }

    const club = await Club.findById(clubIdRaw);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const canPost = await userCanPostForClub(
      req.user!.id,
      clubIdRaw,
      req.user!.role
    );
    if (!canPost) {
      return res.status(403).json({
        message: "Only organizers of this club can post club announcements",
      });
    }

    const announcement = await Announcement.create({
      title,
      body,
      audience: "club",
      clubId: clubIdRaw,
      pinned,
      createdBy: req.user!.id,
    });

    return res
      .status(201)
      .json({ announcement: toPublicAnnouncement(announcement) });
  } catch (error) {
    console.error("Create announcement failed:", error);
    return res.status(500).json({ message: "Could not create announcement" });
  }
}

export async function updateAnnouncement(req: Request, res: Response) {
  try {
    const announcement = req.announcement!;

    if (req.body.title !== undefined) {
      const title = String(req.body.title).trim();
      if (!title) {
        return res.status(400).json({ message: "Title cannot be empty" });
      }
      announcement.title = title;
    }

    if (req.body.body !== undefined) {
      const body = String(req.body.body).trim();
      if (!body) {
        return res.status(400).json({ message: "Body cannot be empty" });
      }
      announcement.body = body;
    }

    if (req.body.pinned !== undefined) {
      announcement.pinned = Boolean(req.body.pinned);
    }

    await announcement.save();
    return res.json({ announcement: toPublicAnnouncement(announcement) });
  } catch (error) {
    console.error("Update announcement failed:", error);
    return res.status(500).json({ message: "Could not update announcement" });
  }
}

export async function deleteAnnouncement(req: Request, res: Response) {
  try {
    await req.announcement!.deleteOne();
    return res.json({ message: "Announcement deleted" });
  } catch (error) {
    console.error("Delete announcement failed:", error);
    return res.status(500).json({ message: "Could not delete announcement" });
  }
}
