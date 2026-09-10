import { apiSlice } from "../../app/apiSlice";
import type { EventItem } from "../events/eventsApi";

export type AttendanceItem = {
  id: string;
  eventId: string;
  userId: string;
  checkedInAt: string;
  method: string;
  createdAt: string;
  updatedAt: string;
};

type MyAttendanceResponse = {
  attendance: Array<{
    attendance: AttendanceItem;
    event: EventItem;
  }>;
};

export const attendanceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listMyAttendance: builder.query<MyAttendanceResponse, void>({
      query: () => "/users/me/attendance",
      providesTags: [{ type: "Attendance", id: "MINE" }],
    }),
  }),
});

export const { useListMyAttendanceQuery } = attendanceApi;
