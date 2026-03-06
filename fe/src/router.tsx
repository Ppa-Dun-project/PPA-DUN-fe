import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import HomePage from "./pages/HomePage";
import DraftPage from "./pages/DraftPage";
import PlayerDetailPage from "./pages/PlayerDetailPage";
import LoginPage from "./pages/LoginPage";
import MyTeamPage from "./pages/MyTeamPage";
import SettingsPage from "./pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },

      // ✅ Draft is the main list page now
      { path: "draft", element: <DraftPage /> },
      { path: "draft/:id", element: <PlayerDetailPage /> },

      // ✅ Backward compatibility (so old links still work)
      { path: "players", element: <Navigate to="/draft" replace /> },
      { path: "players/:id", element: <Navigate to="/draft/:id" replace /> },

      { path: "login", element: <LoginPage /> },

      // Protected
      {
        element: <ProtectedRoute />,
        children: [
          { path: "my-team", element: <MyTeamPage /> },
          { path: "settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
]);