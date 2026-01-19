import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { 
  insertProjectSchema,
  insertPeriodSchema,
  insertTransactionSchema,
  insertNotificationSchema,
  insertEventLogSchema,
  insertPartnerSchema,
} from "@shared/schema";

function logAccessDenied(userId: 'P1' | 'P2' | undefined, displayName: string | undefined, method: string, path: string, reason: string) {
  if (userId) {
    storage.createEventLog({
      partnerId: userId,
      eventType: 'ACCESS_DENIED',
      message: `محاولة وصول مرفوضة من ${displayName || userId} إلى: ${method} ${path} - ${reason}`,
      metadata: null,
      projectId: null,
      periodId: null,
      transactionId: null,
    }).catch(console.error);
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ error: "يرجى تسجيل الدخول" });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ error: "يرجى تسجيل الدخول" });
  }
  if (req.session.user.role !== 'ADMIN') {
    logAccessDenied(req.session.user.id, req.session.user.displayName, req.method, req.path, 'يتطلب صلاحية مسؤول');
    return res.status(403).json({ error: "ليس لديك صلاحية لهذه العملية" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // =====================================================
  // PROJECTS (require auth)
  // =====================================================
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  // =====================================================
  // PERIODS (require auth for read, ADMIN only for management)
  // =====================================================
  app.get("/api/projects/:projectId/periods", requireAuth, async (req, res) => {
    try {
      const projectId = req.params.projectId;
      let periodsList = await storage.getPeriodsForProject(projectId);
      
      // First-run initialization: create "الفترة الافتتاحية" if no periods exist
      if (periodsList.length === 0) {
        const today = new Date().toISOString().split('T')[0];
        const newPeriod = await storage.createPeriod({
          projectId,
          name: 'الفترة الافتتاحية',
          startDate: today,
          status: 'ACTIVE',
          p1BalanceStart: '0',
          p2BalanceStart: '0',
        });
        periodsList = [newPeriod];
      }
      
      res.json(periodsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch periods" });
    }
  });

  app.get("/api/periods/:id", requireAuth, async (req, res) => {
    try {
      const period = await storage.getPeriod(req.params.id);
      if (!period) {
        return res.status(404).json({ error: "Period not found" });
      }
      res.json(period);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch period" });
    }
  });

  app.post("/api/projects/:projectId/periods/reset", requireAdmin, async (req, res) => {
    try {
      const { projectId } = req.params;
      const period = await storage.resetPeriodsForProject(projectId);
      res.status(201).json(period);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "فشل في تهيئة الفترة الافتتاحية" });
    }
  });

  // Disabled: Periods are created automatically via close flow only
  app.post("/api/projects/:projectId/periods/open", async (req, res) => {
    return res.status(400).json({ error: "لا يمكن فتح فترات يدوياً. يتم إنشاء الفترات تلقائياً عند إقفال الفترة الحالية." });
  });

  app.patch("/api/periods/:id/close", requireAdmin, async (req, res) => {
    try {
      const period = await storage.closePeriodWithBalances(req.params.id);
      res.json(period);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "فشل في إغلاق الفترة" });
    }
  });

  // Disabled: Periods are created automatically via close flow only
  app.post("/api/periods", async (req, res) => {
    return res.status(400).json({ error: "لا يمكن إنشاء فترات يدوياً. يتم إنشاء الفترات تلقائياً." });
  });

  // Disabled: Period status can only be changed via close/name flow
  app.patch("/api/periods/:id/status", async (req, res) => {
    return res.status(400).json({ error: "لا يمكن تغيير حالة الفترة يدوياً. استخدم إقفال الفترة أو تسميتها." });
  });

  // Name a PENDING_NAME period and activate it (ADMIN only)
  app.patch("/api/periods/:id/name", requireAdmin, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: "يجب إدخال اسم للفترة" });
      }
      
      const period = await storage.getPeriod(req.params.id);
      if (!period) {
        return res.status(404).json({ error: "الفترة غير موجودة" });
      }
      
      if (period.status !== 'PENDING_NAME') {
        return res.status(400).json({ error: "يمكن تسمية الفترات الجديدة فقط" });
      }
      
      const updated = await storage.namePendingPeriod(req.params.id, name.trim());
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "فشل في تسمية الفترة" });
    }
  });

  // =====================================================
  // TRANSACTIONS (require auth)
  // =====================================================
  app.get("/api/periods/:periodId/transactions", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getTransactionsForPeriod(req.params.periodId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/projects/:projectId/transactions", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getTransactionsForProject(req.params.projectId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/transactions/:id", requireAuth, async (req, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transaction" });
    }
  });

  app.post("/api/transactions", requireAuth, async (req, res) => {
    try {
      const validated = insertTransactionSchema.parse(req.body);
      
      // Validate period is ACTIVE
      const period = await storage.getPeriod(validated.periodId);
      if (!period) {
        return res.status(400).json({ error: "الفترة غير موجودة" });
      }
      if (period.status !== 'ACTIVE') {
        return res.status(400).json({ error: "لا يمكن إضافة معاملات إلا للفترات المفتوحة" });
      }
      
      // Set createdBy from session
      const txData = {
        ...validated,
        createdBy: req.session.user!.id as 'P1' | 'P2',
      };
      
      const transaction = await storage.createTransaction(txData);
      
      // Auto-create notification for this transaction
      await storage.createNotification({
        transactionId: transaction.id,
        status: 'PENDING',
        lastError: null,
        sentEmailAt: null,
        sentWhatsappAt: null,
      });
      
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create transaction" });
    }
  });

  app.patch("/api/transactions/:id", requireAuth, async (req, res) => {
    try {
      const existingTx = await storage.getTransaction(req.params.id);
      if (!existingTx) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      // Validate period is ACTIVE
      const period = await storage.getPeriod(existingTx.periodId);
      if (!period || period.status !== 'ACTIVE') {
        return res.status(400).json({ error: "لا يمكن تعديل معاملات الفترات المغلقة" });
      }
      
      const transaction = await storage.updateTransaction(req.params.id, req.body);
      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update transaction" });
    }
  });

  app.delete("/api/transactions/:id", requireAuth, async (req, res) => {
    try {
      const existingTx = await storage.getTransaction(req.params.id);
      if (!existingTx) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      // Validate period is ACTIVE
      const period = await storage.getPeriod(existingTx.periodId);
      if (!period || period.status !== 'ACTIVE') {
        return res.status(400).json({ error: "لا يمكن حذف معاملات الفترات المغلقة" });
      }
      
      const deleted = await storage.deleteTransaction(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to delete transaction" });
    }
  });

  // =====================================================
  // NOTIFICATIONS (require auth)
  // =====================================================
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getAllNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/status", requireAuth, async (req, res) => {
    try {
      const { status, error } = req.body;
      if (!status || !['PENDING', 'SENT', 'FAILED'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const notification = await storage.updateNotificationStatus(req.params.id, status, error);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update notification" });
    }
  });

  app.post("/api/notifications/:id/send", requireAuth, async (req, res) => {
    try {
      const { sendNotification } = await import('./services/notifications');
      
      const allNotifs = await storage.getAllNotifications();
      const notification = allNotifs.find(n => n.id === req.params.id);
      if (!notification) {
        return res.status(404).json({ error: "الإشعار غير موجود" });
      }
      
      const transaction = await storage.getTransaction(notification.transactionId);
      if (!transaction) {
        return res.status(404).json({ error: "المعاملة غير موجودة" });
      }

      const partners = await storage.getAllPartners();
      
      let senderName: string;
      let receiverPartner: typeof partners[0] | undefined;
      
      if (transaction.type === 'SETTLEMENT') {
        const sender = partners.find(p => p.id === transaction.fromPartner);
        receiverPartner = partners.find(p => p.id === transaction.toPartner);
        senderName = sender?.displayName || 'غير محدد';
      } else {
        const payer = partners.find(p => p.id === transaction.paidBy);
        receiverPartner = partners.find(p => p.id !== transaction.paidBy);
        senderName = payer?.displayName || 'غير محدد';
      }
      
      if (!receiverPartner) {
        return res.status(400).json({ error: "بيانات الشركاء غير مكتملة" });
      }

      const typeAr = transaction.type === 'EXPENSE' ? 'مصروف' : 
                     transaction.type === 'REVENUE' ? 'إيراد' : 'تسوية';
      
      const roleLabel = transaction.type === 'SETTLEMENT' ? 'المُرسل' : 'المسدد';
      
      const messageBody = `📢 إشعار معاملة جديدة

النوع: ${typeAr}
الوصف: ${transaction.description}
المبلغ: ${transaction.amount} ر.س
${roleLabel}: ${senderName}
التاريخ: ${transaction.date}`;

      const emailParams = receiverPartner.email ? {
        to: receiverPartner.email,
        subject: `إشعار معاملة: ${transaction.description}`,
        text: messageBody,
        html: `<div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>إشعار معاملة جديدة</h2>
          <p><strong>النوع:</strong> ${typeAr}</p>
          <p><strong>الوصف:</strong> ${transaction.description}</p>
          <p><strong>المبلغ:</strong> ${transaction.amount} ر.س</p>
          <p><strong>${roleLabel}:</strong> ${senderName}</p>
          <p><strong>التاريخ:</strong> ${transaction.date}</p>
        </div>`,
      } : null;

      const whatsappParams = receiverPartner.phone ? {
        to: receiverPartner.phone,
        body: messageBody,
      } : null;

      const result = await sendNotification(emailParams, whatsappParams);
      
      const emailSentAt = result.emailSent ? new Date() : null;
      const whatsappSentAt = result.whatsappSent ? new Date() : null;
      const newStatus = (result.emailSent || result.whatsappSent) ? 'SENT' : 'FAILED';
      const errorMsg = result.emailError || result.whatsappError || null;
      
      await storage.updateNotificationWithDetails(
        req.params.id, 
        newStatus, 
        emailSentAt, 
        whatsappSentAt, 
        errorMsg
      );

      res.json({
        success: result.emailSent || result.whatsappSent,
        emailSent: result.emailSent,
        whatsappSent: result.whatsappSent,
        error: errorMsg,
      });
    } catch (error: any) {
      console.error('Send notification error:', error);
      res.status(500).json({ error: error.message || "فشل في إرسال الإشعار" });
    }
  });

  // =====================================================
  // EVENT LOGS (require auth)
  // =====================================================
  app.get("/api/projects/:projectId/events", requireAuth, async (req, res) => {
    try {
      const events = await storage.getEventLogsForProject(req.params.projectId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/periods/:periodId/events", requireAuth, async (req, res) => {
    try {
      const events = await storage.getEventLogsForPeriod(req.params.periodId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events", requireAuth, async (req, res) => {
    try {
      const events = await storage.getAllEventLogs();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // =====================================================
  // PARTNERS (user management)
  // =====================================================
  
  // Basic partner list for name display (all authenticated users)
  app.get("/api/partners", requireAuth, async (req, res) => {
    try {
      const partners = await storage.getAllPartners();
      // Return only id, displayName, phone, email for non-admins (no password, username)
      if (req.session.user!.role !== 'ADMIN') {
        const sanitized = partners.map(p => ({
          id: p.id,
          displayName: p.displayName,
          phone: p.phone,
          email: p.email,
        }));
        return res.json(sanitized);
      }
      // ADMIN gets full data except password
      const sanitized = partners.map(({ password, ...rest }) => rest);
      res.json(sanitized);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch partners" });
    }
  });

  app.get("/api/partners/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id as 'P1' | 'P2';
      const user = req.session.user!;
      
      // Users can only view their own profile, ADMIN can view all
      if (user.role !== 'ADMIN' && user.id !== id) {
        logAccessDenied(user.id, user.displayName, req.method, req.path, 'محاولة عرض بيانات مستخدم آخر');
        return res.status(403).json({ error: "ليس لديك صلاحية لهذه العملية" });
      }
      
      const partner = await storage.getPartner(id);
      if (!partner) {
        return res.status(404).json({ error: "Partner not found" });
      }
      
      // Sanitize response - never return password
      const { password, ...sanitized } = partner;
      
      // Non-admins viewing their own profile get limited data
      if (user.role !== 'ADMIN') {
        const limitedData = {
          id: partner.id,
          displayName: partner.displayName,
          phone: partner.phone,
          email: partner.email,
          username: partner.username,
          role: partner.role,
        };
        return res.json(limitedData);
      }
      
      res.json(sanitized);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch partner" });
    }
  });

  app.patch("/api/partners/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id as 'P1' | 'P2';
      const user = req.session.user!;
      
      // Users can only update their own profile
      if (user.role !== 'ADMIN' && user.id !== id) {
        logAccessDenied(user.id, user.displayName, req.method, req.path, 'محاولة تعديل بيانات مستخدم آخر');
        return res.status(403).json({ error: "ليس لديك صلاحية لهذه العملية" });
      }
      
      // TX_ONLY users can only update phone and email
      let updates: Partial<{ displayName: string; phone: string; email: string; username: string; password: string; role: 'ADMIN' | 'TX_ONLY' }>;
      if (user.role !== 'ADMIN') {
        updates = {
          phone: req.body.phone,
          email: req.body.email,
        };
        // Remove undefined values
        Object.keys(updates).forEach(key => {
          if (updates[key as keyof typeof updates] === undefined) {
            delete updates[key as keyof typeof updates];
          }
        });
      } else {
        // ADMIN can update all fields including username, password, and role
        const roleValue = req.body.role as 'ADMIN' | 'TX_ONLY' | undefined;
        updates = {
          displayName: req.body.displayName,
          phone: req.body.phone,
          email: req.body.email,
          username: req.body.username,
          role: roleValue,
        };
        
        // Handle password - hash if provided
        if (req.body.password && req.body.password.trim() !== '') {
          updates.password = await bcrypt.hash(req.body.password, 10);
        }
        
        Object.keys(updates).forEach(key => {
          if (updates[key as keyof typeof updates] === undefined) {
            delete updates[key as keyof typeof updates];
          }
        });
      }
      
      const partner = await storage.updatePartner(id, updates);
      if (!partner) {
        return res.status(404).json({ error: "Partner not found" });
      }
      res.json(partner);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update partner" });
    }
  });

  // =====================================================
  // AUTHENTICATION
  // =====================================================
  
  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "يرجى إدخال اسم المستخدم وكلمة السر" });
      }
      
      const partner = await storage.getPartnerByUsername(username);
      if (!partner || !partner.password) {
        return res.status(401).json({ error: "اسم المستخدم أو كلمة السر غير صحيحة" });
      }
      
      // Check if password is hashed (starts with $2b$)
      const isHashed = partner.password.startsWith('$2b$');
      let isValid = false;
      
      if (isHashed) {
        isValid = await bcrypt.compare(password, partner.password);
      } else {
        // Legacy plain text password - migrate to hash
        isValid = password === partner.password;
        if (isValid) {
          const hashedPassword = await bcrypt.hash(password, 10);
          await storage.updatePartner(partner.id, { password: hashedPassword });
        }
      }
      
      if (!isValid) {
        return res.status(401).json({ error: "اسم المستخدم أو كلمة السر غير صحيحة" });
      }
      
      // Save session
      req.session.user = {
        id: partner.id,
        username: partner.username!,
        displayName: partner.displayName,
        role: partner.role as 'ADMIN' | 'TX_ONLY',
      };
      
      // Log login event
      await storage.createEventLog({
        partnerId: partner.id,
        eventType: 'USER_LOGIN',
        message: `تم تسجيل الدخول: ${partner.displayName}`,
        metadata: null,
        projectId: null,
        periodId: null,
        transactionId: null,
      });
      
      const { password: _, ...sanitized } = partner;
      res.json({ user: sanitized, message: "تم تسجيل الدخول بنجاح" });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: "حدث خطأ أثناء تسجيل الدخول" });
    }
  });
  
  // Get current session
  app.get("/api/auth/session", (req, res) => {
    if (req.session.user) {
      res.json({ user: req.session.user });
    } else {
      res.json({ user: null });
    }
  });
  
  // Logout
  app.post("/api/auth/logout", (req, res) => {
    const userName = req.session.user?.displayName;
    const userId = req.session.user?.id;
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: "حدث خطأ أثناء تسجيل الخروج" });
      }
      
      // Log logout event
      if (userId) {
        storage.createEventLog({
          partnerId: userId,
          eventType: 'USER_LOGOUT',
          message: `تم تسجيل الخروج: ${userName}`,
          metadata: null,
          projectId: null,
          periodId: null,
          transactionId: null,
        }).catch(console.error);
      }
      
      res.clearCookie('connect.sid');
      res.json({ message: "تم تسجيل الخروج بنجاح" });
    });
  });
  
  // Change Password
  app.post("/api/auth/change-password", async (req, res) => {
    try {
      const { partnerId, currentPassword, newPassword } = req.body;
      
      if (!partnerId || !currentPassword || !newPassword) {
        return res.status(400).json({ error: "يرجى إدخال جميع الحقول المطلوبة" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "كلمة السر الجديدة يجب أن تكون 6 أحرف على الأقل" });
      }
      
      const partner = await storage.getPartner(partnerId);
      if (!partner || !partner.password) {
        return res.status(404).json({ error: "المستخدم غير موجود" });
      }
      
      // Verify current password
      const isHashed = partner.password.startsWith('$2b$');
      let isValid = false;
      
      if (isHashed) {
        isValid = await bcrypt.compare(currentPassword, partner.password);
      } else {
        isValid = currentPassword === partner.password;
      }
      
      if (!isValid) {
        return res.status(401).json({ error: "كلمة السر الحالية غير صحيحة" });
      }
      
      // Hash and save new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updatePartner(partnerId, { password: hashedPassword });
      
      res.json({ message: "تم تغيير كلمة السر بنجاح" });
    } catch (error: any) {
      console.error('Change password error:', error);
      res.status(500).json({ error: "حدث خطأ أثناء تغيير كلمة السر" });
    }
  });
  
  // Forgot Password - Request reset link
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "يرجى إدخال البريد الإلكتروني" });
      }
      
      const partner = await storage.getPartnerByEmail(email);
      if (!partner) {
        // Don't reveal if email exists or not for security
        return res.json({ message: "إذا كان البريد مسجلاً، سيتم إرسال رابط إعادة التعيين" });
      }
      
      // Generate reset token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      await storage.createResetToken({
        partnerId: partner.id,
        token,
        expiresAt,
      });
      
      // Send email via SendGrid
      const { sendEmail } = await import('./services/notifications');
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
      
      await sendEmail({
        to: email,
        subject: "إعادة تعيين كلمة السر - نظام المحاسبة",
        text: `لإعادة تعيين كلمة السر، انقر على الرابط التالي:\n\n${resetUrl}\n\nهذا الرابط صالح لمدة ساعة واحدة.`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>إعادة تعيين كلمة السر</h2>
            <p>لإعادة تعيين كلمة السر، انقر على الرابط التالي:</p>
            <p><a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">إعادة تعيين كلمة السر</a></p>
            <p style="color: #666; margin-top: 20px;">هذا الرابط صالح لمدة ساعة واحدة.</p>
            <p style="color: #999; font-size: 12px;">إذا لم تطلب إعادة تعيين كلمة السر، يمكنك تجاهل هذا البريد.</p>
          </div>
        `,
      });
      
      res.json({ message: "تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني" });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: "حدث خطأ أثناء إرسال رابط إعادة التعيين" });
    }
  });
  
  // Reset Password - Using token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: "يرجى إدخال جميع الحقول المطلوبة" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "كلمة السر الجديدة يجب أن تكون 6 أحرف على الأقل" });
      }
      
      const resetToken = await storage.getValidResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ error: "الرابط غير صالح أو منتهي الصلاحية" });
      }
      
      // Hash and save new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updatePartner(resetToken.partnerId, { password: hashedPassword });
      
      // Mark token as used
      await storage.markTokenUsed(resetToken.id);
      
      res.json({ message: "تم إعادة تعيين كلمة السر بنجاح" });
    } catch (error: any) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: "حدث خطأ أثناء إعادة تعيين كلمة السر" });
    }
  });
  
  // Validate reset token
  app.get("/api/auth/validate-token/:token", async (req, res) => {
    try {
      const resetToken = await storage.getValidResetToken(req.params.token);
      res.json({ valid: !!resetToken });
    } catch (error) {
      res.json({ valid: false });
    }
  });

  return httpServer;
}
