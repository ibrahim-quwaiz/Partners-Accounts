import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Lock, Unlock, Plus, Loader2, AlertCircle } from "lucide-react";
import { useApp } from "@/lib/appContext";
import { format } from "date-fns";
import { toast } from "sonner";

interface Period {
  id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string | null;
  status: "ACTIVE" | "CLOSED";
  p1BalanceStart: string;
  p2BalanceStart: string;
  p1BalanceEnd: string | null;
  p2BalanceEnd: string | null;
  openedAt: string;
  closedAt: string | null;
}

export default function PeriodsPage() {
  const { activeProject } = useApp();
  const queryClient = useQueryClient();

  const { data: periods = [], isLoading } = useQuery<Period[]>({
    queryKey: ["periods", activeProject?.id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${activeProject?.id}/periods`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("فشل في جلب الفترات");
      return res.json();
    },
    enabled: !!activeProject?.id,
  });

  const openPeriodMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${activeProject?.id}/periods/open`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "فشل في فتح فترة جديدة");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periods", activeProject?.id] });
      toast.success("تم فتح فترة جديدة بنجاح");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const closePeriodMutation = useMutation({
    mutationFn: async (periodId: string) => {
      const res = await fetch(`/api/periods/${periodId}/close`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "فشل في إغلاق الفترة");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periods", activeProject?.id] });
      toast.success("تم إغلاق الفترة بنجاح");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "yyyy/MM/dd");
    } catch {
      return dateStr;
    }
  };

  const hasOpenPeriod = periods.some(p => p.status === "ACTIVE");

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
          <p className="text-muted-foreground">إدارة الفترات وحالتها (مفتوحة / مغلقة)</p>
        </div>
        <Button 
          className="gap-2" 
          onClick={() => openPeriodMutation.mutate()}
          disabled={openPeriodMutation.isPending || hasOpenPeriod}
        >
          {openPeriodMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          فتح فترة جديدة
        </Button>
      </div>

      {hasOpenPeriod && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">يوجد فترة مفتوحة. أغلقها قبل فتح فترة جديدة.</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">اسم الفترة</TableHead>
                <TableHead className="text-right">تاريخ البداية</TableHead>
                <TableHead className="text-right">تاريخ النهاية</TableHead>
                <TableHead className="text-center w-[120px]">الحالة</TableHead>
                <TableHead className="text-end w-[150px]">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    لا توجد فترات. اضغط "فتح فترة جديدة" للبدء.
                  </TableCell>
                </TableRow>
              ) : (
                periods.map(period => (
                  <TableRow key={period.id} data-testid={`period-row-${period.id}`}>
                    <TableCell className="font-medium">{period.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(period.startDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(period.endDate)}
                    </TableCell>
                    <TableCell className="text-center">
                      {period.status === "ACTIVE" ? (
                        <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                          <Unlock className="h-3 w-3 me-1" />
                          مفتوحة
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground">
                          <Lock className="h-3 w-3 me-1" />
                          مغلقة
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-end">
                      {period.status === "ACTIVE" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => closePeriodMutation.mutate(period.id)}
                          disabled={closePeriodMutation.isPending}
                          className="gap-2"
                          data-testid={`close-period-${period.id}`}
                        >
                          {closePeriodMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Lock className="h-3.5 w-3.5" />
                          )}
                          إغلاق الفترة
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
