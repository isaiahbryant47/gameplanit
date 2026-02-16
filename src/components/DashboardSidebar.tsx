import { useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  Search,
  CalendarDays,
  Trophy,
  Dumbbell,
  Award,
  Heart,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { title: 'My Path', href: '/dashboard', icon: Compass },
  { title: 'Explore Careers', href: '/dashboard#explore', icon: Search },
  { title: 'My 12-Week Cycle', href: '/dashboard#cycle', icon: CalendarDays },
  { title: 'Opportunities', href: '/dashboard#opportunities', icon: Trophy },
  { title: 'Practice', href: '/dashboard#practice', icon: Dumbbell },
  { title: 'Certs & Proof', href: '/dashboard#certs', icon: Award },
  { title: 'Support', href: '/dashboard#support', icon: Heart },
];

export default function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar
      className={`border-r border-sidebar-border bg-sidebar ${collapsed ? 'w-14' : 'w-56'} transition-all duration-200`}
      collapsible="icon"
    >
      <SidebarContent className="pt-4">
        {!collapsed && (
          <div className="px-4 pb-4 border-b border-sidebar-border mb-2">
            <h2 className="text-base font-bold text-sidebar-foreground tracking-tight">
              GameplanIT
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Your Career Hub</p>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = item.href === '/dashboard'
                  ? location.pathname === '/dashboard' && (!location.hash || location.hash === '')
                  : location.pathname === '/dashboard' && location.hash === item.href.replace('/dashboard', '');

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <a
                        href={item.href}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(item.href);
                        }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                        }`}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
