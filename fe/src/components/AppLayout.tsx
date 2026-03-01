import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* ✅ Body는 full width, 내용은 중앙 컨테이너 */}
      <main className="w-full">
        <div className="mx-auto w-full max-w-[1400px] px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}