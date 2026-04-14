// Central route configuration using React Router v7 (createBrowserRouter).
// All pages are nested under AppLayout which provides Navbar + main content wrapper.
import { createBrowserRouter, Navigate, redirect } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import HomePage from "./pages/HomePage";
import DraftPage from "./pages/DraftPage";
import PlayerDetailPage from "./pages/PlayerDetailPage";
import NewsPage from "./pages/NewsPage";
import LoginPage from "./pages/LoginPage";
import MyTeamPage from "./pages/MyTeamPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,          // Shared layout: Navbar + <Outlet />
    children: [
      { index: true, element: <HomePage /> },          // Landing page with hero, news, draft setup

      // News — full list of news articles
      { path: "news", element: <NewsPage /> },

      // Draft — main feature: draft room with player list, comparison, bidding
      { path: "draft", element: <DraftPage /> },
      { path: "draft/:id", element: <PlayerDetailPage /> },  // Individual player detail

      // Legacy redirects for backward compatibility
      { path: "players", element: <Navigate to="/draft" replace /> },
      {
        path: "players/:id",
        loader: ({ params }) => redirect(params.id ? `/draft/${params.id}` : "/draft"),
      },

      { path: "login", element: <LoginPage /> },       // Google OAuth login

      {
        element: <ProtectedRoute />,                    // Auth guard — redirects to /login if not authenticated
        children: [{ path: "my-team", element: <MyTeamPage /> }],
      },

      { path: "settings", element: <Navigate to="/my-team" replace /> },
    ],
  },
]);
