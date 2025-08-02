-- CreateTable
CREATE TABLE "inspection_sessions" (
    "id" TEXT NOT NULL,
    "province" VARCHAR(100) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "commune" VARCHAR(100) NOT NULL,
    "village" VARCHAR(100),
    "cluster" VARCHAR(100),
    "school" VARCHAR(255) NOT NULL,
    "name_of_teacher" VARCHAR(255) NOT NULL,
    "sex" VARCHAR(10) NOT NULL,
    "employment_type" VARCHAR(20) NOT NULL,
    "session_time" VARCHAR(20) NOT NULL,
    "subject" VARCHAR(100) NOT NULL,
    "chapter" VARCHAR(10),
    "lesson" VARCHAR(10),
    "title" TEXT,
    "sub_title" TEXT,
    "inspection_date" TIMESTAMP(3) NOT NULL,
    "start_time" TIME(6),
    "end_time" TIME(6),
    "grade" INTEGER NOT NULL,
    "total_male" INTEGER NOT NULL DEFAULT 0,
    "total_female" INTEGER NOT NULL DEFAULT 0,
    "total_absent" INTEGER NOT NULL DEFAULT 0,
    "total_absent_female" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "inspector_name" VARCHAR(255),
    "inspector_position" VARCHAR(100),
    "inspector_organization" VARCHAR(255),
    "academic_year" VARCHAR(20),
    "semester" INTEGER,
    "lesson_duration_minutes" INTEGER,
    "inspection_status" VARCHAR(20) NOT NULL DEFAULT 'completed',
    "general_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "user_id" INTEGER,

    CONSTRAINT "inspection_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_fields" (
    "field_id" SERIAL NOT NULL,
    "indicator_sequence" INTEGER NOT NULL,
    "indicator_main" VARCHAR(100) NOT NULL,
    "indicator_main_en" VARCHAR(200) NOT NULL,
    "indicator_sub" TEXT NOT NULL,
    "indicator_sub_en" TEXT NOT NULL,
    "evaluation_level" INTEGER NOT NULL,
    "scoring_options" JSONB DEFAULT '{"yes": true, "some_practice": true, "no": true}',
    "ai_context" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_fields_pkey" PRIMARY KEY ("field_id")
);

-- CreateTable
CREATE TABLE "evaluation_records" (
    "id" TEXT NOT NULL,
    "inspection_session_id" TEXT NOT NULL,
    "field_id" INTEGER NOT NULL,
    "score_value" VARCHAR(20) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(255),

    CONSTRAINT "evaluation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_assessment_sessions" (
    "assessment_id" TEXT NOT NULL,
    "inspection_session_id" TEXT NOT NULL,
    "assessment_type" VARCHAR(50) NOT NULL DEFAULT 'sample_students',
    "assessment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "student_assessment_sessions_pkey" PRIMARY KEY ("assessment_id")
);

-- CreateTable
CREATE TABLE "assessment_subjects" (
    "subject_id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "subject_name_km" VARCHAR(100) NOT NULL,
    "subject_name_en" VARCHAR(100),
    "subject_order" INTEGER NOT NULL,
    "max_score" DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    "min_score" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_subjects_pkey" PRIMARY KEY ("subject_id")
);

-- CreateTable
CREATE TABLE "assessment_students" (
    "student_id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "student_identifier" VARCHAR(50) NOT NULL,
    "student_order" INTEGER NOT NULL,
    "student_name" VARCHAR(255),
    "student_gender" VARCHAR(10),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_students_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "student_scores" (
    "score_id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "score" DECIMAL(5,2),
    "score_text" VARCHAR(20),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_scores_pkey" PRIMARY KEY ("score_id")
);

-- CreateIndex
CREATE INDEX "inspection_sessions_province_idx" ON "inspection_sessions"("province");

-- CreateIndex
CREATE INDEX "inspection_sessions_district_idx" ON "inspection_sessions"("district");

-- CreateIndex
CREATE INDEX "inspection_sessions_school_idx" ON "inspection_sessions"("school");

-- CreateIndex
CREATE INDEX "inspection_sessions_name_of_teacher_idx" ON "inspection_sessions"("name_of_teacher");

-- CreateIndex
CREATE INDEX "inspection_sessions_inspection_date_idx" ON "inspection_sessions"("inspection_date");

-- CreateIndex
CREATE INDEX "inspection_sessions_grade_idx" ON "inspection_sessions"("grade");

-- CreateIndex
CREATE INDEX "inspection_sessions_subject_idx" ON "inspection_sessions"("subject");

-- CreateIndex
CREATE INDEX "inspection_sessions_level_idx" ON "inspection_sessions"("level");

-- CreateIndex
CREATE INDEX "inspection_sessions_inspection_status_idx" ON "inspection_sessions"("inspection_status");

-- CreateIndex
CREATE INDEX "inspection_sessions_is_active_idx" ON "inspection_sessions"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "master_fields_indicator_sequence_key" ON "master_fields"("indicator_sequence");

-- CreateIndex
CREATE INDEX "master_fields_evaluation_level_idx" ON "master_fields"("evaluation_level");

-- CreateIndex
CREATE INDEX "master_fields_indicator_main_idx" ON "master_fields"("indicator_main");

-- CreateIndex
CREATE INDEX "master_fields_is_active_idx" ON "master_fields"("is_active");

-- CreateIndex
CREATE INDEX "master_fields_indicator_sequence_idx" ON "master_fields"("indicator_sequence");

-- CreateIndex
CREATE INDEX "evaluation_records_inspection_session_id_idx" ON "evaluation_records"("inspection_session_id");

-- CreateIndex
CREATE INDEX "evaluation_records_field_id_idx" ON "evaluation_records"("field_id");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_records_inspection_session_id_field_id_key" ON "evaluation_records"("inspection_session_id", "field_id");

-- CreateIndex
CREATE INDEX "student_assessment_sessions_inspection_session_id_idx" ON "student_assessment_sessions"("inspection_session_id");

-- CreateIndex
CREATE INDEX "assessment_subjects_assessment_id_idx" ON "assessment_subjects"("assessment_id");

-- CreateIndex
CREATE INDEX "assessment_students_assessment_id_idx" ON "assessment_students"("assessment_id");

-- CreateIndex
CREATE INDEX "student_scores_assessment_id_idx" ON "student_scores"("assessment_id");

-- CreateIndex
CREATE INDEX "student_scores_subject_id_idx" ON "student_scores"("subject_id");

-- CreateIndex
CREATE INDEX "student_scores_student_id_idx" ON "student_scores"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_scores_assessment_id_subject_id_student_id_key" ON "student_scores"("assessment_id", "subject_id", "student_id");

-- AddForeignKey
ALTER TABLE "inspection_sessions" ADD CONSTRAINT "inspection_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_records" ADD CONSTRAINT "evaluation_records_inspection_session_id_fkey" FOREIGN KEY ("inspection_session_id") REFERENCES "inspection_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_records" ADD CONSTRAINT "evaluation_records_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "master_fields"("field_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_assessment_sessions" ADD CONSTRAINT "student_assessment_sessions_inspection_session_id_fkey" FOREIGN KEY ("inspection_session_id") REFERENCES "inspection_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_subjects" ADD CONSTRAINT "assessment_subjects_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "student_assessment_sessions"("assessment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_students" ADD CONSTRAINT "assessment_students_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "student_assessment_sessions"("assessment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_scores" ADD CONSTRAINT "student_scores_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "student_assessment_sessions"("assessment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_scores" ADD CONSTRAINT "student_scores_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "assessment_subjects"("subject_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_scores" ADD CONSTRAINT "student_scores_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "assessment_students"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;