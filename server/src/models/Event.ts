import mongoose, { Document, Model, Schema, Types } from "mongoose";

export const EVENT_STATUSES = ["draft", "published", "cancelled"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export interface IEvent extends Document {
  title: string;
  description: string;
  clubId: Types.ObjectId;
  venue: string;
  startAt: Date;
  endAt: Date;
  capacity: number;
  coverImage?: string;
  status: EventStatus;
  checkInToken: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    clubId: {
      type: Schema.Types.ObjectId,
      ref: "Club",
      required: true,
      index: true,
    },
    venue: { type: String, required: true, trim: true },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 1 },
    coverImage: { type: String, trim: true },
    status: {
      type: String,
      enum: EVENT_STATUSES,
      default: "draft",
      index: true,
    },
    checkInToken: { type: String, required: true, select: false },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Event: Model<IEvent> = mongoose.model<IEvent>("Event", eventSchema);

export function toPublicEvent(event: IEvent) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    clubId: event.clubId,
    venue: event.venue,
    startAt: event.startAt,
    endAt: event.endAt,
    capacity: event.capacity,
    coverImage: event.coverImage,
    status: event.status,
    createdBy: event.createdBy,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}
