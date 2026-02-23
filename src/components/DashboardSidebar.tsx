import { useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  Home,
  CalendarDays,
  Trophy,
  LineChart,
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

const homeItems = [{ title: 'Home', href: '/dashboard', icon: Home }];

const journeyItems = [
  { title: 'Discover', href: '/explore-careers', icon: Compass },
  { title: 'My Plan', href: '/cycle', icon: CalendarDays },
  { title: 'Take Action', href: '/opportunities', icon: Trophy },
  { title: 'My Proof', href: '/certs', icon: Award },
  { title: 'Progress', href: '/practice', icon: LineChart },
];

const helpItems = [{ title: 'Support', href: '/support', icon: Heart }];

export default function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const activeJourneyIndex = journeyItems.findIndex((item) => item.href === location.pathname);

  const renderNavSection = (items: typeof journeyItems, label: string, withProgressRail = false) => (
    <SidebarGroup>
      {!collapsed && (
        <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.12em] text-sidebar-foreground/50">{label}</p>
      )}
      <SidebarGroupContent>
        <SidebarMenu className={withProgressRail && !collapsed ? 'relative pl-3' : ''}>
          {withProgressRail && !collapsed && (
            <div className="pointer-events-none absolute left-0 top-1 bottom-1 w-px bg-sidebar-border" aria-hidden />
          )}
          {items.map((item, index) => {
            const isActive = location.pathname === item.href;
            const isComplete = activeJourneyIndex >= 0 && index < activeJourneyIndex;

            return (
              <SidebarMenuItem key={item.title} className="relative">
                {withProgressRail && !collapsed && (
                  <span
                    className={`absolute -left-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border ${
                      isActive
                        ? 'border-sidebar-primary bg-sidebar-primary'
                        : isComplete
                          ? 'border-sidebar-primary/50 bg-sidebar-primary/40'
                          : 'border-sidebar-border bg-sidebar'
                    }`}
                    aria-hidden
                  />
                )}
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
  );

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
        {renderNavSection(homeItems, 'HOME')}
        {renderNavSection(journeyItems, 'MY JOURNEY', true)}
        {renderNavSection(helpItems, 'HELP')}
      </SidebarContent>
    </Sidebar>
  );
}
