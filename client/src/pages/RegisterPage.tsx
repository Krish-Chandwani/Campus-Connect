import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { useRegisterMutation } from "../features/auth/authApi";
import { setCredentials } from "../features/auth/authSlice";
import getErrorMessage from "../features/auth/getErrorMessage";
import { btnPrimary, inputClass } from "../lib/ui";

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const token = useAppSelector((state) => state.auth.token);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [register, { isLoading, error }] = useRegisterMutation();

  if (token) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      const result = await register({
        name,
        email,
        password,
        department: department.trim() || undefined,
      }).unwrap();
      dispatch(setCredentials(result));
      navigate("/", { replace: true });
    } catch {
      // Error shown from RTK mutation state
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,rgba(31,92,69,0.08),transparent_30%),var(--color-bg)] p-6">
      <div className="w-[min(26rem,100%)] rounded-[14px] border border-line bg-surface p-8 shadow-[0_10px_30px_rgba(26,35,48,0.08)]">
        <p className="font-display m-0 text-[1.05rem] font-bold text-brand">
          Campus Connect
        </p>
        <h1 className="font-display my-1.5 text-[2rem] tracking-[-0.02em]">
          Create account
        </h1>
        <p className="mb-6 mt-0 text-muted">
          Join as a student to browse events, RSVP, and check in.
        </p>

        <form className="grid gap-4" onSubmit={onSubmit}>
          <label className="grid gap-1.5 text-[0.95rem] font-semibold">
            Full name
            <input
              className={inputClass}
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="grid gap-1.5 text-[0.95rem] font-semibold">
            Email
            <input
              className={inputClass}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="grid gap-1.5 text-[0.95rem] font-semibold">
            <span>
              Department{" "}
              <span className="font-normal text-muted">(optional)</span>
            </span>
            <input
              className={inputClass}
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Computer Science"
            />
          </label>

          <label className="grid gap-1.5 text-[0.95rem] font-semibold">
            Password
            <input
              className={inputClass}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>

          {error ? (
            <p className="m-0 text-[0.92rem] text-danger" role="alert">
              {getErrorMessage(error, "Could not create account")}
            </p>
          ) : null}

          <button className={`${btnPrimary} mt-1 w-full`} type="submit" disabled={isLoading}>
            {isLoading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="mt-5 mb-0 text-[0.95rem] text-muted">
          Already have an account?{" "}
          <Link className="font-semibold text-brand" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
