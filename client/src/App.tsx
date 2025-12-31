import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import TransactionsPage from "@/pages/transactions";
import { Layout } from "@/components/layout";
import { AppProvider } from "@/lib/appContext";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={TransactionsPage} />
        {/* Placeholders for other routes */}
        <Route path="/reports">
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
             <div className="p-4 rounded-full bg-muted">
               <span className="text-4xl">📊</span>
             </div>
             <div>
               <h2 className="text-xl font-semibold">التقارير (قريباً)</h2>
               <p className="text-muted-foreground">هذه الوحدة قيد التطوير.</p>
             </div>
          </div>
        </Route>
        <Route path="/notifications">
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
             <div className="p-4 rounded-full bg-muted">
               <span className="text-4xl">🔔</span>
             </div>
             <div>
               <h2 className="text-xl font-semibold">لا توجد إشعارات</h2>
               <p className="text-muted-foreground">سيتم إضافة الإشعارات لاحقًا</p>
             </div>
          </div>
        </Route>
         <Route path="/settings">
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
             <div className="p-4 rounded-full bg-muted">
               <span className="text-4xl">⚙️</span>
             </div>
             <div>
               <h2 className="text-xl font-semibold">الإعدادات</h2>
               <p className="text-muted-foreground">منطقة تكوين النظام.</p>
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
          <Router />
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
