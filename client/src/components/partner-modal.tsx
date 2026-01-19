import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp, PartnerProfile } from "@/lib/appContext";
import { Eye, EyeOff } from "lucide-react";

interface PartnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: PartnerProfile | null;
}

export function PartnerModal({ open, onOpenChange, partner }: PartnerModalProps) {
  const { updatePartner, user } = useApp();
  const isAdmin = user?.role === "ADMIN";
  const isEditingSelf = partner?.id === user?.id;
  const [showPassword, setShowPassword] = useState(false);
  
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      displayName: "",
      phone: "",
      email: "",
      username: "",
      password: "",
      role: "TX_ONLY" as "ADMIN" | "TX_ONLY",
    },
  });

  const role = watch("role");

  useEffect(() => {
    if (partner) {
      setValue("displayName", partner.displayName);
      setValue("phone", partner.phone);
      setValue("email", partner.email || "");
      setValue("username", partner.username || "");
      setValue("password", "");
      setValue("role", partner.role || "TX_ONLY");
    }
  }, [partner, setValue]);

  const onSubmit = (data: any) => {
    if (partner) {
      const updates: any = {};
      
      updates.displayName = data.displayName;
      updates.phone = data.phone;
      updates.email = data.email;
      updates.username = data.username;
      
      if (data.password && data.password.trim() !== "") {
        updates.password = data.password;
      }
      
      if (isAdmin) {
        updates.role = data.role;
      }
      
      updatePartner(partner.id, updates);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditingSelf ? "تعديل بياناتي" : "تعديل بيانات الشريك"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input 
              id="username" 
              className="text-start" 
              dir="ltr"
              {...register("username", { required: true })} 
              data-testid="input-partner-username"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="displayName">الاسم</Label>
            <Input 
              id="displayName" 
              className="text-start" 
              {...register("displayName", { required: true })} 
              data-testid="input-partner-displayname"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">كلمة المرور الجديدة</Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"}
                className="text-start pe-10" 
                dir="ltr"
                placeholder="اتركها فارغة للإبقاء على كلمة المرور الحالية"
                {...register("password")} 
                data-testid="input-partner-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute start-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">اتركها فارغة إذا لم ترغب في تغيير كلمة المرور</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">رقم الجوال</Label>
            <Input 
              id="phone" 
              className="text-start" 
              {...register("phone")} 
              data-testid="input-partner-phone"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input 
              id="email" 
              type="email" 
              className="text-start" 
              dir="ltr" 
              {...register("email")} 
              placeholder="example@email.com" 
              data-testid="input-partner-email"
            />
          </div>

          {isAdmin && (
            <div className="grid gap-2">
              <Label htmlFor="role">الصلاحية</Label>
              <Select 
                value={role} 
                onValueChange={(value) => setValue("role", value as "ADMIN" | "TX_ONLY")}
              >
                <SelectTrigger data-testid="select-partner-role">
                  <SelectValue placeholder="اختر الصلاحية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">مدير (كامل الصلاحيات)</SelectItem>
                  <SelectItem value="TX_ONLY">معاملات فقط</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-partner">
              إلغاء
            </Button>
            <Button type="submit" data-testid="button-save-partner">حفظ التغييرات</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
