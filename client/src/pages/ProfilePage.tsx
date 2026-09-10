import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import Navbar from "../components/Navbar";
import RequireAuth from "../components/RequireAuth";
import { useListMyAttendanceQuery } from "../features/attendance/attendanceApi";
import getErrorMessage from "../features/auth/getErrorMessage";
import { useListClubsQuery, type ClubItem } from "../features/clubs/clubsApi";
import {
  useCancelRsvpMutation,
  useListMyEventsQuery,
  type EventItem,
} from "../features/events/eventsApi";
import formatEventDate from "../features/events/formatEventDate";
import { btnOutline, btnPrimary, inputClass } from "../lib/ui";

const SEARCH_DEBOUNCE_MS = 300;

type Tab = "rsvps" | "attendance" | "clubs";

function matchesQuery(haystack: string, query: string) {
  if (!query) return true;
  return haystack.toLowerCase().includes(query);
}

function EventRow({
  event,
  meta,
  action,
}: {
  event: EventItem;
  meta: string;
  action?: ReactNode;
}) {
  const when = formatEventDate(event.startAt);
  return (
    <li className="border-t border-line first:border-t-0">
      <div className="grid grid-cols-[5.5rem_1fr] gap-4 px-4 py-4 sm:grid-cols-[6.5rem_1fr_auto] sm:items-center">
        <div>
          <p className="m-0 font-display text-lg font-bold tabular-nums">
            {when.time}
          </p>
          <p className="m-0 text-xs text-muted">
            {when.month} {when.day}
          </p>
        </div>
        <div className="min-w-0">
          <h2 className="m-0 break-words text-[1.05rem] font-semibold [overflow-wrap:anywhere]">
            {event.title}
          </h2>
          <p className="mt-1 mb-0 text-sm text-muted">{event.venue}</p>
          <p className="mt-1 mb-0 text-xs text-muted">{meta}</p>
        </div>
        <div className="col-start-2 flex flex-wrap gap-2 sm:col-start-auto sm:justify-end">
          <Link className={btnOutline} to={`/events/${event.id}`}>
            View
          </Link>
          {action}
        </div>
      </div>
    </li>
  );
}

function ProfileContent() {
  const user = useAppSelector((state) => state.auth.user);
  const [tab, setTab] = useState<Tab>("rsvps");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: rsvpData, isLoading: rsvpLoading, isError: rsvpError } =
    useListMyEventsQuery({ status: "going" });
  const {
    data: attendanceData,
    isLoading: attendanceLoading,
    isError: attendanceError,
  } = useListMyAttendanceQuery();
  const { data: clubsData, isLoading: clubsLoading, isError: clubsError } =
    useListClubsQuery();
  const [cancelRsvp, cancelState] = useCancelRsvpMutation();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const rsvps = rsvpData?.events ?? [];
  const checkIns = attendanceData?.attendance ?? [];

  const myClubs = useMemo(() => {
    if (!user) return [] as ClubItem[];
    return (clubsData?.clubs ?? []).filter((club) =>
      club.memberIds.some((id) => String(id) === user.id)
    );
  }, [clubsData, user]);

  const query = debouncedSearch;

  const filteredRsvps = rsvps.filter((item) =>
    matchesQuery(`${item.event.title} ${item.event.venue}`, query)
  );
  const filteredCheckIns = checkIns.filter((item) =>
    matchesQuery(`${item.event.title} ${item.event.venue}`, query)
  );
  const filteredClubs = myClubs.filter((club) =>
    matchesQuery(`${club.name} ${club.description}`, query)
  );

  function onSearchSubmit(event: FormEvent) {
    event.preventDefault();
    setDebouncedSearch(search.trim().toLowerCase());
  }

  const initial = (user?.name ?? "?").slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-bg">
      <Navbar variant="solid" />

      <main className="mx-auto w-[min(920px,calc(100%-2rem))] pb-16 pt-8 animate-[fade-up_500ms_ease_both]">
        <header className="mb-6 rounded-xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-soft font-display text-2xl font-bold text-brand"
              aria-hidden
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                initial
              )}
            </div>
            <div className="min-w-0">
              <p className="font-display m-0 text-sm font-bold text-brand">
                Campus Connect
              </p>
              <h1 className="font-display mt-1 mb-1 break-words text-[clamp(1.7rem,4vw,2.4rem)] font-bold tracking-[-0.02em] text-ink [overflow-wrap:anywhere]">
                {user?.name ?? "Your profile"}
              </h1>
              <p className="m-0 break-words text-sm text-muted [overflow-wrap:anywhere]">
                {user?.email}
                {user?.department ? ` · ${user.department}` : ""}
              </p>
              <p className="mt-2 mb-0 text-xs font-bold uppercase tracking-wide text-brand">
                {user?.role}
              </p>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-center">
            <div>
              <dt className="m-0 text-xs font-semibold uppercase tracking-wide text-muted">
                RSVPs
              </dt>
              <dd className="mt-1 mb-0 font-display text-xl font-bold text-ink">
                {rsvps.length}
              </dd>
            </div>
            <div>
              <dt className="m-0 text-xs font-semibold uppercase tracking-wide text-muted">
                Check-ins
              </dt>
              <dd className="mt-1 mb-0 font-display text-xl font-bold text-ink">
                {checkIns.length}
              </dd>
            </div>
            <div>
              <dt className="m-0 text-xs font-semibold uppercase tracking-wide text-muted">
                Clubs
              </dt>
              <dd className="mt-1 mb-0 font-display text-xl font-bold text-ink">
                {myClubs.length}
              </dd>
            </div>
          </dl>
        </header>

        <form
          className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center"
          onSubmit={onSearchSubmit}
        >
          <input
            className={`${inputClass} sm:flex-1`}
            type="search"
            placeholder="Search this tab"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search profile lists"
          />
          <button className={btnPrimary} type="submit">
            Search
          </button>
        </form>

        <div className="mb-5 flex flex-wrap gap-2">
          {(
            [
              ["rsvps", "My RSVPs"],
              ["attendance", "Check-ins"],
              ["clubs", "My clubs"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={tab === value ? btnPrimary : btnOutline}
              onClick={() => setTab(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "rsvps" ? (
          rsvpLoading ? (
            <div className="rounded-xl border border-line bg-surface px-5 py-6 text-muted">
              Loading RSVPs…
            </div>
          ) : rsvpError ? (
            <div className="rounded-xl border border-line bg-surface px-5 py-6 text-muted">
              Could not load your RSVPs.
            </div>
          ) : filteredRsvps.length === 0 ? (
            <div className="rounded-xl border border-line bg-surface px-5 py-6 text-muted">
              {query
                ? "No RSVPs match that search."
                : "You haven’t RSVP’d to any events yet."}{" "}
              <Link to="/events" className="font-semibold text-brand">
                Browse events
              </Link>
            </div>
          ) : (
            <ul className="m-0 list-none overflow-hidden rounded-xl border border-line bg-surface p-0">
              {filteredRsvps.map((item) => (
                <EventRow
                  key={item.rsvp.id}
                  event={item.event}
                  meta="You’re going"
                  action={
                    <button
                      type="button"
                      className={btnOutline}
                      disabled={cancelState.isLoading}
                      onClick={() => void cancelRsvp(item.event.id)}
                    >
                      Cancel
                    </button>
                  }
                />
              ))}
            </ul>
          )
        ) : null}

        {tab === "attendance" ? (
          attendanceLoading ? (
            <div className="rounded-xl border border-line bg-surface px-5 py-6 text-muted">
              Loading check-ins…
            </div>
          ) : attendanceError ? (
            <div className="rounded-xl border border-line bg-surface px-5 py-6 text-muted">
              Could not load your attendance.
            </div>
          ) : filteredCheckIns.length === 0 ? (
            <div className="rounded-xl border border-line bg-surface px-5 py-6 text-muted">
              {query
                ? "No check-ins match that search."
                : "No check-ins yet. RSVP, then scan the event QR when you’re there."}
            </div>
          ) : (
            <ul className="m-0 list-none overflow-hidden rounded-xl border border-line bg-surface p-0">
              {filteredCheckIns.map((item) => {
                const when = formatEventDate(item.attendance.checkedInAt);
                return (
                  <EventRow
                    key={item.attendance.id}
                    event={item.event}
                    meta={`Checked in ${when.month} ${when.day} · ${when.time}`}
                  />
                );
              })}
            </ul>
          )
        ) : null}

        {tab === "clubs" ? (
          clubsLoading ? (
            <div className="rounded-xl border border-line bg-surface px-5 py-6 text-muted">
              Loading clubs…
            </div>
          ) : clubsError ? (
            <div className="rounded-xl border border-line bg-surface px-5 py-6 text-muted">
              Could not load clubs.
            </div>
          ) : filteredClubs.length === 0 ? (
            <div className="rounded-xl border border-line bg-surface px-5 py-6 text-muted">
              {query
                ? "No clubs match that search."
                : "You haven’t joined any clubs yet."}{" "}
              <Link to="/clubs" className="font-semibold text-brand">
                Browse clubs
              </Link>
            </div>
          ) : (
            <ul className="m-0 list-none space-y-3 p-0">
              {filteredClubs.map((club) => (
                <li
                  key={club.id}
                  className="rounded-xl border border-line bg-surface p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="m-0 break-words text-[1.05rem] font-semibold [overflow-wrap:anywhere]">
                        {club.name}
                      </h2>
                      <p className="mt-1 mb-0 line-clamp-2 text-sm text-muted">
                        {club.description}
                      </p>
                    </div>
                    <Link className={`${btnOutline} shrink-0`} to={`/clubs/${club.id}`}>
                      View
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {cancelState.error ? (
          <p className="mt-4 text-sm text-danger" role="alert">
            {getErrorMessage(cancelState.error, "Could not cancel RSVP")}
          </p>
        ) : null}
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
