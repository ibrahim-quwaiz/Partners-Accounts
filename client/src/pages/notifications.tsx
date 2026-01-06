import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, Send } from "lucide-react";
import { useApp, NotificationLog } from "@/lib/appContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function NotificationsPage() {
  const { notifications } = useApp();
  const { toast } = useToast();

  const handleSend = (notif: NotificationLog) => {
    toast({
      title: "تم الإرسال",
      description: `تم إرسال الإشعار لـ ${notif.transactionName} بنجاح`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">سجل الإشعارات</h1>
        <p className="text-muted-foreground">تتبع المعاملات وحالة الإشعارات المرسلة.</p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start w-[200px]">التاريخ</TableHead>
              <TableHead className="text-start">اسم المعاملة</TableHead>
              <TableHead className="text-center w-[150px]">الحالة</TableHead>
              <TableHead className="text-end w-[150px]">إجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  لا توجد إشعارات حتى الآن
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-muted-foreground font-medium">
                    {format(row.date, "yyyy/MM/dd hh:mm a")}
                  </TableCell>
                  <TableCell>{row.transactionName}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-4 text-muted-foreground">
                      <Mail className={`h-5 w-5 ${row.emailSent ? "text-green-500" : "opacity-30"}`} />
                      <MessageCircle className={`h-5 w-5 ${row.whatsappSent ? "text-green-500" : "opacity-30"}`} />
                    </div>
                  </TableCell>
                  <TableCell className="text-end">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleSend(row)}
                      className="gap-2"
                    >
                      <Send className="h-3.5 w-3.5" />
                      إرسال الآن
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
