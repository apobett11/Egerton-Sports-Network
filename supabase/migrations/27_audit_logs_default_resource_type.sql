-- Migration 27: Audit Logs Default Resource Type
-- Provides a defense-in-depth default value for resource_type to avoid HTTP 400 Bad Request on telemetry logs

ALTER TABLE public.audit_logs 
  ALTER COLUMN resource_type SET DEFAULT 'system';
