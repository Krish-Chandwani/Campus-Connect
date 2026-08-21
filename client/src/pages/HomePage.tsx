import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { logout } from "../features/auth/authSlice";

export default function HomePage() {
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector((state) => state.auth);

  return (
    <main className="shell-home">
      <p className="auth-brand">Campus Connect</p>
      <h1>Welcome</h1>

      {token && user ? (
        <>
          <p>
            Signed in as <strong>{user.name}</strong> ({user.role})
          </p>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => dispatch(logout())}
          >
            Sign out
          </button>
        </>
      ) : (
        <>
          <p>Auth is ready. Sign in or create a student account.</p>
          <div className="shell-actions">
            <Link className="btn btn-primary" to="/login">
              Sign in
            </Link>
            <Link className="btn btn-outline" to="/register">
              Create account
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
