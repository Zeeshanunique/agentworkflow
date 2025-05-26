import { useState, useEffect } from "react";
import { MainLayout } from "../../components/layout";

interface DashboardPageProps {
  isAuthenticated?: boolean;
  username?: string;
}

export default function DashboardPage({
  isAuthenticated,
  username,
}: DashboardPageProps) {
  const [workflowStats, setWorkflowStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: 0,
  });

  useEffect(() => {
    // This would typically fetch data from an API
    // For now, just setting some dummy data
    setWorkflowStats({
      total: 12,
      completed: 8,
      failed: 2,
      inProgress: 2,
    });
  }, []);

  return (
    <MainLayout username={username}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card p-4 rounded-lg shadow">
            <h2 className="text-lg font-medium text-muted-foreground">
              Total Workflows
            </h2>
            <p className="text-3xl font-bold">{workflowStats.total}</p>
          </div>
          <div className="bg-card p-4 rounded-lg shadow">
            <h2 className="text-lg font-medium text-muted-foreground">
              Completed
            </h2>
            <p className="text-3xl font-bold text-green-500">
              {workflowStats.completed}
            </p>
          </div>
          <div className="bg-card p-4 rounded-lg shadow">
            <h2 className="text-lg font-medium text-muted-foreground">
              Failed
            </h2>
            <p className="text-3xl font-bold text-red-500">
              {workflowStats.failed}
            </p>
          </div>
          <div className="bg-card p-4 rounded-lg shadow">
            <h2 className="text-lg font-medium text-muted-foreground">
              In Progress
            </h2>
            <p className="text-3xl font-bold text-blue-500">
              {workflowStats.inProgress}
            </p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">Recent Workflows</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Created</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">Data Processing</td>
                  <td className="py-2">Today, 2:30 PM</td>
                  <td className="py-2">
                    <span className="text-green-500">Completed</span>
                  </td>
                  <td className="py-2">
                    <button className="text-blue-500 hover:underline">
                      View
                    </button>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Image Recognition</td>
                  <td className="py-2">Today, 1:15 PM</td>
                  <td className="py-2">
                    <span className="text-blue-500">Running</span>
                  </td>
                  <td className="py-2">
                    <button className="text-blue-500 hover:underline">
                      View
                    </button>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Text Analysis</td>
                  <td className="py-2">Yesterday, 5:45 PM</td>
                  <td className="py-2">
                    <span className="text-red-500">Failed</span>
                  </td>
                  <td className="py-2">
                    <button className="text-blue-500 hover:underline">
                      View
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
