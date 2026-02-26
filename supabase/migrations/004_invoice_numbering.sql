-- ============================================================================
-- Migration 004: Invoice Numbering & Counters
-- Ensures invoice numbers are generated server-side to avoid conflicts.
-- ============================================================================

-- Table to track invoice sequencing per org + year
CREATE TABLE IF NOT EXISTS public.invoice_counters (
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  year integer NOT NULL,
  last_number integer NOT NULL DEFAULT 0,
  PRIMARY KEY (org_id, year)
);

ALTER TABLE public.invoice_counters ENABLE ROW LEVEL SECURITY;

-- Lock down access (only service role / definer functions)
REVOKE ALL ON TABLE public.invoice_counters FROM PUBLIC;
REVOKE ALL ON TABLE public.invoice_counters FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.invoice_counters TO service_role;

DROP POLICY IF EXISTS "Service role manages invoice counters" ON public.invoice_counters;
CREATE POLICY "Service role manages invoice counters"
  ON public.invoice_counters
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function: Generate invoice number (INV-YYYY-0001)
CREATE OR REPLACE FUNCTION public.generate_invoice_number(p_org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_year integer := EXTRACT(YEAR FROM now())::integer;
  v_next integer;
BEGIN
  INSERT INTO public.invoice_counters (org_id, year, last_number)
  VALUES (p_org_id, v_year, 1)
  ON CONFLICT (org_id, year)
  DO UPDATE SET last_number = invoice_counters.last_number + 1
  RETURNING last_number INTO v_next;

  RETURN 'INV-' || v_year::text || '-' || LPAD(v_next::text, 4, '0');
END;
$function$;

REVOKE ALL ON FUNCTION public.generate_invoice_number(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_invoice_number(uuid) TO service_role;

-- Trigger: set invoice_no before insert
CREATE OR REPLACE FUNCTION public.set_invoice_no()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.invoice_no IS NULL OR NEW.invoice_no = '' THEN
    NEW.invoice_no := public.generate_invoice_number(NEW.org_id);
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_invoice_no() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_invoice_no() TO service_role;

DROP TRIGGER IF EXISTS set_invoice_no ON public.invoices;
CREATE TRIGGER set_invoice_no
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_invoice_no();
