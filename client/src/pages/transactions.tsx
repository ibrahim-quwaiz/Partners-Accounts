import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, TrendingUp, TrendingDown, ArrowLeftRight, Hash, Coins } from "lucide-react";
import { useApp, Transaction } from "@/lib/appContext";
import { DataTable } from "@/components/data-table";
import { TransactionModal } from "@/components/transaction-modal";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";

export default function TransactionsPage() {
  const { getFilteredTransactions, deleteTransaction } = useApp();
  const [activeTab, setActiveTab] = useState<"expense" | "revenue" | "settlement">("expense");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  
  // Delete Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  const handleAdd = () => {
    setEditingTx(null);
    setIsModalOpen(true);
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (tx: Transaction) => {
    setTxToDelete(tx);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (txToDelete) {
      deleteTransaction(txToDelete.id);
      setIsDeleteDialogOpen(false);
      setTxToDelete(null);
    }
  };

  const expenses = getFilteredTransactions("expense");
  const revenues = getFilteredTransactions("revenue");
  const settlements = getFilteredTransactions("settlement");

  const getAddButtonText = () => {
    switch (activeTab) {
      case "settlement": return "إضافة تسوية";
      case "revenue": return "إضافة إيراد";
      default: return "إضافة مصروف";
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case "revenue": return revenues;
      case "settlement": return settlements;
      default: return expenses;
    }
  };

  const getSummary = (data: Transaction[]) => ({
    count: data.length,
    total: data.reduce((sum, tx) => sum + tx.amount, 0),
  });

  const currentData = getCurrentData();
  const summary = getSummary(currentData);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">المعاملات</h1>
          <p className="text-muted-foreground">إدارة المصروفات، الإيرادات، والتسويات للفترة المحددة.</p>
        </div>
        <Button onClick={handleAdd} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          {getAddButtonText()}
        </Button>
      </div>

      <Tabs 
        defaultValue="expense" 
        value={activeTab} 
        onValueChange={(val) => setActiveTab(val as any)} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="expense" className="gap-2">
            <TrendingDown className="h-4 w-4 hidden sm:block" />
            مصروفات
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <TrendingUp className="h-4 w-4 hidden sm:block" />
            إيرادات
          </TabsTrigger>
          <TabsTrigger value="settlement" className="gap-2">
            <ArrowLeftRight className="h-4 w-4 hidden sm:block" />
            تسويات
          </TabsTrigger>
        </TabsList>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Hash className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">عدد العمليات</p>
                <p className="text-xl font-bold">{summary.count}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                activeTab === "revenue" ? "bg-green-500/10" : activeTab === "expense" ? "bg-red-500/10" : "bg-blue-500/10"
              }`}>
                <Coins className={`h-5 w-5 ${
                  activeTab === "revenue" ? "text-green-600" : activeTab === "expense" ? "text-red-600" : "text-blue-600"
                }`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الإجمالي</p>
                <p className={`text-xl font-bold ${
                  activeTab === "revenue" ? "text-green-600" : activeTab === "expense" ? "text-red-600" : "text-foreground"
                }`}>
                  {summary.total.toLocaleString()} ر.س
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <TabsContent value="expense" className="mt-4">
          <DataTable 
            data={expenses} 
            type="expense" 
            onEdit={handleEdit} 
            onDelete={handleDeleteClick} 
          />
        </TabsContent>

        <TabsContent value="revenue" className="mt-4">
          <DataTable 
            data={revenues} 
            type="revenue" 
            onEdit={handleEdit} 
            onDelete={handleDeleteClick} 
          />
        </TabsContent>

        <TabsContent value="settlement" className="mt-4">
          <DataTable 
            data={settlements} 
            type="settlement" 
            onEdit={handleEdit} 
            onDelete={handleDeleteClick} 
          />
        </TabsContent>
      </Tabs>

      <TransactionModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        type={activeTab}
        initialData={editingTx}
      />

      <ConfirmDeleteDialog 
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
