import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import Navbar from "../components/Navbar";
import RequireAuth from "../components/RequireAuth";
import getErrorMessage from "../features/auth/getErrorMessage";
import {
  useCancelJoinRequestMutation,
  useLeaveClubMutation,
  useListClubsQuery,
  useRequestJoinClubMutation,
  type ClubItem,
} from "../features/clubs/clubsApi";
import { btnOutline, btnPrimary, inputClass } from "../lib/ui";

const SEARCH_DEBOUNCE_MS = 300;

function pendingIds(club: ClubItem) {
  return club.pendingMemberIds ?? [];
}

function isMember(club: ClubItem, userId: string | undefined) {
  if (!userId) return false;
  return club.memberIds.some((id) => String(id) === userId);
}

function isPending(club: ClubItem, userId: string | undefined) {
  if (!userId) return false;
  return pendingIds(club).some((id) => String(id) === userId);
}

function ClubsPageContent() {
  const user = useAppSelector((state) => state.auth.user);
  const { data, isLoading, isError } = useListClubsQuery();
  const [requestJoin, requestState] = useRequestJoinClubMutation();
  const [cancelRequest, cancelState] = useCancelJoinRequestMutation();
  const [leaveClub, leaveState] = useLeaveClubMutation();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [busyClubId, setBusyClubId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const clubs = data?.clubs ?? [];
  const query = debouncedSearch.toLowerCase();

  const filtered = clubs.filter((club) => {
    if (mineOnly && !isMember(club, user?.id)) return false;
    if (!query) return true;
    return (
      club.name.toLowerCase().includes(query) ||
      club.description.toLowerCase().includes(query)
    );
  });

  const actionError =
    requestState.error || cancelState.error || leaveState.error;
  const actionBusy =
    requestState.isLoading || cancelState.isLoading || leaveState.isLoading;

  function onSearch(event: FormEvent) {
    event.preventDefault();
    setDebouncedSearch(search.trim());
  }

  async function onMembershipAction(club: ClubItem) {
    setBusyClubId(club.id);
    try {
      if (isMember(club, user?.id)) {
        await leaveClub(club.id).unwrap();
      } else if (isPending(club, user?.id)) {
        await cancelRequest(club.id).unwrap();
      } else {
        await requestJoin(club.id).unwrap();
      }
    } catch {
      // shown below
    } finally {
      setBusyClubId(null);
    }
  }

  function actionLabel(club: ClubItem, busy: boolean) {
    const joined = isMember(club, user?.id);
    const pending = isPending(club, user?.id);
    if (busy) {
      if (joined) return "Leaving…";
      if (pending) return "Cancelling…";
      return "Requesting…";
    }
    if (joined) return "Leave";
    if (pending) return "Cancel request";
    return "Request to join";
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
            Clubs
          </h1>
          <p className="m-0 max-w-xl text-muted">
            Request to join a club. Organizers or the admin approve membership
            before you become a member.
          </p>
        </header>

        <form
          className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center"
          onSubmit={onSearch}
        >
          <input
            className={`${inputClass} sm:flex-1`}
            type="search"
            placeholder="Search by name or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search clubs"
          />
          <button className={btnPrimary} type="submit">
            Search
          </button>
          <button
            className={btnOutline}
            type="button"
            onClick={() => setMineOnly((value) => !value)}
          >
            {mineOnly ? "My clubs" : "All clubs"}
          </button>
        </form>

        {isLoading ? (
          <div className="rounded-[12px] border border-line bg-surface px-5 py-6 text-muted">
            Loading clubs…
          </div>
        ) : isError ? (
          <div className="rounded-[12px] border border-line bg-surface px-5 py-6 text-muted">
            Could not load clubs. Is the API running?
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[12px] border border-line bg-surface px-5 py-6 text-muted">
            {mineOnly
              ? "You haven’t joined any clubs yet."
              : "No clubs found. Try another search or check back later."}
          </div>
        ) : (
          <ul className="m-0 list-none space-y-3 p-0">
            {filtered.map((club) => {
              const joined = isMember(club, user?.id);
              const pending = isPending(club, user?.id);
              const busy = busyClubId === club.id;
              return (
                <li
                  key={club.id}
                  className="rounded-[12px] border border-line bg-surface p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Link
                      to={`/clubs/${club.id}`}
                      className="flex min-w-0 flex-1 gap-3 text-ink no-underline"
                    >
                      {club.logoUrl ? (
                        <img
                          src={club.logoUrl}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-brand-soft font-display text-lg font-bold text-brand"
                          aria-hidden
                        >
                          {club.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h2 className="m-0 text-[1.05rem] font-semibold">
                          {club.name}
                        </h2>
                        <p className="mt-1 mb-0 line-clamp-2 text-sm text-muted">
                          {club.description}
                        </p>
                        <p className="mt-2 mb-0 text-xs text-muted">
                          {club.memberIds.length} member
                          {club.memberIds.length === 1 ? "" : "s"}
                          {joined
                            ? " · You’re a member"
                            : pending
                              ? " · Request pending"
                              : ""}
                        </p>
                      </div>
                    </Link>

                    <div className="flex shrink-0 flex-wrap gap-2 sm:pt-1">
                      <Link className={btnOutline} to={`/clubs/${club.id}`}>
                        View
                      </Link>
                      <button
                        type="button"
                        className={
                          joined || pending ? btnOutline : btnPrimary
                        }
                        disabled={busy || actionBusy}
                        onClick={() => void onMembershipAction(club)}
                      >
                        {actionLabel(club, busy)}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {actionError ? (
          <p className="mt-4 text-sm text-danger" role="alert">
            {getErrorMessage(actionError, "Could not update club membership")}
          </p>
        ) : null}
      </main>
    </div>
  );
}

export default function ClubsPage() {
  return (
    <RequireAuth>
      <ClubsPageContent />
    </RequireAuth>
  );
}
