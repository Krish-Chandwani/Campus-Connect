import { type CSSProperties, type FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import Navbar from "../components/Navbar";
import RequireAuth from "../components/RequireAuth";
import getErrorMessage from "../features/auth/getErrorMessage";
import {
  useDeleteAnnouncementMutation,
  useGetAnnouncementQuery,
  useUpdateAnnouncementMutation,
} from "../features/announcements/announcementsApi";
import formatNoticeDate from "../features/announcements/formatNoticeDate";
import { useListClubsQuery } from "../features/clubs/clubsApi";
import { btnOutline, btnPrimary, inputClass } from "../lib/ui";

function AnnouncementDetailContent() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const {
    data,
    isLoading,
    isError,
    error: loadError,
  } = useGetAnnouncementQuery(id, { skip: !id });
  const { data: clubsData } = useListClubsQuery();

  const [updateAnnouncement, updateState] = useUpdateAnnouncementMutation();
  const [deleteAnnouncement, deleteState] = useDeleteAnnouncementMutation();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);

  const notice = data?.announcement;
  const clubs = clubsData?.clubs ?? [];

  const club = notice?.clubId
    ? clubs.find((item) => item.id === String(notice.clubId))
    : undefined;

  const canManage = Boolean(
    user &&
      notice &&
      (user.role === "admin" ||
        (notice.audience === "club" &&
          notice.clubId &&
          club?.organizerIds.some((organizerId) => String(organizerId) === user.id)))
  );

  function startEdit() {
    if (!notice) return;
    setTitle(notice.title);
    setBody(notice.body);
    setPinned(notice.pinned);
    setEditing(true);
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!id) return;
    try {
      await updateAnnouncement({
        id,
        title: title.trim(),
        body: body.trim(),
        pinned,
      }).unwrap();
      setEditing(false);
    } catch {
      // shown below
    }
  }

  async function onTogglePin() {
    if (!notice || !id) return;
    try {
      await updateAnnouncement({ id, pinned: !notice.pinned }).unwrap();
    } catch {
      // shown below
    }
  }

  async function onDelete() {
    if (!id || !notice) return;
    if (!confirm(`Delete notice “${notice.title}”?`)) return;
    try {
      await deleteAnnouncement(id).unwrap();
      navigate("/announcements");
    } catch {
      // shown below
    }
  }

  const when = notice ? formatNoticeDate(notice.createdAt) : null;
  const actionError = updateState.error || deleteState.error;

  return (
    <div className="min-h-screen bg-bg">
      <Navbar variant="solid" />

      <main className="mx-auto w-[min(720px,calc(100%-2rem))] pb-16 pt-8 animate-[fade-up_500ms_ease_both]">
        <Link
          to="/announcements"
          className="mb-6 inline-block text-sm font-semibold text-brand hover:underline underline-offset-4"
        >
          ← Back to notice board
        </Link>

        {isLoading ? (
          <div className="rounded-[12px] border border-line bg-surface px-5 py-6 text-muted">
            Loading notice…
          </div>
        ) : isError || !notice ? (
          <div className="rounded-[12px] border border-line bg-surface px-5 py-6 text-muted">
            {getErrorMessage(loadError, "Notice not found or unavailable.")}
          </div>
        ) : (
          <article
            className="relative overflow-hidden rounded-[18px] border-[10px] border-brand-deep p-4 sm:p-6"
            style={{
              backgroundColor: "#7d947f",
              backgroundImage: `
                radial-gradient(circle at 20% 25%, rgba(255,255,255,0.12) 0 1.5px, transparent 2px),
                radial-gradient(circle at 70% 60%, rgba(0,0,0,0.08) 0 1.2px, transparent 2px),
                linear-gradient(145deg, #8aa38c 0%, #6f8671 50%, #7d947f 100%)
              `,
            }}
          >
            <div
              className="relative mx-auto max-w-xl rounded-[3px] bg-[#fffdf8] px-5 pb-6 pt-8 shadow-[0_12px_28px_rgba(26,35,48,0.2)] sm:px-8 sm:pb-8 sm:pt-10"
              style={{ transform: "rotate(-0.4deg)" } as CSSProperties}
            >
              <span
                className="absolute left-1/2 top-3 h-4 w-4 -translate-x-1/2 rounded-full border border-black/10 shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
                style={{
                  background: notice.pinned
                    ? "radial-gradient(circle at 30% 30%, #f0c56d, var(--color-accent))"
                    : "radial-gradient(circle at 30% 30%, #6f9f86, var(--color-brand))",
                }}
                aria-hidden
              />

              {editing ? (
                <form className="grid gap-3" onSubmit={onSave}>
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
                      className={`${inputClass} min-h-40 py-2`}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      maxLength={5000}
                      required
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={pinned}
                      onChange={(e) => setPinned(e.target.checked)}
                    />
                    Pinned
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={btnPrimary}
                      type="submit"
                      disabled={updateState.isLoading}
                    >
                      {updateState.isLoading ? "Saving…" : "Save"}
                    </button>
                    <button
                      className={btnOutline}
                      type="button"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="font-display m-0 text-sm font-bold text-brand">
                    Campus Connect
                  </p>
                  {notice.pinned ? (
                    <span className="mt-3 inline-block rounded bg-accent-soft px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-accent">
                      Pinned
                    </span>
                  ) : null}
                  <h1 className="font-display mt-2 mb-4 break-words text-[clamp(1.7rem,4vw,2.3rem)] font-bold tracking-[-0.02em] text-ink [overflow-wrap:anywhere]">
                    {notice.title}
                  </h1>
                  <p className="m-0 whitespace-pre-wrap break-words text-[1.05rem] leading-relaxed text-ink/90 [overflow-wrap:anywhere]">
                    {notice.body}
                  </p>

                  <dl className="mt-6 grid gap-3 border-t border-dashed border-line pt-5 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="m-0 font-semibold text-ink">Audience</dt>
                      <dd className="mt-1 mb-0 text-muted">
                        {notice.audience === "all"
                          ? "Campus-wide"
                          : club?.name ?? "Club notice"}
                      </dd>
                    </div>
                    <div>
                      <dt className="m-0 font-semibold text-ink">Posted</dt>
                      <dd className="mt-1 mb-0 text-muted">
                        {when?.dateLabel}
                        {when?.timeLabel ? ` · ${when.timeLabel}` : ""}
                      </dd>
                    </div>
                  </dl>

                  {canManage ? (
                    <div className="mt-6 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={btnPrimary}
                        onClick={startEdit}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={btnOutline}
                        disabled={updateState.isLoading}
                        onClick={() => void onTogglePin()}
                      >
                        {notice.pinned ? "Unpin" : "Pin"}
                      </button>
                      <button
                        type="button"
                        className={btnOutline}
                        disabled={deleteState.isLoading}
                        onClick={() => void onDelete()}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </>
              )}

              {actionError ? (
                <p className="mt-4 mb-0 text-sm text-danger" role="alert">
                  {getErrorMessage(actionError, "Could not update notice")}
                </p>
              ) : null}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}

export default function AnnouncementDetailPage() {
  return (
    <RequireAuth>
      <AnnouncementDetailContent />
    </RequireAuth>
  );
}
