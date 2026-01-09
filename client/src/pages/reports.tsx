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
import { MOCK_PERIODS, useApp } from "@/lib/appContext";

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

// Mock partner report data
const MOCK_PARTNER_REPORT = [
  {
    id: "P1",
    name: "الشريك 1",
    openingBalance: 0,
    totalPaid: 3700, // expenses paid
    totalReceived: 3000, // revenues received
    settlements: -500, // net settlements (negative = paid out)
    profitShare: 3000, // 50% of net profit
    closingBalance: 1800, // calculated
  },
  {
    id: "P2",
    name: "الشريك 2",
    openingBalance: 0,
    totalPaid: 2100, // expenses paid
    totalReceived: 9000, // revenues received
    settlements: 500, // net settlements (positive = received)
    profitShare: 3000, // 50% of net profit
    closingBalance: -1800, // calculated (owes partner 1)
  },
];

export default function ReportsPage() {
  const { getPartnerName } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  const totalExpenses = MOCK_REPORT_DATA.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenues = MOCK_REPORT_DATA.revenues.reduce((sum, r) => sum + r.amount, 0);
  const netProfit = totalRevenues - totalExpenses;

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

      {/* Detailed Reports */}
      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="expenses">المصروفات</TabsTrigger>
          <TabsTrigger value="revenues">الإيرادات</TabsTrigger>
          <TabsTrigger value="settlements">التسويات</TabsTrigger>
          <TabsTrigger value="partners" className="gap-1">
            <Users className="h-3.5 w-3.5 hidden sm:block" />
            الشركاء
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="mt-6">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">التاريخ</TableHead>
                  <TableHead className="text-start">الوصف</TableHead>
                  <TableHead className="text-start">الشريك</TableHead>
                  {showPeriodColumn && <TableHead className="text-start">الفترة</TableHead>}
                  <TableHead className="text-end">المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_REPORT_DATA.expenses.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground">{row.date}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{row.partner}</TableCell>
                    {showPeriodColumn && <TableCell className="text-muted-foreground">{row.period}</TableCell>}
                    <TableCell className="text-end font-medium text-red-600">{row.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="revenues" className="mt-6">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">التاريخ</TableHead>
                  <TableHead className="text-start">الوصف</TableHead>
                  <TableHead className="text-start">الشريك</TableHead>
                  {showPeriodColumn && <TableHead className="text-start">الفترة</TableHead>}
                  <TableHead className="text-end">المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_REPORT_DATA.revenues.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground">{row.date}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{row.partner}</TableCell>
                    {showPeriodColumn && <TableCell className="text-muted-foreground">{row.period}</TableCell>}
                    <TableCell className="text-end font-medium text-green-600">{row.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="settlements" className="mt-6">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">التاريخ</TableHead>
                  <TableHead className="text-start">الوصف</TableHead>
                  <TableHead className="text-start">من</TableHead>
                  <TableHead className="text-start">إلى</TableHead>
                  {showPeriodColumn && <TableHead className="text-start">الفترة</TableHead>}
                  <TableHead className="text-end">المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_REPORT_DATA.settlements.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground">{row.date}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{row.from}</TableCell>
                    <TableCell>{row.to}</TableCell>
                    {showPeriodColumn && <TableCell className="text-muted-foreground">{row.period}</TableCell>}
                    <TableCell className="text-end font-medium">{row.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="partners" className="mt-6 space-y-4">
          {/* Partner Report Note */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">ملاحظة</p>
              <p className="text-amber-600">هذا التقرير توضيحي (Mock) وسيتم ربطه بالحسابات لاحقًا.</p>
            </div>
          </div>

          <div className="rounded-md border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">الشريك</TableHead>
                  <TableHead className="text-end">رصيد أول المدة</TableHead>
                  <TableHead className="text-end">إجمالي ما دفع</TableHead>
                  <TableHead className="text-end">إجمالي ما استلم</TableHead>
                  <TableHead className="text-end">التسويات</TableHead>
                  <TableHead className="text-end">نصيب الربح (50%)</TableHead>
                  <TableHead className="text-end">الرصيد الختامي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_PARTNER_REPORT.map(partner => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell className="text-end text-muted-foreground">
                      {partner.openingBalance.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-end text-red-600">
                      {partner.totalPaid.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-end text-green-600">
                      {partner.totalReceived.toLocaleString()}
                    </TableCell>
                    <TableCell className={`text-end ${partner.settlements >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {partner.settlements >= 0 ? "+" : ""}{partner.settlements.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-end text-primary font-medium">
                      {partner.profitShare.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-end">
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
