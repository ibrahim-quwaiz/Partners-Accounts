import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
  }

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
          <TabsTrigger value="expense">المصروفات</TabsTrigger>
          <TabsTrigger value="revenue">الإيرادات</TabsTrigger>
          <TabsTrigger value="settlement">التسويات</TabsTrigger>
        </TabsList>

        <TabsContent value="expense" className="mt-6">
          <DataTable 
            data={expenses} 
            type="expense" 
            onEdit={handleEdit} 
            onDelete={handleDeleteClick} 
          />
        </TabsContent>

        <TabsContent value="revenue" className="mt-6">
          <DataTable 
            data={revenues} 
            type="revenue" 
            onEdit={handleEdit} 
            onDelete={handleDeleteClick} 
          />
        </TabsContent>

        <TabsContent value="settlement" className="mt-6">
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
