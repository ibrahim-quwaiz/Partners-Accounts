import { eq, and, desc, lt, isNull } from "drizzle-orm";
import { db } from "./db";
import {
  projects,
  periods,
  userProfiles,
  transactions,
  notifications,
  eventLogs,
  partners,
  periodPartnerBalances,
  resetTokens,
  type Project,
  type Period,
  type UserProfile,
  type Transaction,
  type Notification,
  type EventLog,
  type Partner,
  type Balance,
  type ResetToken,
  type InsertProject,
  type InsertPeriod,
  type InsertUserProfile,
  type InsertTransaction,
  type InsertNotification,
  type InsertEventLog,
  type InsertPartner,
  type InsertBalance,
  type InsertResetToken,
} from "@shared/schema";

export interface IStorage {
  // Projects
  getAllProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  
  // Periods
  getPeriodsForProject(projectId: string): Promise<Period[]>;
  getPeriod(id: string): Promise<Period | undefined>;
  createPeriod(period: InsertPeriod): Promise<Period>;
  updatePeriodStatus(id: string, status: 'ACTIVE' | 'CLOSED'): Promise<Period | undefined>;
  getLastClosedPeriod(projectId: string): Promise<Period | undefined>;
  getOpenPeriodForProject(projectId: string): Promise<Period | undefined>;
  closePeriodWithBalances(id: string): Promise<Period>;
  resetPeriodsForProject(projectId: string): Promise<Period>;
  namePendingPeriod(id: string, name: string): Promise<Period>;
  
  // Users
  getUserProfile(id: string): Promise<UserProfile | undefined>;
  getUserByUsername(username: string): Promise<UserProfile | undefined>;
  createUserProfile(user: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | undefined>;
  getAllUsers(): Promise<UserProfile[]>;
  
  // Transactions
  getTransactionsForPeriod(periodId: string): Promise<Transaction[]>;
  getTransactionsForProject(projectId: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(tx: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string): Promise<boolean>;
  
  // Notifications
  getNotificationsForTransaction(txId: string): Promise<Notification[]>;
  getAllNotifications(): Promise<Notification[]>;
  createNotification(notif: InsertNotification): Promise<Notification>;
  updateNotificationStatus(id: string, status: 'PENDING' | 'SENT' | 'FAILED', error?: string): Promise<Notification | undefined>;
  updateNotificationWithDetails(id: string, status: 'PENDING' | 'SENT' | 'FAILED', sentEmailAt: Date | null, sentWhatsappAt: Date | null, lastError: string | null): Promise<Notification | undefined>;
  
  // Event Logs
  getEventLogsForProject(projectId: string): Promise<EventLog[]>;
  getEventLogsForPeriod(periodId: string): Promise<EventLog[]>;
  getAllEventLogs(): Promise<EventLog[]>;
  createEventLog(log: InsertEventLog): Promise<EventLog>;
  
  // Partners
  getAllPartners(): Promise<Partner[]>;
  getPartner(id: 'P1' | 'P2'): Promise<Partner | undefined>;
  updatePartner(id: 'P1' | 'P2', updates: Partial<Partner>): Promise<Partner | undefined>;
  
  // Period Balances
  getBalancesForPeriod(periodId: string): Promise<Balance[]>;
  createBalance(balance: InsertBalance): Promise<Balance>;
  updateBalance(id: string, updates: Partial<Balance>): Promise<Balance | undefined>;
  
  // Reset Tokens
  createResetToken(token: InsertResetToken): Promise<ResetToken>;
  getValidResetToken(token: string): Promise<ResetToken | undefined>;
  markTokenUsed(id: string): Promise<void>;
  
  // Auth helpers
  getUserByEmail(email: string): Promise<UserProfile | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Projects
  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  // Periods
  async getPeriodsForProject(projectId: string): Promise<Period[]> {
    return await db.select().from(periods)
      .where(eq(periods.projectId, projectId))
      .orderBy(desc(periods.createdAt));
  }

  async getPeriod(id: string): Promise<Period | undefined> {
    const [period] = await db.select().from(periods).where(eq(periods.id, id));
    return period;
  }

  async createPeriod(period: InsertPeriod): Promise<Period> {
    const [newPeriod] = await db.insert(periods).values(period).returning();
    
    // Log event
    await this.createEventLog({
      projectId: period.projectId,
      periodId: newPeriod.id,
      eventType: 'PERIOD_OPENED',
      message: `تم فتح فترة: ${period.name}`,
      metadata: null,
    });
    
    return newPeriod;
  }

  async updatePeriodStatus(id: string, status: 'ACTIVE' | 'CLOSED'): Promise<Period | undefined> {
    const [period] = await db.select().from(periods).where(eq(periods.id, id));
    if (!period) return undefined;

    const [updated] = await db.update(periods)
      .set({ 
        status,
        closedAt: status === 'CLOSED' ? new Date() : null,
      })
      .where(eq(periods.id, id))
      .returning();

    // Log event
    await this.createEventLog({
      projectId: period.projectId,
      periodId: id,
      eventType: status === 'CLOSED' ? 'PERIOD_CLOSED' : 'PERIOD_OPENED',
      message: status === 'CLOSED' ? `تم إغلاق الفترة: ${period.name}` : `تم إعادة فتح الفترة: ${period.name}`,
      metadata: null,
    });

    return updated;
  }

  async getLastClosedPeriod(projectId: string): Promise<Period | undefined> {
    const [lastClosed] = await db.select().from(periods)
      .where(and(eq(periods.projectId, projectId), eq(periods.status, 'CLOSED')))
      .orderBy(desc(periods.closedAt))
      .limit(1);
    return lastClosed;
  }

  async getOpenPeriodForProject(projectId: string): Promise<Period | undefined> {
    const [openPeriod] = await db.select().from(periods)
      .where(and(eq(periods.projectId, projectId), eq(periods.status, 'ACTIVE')));
    return openPeriod;
  }

  async closePeriodWithBalances(id: string): Promise<Period> {
    const period = await this.getPeriod(id);
    if (!period) throw new Error("الفترة غير موجودة");
    if (period.status === 'CLOSED') throw new Error("الفترة مغلقة بالفعل");

    const txs = await this.getTransactionsForPeriod(id);
    
    const p1Start = parseFloat(period.p1BalanceStart || "0");
    const p2Start = parseFloat(period.p2BalanceStart || "0");
    
    let p1ExpensesPaid = 0, p1RevenuesReceived = 0, p1SettlementsPaid = 0, p1SettlementsReceived = 0;
    let p2ExpensesPaid = 0, p2RevenuesReceived = 0, p2SettlementsPaid = 0, p2SettlementsReceived = 0;
    let totalExpenses = 0, totalRevenues = 0;

    for (const tx of txs) {
      const amount = parseFloat(tx.amount);
      if (tx.type === 'EXPENSE') {
        totalExpenses += amount;
        if (tx.paidBy === 'P1') p1ExpensesPaid += amount;
        else if (tx.paidBy === 'P2') p2ExpensesPaid += amount;
      } else if (tx.type === 'REVENUE') {
        totalRevenues += amount;
        if (tx.paidBy === 'P1') p1RevenuesReceived += amount;
        else if (tx.paidBy === 'P2') p2RevenuesReceived += amount;
      } else if (tx.type === 'SETTLEMENT') {
        if (tx.fromPartner === 'P1') { p1SettlementsPaid += amount; p2SettlementsReceived += amount; }
        else if (tx.fromPartner === 'P2') { p2SettlementsPaid += amount; p1SettlementsReceived += amount; }
      }
    }

    const netProfit = totalRevenues - totalExpenses;
    const profitShare = netProfit / 2;

    const p1End = p1Start + p1ExpensesPaid - p1RevenuesReceived + p1SettlementsPaid - p1SettlementsReceived + profitShare;
    const p2End = p2Start + p2ExpensesPaid - p2RevenuesReceived + p2SettlementsPaid - p2SettlementsReceived + profitShare;

    if (Math.abs(p1End + p2End) > 0.01) {
      throw new Error(`الحسابات غير متوازنة: رصيد ابراهيم = ${p1End.toFixed(2)}, رصيد ناهض = ${p2End.toFixed(2)}`);
    }

    const today = new Date().toISOString().split('T')[0];
    const [updated] = await db.update(periods)
      .set({
        status: 'CLOSED',
        endDate: today,
        p1BalanceEnd: p1End.toFixed(2),
        p2BalanceEnd: p2End.toFixed(2),
        closedAt: new Date(),
      })
      .where(eq(periods.id, id))
      .returning();

    await this.createEventLog({
      projectId: period.projectId,
      periodId: id,
      eventType: 'PERIOD_CLOSED',
      message: `تم إغلاق الفترة: ${period.name}`,
      metadata: JSON.stringify({ p1BalanceEnd: p1End, p2BalanceEnd: p2End }),
    });

    // Auto-create next period with previous end balances as start balances
    // Status is PENDING_NAME until user provides a name
    const [newPeriod] = await db.insert(periods).values({
      projectId: period.projectId,
      name: '',
      startDate: today,
      status: 'PENDING_NAME',
      p1BalanceStart: p1End.toFixed(2),
      p2BalanceStart: p2End.toFixed(2),
    }).returning();

    await this.createEventLog({
      projectId: period.projectId,
      periodId: newPeriod.id,
      eventType: 'PERIOD_OPENED',
      message: `تم فتح فترة جديدة: ${newPeriod.name}`,
      metadata: JSON.stringify({ p1BalanceStart: p1End, p2BalanceStart: p2End }),
    });

    return updated;
  }

  async resetPeriodsForProject(projectId: string): Promise<Period> {
    const today = new Date().toISOString().split('T')[0];
    
    await db.update(periods)
      .set({
        status: 'CLOSED',
        endDate: today,
        closedAt: new Date(),
      })
      .where(and(eq(periods.projectId, projectId), eq(periods.status, 'ACTIVE')));

    const [newPeriod] = await db.insert(periods).values({
      projectId,
      name: 'الفترة الافتتاحية',
      startDate: today,
      status: 'ACTIVE',
      p1BalanceStart: '0',
      p2BalanceStart: '0',
      p1BalanceEnd: '0',
      p2BalanceEnd: '0',
    }).returning();

    await this.createEventLog({
      projectId,
      periodId: newPeriod.id,
      eventType: 'PERIOD_OPENED',
      message: 'تم تهيئة الفترة الافتتاحية',
      metadata: null,
    });

    return newPeriod;
  }

  async namePendingPeriod(id: string, name: string): Promise<Period> {
    const [updated] = await db.update(periods)
      .set({
        name,
        status: 'ACTIVE',
        openedAt: new Date(),
      })
      .where(and(eq(periods.id, id), eq(periods.status, 'PENDING_NAME')))
      .returning();

    if (!updated) {
      throw new Error("الفترة غير موجودة أو ليست في حالة انتظار التسمية");
    }

    await this.createEventLog({
      projectId: updated.projectId,
      periodId: id,
      eventType: 'PERIOD_OPENED',
      message: `تم فتح فترة جديدة: ${name}`,
      metadata: null,
    });

    return updated;
  }

  // Users
  async getUserProfile(id: string): Promise<UserProfile | undefined> {
    const [user] = await db.select().from(userProfiles).where(eq(userProfiles.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<UserProfile | undefined> {
    const [user] = await db.select().from(userProfiles).where(eq(userProfiles.username, username));
    return user;
  }

  async createUserProfile(user: InsertUserProfile): Promise<UserProfile> {
    const [newUser] = await db.insert(userProfiles).values(user).returning();
    return newUser;
  }

  async updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | undefined> {
    const [updated] = await db.update(userProfiles)
      .set(updates)
      .where(eq(userProfiles.id, id))
      .returning();
    return updated;
  }

  async getAllUsers(): Promise<UserProfile[]> {
    return await db.select().from(userProfiles);
  }

  // Transactions
  async getTransactionsForPeriod(periodId: string): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(eq(transactions.periodId, periodId))
      .orderBy(desc(transactions.date));
  }

  async getTransactionsForProject(projectId: string): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(eq(transactions.projectId, projectId))
      .orderBy(desc(transactions.date));
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id));
    return tx;
  }

  async createTransaction(tx: InsertTransaction): Promise<Transaction> {
    const [newTx] = await db.insert(transactions).values(tx).returning();
    
    // Log event
    await this.createEventLog({
      projectId: tx.projectId,
      periodId: tx.periodId,
      transactionId: newTx.id,
      userId: tx.createdBy || null,
      eventType: 'TX_CREATED',
      message: `تم إنشاء معاملة: ${tx.description}`,
      metadata: null,
    });

    return newTx;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id));
    if (!tx) return undefined;

    const [updated] = await db.update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();

    // Log event
    await this.createEventLog({
      projectId: tx.projectId,
      periodId: tx.periodId,
      transactionId: id,
      userId: tx.createdBy || null,
      eventType: 'TX_UPDATED',
      message: `تم تعديل معاملة: ${tx.description}`,
      metadata: null,
    });

    return updated;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id));
    if (!tx) return false;

    // Log event before deleting
    await this.createEventLog({
      projectId: tx.projectId,
      periodId: tx.periodId,
      transactionId: id,
      userId: tx.createdBy || null,
      eventType: 'TX_DELETED',
      message: `تم حذف معاملة: ${tx.description}`,
      metadata: null,
    });

    await db.delete(transactions).where(eq(transactions.id, id));
    return true;
  }

  // Notifications
  async getNotificationsForTransaction(txId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.transactionId, txId));
  }

  async getAllNotifications(): Promise<any[]> {
    const results = await db.select({
      notification: notifications,
      transaction: {
        id: transactions.id,
        description: transactions.description,
        periodId: transactions.periodId,
      }
    })
    .from(notifications)
    .leftJoin(transactions, eq(notifications.transactionId, transactions.id))
    .orderBy(desc(notifications.createdAt));
    
    return results.map(r => ({
      ...r.notification,
      transaction: r.transaction,
    }));
  }

  async createNotification(notif: InsertNotification): Promise<Notification> {
    const [newNotif] = await db.insert(notifications).values(notif).returning();
    return newNotif;
  }

  async updateNotificationStatus(
    id: string, 
    status: 'PENDING' | 'SENT' | 'FAILED', 
    error?: string
  ): Promise<Notification | undefined> {
    const updates: any = { status };
    if (error) updates.lastError = error;
    if (status === 'SENT') {
      updates.sentEmailAt = new Date();
      updates.sentWhatsappAt = new Date();
    }

    const [updated] = await db.update(notifications)
      .set(updates)
      .where(eq(notifications.id, id))
      .returning();

    // Log event
    if (status === 'SENT') {
      await this.createEventLog({
        eventType: 'NOTIF_SENT',
        message: `تم إرسال إشعار`,
        metadata: null,
        projectId: null,
        periodId: null,
        transactionId: null,
        userId: null,
      });
    } else if (status === 'FAILED') {
      await this.createEventLog({
        eventType: 'NOTIF_FAILED',
        message: `فشل إرسال إشعار: ${error}`,
        metadata: null,
        projectId: null,
        periodId: null,
        transactionId: null,
        userId: null,
      });
    }

    return updated;
  }

  async updateNotificationWithDetails(
    id: string,
    status: 'PENDING' | 'SENT' | 'FAILED',
    sentEmailAt: Date | null,
    sentWhatsappAt: Date | null,
    lastError: string | null
  ): Promise<Notification | undefined> {
    const updates: any = { status };
    if (sentEmailAt) updates.sentEmailAt = sentEmailAt;
    if (sentWhatsappAt) updates.sentWhatsappAt = sentWhatsappAt;
    if (lastError) updates.lastError = lastError;

    const [updated] = await db.update(notifications)
      .set(updates)
      .where(eq(notifications.id, id))
      .returning();

    // Log event
    if (status === 'SENT') {
      await this.createEventLog({
        eventType: 'NOTIF_SENT',
        message: `تم إرسال إشعار`,
        metadata: null,
        projectId: null,
        periodId: null,
        transactionId: null,
        userId: null,
      });
    } else if (status === 'FAILED') {
      await this.createEventLog({
        eventType: 'NOTIF_FAILED',
        message: `فشل إرسال إشعار: ${lastError}`,
        metadata: null,
        projectId: null,
        periodId: null,
        transactionId: null,
        userId: null,
      });
    }

    return updated;
  }

  // Event Logs
  async getEventLogsForProject(projectId: string): Promise<EventLog[]> {
    return await db.select().from(eventLogs)
      .where(eq(eventLogs.projectId, projectId))
      .orderBy(desc(eventLogs.createdAt));
  }

  async getEventLogsForPeriod(periodId: string): Promise<EventLog[]> {
    return await db.select().from(eventLogs)
      .where(eq(eventLogs.periodId, periodId))
      .orderBy(desc(eventLogs.createdAt));
  }

  async getAllEventLogs(): Promise<EventLog[]> {
    return await db.select().from(eventLogs)
      .orderBy(desc(eventLogs.createdAt));
  }

  async createEventLog(log: InsertEventLog): Promise<EventLog> {
    const [newLog] = await db.insert(eventLogs).values(log).returning();
    return newLog;
  }

  // Partners
  async getAllPartners(): Promise<Partner[]> {
    return await db.select().from(partners);
  }

  async getPartner(id: 'P1' | 'P2'): Promise<Partner | undefined> {
    const [partner] = await db.select().from(partners).where(eq(partners.id, id));
    return partner;
  }

  async updatePartner(id: 'P1' | 'P2', updates: Partial<Partner>): Promise<Partner | undefined> {
    const [updated] = await db.update(partners)
      .set(updates)
      .where(eq(partners.id, id))
      .returning();
    return updated;
  }

  // Period Balances
  async getBalancesForPeriod(periodId: string): Promise<Balance[]> {
    return await db.select().from(periodPartnerBalances)
      .where(eq(periodPartnerBalances.periodId, periodId));
  }

  async createBalance(balance: InsertBalance): Promise<Balance> {
    const [newBalance] = await db.insert(periodPartnerBalances).values(balance).returning();
    return newBalance;
  }

  async updateBalance(id: string, updates: Partial<Balance>): Promise<Balance | undefined> {
    const [updated] = await db.update(periodPartnerBalances)
      .set(updates)
      .where(eq(periodPartnerBalances.id, id))
      .returning();
    return updated;
  }

  // Reset Tokens
  async createResetToken(token: InsertResetToken): Promise<ResetToken> {
    const [newToken] = await db.insert(resetTokens).values(token).returning();
    return newToken;
  }

  async getValidResetToken(token: string): Promise<ResetToken | undefined> {
    const now = new Date();
    const [resetToken] = await db.select().from(resetTokens)
      .where(and(
        eq(resetTokens.token, token),
        isNull(resetTokens.usedAt)
      ));
    
    if (!resetToken) return undefined;
    if (new Date(resetToken.expiresAt) < now) return undefined;
    
    return resetToken;
  }

  async markTokenUsed(id: string): Promise<void> {
    await db.update(resetTokens)
      .set({ usedAt: new Date() })
      .where(eq(resetTokens.id, id));
  }

  // Auth helpers
  async getUserByEmail(email: string): Promise<UserProfile | undefined> {
    const [user] = await db.select().from(userProfiles).where(eq(userProfiles.email, email));
    return user;
  }
}

export const storage = new DatabaseStorage();
