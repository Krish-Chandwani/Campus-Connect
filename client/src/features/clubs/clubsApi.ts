import { apiSlice } from "../../app/apiSlice";
import type { UserRole } from "../auth/authSlice";

export type ClubItem = {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  organizerIds: string[];
  memberIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

type ListClubsResponse = { clubs: ClubItem[] };
type ClubResponse = { club: ClubItem };
type AddOrganizerResponse = {
  club: ClubItem;
  organizer: { id: string; name: string; email: string; role: UserRole };
};

export const clubsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listClubs: builder.query<ListClubsResponse, void>({
      query: () => "/clubs",
      providesTags: [{ type: "Club", id: "LIST" }],
    }),
    createClub: builder.mutation<
      ClubResponse,
      { name: string; description: string; logoUrl?: string }
    >({
      query: (body) => ({
        url: "/clubs",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Club", id: "LIST" }],
    }),
    deleteClub: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/clubs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Club", id: "LIST" }],
    }),
    addClubOrganizer: builder.mutation<
      AddOrganizerResponse,
      { clubId: string; email?: string; userId?: string }
    >({
      query: ({ clubId, email, userId }) => ({
        url: `/clubs/${clubId}/organizers`,
        method: "POST",
        body: { email, userId },
      }),
      invalidatesTags: [
        { type: "Club", id: "LIST" },
        { type: "Me", id: "USERS" },
      ],
    }),
    removeClubOrganizer: builder.mutation<
      ClubResponse,
      { clubId: string; userId: string }
    >({
      query: ({ clubId, userId }) => ({
        url: `/clubs/${clubId}/organizers/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Club", id: "LIST" }],
    }),
  }),
});

export const {
  useListClubsQuery,
  useCreateClubMutation,
  useDeleteClubMutation,
  useAddClubOrganizerMutation,
  useRemoveClubOrganizerMutation,
} = clubsApi;
