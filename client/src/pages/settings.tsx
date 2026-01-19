import { useState, useEffect } from "react";
import { useApp } from "@/lib/appContext";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { KeyRound, Loader2, User, Mail, CheckCircle, Phone, Save, Edit2 } from "lucide-react";

export default function SettingsPage() {
  const { user, setUser } = useApp();
  
  // Profile edit state
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    if (user) {
      setPhone(user.phone || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setProfileError("");
    setProfileSuccess(false);
    setProfileLoading(true);
    
    try {
      const res = await apiRequest("PATCH", `/api/partners/${user?.id}`, {
        phone,
        email,
      });
      const data = await res.json();
      
      if (res.ok) {
        setProfileSuccess(true);
        setIsEditing(false);
        // Update local user state
        if (setUser && user) {
          setUser({ ...user, phone, email });
        }
      } else {
        setProfileError(data.error || "حدث خطأ أثناء حفظ البيانات");
      }
    } catch (e: any) {
      setProfileError(e.message || "حدث خطأ");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("يرجى ملء جميع الحقول");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("كلمتا المرور الجديدة غير متطابقتين");
      return;
    }
    
    if (newPassword.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await apiRequest("POST", "/api/auth/change-password", {
        partnerId: user?.id,
        currentPassword,
        newPassword,
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data.error || "حدث خطأ أثناء تغيير كلمة المرور");
      }
    } catch (e: any) {
      setError(e.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">الإعدادات</h1>
        <p className="text-muted-foreground">إدارة حسابك وتفضيلاتك</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                معلومات الحساب
              </CardTitle>
              <CardDescription>بيانات حسابك الأساسية</CardDescription>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2"
                data-testid="button-edit-profile"
              >
                <Edit2 className="h-4 w-4" />
                تعديل
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">اسم المستخدم</Label>
                  <p className="font-medium">{user?.username}</p>
                  <p className="text-xs text-muted-foreground">لا يمكن تغييره</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">الاسم</Label>
                  <p className="font-medium">{user?.displayName}</p>
                  <p className="text-xs text-muted-foreground">لا يمكن تغييره</p>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="phone">رقم الجوال</Label>
                <Input
                  id="phone"
                  type="tel"
                  className="text-start max-w-md"
                  placeholder="أدخل رقم الجوال"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  data-testid="input-phone"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  className="text-start max-w-md"
                  placeholder="أدخل البريد الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                />
              </div>
              
              {profileError && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg max-w-md">
                  {profileError}
                </div>
              )}
              
              {profileSuccess && (
                <div className="bg-green-500/10 text-green-600 text-sm p-3 rounded-lg max-w-md flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  تم حفظ التغييرات بنجاح
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveProfile}
                  disabled={profileLoading}
                  className="gap-2"
                  data-testid="button-save-profile"
                >
                  {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  حفظ التغييرات
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setPhone(user?.phone || "");
                    setEmail(user?.email || "");
                    setProfileError("");
                  }}
                  data-testid="button-cancel-edit"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">اسم المستخدم</Label>
                <p className="font-medium">{user?.username}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">الاسم</Label>
                <p className="font-medium">{user?.displayName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">رقم الجوال</Label>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {user?.phone || "غير محدد"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">البريد الإلكتروني</Label>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {user?.email || "غير محدد"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">الصلاحية</Label>
                <p className="font-medium">
                  {user?.role === "ADMIN" ? "مدير" : "مستخدم عادي"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            تغيير كلمة المرور
          </CardTitle>
          <CardDescription>قم بتحديث كلمة المرور الخاصة بك</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password">كلمة المرور الحالية</Label>
              <Input 
                id="current-password" 
                type="password"
                className="text-start max-w-md" 
                placeholder="أدخل كلمة المرور الحالية"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                data-testid="input-current-password"
              />
            </div>
            
            <Separator className="my-4" />
            
            <div className="grid gap-2">
              <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
              <Input 
                id="new-password" 
                type="password"
                className="text-start max-w-md" 
                placeholder="أدخل كلمة المرور الجديدة"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                data-testid="input-settings-new-password"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="confirm-new-password">تأكيد كلمة المرور الجديدة</Label>
              <Input 
                id="confirm-new-password" 
                type="password"
                className="text-start max-w-md" 
                placeholder="أعد إدخال كلمة المرور الجديدة"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                data-testid="input-settings-confirm-password"
              />
            </div>
            
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg max-w-md">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-500/10 text-green-600 text-sm p-3 rounded-lg max-w-md flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                تم تغيير كلمة المرور بنجاح
              </div>
            )}
            
            <Button 
              type="submit"
              className="gap-2"
              disabled={loading}
              data-testid="button-change-password"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              تغيير كلمة المرور
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
