// Navigate: 리다이렉트용 컴포넌트 (렌더링되면 다른 URL로 이동)
// Outlet: 자식 라우트 렌더링 자리
// useLocation: 현재 URL 정보를 가져오는 훅
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthed } from "../lib/auth";

/**
 * ProtectedRoute: 로그인 필수 페이지를 감싸는 가드
 * - 비로그인 유저는 /login으로 자동 리다이렉트
 * - 로그인 후 원래 가려던 페이지로 돌아갈 수 있게 redirect 파라미터 저장
 *
 * 사용 예 (router.tsx):
 *   {
 *     element: <ProtectedRoute />,
 *     children: [{ path: "my-team", element: <MyTeamPage /> }]
 *   }
 */
export default function ProtectedRoute() {
  // 현재 URL 정보 (경로 + 쿼리 문자열 포함)
  // - pathname: "/my-team"
  // - search: "?foo=bar" (있으면)
  const location = useLocation();

  // 로그인 상태 확인
  if (!isAuthed()) {
    // 로그인 후 돌아갈 URL을 쿼리 파라미터로 저장
    // - encodeURIComponent: 특수문자를 URL 안전하게 변환
    const redirect = encodeURIComponent(location.pathname + location.search);

    // replace: 히스토리에 기록 남기지 않고 리다이렉트
    // - 뒤로가기로 돌아와도 무한 루프 방지
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  // 로그인 상태라면 자식 라우트 (예: MyTeamPage)를 정상 렌더링
  return <Outlet />;
}
