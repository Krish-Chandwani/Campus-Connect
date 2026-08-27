import { apiSlice } from "../../app/apiSlice";
import type { AuthUser, UserRole } from "../auth/authSlice";

type ListUsersResponse = { users: AuthUser[] };
type UserResponse = { user: AuthUser };

export const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listUsers: builder.query<
      ListUsersResponse,
      { search?: string; role?: UserRole } | void
    >({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.search) search.set("search", params.search);
        if (params?.role) search.set("role", params.role);
        const qs = search.toString();
        return qs ? `/users?${qs}` : "/users";
      },
      providesTags: [{ type: "Me", id: "USERS" }],
    }),
    updateUserRole: builder.mutation<
      UserResponse,
      { userId: string; role: UserRole }
    >({
      query: ({ userId, role }) => ({
        url: `/users/${userId}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: [{ type: "Me", id: "USERS" }],
    }),
  }),
});

export const { useListUsersQuery, useUpdateUserRoleMutation } = usersApi;
