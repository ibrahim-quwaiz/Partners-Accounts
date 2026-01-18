import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/lib/appContext";
import { apiRequest } from "@/lib/queryClient";
import { Briefcase, LogIn, Loader2, ArrowRight } from "lucide-react";

type FormView = "login" | "forgot" | "forgot-success";

export function LoginModal() {
  const { user, login, isLoggingIn } = useApp();
  const [error, setError] = useState("");
  const [view, setView] = useState<FormView>("login");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  
  const { register, handleSubmit } = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: any) => {
    setError("");
    const result = await login(data.username, data.password);
    if (!result.success) {
      setError(result.error || "اسم المستخدم أو كلمة المرور غير صحيحة");
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      setError("يرجى إدخال البريد الإلكتروني");
      return;
    }
    
    setForgotLoading(true);
    setError("");
    
    try {
      const res = await apiRequest("POST", "/api/auth/forgot-password", { email: forgotEmail });
      const data = await res.json();
      
      if (res.ok) {
        setView("forgot-success");
      } else {
        setError(data.error || "حدث خطأ");
      }
    } catch (e: any) {
      setError(e.message || "حدث خطأ");
    } finally {
      setForgotLoading(false);
    }
  };

  if (user) return null;

  // Forgot Password View
  if (view === "forgot") {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-background via-muted/50 to-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-2xl border-border/50">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
              <Briefcase className="h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-2xl">استعادة كلمة المرور</CardTitle>
              <CardDescription className="mt-2">
                أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="forgot-email">البريد الإلكتروني</Label>
              <Input 
                id="forgot-email" 
                type="email"
                className="text-start h-11" 
                placeholder="أدخل بريدك الإلكتروني"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                data-testid="input-forgot-email"
              />
            </div>
            
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}
            
            <Button 
              onClick={handleForgotPassword} 
              className="w-full h-11 gap-2 text-base"
              disabled={forgotLoading}
              data-testid="button-send-reset"
            >
              {forgotLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              إرسال رابط إعادة التعيين
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full gap-2"
              onClick={() => { setView("login"); setError(""); }}
              data-testid="button-back-to-login"
            >
              <ArrowRight className="h-4 w-4" />
              العودة لتسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Forgot Success View
  if (view === "forgot-success") {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-background via-muted/50 to-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-2xl border-border/50">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-green-500 flex items-center justify-center text-white shadow-lg">
              <span className="text-3xl">✓</span>
            </div>
            <div>
              <CardTitle className="text-2xl">تم الإرسال</CardTitle>
              <CardDescription className="mt-2">
                إذا كان البريد مسجلاً، ستجد رابط إعادة التعيين في صندوق الوارد.
                <br />
                الرابط صالح لمدة ساعة واحدة.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full h-11 gap-2 text-base"
              onClick={() => { setView("login"); setError(""); setForgotEmail(""); }}
              data-testid="button-return-login"
            >
              <ArrowRight className="h-4 w-4" />
              العودة لتسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Login View
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
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input 
                id="username" 
                className="text-start h-11" 
                placeholder="أدخل اسم المستخدم"
                data-testid="input-username"
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
                data-testid="input-password"
                {...register("password", { required: true })} 
              />
            </div>
            
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-11 gap-2 text-base"
              disabled={isLoggingIn}
              data-testid="button-login"
            >
              {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              تسجيل الدخول
            </Button>
            
            <button
              type="button"
              onClick={() => { setView("forgot"); setError(""); }}
              className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
              data-testid="link-forgot-password"
            >
              نسيت كلمة المرور؟
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
