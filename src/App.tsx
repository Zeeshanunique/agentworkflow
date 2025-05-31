import { useEffect } from "react";
import { Route, Switch, useLocation, Redirect } from "wouter";
import { useWorkflowStore } from "./hooks/useWorkflowStore";
import { LoginPage, WorkflowPage, DashboardPage, HomePage } from "./pages";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { performanceMonitor } from "./utils/performance";
import { logger } from "./utils/logger";
import { Toaster } from "./components/ui/Toaster";

function App() {
  const user = useWorkflowStore((state) => state.user);
  const isAuthenticated = useWorkflowStore((state) => state.isAuthenticated);
  const [location, navigate] = useLocation();

  useEffect(() => {
    // Start performance monitoring for route change
    performanceMonitor.mark('routeChange');

    // Public routes that don't require redirection when not authenticated
    const publicRoutes = ["/", "/login"];

    if (!isAuthenticated && !publicRoutes.includes(location)) {
      // Redirect to login if not authenticated and trying to access protected route
      navigate("/login", { replace: true });
      logger.info('Redirecting to login - user not authenticated');
    } else if (isAuthenticated && location === "/login") {
      // Redirect to workflow page after successful login
      navigate("/workflow", { replace: true });
      logger.info('Redirecting to workflow - user authenticated');
    }

    // Measure route change performance
    performanceMonitor.measure('routeChange', 'routeChange');
  }, [isAuthenticated, location, navigate]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <Switch>
          {/* Public routes */}
          <Route path="/">
            <ErrorBoundary>
              <HomePage />
            </ErrorBoundary>
          </Route>
          <Route path="/login">
            {isAuthenticated ? (
              <Redirect to="/workflow" />
            ) : (
              <ErrorBoundary>
                <LoginPage />
              </ErrorBoundary>
            )}
          </Route>

          {/* Protected routes */}
          <Route path="/dashboard">
            {!isAuthenticated ? (
              <Redirect to="/login" />
            ) : (
              <ErrorBoundary>
                <DashboardPage username={user?.username} />
              </ErrorBoundary>
            )}
          </Route>
          <Route path="/workflow">
            {!isAuthenticated ? (
              <Redirect to="/login" />
            ) : (
              <ErrorBoundary>
                <WorkflowPage username={user?.username} />
              </ErrorBoundary>
            )}
          </Route>

          {/* Fallback route */}
          <Route>
            <ErrorBoundary>
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
            </ErrorBoundary>
          </Route>
        </Switch>
        <Toaster />
      </div>
    </ErrorBoundary>
  );
}

export default App;
