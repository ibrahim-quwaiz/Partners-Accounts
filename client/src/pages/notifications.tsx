import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageCircle, Send, Clock, CheckCircle, XCircle } from "lucide-react";
import { useApp, NotificationLog } from "@/lib/appContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useState } from "react";

type NotifStatus = "pending" | "sent" | "failed";

interface ExtendedNotif extends NotificationLog {
  status: NotifStatus;
}

export default function NotificationsPage() {
  const { notifications } = useApp();
  const { toast } = useToast();
  
  const [notifStatuses, setNotifStatuses] = useState<Record<string, NotifStatus>>({});

  const getStatus = (id: string): NotifStatus => notifStatuses[id] || "pending";

  const handleSend = (notif: NotificationLog) => {
    // Simulate sending - randomly succeed or fail for demo
    const success = Math.random() > 0.3;
    setNotifStatuses(prev => ({
      ...prev,
      [notif.id]: success ? "sent" : "failed"
    }));
    
    toast({
      title: success ? "تم الإرسال بنجاح" : "فشل الإرسال",
      description: success 
        ? `تم إرسال الإشعار لـ "${notif.transactionName}"` 
        : "حدث خطأ أثناء الإرسال، يرجى المحاولة مرة أخرى",
      variant: success ? "default" : "destructive",
    });
  };

  const renderStatusBadge = (status: NotifStatus) => {
    switch (status) {
      case "sent":
        return (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
            <CheckCircle className="h-3 w-3 me-1" />
            تم الإرسال
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20">
            <XCircle className="h-3 w-3 me-1" />
            فشل
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20">
            <Clock className="h-3 w-3 me-1" />
            قيد الانتظار
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">سجل الإشعارات</h1>
        <p className="text-muted-foreground">تتبع المعاملات وحالة الإشعارات المرسلة</p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start w-[180px]">التاريخ</TableHead>
              <TableHead className="text-start">اسم المعاملة</TableHead>
              <TableHead className="text-center w-[120px]">القنوات</TableHead>
              <TableHead className="text-center w-[130px]">الحالة</TableHead>
              <TableHead className="text-end w-[130px]">إجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  لا توجد إشعارات حتى الآن
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((row) => {
                const status = getStatus(row.id);
                return (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground font-medium">
                      {format(row.date, "yyyy/MM/dd hh:mm a")}
                    </TableCell>
                    <TableCell>{row.transactionName}</TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-3">
                        <Mail className={`h-5 w-5 ${status === "sent" ? "text-green-500" : "text-muted-foreground/40"}`} />
                        <MessageCircle className={`h-5 w-5 ${status === "sent" ? "text-green-500" : "text-muted-foreground/40"}`} />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {renderStatusBadge(status)}
                    </TableCell>
                    <TableCell className="text-end">
                      <Button 
                        size="sm" 
                        variant={status === "pending" ? "default" : "outline"}
                        onClick={() => handleSend(row)}
                        className="gap-2"
                        disabled={status === "sent"}
                      >
                        <Send className="h-3.5 w-3.5" />
                        {status === "sent" ? "تم" : status === "failed" ? "إعادة" : "إرسال"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
