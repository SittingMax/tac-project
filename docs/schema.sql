-- ============================================================================
-- TAC Cargo Database Schema
-- Generated from Supabase Project: xkkhxhgkyavxcfgeojww
-- Region: ap-southeast-1
-- PostgreSQL Version: 17.6.1
-- Last Updated: January 2026
-- ============================================================================

-- Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Organizations (Multi-tenant SaaS)
CREATE TABLE public.orgs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Hubs (Operational Locations)
CREATE TABLE public.hubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.orgs(id),
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ORIGIN', 'DESTINATION', 'TRANSIT')),
    address JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(org_id, code)
);

-- Staff (Users with Roles)
CREATE TABLE public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.orgs(id),
    auth_user_id UUID UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'OPS', 'WAREHOUSE_IMPHAL', 'WAREHOUSE_DELHI', 'INVOICE', 'DRIVER')),
    hub_id UUID REFERENCES public.hubs(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(org_id, email)
);

-- Customers
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.orgs(id),
    customer_code TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('INDIVIDUAL', 'BUSINESS', 'CORPORATE')),
    phone TEXT NOT NULL,
    email TEXT,
    gstin TEXT,
    address JSONB DEFAULT '{}'::jsonb,
    billing_address JSONB,
    credit_limit NUMERIC DEFAULT 0,
    current_balance NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(org_id, customer_code)
);

-- Shipments (Core Logistics Entity)
CREATE TABLE public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.orgs(id),
    awb_number TEXT NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    origin_hub_id UUID NOT NULL REFERENCES public.hubs(id),
    destination_hub_id UUID NOT NULL REFERENCES public.hubs(id),
    current_hub_id UUID REFERENCES public.hubs(id),
    manifest_id UUID REFERENCES public.manifests(id),
    mode TEXT NOT NULL CHECK (mode IN ('AIR', 'TRUCK')),
    service_level TEXT NOT NULL CHECK (service_level IN ('STANDARD', 'EXPRESS')),
    status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN (
        'CREATED', 'RECEIVED', 'LOADED_FOR_LINEHAUL', 'IN_TRANSIT',
        'RECEIVED_AT_DEST', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION', 'CANCELLED'
    )),
    package_count INTEGER NOT NULL DEFAULT 1,
    total_weight NUMERIC NOT NULL,
    volumetric_weight NUMERIC,
    chargeable_weight NUMERIC,
    declared_value NUMERIC,
    consignee_name TEXT NOT NULL,
    consignee_phone TEXT NOT NULL,
    consignee_address JSONB NOT NULL,
    special_instructions TEXT,
    pod_image_url TEXT,
    pod_signature_url TEXT,
    delivered_at TIMESTAMPTZ,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(org_id, awb_number)
);

-- Packages (Individual Scannable Units)
CREATE TABLE public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.orgs(id),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id),
    package_number INTEGER NOT NULL,
    weight NUMERIC NOT NULL,
    dimensions JSONB,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(shipment_id, package_number)
);

-- Manifests (Dispatch Batches)
CREATE TABLE public.manifests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.orgs(id),
    manifest_no TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('AIR', 'TRUCK')),
    from_hub_id UUID NOT NULL REFERENCES public.hubs(id),
    to_hub_id UUID NOT NULL REFERENCES public.hubs(id),
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'DEPARTED', 'ARRIVED')),
    vehicle_number TEXT,
    driver_name TEXT,
    driver_phone TEXT,
    vehicle_meta JSONB,
    total_shipments INTEGER DEFAULT 0,
    total_packages INTEGER DEFAULT 0,
    total_weight NUMERIC DEFAULT 0,
    created_by_staff_id UUID REFERENCES public.staff(id),
    closed_by_staff_id UUID REFERENCES public.staff(id),
    closed_at TIMESTAMPTZ,
    departed_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(org_id, manifest_no)
);

-- Manifest Items (Shipment-Manifest Junction)
CREATE TABLE public.manifest_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.orgs(id),
    manifest_id UUID NOT NULL REFERENCES public.manifests(id),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id),
    scanned_by_staff_id UUID REFERENCES public.staff(id),
    scanned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(manifest_id, shipment_id)
);

-- Tracking Events (Immutable Audit Trail)
CREATE TABLE public.tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.orgs(id),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id),
    awb_number TEXT NOT NULL,
    event_code TEXT NOT NULL,
    event_time TIMESTAMPTZ DEFAULT now(),
    hub_id UUID REFERENCES public.hubs(id),
    actor_staff_id UUID REFERENCES public.staff(id),
    source TEXT NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('SCAN', 'MANUAL', 'SYSTEM', 'API')),
    location TEXT,
    notes TEXT,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.orgs(id),
    invoice_no TEXT NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    shipment_id UUID REFERENCES public.shipments(id),
    status TEXT NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('DRAFT', 'ISSUED', 'PAID', 'CANCELLED', 'OVERDUE')),
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    tax_amount NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    line_items JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    payment_method TEXT,
    payment_reference TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(org_id, invoice_no)
);

-- Invoice Counters (Auto-increment per org/year)
CREATE TABLE public.invoice_counters (
    org_id UUID NOT NULL REFERENCES public.orgs(id),
    year INTEGER NOT NULL,
    last_number INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (org_id, year)
);

-- Manifest Counters (Auto-increment per org/year)
CREATE TABLE public.manifest_counters (
    org_id UUID NOT NULL REFERENCES public.orgs(id),
    year INTEGER NOT NULL,
    last_number INTEGER DEFAULT 0,
    PRIMARY KEY (org_id, year)
);

-- Exceptions (Problem Tracking)
CREATE TABLE public.exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.orgs(id),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id),
    type TEXT NOT NULL CHECK (type IN (
        'DAMAGE', 'SHORTAGE', 'MISROUTE', 'DELAY',
        'CUSTOMER_REFUSAL', 'ADDRESS_ISSUE', 'OTHER'
    )),
    severity TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    description TEXT NOT NULL,
    resolution TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    reported_by_staff_id UUID REFERENCES public.staff(id),
    assigned_to_staff_id UUID REFERENCES public.staff(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Audit Logs (Compliance Trail)
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.orgs(id),
    actor_staff_id UUID REFERENCES public.staff(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    before JSONB,
    after JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES (Performance Optimization)
-- ============================================================================

-- Shipments
CREATE INDEX idx_shipments_org_id ON public.shipments(org_id);
CREATE INDEX idx_shipments_awb ON public.shipments(awb_number);
CREATE INDEX idx_shipments_status ON public.shipments(status);
CREATE INDEX idx_shipments_customer_id ON public.shipments(customer_id);
CREATE INDEX idx_shipments_origin_hub_id ON public.shipments(origin_hub_id);
CREATE INDEX idx_shipments_destination_hub_id ON public.shipments(destination_hub_id);
CREATE INDEX idx_shipments_current_hub_id ON public.shipments(current_hub_id);
CREATE INDEX idx_shipments_manifest_id ON public.shipments(manifest_id);
CREATE INDEX idx_shipments_deleted_at ON public.shipments(deleted_at);
CREATE INDEX idx_shipments_org_status ON public.shipments(org_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_shipments_org_created ON public.shipments(org_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_shipments_origin_hub ON public.shipments(org_id, origin_hub_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_shipments_dest_hub ON public.shipments(org_id, destination_hub_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX shipments_org_awb_unique ON public.shipments(org_id, awb_number) WHERE deleted_at IS NULL;

-- Manifests
CREATE INDEX idx_manifests_org_id ON public.manifests(org_id);
CREATE INDEX idx_manifests_status ON public.manifests(status);
CREATE INDEX idx_manifests_from_hub ON public.manifests(from_hub_id);
CREATE INDEX idx_manifests_to_hub ON public.manifests(to_hub_id);
CREATE INDEX idx_manifests_org_status ON public.manifests(org_id, status);
CREATE INDEX idx_manifests_created_by_staff_id ON public.manifests(created_by_staff_id);
CREATE INDEX idx_manifests_closed_by_staff_id ON public.manifests(closed_by_staff_id);

-- Manifest Items
CREATE INDEX idx_manifest_items_org_id ON public.manifest_items(org_id);
CREATE INDEX idx_manifest_items_manifest_id ON public.manifest_items(manifest_id);
CREATE INDEX idx_manifest_items_shipment_id ON public.manifest_items(shipment_id);
CREATE INDEX idx_manifest_items_scanned_by_staff_id ON public.manifest_items(scanned_by_staff_id);

-- Tracking Events
CREATE INDEX idx_tracking_events_org_id ON public.tracking_events(org_id);
CREATE INDEX idx_tracking_events_shipment_id ON public.tracking_events(shipment_id);
CREATE INDEX idx_tracking_events_awb ON public.tracking_events(awb_number);
CREATE INDEX idx_tracking_events_hub_id ON public.tracking_events(hub_id);
CREATE INDEX idx_tracking_events_actor_staff_id ON public.tracking_events(actor_staff_id);
CREATE INDEX idx_tracking_events_event_time ON public.tracking_events(event_time DESC);
CREATE INDEX idx_tracking_events_shipment ON public.tracking_events(shipment_id, created_at DESC);

-- Invoices
CREATE INDEX idx_invoices_org_id ON public.invoices(org_id);
CREATE INDEX idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX idx_invoices_shipment_id ON public.invoices(shipment_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);

-- Customers
CREATE INDEX idx_customers_org_id ON public.customers(org_id);
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_deleted_at ON public.customers(deleted_at);

-- Exceptions
CREATE INDEX idx_exceptions_org_id ON public.exceptions(org_id);
CREATE INDEX idx_exceptions_shipment_id ON public.exceptions(shipment_id);
CREATE INDEX idx_exceptions_status ON public.exceptions(status);
CREATE INDEX idx_exceptions_severity ON public.exceptions(severity);
CREATE INDEX idx_exceptions_org_status ON public.exceptions(org_id, status);
CREATE INDEX idx_exceptions_assigned_to_staff_id ON public.exceptions(assigned_to_staff_id);
CREATE INDEX idx_exceptions_reported_by_staff_id ON public.exceptions(reported_by_staff_id);

-- Audit Logs
CREATE INDEX idx_audit_logs_org_id ON public.audit_logs(org_id);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_staff_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_org_created ON public.audit_logs(org_id, created_at DESC);

-- Staff
CREATE INDEX idx_staff_org_id ON public.staff(org_id);
CREATE INDEX idx_staff_auth_user_id ON public.staff(auth_user_id);
CREATE INDEX idx_staff_hub_id ON public.staff(hub_id);

-- Hubs
CREATE INDEX idx_hubs_org_id ON public.hubs(org_id);
CREATE INDEX idx_hubs_code ON public.hubs(code);

-- Packages
CREATE INDEX idx_packages_org_id ON public.packages(org_id);
CREATE INDEX idx_packages_shipment_id ON public.packages(shipment_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Get Current Org ID from Auth Session
CREATE OR REPLACE FUNCTION public.get_current_org_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    org_id uuid;
BEGIN
    SELECT s.org_id INTO org_id
    FROM staff s
    WHERE s.auth_user_id = auth.uid()
    LIMIT 1;
    RETURN org_id;
END;
$$;

-- Get User Org ID (alias)
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    org_id uuid;
BEGIN
    SELECT s.org_id INTO org_id
    FROM staff s
    WHERE s.auth_user_id = auth.uid()
    LIMIT 1;
    RETURN org_id;
END;
$$;

-- Get User Hub ID
CREATE OR REPLACE FUNCTION public.get_user_hub_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    hub_id uuid;
BEGIN
    SELECT s.hub_id INTO hub_id
    FROM staff s
    WHERE s.auth_user_id = auth.uid()
    LIMIT 1;
    RETURN hub_id;
END;
$$;

-- Check if User Has Role
CREATE OR REPLACE FUNCTION public.has_role(required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM staff s
        WHERE s.auth_user_id = auth.uid()
        AND s.role = ANY(required_roles)
    );
END;
$$;

-- Check Hub Access
CREATE OR REPLACE FUNCTION public.can_access_hub(hub_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM staff s
        WHERE s.auth_user_id = auth.uid()
        AND (s.hub_id = hub_id OR s.role IN ('ADMIN', 'MANAGER'))
    );
END;
$$;

-- Check Warehouse Role
CREATE OR REPLACE FUNCTION public.is_warehouse_role()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM staff s
        WHERE s.auth_user_id = auth.uid()
        AND s.role IN ('WAREHOUSE_IMPHAL', 'WAREHOUSE_DELHI', 'ADMIN', 'MANAGER')
    );
END;
$$;

-- Generate AWB Number
CREATE OR REPLACE FUNCTION public.generate_awb_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_year TEXT;
    v_sequence INT;
    v_awb TEXT;
BEGIN
    v_year := to_char(now(), 'YYYY');
    
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(awb_number FROM 8 FOR 6) AS INTEGER)
    ), 0) + 1
    INTO v_sequence
    FROM public.shipments
    WHERE org_id = p_org_id
      AND awb_number LIKE 'TAC' || v_year || '%';
    
    v_awb := 'TAC' || v_year || LPAD(v_sequence::TEXT, 4, '0');
    
    RETURN v_awb;
END;
$$;

-- Generate Invoice Number
CREATE OR REPLACE FUNCTION public.generate_invoice_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_year INTEGER := EXTRACT(YEAR FROM now())::INTEGER;
    v_next INTEGER;
BEGIN
    INSERT INTO public.invoice_counters (org_id, year, last_number)
    VALUES (p_org_id, v_year, 1)
    ON CONFLICT (org_id, year)
    DO UPDATE SET last_number = invoice_counters.last_number + 1
    RETURNING last_number INTO v_next;

    RETURN 'INV-' || v_year::TEXT || '-' || LPAD(v_next::TEXT, 4, '0');
END;
$$;

-- Generate Manifest Number (Trigger Function)
CREATE OR REPLACE FUNCTION public.generate_manifest_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_year INTEGER;
    v_number INTEGER;
BEGIN
    IF NEW.manifest_no IS NOT NULL THEN
        RETURN NEW;
    END IF;

    v_year := EXTRACT(YEAR FROM NOW());
    
    INSERT INTO manifest_counters (org_id, year, last_number)
    VALUES (NEW.org_id, v_year, 1)
    ON CONFLICT (org_id, year) 
    DO UPDATE SET last_number = manifest_counters.last_number + 1
    RETURNING last_number INTO v_number;
    
    NEW.manifest_no := 'MNF-' || v_year || '-' || LPAD(v_number::TEXT, 4, '0');
    RETURN NEW;
END;
$$;

-- Set Invoice Number (Trigger Function)
CREATE OR REPLACE FUNCTION public.set_invoice_no()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF NEW.invoice_no IS NULL OR NEW.invoice_no = '' THEN
        NEW.invoice_no := public.generate_invoice_number(NEW.org_id);
    END IF;
    RETURN NEW;
END;
$$;

-- Audit Log Changes (Trigger Function)
CREATE OR REPLACE FUNCTION public.audit_log_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_actor_staff_id UUID;
BEGIN
    SELECT id INTO v_actor_staff_id
    FROM staff
    WHERE auth_user_id = auth.uid();

    INSERT INTO audit_logs (
        org_id,
        actor_staff_id,
        action,
        entity_type,
        entity_id,
        before,
        after
    )
    VALUES (
        COALESCE(NEW.org_id, OLD.org_id),
        v_actor_staff_id,
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id)::TEXT,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );

    RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Audit log failed: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-generate manifest number
CREATE TRIGGER trg_generate_manifest_number
    BEFORE INSERT ON public.manifests
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_manifest_number();

-- Auto-generate invoice number
CREATE TRIGGER trg_set_invoice_no
    BEFORE INSERT ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.set_invoice_no();

-- Audit logging triggers (applied to critical tables)
CREATE TRIGGER audit_shipments
    AFTER INSERT OR UPDATE OR DELETE ON public.shipments
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

CREATE TRIGGER audit_manifests
    AFTER INSERT OR UPDATE OR DELETE ON public.manifests
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

CREATE TRIGGER audit_invoices
    AFTER INSERT OR UPDATE OR DELETE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

CREATE TRIGGER audit_exceptions
    AFTER INSERT OR UPDATE OR DELETE ON public.exceptions
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manifest_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manifest_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Org Isolation
-- All authenticated users can only access their organization's data

CREATE POLICY "org_isolation" ON public.shipments
    FOR ALL TO authenticated
    USING (org_id = get_user_org_id());

CREATE POLICY "org_isolation" ON public.customers
    FOR ALL TO authenticated
    USING (org_id = get_user_org_id());

CREATE POLICY "org_isolation" ON public.manifests
    FOR ALL TO authenticated
    USING (org_id = get_user_org_id());

CREATE POLICY "org_isolation" ON public.manifest_items
    FOR ALL TO authenticated
    USING (org_id = get_user_org_id());

CREATE POLICY "org_isolation" ON public.invoices
    FOR ALL TO authenticated
    USING (org_id = get_user_org_id());

CREATE POLICY "org_isolation" ON public.tracking_events
    FOR ALL TO authenticated
    USING (org_id = get_user_org_id());

CREATE POLICY "org_isolation" ON public.exceptions
    FOR ALL TO authenticated
    USING (org_id = get_user_org_id());

CREATE POLICY "org_isolation" ON public.audit_logs
    FOR ALL TO authenticated
    USING (org_id = get_user_org_id());

CREATE POLICY "org_isolation" ON public.packages
    FOR ALL TO authenticated
    USING (org_id = get_user_org_id());

CREATE POLICY "hubs_public_read" ON public.hubs
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "staff_org_isolation" ON public.staff
    FOR ALL TO authenticated
    USING (org_id = get_user_org_id());

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.manifests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exceptions;

-- ============================================================================
-- SEED DATA (Default Hubs)
-- ============================================================================

-- Note: Execute these after creating an org
-- INSERT INTO public.hubs (org_id, code, name, type, address) VALUES
--   ('<org_id>', 'IMPHAL', 'Imphal Hub', 'ORIGIN', '{"line1": "Airport Road", "city": "Imphal", "state": "Manipur", "zip": "795001"}'::jsonb),
--   ('<org_id>', 'NEW_DELHI', 'New Delhi Hub', 'DESTINATION', '{"line1": "IGI Airport Cargo", "city": "New Delhi", "state": "Delhi", "zip": "110037"}'::jsonb);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
