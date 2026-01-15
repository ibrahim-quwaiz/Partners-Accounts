import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock, Unlock, Loader2, Clock, Wallet } from "lucide-react";
import { useApp } from "@/lib/appContext";
import { format } from "date-fns";
import { toast } from "sonner";

export default function PeriodsPage() {
  const { activeProject, periods, isLoadingPeriods: isLoading, partners, getPartnerName } = useApp();
  const queryClient = useQueryClient();
  
  const [namingModalOpen, setNamingModalOpen] = useState(false);
  const [newPeriodId, setNewPeriodId] = useState<string | null>(null);
  const [periodName, setPeriodName] = useState("");

  const openPeriod = periods.find(p => p.status === "ACTIVE");
  const pendingNamePeriod = periods.find(p => p.status === "PENDING_NAME");

  useEffect(() => {
    if (pendingNamePeriod) {
      setNewPeriodId(pendingNamePeriod.id);
      setNamingModalOpen(true);
    }
  }, [pendingNamePeriod]);

  const closePeriodMutation = useMutation({
    mutationFn: async (periodId: string) => {
      const res = await fetch(`/api/periods/${periodId}/close`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "فشل في إقفال الفترة");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", activeProject?.id, "periods"] });
      toast.success("تم إقفال الفترة بنجاح");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const namePeriodMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await fetch(`/api/periods/${id}/name`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "فشل في تسمية الفترة");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", activeProject?.id, "periods"] });
      toast.success("تم فتح الفترة الجديدة بنجاح");
      setNamingModalOpen(false);
      setPeriodName("");
      setNewPeriodId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleNameSubmit = () => {
    if (!newPeriodId || !periodName.trim()) return;
    namePeriodMutation.mutate({ id: newPeriodId, name: periodName.trim() });
  };

  const formatDate = (dateStr: string | Date | null) => {
    if (!dateStr) return "-";
    try {
      const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      return format(date, "yyyy/MM/dd");
    } catch {
      return String(dateStr);
    }
  };

  const formatBalance = (balance: string | null | undefined) => {
    if (balance === null || balance === undefined) return "-";
    const num = parseFloat(balance);
    return num.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ر.س";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
            <Unlock className="h-3 w-3 me-1" />
            مفتوحة
          </Badge>
        );
      case "PENDING_NAME":
        return (
          <Badge variant="default" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20">
            <Clock className="h-3 w-3 me-1" />
            بانتظار التسمية
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            <Lock className="h-3 w-3 me-1" />
            مغلقة
          </Badge>
        );
    }
  };

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        يرجى اختيار مشروع أولاً
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">الفترات المحاسبية</h1>
          <p className="text-muted-foreground">إدارة الفترات وحالتها</p>
        </div>
        {openPeriod && !pendingNamePeriod && (
          <Button 
            variant="destructive"
            className="gap-2" 
            onClick={() => closePeriodMutation.mutate(openPeriod.id)}
            disabled={closePeriodMutation.isPending}
            data-testid="btn-close-period"
          >
            {closePeriodMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            إقفال الفترة الحالية
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-md border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">اسم الفترة</TableHead>
                <TableHead className="text-right">تاريخ البداية</TableHead>
                <TableHead className="text-right">تاريخ النهاية</TableHead>
                <TableHead className="text-right">رصيد افتتاحي ({getPartnerName("P1")})</TableHead>
                <TableHead className="text-right">رصيد افتتاحي ({getPartnerName("P2")})</TableHead>
                <TableHead className="text-right">رصيد نهائي ({getPartnerName("P1")})</TableHead>
                <TableHead className="text-right">رصيد نهائي ({getPartnerName("P2")})</TableHead>
                <TableHead className="text-center w-[140px]">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    لا توجد فترات. سيتم إنشاء الفترة الافتتاحية تلقائياً.
                  </TableCell>
                </TableRow>
              ) : (
                periods.map(period => (
                  <TableRow key={period.id} data-testid={`period-row-${period.id}`}>
                    <TableCell className="font-medium">
                      {period.name || <span className="text-muted-foreground italic">بدون اسم</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(period.startDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(period.endDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {formatBalance(period.p1BalanceStart)}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {formatBalance(period.p2BalanceStart)}
                    </TableCell>
                    <TableCell className={`font-mono text-sm ${period.status === 'CLOSED' ? 'font-medium' : 'text-muted-foreground'}`}>
                      {formatBalance(period.p1BalanceEnd)}
                    </TableCell>
                    <TableCell className={`font-mono text-sm ${period.status === 'CLOSED' ? 'font-medium' : 'text-muted-foreground'}`}>
                      {formatBalance(period.p2BalanceEnd)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(period.status)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={namingModalOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              تسمية الفترة الجديدة
            </DialogTitle>
            <DialogDescription>
              تم إقفال الفترة السابقة بنجاح. الرجاء إدخال اسم للفترة الجديدة للمتابعة.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="مثال: فترة يناير 2025"
              value={periodName}
              onChange={(e) => setPeriodName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && periodName.trim()) {
                  handleNameSubmit();
                }
              }}
              data-testid="input-period-name"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleNameSubmit}
              disabled={!periodName.trim() || namePeriodMutation.isPending}
              data-testid="btn-confirm-period-name"
            >
              {namePeriodMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              ) : null}
              فتح الفترة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
