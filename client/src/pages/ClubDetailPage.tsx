import { Link, useParams } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import Navbar from "../components/Navbar";
import RequireAuth from "../components/RequireAuth";
import getErrorMessage from "../features/auth/getErrorMessage";
import {
  useApproveJoinRequestMutation,
  useCancelJoinRequestMutation,
  useGetClubQuery,
  useLeaveClubMutation,
  useListJoinRequestsQuery,
  useRejectJoinRequestMutation,
  useRequestJoinClubMutation,
} from "../features/clubs/clubsApi";
import { btnOutline, btnPrimary } from "../lib/ui";

function ClubDetailContent() {
  const { id = "" } = useParams();
  const user = useAppSelector((state) => state.auth.user);

  const {
    data,
    isLoading,
    isError,
    error: loadError,
  } = useGetClubQuery(id, { skip: !id });

  const [requestJoin, requestState] = useRequestJoinClubMutation();
  const [cancelRequest, cancelState] = useCancelJoinRequestMutation();
  const [leaveClub, leaveState] = useLeaveClubMutation();
  const [approveRequest, approveState] = useApproveJoinRequestMutation();
  const [rejectRequest, rejectState] = useRejectJoinRequestMutation();

  const club = data?.club;
  const joined = Boolean(
    club && user && club.memberIds.some((memberId) => String(memberId) === user.id)
  );
  const pending = Boolean(
    club &&
      user &&
      (club.pendingMemberIds ?? []).some(
        (memberId) => String(memberId) === user.id
      )
  );
  const isOrganizer = Boolean(
    club &&
      user &&
      club.organizerIds.some((organizerId) => String(organizerId) === user.id)
  );
  const canReview =
    Boolean(user) && (user?.role === "admin" || isOrganizer);

  const {
    data: requestsData,
    isLoading: requestsLoading,
    isError: requestsError,
  } = useListJoinRequestsQuery(id, { skip: !id || !canReview });

  const membershipBusy =
    requestState.isLoading ||
    cancelState.isLoading ||
    leaveState.isLoading;
  const membershipError =
    requestState.error || cancelState.error || leaveState.error;
  const reviewError = approveState.error || rejectState.error;
  const reviewBusy = approveState.isLoading || rejectState.isLoading;

  async function onMembershipAction() {
    if (!id) return;
    try {
      if (joined) {
        await leaveClub(id).unwrap();
      } else if (pending) {
        await cancelRequest(id).unwrap();
      } else {
        await requestJoin(id).unwrap();
      }
    } catch {
      // shown via mutation error
    }
  }

  function membershipLabel() {
    if (membershipBusy) {
      if (joined) return "Leaving…";
      if (pending) return "Cancelling…";
      return "Requesting…";
    }
    if (joined) return "Leave club";
    if (pending) return "Cancel request";
    return "Request to join";
  }

  function statusLabel() {
    if (isOrganizer) return "Organizer";
    if (joined) return "Member";
    if (pending) return "Request pending";
    return "Not a member";
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar variant="solid" />

      <main className="mx-auto w-[min(720px,calc(100%-2rem))] pb-16 pt-8 animate-[fade-up_500ms_ease_both]">
        <Link
          to="/clubs"
          className="mb-6 inline-block text-sm font-semibold text-brand hover:underline underline-offset-4"
        >
          ← Back to clubs
        </Link>

        {isLoading ? (
          <div className="rounded-[12px] border border-line bg-surface px-5 py-6 text-muted">
            Loading club…
          </div>
        ) : isError || !club ? (
          <div className="rounded-[12px] border border-line bg-surface px-5 py-6 text-muted">
            {getErrorMessage(loadError, "Club not found or unavailable.")}
          </div>
        ) : (
          <>
            <article className="overflow-hidden rounded-[12px] border border-line bg-surface">
              {club.logoUrl ? (
                <img
                  src={club.logoUrl}
                  alt=""
                  className="h-44 w-full object-cover sm:h-56"
                />
              ) : null}

              <div className="p-6 sm:p-8">
                <p className="font-display m-0 text-sm font-bold text-brand">
                  Campus Connect
                </p>
                <h1 className="font-display mt-2 mb-3 text-[clamp(1.8rem,4vw,2.4rem)] font-bold tracking-[-0.02em] text-ink">
                  {club.name}
                </h1>

                <p className="m-0 text-[1.02rem] leading-relaxed text-muted">
                  {club.description}
                </p>

                <dl className="mt-6 grid gap-3 border-t border-line pt-5 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="m-0 font-semibold text-ink">Members</dt>
                    <dd className="mt-1 mb-0 text-muted">
                      {club.memberIds.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="m-0 font-semibold text-ink">Organizers</dt>
                    <dd className="mt-1 mb-0 text-muted">
                      {club.organizerIds.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="m-0 font-semibold text-ink">Pending requests</dt>
                    <dd className="mt-1 mb-0 text-muted">
                      {(club.pendingMemberIds ?? []).length}
                    </dd>
                  </div>
                  <div>
                    <dt className="m-0 font-semibold text-ink">Your status</dt>
                    <dd className="mt-1 mb-0 text-muted">{statusLabel()}</dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className={joined || pending ? btnOutline : btnPrimary}
                    disabled={membershipBusy}
                    onClick={() => void onMembershipAction()}
                  >
                    {membershipLabel()}
                  </button>
                </div>

                {membershipError ? (
                  <p className="mt-4 mb-0 text-sm text-danger" role="alert">
                    {getErrorMessage(
                      membershipError,
                      "Could not update club membership"
                    )}
                  </p>
                ) : null}
              </div>
            </article>

            {canReview ? (
              <section className="mt-8 rounded-[12px] border border-line bg-surface p-6 sm:p-8">
                <h2 className="font-display m-0 mb-2 text-xl">Join requests</h2>
                <p className="mt-0 mb-4 text-sm text-muted">
                  Approve students to add them as members, or reject to clear
                  the request.
                </p>

                {requestsLoading ? (
                  <p className="m-0 text-muted">Loading requests…</p>
                ) : requestsError ? (
                  <p className="m-0 text-danger">Could not load join requests.</p>
                ) : (requestsData?.requests ?? []).length === 0 ? (
                  <p className="m-0 text-muted">No pending requests.</p>
                ) : (
                  <ul className="m-0 list-none space-y-3 p-0">
                    {(requestsData?.requests ?? []).map((request) => (
                      <li
                        key={request.id}
                        className="flex flex-col gap-3 rounded-[10px] border border-line bg-bg px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="m-0 font-semibold">{request.name}</p>
                          <p className="m-0 text-sm text-muted">
                            {request.email}
                            {request.department
                              ? ` · ${request.department}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className={btnPrimary}
                            disabled={reviewBusy}
                            onClick={() =>
                              void approveRequest({
                                clubId: id,
                                userId: request.id,
                              })
                            }
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className={btnOutline}
                            disabled={reviewBusy}
                            onClick={() =>
                              void rejectRequest({
                                clubId: id,
                                userId: request.id,
                              })
                            }
                          >
                            Reject
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {reviewError ? (
                  <p className="mt-4 mb-0 text-sm text-danger" role="alert">
                    {getErrorMessage(
                      reviewError,
                      "Could not update join request"
                    )}
                  </p>
                ) : null}
              </section>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}

export default function ClubDetailPage() {
  return (
    <RequireAuth>
      <ClubDetailContent />
    </RequireAuth>
  );
}
