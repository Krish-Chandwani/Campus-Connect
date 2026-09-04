import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IClub extends Document {
  name: string;
  description: string;
  logoUrl?: string;
  organizerIds: Types.ObjectId[];
  memberIds: Types.ObjectId[];
  pendingMemberIds: Types.ObjectId[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const clubSchema = new Schema<IClub>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, required: true, trim: true },
    logoUrl: { type: String, trim: true },
    organizerIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    memberIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    pendingMemberIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Club: Model<IClub> = mongoose.model<IClub>("Club", clubSchema);

export function toPublicClub(club: IClub) {
  return {
    id: club.id,
    name: club.name,
    description: club.description,
    logoUrl: club.logoUrl,
    organizerIds: club.organizerIds,
    memberIds: club.memberIds,
    pendingMemberIds: club.pendingMemberIds ?? [],
    createdBy: club.createdBy,
    createdAt: club.createdAt,
    updatedAt: club.updatedAt,
  };
}
