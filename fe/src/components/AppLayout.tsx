// Shared layout wrapper for all pages.
// Renders the sticky Navbar at the top and an <Outlet /> for the active route's page component.
// Max-width is capped at 1400px and centered for readability on large screens.
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="w-full px-8 py-6">
        <div className="mx-auto w-full max-w-[1400px]">
          <Outlet />  {/* Active page renders here */}
        </div>
      </main>
    </div>
  );
}