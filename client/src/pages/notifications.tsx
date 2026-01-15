import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageCircle, Send, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useApp } from "@/lib/appContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

type NotifStatus = "PENDING" | "SENT" | "FAILED";

interface NotificationFromAPI {
  id: string;
  transactionId: string;
  status: NotifStatus;
  lastError: string | null;
  sentEmailAt: string | null;
  sentWhatsappAt: string | null;
  createdAt: string;
  updatedAt: string;
  transaction?: {
    id: string;
    description: string;
    periodId: string;
  };
}

export default function NotificationsPage() {
  const { periods } = useApp();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  const isAllPeriods = selectedPeriod === "all";

  const { data: notifications = [], isLoading } = useQuery<NotificationFromAPI[]>({
    queryKey: ["/api/notifications"],
    enabled: true,
  });

  const sendMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/notifications/${id}/send`, {});
      return res.json();
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      
      if (data.success) {
        const channels = [];
        if (data.emailSent) channels.push("البريد الإلكتروني");
        if (data.whatsappSent) channels.push("الواتساب");
        
        toast({
          title: "تم الإرسال بنجاح",
          description: `تم الإرسال عبر: ${channels.join(" و ")}`,
        });
      } else {
        toast({
          title: "فشل الإرسال",
          description: data.error || "حدث خطأ أثناء الإرسال",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "فشل الإرسال",
        description: error.message || "حدث خطأ أثناء الإرسال",
        variant: "destructive",
      });
    },
  });

  const filteredNotifications = isAllPeriods 
    ? notifications 
    : notifications.filter(n => n.transaction?.periodId === selectedPeriod);

  const handleSend = (notif: NotificationFromAPI) => {
    sendMutation.mutate(notif.id);
  };

  const getPeriodName = (periodId: string | undefined) => {
    if (!periodId) return "-";
    const period = periods.find(p => p.id === periodId);
    return period?.name || "-";
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "yyyy/MM/dd hh:mm a");
    } catch {
      return dateStr;
    }
  };

  const renderStatusBadge = (status: NotifStatus) => {
    switch (status) {
      case "SENT":
        return (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
            <CheckCircle className="h-3 w-3 me-1" />
            تم الإرسال
          </Badge>
        );
      case "FAILED":
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">سجل الإشعارات</h1>
          <p className="text-muted-foreground">تتبع المعاملات وحالة الإشعارات المرسلة</p>
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
              <TableHead className="text-right w-[180px]">التاريخ</TableHead>
              <TableHead className="text-right">اسم المعاملة</TableHead>
              {isAllPeriods && <TableHead className="text-right w-[120px]">الفترة</TableHead>}
              <TableHead className="text-center w-[120px]">القنوات</TableHead>
              <TableHead className="text-center w-[130px]">الحالة</TableHead>
              <TableHead className="text-left w-[130px]">إجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={isAllPeriods ? 6 : 5} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredNotifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAllPeriods ? 6 : 5} className="h-24 text-center text-muted-foreground">
                  لا توجد إشعارات لهذه الفترة
                </TableCell>
              </TableRow>
            ) : (
              filteredNotifications.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-muted-foreground font-medium">
                    {formatDate(row.createdAt)}
                  </TableCell>
                  <TableCell>{row.transaction?.description || "-"}</TableCell>
                  {isAllPeriods && (
                    <TableCell className="text-muted-foreground">
                      {getPeriodName(row.transaction?.periodId)}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex justify-center gap-3">
                      <Mail className={`h-5 w-5 ${row.sentEmailAt ? "text-green-500" : "text-muted-foreground/40"}`} />
                      <MessageCircle className={`h-5 w-5 ${row.sentWhatsappAt ? "text-green-500" : "text-muted-foreground/40"}`} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {renderStatusBadge(row.status)}
                  </TableCell>
                  <TableCell className="text-left">
                    <Button 
                      size="sm" 
                      variant={row.status === "PENDING" ? "default" : "outline"}
                      onClick={() => handleSend(row)}
                      className="gap-2"
                      disabled={row.status === "SENT" || sendMutation.isPending}
                    >
                      {sendMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      {row.status === "SENT" ? "تم" : row.status === "FAILED" ? "إعادة" : "إرسال"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
