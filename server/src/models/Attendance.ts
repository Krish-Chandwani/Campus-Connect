import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IAttendance extends Document {
  eventId: Types.ObjectId;
  userId: Types.ObjectId;
  checkedInAt: Date;
  method: "qr";
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
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
    checkedInAt: { type: Date, required: true, default: Date.now },
    method: { type: String, enum: ["qr"], default: "qr", required: true },
  },
  { timestamps: true }
);

attendanceSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const Attendance: Model<IAttendance> = mongoose.model<IAttendance>(
  "Attendance",
  attendanceSchema
);

export function toPublicAttendance(attendance: IAttendance) {
  return {
    id: attendance.id,
    eventId: attendance.eventId,
    userId: attendance.userId,
    checkedInAt: attendance.checkedInAt,
    method: attendance.method,
    createdAt: attendance.createdAt,
    updatedAt: attendance.updatedAt,
  };
}
