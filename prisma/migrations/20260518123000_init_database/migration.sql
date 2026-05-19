-- CreateTable
CREATE TABLE "admin_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "real_name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "showrooms" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cover_image" TEXT,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "opening_hours" TEXT,
    "suggested_duration" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "appointments" (
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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "appointments_showroom_id_fkey" FOREIGN KEY ("showroom_id") REFERENCES "showrooms" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "appointments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "appointments_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "admin_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "leads" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contact_name" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "position" TEXT,
    "industry" TEXT,
    "latest_showroom_id" INTEGER,
    "latest_appointment_id" INTEGER,
    "appointment_count" INTEGER NOT NULL DEFAULT 0,
    "follow_up_note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "leads_latest_showroom_id_fkey" FOREIGN KEY ("latest_showroom_id") REFERENCES "showrooms" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "leads_latest_appointment_id_fkey" FOREIGN KEY ("latest_appointment_id") REFERENCES "appointments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "showrooms_name_key" ON "showrooms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_appointment_no_key" ON "appointments"("appointment_no");

-- CreateIndex
CREATE INDEX "appointments_showroom_id_idx" ON "appointments"("showroom_id");

-- CreateIndex
CREATE INDEX "appointments_lead_id_idx" ON "appointments"("lead_id");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "appointments_visit_date_idx" ON "appointments"("visit_date");

-- CreateIndex
CREATE UNIQUE INDEX "leads_contact_phone_key" ON "leads"("contact_phone");

-- CreateIndex
CREATE UNIQUE INDEX "leads_latest_appointment_id_key" ON "leads"("latest_appointment_id");

-- CreateIndex
CREATE INDEX "leads_latest_showroom_id_idx" ON "leads"("latest_showroom_id");
