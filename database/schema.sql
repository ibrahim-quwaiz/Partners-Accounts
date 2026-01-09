-- =====================================================
-- Partner Accounting System - Database Schema
-- Supabase (PostgreSQL)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- A) PROJECTS - المشاريع
-- =====================================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the 2 fixed projects
INSERT INTO projects (name, description) VALUES 
    ('مشروع برج الألفية', 'المشروع الأول'),
    ('تجديد السوق المركزي', 'المشروع الثاني');

-- =====================================================
-- B) PERIODS - الفترات المحاسبية
-- =====================================================
CREATE TYPE period_status AS ENUM ('ACTIVE', 'CLOSED');

CREATE TABLE periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status period_status DEFAULT 'ACTIVE',
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_period_per_project UNIQUE (project_id, name)
);

CREATE INDEX idx_periods_project ON periods(project_id);
CREATE INDEX idx_periods_status ON periods(status);

-- =====================================================
-- C) USER_PROFILES - ملفات المستخدمين
-- =====================================================
CREATE TYPE user_role AS ENUM ('ADMIN', 'TX_ONLY');

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role user_role DEFAULT 'TX_ONLY',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- D) TRANSACTIONS - المعاملات
-- =====================================================
CREATE TYPE transaction_type AS ENUM ('EXPENSE', 'REVENUE', 'SETTLEMENT');
CREATE TYPE partner_id AS ENUM ('P1', 'P2');

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES periods(id) ON DELETE RESTRICT,
    type transaction_type NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    
    -- For EXPENSE/REVENUE: who paid/received
    paid_by partner_id,
    
    -- For SETTLEMENT: from whom to whom
    from_partner partner_id,
    to_partner partner_id,
    
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_expense_revenue CHECK (
        (type IN ('EXPENSE', 'REVENUE') AND paid_by IS NOT NULL AND from_partner IS NULL AND to_partner IS NULL)
        OR
        (type = 'SETTLEMENT' AND paid_by IS NULL AND from_partner IS NOT NULL AND to_partner IS NOT NULL AND from_partner != to_partner)
    )
);

CREATE INDEX idx_transactions_project ON transactions(project_id);
CREATE INDEX idx_transactions_period ON transactions(period_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(date);

-- =====================================================
-- E) NOTIFICATIONS - الإشعارات
-- =====================================================
CREATE TYPE notification_status AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    status notification_status DEFAULT 'PENDING',
    last_error TEXT,
    sent_email_at TIMESTAMPTZ,
    sent_whatsapp_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_transaction ON notifications(transaction_id);
CREATE INDEX idx_notifications_status ON notifications(status);

-- =====================================================
-- F) EVENT_LOGS - سجل الأحداث
-- =====================================================
CREATE TYPE event_type AS ENUM (
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
);

CREATE TABLE event_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    period_id UUID REFERENCES periods(id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    event_type event_type NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_logs_project ON event_logs(project_id);
CREATE INDEX idx_event_logs_period ON event_logs(period_id);
CREATE INDEX idx_event_logs_type ON event_logs(event_type);
CREATE INDEX idx_event_logs_created ON event_logs(created_at DESC);

-- =====================================================
-- G) PERIOD_PARTNER_BALANCES - أرصدة الشركاء
-- =====================================================
CREATE TABLE period_partner_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
    partner partner_id NOT NULL,
    opening_balance NUMERIC(12, 2) DEFAULT 0,
    closing_balance NUMERIC(12, 2),
    total_paid NUMERIC(12, 2) DEFAULT 0,
    total_received NUMERIC(12, 2) DEFAULT 0,
    profit_share NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_partner_period UNIQUE (period_id, partner)
);

CREATE INDEX idx_balances_period ON period_partner_balances(period_id);

-- =====================================================
-- H) UPDATED_AT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_timestamp BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_periods_timestamp BEFORE UPDATE ON periods FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_profiles_timestamp BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_transactions_timestamp BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_notifications_timestamp BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_balances_timestamp BEFORE UPDATE ON period_partner_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- I) PREVENT MODIFICATIONS ON CLOSED PERIODS
-- منع التعديل/الحذف/الإضافة على فترة مغلقة
-- =====================================================

-- Function to check if period is closed
CREATE OR REPLACE FUNCTION check_period_is_open()
RETURNS TRIGGER AS $$
DECLARE
    period_status_val period_status;
BEGIN
    -- Get the period status
    SELECT status INTO period_status_val 
    FROM periods 
    WHERE id = COALESCE(NEW.period_id, OLD.period_id);
    
    -- If period is closed, reject the operation
    IF period_status_val = 'CLOSED' THEN
        RAISE EXCEPTION 'لا يمكن إجراء عمليات على فترة مغلقة. يرجى فتح الفترة أولاً.';
    END IF;
    
    -- For DELETE, return OLD; for INSERT/UPDATE, return NEW
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger for INSERT (prevent adding to closed period)
CREATE TRIGGER prevent_insert_closed_period
    BEFORE INSERT ON transactions
    FOR EACH ROW EXECUTE FUNCTION check_period_is_open();

-- Trigger for UPDATE (prevent modifying in closed period)
CREATE TRIGGER prevent_update_closed_period
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION check_period_is_open();

-- Trigger for DELETE (prevent deleting from closed period)
CREATE TRIGGER prevent_delete_closed_period
    BEFORE DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION check_period_is_open();

-- =====================================================
-- J) LOG PERIOD STATUS CHANGES
-- تسجيل تغييرات حالة الفترة
-- =====================================================
CREATE OR REPLACE FUNCTION log_period_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log when period is closed
    IF NEW.status = 'CLOSED' AND OLD.status = 'ACTIVE' THEN
        NEW.closed_at = NOW();
        INSERT INTO event_logs (project_id, period_id, event_type, message)
        VALUES (NEW.project_id, NEW.id, 'PERIOD_CLOSED', 'تم إغلاق الفترة: ' || NEW.name);
    END IF;
    
    -- Log when period is reopened
    IF NEW.status = 'ACTIVE' AND OLD.status = 'CLOSED' THEN
        NEW.closed_at = NULL;
        INSERT INTO event_logs (project_id, period_id, event_type, message)
        VALUES (NEW.project_id, NEW.id, 'PERIOD_OPENED', 'تم إعادة فتح الفترة: ' || NEW.name);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_period_changes
    BEFORE UPDATE ON periods
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION log_period_status_change();

-- =====================================================
-- K) LOG TRANSACTION CHANGES
-- تسجيل تغييرات المعاملات
-- =====================================================
CREATE OR REPLACE FUNCTION log_transaction_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO event_logs (project_id, period_id, transaction_id, user_id, event_type, message)
        VALUES (NEW.project_id, NEW.period_id, NEW.id, NEW.created_by, 'TX_CREATED', 'تم إنشاء معاملة: ' || NEW.description);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO event_logs (project_id, period_id, transaction_id, user_id, event_type, message)
        VALUES (NEW.project_id, NEW.period_id, NEW.id, NEW.created_by, 'TX_UPDATED', 'تم تعديل معاملة: ' || NEW.description);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO event_logs (project_id, period_id, transaction_id, user_id, event_type, message)
        VALUES (OLD.project_id, OLD.period_id, OLD.id, OLD.created_by, 'TX_DELETED', 'تم حذف معاملة: ' || OLD.description);
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_tx_insert
    AFTER INSERT ON transactions
    FOR EACH ROW EXECUTE FUNCTION log_transaction_changes();

CREATE TRIGGER log_tx_update
    AFTER UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION log_transaction_changes();

CREATE TRIGGER log_tx_delete
    AFTER DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION log_transaction_changes();

-- =====================================================
-- L) ROW LEVEL SECURITY (RLS) - للتفعيل لاحقاً
-- =====================================================
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE period_partner_balances ENABLE ROW LEVEL SECURITY;

-- Example policy for TX_ONLY users (uncomment when needed):
-- CREATE POLICY "tx_only_read_transactions" ON transactions
--     FOR SELECT USING (
--         auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('ADMIN', 'TX_ONLY'))
--     );

-- CREATE POLICY "admin_full_access" ON transactions
--     FOR ALL USING (
--         auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'ADMIN')
--     );
