import { useState } from "react";
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
import { Lock, Unlock, Plus, Calendar } from "lucide-react";
import { MOCK_PERIODS } from "@/lib/appContext";
import { format } from "date-fns";

type PeriodStatus = "open" | "closed";

interface PeriodWithStatus {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: PeriodStatus;
}

export default function PeriodsPage() {
  const [periods, setPeriods] = useState<PeriodWithStatus[]>(
    MOCK_PERIODS.map((p, i) => ({
      ...p,
      status: i === 0 ? "open" : "closed",
    }))
  );

  const toggleStatus = (id: string) => {
    setPeriods(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, status: p.status === "open" ? "closed" : "open" }
          : p
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">الفترات المحاسبية</h1>
          <p className="text-muted-foreground">إدارة الفترات وحالتها (مفتوحة / مغلقة)</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          فترة جديدة
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] text-center">#</TableHead>
              <TableHead className="text-start">اسم الفترة</TableHead>
              <TableHead className="text-start">تاريخ البداية</TableHead>
              <TableHead className="text-start">تاريخ النهاية</TableHead>
              <TableHead className="text-center w-[120px]">الحالة</TableHead>
              <TableHead className="text-end w-[150px]">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {periods.map((period, index) => (
              <TableRow key={period.id}>
                <TableCell className="text-center">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                </TableCell>
                <TableCell className="font-medium">{period.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(period.startDate, "yyyy/MM/dd")}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(period.endDate, "yyyy/MM/dd")}
                </TableCell>
                <TableCell className="text-center">
                  {period.status === "open" ? (
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatus(period.id)}
                    className="gap-2"
                  >
                    {period.status === "open" ? (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        إغلاق
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3.5 w-3.5" />
                        فتح
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
