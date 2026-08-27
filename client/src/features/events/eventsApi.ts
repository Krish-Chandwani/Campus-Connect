import { apiSlice } from "../../app/apiSlice";

export type EventItem = {
  id: string;
  title: string;
  description: string;
  clubId: string;
  venue: string;
  startAt: string;
  endAt: string;
  capacity: number;
  coverImage?: string;
  status: "draft" | "published" | "cancelled";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type RsvpItem = {
  id: string;
  eventId: string;
  userId: string;
  status: "going" | "cancelled";
  createdAt: string;
  updatedAt: string;
};

type ListEventsResponse = {
  events: EventItem[];
};

type GetEventResponse = {
  event: EventItem;
};

type RsvpResponse = {
  rsvp: RsvpItem;
};

type MyEventsResponse = {
  events: Array<{
    rsvp: RsvpItem;
    event: EventItem;
  }>;
};

export type ListEventsParams = {
  upcoming?: boolean;
  search?: string;
  clubId?: string;
  status?: string;
};

export const eventsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listEvents: builder.query<ListEventsResponse, ListEventsParams | void>({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.upcoming) search.set("upcoming", "true");
        if (params?.search) search.set("search", params.search);
        if (params?.clubId) search.set("clubId", params.clubId);
        if (params?.status) search.set("status", params.status);
        const qs = search.toString();
        return qs ? `/events?${qs}` : "/events";
      },
      providesTags: (result) =>
        result
          ? [
              ...result.events.map((event) => ({
                type: "Event" as const,
                id: event.id,
              })),
              { type: "Event", id: "LIST" },
            ]
          : [{ type: "Event", id: "LIST" }],
    }),

    getEvent: builder.query<GetEventResponse, string>({
      query: (id) => `/events/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Event", id }],
    }),

    createRsvp: builder.mutation<RsvpResponse, string>({
      query: (eventId) => ({
        url: `/events/${eventId}/rsvp`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, eventId) => [
        { type: "Event", id: eventId },
        { type: "Rsvp", id: "MINE" },
      ],
    }),

    cancelRsvp: builder.mutation<RsvpResponse, string>({
      query: (eventId) => ({
        url: `/events/${eventId}/rsvp`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, eventId) => [
        { type: "Event", id: eventId },
        { type: "Rsvp", id: "MINE" },
      ],
    }),

    listMyEvents: builder.query<MyEventsResponse, { status?: string } | void>({
      query: (params) => {
        const status = params?.status ? `?status=${params.status}` : "";
        return `/users/me/events${status}`;
      },
      providesTags: [{ type: "Rsvp", id: "MINE" }],
    }),
  }),
});

export const {
  useListEventsQuery,
  useGetEventQuery,
  useCreateRsvpMutation,
  useCancelRsvpMutation,
  useListMyEventsQuery,
} = eventsApi;
