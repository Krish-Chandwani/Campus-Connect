import mongoose, { Document, Model, Schema, Types } from "mongoose";

export const NOTIFICATION_TYPES = [
  "club_join_approved",
  "club_join_rejected",
  "event_rsvp_confirmed",
  "announcement_published",
  "organizer_assigned",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface INotification extends Document {
  recipientId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId?: Types.ObjectId;
  relatedEntityType?: string;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    relatedEntityId: {
      type: Schema.Types.ObjectId,
      required: false,
      index: true,
    },
    relatedEntityType: { type: String, trim: true },
    readAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

notificationSchema.index(
  { recipientId: 1, type: 1, relatedEntityId: 1, relatedEntityType: 1 },
  { unique: false }
);

export const Notification: Model<INotification> = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);

export function toPublicNotification(notification: INotification) {
  return {
    id: notification.id,
    recipientId: notification.recipientId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    relatedEntityId: notification.relatedEntityId,
    relatedEntityType: notification.relatedEntityType,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
}
