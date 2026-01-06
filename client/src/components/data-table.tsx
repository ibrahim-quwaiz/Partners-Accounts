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
}

export function DataTable({ data, onEdit, onDelete, type }: DataTableProps) {
  const { getPartnerName } = useApp();

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-card/50 border-dashed">
        <p className="text-muted-foreground text-sm">لا توجد سجلات لهذه الفترة.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px] text-start">التاريخ</TableHead>
            <TableHead className="text-start">الوصف</TableHead>
            <TableHead className="text-end">المبلغ</TableHead>
            <TableHead className="w-[150px] text-start">
              {type === "settlement" ? "من / إلى" : "بواسطة"}
            </TableHead>
            <TableHead className="w-[100px] text-end">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium text-muted-foreground">
                {format(row.date, "yyyy/MM/dd")}
              </TableCell>
              <TableCell>{row.description}</TableCell>
              <TableCell className="text-end font-medium">
                {new Intl.NumberFormat("en-US", {
                  style: "decimal",
                  minimumFractionDigits: 2,
                }).format(row.amount)}
              </TableCell>
              <TableCell>
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
              <TableCell className="text-end">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => onEdit(row)}
                  >
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">تعديل</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(row)}
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
