import { NavLink } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { logout } from "../features/auth/authSlice";
import { useListClubsQuery } from "../features/clubs/clubsApi";
import { useGetUnreadCountQuery } from "../features/notifications/notificationsApi";

type NavbarProps = {
  variant?: "frost" | "solid";
};

const links = [
  { to: "/events", label: "Events" },
  { to: "/clubs", label: "Clubs" },
  { to: "/announcements", label: "Notices" },
  { to: "/profile", label: "Profile" },
];

export default function Navbar({ variant = "solid" }: NavbarProps) {
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector((state) => state.auth);
  const { data: clubsData } = useListClubsQuery(undefined, { skip: !token });
  const { data: unreadData } = useGetUnreadCountQuery(undefined, { skip: !token });

  const canManageEvents =
    user?.role === "admin" ||
    Boolean(
      user &&
        clubsData?.clubs.some((club) =>
          club.organizerIds.some((id) => String(id) === user.id)
        )
    );

  const navLinks = [
    ...links,
    ...(canManageEvents ? [{ to: "/manage", label: "Manage" }] : []),
    ...(user?.role === "admin" ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  const headerClass =
    variant === "frost"
      ? "absolute inset-x-0 top-0 z-20 flex h-[4.25rem] items-center justify-between px-4 text-white sm:px-6 bg-black/20 backdrop-blur-md border-b border-white/15"
      : "sticky top-0 z-20 flex h-[4.25rem] items-center justify-between px-4 sm:px-6 bg-white/92 backdrop-blur-[12px] border-b border-line text-ink";

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-[0.95rem] font-medium opacity-90 hover:opacity-100 hover:underline hover:underline-offset-[0.3em] ${
      isActive ? "opacity-100 underline underline-offset-[0.3em]" : ""
    }`;

  return (
    <header className={headerClass}>
      <NavLink to="/" className="font-display text-[1.15rem] font-bold text-inherit">
        Campus Connect
      </NavLink>

      <nav aria-label="Main">
        <ul className="flex items-center gap-3 sm:gap-5 list-none m-0 p-0">
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} className={linkClass}>
                {link.label}
              </NavLink>
            </li>
          ))}
          {token && user ? (
            <li>
              <NavLink
                to="/notifications"
                className="relative inline-flex items-center gap-2 text-[0.95rem] font-medium opacity-90 hover:opacity-100 hover:underline hover:underline-offset-[0.3em]"
              >
                <span aria-hidden>🔔</span>
                <span>Alerts</span>
                {unreadData && unreadData.count > 0 ? (
                  <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[0.7rem] font-bold text-white">
                    {unreadData.count > 9 ? "9+" : unreadData.count}
                  </span>
                ) : null}
              </NavLink>
            </li>
          ) : null}
          <li>
            {token && user ? (
              <button
                type="button"
                className="border-0 bg-transparent p-0 text-[0.95rem] font-medium text-inherit opacity-90 cursor-pointer hover:opacity-100 hover:underline hover:underline-offset-[0.3em]"
                onClick={() => dispatch(logout())}
              >
                Sign out
              </button>
            ) : (
              <NavLink to="/login" className={linkClass}>
                Sign in
              </NavLink>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
}
