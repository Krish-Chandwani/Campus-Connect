import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Attendance, toPublicAttendance } from "../models/Attendance";
import { Event, toPublicEvent, type IEvent } from "../models/Event";
import { Rsvp } from "../models/Rsvp";

function parseEventId(id: string | undefined) {
  if (!id || !mongoose.isValidObjectId(id)) {
    return null;
  }
  return id;
}

export async function getCheckInQr(req: Request, res: Response) {
  try {
    const event = await Event.findById(req.event!.id).select("+checkInToken");
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Cannot check in to a cancelled event" });
    }

    if (event.status !== "published") {
      return res
        .status(400)
        .json({ message: "Event must be published for check-in" });
    }

    const payload = {
      eventId: event.id,
      token: event.checkInToken,
    };

    return res.json({
      event: toPublicEvent(event),
      qrPayload: payload,
      qrValue: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Get check-in QR failed:", error);
    return res.status(500).json({ message: "Could not load check-in QR" });
  }
}

export async function checkIn(req: Request, res: Response) {
  try {
    const eventId = parseEventId(req.params.id);
    if (!eventId) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const token = String(req.body.token ?? "").trim();
    if (!token) {
      return res.status(400).json({ message: "Check-in token is required" });
    }

    const event = await Event.findById(eventId).select("+checkInToken");
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Cannot check in to a cancelled event" });
    }

    if (event.status !== "published") {
      return res
        .status(400)
        .json({ message: "Event must be published for check-in" });
    }

    if (event.checkInToken !== token) {
      return res.status(401).json({ message: "Invalid check-in token" });
    }

    const userId = req.user!.id;
    const rsvp = await Rsvp.findOne({ eventId, userId, status: "going" });
    if (!rsvp) {
      return res.status(403).json({
        message: "You must RSVP to this event before checking in",
      });
    }

    const existing = await Attendance.findOne({ eventId, userId });
    if (existing) {
      return res.status(409).json({
        message: "Already checked in",
        attendance: toPublicAttendance(existing),
      });
    }

    const attendance = await Attendance.create({
      eventId,
      userId,
      method: "qr",
      checkedInAt: new Date(),
    });

    return res.status(201).json({ attendance: toPublicAttendance(attendance) });
  } catch (error) {
    console.error("Check-in failed:", error);
    return res.status(500).json({ message: "Could not check in" });
  }
}

export async function listEventAttendance(req: Request, res: Response) {
  try {
    const eventId = req.event!.id;

    const records = await Attendance.find({ eventId })
      .populate("userId", "name email role department")
      .sort({ checkedInAt: 1 });

    const attendance = records.map((record) => ({
      id: record.id,
      checkedInAt: record.checkedInAt,
      method: record.method,
      user: record.userId,
    }));

    return res.json({
      eventId,
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    console.error("List attendance failed:", error);
    return res.status(500).json({ message: "Could not load attendance" });
  }
}

export async function listMyAttendance(req: Request, res: Response) {
  try {
    const records = await Attendance.find({ userId: req.user!.id })
      .populate("eventId")
      .sort({ checkedInAt: -1 });

    const items = records.flatMap((record) => {
      const populated = record.eventId as unknown;
      if (!populated || typeof populated !== "object" || !("title" in populated)) {
        return [];
      }

      const eventDoc = populated as IEvent;
      return [
        {
          attendance: {
            id: record.id,
            eventId: eventDoc.id,
            userId: record.userId,
            checkedInAt: record.checkedInAt,
            method: record.method,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
          },
          event: toPublicEvent(eventDoc),
        },
      ];
    });

    return res.json({ attendance: items });
  } catch (error) {
    console.error("List my attendance failed:", error);
    return res.status(500).json({ message: "Could not load your attendance" });
  }
}
