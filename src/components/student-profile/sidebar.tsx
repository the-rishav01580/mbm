import {
  LayoutDashboard,
  UserPlus,
  GraduationCap,
  CreditCard,
  Settings,
  LogOut,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Registration", icon: UserPlus },
  { label: "Student Profiles", icon: GraduationCap, active: true },
  { label: "Fees Due", icon: CreditCard },
  { label: "Settings", icon: Settings },
];

export function StudentSidebar() {
  return (
    <aside className="hidden shrink-0 border-r border-sidebar-border bg-sidebar px-6 py-8 text-sidebar-foreground lg:flex lg:w-72 lg:flex-col lg:justify-between">
      <div className="space-y-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-sidebar-foreground/60">
            Mess Manager
          </p>
          <h1 className="mt-2 text-2xl font-bold text-sidebar-foreground">
            Admin Panel
          </h1>
        </div>

        <nav className="space-y-1">
          {navItems.map(({ label, icon: Icon, active }) => (
            <button
              key={label}
              type="button"
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent px-3 py-4 text-sm text-sidebar-accent-foreground">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-lg font-semibold">
          R
        </div>
        <div className="flex-1">
          <p className="font-semibold">Admin User</p>
          <p className="truncate text-xs opacity-80">rishavgarg01580@gmail.com</p>
        </div>
        <button
          type="button"
          className="rounded-md p-2 text-sidebar-accent-foreground/70 transition hover:bg-sidebar-accent-foreground/10"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
