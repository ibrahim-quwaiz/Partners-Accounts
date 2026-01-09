import { Link, useLocation } from "wouter";
import { ProjectSelector, PeriodSelector } from "./selectors";
import { LayoutDashboard, FileText, Settings, Bell, Briefcase, Users, CalendarDays, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/appContext";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout, activeProject } = useApp();

  const navItems = [
    { label: "المعاملات", icon: LayoutDashboard, href: "/" },
    { label: "الفترات", icon: CalendarDays, href: "/periods" },
    { label: "التقارير", icon: FileText, href: "/reports" },
    { label: "الإشعارات", icon: Bell, href: "/notifications" },
    { label: "المستخدمين", icon: Users, href: "/users" },
    { label: "الإعدادات", icon: Settings, href: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-sidebar border-e border-sidebar-border flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <Briefcase className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">دفتر الشركاء</span>
        </div>

        <div className="p-4 space-y-6 flex-1">
           {/* Current Project Badge */}
           <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
             <p className="text-xs text-muted-foreground mb-1">المشروع الحالي</p>
             <p className="font-medium text-sm truncate">{activeProject.name}</p>
           </div>

           <nav className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-10",
                    location === item.href 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
           </nav>
        </div>
        
        <div className="p-4 border-t border-sidebar-border space-y-3">
          <div className="flex items-center gap-3">
             <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                <span className="text-xs font-semibold">{user?.username?.charAt(0).toUpperCase() || "؟"}</span>
             </div>
             <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium truncate">{user?.username || "زائر"}</span>
                <span className="text-xs text-muted-foreground">
                  {user?.role === "admin" ? "مدير النظام" : "مستخدم"}
                </span>
             </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 border-b bg-background px-6 flex items-center justify-between sticky top-0 z-10">
           <div className="flex items-center gap-6">
              <ProjectSelector />
              <div className="h-8 w-px bg-border hidden sm:block"></div>
              <PeriodSelector />
           </div>
           
           <div className="flex items-center gap-3">
             {/* Right side header actions if any */}
           </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 md:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
