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
import { Transaction } from "@/lib/appContext";

interface DataTableProps {
  data: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  type: "expense" | "revenue" | "settlement";
}

export function DataTable({ data, onEdit, onDelete, type }: DataTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-card/50 border-dashed">
        <p className="text-muted-foreground text-sm">No records found for this period.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-end">Amount</TableHead>
            <TableHead className="w-[150px]">
              {type === "settlement" ? "From / To" : "Paid By"}
            </TableHead>
            <TableHead className="w-[100px] text-end">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium text-muted-foreground">
                {format(row.date, "MMM dd, yyyy")}
              </TableCell>
              <TableCell>{row.description}</TableCell>
              <TableCell className="text-end font-medium">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(row.amount)}
              </TableCell>
              <TableCell>
                {type === "settlement" ? (
                  <div className="flex flex-col text-xs">
                    <span>From: {row.fromPartner === "P1" ? "Partner 1" : "Partner 2"}</span>
                    <span className="text-muted-foreground">To: {row.toPartner === "P1" ? "Partner 1" : "Partner 2"}</span>
                  </div>
                ) : (
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10">
                    {row.paidBy === "P1" ? "Partner 1" : "Partner 2"}
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
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(row)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
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
