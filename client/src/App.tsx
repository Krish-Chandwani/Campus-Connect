import { Navigate, Route, Routes } from "react-router-dom";
import AdminPage from "./pages/AdminPage";
import AnnouncementDetailPage from "./pages/AnnouncementDetailPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import ClubDetailPage from "./pages/ClubDetailPage";
import ClubsPage from "./pages/ClubsPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import EventDetailPage from "./pages/EventDetailPage";
import EventsPage from "./pages/EventsPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ManageEventsPage from "./pages/ManageEventsPage";
import RegisterPage from "./pages/RegisterPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:id" element={<EventDetailPage />} />
      <Route path="/clubs" element={<ClubsPage />} />
      <Route path="/clubs/:id" element={<ClubDetailPage />} />
      <Route path="/announcements" element={<AnnouncementsPage />} />
      <Route path="/announcements/:id" element={<AnnouncementDetailPage />} />
      <Route path="/manage" element={<ManageEventsPage />} />
      <Route path="/admin" element={<AdminPage />} />
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
