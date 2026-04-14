-- Migration: 007_analytics_schema_cleanup.sql
-- Created: 2026-04-13
-- Purpose: Remove unused pre-aggregated snapshot tables (analytics, dashboard_metrics)
--          and add missing indexes for analytics query performance.
--
-- The analytics and dashboard_metrics tables were never written to — all metrics
-- are computed live from bookings + services by the analytics gRPC service.
-- Keeping them creates confusion about the source of truth.

-- Drop unused snapshot tables
DROP TABLE IF EXISTS dashboard_metrics;
DROP TABLE IF EXISTS analytics;

-- Add missing indexes on bookings for analytics query patterns
CREATE INDEX IF NOT EXISTS idx_bookings_client_email  ON bookings(client_email);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at    ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_host_status   ON bookings(host_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_host_created  ON bookings(host_id, created_at DESC);

-- Add missing index on services for host lookups
CREATE INDEX IF NOT EXISTS idx_services_host_active   ON services(host_id, is_active);

-- Add missing index on time_slots for occupancy queries
CREATE INDEX IF NOT EXISTS idx_time_slots_service_date ON time_slots(service_id, slot_date);
