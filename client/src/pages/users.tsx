import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, User } from "lucide-react";
import { useApp, PartnerProfile } from "@/lib/appContext";
import { PartnerModal } from "@/components/partner-modal";

export default function UsersPage() {
  const { partners } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerProfile | null>(null);

  const handleEdit = (partner: PartnerProfile) => {
    setEditingPartner(partner);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">إدارة المستخدمين</h1>
        <p className="text-muted-foreground">تعديل أسماء الشركاء وأرقام الاتصال.</p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-center">#</TableHead>
              <TableHead className="text-start">اسم الشريك</TableHead>
              <TableHead className="text-start">رقم الجوال</TableHead>
              <TableHead className="text-end w-[100px]">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <User className="h-4 w-4" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{p.displayName}</TableCell>
                <TableCell className="text-muted-foreground font-mono">{p.phone}</TableCell>
                <TableCell className="text-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleEdit(p)}
                  >
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">تعديل</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PartnerModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        partner={editingPartner} 
      />
    </div>
  );
}
