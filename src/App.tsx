import { useEffect } from "react";
import { Route, Switch, useLocation, Redirect } from "wouter";
import { useWorkflowStore } from "./hooks/useWorkflowStore";
import { LoginPage, WorkflowPage, DashboardPage, HomePage } from "./pages";

function App() {
  const user = useWorkflowStore((state) => state.user);
  const isAuthenticated = useWorkflowStore((state) => state.isAuthenticated);
  const [location, navigate] = useLocation();

  useEffect(() => {
    // Public routes that don't require redirection when not authenticated
    const publicRoutes = ["/", "/login"];

    if (!isAuthenticated && !publicRoutes.includes(location)) {
      // Redirect to login if not authenticated and trying to access protected route
      navigate("/login", { replace: true });
    } else if (isAuthenticated && location === "/login") {
      // Redirect to workflow page after successful login
      navigate("/workflow", { replace: true });
    }
  }, [isAuthenticated, location, navigate]);

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/">
        <HomePage />
      </Route>
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/workflow" /> : <LoginPage />}
      </Route>

      {/* Protected routes */}
      <Route path="/dashboard">
        {!isAuthenticated ? (
          <Redirect to="/login" />
        ) : (
          <DashboardPage
            username={user?.username}
          />
        )}
      </Route>
      <Route path="/workflow">
        {!isAuthenticated ? (
          <Redirect to="/login" />
        ) : (
          <WorkflowPage
            username={user?.username}
          />
        )}
      </Route>

      {/* Fallback route */}
      <Route>
        <div className="flex flex-col items-center justify-center h-screen">
          <h1 className="text-3xl font-bold mb-4">404 - Page Not Found</h1>
          <p className="mb-6">The page you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </Route>
    </Switch>
  );
}

export default App;
