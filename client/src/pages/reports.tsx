import { useState } from "react";
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
import { TrendingUp, TrendingDown, Wallet, Users, AlertCircle } from "lucide-react";
import { MOCK_PERIODS } from "@/lib/appContext";

const MOCK_REPORT_DATA = {
  expenses: [
    { id: 1, description: "أكياس أسمنت", amount: 1200, partner: "الشريك 1", date: "2025/01/05", period: "يناير 2025" },
    { id: 2, description: "لوازم طلاء", amount: 300, partner: "الشريك 2", date: "2025/01/10", period: "يناير 2025" },
    { id: 3, description: "أجور عمالة", amount: 2500, partner: "الشريك 1", date: "2025/01/15", period: "يناير 2025" },
    { id: 4, description: "مواد بناء", amount: 1800, partner: "الشريك 2", date: "2025/02/05", period: "فبراير 2025" },
  ],
  revenues: [
    { id: 1, description: "دفعة مقدمة من العميل", amount: 5000, partner: "الشريك 2", date: "2025/01/08", period: "يناير 2025" },
    { id: 2, description: "دفعة ثانية", amount: 3000, partner: "الشريك 1", date: "2025/01/20", period: "يناير 2025" },
    { id: 3, description: "دفعة ثالثة", amount: 4000, partner: "الشريك 2", date: "2025/02/15", period: "فبراير 2025" },
  ],
  settlements: [
    { id: 1, description: "تسوية جزئية", amount: 500, from: "الشريك 1", to: "الشريك 2", date: "2025/01/15", period: "يناير 2025" },
    { id: 2, description: "تسوية شهرية", amount: 1200, from: "الشريك 2", to: "الشريك 1", date: "2025/02/01", period: "فبراير 2025" },
  ],
};

const MOCK_PARTNER_REPORT = [
  {
    id: "P1",
    name: "الشريك 1",
    openingBalance: 0,
    totalPaid: 3700,
    totalReceived: 3000,
    settlements: -500,
    profitShare: 3000,
    closingBalance: 1800,
  },
  {
    id: "P2",
    name: "الشريك 2",
    openingBalance: 0,
    totalPaid: 2100,
    totalReceived: 9000,
    settlements: 500,
    profitShare: 3000,
    closingBalance: -1800,
  },
];

export default function ReportsPage() {
  // Single source of truth for period selection
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  // Filter data based on selected period
  const filterByPeriod = <T extends { period: string }>(data: T[]) => {
    if (selectedPeriod === "all") return data;
    const periodName = MOCK_PERIODS.find(p => p.id === selectedPeriod)?.name;
    return data.filter(item => item.period === periodName);
  };

  const filteredExpenses = filterByPeriod(MOCK_REPORT_DATA.expenses);
  const filteredRevenues = filterByPeriod(MOCK_REPORT_DATA.revenues);
  const filteredSettlements = filterByPeriod(MOCK_REPORT_DATA.settlements);

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenues = filteredRevenues.reduce((sum, r) => sum + r.amount, 0);
  const netProfit = totalRevenues - totalExpenses;

  // Show period column only when "all periods" is selected
  const showPeriodColumn = selectedPeriod === "all";

  return (
    <div className="space-y-6">
      {/* Header with single period filter */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">التقارير</h1>
          <p className="text-muted-foreground">ملخص المعاملات والأرباح</p>
        </div>

        {/* Single period dropdown - only one in the entire page */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">الفترة:</span>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الفترات</SelectItem>
              {MOCK_PERIODS.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
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

      {/* Report Tabs - RTL order */}
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

        {/* Expenses Tab */}
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
                {filteredExpenses.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground">{row.date}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{row.partner}</TableCell>
                    {showPeriodColumn && <TableCell className="text-muted-foreground">{row.period}</TableCell>}
                    <TableCell className="text-left font-medium text-red-600">{row.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Revenues Tab */}
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
                {filteredRevenues.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground">{row.date}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{row.partner}</TableCell>
                    {showPeriodColumn && <TableCell className="text-muted-foreground">{row.period}</TableCell>}
                    <TableCell className="text-left font-medium text-green-600">{row.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Settlements Tab */}
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
                {filteredSettlements.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground">{row.date}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{row.from}</TableCell>
                    <TableCell>{row.to}</TableCell>
                    {showPeriodColumn && <TableCell className="text-muted-foreground">{row.period}</TableCell>}
                    <TableCell className="text-left font-medium">{row.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Partners Tab */}
        <TabsContent value="partners" className="mt-6 space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">ملاحظة</p>
              <p className="text-amber-600">هذا التقرير توضيحي (Mock) وسيتم ربطه بالحسابات لاحقًا.</p>
            </div>
          </div>

          <div className="rounded-md border bg-card overflow-x-auto" dir="rtl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الشريك</TableHead>
                  <TableHead className="text-left">رصيد أول المدة</TableHead>
                  <TableHead className="text-left">إجمالي ما دفع</TableHead>
                  <TableHead className="text-left">إجمالي ما استلم</TableHead>
                  <TableHead className="text-left">التسويات</TableHead>
                  <TableHead className="text-left">نصيب الربح (50%)</TableHead>
                  <TableHead className="text-left">الرصيد الختامي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_PARTNER_REPORT.map(partner => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium text-right">{partner.name}</TableCell>
                    <TableCell className="text-left text-muted-foreground">
                      {partner.openingBalance.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-left text-red-600">
                      {partner.totalPaid.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-left text-green-600">
                      {partner.totalReceived.toLocaleString()}
                    </TableCell>
                    <TableCell className={`text-left ${partner.settlements >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {partner.settlements >= 0 ? "+" : ""}{partner.settlements.toLocaleString()}
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
    </div>
  );
}
