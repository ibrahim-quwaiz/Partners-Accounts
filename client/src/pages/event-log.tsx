import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarCheck, 
  CalendarX, 
  FilePlus, 
  FileEdit, 
  FileX, 
  Send, 
  AlertTriangle, 
  ShieldX,
  History 
} from "lucide-react";
import { MOCK_PERIODS } from "@/lib/appContext";

type EventType = 
  | "PERIOD_OPENED" 
  | "PERIOD_CLOSED" 
  | "TX_CREATED" 
  | "TX_UPDATED" 
  | "TX_DELETED" 
  | "NOTIF_SENT" 
  | "NOTIF_FAILED" 
  | "ACCESS_DENIED";

interface EventLog {
  id: string;
  date: string;
  type: EventType;
  description: string;
  user: string;
  periodId: string;
  periodName: string;
}

const MOCK_EVENTS: EventLog[] = [
  { id: "e1", date: "2025/01/15 10:30", type: "TX_CREATED", description: "تم إنشاء معاملة: أكياس أسمنت", user: "محمد علي", periodId: "per_01", periodName: "يناير 2025" },
  { id: "e2", date: "2025/01/15 10:32", type: "NOTIF_SENT", description: "تم إرسال إشعار للشريك 2", user: "النظام", periodId: "per_01", periodName: "يناير 2025" },
  { id: "e3", date: "2025/01/14 14:20", type: "TX_UPDATED", description: "تم تعديل معاملة: دفعة مقدمة", user: "أحمد خالد", periodId: "per_01", periodName: "يناير 2025" },
  { id: "e4", date: "2025/01/14 09:00", type: "PERIOD_OPENED", description: "تم فتح فترة: يناير 2025", user: "محمد علي", periodId: "per_01", periodName: "يناير 2025" },
  { id: "e5", date: "2025/02/13 16:45", type: "TX_DELETED", description: "تم حذف معاملة: مصروف قديم", user: "محمد علي", periodId: "per_02", periodName: "فبراير 2025" },
  { id: "e6", date: "2025/02/12 11:30", type: "NOTIF_FAILED", description: "فشل إرسال إشعار للشريك 1", user: "النظام", periodId: "per_02", periodName: "فبراير 2025" },
  { id: "e7", date: "2025/02/10 08:15", type: "ACCESS_DENIED", description: "محاولة وصول غير مصرح: تعديل فترة مغلقة", user: "زائر", periodId: "per_02", periodName: "فبراير 2025" },
  { id: "e8", date: "2025/03/01 00:00", type: "PERIOD_CLOSED", description: "تم إغلاق فترة: ديسمبر 2024", user: "النظام", periodId: "per_03", periodName: "مارس 2025" },
];

const getEventIcon = (type: EventType) => {
  switch (type) {
    case "PERIOD_OPENED": return <CalendarCheck className="h-4 w-4" />;
    case "PERIOD_CLOSED": return <CalendarX className="h-4 w-4" />;
    case "TX_CREATED": return <FilePlus className="h-4 w-4" />;
    case "TX_UPDATED": return <FileEdit className="h-4 w-4" />;
    case "TX_DELETED": return <FileX className="h-4 w-4" />;
    case "NOTIF_SENT": return <Send className="h-4 w-4" />;
    case "NOTIF_FAILED": return <AlertTriangle className="h-4 w-4" />;
    case "ACCESS_DENIED": return <ShieldX className="h-4 w-4" />;
    default: return <History className="h-4 w-4" />;
  }
};

const getEventBadge = (type: EventType) => {
  const styles: Record<EventType, { bg: string; text: string; label: string }> = {
    PERIOD_OPENED: { bg: "bg-green-500/10", text: "text-green-600", label: "فتح فترة" },
    PERIOD_CLOSED: { bg: "bg-slate-500/10", text: "text-slate-600", label: "إغلاق فترة" },
    TX_CREATED: { bg: "bg-blue-500/10", text: "text-blue-600", label: "إنشاء معاملة" },
    TX_UPDATED: { bg: "bg-amber-500/10", text: "text-amber-600", label: "تعديل معاملة" },
    TX_DELETED: { bg: "bg-red-500/10", text: "text-red-600", label: "حذف معاملة" },
    NOTIF_SENT: { bg: "bg-emerald-500/10", text: "text-emerald-600", label: "إشعار مُرسل" },
    NOTIF_FAILED: { bg: "bg-orange-500/10", text: "text-orange-600", label: "فشل إشعار" },
    ACCESS_DENIED: { bg: "bg-rose-500/10", text: "text-rose-600", label: "رفض وصول" },
  };
  const style = styles[type];
  return (
    <Badge className={`${style.bg} ${style.text} hover:${style.bg} border-transparent gap-1.5`}>
      {getEventIcon(type)}
      {style.label}
    </Badge>
  );
};

export default function EventLogPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  
  const isAllPeriods = selectedPeriod === "all";

  // Filter events by period
  const filteredEvents = isAllPeriods 
    ? MOCK_EVENTS 
    : MOCK_EVENTS.filter(e => e.periodId === selectedPeriod);

  return (
    <div className="space-y-6">
      {/* Header with period filter */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">سجل الأحداث</h1>
          <p className="text-muted-foreground">تتبع جميع العمليات والتغييرات في النظام</p>
        </div>

        {/* Period Dropdown - Single Source of Truth */}
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

      <div className="rounded-md border bg-card overflow-x-auto" dir="rtl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right w-[160px]">التاريخ</TableHead>
              <TableHead className="text-right w-[140px]">نوع الحدث</TableHead>
              <TableHead className="text-right">الوصف</TableHead>
              {isAllPeriods && <TableHead className="text-right w-[120px]">الفترة</TableHead>}
              <TableHead className="text-right w-[120px]">المستخدم</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAllPeriods ? 5 : 4} className="h-24 text-center text-muted-foreground">
                  لا توجد أحداث لهذه الفترة
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {event.date}
                  </TableCell>
                  <TableCell>
                    {getEventBadge(event.type)}
                  </TableCell>
                  <TableCell>{event.description}</TableCell>
                  {isAllPeriods && (
                    <TableCell className="text-muted-foreground">{event.periodName}</TableCell>
                  )}
                  <TableCell className="text-muted-foreground">{event.user}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
