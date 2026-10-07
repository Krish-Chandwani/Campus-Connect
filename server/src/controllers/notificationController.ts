import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Notification, toPublicNotification, type NotificationType } from "../models/Notification";
import { Club } from "../models/Club";
import { Event } from "../models/Event";

export async function createNotificationForUser({
  recipientId,
  type,
  title,
  message,
  relatedEntityId,
  relatedEntityType,
}: {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}) {
  const basePayload = {
    recipientId: new mongoose.Types.ObjectId(recipientId),
    type,
    title,
    message,
    relatedEntityType,
    relatedEntityId: relatedEntityId
      ? new mongoose.Types.ObjectId(relatedEntityId)
      : undefined,
  };

  if (relatedEntityId && relatedEntityType) {
    const duplicate = await Notification.findOne({
      recipientId: basePayload.recipientId,
      type,
      relatedEntityId: basePayload.relatedEntityId,
      relatedEntityType,
    });

    if (duplicate) {
      return duplicate;
    }
  }

  const notification = await Notification.create(basePayload);
  return notification;
}

export async function createNotificationsForUsers({
  recipientIds,
  type,
  title,
  message,
  relatedEntityId,
  relatedEntityType,
}: {
  recipientIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}) {
  const uniqueIds = [...new Set(recipientIds)];

  if (uniqueIds.length === 0) {
    return [];
  }

  const payload = uniqueIds.map((recipientId) => ({
    recipientId: new mongoose.Types.ObjectId(recipientId),
    type,
    title,
    message,
    relatedEntityId: relatedEntityId
      ? new mongoose.Types.ObjectId(relatedEntityId)
      : undefined,
    relatedEntityType,
  }));

  return Notification.insertMany(payload);
}

export async function listNotifications(req: Request, res: Response) {
  try {
    const unreadOnly = req.query.unreadOnly === "true";

    const filter: Record<string, unknown> = {
      recipientId: req.user!.id,
    };

    if (unreadOnly) {
      filter.readAt = null;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({ notifications: notifications.map(toPublicNotification) });
  } catch (error) {
    console.error("List notifications failed:", error);
    return res.status(500).json({ message: "Could not load notifications" });
  }
}

export async function getUnreadCount(req: Request, res: Response) {
  try {
    const count = await Notification.countDocuments({
      recipientId: req.user!.id,
      readAt: null,
    });

    return res.json({ count });
  } catch (error) {
    console.error("Get unread count failed:", error);
    return res.status(500).json({ message: "Could not load unread count" });
  }
}

export async function markNotificationRead(req: Request, res: Response) {
  try {
    const notificationId = req.params.id;
    if (!notificationId || !mongoose.isValidObjectId(notificationId)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      recipientId: req.user!.id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      await notification.save();
    }

    return res.json({ notification: toPublicNotification(notification) });
  } catch (error) {
    console.error("Mark notification read failed:", error);
    return res.status(500).json({ message: "Could not mark notification as read" });
  }
}

export async function markAllNotificationsRead(req: Request, res: Response) {
  try {
    const result = await Notification.updateMany(
      {
        recipientId: req.user!.id,
        readAt: null,
      },
      { readAt: new Date() }
    );

    return res.json({ updated: result.modifiedCount ?? 0 });
  } catch (error) {
    console.error("Mark all notifications read failed:", error);
    return res.status(500).json({ message: "Could not mark all notifications as read" });
  }
}

export async function buildClubNotificationDetails(clubId: string) {
  const club = await Club.findById(clubId);
  if (!club) {
    return null;
  }

  return {
    name: club.name,
    id: club.id,
  };
}

export async function buildEventNotificationDetails(eventId: string) {
  const event = await Event.findById(eventId);
  if (!event) {
    return null;
  }

  return {
    title: event.title,
    id: event.id,
  };
}
