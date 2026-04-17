// RouterProvider: 라우팅 설정을 하위 컴포넌트에 제공하는 React Router 컴포넌트
import { RouterProvider } from "react-router-dom";
// router: URL과 페이지 컴포넌트를 매핑하는 설정 객체
import { router } from "./router";

// App: 앱의 최상위 컴포넌트
// - 현재는 라우터 설정을 연결하는 역할만 수행
// - 나중에 전역 Provider (테마, 상태관리 등)가 추가되면 여기에 감싸게 됨
function App() {
  return <RouterProvider router={router} />;
}

// default export: 다른 파일에서 `import App from './App'` 형태로 가져올 수 있게 함
export default App;
