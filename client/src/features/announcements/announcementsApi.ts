import { apiSlice } from "../../app/apiSlice";

export type AnnouncementAudience = "all" | "club";

export type AnnouncementItem = {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  clubId?: string;
  pinned: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

type ListAnnouncementsResponse = { announcements: AnnouncementItem[] };
type AnnouncementResponse = { announcement: AnnouncementItem };

export type ListAnnouncementsArgs = {
  pinned?: boolean;
  audience?: AnnouncementAudience;
  clubId?: string;
};

export type CreateAnnouncementBody = {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  clubId?: string;
  pinned?: boolean;
};

export type UpdateAnnouncementBody = {
  id: string;
  title?: string;
  body?: string;
  pinned?: boolean;
};

export const announcementsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listAnnouncements: builder.query<
      ListAnnouncementsResponse,
      ListAnnouncementsArgs | void
    >({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.pinned) search.set("pinned", "true");
        if (params?.audience) search.set("audience", params.audience);
        if (params?.clubId) search.set("clubId", params.clubId);
        const qs = search.toString();
        return qs ? `/announcements?${qs}` : "/announcements";
      },
      providesTags: (result) =>
        result
          ? [
              ...result.announcements.map((item) => ({
                type: "Announcement" as const,
                id: item.id,
              })),
              { type: "Announcement", id: "LIST" },
            ]
          : [{ type: "Announcement", id: "LIST" }],
    }),
    getAnnouncement: builder.query<AnnouncementResponse, string>({
      query: (id) => `/announcements/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Announcement", id }],
    }),
    createAnnouncement: builder.mutation<
      AnnouncementResponse,
      CreateAnnouncementBody
    >({
      query: (body) => ({
        url: "/announcements",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Announcement", id: "LIST" }],
    }),
    updateAnnouncement: builder.mutation<
      AnnouncementResponse,
      UpdateAnnouncementBody
    >({
      query: ({ id, ...body }) => ({
        url: `/announcements/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Announcement", id: "LIST" },
        { type: "Announcement", id },
      ],
    }),
    deleteAnnouncement: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/announcements/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Announcement", id: "LIST" }],
    }),
  }),
});

export const {
  useListAnnouncementsQuery,
  useGetAnnouncementQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
} = announcementsApi;
