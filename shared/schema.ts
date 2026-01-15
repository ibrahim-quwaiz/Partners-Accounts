import { sql, relations } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  uuid, 
  timestamp, 
  date,
  numeric,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// =====================================================
// ENUMS
// =====================================================
export const periodStatusEnum = pgEnum('period_status', ['ACTIVE', 'CLOSED', 'PENDING_NAME']);
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'TX_ONLY']);
export const transactionTypeEnum = pgEnum('transaction_type', ['EXPENSE', 'REVENUE', 'SETTLEMENT']);
export const partnerIdEnum = pgEnum('partner_id', ['P1', 'P2']);
export const notificationStatusEnum = pgEnum('notification_status', ['PENDING', 'SENT', 'FAILED']);
export const eventTypeEnum = pgEnum('event_type', [
  'PERIOD_OPENED',
  'PERIOD_CLOSED',
  'TX_CREATED',
  'TX_UPDATED',
  'TX_DELETED',
  'NOTIF_SENT',
  'NOTIF_FAILED',
  'ACCESS_DENIED',
  'USER_LOGIN',
  'USER_LOGOUT'
]);

// =====================================================
// TABLES
// =====================================================

// Projects
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Periods
export const periods = pgTable("periods", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  status: periodStatusEnum("status").default('ACTIVE').notNull(),
  p1BalanceStart: numeric("p1_balance_start", { precision: 12, scale: 2 }).default("0").notNull(),
  p2BalanceStart: numeric("p2_balance_start", { precision: 12, scale: 2 }).default("0").notNull(),
  p1BalanceEnd: numeric("p1_balance_end", { precision: 12, scale: 2 }),
  p2BalanceEnd: numeric("p2_balance_end", { precision: 12, scale: 2 }),
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User Profiles
export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: userRoleEnum("role").default('TX_ONLY').notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Transactions
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  periodId: uuid("period_id").notNull().references(() => periods.id, { onDelete: 'restrict' }),
  type: transactionTypeEnum("type").notNull(),
  date: date("date").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paidBy: partnerIdEnum("paid_by"),
  fromPartner: partnerIdEnum("from_partner"),
  toPartner: partnerIdEnum("to_partner"),
  createdBy: uuid("created_by").references(() => userProfiles.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id").notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  status: notificationStatusEnum("status").default('PENDING').notNull(),
  lastError: text("last_error"),
  sentEmailAt: timestamp("sent_email_at"),
  sentWhatsappAt: timestamp("sent_whatsapp_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Event Logs
export const eventLogs = pgTable("event_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: 'set null' }),
  periodId: uuid("period_id").references(() => periods.id, { onDelete: 'set null' }),
  transactionId: uuid("transaction_id").references(() => transactions.id, { onDelete: 'set null' }),
  userId: uuid("user_id").references(() => userProfiles.id, { onDelete: 'set null' }),
  eventType: eventTypeEnum("event_type").notNull(),
  message: text("message").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Period Partner Balances
export const periodPartnerBalances = pgTable("period_partner_balances", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  periodId: uuid("period_id").notNull().references(() => periods.id, { onDelete: 'cascade' }),
  partner: partnerIdEnum("partner").notNull(),
  openingBalance: numeric("opening_balance", { precision: 12, scale: 2 }).default('0').notNull(),
  closingBalance: numeric("closing_balance", { precision: 12, scale: 2 }),
  totalPaid: numeric("total_paid", { precision: 12, scale: 2 }).default('0').notNull(),
  totalReceived: numeric("total_received", { precision: 12, scale: 2 }).default('0').notNull(),
  profitShare: numeric("profit_share", { precision: 12, scale: 2 }).default('0').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Partners (for profile management)
export const partners = pgTable("partners", {
  id: partnerIdEnum("id").primaryKey(),
  displayName: text("display_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// =====================================================
// RELATIONS
// =====================================================
export const projectsRelations = relations(projects, ({ many }) => ({
  periods: many(periods),
  transactions: many(transactions),
  eventLogs: many(eventLogs),
  balances: many(periodPartnerBalances),
}));

export const periodsRelations = relations(periods, ({ one, many }) => ({
  project: one(projects, {
    fields: [periods.projectId],
    references: [projects.id],
  }),
  transactions: many(transactions),
  eventLogs: many(eventLogs),
  balances: many(periodPartnerBalances),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  project: one(projects, {
    fields: [transactions.projectId],
    references: [projects.id],
  }),
  period: one(periods, {
    fields: [transactions.periodId],
    references: [periods.id],
  }),
  createdByUser: one(userProfiles, {
    fields: [transactions.createdBy],
    references: [userProfiles.id],
  }),
  notifications: many(notifications),
  eventLogs: many(eventLogs),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  transaction: one(transactions, {
    fields: [notifications.transactionId],
    references: [transactions.id],
  }),
}));

export const eventLogsRelations = relations(eventLogs, ({ one }) => ({
  project: one(projects, {
    fields: [eventLogs.projectId],
    references: [projects.id],
  }),
  period: one(periods, {
    fields: [eventLogs.periodId],
    references: [periods.id],
  }),
  transaction: one(transactions, {
    fields: [eventLogs.transactionId],
    references: [transactions.id],
  }),
  user: one(userProfiles, {
    fields: [eventLogs.userId],
    references: [userProfiles.id],
  }),
}));

export const balancesRelations = relations(periodPartnerBalances, ({ one }) => ({
  project: one(projects, {
    fields: [periodPartnerBalances.projectId],
    references: [projects.id],
  }),
  period: one(periods, {
    fields: [periodPartnerBalances.periodId],
    references: [periods.id],
  }),
}));

// =====================================================
// SCHEMAS & TYPES
// =====================================================

// Projects
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Periods
export const insertPeriodSchema = createInsertSchema(periods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  openedAt: true,
  closedAt: true,
});
export type InsertPeriod = z.infer<typeof insertPeriodSchema>;
export type Period = typeof periods.$inferSelect;

// User Profiles
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

// Transactions
export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Notifications
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Event Logs
export const insertEventLogSchema = createInsertSchema(eventLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertEventLog = z.infer<typeof insertEventLogSchema>;
export type EventLog = typeof eventLogs.$inferSelect;

// Partner Balances
export const insertBalanceSchema = createInsertSchema(periodPartnerBalances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBalance = z.infer<typeof insertBalanceSchema>;
export type Balance = typeof periodPartnerBalances.$inferSelect;

// Partners
export const insertPartnerSchema = createInsertSchema(partners).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;
