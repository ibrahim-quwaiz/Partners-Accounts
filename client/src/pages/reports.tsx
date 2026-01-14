import { useState, useMemo } from "react";
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
import { TrendingUp, TrendingDown, Wallet, Users, Loader2 } from "lucide-react";
import { useApp, Transaction, Partner } from "@/lib/appContext";
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
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  const isAllPeriods = selectedPeriod === "all";

  const { data: allTransactions = [], isLoading } = useQuery<TransactionFromAPI[]>({
    queryKey: isAllPeriods 
      ? ["/api/projects", activeProject?.id, "transactions"]
      : ["/api/periods", selectedPeriod, "transactions"],
    enabled: isAllPeriods ? !!activeProject?.id : (!!selectedPeriod && selectedPeriod !== "all"),
    staleTime: 0,
  });

  const getPeriodName = (periodId: string) => {
    const period = periods.find(p => p.id === periodId);
    return period?.name || "-";
  };

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

  const partnerReport = useMemo(() => {
    const report: Record<string, {
      id: string;
      name: string;
      openingBalance: number;
      totalPaid: number;
      totalReceived: number;
      settlementsIn: number;
      settlementsOut: number;
      profitShare: number;
      closingBalance: number;
    }> = {};

    partners.forEach(partner => {
      report[partner.id] = {
        id: partner.id,
        name: partner.displayName,
        openingBalance: 0,
        totalPaid: 0,
        totalReceived: 0,
        settlementsIn: 0,
        settlementsOut: 0,
        profitShare: 0,
        closingBalance: 0,
      };
    });

    expenses.forEach(tx => {
      if (tx.paidBy && report[tx.paidBy]) {
        report[tx.paidBy].totalPaid += parseAmount(tx.amount);
      }
    });

    revenues.forEach(tx => {
      if (tx.paidBy && report[tx.paidBy]) {
        report[tx.paidBy].totalReceived += parseAmount(tx.amount);
      }
    });

    settlements.forEach(tx => {
      const amount = parseAmount(tx.amount);
      if (tx.fromPartner && report[tx.fromPartner]) {
        report[tx.fromPartner].settlementsOut += amount;
      }
      if (tx.toPartner && report[tx.toPartner]) {
        report[tx.toPartner].settlementsIn += amount;
      }
    });

    const partnerCount = partners.length || 1;
    const profitPerPartner = netProfit / partnerCount;
    
    Object.keys(report).forEach(partnerId => {
      report[partnerId].profitShare = profitPerPartner;
      report[partnerId].closingBalance = 
        report[partnerId].totalPaid - 
        report[partnerId].totalReceived - 
        report[partnerId].profitShare + 
        report[partnerId].settlementsIn - 
        report[partnerId].settlementsOut;
    });

    return Object.values(report);
  }, [expenses, revenues, settlements, netProfit, partners]);

  const showPeriodColumn = selectedPeriod === "all";

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
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الفترات</SelectItem>
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
                {selectedPeriod === "all" && (
                  <p className="text-xs text-muted-foreground mt-1">لجميع الفترات</p>
                )}
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
                {selectedPeriod === "all" && (
                  <p className="text-xs text-muted-foreground mt-1">لجميع الفترات</p>
                )}
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
                {selectedPeriod === "all" && (
                  <p className="text-xs text-muted-foreground mt-1">لجميع الفترات</p>
                )}
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
                      {showPeriodColumn && <TableHead className="text-right">الفترة</TableHead>}
                      <TableHead className="text-left">المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={showPeriodColumn ? 5 : 4} className="h-24 text-center text-muted-foreground">
                          لا توجد مصروفات
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses.map(tx => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-muted-foreground">{formatDate(tx.date)}</TableCell>
                          <TableCell>{tx.description}</TableCell>
                          <TableCell>{tx.paidBy ? getPartnerName(tx.paidBy) : "-"}</TableCell>
                          {showPeriodColumn && <TableCell className="text-muted-foreground">{getPeriodName(tx.periodId)}</TableCell>}
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
                      {showPeriodColumn && <TableHead className="text-right">الفترة</TableHead>}
                      <TableHead className="text-left">المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenues.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={showPeriodColumn ? 5 : 4} className="h-24 text-center text-muted-foreground">
                          لا توجد إيرادات
                        </TableCell>
                      </TableRow>
                    ) : (
                      revenues.map(tx => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-muted-foreground">{formatDate(tx.date)}</TableCell>
                          <TableCell>{tx.description}</TableCell>
                          <TableCell>{tx.paidBy ? getPartnerName(tx.paidBy) : "-"}</TableCell>
                          {showPeriodColumn && <TableCell className="text-muted-foreground">{getPeriodName(tx.periodId)}</TableCell>}
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
                      {showPeriodColumn && <TableHead className="text-right">الفترة</TableHead>}
                      <TableHead className="text-left">المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={showPeriodColumn ? 6 : 5} className="h-24 text-center text-muted-foreground">
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
                          {showPeriodColumn && <TableCell className="text-muted-foreground">{getPeriodName(tx.periodId)}</TableCell>}
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
                      <TableHead className="text-right">الشريك</TableHead>
                      <TableHead className="text-left">إجمالي ما دفع</TableHead>
                      <TableHead className="text-left">إجمالي ما استلم</TableHead>
                      <TableHead className="text-left">تسويات مستلمة</TableHead>
                      <TableHead className="text-left">تسويات مدفوعة</TableHead>
                      <TableHead className="text-left">نصيب الربح (50%)</TableHead>
                      <TableHead className="text-left">الرصيد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partnerReport.map(partner => (
                      <TableRow key={partner.id}>
                        <TableCell className="font-medium text-right">{partner.name}</TableCell>
                        <TableCell className="text-left text-red-600">
                          {partner.totalPaid.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-left text-green-600">
                          {partner.totalReceived.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-left text-green-600">
                          +{partner.settlementsIn.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-left text-red-600">
                          -{partner.settlementsOut.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-left text-primary font-medium">
                          {partner.profitShare.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-left">
                          <span className={`font-bold ${partner.closingBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {partner.closingBalance >= 0 ? "له " : "عليه "}
                            {Math.abs(partner.closingBalance).toLocaleString()} ر.س
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
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
