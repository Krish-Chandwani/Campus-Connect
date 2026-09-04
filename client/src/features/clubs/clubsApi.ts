import { apiSlice } from "../../app/apiSlice";
import type { UserRole } from "../auth/authSlice";

export type ClubItem = {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  organizerIds: string[];
  memberIds: string[];
  pendingMemberIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type JoinRequestUser = {
  id: string;
  name: string;
  email: string;
  department?: string;
};

type ListClubsResponse = { clubs: ClubItem[] };
type ClubResponse = { club: ClubItem };
type JoinRequestsResponse = { requests: JoinRequestUser[] };
type AddOrganizerResponse = {
  club: ClubItem;
  organizer: { id: string; name: string; email: string; role: UserRole };
};

function clubTags(id: string) {
  return [
    { type: "Club" as const, id: "LIST" },
    { type: "Club" as const, id },
    { type: "Club" as const, id: `${id}-REQUESTS` },
  ];
}

export const clubsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listClubs: builder.query<ListClubsResponse, void>({
      query: () => "/clubs",
      providesTags: [{ type: "Club", id: "LIST" }],
    }),
    getClub: builder.query<ClubResponse, string>({
      query: (id) => `/clubs/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Club", id }],
    }),
    listJoinRequests: builder.query<JoinRequestsResponse, string>({
      query: (clubId) => `/clubs/${clubId}/join-requests`,
      providesTags: (_result, _error, clubId) => [
        { type: "Club", id: `${clubId}-REQUESTS` },
      ],
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
    updateClub: builder.mutation<
      ClubResponse,
      { id: string; name?: string; description?: string; logoUrl?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/clubs/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => clubTags(id),
    }),
    deleteClub: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/clubs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Club", id: "LIST" }],
    }),
    requestJoinClub: builder.mutation<ClubResponse, string>({
      query: (id) => ({
        url: `/clubs/${id}/join`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => clubTags(id),
    }),
    cancelJoinRequest: builder.mutation<ClubResponse, string>({
      query: (id) => ({
        url: `/clubs/${id}/join`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => clubTags(id),
    }),
    leaveClub: builder.mutation<ClubResponse, string>({
      query: (id) => ({
        url: `/clubs/${id}/leave`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => clubTags(id),
    }),
    approveJoinRequest: builder.mutation<
      ClubResponse,
      { clubId: string; userId: string }
    >({
      query: ({ clubId, userId }) => ({
        url: `/clubs/${clubId}/join-requests/${userId}/approve`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { clubId }) => clubTags(clubId),
    }),
    rejectJoinRequest: builder.mutation<
      ClubResponse,
      { clubId: string; userId: string }
    >({
      query: ({ clubId, userId }) => ({
        url: `/clubs/${clubId}/join-requests/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { clubId }) => clubTags(clubId),
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
  useGetClubQuery,
  useListJoinRequestsQuery,
  useCreateClubMutation,
  useUpdateClubMutation,
  useDeleteClubMutation,
  useRequestJoinClubMutation,
  useCancelJoinRequestMutation,
  useLeaveClubMutation,
  useApproveJoinRequestMutation,
  useRejectJoinRequestMutation,
  useAddClubOrganizerMutation,
  useRemoveClubOrganizerMutation,
} = clubsApi;
