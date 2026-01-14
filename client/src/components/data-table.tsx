import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Transaction, useApp } from "@/lib/appContext";

interface DataTableProps {
  data: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  type: "expense" | "revenue" | "settlement";
  showPeriodColumn?: boolean;
  disableActions?: boolean;
}

export function DataTable({ 
  data, 
  onEdit, 
  onDelete, 
  type, 
  showPeriodColumn = false,
  disableActions = false 
}: DataTableProps) {
  const { getPartnerName, periods } = useApp();

  const getPeriodName = (periodId: string) => {
    return periods.find(p => p.id === periodId)?.name || periodId;
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-card/50 border-dashed">
        <p className="text-muted-foreground text-sm">لا توجد سجلات لهذه الفترة.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card overflow-x-auto" dir="rtl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px] text-right">التاريخ</TableHead>
            <TableHead className="text-right">الوصف</TableHead>
            <TableHead className="text-right w-[150px]">
              {type === "settlement" ? "من / إلى" : "بواسطة"}
            </TableHead>
            {showPeriodColumn && <TableHead className="text-right w-[120px]">الفترة</TableHead>}
            <TableHead className="text-left w-[120px]">المبلغ</TableHead>
            <TableHead className="w-[100px] text-left">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium text-muted-foreground text-right">
                {format(row.date, "yyyy/MM/dd")}
              </TableCell>
              <TableCell className="text-right">{row.description}</TableCell>
              <TableCell className="text-right">
                {type === "settlement" ? (
                  <div className="flex flex-col text-xs">
                    <span>من: {row.fromPartner ? getPartnerName(row.fromPartner) : "-"}</span>
                    <span className="text-muted-foreground">إلى: {row.toPartner ? getPartnerName(row.toPartner) : "-"}</span>
                  </div>
                ) : (
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10">
                    {row.paidBy ? getPartnerName(row.paidBy) : "-"}
                  </span>
                )}
              </TableCell>
              {showPeriodColumn && (
                <TableCell className="text-right text-muted-foreground">
                  {getPeriodName(row.periodId)}
                </TableCell>
              )}
              <TableCell className="text-left font-medium">
                {new Intl.NumberFormat("en-US", {
                  style: "decimal",
                  minimumFractionDigits: 2,
                }).format(row.amount)}
              </TableCell>
              <TableCell className="text-left">
                <div className="flex justify-start gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    onClick={() => onEdit(row)}
                    disabled={disableActions}
                  >
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">تعديل</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive disabled:opacity-30"
                    onClick={() => onDelete(row)}
                    disabled={disableActions}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">حذف</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
