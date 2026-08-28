import { type FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import Navbar from "../components/Navbar";
import RequireAuth from "../components/RequireAuth";
import getErrorMessage from "../features/auth/getErrorMessage";
import { useListClubsQuery } from "../features/clubs/clubsApi";
import {
  useCreateEventMutation,
  useDeleteEventMutation,
  useListEventsQuery,
  useUpdateEventMutation,
  type EventItem,
} from "../features/events/eventsApi";
import formatEventDate from "../features/events/formatEventDate";
import { btnOutline, btnPrimary, inputClass } from "../lib/ui";

function ManageEventsContent() {
  const user = useAppSelector((state) => state.auth.user);
  const { data: clubsData, isLoading: clubsLoading } = useListClubsQuery();

  const managedClubs = useMemo(() => {
    const clubs = clubsData?.clubs ?? [];
    if (!user) return [];
    if (user.role === "admin") return clubs;
    return clubs.filter((club) =>
      club.organizerIds.some((id) => String(id) === user.id)
    );
  }, [clubsData, user]);

  const [clubId, setClubId] = useState("");
  const selectedClubId = clubId || managedClubs[0]?.id || "";

  const { data: eventsData, isLoading: eventsLoading } = useListEventsQuery(
    { clubId: selectedClubId, status: "all" },
    { skip: !selectedClubId }
  );

  const [createEvent, createState] = useCreateEventMutation();
  const [updateEvent, updateState] = useUpdateEventMutation();
  const [deleteEvent, deleteState] = useDeleteEventMutation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [capacity, setCapacity] = useState("50");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const events = eventsData?.events ?? [];
  const clubsById = useMemo(
    () => new Map(managedClubs.map((club) => [club.id, club])),
    [managedClubs]
  );

  const actionError = createState.error || updateState.error || deleteState.error;

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!selectedClubId) return;

    try {
      await createEvent({
        title,
        description,
        venue,
        clubId: selectedClubId,
        capacity: Number(capacity),
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
      }).unwrap();

      setTitle("");
      setDescription("");
      setVenue("");
      setCapacity("50");
      setStartAt("");
      setEndAt("");
    } catch {
      // shown below
    }
  }

  async function setStatus(eventItem: EventItem, status: EventItem["status"]) {
    try {
      await updateEvent({
        eventId: eventItem.id,
        body: { status },
      }).unwrap();
    } catch {
      // shown below
    }
  }

  if (clubsLoading || !user) {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar variant="solid" />
        <main className="mx-auto w-[min(960px,calc(100%-2rem))] py-10 text-muted">
          Loading your clubs…
        </main>
      </div>
    );
  }

  if (managedClubs.length === 0) {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar variant="solid" />
        <main className="mx-auto w-[min(960px,calc(100%-2rem))] py-10">
          <h1 className="font-display text-2xl font-bold text-ink">Manage events</h1>
          <p className="mt-3 text-muted">
            You are not an organizer of any club yet. Ask an admin to assign you
            to a club.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar variant="solid" />

      <main className="mx-auto w-[min(960px,calc(100%-2rem))] pb-16 pt-8 animate-[fade-up_500ms_ease_both]">
        <header className="mb-8">
          <p className="font-display m-0 text-sm font-bold text-brand">
            Campus Connect
          </p>
          <h1 className="font-display mt-1 mb-2 text-[clamp(1.9rem,4vw,2.6rem)] font-bold tracking-[-0.02em]">
            Manage events
          </h1>
          <p className="m-0 text-muted">
            Create and update events for clubs you organise
            {user.role === "admin" ? " (admin: all clubs)" : ""}.
          </p>
        </header>

        <label className="mb-8 grid max-w-md gap-1.5 text-sm font-semibold">
          Club
          <select
            className={inputClass}
            value={selectedClubId}
            onChange={(e) => setClubId(e.target.value)}
          >
            {managedClubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </label>

        <section className="mb-10 rounded-[12px] border border-line bg-surface p-5">
          <h2 className="font-display m-0 mb-4 text-xl">Create event</h2>
          <form className="grid gap-3" onSubmit={onCreate}>
            <label className="grid gap-1.5 text-sm font-semibold">
              Title
              <input
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Description
              <textarea
                className={`${inputClass} min-h-24 py-2`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-semibold">
                Venue
                <input
                  className={inputClass}
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                Capacity
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                Starts
                <input
                  className={inputClass}
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                Ends
                <input
                  className={inputClass}
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  required
                />
              </label>
            </div>
            <button
              className={`${btnPrimary} w-fit`}
              type="submit"
              disabled={createState.isLoading}
            >
              {createState.isLoading ? "Creating…" : "Create event"}
            </button>
          </form>
        </section>

        <section>
          <h2 className="font-display m-0 mb-3 text-xl">
            Events for {clubsById.get(selectedClubId)?.name ?? "club"}
          </h2>

          {eventsLoading ? (
            <p className="text-muted">Loading events…</p>
          ) : events.length === 0 ? (
            <p className="text-muted">No events for this club yet.</p>
          ) : (
            <ul className="m-0 list-none space-y-3 p-0">
              {events.map((eventItem) => {
                const when = formatEventDate(eventItem.startAt);
                return (
                  <li
                    key={eventItem.id}
                    className="rounded-[12px] border border-line bg-surface p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="m-0 text-lg font-semibold">
                            {eventItem.title}
                          </h3>
                          <span className="rounded-md bg-brand-soft px-2 py-0.5 text-xs font-bold uppercase text-brand">
                            {eventItem.status}
                          </span>
                        </div>
                        <p className="mt-1 mb-0 text-sm text-muted">
                          {when.month} {when.day} · {when.time} · {eventItem.venue}
                        </p>
                        <p className="mt-2 mb-0 text-sm text-ink line-clamp-2">
                          {eventItem.description}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          className={btnOutline}
                          to={`/events/${eventItem.id}`}
                        >
                          View
                        </Link>
                        {eventItem.status !== "published" ? (
                          <button
                            type="button"
                            className={btnPrimary}
                            disabled={updateState.isLoading}
                            onClick={() => void setStatus(eventItem, "published")}
                          >
                            Publish
                          </button>
                        ) : null}
                        {eventItem.status !== "draft" ? (
                          <button
                            type="button"
                            className={btnOutline}
                            disabled={updateState.isLoading}
                            onClick={() => void setStatus(eventItem, "draft")}
                          >
                            Draft
                          </button>
                        ) : null}
                        {eventItem.status !== "cancelled" ? (
                          <button
                            type="button"
                            className={btnOutline}
                            disabled={updateState.isLoading}
                            onClick={() => void setStatus(eventItem, "cancelled")}
                          >
                            Cancel
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[10px] border border-danger px-4 font-semibold text-danger"
                          disabled={deleteState.isLoading}
                          onClick={() => {
                            if (confirm(`Delete “${eventItem.title}”?`)) {
                              void deleteEvent(eventItem.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {actionError ? (
          <p className="mt-4 text-sm text-danger" role="alert">
            {getErrorMessage(actionError, "Could not update events")}
          </p>
        ) : null}
      </main>
    </div>
  );
}

export default function ManageEventsPage() {
  return (
    <RequireAuth>
      <ManageEventsContent />
    </RequireAuth>
  );
}
