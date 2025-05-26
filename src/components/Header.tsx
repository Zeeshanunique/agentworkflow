import React from "react";
import { Menu, Settings, User, LogOut, Save, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { authApi } from "../lib/api";
import { useToast } from "./ToastProvider";
import { Link } from "wouter";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  toggleSidebar?: () => void;
  onSave?: () => void;
  isAuthenticated?: boolean;
  username?: string;
}

const Header: React.FC<HeaderProps> = ({
  toggleSidebar,
  onSave,
  isAuthenticated = false,
  username = "",
}) => {
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const response = await authApi.logout();
      if (!response.error) {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out",
          type: "success",
        });
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
        <div className="flex items-center">
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
          <Button asChild size="sm" variant="default">
            <Link href="/login">Login</Link>
          </Button>
        )}

        {isAuthenticated && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground hidden md:inline">
              {username}
            </span>
            <Button size="icon" variant="ghost" onClick={handleLogout}>
              <LogOut size={16} />
            </Button>
          </div>
        )}

        <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent">
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
