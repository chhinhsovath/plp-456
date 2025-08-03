-- CreateTable
CREATE TABLE "draft_observations" (
    "id" TEXT NOT NULL,
    "session_key" TEXT NOT NULL,
    "step" INTEGER NOT NULL DEFAULT 1,
    "session_info" JSONB,
    "evaluation_data" JSONB,
    "student_assessment" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "user_id" INTEGER,
    "user_email" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6),

    CONSTRAINT "draft_observations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "draft_observations_session_key_key" ON "draft_observations"("session_key");

-- CreateIndex
CREATE INDEX "draft_observations_user_id_idx" ON "draft_observations"("user_id");

-- CreateIndex
CREATE INDEX "draft_observations_status_idx" ON "draft_observations"("status");

-- CreateIndex
CREATE INDEX "draft_observations_expires_at_idx" ON "draft_observations"("expires_at");

-- CreateIndex
CREATE INDEX "draft_observations_created_at_idx" ON "draft_observations"("created_at");

-- AddForeignKey
ALTER TABLE "draft_observations" ADD CONSTRAINT "draft_observations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;