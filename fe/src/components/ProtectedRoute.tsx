// Route guard: wraps protected routes (e.g., /my-team).
// If the user is not authenticated, redirects to /login with a ?redirect param
// so we can send them back to the original page after login.
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthed } from "../lib/auth";

export default function ProtectedRoute() {
  const location = useLocation();
  const authed = isAuthed();

  if (!authed) {
    // Preserve the intended destination so login can redirect back.
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  // Authenticated — render the child route.
  return <Outlet />;
}