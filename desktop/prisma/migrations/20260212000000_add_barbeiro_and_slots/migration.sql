-- Add BARBEIRO to BusinessType enum (PostgreSQL)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'BusinessType' AND e.enumlabel = 'BARBEIRO'
    ) THEN
        ALTER TYPE "BusinessType" ADD VALUE 'BARBEIRO';
    END IF;
END
$$;

-- Create slots table for appointments (barber, etc.)
CREATE TABLE IF NOT EXISTS "slots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "slots_tenant_id_idx" ON "slots"("tenant_id");
CREATE INDEX IF NOT EXISTS "slots_tenant_id_start_time_idx" ON "slots"("tenant_id", "start_time");
CREATE INDEX IF NOT EXISTS "slots_tenant_id_status_start_time_idx" ON "slots"("tenant_id", "status", "start_time");

ALTER TABLE "slots" ADD CONSTRAINT "slots_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
