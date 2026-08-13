import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Club, toPublicClub } from "../models/Club";

function parseClubId(id: string | undefined) {
  if (!id || !mongoose.isValidObjectId(id)) {
    return null;
  }
  return id;
}

export async function listClubs(_req: Request, res: Response) {
  try {
    const clubs = await Club.find().sort({ name: 1 });
    return res.json({ clubs: clubs.map(toPublicClub) });
  } catch (error) {
    console.error("List clubs failed:", error);
    return res.status(500).json({ message: "Could not load clubs" });
  }
}

export async function getClub(req: Request, res: Response) {
  try {
    const id = parseClubId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid club id" });
    }

    const club = await Club.findById(id);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    return res.json({ club: toPublicClub(club) });
  } catch (error) {
    console.error("Get club failed:", error);
    return res.status(500).json({ message: "Could not load club" });
  }
}

export async function createClub(req: Request, res: Response) {
  try {
    const name = String(req.body.name ?? "").trim();
    const description = String(req.body.description ?? "").trim();
    const logoUrl = req.body.logoUrl
      ? String(req.body.logoUrl).trim()
      : undefined;

    if (!name || !description) {
      return res
        .status(400)
        .json({ message: "Name and description are required" });
    }

    const existing = await Club.findOne({ name });
    if (existing) {
      return res.status(409).json({ message: "A club with this name exists" });
    }

    const userId = req.user!.id;
    const club = await Club.create({
      name,
      description,
      logoUrl,
      createdBy: userId,
      organizerIds: [userId],
      memberIds: [userId],
    });

    return res.status(201).json({ club: toPublicClub(club) });
  } catch (error) {
    console.error("Create club failed:", error);
    return res.status(500).json({ message: "Could not create club" });
  }
}

export async function updateClub(req: Request, res: Response) {
  try {
    const club = req.club!;
    const name = req.body.name !== undefined ? String(req.body.name).trim() : undefined;
    const description =
      req.body.description !== undefined
        ? String(req.body.description).trim()
        : undefined;
    const logoUrl =
      req.body.logoUrl !== undefined ? String(req.body.logoUrl).trim() : undefined;

    if (name !== undefined) {
      if (!name) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      const existing = await Club.findOne({ name, _id: { $ne: club.id } });
      if (existing) {
        return res.status(409).json({ message: "A club with this name exists" });
      }
      club.name = name;
    }

    if (description !== undefined) {
      if (!description) {
        return res.status(400).json({ message: "Description cannot be empty" });
      }
      club.description = description;
    }

    if (logoUrl !== undefined) {
      club.logoUrl = logoUrl || undefined;
    }

    await club.save();
    return res.json({ club: toPublicClub(club) });
  } catch (error) {
    console.error("Update club failed:", error);
    return res.status(500).json({ message: "Could not update club" });
  }
}

export async function deleteClub(req: Request, res: Response) {
  try {
    await req.club!.deleteOne();
    return res.json({ message: "Club deleted" });
  } catch (error) {
    console.error("Delete club failed:", error);
    return res.status(500).json({ message: "Could not delete club" });
  }
}

export async function joinClub(req: Request, res: Response) {
  try {
    const id = parseClubId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid club id" });
    }

    const club = await Club.findById(id);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const userId = req.user!.id;
    const alreadyMember = club.memberIds.some((memberId) => memberId.equals(userId));
    if (alreadyMember) {
      return res.status(409).json({ message: "Already a member of this club" });
    }

    club.memberIds.push(userId);
    await club.save();

    return res.json({ club: toPublicClub(club) });
  } catch (error) {
    console.error("Join club failed:", error);
    return res.status(500).json({ message: "Could not join club" });
  }
}

export async function leaveClub(req: Request, res: Response) {
  try {
    const id = parseClubId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Invalid club id" });
    }

    const club = await Club.findById(id);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const userId = req.user!.id;
    const isMember = club.memberIds.some((memberId) => memberId.equals(userId));
    if (!isMember) {
      return res.status(400).json({ message: "You are not a member of this club" });
    }

    club.memberIds = club.memberIds.filter((memberId) => !memberId.equals(userId));
    await club.save();

    return res.json({ club: toPublicClub(club) });
  } catch (error) {
    console.error("Leave club failed:", error);
    return res.status(500).json({ message: "Could not leave club" });
  }
}
