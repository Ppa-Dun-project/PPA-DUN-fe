// React 훅 가져오기
// - useCallback: 함수를 메모이제이션 (불필요한 재생성 방지)
// - useEffect: 컴포넌트 생명주기 처리 (마운트/언마운트 등)
// - useRef: DOM 요소에 대한 참조를 저장 (렌더링과 무관한 값)
import { useCallback, useEffect, useRef } from "react";
import { apiPost } from "./api";
import { login } from "./auth";

// Google Cloud Console에서 발급받은 OAuth 클라이언트 ID
// - 이 ID를 통해 Google에 "이 앱이다"라고 알림
export const GOOGLE_CLIENT_ID =
  "96806984873-n9in5glb21d6lni6acqnkdrcmk9b6b2c.apps.googleusercontent.com";

// Google이 로그인 성공 시 반환하는 객체 타입
export type GoogleCredentialResponse = {
  credential: string;  // 서명된 JWT 토큰 (유저 정보가 담겨있음)
};

// 백엔드가 반환하는 응답 타입 (우리 DB의 유저 정보)
type AuthResponse = { id: number; email: string; name: string };

// Google의 전역 객체 타입 (window.google.accounts.id)
// - Google Identity Services 스크립트가 index.html에서 로드됨
type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (r: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (el: HTMLElement, config: Record<string, string>) => void;
};

// Google 로그인 버튼의 기본 스타일 설정
const BUTTON_CONFIG = {
  theme: "outline",       // 아웃라인 스타일
  size: "large",          // 크기
  width: "100%",          // 전체 너비
  text: "signin_with",    // 버튼 텍스트: "Sign in with Google"
  shape: "pill",          // 둥근 알약 모양
  locale: "en",           // 영어 표시
};

/**
 * useGoogleSignIn: Google 로그인 기능을 간편하게 붙여주는 커스텀 훅
 *
 * 사용 방법:
 *   const buttonRef = useGoogleSignIn(() => navigate("/"));
 *   return <div ref={buttonRef} />;  // ← 여기에 Google 버튼이 렌더링됨
 *
 * 동작 흐름:
 * 1. ref를 DOM div에 연결
 * 2. Google 라이브러리가 그 div 안에 로그인 버튼을 그림
 * 3. 유저가 버튼 클릭 → Google이 ID 토큰 발급
 * 4. 토큰을 백엔드에 전송 → 검증 + DB 저장
 * 5. localStorage에 토큰 저장
 * 6. onSuccess 콜백 실행 (보통 페이지 이동)
 */
export function useGoogleSignIn(onSuccess: () => void) {
  // useRef<HTMLDivElement>: 타입이 HTMLDivElement인 ref 생성
  // - 초기값 null, 나중에 실제 DOM div가 연결됨
  const buttonRef = useRef<HTMLDivElement>(null);

  // useCallback: onSuccess가 바뀔 때만 함수를 새로 만듦
  // - useEffect의 의존성 배열에서 불필요한 재실행 방지
  const handleCredential = useCallback(
    (response: GoogleCredentialResponse) => {
      // 백엔드로 Google 토큰 전송 → 검증 + DB 저장 → 응답 받기
      apiPost<AuthResponse, { credential: string }>("/api/auth/google/verify", {
        credential: response.credential,
      })
        .then(() => {
          // 검증 성공: Google credential을 localStorage에 저장
          login(response.credential);
          // 성공 콜백 실행 (보통 페이지 이동)
          onSuccess();
        })
        .catch((err) => console.error("Google login failed:", err));
    },
    [onSuccess]  // 의존성: onSuccess가 바뀌면 함수 재생성
  );

  // useEffect: 컴포넌트가 렌더링된 후 실행
  // - 두 번째 인자 [handleCredential]: 이 값이 바뀔 때만 재실행
  useEffect(() => {
    // window.google 객체에서 Google Identity Services API 가져오기
    // - as unknown as: 타입 단언 (TS에게 타입 강제)
    const google = (window as unknown as {
      google?: { accounts?: { id?: GoogleAccountsId } };
    }).google;

    // Google API가 로드되지 않았거나 ref가 아직 DOM에 연결되지 않았으면 종료
    if (!google?.accounts?.id || !buttonRef.current) return;

    // Google Sign-In 초기화
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredential,  // 로그인 성공 시 호출될 함수
    });

    // 실제 로그인 버튼을 DOM에 렌더링
    google.accounts.id.renderButton(buttonRef.current, BUTTON_CONFIG);
  }, [handleCredential]);

  // ref를 반환해서 컴포넌트가 자기 div에 붙일 수 있게 함
  return buttonRef;
}
