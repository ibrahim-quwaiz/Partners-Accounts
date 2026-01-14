import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  History,
  Loader2
} from "lucide-react";
import { useApp } from "@/lib/appContext";
import { format } from "date-fns";

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
  projectId: string | null;
  periodId: string | null;
  transactionId: string | null;
  eventType: EventType;
  message: string;
  metadata: any;
  userId: string | null;
  createdAt: string;
}

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
  const style = styles[type] || { bg: "bg-gray-500/10", text: "text-gray-600", label: type };
  return (
    <Badge className={`${style.bg} ${style.text} hover:${style.bg} border-transparent gap-1.5`}>
      {getEventIcon(type)}
      {style.label}
    </Badge>
  );
};

export default function EventLogPage() {
  const { activeProject, periods } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  
  const isAllPeriods = selectedPeriod === "all";

  const { data: events = [], isLoading } = useQuery<EventLog[]>({
    queryKey: isAllPeriods 
      ? ["/api/projects", activeProject?.id, "events"]
      : ["/api/periods", selectedPeriod, "events"],
    enabled: isAllPeriods ? !!activeProject?.id : !!selectedPeriod,
  });

  const getPeriodName = (periodId: string | null) => {
    if (!periodId) return "-";
    const period = periods.find(p => p.id === periodId);
    return period?.name || "-";
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "yyyy/MM/dd HH:mm");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">سجل الأحداث</h1>
          <p className="text-muted-foreground">تتبع جميع العمليات والتغييرات في النظام</p>
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

      <div className="rounded-md border bg-card overflow-x-auto" dir="rtl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right w-[160px]">التاريخ</TableHead>
              <TableHead className="text-right w-[140px]">نوع الحدث</TableHead>
              <TableHead className="text-right">الوصف</TableHead>
              {isAllPeriods && <TableHead className="text-right w-[120px]">الفترة</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={isAllPeriods ? 4 : 3} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAllPeriods ? 4 : 3} className="h-24 text-center text-muted-foreground">
                  لا توجد أحداث لهذه الفترة
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {formatDate(event.createdAt)}
                  </TableCell>
                  <TableCell>
                    {getEventBadge(event.eventType)}
                  </TableCell>
                  <TableCell>{event.message}</TableCell>
                  {isAllPeriods && (
                    <TableCell className="text-muted-foreground">
                      {getPeriodName(event.periodId)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
