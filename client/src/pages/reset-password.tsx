import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { Briefcase, KeyRound, Loader2, ArrowRight, CheckCircle, XCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");
    
    if (!tokenParam) {
      setValidating(false);
      return;
    }
    
    setToken(tokenParam);
    
    const validateToken = async () => {
      try {
        const res = await fetch(`/api/auth/validate-token/${tokenParam}`);
        const data = await res.json();
        setTokenValid(data.valid);
      } catch {
        setTokenValid(false);
      } finally {
        setValidating(false);
      }
    };
    
    validateToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!newPassword || !confirmPassword) {
      setError("يرجى ملء جميع الحقول");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    
    if (newPassword.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await apiRequest("POST", "/api/auth/reset-password", {
        token,
        newPassword,
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "حدث خطأ أثناء إعادة التعيين");
      }
    } catch (e: any) {
      setError(e.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-background via-muted/50 to-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-2xl border-border/50">
          <CardContent className="pt-8 flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">جاري التحقق من الرابط...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token || !tokenValid) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-background via-muted/50 to-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-2xl border-border/50">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-lg">
              <XCircle className="h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-2xl">رابط غير صالح</CardTitle>
              <CardDescription className="mt-2">
                هذا الرابط غير صالح أو منتهي الصلاحية.
                <br />
                يرجى طلب رابط إعادة تعيين جديد.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full h-11 gap-2 text-base"
              onClick={() => setLocation("/")}
              data-testid="button-go-login"
            >
              <ArrowRight className="h-4 w-4" />
              الذهاب لتسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-background via-muted/50 to-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-2xl border-border/50">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-green-500 flex items-center justify-center text-white shadow-lg">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-2xl">تم بنجاح!</CardTitle>
              <CardDescription className="mt-2">
                تم إعادة تعيين كلمة المرور بنجاح.
                <br />
                يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full h-11 gap-2 text-base"
              onClick={() => setLocation("/")}
              data-testid="button-login-after-reset"
            >
              <ArrowRight className="h-4 w-4" />
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-background via-muted/50 to-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-2xl border-border/50">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
            <KeyRound className="h-8 w-8" />
          </div>
          <div>
            <CardTitle className="text-2xl">إعادة تعيين كلمة المرور</CardTitle>
            <CardDescription className="mt-2">
              أدخل كلمة المرور الجديدة
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
              <Input 
                id="new-password" 
                type="password"
                className="text-start h-11" 
                placeholder="أدخل كلمة المرور الجديدة"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                data-testid="input-new-password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
              <Input 
                id="confirm-password" 
                type="password"
                className="text-start h-11" 
                placeholder="أعد إدخال كلمة المرور"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                data-testid="input-confirm-password"
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
              disabled={loading}
              data-testid="button-reset-password"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              إعادة تعيين كلمة المرور
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
