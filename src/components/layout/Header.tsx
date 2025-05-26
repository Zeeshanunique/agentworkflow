import React from "react";
import {
  Menu,
  Settings,
  User,
  LogOut,
  Save,
  Plus,
  Home,
  LayoutDashboard,
  GitBranch,
} from "lucide-react";
import { Button } from "../ui/button";
import { authApi } from "../../lib/api";
import { useToast } from "../ToastProvider";
import { Link, useLocation } from "wouter";
import { ThemeToggle } from "../ThemeToggle";
import { useWorkflowStore } from "../../hooks/useWorkflowStore";

interface HeaderProps {
  toggleSidebar?: () => void;
  onSave?: () => void;
  isAuthenticated?: boolean;
  username?: string;
}

export const Header: React.FC<HeaderProps> = ({
  toggleSidebar,
  onSave,
  isAuthenticated = false,
  username = "",
}) => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const setUser = useWorkflowStore((state) => state.setUser);
  const [activeTab, setActiveTab] = React.useState<string>("");

  React.useEffect(() => {
    // Set active tab based on current location
    const path = window.location.pathname;
    if (path.includes("/workflow")) {
      setActiveTab("workflow");
    } else if (path.includes("/dashboard")) {
      setActiveTab("dashboard");
    } else {
      setActiveTab("home");
    }
  }, []);

  const handleLogout = async () => {
    try {
      const response = await authApi.logout();
      if (!response.error) {
        // Clear user from store to update auth state
        setUser(null);

        toast({
          title: "Logged out",
          description: "You have been successfully logged out",
          type: "success",
        });

        // Redirect to home page after logout
        navigate("/", { replace: true });
      } else {
        toast({
          title: "Error",
          description: response.error,
          type: "error",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred during logout",
        type: "error",
      });
    }
  };

  return (
    <header className="bg-background border-b border-border h-16 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center">
        {toggleSidebar && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent mr-2 md:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        <div
          className="flex items-center cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="bg-primary text-primary-foreground p-1.5 rounded mr-2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 16V12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 8H12.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">AgentWorkflow</h1>
        </div>

        {/* Navigation for authenticated users */}
        {isAuthenticated && (
          <nav className="ml-8 hidden md:flex items-center space-x-1">
            <Button
              variant={activeTab === "workflow" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => navigate("/workflow")}
              className="flex items-center gap-1"
            >
              <GitBranch size={16} />
              <span>Workflow</span>
            </Button>
            <Button
              variant={activeTab === "dashboard" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1"
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </Button>
          </nav>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <ThemeToggle />

        {onSave && (
          <Button
            size="sm"
            variant="outline"
            onClick={onSave}
            className="hidden sm:flex items-center gap-1"
          >
            <Save size={16} />
            Save
          </Button>
        )}

        {!isAuthenticated && (
          <Button
            size="sm"
            variant="default"
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
        )}

        {isAuthenticated && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground hidden md:inline">
              {username}
            </span>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={16} />
            </Button>
          </div>
        )}

        <Button size="icon" variant="ghost" title="Settings">
          <Settings size={20} />
        </Button>
      </div>
    </header>
  );
};
