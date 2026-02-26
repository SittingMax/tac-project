-- Fix mutable search_path for security warnings
ALTER FUNCTION public.generate_cn_number() SET search_path = '';
ALTER FUNCTION public.generate_manifest_number() SET search_path = '';
ALTER FUNCTION public.generate_invoice_number() SET search_path = '';
ALTER FUNCTION public.get_public_shipment_by_cn(text) SET search_path = '';
