/*
  Warnings:

  - You are about to drop the column `applicant_name` on the `appointments` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_appointments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "appointment_no" TEXT NOT NULL,
    "showroom_id" INTEGER NOT NULL,
    "lead_id" INTEGER,
    "visit_date" DATETIME NOT NULL,
    "visit_time_slot" TEXT NOT NULL,
    "visitor_count" INTEGER NOT NULL,
    "contact_name" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "position" TEXT,
    "industry" TEXT,
    "customer_type" TEXT,
    "interest_areas" TEXT,
    "need_solution_consulting" TEXT,
    "visit_purpose" TEXT,
    "need_guide" BOOLEAN NOT NULL DEFAULT true,
    "customer_remark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approval_opinion" TEXT,
    "reject_reason" TEXT,
    "approved_by" INTEGER,
    "approved_at" DATETIME,
    "receptionist" TEXT,
    "reception_note" TEXT,
    "follow_up_note" TEXT,
    "internal_contact_info" TEXT,
    "customer_level" TEXT,
    "main_visitor_info" TEXT,
    "visit_start_time" DATETIME,
    "visit_end_time" DATETIME,
    "actual_reception_location" TEXT,
    "need_vehicle" TEXT,
    "vehicle_requirement" TEXT,
    "need_accommodation" TEXT,
    "accommodation_requirement" TEXT,
    "need_dining" TEXT,
    "dining_requirement" TEXT,
    "gift_preparation" TEXT,
    "gift_requirement" TEXT,
    "reception_schedule_note" TEXT,
    "reception_preparation_note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "appointments_showroom_id_fkey" FOREIGN KEY ("showroom_id") REFERENCES "showrooms" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "appointments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "appointments_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "admin_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_appointments" ("accommodation_requirement", "actual_reception_location", "appointment_no", "approval_opinion", "approved_at", "approved_by", "company_name", "contact_name", "contact_phone", "created_at", "customer_level", "customer_remark", "customer_type", "dining_requirement", "follow_up_note", "gift_preparation", "gift_requirement", "id", "industry", "interest_areas", "internal_contact_info", "lead_id", "main_visitor_info", "need_accommodation", "need_dining", "need_guide", "need_solution_consulting", "need_vehicle", "position", "reception_note", "reception_preparation_note", "reception_schedule_note", "receptionist", "reject_reason", "showroom_id", "status", "updated_at", "vehicle_requirement", "visit_date", "visit_end_time", "visit_purpose", "visit_start_time", "visit_time_slot", "visitor_count") SELECT "accommodation_requirement", "actual_reception_location", "appointment_no", "approval_opinion", "approved_at", "approved_by", "company_name", "contact_name", "contact_phone", "created_at", "customer_level", "customer_remark", "customer_type", "dining_requirement", "follow_up_note", "gift_preparation", "gift_requirement", "id", "industry", "interest_areas", "internal_contact_info", "lead_id", "main_visitor_info", "need_accommodation", "need_dining", "need_guide", "need_solution_consulting", "need_vehicle", "position", "reception_note", "reception_preparation_note", "reception_schedule_note", "receptionist", "reject_reason", "showroom_id", "status", "updated_at", "vehicle_requirement", "visit_date", "visit_end_time", "visit_purpose", "visit_start_time", "visit_time_slot", "visitor_count" FROM "appointments";
DROP TABLE "appointments";
ALTER TABLE "new_appointments" RENAME TO "appointments";
CREATE UNIQUE INDEX "appointments_appointment_no_key" ON "appointments"("appointment_no");
CREATE INDEX "appointments_showroom_id_idx" ON "appointments"("showroom_id");
CREATE INDEX "appointments_lead_id_idx" ON "appointments"("lead_id");
CREATE INDEX "appointments_status_idx" ON "appointments"("status");
CREATE INDEX "appointments_visit_date_idx" ON "appointments"("visit_date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
