import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp, Transaction } from "@/lib/appContext";
import { format } from "date-fns";

const transactionSchema = z.object({
  description: z.string().min(2, "Description is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  paidBy: z.enum(["P1", "P2"]).optional(),
  fromPartner: z.enum(["P1", "P2"]).optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "expense" | "revenue" | "settlement";
  initialData?: Transaction | null;
}

export function TransactionModal({
  open,
  onOpenChange,
  type,
  initialData,
}: TransactionModalProps) {
  const { addTransaction, updateTransaction, activeProject, activePeriod } =
    useApp();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: "",
      amount: 0,
      date: format(new Date(), "yyyy-MM-dd"),
      paidBy: "P1",
      fromPartner: "P1",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        description: initialData.description,
        amount: initialData.amount,
        date: format(initialData.date, "yyyy-MM-dd"),
        paidBy: initialData.paidBy || "P1",
        fromPartner: initialData.fromPartner || "P1",
      });
    } else {
      form.reset({
        description: "",
        amount: 0,
        date: format(new Date(), "yyyy-MM-dd"),
        paidBy: "P1",
        fromPartner: "P1",
      });
    }
  }, [initialData, open, form]);

  const onSubmit = (data: TransactionFormValues) => {
    const txData: any = {
      projectId: activeProject.id,
      periodId: activePeriod.id,
      date: new Date(data.date),
      description: data.description,
      amount: data.amount,
      type: type,
    };

    if (type === "expense" || type === "revenue") {
      txData.paidBy = data.paidBy;
    } else if (type === "settlement") {
      txData.fromPartner = data.fromPartner;
      txData.toPartner = data.fromPartner === "P1" ? "P2" : "P1";
    }

    if (initialData) {
      updateTransaction(initialData.id, txData);
    } else {
      addTransaction(txData);
    }
    onOpenChange(false);
  };

  const title = initialData
    ? `Edit ${type === "settlement" ? "Settlement" : type}`
    : `Add ${type === "settlement" ? "Settlement" : type}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...form.register("date")} />
            {form.formState.errors.date && (
              <p className="text-xs text-destructive">
                {form.formState.errors.date.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="e.g. Office Supplies"
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              {...form.register("amount")}
            />
            {form.formState.errors.amount && (
              <p className="text-xs text-destructive">
                {form.formState.errors.amount.message}
              </p>
            )}
          </div>

          {(type === "expense" || type === "revenue") && (
            <div className="grid gap-2">
              <Label htmlFor="paidBy">
                {type === "expense" ? "Paid By" : "Received By"}
              </Label>
              <Select
                value={form.watch("paidBy")}
                onValueChange={(val: any) => form.setValue("paidBy", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P1">Partner 1</SelectItem>
                  <SelectItem value="P2">Partner 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "settlement" && (
            <div className="grid gap-2">
              <Label htmlFor="fromPartner">From Partner</Label>
              <Select
                value={form.watch("fromPartner")}
                onValueChange={(val: any) => form.setValue("fromPartner", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P1">Partner 1</SelectItem>
                  <SelectItem value="P2">Partner 2</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                To Partner:{" "}
                <span className="font-medium text-foreground">
                  {form.watch("fromPartner") === "P1" ? "Partner 2" : "Partner 1"}
                </span>
              </p>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
