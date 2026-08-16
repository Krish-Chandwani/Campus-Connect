import mongoose, { Document, Model, Schema, Types } from "mongoose";

export const RSVP_STATUSES = ["going", "cancelled"] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export interface IRsvp extends Document {
  eventId: Types.ObjectId;
  userId: Types.ObjectId;
  status: RsvpStatus;
  createdAt: Date;
  updatedAt: Date;
}

const rsvpSchema = new Schema<IRsvp>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: RSVP_STATUSES,
      default: "going",
    },
  },
  { timestamps: true }
);

rsvpSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const Rsvp: Model<IRsvp> = mongoose.model<IRsvp>("Rsvp", rsvpSchema);

export function toPublicRsvp(rsvp: IRsvp) {
  return {
    id: rsvp.id,
    eventId: rsvp.eventId,
    userId: rsvp.userId,
    status: rsvp.status,
    createdAt: rsvp.createdAt,
    updatedAt: rsvp.updatedAt,
  };
}
