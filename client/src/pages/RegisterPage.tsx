import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { useRegisterMutation } from "../features/auth/authApi";
import { setCredentials } from "../features/auth/authSlice";
import getErrorMessage from "../features/auth/getErrorMessage";

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
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-brand">Campus Connect</p>
        <h1>Create account</h1>
        <p className="auth-support">
          Join as a student to browse events, RSVP, and check in.
        </p>

        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            Full name
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Department <span className="optional">(optional)</span>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Computer Science"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>

          {error ? (
            <p className="auth-error" role="alert">
              {getErrorMessage(error, "Could not create account")}
            </p>
          ) : null}

          <button className="btn btn-primary" type="submit" disabled={isLoading}>
            {isLoading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
