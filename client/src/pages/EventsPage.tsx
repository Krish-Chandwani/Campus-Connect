import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import RequireAuth from "../components/RequireAuth";
import { useListEventsQuery } from "../features/events/eventsApi";
import formatEventDate from "../features/events/formatEventDate";
import { btnOutline, btnPrimary, inputClass } from "../lib/ui";

function EventsPageContent() {
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [upcomingOnly, setUpcomingOnly] = useState(true);

  const { data, isLoading, isError, isFetching } = useListEventsQuery({
    upcoming: upcomingOnly || undefined,
    search: submittedSearch || undefined,
  });

  const events = data?.events ?? [];

  function onSearch(event: FormEvent) {
    event.preventDefault();
    setSubmittedSearch(search.trim());
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar variant="solid" />

      <main className="mx-auto w-[min(920px,calc(100%-2rem))] pb-16 pt-8 animate-[fade-up_500ms_ease_both]">
        <header className="mb-8">
          <p className="font-display m-0 text-sm font-bold text-brand">
            Campus Connect
          </p>
          <h1 className="font-display mt-1 mb-2 text-[clamp(1.9rem,4vw,2.6rem)] font-bold tracking-[-0.02em] text-ink">
            Events
          </h1>
          <p className="m-0 max-w-xl text-muted">
            Browse published campus events. Open one to RSVP.
          </p>
        </header>

        <form
          className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center"
          onSubmit={onSearch}
        >
          <input
            className={`${inputClass} sm:flex-1`}
            type="search"
            placeholder="Search title, description, or venue"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className={btnPrimary} type="submit">
            Search
          </button>
          <button
            className={btnOutline}
            type="button"
            onClick={() => setUpcomingOnly((value) => !value)}
          >
            {upcomingOnly ? "Upcoming only" : "All published"}
          </button>
        </form>

        {isLoading || isFetching ? (
          <div className="rounded-[12px] border border-line bg-surface px-5 py-6 text-muted">
            Loading events…
          </div>
        ) : isError ? (
          <div className="rounded-[12px] border border-line bg-surface px-5 py-6 text-muted">
            Could not load events. Is the API running?
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-[12px] border border-line bg-surface px-5 py-6 text-muted">
            No events found. Try another search or check back later.
          </div>
        ) : (
          <ul className="m-0 list-none overflow-hidden rounded-[12px] border border-line bg-surface p-0">
            {events.map((event) => {
              const when = formatEventDate(event.startAt);
              return (
                <li key={event.id} className="border-t border-line first:border-t-0">
                  <Link
                    to={`/events/${event.id}`}
                    className="grid grid-cols-[5.5rem_1fr] gap-4 px-4 py-4 text-ink no-underline hover:bg-brand-soft/40 sm:grid-cols-[6.5rem_1fr_auto] sm:items-center"
                  >
                    <div>
                      <p className="m-0 font-display text-lg font-bold tabular-nums">
                        {when.time}
                      </p>
                      <p className="m-0 text-xs text-muted">
                        {when.month} {when.day}
                      </p>
                    </div>
                    <div>
                      <h2 className="m-0 text-[1.05rem] font-semibold">{event.title}</h2>
                      <p className="mt-1 mb-0 text-sm text-muted">{event.venue}</p>
                    </div>
                    <span className="col-start-2 text-sm font-semibold text-brand sm:col-start-auto sm:text-right">
                      View
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

export default function EventsPage() {
  return (
    <RequireAuth>
      <EventsPageContent />
    </RequireAuth>
  );
}
