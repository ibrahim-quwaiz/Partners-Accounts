import React, { createContext, useContext, useState, ReactNode } from "react";
import { format } from "date-fns";

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
  endDate: Date;
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

// --- Mock Data ---
export const MOCK_PROJECTS: Project[] = [
  { id: "proj_01", name: "Alpha Tower Construction" },
  { id: "proj_02", name: "Beta Market Renovation" },
];

export const MOCK_PERIODS: Period[] = [
  { id: "per_01", name: "January 2025", startDate: new Date(2025, 0, 1), endDate: new Date(2025, 0, 31) },
  { id: "per_02", name: "February 2025", startDate: new Date(2025, 1, 1), endDate: new Date(2025, 1, 28) },
  { id: "per_03", name: "March 2025", startDate: new Date(2025, 2, 1), endDate: new Date(2025, 2, 31) },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "tx_01",
    projectId: "proj_01",
    periodId: "per_01",
    date: new Date(2025, 0, 5),
    description: "Cement Bags (50x)",
    amount: 1200,
    type: "expense",
    paidBy: "P1",
  },
  {
    id: "tx_02",
    projectId: "proj_01",
    periodId: "per_01",
    date: new Date(2025, 0, 8),
    description: "Client Advance Payment",
    amount: 5000,
    type: "revenue",
    paidBy: "P2", // Received by P2
  },
  {
    id: "tx_03",
    projectId: "proj_01",
    periodId: "per_01",
    date: new Date(2025, 0, 15),
    description: "Partial Settlement",
    amount: 500,
    type: "settlement",
    fromPartner: "P1",
    toPartner: "P2",
  },
  {
    id: "tx_04",
    projectId: "proj_02",
    periodId: "per_01",
    date: new Date(2025, 0, 10),
    description: "Paint Supplies",
    amount: 300,
    type: "expense",
    paidBy: "P2",
  },
];

// --- Context ---
interface AppContextType {
  activeProject: Project;
  setActiveProject: (project: Project) => void;
  activePeriod: Period;
  setActivePeriod: (period: Period) => void;
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getFilteredTransactions: (type?: Transaction["type"]) => Transaction[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeProject, setActiveProject] = useState<Project>(MOCK_PROJECTS[0]);
  const [activePeriod, setActivePeriod] = useState<Period>(MOCK_PERIODS[0]);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);

  const addTransaction = (tx: Omit<Transaction, "id">) => {
    const newTx = { ...tx, id: `tx_${Date.now()}` };
    setTransactions((prev) => [...prev, newTx]);
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx))
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  const getFilteredTransactions = (type?: Transaction["type"]) => {
    return transactions.filter((tx) => {
      const matchProject = tx.projectId === activeProject.id;
      const matchPeriod = tx.periodId === activePeriod.id;
      const matchType = type ? tx.type === type : true;
      return matchProject && matchPeriod && matchType;
    });
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
