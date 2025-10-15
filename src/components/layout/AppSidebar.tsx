import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  IndianRupeeIcon,
  GraduationCap,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Registration", url: "/registration", icon: UserPlus },
  { title: "Student Profiles", url: "/profiles", icon: Users },
  { title: "Fees Due", url: "/fees-due", icon: IndianRupeeIcon },
];

export function AppSidebar() {
  const sidebar = useSidebar() as any;
  const { state } = sidebar;
  const location = useLocation();
  const { signOut, user } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  // Auto-close on mobile
  const closeSidebarOnMobile = () => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      sidebar?.setOpenMobile?.(false);
      sidebar?.setOpen?.(false);
      if (!sidebar?.setOpenMobile && !sidebar?.setOpen && typeof sidebar?.toggleSidebar === "function") {
        sidebar.toggleSidebar();
      }
    }
  };

  // Close on route change (mobile)
  useEffect(() => {
    closeSidebarOnMobile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    closeSidebarOnMobile();
  };

  const isActive = (path: string) => currentPath === path;

  // Bigger comfy buttons on mobile; compact on desktop
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      // Mobile
      "group flex items-center gap-3 rounded-xl h-12 px-4 text-base font-medium active:scale-[.98] transition-all duration-200",
      // Desktop override
      "md:h-9 md:px-3 md:text-sm",
      isActive
        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md ring-1 ring-sidebar-primary/30"
        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    );

  return (
    // Mobile par width hammesha w-64 rakhenge (text visible), desktop par collapse work karega
    <Sidebar className={cn(collapsed ? "md:w-16 w-64" : "w-64")} collapsible="icon">
      <SidebarContent className="bg-sidebar border-r border-sidebar-border">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-6 border-b border-sidebar-border">
          <div className="w-9 h-9 bg-gradient-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {/* Text: mobile par kabhi hide nahi, desktop par collapse hone par hide */}
          <div className={cn(collapsed && "md:hidden")}>
            <h1 className="font-bold text-sidebar-foreground">Mess Manager</h1>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>

        <SidebarGroup className="px-4 py-4">
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider mb-4">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={getNavCls}
                      onClick={closeSidebarOnMobile}
                      title={collapsed ? item.title : undefined}
                    >
                      <item.icon className="w-6 h-6 shrink-0 md:w-5 md:h-5" />
                      {/* Text: mobile par visible even if collapsed; desktop par collapse pe hide */}
                      <span className={cn("ml-1", collapsed && "md:hidden")}>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Info */}
        <div className="mt-auto px-4 py-4 border-t border-sidebar-border space-y-4">
          {/* Text: mobile par visible even if collapsed; desktop par collapse pe hide */}
          <div className={cn("flex items-center gap-3", collapsed && "md:hidden")}>
            <div className="w-9 h-9 bg-gradient-primary rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.email?.charAt(0).toUpperCase() || "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">Admin User</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || "admin@messmanager.com"}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className={cn(
              // Mobile: bigger touch target + left aligned
              "w-full justify-start gap-2 text-muted-foreground hover:text-foreground rounded-xl h-12 text-base",
              // Desktop: compact
              "md:h-9 md:text-sm",
              // Desktop collapsed me center, mobile par nahi
              collapsed && "md:justify-center"
            )}
            title={collapsed ? "Sign Out" : undefined}
          >
            <LogOut className="h-5 w-5 md:h-4 md:w-4" />
            <span className={cn(collapsed && "md:hidden")}>Sign Out</span>
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}