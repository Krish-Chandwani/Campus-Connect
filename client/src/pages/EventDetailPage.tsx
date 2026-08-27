import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import RequireAuth from "../components/RequireAuth";
import getErrorMessage from "../features/auth/getErrorMessage";
import {
  useCancelRsvpMutation,
  useCreateRsvpMutation,
  useGetEventQuery,
  useListMyEventsQuery,
} from "../features/events/eventsApi";
import formatEventDate from "../features/events/formatEventDate";
import { btnOutline, btnPrimary } from "../lib/ui";

function EventDetailContent() {
  const { id = "" } = useParams();

  const {
    data,
    isLoading,
    isError,
    error: loadError,
  } = useGetEventQuery(id, { skip: !id });

  const { data: myEventsData } = useListMyEventsQuery({ status: "going" });
  const [createRsvp, createState] = useCreateRsvpMutation();
  const [cancelRsvp, cancelState] = useCancelRsvpMutation();

  const event = data?.event;
  const alreadyGoing = Boolean(
    myEventsData?.events.some((item) => item.event.id === id)
  );

  const rsvpBusy = createState.isLoading || cancelState.isLoading;
  const rsvpError = createState.error || cancelState.error;

  async function onRsvp() {
    if (!id) return;
    try {
      if (alreadyGoing) {
        await cancelRsvp(id).unwrap();
      } else {
        await createRsvp(id).unwrap();
      }
    } catch {
      // shown via mutation error
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar variant="solid" />

      <main className="mx-auto w-[min(720px,calc(100%-2rem))] pb-16 pt-8 animate-[fade-up_500ms_ease_both]">
        <Link
          to="/events"
          className="mb-6 inline-block text-sm font-semibold text-brand hover:underline underline-offset-4"
        >
          ← Back to events
        </Link>

        {isLoading ? (
          <div className="rounded-[12px] border border-line bg-surface px-5 py-6 text-muted">
            Loading event…
          </div>
        ) : isError || !event ? (
          <div className="rounded-[12px] border border-line bg-surface px-5 py-6 text-muted">
            {getErrorMessage(loadError, "Event not found or unavailable.")}
          </div>
        ) : (
          <article className="rounded-[12px] border border-line bg-surface p-6 sm:p-8">
            <p className="font-display m-0 text-sm font-bold text-brand">
              Campus Connect
            </p>
            <h1 className="font-display mt-2 mb-3 text-[clamp(1.8rem,4vw,2.4rem)] font-bold tracking-[-0.02em] text-ink">
              {event.title}
            </h1>

            {(() => {
              const start = formatEventDate(event.startAt);
              const end = formatEventDate(event.endAt);
              return (
                <dl className="mb-6 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-muted">When</dt>
                    <dd className="m-0 text-ink">
                      {start.month} {start.day} · {start.time} – {end.time}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-muted">Where</dt>
                    <dd className="m-0 text-ink">{event.venue}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-muted">Capacity</dt>
                    <dd className="m-0 text-ink">{event.capacity} seats</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-muted">Status</dt>
                    <dd className="m-0 capitalize text-ink">{event.status}</dd>
                  </div>
                </dl>
              );
            })()}

            <p className="mb-8 whitespace-pre-wrap text-[1.02rem] leading-relaxed text-ink">
              {event.description}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className={alreadyGoing ? btnOutline : btnPrimary}
                disabled={rsvpBusy || event.status !== "published"}
                onClick={onRsvp}
              >
                {rsvpBusy
                  ? "Please wait…"
                  : alreadyGoing
                    ? "Cancel RSVP"
                    : "RSVP — I'm going"}
              </button>
              {alreadyGoing ? (
                <span className="rounded-md bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent">
                  You&apos;re going
                </span>
              ) : null}
            </div>

            {rsvpError ? (
              <p className="mt-4 mb-0 text-sm text-danger" role="alert">
                {getErrorMessage(rsvpError, "Could not update RSVP")}
              </p>
            ) : null}
          </article>
        )}
      </main>
    </div>
  );
}

export default function EventDetailPage() {
  return (
    <RequireAuth>
      <EventDetailContent />
    </RequireAuth>
  );
}
