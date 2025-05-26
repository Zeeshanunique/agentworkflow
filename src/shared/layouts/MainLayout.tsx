import { ReactNode } from 'react';
import Header from '../../components/Header';

type MainLayoutProps = {
  children: ReactNode;
  isAuthenticated?: boolean;
  username?: string;
};

export default function MainLayout({ children, isAuthenticated, username }: MainLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header isAuthenticated={isAuthenticated} username={username} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
} 