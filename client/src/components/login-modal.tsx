import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/lib/appContext";
import { Briefcase, LogIn } from "lucide-react";

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

  if (user) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-background via-muted/50 to-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-2xl border-border/50">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
            <Briefcase className="h-8 w-8" />
          </div>
          <div>
            <CardTitle className="text-2xl">دفتر الشركاء</CardTitle>
            <CardDescription className="mt-2">
              الرجاء إدخال بيانات الاعتماد للمتابعة
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="username">اسم المستخدم / البريد الإلكتروني</Label>
              <Input 
                id="username" 
                className="text-start h-11" 
                placeholder="أدخل اسم المستخدم"
                {...register("username", { required: true })} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input 
                id="password" 
                type="password" 
                className="text-start h-11" 
                placeholder="أدخل كلمة المرور"
                {...register("password", { required: true })} 
              />
            </div>
            
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}
            
            <Button type="submit" className="w-full h-11 gap-2 text-base">
              <LogIn className="h-4 w-4" />
              تسجيل الدخول
            </Button>
            
            <div className="text-center text-xs text-muted-foreground mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="font-medium mb-1">بيانات تجريبية:</p>
              <p>admin / admin</p>
              <p>partner / partner</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
