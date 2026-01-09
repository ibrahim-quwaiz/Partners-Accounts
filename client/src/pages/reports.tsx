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
import { TrendingUp, TrendingDown, Wallet, ArrowUpDown } from "lucide-react";
import { MOCK_PERIODS } from "@/lib/appContext";

const MOCK_REPORT_DATA = {
  expenses: [
    { id: 1, description: "أكياس أسمنت", amount: 1200, partner: "الشريك 1", date: "2025/01/05" },
    { id: 2, description: "لوازم طلاء", amount: 300, partner: "الشريك 2", date: "2025/01/10" },
    { id: 3, description: "أجور عمالة", amount: 2500, partner: "الشريك 1", date: "2025/01/15" },
  ],
  revenues: [
    { id: 1, description: "دفعة مقدمة من العميل", amount: 5000, partner: "الشريك 2", date: "2025/01/08" },
    { id: 2, description: "دفعة ثانية", amount: 3000, partner: "الشريك 1", date: "2025/01/20" },
  ],
  settlements: [
    { id: 1, description: "تسوية جزئية", amount: 500, from: "الشريك 1", to: "الشريك 2", date: "2025/01/15" },
  ],
};

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  const totalExpenses = MOCK_REPORT_DATA.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenues = MOCK_REPORT_DATA.revenues.reduce((sum, r) => sum + r.amount, 0);
  const netProfit = totalRevenues - totalExpenses;

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
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="expenses">المصروفات</TabsTrigger>
          <TabsTrigger value="revenues">الإيرادات</TabsTrigger>
          <TabsTrigger value="settlements">التسويات</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="mt-6">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">التاريخ</TableHead>
                  <TableHead className="text-start">الوصف</TableHead>
                  <TableHead className="text-start">الشريك</TableHead>
                  <TableHead className="text-end">المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_REPORT_DATA.expenses.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground">{row.date}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{row.partner}</TableCell>
                    <TableCell className="text-end font-medium">{row.amount.toLocaleString()}</TableCell>
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
                  <TableHead className="text-end">المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_REPORT_DATA.revenues.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground">{row.date}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{row.partner}</TableCell>
                    <TableCell className="text-end font-medium">{row.amount.toLocaleString()}</TableCell>
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
                    <TableCell className="text-end font-medium">{row.amount.toLocaleString()}</TableCell>
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
