// React Router 훅
// - NavLink: Link와 비슷하지만 현재 URL과 일치하면 자동으로 'active' 스타일 적용
// - useLocation: 현재 URL 가져오기
// - useNavigate: 프로그래매틱하게 페이지 이동하는 함수 반환
import { NavLink, useLocation, useNavigate } from "react-router-dom";
// logout 함수와 로그인 상태 훅 가져오기 (이름 충돌 방지로 doLogout으로 별칭)
import { logout as doLogout, useAuth } from "../lib/auth";
// useMemo: 계산 결과를 캐싱 (의존성이 바뀔 때만 재계산)
// useState: 컴포넌트 내부 상태 관리
import { useMemo, useState } from "react";
import logo from "../assets/LOGO.png";

/**
 * navItemClass: 네비게이션 링크의 활성/비활성 스타일 결정
 * - isActive: 현재 URL과 일치하는지 여부
 */
function navItemClass(isActive: boolean) {
  return [
    "px-3 py-2 rounded-xl text-base font-black tracking-wide transition",
    // 활성 상태면 배경 강조, 아니면 호버 시에만 배경
    isActive ? "bg-white/10 text-white" : "text-white/80 hover:text-white hover:bg-white/5",
  ].join(" ");
}

/**
 * Navbar: 상단 네비게이션 바
 * - 데스크탑: 수평 메뉴 + 로그인/로그아웃 버튼
 * - 모바일: 햄버거 메뉴 → 드로어(사이드 패널)로 열림
 * - 로그인 상태에 따라 메뉴와 버튼이 동적으로 바뀜
 */
export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  // 로그인 상태를 실시간으로 추적 (로그인/로그아웃 시 자동 리렌더링)
  const authed = useAuth();
  // 모바일 드로어 열림/닫힘 상태
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 로그인 페이지로 이동하면서 현재 URL을 redirect 파라미터로 저장
  const redirectToLogin = () => {
    const redirect = encodeURIComponent(location.pathname + location.search);
    navigate(`/login?redirect=${redirect}`);
  };

  // useMemo: 메뉴 배열을 로그인 상태에 따라 계산 (authed가 바뀔 때만 재계산)
  const menu = useMemo(() => {
    const base = [
      { to: "/", label: "Home", protected: false },
      { to: "/draft", label: "Draft", protected: false },
    ];
    const protectedItems = [{ to: "/my-team", label: "My Team", protected: true }];
    // spread 연산자(...): 배열을 펼쳐서 합침
    return authed ? [...base, ...protectedItems] : base;
  }, [authed]);

  return (
    // sticky top-0: 스크롤해도 상단에 고정
    // z-40: 다른 요소보다 위에 표시
    // backdrop-blur: 뒤 배경을 흐리게 (유리 효과)
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto w-full max-w-[1400px] px-8 py-3">
        <div className="flex items-center justify-between">
          {/* ── 로고 + 브랜드명 (클릭하면 홈으로) ── */}
          <button
            onClick={() => {
              setDrawerOpen(false);  // 드로어 닫기
              navigate("/");          // 홈으로 이동
            }}
            className="group flex items-center gap-3 rounded-2xl border border-transparent bg-white/[0.02] p-1.5 transition hover:border-white/30 hover:bg-white/[0.09] hover:backdrop-blur-md hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_0_0_1px_rgba(255,255,255,0.05)]"
            aria-label="Go to Home"
          >
            <img
              src={logo}
              alt="Logo"
              className="h-11 w-11 rounded-2xl object-cover ring-1 ring-transparent transition group-hover:ring-white/35"
            />
            <span
              className="text-xl text-white/95 transition group-hover:text-white group-hover:[text-shadow:0_0_14px_rgba(255,255,255,0.4)]"
              style={{ fontFamily: '"Jaro", system-ui' }}
            >
              PPA-DUN
            </span>
          </button>

          {/* ── 데스크탑 네비게이션 (md 이상에서 표시) ── */}
          {/* hidden md:flex: 기본은 숨기고, 중간 화면 이상에서만 보이게 */}
          <nav className="hidden items-center gap-2 md:flex">
            {menu.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                // className을 함수로 전달 → NavLink가 isActive 값을 넘겨줌
                className={({ isActive }) => navItemClass(isActive)}
                onClick={(e) => {
                  // 보호된 메뉴인데 비로그인이면 이동 막고 로그인 페이지로
                  if (item.protected && !authed) {
                    e.preventDefault();  // 기본 이동 동작 막기
                    redirectToLogin();
                  }
                }}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* ── 데스크탑 로그인/로그아웃 버튼 ── */}
          <div className="hidden items-center gap-3 md:flex">
            {!authed ? (
              // 비로그인: Login 버튼
              <button
                onClick={() => navigate("/login")}
                className="rounded-2xl bg-emerald-500 px-4 py-2 text-base font-black text-black shadow-[0_12px_30px_rgba(16,185,129,0.25)] transition hover:translate-y-[-1px] hover:bg-emerald-400 active:translate-y-0"
              >
                Login
              </button>
            ) : (
              // 로그인: Logout 버튼
              <button
                onClick={() => {
                  doLogout();                          // 토큰 삭제 + 백엔드 리셋
                  navigate("/", { replace: true });    // 홈으로 이동 (히스토리 교체)
                }}
                className="rounded-2xl bg-emerald-500 px-4 py-2 text-base font-black text-black shadow-[0_12px_30px_rgba(16,185,129,0.25)] transition hover:translate-y-[-1px] hover:bg-emerald-400 active:translate-y-0"
              >
                Logout
              </button>
            )}
          </div>

          {/* ── 모바일 햄버거 메뉴 버튼 (md 미만에서 표시) ── */}
          <button
            className="md:hidden rounded-2xl border border-white/10 px-3 py-2 text-white/90 hover:bg-white/5 transition"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
        </div>
      </div>

      {/* ── 모바일 드로어 (햄버거 클릭 시 나타남) ── */}
      {/* 조건부 렌더링: drawerOpen이 true일 때만 렌더링 */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* 배경 오버레이 (클릭하면 드로어 닫힘) */}
          <button className="absolute inset-0 bg-black/70" onClick={() => setDrawerOpen(false)} />

          {/* 드로어 본체 (우측에서 슬라이드) */}
          <div className="absolute right-0 top-0 h-full w-[82%] max-w-sm border-l border-white/10 bg-zinc-950 p-4 animate-drawerIn">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  navigate("/");
                }}
                className="group flex items-center gap-2 rounded-2xl border border-transparent bg-white/[0.02] p-1.5 transition hover:border-white/30 hover:bg-white/[0.09] hover:backdrop-blur-md"
              >
                <img
                  src={logo}
                  alt="Logo"
                  className="h-10 w-10 rounded-2xl object-cover ring-1 ring-transparent transition group-hover:ring-white/35"
                />
                <span
                  className="text-lg text-white/95 transition group-hover:text-white group-hover:[text-shadow:0_0_14px_rgba(255,255,255,0.35)]"
                  style={{ fontFamily: '"Jaro", system-ui' }}
                >
                  PPA-DUN
                </span>
              </button>

              <button
                className="rounded-xl border border-white/10 px-3 py-1 text-xs font-black text-white/80 hover:bg-white/5 transition"
                onClick={() => setDrawerOpen(false)}
              >
                Close
              </button>
            </div>

            {/* 드로어 메뉴 아이템들 */}
            <div className="mt-6 flex flex-col gap-2">
              {[
                { to: "/", label: "Home", protected: false },
                { to: "/draft", label: "Draft", protected: false },
                { to: "/my-team", label: "My Team", protected: true },
              ].map((item) => (
                <button
                  key={item.to}
                  onClick={() => {
                    if (item.protected && !authed) return redirectToLogin();
                    setDrawerOpen(false);
                    navigate(item.to);
                  }}
                  className="w-full rounded-2xl border border-white/10 px-4 py-3 text-left text-base font-black text-white/90 hover:bg-white/5 transition"
                >
                  {item.label}
                </button>
              ))}

              {/* 드로어 하단 로그인/로그아웃 버튼 */}
              <div className="mt-4 border-t border-white/10 pt-4">
                {!authed ? (
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      navigate("/login");
                    }}
                    className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-base font-black text-black transition hover:bg-emerald-400"
                  >
                    Login
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      doLogout();
                      setDrawerOpen(false);
                      navigate("/", { replace: true });
                    }}
                    className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-base font-black text-black transition hover:bg-emerald-400"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
