import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import RequireAuth from "../components/RequireAuth";
import {
  useListNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "../features/notifications/notificationsApi";
import { btnOutline, btnPrimary } from "../lib/ui";

function NotificationsContent() {
  const { data, isLoading, isError } = useListNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const [localOnlyUnread, setLocalOnlyUnread] = useState(false);

  useEffect(() => {
    if (!data?.notifications?.length) {
      setLocalOnlyUnread(false);
    }
  }, [data]);

  const notifications = data?.notifications ?? [];
  const visibleNotifications = localOnlyUnread
    ? notifications.filter((notification) => !notification.readAt)
    : notifications;

  return (
    <div className="min-h-screen bg-bg">
      <Navbar variant="solid" />

      <main className="mx-auto w-[min(800px,calc(100%-2rem))] pb-16 pt-8 animate-[fade-up_500ms_ease_both]">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display m-0 text-sm font-bold text-brand">
              Campus Connect
            </p>
            <h1 className="font-display mt-1 mb-1 text-[clamp(1.9rem,4vw,2.5rem)] font-bold tracking-[-0.02em] text-ink">
              Notifications
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btnOutline}
              onClick={() => setLocalOnlyUnread((value) => !value)}
            >
              {localOnlyUnread ? "Show all" : "Unread only"}
            </button>
            <button
              type="button"
              className={btnPrimary}
              onClick={() => void markAllRead()}
            >
              Mark all read
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="rounded-xl border border-line bg-surface px-5 py-6 text-muted">
            Loading notifications…
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-line bg-surface px-5 py-6 text-muted">
            Could not load notifications.
          </div>
        ) : visibleNotifications.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface px-5 py-6 text-muted">
            You’re all caught up.
          </div>
        ) : (
          <ul className="m-0 list-none space-y-3 p-0">
            {visibleNotifications.map((notification) => (
              <li
                key={notification.id}
                className={`rounded-xl border p-4 ${
                  notification.readAt
                    ? "border-line bg-surface"
                    : "border-brand/40 bg-brand-soft/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="m-0 text-sm font-bold text-brand">
                      {notification.title}
                    </p>
                    <p className="mt-2 mb-0 text-[0.98rem] text-ink">
                      {notification.message}
                    </p>
                    <p className="mt-2 mb-0 text-xs text-muted">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {!notification.readAt ? (
                    <button
                      type="button"
                      className={btnOutline}
                      onClick={() => void markRead(notification.id)}
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <RequireAuth>
      <NotificationsContent />
    </RequireAuth>
  );
}
