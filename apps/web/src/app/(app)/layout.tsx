import { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  // TODO: Add auth guard, navigation shell
  return (
    <div className="min-h-screen bg-background">
      {/* TODO: Add AppTopBar */}
      <div className="flex">
        {/* TODO: Add SidebarNav */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
