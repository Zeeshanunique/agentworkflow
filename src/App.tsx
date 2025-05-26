import { useEffect } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { useWorkflowStore } from './hooks/useWorkflowStore';
import { LoginPage, WorkflowPage, DashboardPage } from './pages';

function App() {
  const user = useWorkflowStore((state) => state.user);
  const isAuthenticated = useWorkflowStore((state) => state.isAuthenticated);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isAuthenticated && window.location.pathname !== '/login') {
      navigate('/login', { replace: true });
    } else if (isAuthenticated && window.location.pathname === '/login') {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? null : <LoginPage />}
      </Route>
      <Route path="/dashboard">
        {!isAuthenticated ? null : (
          <DashboardPage isAuthenticated={isAuthenticated} username={user?.username} />
        )}
      </Route>
      <Route path="/">
        {!isAuthenticated ? null : (
          <WorkflowPage isAuthenticated={isAuthenticated} username={user?.username} />
        )}
      </Route>
    </Switch>
  );
}

export default App;
