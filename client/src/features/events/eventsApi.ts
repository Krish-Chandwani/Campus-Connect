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

type ListEventsResponse = {
  events: EventItem[];
};

export const eventsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listEvents: builder.query<
      ListEventsResponse,
      { upcoming?: boolean; status?: string } | void
    >({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.upcoming) {
          search.set("upcoming", "true");
        }
        if (params?.status) {
          search.set("status", params.status);
        }
        const qs = search.toString();
        return qs ? `/events?${qs}` : "/events";
      },
      providesTags: ["Event"],
    }),
  }),
});

export const { useListEventsQuery } = eventsApi;
