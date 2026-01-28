-- APIS SaaS - Initial Database Schema
-- PostgreSQL 16 for Wedos VPS ON / Coolify
-- Beauty & Wellness Platform (Salonio)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'salon_owner', 'employee', 'customer')),
    salon_id UUID,
    email_verified_at TIMESTAMPTZ,
    phone_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_salon_id ON users(salon_id);

-- ============================================
-- SALONS
-- ============================================

CREATE TABLE IF NOT EXISTS salons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_postal_code VARCHAR(20),
    address_country VARCHAR(100) DEFAULT 'Česká republika',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(50),
    email VARCHAR(255),
    website TEXT,
    ico VARCHAR(20),
    dic VARCHAR(20),
    business_hours JSONB DEFAULT '{}',
    booking_settings JSONB DEFAULT '{"min_advance_hours": 2, "max_advance_days": 30, "slot_duration_minutes": 15}',
    notification_settings JSONB DEFAULT '{"email_enabled": true, "sms_enabled": true}',
    payment_settings JSONB DEFAULT '{"online_payment_enabled": false, "deposit_required": false}',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    subscription_tier VARCHAR(50) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'enterprise')),
    subscription_valid_until TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salons_owner_id ON salons(owner_id);
CREATE INDEX IF NOT EXISTS idx_salons_slug ON salons(slug);
CREATE INDEX IF NOT EXISTS idx_salons_city ON salons(address_city);
CREATE INDEX IF NOT EXISTS idx_salons_is_active ON salons(is_active);

-- Add foreign key for users.salon_id
ALTER TABLE users ADD CONSTRAINT fk_users_salon FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE SET NULL;

-- ============================================
-- SERVICES
-- ============================================

CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CZK',
    is_active BOOLEAN DEFAULT true,
    requires_deposit BOOLEAN DEFAULT false,
    deposit_amount DECIMAL(10, 2),
    max_participants INTEGER DEFAULT 1,
    buffer_time_before INTEGER DEFAULT 0,
    buffer_time_after INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_salon_id ON services(salon_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- ============================================
-- EMPLOYEES
-- ============================================

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    bio TEXT,
    color VARCHAR(20) DEFAULT '#3B82F6',
    work_hours JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    can_be_booked BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_salon_id ON employees(salon_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON employees(is_active);

-- Employee-Service relationship (many-to-many)
CREATE TABLE IF NOT EXISTS employee_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    custom_price DECIMAL(10, 2),
    custom_duration INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_employee_services_employee_id ON employee_services(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_services_service_id ON employee_services(service_id);

-- ============================================
-- RESERVATIONS (BOOKINGS)
-- ============================================

CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    
    -- Customer info (for non-registered customers)
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    
    -- Timing
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES users(id),
    
    -- Payment
    price DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'CZK',
    payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'deposit_paid', 'paid', 'refunded', 'partially_refunded')),
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    
    -- Notes
    customer_notes TEXT,
    internal_notes TEXT,
    
    -- Reminders
    reminder_email_sent BOOLEAN DEFAULT false,
    reminder_sms_sent BOOLEAN DEFAULT false,
    
    -- Source
    source VARCHAR(50) DEFAULT 'web' CHECK (source IN ('web', 'mobile', 'phone', 'walk_in', 'admin')),
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_salon_id ON reservations(salon_id);
CREATE INDEX IF NOT EXISTS idx_reservations_customer_id ON reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_employee_id ON reservations(employee_id);
CREATE INDEX IF NOT EXISTS idx_reservations_start_time ON reservations(start_time);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_payment_status ON reservations(payment_status);

-- ============================================
-- PAYMENTS (Comgate integration)
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    
    -- Comgate data
    transaction_id VARCHAR(255) UNIQUE,
    merchant_id VARCHAR(100),
    
    -- Payment details
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CZK',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'authorized', 'refunded')),
    payment_method VARCHAR(50),
    
    -- Customer info
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    
    -- Response data
    response_code VARCHAR(20),
    response_message TEXT,
    
    -- Timestamps
    paid_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_reservation_id ON payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_salon_id ON payments(salon_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ============================================
-- SMS NOTIFICATIONS (GoSMS integration)
-- ============================================

CREATE TABLE IF NOT EXISTS sms_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    
    phone VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('reminder', 'confirmation', 'cancellation', 'custom')),
    
    -- GoSMS data
    external_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    error_message TEXT,
    
    -- Cost tracking
    parts_count INTEGER DEFAULT 1,
    cost DECIMAL(10, 4),
    
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_notifications_salon_id ON sms_notifications(salon_id);
CREATE INDEX IF NOT EXISTS idx_sms_notifications_reservation_id ON sms_notifications(reservation_id);
CREATE INDEX IF NOT EXISTS idx_sms_notifications_status ON sms_notifications(status);

-- ============================================
-- REVIEWS
-- ============================================

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    -- Moderation
    is_published BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    
    -- Response
    owner_response TEXT,
    owner_responded_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_salon_id ON reviews(salon_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_is_published ON reviews(is_published);

-- ============================================
-- AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    salon_id UUID REFERENCES salons(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_salon_id ON audit_logs(salon_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables with updated_at column
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END $$;

-- Function to generate salon slug
CREATE OR REPLACE FUNCTION generate_salon_slug(name VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    base_slug VARCHAR;
    final_slug VARCHAR;
    counter INTEGER := 0;
BEGIN
    base_slug := lower(unaccent(name));
    base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
    base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
    
    final_slug := base_slug;
    
    WHILE EXISTS(SELECT 1 FROM salons WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert admin user (change password immediately after first login!)
INSERT INTO users (email, password_hash, name, role)
VALUES (
    'admin@salonio.cz',
    crypt('ChangeThisPassword123!', gen_salt('bf', 12)),
    'System Admin',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Service categories
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO service_categories (name, slug, icon, sort_order) VALUES
    ('Kadeřnictví', 'kadernictvi', 'scissors', 1),
    ('Manikúra & Pedikúra', 'manikura-pedikura', 'nail-polish', 2),
    ('Kosmetika', 'kosmetika', 'sparkles', 3),
    ('Masáže', 'masaze', 'spa', 4),
    ('Wellness', 'wellness', 'heart', 5),
    ('Fitness', 'fitness', 'dumbbell', 6),
    ('Ostatní', 'ostatni', 'more-horizontal', 99)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- PERFORMANCE VIEWS
-- ============================================

-- Salon statistics view
CREATE OR REPLACE VIEW salon_stats AS
SELECT 
    s.id AS salon_id,
    s.name AS salon_name,
    COUNT(DISTINCT e.id) AS employee_count,
    COUNT(DISTINCT sv.id) AS service_count,
    COUNT(DISTINCT r.id) AS total_reservations,
    COUNT(DISTINCT CASE WHEN r.status = 'completed' THEN r.id END) AS completed_reservations,
    COALESCE(AVG(rv.rating), 0) AS average_rating,
    COUNT(DISTINCT rv.id) AS review_count
FROM salons s
LEFT JOIN employees e ON e.salon_id = s.id AND e.is_active = true
LEFT JOIN services sv ON sv.salon_id = s.id AND sv.is_active = true
LEFT JOIN reservations r ON r.salon_id = s.id
LEFT JOIN reviews rv ON rv.salon_id = s.id AND rv.is_published = true
GROUP BY s.id, s.name;

COMMENT ON TABLE users IS 'Uživatelé systému - zákazníci, majitelé salonů, zaměstnanci';
COMMENT ON TABLE salons IS 'Salony a provozovny';
COMMENT ON TABLE services IS 'Služby nabízené salony';
COMMENT ON TABLE employees IS 'Zaměstnanci salonů';
COMMENT ON TABLE reservations IS 'Rezervace a objednávky';
COMMENT ON TABLE payments IS 'Platby přes Comgate';
COMMENT ON TABLE sms_notifications IS 'SMS notifikace přes GoSMS';
COMMENT ON TABLE reviews IS 'Hodnocení a recenze';
COMMENT ON TABLE audit_logs IS 'Audit log pro sledování změn';
