import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Event, toPublicEvent, type IEvent } from "../models/Event";
import { Rsvp, toPublicRsvp } from "../models/Rsvp";

function parseEventId(id: string | undefined) {
  if (!id || !mongoose.isValidObjectId(id)) {
    return null;
  }
  return id;
}

async function findPublishedEvent(eventId: string) {
  const event = await Event.findById(eventId);
  if (!event) {
    return { event: null, error: { status: 404 as const, message: "Event not found" } };
  }
  if (event.status !== "published") {
    return {
      event: null,
      error: {
        status: 400 as const,
        message: "You can only RSVP to published events",
      },
    };
  }
  return { event, error: null };
}

export async function createRsvp(req: Request, res: Response) {
  try {
    const eventId = parseEventId(req.params.id);
    if (!eventId) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const result = await findPublishedEvent(eventId);
    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    const { event } = result;
    const userId = req.user!.id;

    const existing = await Rsvp.findOne({ eventId, userId });
    if (existing?.status === "going") {
      return res.status(409).json({ message: "You already RSVP'd to this event" });
    }

    const goingCount = await Rsvp.countDocuments({ eventId, status: "going" });
    if (goingCount >= event.capacity) {
      return res.status(409).json({ message: "Event is at full capacity" });
    }

    let rsvp: typeof existing;
    if (existing) {
      existing.status = "going";
      rsvp = await existing.save();
    } else {
      rsvp = await Rsvp.create({ eventId, userId, status: "going" });
    }

    return res.status(201).json({ rsvp: toPublicRsvp(rsvp) });
  } catch (error) {
    console.error("Create RSVP failed:", error);
    return res.status(500).json({ message: "Could not RSVP to event" });
  }
}

export async function cancelRsvp(req: Request, res: Response) {
  try {
    const eventId = parseEventId(req.params.id);
    if (!eventId) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const rsvp = await Rsvp.findOne({ eventId, userId: req.user!.id });
    if (!rsvp || rsvp.status !== "going") {
      return res.status(404).json({ message: "No active RSVP found" });
    }

    rsvp.status = "cancelled";
    await rsvp.save();

    return res.json({ rsvp: toPublicRsvp(rsvp) });
  } catch (error) {
    console.error("Cancel RSVP failed:", error);
    return res.status(500).json({ message: "Could not cancel RSVP" });
  }
}

export async function listEventAttendees(req: Request, res: Response) {
  try {
    const eventId = req.event!.id;

    const rsvps = await Rsvp.find({ eventId, status: "going" })
      .populate("userId", "name email role department")
      .sort({ createdAt: 1 });

    const attendees = rsvps.map((rsvp) => ({
      id: rsvp.id,
      status: rsvp.status,
      createdAt: rsvp.createdAt,
      user: rsvp.userId,
    }));

    return res.json({
      eventId,
      count: attendees.length,
      capacity: req.event!.capacity,
      attendees,
    });
  } catch (error) {
    console.error("List attendees failed:", error);
    return res.status(500).json({ message: "Could not load attendees" });
  }
}

export async function listMyEvents(req: Request, res: Response) {
  try {
    const statusFilter = req.query.status ? String(req.query.status) : "going";
    if (statusFilter !== "going" && statusFilter !== "cancelled") {
      return res.status(400).json({ message: "status must be going or cancelled" });
    }

    const rsvps = await Rsvp.find({
      userId: req.user!.id,
      status: statusFilter,
    })
      .populate("eventId")
      .sort({ updatedAt: -1 });

    const events = rsvps.flatMap((rsvp) => {
      const populated = rsvp.eventId as unknown;
      if (!populated || typeof populated !== "object" || !("title" in populated)) {
        return [];
      }

      const eventDoc = populated as IEvent;
      return [
        {
          rsvp: {
            id: rsvp.id,
            eventId: eventDoc.id,
            userId: rsvp.userId,
            status: rsvp.status,
            createdAt: rsvp.createdAt,
            updatedAt: rsvp.updatedAt,
          },
          event: toPublicEvent(eventDoc),
        },
      ];
    });

    return res.json({ events });
  } catch (error) {
    console.error("List my events failed:", error);
    return res.status(500).json({ message: "Could not load your events" });
  }
}
