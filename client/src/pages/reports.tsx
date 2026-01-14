import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Wallet, Users, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useApp, Partner } from "@/lib/appContext";
import { format } from "date-fns";

interface TransactionFromAPI {
  id: string;
  projectId: string;
  periodId: string;
  type: string;
  date: string;
  description: string;
  amount: string;
  paidBy: Partner | null;
  fromPartner: Partner | null;
  toPartner: Partner | null;
}

export default function ReportsPage() {
  const { activeProject, periods, partners, getPartnerName } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  useEffect(() => {
    if (periods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(periods[0].id);
    }
  }, [periods, selectedPeriod]);

  const { data: allTransactions = [], isLoading } = useQuery<TransactionFromAPI[]>({
    queryKey: ["reports", "transactions", "period", selectedPeriod],
    queryFn: async () => {
      const url = `/api/periods/${selectedPeriod}/transactions`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    enabled: !!selectedPeriod,
    staleTime: 0,
  });

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "yyyy/MM/dd");
    } catch {
      return dateStr;
    }
  };

  const parseAmount = (amount: string | number): number => {
    return typeof amount === 'string' ? parseFloat(amount) : amount;
  };

  const expenses = useMemo(() => 
    allTransactions.filter(tx => tx.type === 'EXPENSE'),
    [allTransactions]
  );

  const revenues = useMemo(() => 
    allTransactions.filter(tx => tx.type === 'REVENUE'),
    [allTransactions]
  );

  const settlements = useMemo(() => 
    allTransactions.filter(tx => tx.type === 'SETTLEMENT'),
    [allTransactions]
  );

  const totalExpenses = useMemo(() => 
    expenses.reduce((sum, tx) => sum + parseAmount(tx.amount), 0),
    [expenses]
  );

  const totalRevenues = useMemo(() => 
    revenues.reduce((sum, tx) => sum + parseAmount(tx.amount), 0),
    [revenues]
  );

  const netProfit = totalRevenues - totalExpenses;
  const profitShare = netProfit / 2;

  const partnerReport = useMemo(() => {
    const report: Record<string, {
      id: string;
      name: string;
      openingBalance: number;
      expensesPaid: number;
      revenuesReceived: number;
      settlementsPaid: number;
      settlementsReceived: number;
      profitShare: number;
      closingBalance: number;
    }> = {};

    partners.forEach(partner => {
      report[partner.id] = {
        id: partner.id,
        name: partner.displayName,
        openingBalance: 0,
        expensesPaid: 0,
        revenuesReceived: 0,
        settlementsPaid: 0,
        settlementsReceived: 0,
        profitShare: profitShare,
        closingBalance: 0,
      };
    });

    expenses.forEach(tx => {
      if (tx.paidBy && report[tx.paidBy]) {
        report[tx.paidBy].expensesPaid += parseAmount(tx.amount);
      }
    });

    revenues.forEach(tx => {
      if (tx.paidBy && report[tx.paidBy]) {
        report[tx.paidBy].revenuesReceived += parseAmount(tx.amount);
      }
    });

    settlements.forEach(tx => {
      const amount = parseAmount(tx.amount);
      if (tx.fromPartner && report[tx.fromPartner]) {
        report[tx.fromPartner].settlementsPaid += amount;
      }
      if (tx.toPartner && report[tx.toPartner]) {
        report[tx.toPartner].settlementsReceived += amount;
      }
    });

    Object.keys(report).forEach(partnerId => {
      const p = report[partnerId];
      p.closingBalance = 
        p.openingBalance +
        p.expensesPaid -
        p.revenuesReceived +
        p.settlementsPaid -
        p.settlementsReceived +
        p.profitShare;
    });

    return Object.values(report);
  }, [expenses, revenues, settlements, profitShare, partners]);

  const balanceSum = useMemo(() => {
    return partnerReport.reduce((sum, p) => sum + p.closingBalance, 0);
  }, [partnerReport]);

  const isBalanced = Math.abs(balanceSum) < 0.01;

  if (!selectedPeriod) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-muted-foreground">يرجى اختيار فترة</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">التقارير</h1>
          <p className="text-muted-foreground">ملخص المعاملات والأرباح</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">الفترة:</span>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="اختر فترة" />
            </SelectTrigger>
            <SelectContent>
              {periods.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {totalRevenues.toLocaleString()} ر.س
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المصروفات</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {totalExpenses.toLocaleString()} ر.س
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">صافي الربح</CardTitle>
                <Wallet className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {netProfit.toLocaleString()} ر.س
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="expenses" className="w-full">
            <div dir="rtl">
              <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
                <TabsTrigger value="expenses">المصروفات</TabsTrigger>
                <TabsTrigger value="revenues">الإيرادات</TabsTrigger>
                <TabsTrigger value="settlements">التسويات</TabsTrigger>
                <TabsTrigger value="partners" className="gap-1">
                  <Users className="h-3.5 w-3.5 hidden sm:block" />
                  الشركاء
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="expenses" className="mt-6">
              <div className="rounded-md border bg-card overflow-x-auto" dir="rtl">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الوصف</TableHead>
                      <TableHead className="text-right">الشريك</TableHead>
                      <TableHead className="text-left">المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          لا توجد مصروفات
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses.map(tx => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-muted-foreground">{formatDate(tx.date)}</TableCell>
                          <TableCell>{tx.description}</TableCell>
                          <TableCell>{tx.paidBy ? getPartnerName(tx.paidBy) : "-"}</TableCell>
                          <TableCell className="text-left font-medium text-red-600">{parseAmount(tx.amount).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="revenues" className="mt-6">
              <div className="rounded-md border bg-card overflow-x-auto" dir="rtl">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الوصف</TableHead>
                      <TableHead className="text-right">الشريك</TableHead>
                      <TableHead className="text-left">المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenues.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          لا توجد إيرادات
                        </TableCell>
                      </TableRow>
                    ) : (
                      revenues.map(tx => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-muted-foreground">{formatDate(tx.date)}</TableCell>
                          <TableCell>{tx.description}</TableCell>
                          <TableCell>{tx.paidBy ? getPartnerName(tx.paidBy) : "-"}</TableCell>
                          <TableCell className="text-left font-medium text-green-600">{parseAmount(tx.amount).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="settlements" className="mt-6">
              <div className="rounded-md border bg-card overflow-x-auto" dir="rtl">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الوصف</TableHead>
                      <TableHead className="text-right">من</TableHead>
                      <TableHead className="text-right">إلى</TableHead>
                      <TableHead className="text-left">المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          لا توجد تسويات
                        </TableCell>
                      </TableRow>
                    ) : (
                      settlements.map(tx => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-muted-foreground">{formatDate(tx.date)}</TableCell>
                          <TableCell>{tx.description}</TableCell>
                          <TableCell>{tx.fromPartner ? getPartnerName(tx.fromPartner) : "-"}</TableCell>
                          <TableCell>{tx.toPartner ? getPartnerName(tx.toPartner) : "-"}</TableCell>
                          <TableCell className="text-left font-medium">{parseAmount(tx.amount).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="partners" className="mt-6 space-y-4">
              <div className="rounded-md border bg-card overflow-x-auto" dir="rtl">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">البند</TableHead>
                      {partnerReport.map(p => (
                        <TableHead key={p.id} className="text-left">{p.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">رصيد أول المدة</TableCell>
                      {partnerReport.map(p => (
                        <TableCell key={p.id} className="text-left text-muted-foreground">
                          {p.openingBalance.toLocaleString()}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">المصروفات المدفوعة (دائن)</TableCell>
                      {partnerReport.map(p => (
                        <TableCell key={p.id} className="text-left text-green-600">
                          +{p.expensesPaid.toLocaleString()}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">الإيرادات المستلمة (مدين)</TableCell>
                      {partnerReport.map(p => (
                        <TableCell key={p.id} className="text-left text-red-600">
                          -{p.revenuesReceived.toLocaleString()}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">التسويات المدفوعة (دائن)</TableCell>
                      {partnerReport.map(p => (
                        <TableCell key={p.id} className="text-left text-green-600">
                          +{p.settlementsPaid.toLocaleString()}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">التسويات المستلمة (مدين)</TableCell>
                      {partnerReport.map(p => (
                        <TableCell key={p.id} className="text-left text-red-600">
                          -{p.settlementsReceived.toLocaleString()}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">نصيب من صافي الربح</TableCell>
                      {partnerReport.map(p => (
                        <TableCell key={p.id} className="text-left text-primary font-medium">
                          +{p.profitShare.toLocaleString()}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-bold">الرصيد النهائي للفترة</TableCell>
                      {partnerReport.map(p => (
                        <TableCell key={p.id} className="text-left">
                          <span className={`font-bold ${p.closingBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {p.closingBalance >= 0 ? "له " : "عليه "}
                            {Math.abs(p.closingBalance).toLocaleString()} ر.س
                          </span>
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow className={isBalanced ? "bg-green-50" : "bg-amber-50"}>
                      <TableCell className="font-medium">
                        {isBalanced ? (
                          <span className="flex items-center gap-2 text-green-700">
                            <CheckCircle2 className="h-4 w-4" />
                            الحسابات متوازنة
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-amber-700">
                            <AlertTriangle className="h-4 w-4" />
                            تحذير: الحسابات غير متوازنة
                          </span>
                        )}
                      </TableCell>
                      <TableCell colSpan={partnerReport.length} className={`text-left font-medium ${isBalanced ? "text-green-700" : "text-amber-700"}`}>
                        الفرق: {balanceSum.toLocaleString()} ر.س
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
