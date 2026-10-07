import { apiSlice } from "../../app/apiSlice";

export type NotificationItem = {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type NotificationsResponse = {
  notifications: NotificationItem[];
};

type UnreadCountResponse = {
  count: number;
};

type NotificationReadResponse = {
  notification: NotificationItem;
};

export const notificationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listNotifications: builder.query<
      NotificationsResponse,
      { unreadOnly?: boolean } | void
    >({
      query: (params) => {
        const unreadOnly = params && params.unreadOnly ? "?unreadOnly=true" : "";
        return `/notifications${unreadOnly}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.notifications.map((notification) => ({
                type: "Notification" as const,
                id: notification.id,
              })),
              { type: "Notification", id: "LIST" },
            ]
          : [{ type: "Notification", id: "LIST" }],
    }),

    getUnreadCount: builder.query<UnreadCountResponse, void>({
      query: () => "/notifications/unread-count",
      providesTags: [{ type: "Notification", id: "UNREAD" }],
    }),

    markNotificationRead: builder.mutation<
      NotificationReadResponse,
      string
    >({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Notification", id },
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "UNREAD" },
      ],
    }),

    markAllNotificationsRead: builder.mutation<{ updated: number }, void>({
      query: () => ({
        url: "/notifications/read-all",
        method: "PATCH",
      }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }, { type: "Notification", id: "UNREAD" }],
    }),
  }),
});

export const {
  useListNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;
