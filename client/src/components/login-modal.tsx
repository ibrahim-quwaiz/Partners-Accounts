import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/lib/appContext";

export function LoginModal() {
  const { user, login } = useApp();
  const [error, setError] = useState("");
  
  const { register, handleSubmit } = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: any) => {
    const success = login(data.username, data.password);
    if (!success) {
      setError("اسم المستخدم أو كلمة المرور غير صحيحة");
    } else {
      setError("");
    }
  };

  return (
    <Dialog open={!user} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[400px] [&>button]:hidden" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl">تسجيل الدخول</DialogTitle>
          <DialogDescription className="text-center">
             الرجاء إدخال بيانات الاعتماد للمتابعة
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input id="username" className="text-start" {...register("username", { required: true })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input id="password" type="password" className="text-start" {...register("password", { required: true })} />
          </div>
          
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          
          <Button type="submit" className="w-full">دخول</Button>
          
          <div className="text-center text-xs text-muted-foreground mt-2">
            <p>مستخدمين للتجربة:</p>
            <p>admin / admin</p>
            <p>partner / partner</p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
