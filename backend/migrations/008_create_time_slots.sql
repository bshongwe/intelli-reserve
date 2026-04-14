-- Create time_slots table
CREATE TABLE IF NOT EXISTS time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INT NOT NULL DEFAULT 1,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(service_id, slot_date, start_time)
);

CREATE INDEX IF NOT EXISTS idx_time_slots_service_date ON time_slots(service_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_time_slots_date_range ON time_slots(slot_date, start_time);
CREATE INDEX IF NOT EXISTS idx_time_slots_availability ON time_slots(is_available);
