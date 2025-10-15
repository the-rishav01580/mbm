import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Analytics } from "@vercel/analytics/next"

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col">
          {/* Top Navigation Bar */}
          <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-4">
              {/* Bigger sidebar trigger (mobile bigger, desktop compact) */}
              <SidebarTrigger
                aria-label="Toggle sidebar"
                className="
                  h-12 w-12 md:h-9 md:w-9
                  rounded-xl
                  border border-border
                  bg-muted/50 hover:bg-muted
                  transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                  [&_svg]:h-6 [&_svg]:w-6
                "
              />
              <div className="relative">
                <h1 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground">MBM</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pl-4 border-l border-border">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">A</span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-muted-foreground">Administrator</p>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 p-6 bg-gradient-subtle">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}