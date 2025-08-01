erDiagram
    TEACHERS {
        uuid teacher_id PK
        varchar teacher_name
        varchar province_city
        varchar district_commune
        varchar village
        varchar school_name
        varchar gender
        varchar subject
        int grade_level
        timestamp created_at
        timestamp updated_at
    }

    EVALUATION_SESSIONS {
        uuid session_id PK
        uuid teacher_id FK
        varchar evaluator_name
        varchar evaluator_role
        date evaluation_date
        time start_time
        time end_time
        int chapter_number
        varchar lesson_title
        varchar lesson_topic
        int class_level
        int total_students_male
        int total_students_female
        int total_absent_male
        int total_absent_female
        varchar evaluation_type
        text general_notes
        timestamp created_at
        timestamp updated_at
    }

    INDICATORS {
        uuid indicator_id PK
        varchar indicator_code
        varchar indicator_name_km
        varchar indicator_name_en
        varchar category
        int display_order
        text description_km
        text description_en
        text ai_context
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    SUB_INDICATORS {
        uuid sub_indicator_id PK
        uuid indicator_id FK
        varchar sub_indicator_code
        varchar sub_indicator_name_km
        varchar sub_indicator_name_en
        int display_order
        text description_km
        text description_en
        text ai_context
        int max_score
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    EVALUATION_SCORES {
        uuid score_id PK
        uuid session_id FK
        uuid sub_indicator_id FK
        int score
        text notes
        timestamp created_at
        timestamp updated_at
    }

    STUDENT_ASSESSMENT {
        uuid assessment_id PK
        uuid session_id FK
        varchar subject_name
        int student_1_score
        int student_2_score
        int student_3_score
        int student_4_score
        varchar assessment_type
        text notes
        timestamp created_at
        timestamp updated_at
    }

    AI_CHAT_SESSIONS {
        uuid chat_session_id PK
        uuid session_id FK
        uuid teacher_id FK
        varchar session_title
        text context_data
        timestamp started_at
        timestamp last_activity
        boolean is_active
    }

    AI_CHAT_MESSAGES {
        uuid message_id PK
        uuid chat_session_id FK
        varchar sender_type
        text message_content
        json metadata
        timestamp sent_at
    }

    EVALUATION_RECOMMENDATIONS {
        uuid recommendation_id PK
        uuid session_id FK
        varchar category
        text recommendation_km
        text recommendation_en
        int priority
        boolean is_implemented
        timestamp created_at
        timestamp updated_at
    }

    TEACHERS ||--o{ EVALUATION_SESSIONS : has
    EVALUATION_SESSIONS ||--o{ EVALUATION_SCORES : contains
    EVALUATION_SESSIONS ||--o{ STUDENT_ASSESSMENT : includes
    EVALUATION_SESSIONS ||--o{ AI_CHAT_SESSIONS : generates
    EVALUATION_SESSIONS ||--o{ EVALUATION_RECOMMENDATIONS : produces
    INDICATORS ||--o{ SUB_INDICATORS : contains
    SUB_INDICATORS ||--o{ EVALUATION_SCORES : measured_by
    AI_CHAT_SESSIONS ||--o{ AI_CHAT_MESSAGES : contains