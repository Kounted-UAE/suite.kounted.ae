-- Add Resend tracking columns to payroll_payslip_send_events table
-- This migration adds support for tracking Resend email IDs and delivery status

-- Create table if it doesn't exist (base schema)
create table if not exists public.payroll_payslip_send_events (
  id uuid not null default gen_random_uuid(),
  batch_id uuid not null,
  recipients text not null,
  status text not null check (status in ('sent','failed')),
  error_message text null,
  created_at timestamptz not null default now(),
  constraint payroll_payslip_send_events_pkey primary key (id)
);

-- Create base index if it doesn't exist
create index if not exists idx_payslip_send_events_batch_id
  on public.payroll_payslip_send_events (batch_id);

-- Enable RLS if not already enabled (this will not error if already enabled)
do $$
begin
  alter table public.payroll_payslip_send_events enable row level security;
exception
  when others then null; -- Ignore if already enabled or other errors
end $$;

-- Add resend_email_id column to store the Resend email ID
alter table public.payroll_payslip_send_events
  add column if not exists resend_email_id text null;

-- Add delivery_status column to track email delivery status
-- Possible values: sent, delivered, bounced, complained, opened, clicked, etc.
alter table public.payroll_payslip_send_events
  add column if not exists delivery_status text null;

-- Add delivery_status_updated_at timestamp for when status was last updated
alter table public.payroll_payslip_send_events
  add column if not exists delivery_status_updated_at timestamptz null;

-- Add resend_last_event to store the last event type from Resend
alter table public.payroll_payslip_send_events
  add column if not exists resend_last_event text null;

-- Create index on resend_email_id for faster lookups
create index if not exists idx_payslip_send_events_resend_email_id
  on public.payroll_payslip_send_events (resend_email_id);

-- Create index on delivery_status for filtering
create index if not exists idx_payslip_send_events_delivery_status
  on public.payroll_payslip_send_events (delivery_status);

