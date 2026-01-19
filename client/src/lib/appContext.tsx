import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";

// --- Types ---
export type Partner = "P1" | "P2";

export interface Project {
  id: string;
  name: string;
}

export interface Period {
  id: string;
  name: string; // e.g., "Jan 2025"
  startDate: Date;
  endDate: Date | null;
  status: string; // ACTIVE, CLOSED, PENDING_NAME
  p1BalanceStart?: string;
  p2BalanceStart?: string;
  p1BalanceEnd?: string | null;
  p2BalanceEnd?: string | null;
}

export interface Transaction {
  id: string;
  projectId: string;
  periodId: string;
  date: Date;
  description: string;
  amount: number;
  type: "expense" | "revenue" | "settlement";
  // For expenses/revenues
  paidBy?: Partner;
  // For settlements
  fromPartner?: Partner;
  toPartner?: Partner; // Calculated
}

export interface User {
  username: string;
  role: "admin" | "partner";
}

export interface NotificationLog {
  id: string;
  transactionName: string;
  emailSent: boolean;
  whatsappSent: boolean;
  date: Date;
}

export interface PartnerProfile {
  id: Partner;
  displayName: string;
  phone: string;
  email?: string;
  username?: string;
  role?: "ADMIN" | "TX_ONLY";
}

// --- Backward compatibility exports (deprecated, use context instead) ---
export const MOCK_PROJECTS: Project[] = [];
export const MOCK_PERIODS: Period[] = [];
export const MOCK_PARTNERS: PartnerProfile[] = [];
export const MOCK_TRANSACTIONS: Transaction[] = [];

// --- Helper Functions ---
function parseDate(dateStr: string | Date): Date {
  if (dateStr instanceof Date) return dateStr;
  return new Date(dateStr);
}

function parseTransaction(tx: any): Transaction {
  return {
    ...tx,
    date: parseDate(tx.date),
    amount: typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount,
    type: tx.type.toLowerCase() as "expense" | "revenue" | "settlement",
  };
}

function parsePeriod(period: any): Period {
  return {
    ...period,
    startDate: parseDate(period.startDate),
    endDate: period.endDate ? parseDate(period.endDate) : null,
  };
}

function parseNotification(notif: any): NotificationLog {
  return {
    id: notif.id,
    transactionName: notif.transaction?.description || "Unknown",
    emailSent: !!notif.sentEmailAt,
    whatsappSent: !!notif.sentWhatsappAt,
    date: parseDate(notif.createdAt),
  };
}

// --- Context ---
export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  phone: string;
  email: string | null;
  role: "ADMIN" | "TX_ONLY";
}

interface AppContextType {
  activeProject: Project | null;
  setActiveProject: (project: Project) => void;
  activePeriod: Period | null;
  setActivePeriod: (period: Period) => void;
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getFilteredTransactions: (type?: Transaction["type"]) => Transaction[];
  
  // Auth
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoggingIn: boolean;

  // Notifications
  notifications: NotificationLog[];
  addNotification: (txName: string) => void;

  // Partners
  partners: PartnerProfile[];
  updatePartner: (id: Partner, data: Partial<PartnerProfile>) => void;
  getPartnerName: (id: Partner) => string;

  // Loading states
  isLoadingProjects: boolean;
  isLoadingPeriods: boolean;
  isLoadingTransactions: boolean;
  isLoadingPartners: boolean;
  isLoadingNotifications: boolean;

  // Data lists
  projects: Project[];
  periods: Period[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [activeProject, setActiveProjectState] = useState<Project | null>(null);
  const [activePeriod, setActivePeriodState] = useState<Period | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // =====================================================
  // QUERIES
  // =====================================================

  // Fetch all projects (only when user is logged in)
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  // Fetch periods for active project (only when user is logged in)
  const { data: periods = [], isLoading: isLoadingPeriods } = useQuery<Period[]>({
    queryKey: ["/api/projects", activeProject?.id, "periods"],
    enabled: !!user && !!activeProject?.id,
    select: (data) => data.map(parsePeriod),
  });

  // Fetch transactions for active period (only when user is logged in)
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/periods", activePeriod?.id, "transactions"],
    enabled: !!user && !!activePeriod?.id,
    select: (data) => data.map(parseTransaction),
  });

  // Fetch partners (only when user is logged in)
  const { data: partners = [], isLoading: isLoadingPartners } = useQuery<PartnerProfile[]>({
    queryKey: ["/api/partners"],
    enabled: !!user,
  });

  // Fetch notifications (only when user is logged in)
  const { data: notificationsData = [], isLoading: isLoadingNotifications } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    select: (data) => data.map(parseNotification),
  });

  const notifications = notificationsData as NotificationLog[];

  // =====================================================
  // MUTATIONS
  // =====================================================

  // Create transaction
  const createTransactionMutation = useMutation({
    mutationFn: async (tx: Omit<Transaction, "id">) => {
      const payload = {
        projectId: tx.projectId,
        periodId: tx.periodId,
        type: tx.type.toUpperCase(),
        date: tx.date instanceof Date ? tx.date.toISOString().split('T')[0] : tx.date,
        description: tx.description,
        amount: tx.amount.toString(),
        paidBy: tx.paidBy || null,
        fromPartner: tx.fromPartner || null,
        toPartner: tx.toPartner || null,
        createdBy: user?.id || null,
      };
      const res = await apiRequest("POST", "/api/transactions", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/periods", activePeriod?.id, "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Update transaction
  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Transaction> }) => {
      const payload: any = {};
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.amount !== undefined) payload.amount = updates.amount.toString();
      if (updates.date !== undefined) {
        payload.date = updates.date instanceof Date 
          ? updates.date.toISOString().split('T')[0] 
          : updates.date;
      }
      if (updates.type !== undefined) payload.type = updates.type.toUpperCase();
      if (updates.paidBy !== undefined) payload.paidBy = updates.paidBy;
      if (updates.fromPartner !== undefined) payload.fromPartner = updates.fromPartner;
      if (updates.toPartner !== undefined) payload.toPartner = updates.toPartner;

      const res = await apiRequest("PATCH", `/api/transactions/${id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/periods", activePeriod?.id, "transactions"] });
    },
  });

  // Delete transaction
  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/periods", activePeriod?.id, "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Update partner
  const updatePartnerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: Partner; data: Partial<PartnerProfile> }) => {
      const res = await apiRequest("PATCH", `/api/partners/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
    },
  });

  // =====================================================
  // EFFECTS
  // =====================================================

  // Set initial active project when projects load
  useEffect(() => {
    if (projects.length > 0 && !activeProject) {
      setActiveProjectState(projects[0]);
    }
  }, [projects, activeProject]);

  // Set initial active period when periods load, or realign if current period is invalid or closed
  useEffect(() => {
    if (periods.length === 0) return;
    
    const firstActivePeriod = periods.find(p => p.status === "ACTIVE");
    const currentInList = activePeriod && periods.find(p => p.id === activePeriod.id);
    
    // Realign if:
    // 1. No current active period set, or current period no longer in list
    // 2. Current period is CLOSED (per fresh data) but there's an ACTIVE period available
    const currentIsClosed = currentInList?.status === "CLOSED";
    const shouldRealign = !currentInList || (currentIsClosed && firstActivePeriod);
    
    if (shouldRealign) {
      setActivePeriodState(firstActivePeriod || periods[0]);
    }
  }, [periods, activePeriod]);


  // =====================================================
  // HANDLERS
  // =====================================================

  const setActiveProject = (project: Project) => {
    setActiveProjectState(project);
    setActivePeriodState(null); // Reset period when project changes
  };

  const setActivePeriod = (period: Period) => {
    setActivePeriodState(period);
  };

  const addTransaction = (tx: Omit<Transaction, "id">) => {
    createTransactionMutation.mutate(tx);
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    updateTransactionMutation.mutate({ id, updates });
  };

  const deleteTransaction = (id: string) => {
    deleteTransactionMutation.mutate(id);
  };

  const getFilteredTransactions = (type?: Transaction["type"]) => {
    return transactions.filter((tx) => {
      const matchType = type ? tx.type === type : true;
      return matchType;
    });
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoggingIn(true);
    try {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      const data = await res.json();
      
      if (res.ok && data.user) {
        setUser({
          id: data.user.id,
          username: data.user.username,
          displayName: data.user.displayName,
          phone: data.user.phone || "",
          email: data.user.email,
          role: data.user.role,
        });
        return { success: true };
      } else {
        return { success: false, error: data.error || "فشل تسجيل الدخول" };
      }
    } catch (error: any) {
      return { success: false, error: error.message || "حدث خطأ أثناء تسجيل الدخول" };
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
  };

  const updatePartner = (id: Partner, data: Partial<PartnerProfile>) => {
    updatePartnerMutation.mutate({ id, data });
  };

  const getPartnerName = (id: Partner) => {
    return partners.find(p => p.id === id)?.displayName || id;
  };

  const addNotification = (txName: string) => {
    // Notifications are now auto-created by the backend when transactions are created
    // This is kept for compatibility but doesn't need to do anything
  };

  return (
    <AppContext.Provider
      value={{
        activeProject,
        setActiveProject,
        activePeriod,
        setActivePeriod,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        getFilteredTransactions,
        user,
        setUser,
        login,
        logout,
        isLoggingIn,
        notifications,
        addNotification,
        partners,
        updatePartner,
        getPartnerName,
        isLoadingProjects,
        isLoadingPeriods,
        isLoadingTransactions,
        isLoadingPartners,
        isLoadingNotifications,
        projects,
        periods,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
