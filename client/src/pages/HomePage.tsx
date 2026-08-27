import { Link } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import Navbar from "../components/Navbar";
import { useListEventsQuery } from "../features/events/eventsApi";
import formatEventDate from "../features/events/formatEventDate";
import { btnOutline, btnPrimary } from "../lib/ui";

function isLiveSoon(startAt: string, endAt: string) {
  const now = Date.now();
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return false;
  }
  // Happening now, or starting within 2 hours
  return (now >= start && now <= end) || (start > now && start - now <= 2 * 60 * 60 * 1000);
}

function liveLabel(startAt: string, endAt: string) {
  const now = Date.now();
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  if (now >= start && now <= end) {
    return "Live now";
  }
  return "Soon";
}

export default function HomePage() {
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);

  const { data, isLoading, isError } = useListEventsQuery(
    { upcoming: true },
    { skip: !token }
  );

  const events = data?.events ?? [];

  return (
    <div className="min-h-screen bg-bg">
      <Navbar variant="solid" />

      {/* Thin campus photo strip — Design B */}
      <div className="relative h-40 w-full overflow-hidden sm:h-52">
        <img
          src="/images/campus-hero.jpg"
          alt=""
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />
      </div>

      <main className="relative z-[1] mx-auto w-[min(920px,calc(100%-2rem))] -mt-8 pb-16 animate-[fade-up_600ms_ease_both]">
        <header className="mb-8">
          <h1 className="font-display m-0 text-[clamp(2.2rem,5vw,3.2rem)] font-bold tracking-[-0.02em] text-brand">
            Campus Connect
          </h1>
          <p className="mt-2 mb-1 text-lg font-semibold text-ink">
            Today on campus
          </p>
          <p className="mt-1 mb-5 max-w-xl text-[1.02rem] text-muted">
            A simple schedule of what&apos;s happening next — RSVP and check in
            when you&apos;re there.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className={btnPrimary} to="/events">
              Browse events
            </Link>
            {token && user ? (
              <Link className={btnOutline} to="/profile">
                Hi, {user.name.split(" ")[0]}
              </Link>
            ) : (
              <Link className={btnOutline} to="/login">
                Sign in
              </Link>
            )}
          </div>
        </header>

        <section aria-labelledby="schedule-heading">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2
                id="schedule-heading"
                className="font-display m-0 text-xl tracking-[-0.02em]"
              >
                Upcoming schedule
              </h2>
              <p className="mt-1 mb-0 text-sm text-muted">
                {token
                  ? "Published events, ordered by start time."
                  : "Sign in to load the live campus schedule."}
              </p>
            </div>
            <Link
              to="/events"
              className="text-sm font-semibold text-brand hover:underline underline-offset-4"
            >
              View all
            </Link>
          </div>

          {!token ? (
            <div className="rounded-[12px] border border-line bg-surface px-5 py-6 text-muted">
              <p className="m-0 mb-4">
                Your schedule unlocks after you sign in.
              </p>
              <Link className={btnPrimary} to="/login">
                Sign in
              </Link>
            </div>
          ) : isLoading ? (
            <div className="rounded-[12px] border border-line bg-surface px-5 py-6 text-muted">
              Loading schedule…
            </div>
          ) : isError ? (
            <div className="rounded-[12px] border border-line bg-surface px-5 py-6 text-muted">
              Could not load events. Is the API running?
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-[12px] border border-line bg-surface px-5 py-6 text-muted">
              <p className="m-0 mb-4">No upcoming published events yet.</p>
              <Link className={btnOutline} to="/events">
                Browse events
              </Link>
            </div>
          ) : (
            <ol className="m-0 list-none overflow-hidden rounded-[12px] border border-line bg-surface p-0">
              {events.slice(0, 8).map((event) => {
                const when = formatEventDate(event.startAt);
                const live = isLiveSoon(event.startAt, event.endAt);

                return (
                  <li
                    key={event.id}
                    className="border-t border-line first:border-t-0"
                  >
                    <Link
                      to={`/events/${event.id}`}
                      className="grid grid-cols-[5.5rem_1fr] gap-4 px-4 py-4 text-ink no-underline hover:bg-brand-soft/40 sm:grid-cols-[6.5rem_1fr_auto] sm:items-center"
                    >
                      <div className="pt-0.5">
                        <p className="m-0 font-display text-lg font-bold tabular-nums text-ink">
                          {when.time}
                        </p>
                        <p className="m-0 text-xs text-muted">
                          {when.month} {when.day}
                        </p>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="m-0 text-[1.05rem] font-semibold text-ink">
                            {event.title}
                          </h3>
                          {live ? (
                            <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent">
                              {liveLabel(event.startAt, event.endAt)}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 mb-0 text-sm text-muted">
                          {event.venue}
                        </p>
                      </div>

                      <span className="col-start-2 text-sm font-semibold text-brand sm:col-start-auto sm:text-right">
                        View
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </main>
    </div>
  );
}
