import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* ✅ 전체는 w-full, 내용은 padding으로 여백 */}
      <main className="w-full px-8 py-6">
        {/* ✅ 너무 좁지도, 너무 넓지도 않게: 큰 화면에서도 적당히 */}
        <div className="mx-auto w-full max-w-[1400px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}