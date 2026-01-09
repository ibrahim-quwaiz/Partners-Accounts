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
import { Badge } from "@/components/ui/badge";
import { Edit2, User, Shield, FileEdit } from "lucide-react";
import { useApp, PartnerProfile } from "@/lib/appContext";
import { PartnerModal } from "@/components/partner-modal";

// Extended user data with roles for display
const MOCK_USERS = [
  { id: "P1", displayName: "الشريك 1", email: "partner1@example.com", phone: "0500000001", role: "ADMIN" as const },
  { id: "P2", displayName: "الشريك 2", email: "partner2@example.com", phone: "0500000002", role: "TX_ONLY" as const },
];

type UserRole = "ADMIN" | "TX_ONLY";

interface UserDisplay {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  role: UserRole;
}

export default function UsersPage() {
  const { partners, updatePartner } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerProfile | null>(null);
  
  // Merge partner data with mock user data
  const users: UserDisplay[] = MOCK_USERS.map(u => {
    const partner = partners.find(p => p.id === u.id);
    return {
      ...u,
      displayName: partner?.displayName || u.displayName,
      phone: partner?.phone || u.phone,
    };
  });

  const handleEdit = (user: UserDisplay) => {
    const partner = partners.find(p => p.id === user.id);
    if (partner) {
      setEditingPartner(partner);
      setIsModalOpen(true);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    if (role === "ADMIN") {
      return (
        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
          <Shield className="h-3 w-3 me-1" />
          مدير
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-muted">
        <FileEdit className="h-3 w-3 me-1" />
        معاملات فقط
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">إدارة المستخدمين</h1>
        <p className="text-muted-foreground">عرض وتعديل بيانات الشركاء والمستخدمين</p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] text-center">#</TableHead>
              <TableHead className="text-start">الاسم</TableHead>
              <TableHead className="text-start">البريد الإلكتروني</TableHead>
              <TableHead className="text-start">رقم الجوال</TableHead>
              <TableHead className="text-center w-[140px]">الدور</TableHead>
              <TableHead className="text-end w-[100px]">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User className="h-4 w-4" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{user.displayName}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm">{user.phone}</TableCell>
                <TableCell className="text-center">
                  {getRoleBadge(user.role)}
                </TableCell>
                <TableCell className="text-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleEdit(user)}
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
