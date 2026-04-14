// Root component: wraps the entire app with React Router.
// All route definitions live in router.tsx.
import { RouterProvider } from "react-router-dom";
import { router } from "./router";

function App() {
  return <RouterProvider router={router} />;
}

export default App;
