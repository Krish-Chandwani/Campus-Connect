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

const TITLE_MAX = 120;
const BODY_MAX = 5000;

function validateAnnouncementText(title: string, body: string) {
  if (!title || !body) {
    return "Title and body are required";
  }
  if (title.length > TITLE_MAX) {
    return `Title must be ${TITLE_MAX} characters or fewer`;
  }
  if (body.length > BODY_MAX) {
    return `Body must be ${BODY_MAX} characters or fewer`;
  }
  return null;
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

    // Non-admins only see campus-wide notices + notices for clubs they belong to / organize
    if (req.user!.role !== "admin") {
      const relatedClubs = await Club.find({
        $or: [
          { memberIds: req.user!.id },
          { organizerIds: req.user!.id },
        ],
      }).select("_id");

      const clubIds = relatedClubs.map((club) => club._id);
      filter.$or = [
        { audience: "all" },
        { audience: "club", clubId: { $in: clubIds } },
      ];
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

    if (req.user!.role !== "admin" && announcement.audience === "club") {
      if (!announcement.clubId) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      const club = await Club.findById(announcement.clubId);
      if (!club) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      const allowed =
        club.memberIds.some((memberId) => memberId.equals(req.user!.id)) ||
        club.organizerIds.some((organizerId) =>
          organizerId.equals(req.user!.id)
        );

      if (!allowed) {
        return res.status(403).json({ message: "You cannot view this notice" });
      }
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

    const textError = validateAnnouncementText(title, body);
    if (textError) {
      return res.status(400).json({ message: textError });
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
      if (title.length > TITLE_MAX) {
        return res.status(400).json({
          message: `Title must be ${TITLE_MAX} characters or fewer`,
        });
      }
      announcement.title = title;
    }

    if (req.body.body !== undefined) {
      const body = String(req.body.body).trim();
      if (!body) {
        return res.status(400).json({ message: "Body cannot be empty" });
      }
      if (body.length > BODY_MAX) {
        return res.status(400).json({
          message: `Body must be ${BODY_MAX} characters or fewer`,
        });
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
