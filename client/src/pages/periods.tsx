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
import { Lock, Unlock, RotateCcw, Loader2 } from "lucide-react";
import { useApp } from "@/lib/appContext";
import { format } from "date-fns";
import { toast } from "sonner";

export default function PeriodsPage() {
  const { activeProject, periods, isLoadingPeriods: isLoading } = useApp();
  const queryClient = useQueryClient();

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${activeProject?.id}/periods/reset`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "فشل في تهيئة الفترة الافتتاحية");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", activeProject?.id, "periods"] });
      toast.success("تم تهيئة الفترة الافتتاحية بنجاح");
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
        <Button 
          className="gap-2" 
          onClick={() => resetMutation.mutate()}
          disabled={resetMutation.isPending}
          data-testid="btn-reset-period"
        >
          {resetMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          تهيئة الفترة الافتتاحية
        </Button>
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
                    لا توجد فترات. اضغط "تهيئة الفترة الافتتاحية" للبدء.
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
