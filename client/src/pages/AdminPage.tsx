import { type FormEvent, useState } from "react";
import Navbar from "../components/Navbar";
import RequireAdmin from "../components/RequireAdmin";
import getErrorMessage from "../features/auth/getErrorMessage";
import {
  useAddClubOrganizerMutation,
  useCreateClubMutation,
  useDeleteClubMutation,
  useListClubsQuery,
  useRemoveClubOrganizerMutation,
} from "../features/clubs/clubsApi";
import {
  useListUsersQuery,
  useUpdateUserRoleMutation,
} from "../features/users/usersApi";
import type { UserRole } from "../features/auth/authSlice";
import { btnOutline, btnPrimary, inputClass } from "../lib/ui";

type Tab = "clubs" | "users";

function AdminDashboardContent() {
  const [tab, setTab] = useState<Tab>("clubs");

  return (
    <div className="min-h-screen bg-bg">
      <Navbar variant="solid" />

      <main className="mx-auto w-[min(960px,calc(100%-2rem))] pb-16 pt-8 animate-[fade-up_500ms_ease_both]">
        <header className="mb-6">
          <p className="font-display m-0 text-sm font-bold text-brand">
            Campus Connect
          </p>
          <h1 className="font-display mt-1 mb-2 text-[clamp(1.9rem,4vw,2.6rem)] font-bold tracking-[-0.02em]">
            Admin
          </h1>
          <p className="m-0 text-muted">
            Create clubs and assign organizers. Organizers then manage their
            clubs and events.
          </p>
        </header>

        <div className="mb-6 flex gap-2">
          <button
            type="button"
            className={tab === "clubs" ? btnPrimary : btnOutline}
            onClick={() => setTab("clubs")}
          >
            Clubs
          </button>
          <button
            type="button"
            className={tab === "users" ? btnPrimary : btnOutline}
            onClick={() => setTab("users")}
          >
            Users
          </button>
        </div>

        {tab === "clubs" ? <ClubsPanel /> : <UsersPanel />}
      </main>
    </div>
  );
}

function ClubsPanel() {
  const { data, isLoading, isError } = useListClubsQuery();
  const { data: usersData } = useListUsersQuery();
  const [createClub, createState] = useCreateClubMutation();
  const [deleteClub, deleteState] = useDeleteClubMutation();
  const [addOrganizer, addState] = useAddClubOrganizerMutation();
  const [removeOrganizer, removeState] = useRemoveClubOrganizerMutation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [organizerEmailByClub, setOrganizerEmailByClub] = useState<
    Record<string, string>
  >({});

  const clubs = data?.clubs ?? [];
  const usersById = new Map(
    (usersData?.users ?? []).map((user) => [user.id, user])
  );
  const actionError =
    createState.error ||
    deleteState.error ||
    addState.error ||
    removeState.error;

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    try {
      await createClub({ name, description }).unwrap();
      setName("");
      setDescription("");
    } catch {
      // shown below
    }
  }

  return (
    <div className="grid gap-8">
      <section className="rounded-[12px] border border-line bg-surface p-5">
        <h2 className="font-display m-0 mb-4 text-xl">Create club</h2>
        <form className="grid gap-3" onSubmit={onCreate}>
          <label className="grid gap-1.5 text-sm font-semibold">
            Name
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Description
            <input
              className={inputClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </label>
          <button
            className={`${btnPrimary} w-fit`}
            type="submit"
            disabled={createState.isLoading}
          >
            {createState.isLoading ? "Creating…" : "Create club"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-display m-0 mb-3 text-xl">All clubs</h2>
        {isLoading ? (
          <p className="text-muted">Loading clubs…</p>
        ) : isError ? (
          <p className="text-danger">Could not load clubs.</p>
        ) : clubs.length === 0 ? (
          <p className="text-muted">No clubs yet. Create one above.</p>
        ) : (
          <ul className="m-0 list-none space-y-4 p-0">
            {clubs.map((club) => (
              <li
                key={club.id}
                className="rounded-[12px] border border-line bg-surface p-5"
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="m-0 text-lg font-semibold">{club.name}</h3>
                    <p className="mt-1 mb-0 text-sm text-muted">
                      {club.description}
                    </p>
                    <p className="mt-2 mb-0 text-xs text-muted">
                      Organizers: {club.organizerIds.length} · Members:{" "}
                      {club.memberIds.length}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={btnOutline}
                    disabled={deleteState.isLoading}
                    onClick={() => {
                      if (confirm(`Delete club “${club.name}”?`)) {
                        void deleteClub(club.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>

                {club.organizerIds.length > 0 ? (
                  <ul className="mb-4 list-none space-y-2 p-0">
                    {club.organizerIds.map((organizerId) => {
                      const organizer = usersById.get(String(organizerId));
                      return (
                        <li
                          key={organizerId}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-bg px-3 py-2 text-sm"
                        >
                          <span>
                            {organizer ? (
                              <>
                                <strong>{organizer.name}</strong>
                                <span className="text-muted">
                                  {" "}
                                  · {organizer.email}
                                </span>
                              </>
                            ) : (
                              <span className="font-mono text-xs text-muted">
                                {organizerId}
                              </span>
                            )}
                          </span>
                          <button
                            type="button"
                            className="border-0 bg-transparent p-0 text-sm font-semibold text-danger cursor-pointer"
                            onClick={() =>
                              void removeOrganizer({
                                clubId: club.id,
                                userId: organizerId,
                              })
                            }
                          >
                            Remove
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mb-4 text-sm text-muted">
                    No organizers assigned yet.
                  </p>
                )}

                <form
                  className="flex flex-col gap-2 sm:flex-row"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const email = (organizerEmailByClub[club.id] ?? "").trim();
                    if (!email) return;
                    void addOrganizer({ clubId: club.id, email })
                      .unwrap()
                      .then(() =>
                        setOrganizerEmailByClub((prev) => ({
                          ...prev,
                          [club.id]: "",
                        }))
                      )
                      .catch(() => undefined);
                  }}
                >
                  <input
                    className={`${inputClass} sm:flex-1`}
                    type="email"
                    placeholder="Organizer email"
                    value={organizerEmailByClub[club.id] ?? ""}
                    onChange={(e) =>
                      setOrganizerEmailByClub((prev) => ({
                        ...prev,
                        [club.id]: e.target.value,
                      }))
                    }
                    required
                  />
                  <button
                    className={btnPrimary}
                    type="submit"
                    disabled={addState.isLoading}
                  >
                    Assign organizer
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        {actionError ? (
          <p className="mt-4 text-sm text-danger" role="alert">
            {getErrorMessage(actionError, "Club action failed")}
          </p>
        ) : null}
      </section>
    </div>
  );
}

function UsersPanel() {
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState("");
  const { data, isLoading, isError } = useListUsersQuery({
    search: submitted || undefined,
  });
  const [updateRole, updateState] = useUpdateUserRoleMutation();

  const users = data?.users ?? [];

  async function setRole(userId: string, role: UserRole) {
    try {
      await updateRole({ userId, role }).unwrap();
    } catch {
      // shown below
    }
  }

  return (
    <section>
      <form
        className="mb-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(search.trim());
        }}
      >
        <input
          className={`${inputClass} sm:flex-1`}
          type="search"
          placeholder="Search name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className={btnPrimary} type="submit">
          Search
        </button>
      </form>

      {isLoading ? (
        <p className="text-muted">Loading users…</p>
      ) : isError ? (
        <p className="text-danger">Could not load users.</p>
      ) : users.length === 0 ? (
        <p className="text-muted">No users found.</p>
      ) : (
        <ul className="m-0 list-none overflow-hidden rounded-[12px] border border-line bg-surface p-0">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex flex-col gap-3 border-t border-line px-4 py-4 first:border-t-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="m-0 font-semibold">{user.name}</p>
                <p className="m-0 text-sm text-muted">{user.email}</p>
                <p className="mt-1 mb-0 text-xs font-bold uppercase tracking-wide text-brand">
                  {user.role}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={btnOutline}
                  disabled={updateState.isLoading || user.role === "student"}
                  onClick={() => void setRole(user.id, "student")}
                >
                  Make student
                </button>
                <button
                  type="button"
                  className={btnOutline}
                  disabled={updateState.isLoading || user.role === "organizer"}
                  onClick={() => void setRole(user.id, "organizer")}
                >
                  Make organizer
                </button>
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={updateState.isLoading || user.role === "admin"}
                  onClick={() => void setRole(user.id, "admin")}
                >
                  Make admin
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {updateState.error ? (
        <p className="mt-4 text-sm text-danger" role="alert">
          {getErrorMessage(updateState.error, "Could not update role")}
        </p>
      ) : null}
    </section>
  );
}

export default function AdminPage() {
  return (
    <RequireAdmin>
      <AdminDashboardContent />
    </RequireAdmin>
  );
}
