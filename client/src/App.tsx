import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import TransactionsPage from "@/pages/transactions";
import NotificationsPage from "@/pages/notifications";
import UsersPage from "@/pages/users";
import PeriodsPage from "@/pages/periods";
import ReportsPage from "@/pages/reports";
import EventLogPage from "@/pages/event-log";
import ProjectSelectPage from "@/pages/project-select";
import { Layout } from "@/components/layout";
import { AppProvider, useApp } from "@/lib/appContext";
import { LoginModal } from "@/components/login-modal";

function AppContent() {
  const { user, setActiveProject, projects } = useApp();
  const [projectSelected, setProjectSelected] = useState(false);

  // Show login first
  if (!user) {
    return <LoginModal />;
  }

  // Show project selection after login
  if (!projectSelected) {
    return (
      <ProjectSelectPage 
        onSelect={(projectId) => {
          const project = projects.find(p => p.id === projectId);
          if (project) {
            setActiveProject(project);
            setProjectSelected(true);
          }
        }} 
      />
    );
  }

  const handleChangeProject = () => {
    setProjectSelected(false);
  };

  // Main app with layout
  return (
    <Layout onChangeProject={handleChangeProject}>
      <Switch>
        <Route path="/" component={TransactionsPage} />
        <Route path="/periods" component={PeriodsPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/event-log" component={EventLogPage} />
        <Route path="/users" component={UsersPage} />
        
        <Route path="/settings">
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
             <div className="p-4 rounded-full bg-muted">
               <span className="text-4xl">⚙️</span>
             </div>
             <div>
               <h2 className="text-xl font-semibold">الإعدادات</h2>
               <p className="text-muted-foreground">منطقة تكوين النظام (قريباً)</p>
             </div>
          </div>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
