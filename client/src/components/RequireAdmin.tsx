import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import RequireAuth from "./RequireAuth";

type RequireAdminProps = {
  children: ReactNode;
};

function AdminGate({ children }: RequireAdminProps) {
  const user = useAppSelector((state) => state.auth.user);

  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center text-muted">
        Checking admin access…
      </div>
    );
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function RequireAdmin({ children }: RequireAdminProps) {
  return (
    <RequireAuth>
      <AdminGate>{children}</AdminGate>
    </RequireAuth>
  );
}
