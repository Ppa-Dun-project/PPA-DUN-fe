// React의 핵심 라이브러리 가져오기
import React from "react";
// ReactDOM: React 컴포넌트를 실제 DOM(브라우저 화면)에 렌더링하는 도구
import ReactDOM from "react-dom/client";
// RouterProvider: 라우터 설정을 앱 전체에 제공하는 컴포넌트
import { RouterProvider } from "react-router-dom";
// 우리가 정의한 라우팅 설정 (URL → 페이지 매핑)
import { router } from "./router";
// 전역 CSS 스타일 (Tailwind + 커스텀 스타일)
import "./index.css";

// document.getElementById("root"): HTML의 <div id="root"> 요소를 찾음
// createRoot: React 18+에서 앱을 마운트하는 방식
// ! (non-null assertion): "이 요소는 반드시 존재한다"고 TypeScript에게 알려줌
// .render(): 안의 JSX를 실제 화면에 그림
ReactDOM.createRoot(document.getElementById("root")!).render(
  // StrictMode: 개발 중 잠재적 문제를 감지하는 React의 검사 도구
  // - 사이드 이펙트 감지, 권장되지 않는 API 사용 경고 등
  // - 프로덕션 빌드에서는 자동으로 제거됨
  <React.StrictMode>
    {/* 앱 전체에 라우터 적용 — 이 시점부터 URL 변경 시 해당 페이지가 렌더링됨 */}
    <RouterProvider router={router} />
  </React.StrictMode>
);
