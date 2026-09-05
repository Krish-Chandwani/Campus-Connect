import { type CSSProperties, type FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import Navbar from "../components/Navbar";
import RequireAuth from "../components/RequireAuth";
import getErrorMessage from "../features/auth/getErrorMessage";
import {
  useCreateAnnouncementMutation,
  useListAnnouncementsQuery,
  type AnnouncementAudience,
  type AnnouncementItem,
} from "../features/announcements/announcementsApi";
import formatNoticeDate from "../features/announcements/formatNoticeDate";
import { useListClubsQuery } from "../features/clubs/clubsApi";
import { btnOutline, btnPrimary, inputClass } from "../lib/ui";

const SEARCH_DEBOUNCE_MS = 300;

type BoardFilter = "all" | "campus" | "club" | "pinned";

const TILTS = ["-1.4deg", "1.1deg", "-0.7deg", "1.6deg", "-1.2deg", "0.8deg"];

function noticeTilt(index: number) {
  return TILTS[index % TILTS.length];
}

function AnnouncementsContent() {
  const user = useAppSelector((state) => state.auth.user);
  const { data, isLoading, isError } = useListAnnouncementsQuery();
  const { data: clubsData } = useListClubsQuery();
  const [createAnnouncement, createState] = useCreateAnnouncementMutation();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<BoardFilter>("all");
  const [showCompose, setShowCompose] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [audience, setAudience] = useState<AnnouncementAudience>("all");
  const [clubId, setClubId] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const clubs = clubsData?.clubs ?? [];
  const clubsById = useMemo(
    () => new Map(clubs.map((club) => [club.id, club])),
    [clubs]
  );

  const managedClubs = useMemo(() => {
    if (!user) return [];
    if (user.role === "admin") return clubs;
    return clubs.filter((club) =>
      club.organizerIds.some((id) => String(id) === user.id)
    );
  }, [clubs, user]);

  const canCompose = Boolean(user?.role === "admin" || managedClubs.length > 0);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!canCompose) return;
    if (isAdmin) {
      setAudience("all");
      setClubId("");
      return;
    }
    setAudience("club");
    setClubId((current) => current || managedClubs[0]?.id || "");
  }, [canCompose, isAdmin, managedClubs]);

  const notices = data?.announcements ?? [];
  const query = debouncedSearch.toLowerCase();

  const filtered = notices.filter((notice) => {
    if (filter === "pinned" && !notice.pinned) return false;
    if (filter === "campus" && notice.audience !== "all") return false;
    if (filter === "club" && notice.audience !== "club") return false;
    if (!query) return true;
    return (
      notice.title.toLowerCase().includes(query) ||
      notice.body.toLowerCase().includes(query)
    );
  });

  function onSearchSubmit(event: FormEvent) {
    event.preventDefault();
    setDebouncedSearch(search.trim());
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    try {
      await createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        audience: isAdmin ? audience : "club",
        clubId:
          (isAdmin ? audience : "club") === "club"
            ? clubId || managedClubs[0]?.id
            : undefined,
        pinned,
      }).unwrap();
      setTitle("");
      setBody("");
      setPinned(false);
      setShowCompose(false);
    } catch {
      // shown below
    }
  }

  function audienceLabel(notice: AnnouncementItem) {
    if (notice.audience === "all") return "Campus-wide";
    const club = notice.clubId
      ? clubsById.get(String(notice.clubId))
      : undefined;
    return club ? club.name : "Club notice";
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar variant="solid" />

      <main className="mx-auto w-[min(980px,calc(100%-2rem))] pb-16 pt-8 animate-[fade-up_500ms_ease_both]">
        <header className="mb-6">
          <p className="font-display m-0 text-sm font-bold text-brand">
            Campus Connect
          </p>
          <h1 className="font-display mt-1 mb-2 text-[clamp(1.9rem,4vw,2.6rem)] font-bold tracking-[-0.02em] text-ink">
            Notice board
          </h1>
          <p className="m-0 max-w-xl text-muted">
            Pinned campus and club notices — browse the board, then open one to
            read the full post.
          </p>
        </header>

        <form
          className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center"
          onSubmit={onSearchSubmit}
        >
          <input
            className={`${inputClass} sm:flex-1`}
            type="search"
            placeholder="Search notices"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search notices"
          />
          <button className={btnPrimary} type="submit">
            Search
          </button>
          {canCompose ? (
            <button
              className={btnOutline}
              type="button"
              onClick={() => setShowCompose((value) => !value)}
            >
              {showCompose ? "Close compose" : "Post notice"}
            </button>
          ) : null}
        </form>

        <div className="mb-5 flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["campus", "Campus"],
              ["club", "Clubs"],
              ["pinned", "Pinned"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={filter === value ? btnPrimary : btnOutline}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {showCompose && canCompose ? (
          <section className="mb-6 rounded-[12px] border border-line bg-surface p-5">
            <h2 className="font-display m-0 mb-4 text-xl">Post a notice</h2>
            <form className="grid gap-3" onSubmit={onCreate}>
              <label className="grid gap-1.5 text-sm font-semibold">
                Title
                <input
                  className={inputClass}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                Body
                <textarea
                  className={`${inputClass} min-h-28 py-2`}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={5000}
                  required
                />
              </label>

              {isAdmin ? (
                <label className="grid gap-1.5 text-sm font-semibold">
                  Audience
                  <select
                    className={inputClass}
                    value={audience}
                    onChange={(e) =>
                      setAudience(e.target.value as AnnouncementAudience)
                    }
                  >
                    <option value="all">Campus-wide</option>
                    <option value="club">Specific club</option>
                  </select>
                </label>
              ) : null}

              {(audience === "club" || !isAdmin) && managedClubs.length > 0 ? (
                <label className="grid gap-1.5 text-sm font-semibold">
                  Club
                  <select
                    className={inputClass}
                    value={clubId || managedClubs[0]?.id || ""}
                    onChange={(e) => setClubId(e.target.value)}
                    required
                  >
                    {managedClubs.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                />
                Pin to the top of the board
              </label>

              <button
                className={`${btnPrimary} w-fit`}
                type="submit"
                disabled={createState.isLoading}
              >
                {createState.isLoading ? "Posting…" : "Pin notice"}
              </button>

              {createState.error ? (
                <p className="m-0 text-sm text-danger" role="alert">
                  {getErrorMessage(createState.error, "Could not post notice")}
                </p>
              ) : null}
            </form>
          </section>
        ) : null}

        {/* Physical notice-board frame */}
        <section
          aria-label="Campus notice board"
          className="relative overflow-hidden rounded-[18px] border-[10px] border-brand-deep shadow-[0_18px_40px_rgba(26,35,48,0.12)]"
          style={{
            backgroundColor: "#7d947f",
            backgroundImage: `
              radial-gradient(circle at 18% 22%, rgba(255,255,255,0.12) 0 1.5px, transparent 2px),
              radial-gradient(circle at 72% 38%, rgba(0,0,0,0.08) 0 1.2px, transparent 2px),
              radial-gradient(circle at 40% 70%, rgba(255,255,255,0.1) 0 1px, transparent 2px),
              radial-gradient(circle at 85% 78%, rgba(0,0,0,0.07) 0 1.4px, transparent 2px),
              linear-gradient(145deg, #8aa38c 0%, #6f8671 48%, #7d947f 100%)
            `,
          }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-black/15 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-black/12 to-transparent" />

          <div className="relative px-4 py-5 sm:px-6 sm:py-7">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="font-display m-0 text-sm font-bold tracking-wide text-white/90">
                  Campus Connect · Board
                </p>
                <p className="mt-1 mb-0 text-sm text-white/75">
                  {filtered.length} notice{filtered.length === 1 ? "" : "s"} on
                  display
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="rounded-[12px] border border-white/20 bg-white/70 px-5 py-6 text-muted backdrop-blur-sm">
                Loading notices…
              </div>
            ) : isError ? (
              <div className="rounded-[12px] border border-white/20 bg-white/70 px-5 py-6 text-muted backdrop-blur-sm">
                Could not load notices. Is the API running?
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-white/35 bg-white/55 px-5 py-10 text-center text-muted backdrop-blur-sm">
                The board is empty for this filter. Check back later
                {canCompose ? ", or post the first notice." : "."}
              </div>
            ) : (
              <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((notice, index) => {
                  const when = formatNoticeDate(notice.createdAt);
                  const tilt = noticeTilt(index);
                  return (
                    <li
                      key={notice.id}
                      className="relative"
                      style={
                        {
                          "--notice-tilt": tilt,
                          animation: `notice-settle 520ms ease both`,
                          animationDelay: `${Math.min(index, 8) * 45}ms`,
                        } as CSSProperties
                      }
                    >
                      <Link
                        to={`/announcements/${notice.id}`}
                        className="group relative block min-w-0 overflow-hidden rounded-[3px] bg-[#fffdf8] px-4 pb-4 pt-6 text-ink no-underline shadow-[0_10px_22px_rgba(26,35,48,0.18)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(26,35,48,0.22)]"
                        style={{ transform: `rotate(${tilt})` }}
                      >
                        {/* Pushpin */}
                        <span
                          className="absolute left-1/2 top-2 z-[1] h-3.5 w-3.5 -translate-x-1/2 rounded-full border border-black/10 shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
                          style={{
                            background:
                              notice.pinned
                                ? "radial-gradient(circle at 30% 30%, #f0c56d, var(--color-accent))"
                                : "radial-gradient(circle at 30% 30%, #6f9f86, var(--color-brand))",
                          }}
                          aria-hidden
                        />
                        <span
                          className="absolute left-1/2 top-[1.15rem] h-3 w-px -translate-x-1/2 bg-black/15"
                          aria-hidden
                        />

                        {notice.pinned ? (
                          <span className="mb-2 inline-block rounded bg-accent-soft px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-accent">
                            Pinned
                          </span>
                        ) : null}

                        <h2 className="font-display m-0 line-clamp-3 break-words text-[1.15rem] font-bold leading-snug tracking-[-0.02em] [overflow-wrap:anywhere]">
                          {notice.title}
                        </h2>
                        <p className="mt-2 mb-0 line-clamp-4 break-words text-sm leading-relaxed text-muted [overflow-wrap:anywhere]">
                          {notice.body}
                        </p>
                        <div className="mt-4 flex items-center justify-between gap-2 border-t border-dashed border-line pt-3 text-xs text-muted">
                          <span className="font-semibold text-brand">
                            {audienceLabel(notice)}
                          </span>
                          <span>
                            {when.dateLabel}
                            {when.timeLabel ? ` · ${when.timeLabel}` : ""}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function AnnouncementsPage() {
  return (
    <RequireAuth>
      <AnnouncementsContent />
    </RequireAuth>
  );
}
