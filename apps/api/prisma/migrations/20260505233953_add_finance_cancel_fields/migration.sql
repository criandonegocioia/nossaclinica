-- Migration: add cancel fields to Finance
ALTER TABLE "finances" ADD COLUMN IF NOT EXISTS "canceled_at" TIMESTAMP(3);
ALTER TABLE "finances" ADD COLUMN IF NOT EXISTS "cancel_reason" TEXT;
