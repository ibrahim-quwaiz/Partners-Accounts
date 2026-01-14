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
import { Lock, Unlock, Loader2 } from "lucide-react";
import { useApp } from "@/lib/appContext";
import { format } from "date-fns";
import { toast } from "sonner";

export default function PeriodsPage() {
  const { activeProject, periods, isLoadingPeriods: isLoading } = useApp();
  const queryClient = useQueryClient();

  const openPeriod = periods.find(p => p.status === "ACTIVE");

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
      toast.success("تم إقفال الفترة وفتح فترة جديدة تلقائياً");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const formatDate = (dateStr: string | Date | null) => {
    if (!dateStr) return "-";
    try {
      const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      return format(date, "yyyy/MM/dd");
    } catch {
      return String(dateStr);
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
        {openPeriod && (
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
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">اسم الفترة</TableHead>
                <TableHead className="text-right">تاريخ البداية</TableHead>
                <TableHead className="text-right">تاريخ النهاية</TableHead>
                <TableHead className="text-center w-[120px]">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    لا توجد فترات. سيتم إنشاء الفترة الافتتاحية تلقائياً.
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
