import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProjectSchema,
  insertPeriodSchema,
  insertUserProfileSchema,
  insertTransactionSchema,
  insertNotificationSchema,
  insertEventLogSchema,
  insertPartnerSchema,
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // =====================================================
  // PROJECTS
  // =====================================================
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
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
  // PERIODS
  // =====================================================
  app.get("/api/projects/:projectId/periods", async (req, res) => {
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

  app.get("/api/periods/:id", async (req, res) => {
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

  app.post("/api/projects/:projectId/periods/reset", async (req, res) => {
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

  app.patch("/api/periods/:id/close", async (req, res) => {
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

  // Name a PENDING_NAME period and activate it
  app.patch("/api/periods/:id/name", async (req, res) => {
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
  // TRANSACTIONS
  // =====================================================
  app.get("/api/periods/:periodId/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactionsForPeriod(req.params.periodId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/projects/:projectId/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactionsForProject(req.params.projectId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/transactions/:id", async (req, res) => {
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

  app.post("/api/transactions", async (req, res) => {
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
      
      const transaction = await storage.createTransaction(validated);
      
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

  app.patch("/api/transactions/:id", async (req, res) => {
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

  app.delete("/api/transactions/:id", async (req, res) => {
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
  // NOTIFICATIONS
  // =====================================================
  app.get("/api/notifications", async (req, res) => {
    try {
      const notifications = await storage.getAllNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/status", async (req, res) => {
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

  app.post("/api/notifications/:id/send", async (req, res) => {
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
  // EVENT LOGS
  // =====================================================
  app.get("/api/projects/:projectId/events", async (req, res) => {
    try {
      const events = await storage.getEventLogsForProject(req.params.projectId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/periods/:periodId/events", async (req, res) => {
    try {
      const events = await storage.getEventLogsForPeriod(req.params.periodId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getAllEventLogs();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // =====================================================
  // PARTNERS
  // =====================================================
  app.get("/api/partners", async (req, res) => {
    try {
      const partners = await storage.getAllPartners();
      res.json(partners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch partners" });
    }
  });

  app.get("/api/partners/:id", async (req, res) => {
    try {
      const id = req.params.id as 'P1' | 'P2';
      const partner = await storage.getPartner(id);
      if (!partner) {
        return res.status(404).json({ error: "Partner not found" });
      }
      res.json(partner);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch partner" });
    }
  });

  app.patch("/api/partners/:id", async (req, res) => {
    try {
      const id = req.params.id as 'P1' | 'P2';
      const partner = await storage.updatePartner(id, req.body);
      if (!partner) {
        return res.status(404).json({ error: "Partner not found" });
      }
      res.json(partner);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update partner" });
    }
  });

  // =====================================================
  // USERS
  // =====================================================
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't send passwords to frontend
      const sanitized = users.map(({ password, ...user }) => user);
      res.json(sanitized);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      // Don't allow password updates through this endpoint
      const { password, ...updates } = req.body;
      const user = await storage.updateUserProfile(req.params.id, updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...sanitized } = user;
      res.json(sanitized);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update user" });
    }
  });

  return httpServer;
}
