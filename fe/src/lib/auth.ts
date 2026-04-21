// useSyncExternalStore: React 18+ 훅
// - 외부 저장소(localStorage, window 이벤트 등)를 구독할 때 사용
// - 저장소가 변경되면 자동으로 컴포넌트를 다시 렌더링
import { useSyncExternalStore } from "react";

// localStorage에 저장할 토큰의 키 이름
// - localStorage.getItem("ppadun_token")으로 접근
export const TOKEN_KEY = "ppadun_token";

/**
 * 현재 로그인 상태인지 확인
 * - localStorage에 토큰이 있으면 true
 * - Boolean(): 값을 불린으로 변환 (빈 문자열/null → false)
 */
export function isAuthed(): boolean {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

// ── 발행/구독 패턴(Pub/Sub)으로 인증 상태 관리 ──
// 로그인/로그아웃 시 모든 구독자(컴포넌트)에게 알림을 보내 자동 리렌더링

// Listener: 알림을 받을 함수 타입 (인자도 반환값도 없는 함수)
type Listener = () => void;

// Set: 중복을 허용하지 않는 배열 (같은 함수가 여러 번 등록되는 것 방지)
const listeners = new Set<Listener>();

/**
 * emit: "인증 상태가 변경됐다"고 모든 구독자에게 알림
 * - for...of: 배열/Set을 순회하는 문법
 */
function emit() {
  for (const listener of listeners) listener();
}

/**
 * onStorage: 다른 브라우저 탭에서 localStorage 변경 감지
 * - StorageEvent: localStorage가 변경될 때 브라우저가 자동 발생시키는 이벤트
 * - 현재 탭 변경은 발생하지 않음, 오직 다른 탭에서 변경됐을 때만
 */
function onStorage(e: StorageEvent) {
  // 우리 토큰 키가 변경된 경우에만 알림
  if (e.key === TOKEN_KEY) emit();
}

/**
 * subscribe: React 컴포넌트가 인증 상태 변화를 구독하는 함수
 * - useSyncExternalStore의 첫 번째 인자로 사용됨
 * - 구독 해제 함수를 반환 (컴포넌트 unmount 시 자동 호출)
 */
function subscribe(listener: Listener) {
  listeners.add(listener);

  // 첫 구독자가 생길 때만 storage 이벤트 리스너 등록 (효율성)
  if (listeners.size === 1) window.addEventListener("storage", onStorage);

  // 구독 해제 함수 반환
  return () => {
    listeners.delete(listener);
    // 마지막 구독자가 사라지면 이벤트 리스너도 해제 (메모리 절약)
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

/**
 * useAuth: 로그인 상태를 실시간으로 추적하는 React 훅
 * - 컴포넌트에서 `const authed = useAuth()` 형태로 사용
 * - 로그인/로그아웃 시 자동으로 컴포넌트가 다시 렌더링됨
 *
 * useSyncExternalStore의 3개 인자:
 * 1. subscribe: 구독 함수
 * 2. getSnapshot: 현재 상태 반환 (클라이언트)
 * 3. getServerSnapshot: 서버 렌더링 시 기본값 (SSR 대응)
 */
export function useAuth(): boolean {
  return useSyncExternalStore(subscribe, () => isAuthed(), () => false);
}

/**
 * login: 로그인 — 토큰을 저장하고 모든 구독자에게 알림
 */
export function login(token: string): void {
  // localStorage.setItem: 브라우저 저장소에 데이터 저장 (탭을 닫아도 유지됨)
  localStorage.setItem(TOKEN_KEY, token);
  emit();  // 모든 useAuth() 훅이 리렌더링됨
}

/**
 * logout: 로그아웃
 * 1. localStorage에서 토큰 삭제
 * 2. 모든 구독자에게 알림
 *
 * DB는 건드리지 않음 — 재로그인 시 드래프트 상태가 복원되어야 하므로.
 */
export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  emit();
}
