import { Navigate, Route, Routes } from "react-router-dom";
import ComingSoonPage from "./pages/ComingSoonPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/events"
        element={
          <ComingSoonPage
            title="Events"
            description="Full events browse and detail will be implemented next."
          />
        }
      />
      <Route
        path="/clubs"
        element={
          <ComingSoonPage
            title="Clubs"
            description="Club directory will be implemented in a later step."
          />
        }
      />
      <Route
        path="/announcements"
        element={
          <ComingSoonPage
            title="Notices"
            description="Announcements feed will be implemented in a later step."
          />
        }
      />
      <Route
        path="/profile"
        element={
          <ComingSoonPage
            title="Profile"
            description="Your RSVPs and attendance will land here later."
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
