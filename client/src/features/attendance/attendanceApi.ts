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

type CheckInResponse = {
  attendance: AttendanceItem;
};

export const attendanceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listMyAttendance: builder.query<MyAttendanceResponse, void>({
      query: () => "/users/me/attendance",
      providesTags: [{ type: "Attendance", id: "MINE" }],
    }),

    checkInEvent: builder.mutation<CheckInResponse, { eventId: string; token: string }>({
      query: ({ eventId, token }) => ({
        url: `/events/${eventId}/check-in`,
        method: "POST",
        body: { token },
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: "Attendance", id: "MINE" },
        { type: "Event", id: eventId },
      ],
    }),
  }),
});

export const { useListMyAttendanceQuery, useCheckInEventMutation } = attendanceApi;
