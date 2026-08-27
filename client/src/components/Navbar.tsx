import { NavLink } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { logout } from "../features/auth/authSlice";

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

  const navLinks =
    user?.role === "admin"
      ? [...links, { to: "/admin", label: "Admin" }]
      : links;

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
