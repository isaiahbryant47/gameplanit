import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import DashboardSidebar from '@/components/DashboardSidebar';
import { LogOut, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export default function DashboardLayout({ title, children, actions }: Props) {
  const { logout } = useAuth();
  const nav = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <main className="flex-1 min-w-0">
          <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-sm">
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-muted-foreground" />
                <h1 className="text-sm font-medium text-muted-foreground hidden sm:block">{title}</h1>
              </div>
              <div className="flex items-center gap-2">
                {actions}
                <button
                  onClick={() => { logout(); nav('/'); }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
