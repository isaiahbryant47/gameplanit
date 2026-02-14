import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const pages = [
  { path: '/', label: 'Home' },
  { path: '/login', label: 'Login' },
  { path: '/onboarding', label: 'Onboarding' },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/partner', label: 'Partner' },
];

export default function PageNav() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const idx = pages.findIndex(p => p.path === pathname);
  const prev = idx > 0 ? pages[idx - 1] : null;
  const next = idx < pages.length - 1 ? pages[idx + 1] : null;

  return (
    <div className="fixed bottom-4 left-4 z-10 flex items-center gap-1">
      {prev && (
        <button
          onClick={() => nav(prev.path)}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary transition-colors shadow-sm"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          {prev.label}
        </button>
      )}
      {next && (
        <button
          onClick={() => nav(next.path)}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary transition-colors shadow-sm"
        >
          {next.label}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
