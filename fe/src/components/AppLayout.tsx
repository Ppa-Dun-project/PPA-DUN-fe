// Outlet: 자식 라우트가 렌더링되는 자리 (React Router의 핵심 컴포넌트)
// - router.tsx의 children 라우트가 이 자리에 들어감
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

/**
 * AppLayout: 모든 페이지의 공통 레이아웃
 * - 상단에 Navbar, 그 아래에 페이지 내용이 렌더링됨
 * - 최대 너비 1400px로 제한해서 큰 모니터에서도 가독성 유지
 */
export default function AppLayout() {
  return (
    // min-h-screen: 최소 높이를 화면 전체로 (짧은 페이지도 배경이 꽉 참)
    // bg-black text-white: 검정 배경 + 흰 글자 (다크 테마)
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* w-full: 전체 너비 / px-8: 좌우 패딩 / py-6: 상하 패딩 */}
      <main className="w-full px-8 py-6">
        {/* mx-auto: 좌우 마진 auto (가운데 정렬) */}
        {/* max-w-[1400px]: 최대 너비 1400px로 제한 */}
        <div className="mx-auto w-full max-w-[1400px]">
          {/* Outlet: 현재 URL에 맞는 페이지 컴포넌트가 여기에 들어감 */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
