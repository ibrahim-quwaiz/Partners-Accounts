import { useEffect } from "react";
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
import { useApp, PartnerProfile } from "@/lib/appContext";

interface PartnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: PartnerProfile | null;
}

export function PartnerModal({ open, onOpenChange, partner }: PartnerModalProps) {
  const { updatePartner } = useApp();
  
  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      displayName: "",
      phone: "",
      email: "",
    },
  });

  useEffect(() => {
    if (partner) {
      setValue("displayName", partner.displayName);
      setValue("phone", partner.phone);
      setValue("email", partner.email || "");
    }
  }, [partner, setValue]);

  const onSubmit = (data: any) => {
    if (partner) {
      updatePartner(partner.id, data);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تعديل بيانات الشريك</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="displayName">اسم الشريك</Label>
            <Input id="displayName" className="text-start" {...register("displayName", { required: true })} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">رقم الجوال</Label>
            <Input id="phone" className="text-start" {...register("phone")} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" className="text-start" dir="ltr" {...register("email")} placeholder="example@email.com" />
          </div>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit">حفظ التغييرات</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
