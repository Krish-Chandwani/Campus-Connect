import mongoose, { Document, Model, Schema, Types } from "mongoose";

export const ANNOUNCEMENT_AUDIENCES = ["all", "club"] as const;
export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];

export interface IAnnouncement extends Document {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  clubId?: Types.ObjectId;
  pinned: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    audience: {
      type: String,
      enum: ANNOUNCEMENT_AUDIENCES,
      required: true,
      default: "all",
      index: true,
    },
    clubId: {
      type: Schema.Types.ObjectId,
      ref: "Club",
      required: false,
      index: true,
    },
    pinned: { type: Boolean, default: false, index: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Announcement: Model<IAnnouncement> = mongoose.model<IAnnouncement>(
  "Announcement",
  announcementSchema
);

export function toPublicAnnouncement(announcement: IAnnouncement) {
  return {
    id: announcement.id,
    title: announcement.title,
    body: announcement.body,
    audience: announcement.audience,
    clubId: announcement.clubId,
    pinned: announcement.pinned,
    createdBy: announcement.createdBy,
    createdAt: announcement.createdAt,
    updatedAt: announcement.updatedAt,
  };
}
