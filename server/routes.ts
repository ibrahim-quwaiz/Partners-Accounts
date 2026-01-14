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
      const periods = await storage.getPeriodsForProject(req.params.projectId);
      res.json(periods);
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

  app.post("/api/periods", async (req, res) => {
    try {
      const validated = insertPeriodSchema.parse(req.body);
      const period = await storage.createPeriod(validated);
      res.status(201).json(period);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create period" });
    }
  });

  app.patch("/api/periods/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !['ACTIVE', 'CLOSED'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const period = await storage.updatePeriodStatus(req.params.id, status);
      if (!period) {
        return res.status(404).json({ error: "Period not found" });
      }
      res.json(period);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update period" });
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
      const transaction = await storage.updateTransaction(req.params.id, req.body);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update transaction" });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTransaction(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Transaction not found" });
      }
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
