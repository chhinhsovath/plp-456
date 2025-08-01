# Khmer Context Mentoring System Architecture

## Overview
This mentoring system is specifically designed for the Cambodian educational context, focusing on teacher professional development through structured observation, feedback, and continuous improvement cycles.

## Core Features

### 1. Mentoring Roles & Relationships
- **Master Mentor (គ្រូណែនាំជំនាញ)**: Senior educators who train other mentors
- **Mentor (គ្រូណែនាំ)**: Experienced teachers who guide mentees
- **Mentee (គ្រូកំពុងរៀន)**: Teachers receiving mentorship
- **Coordinator (អ្នកសម្របសម្រួល)**: Manages mentoring programs at district/cluster level

### 2. Mentoring Session Types
- **Classroom Observation (ការសង្កេតក្នុងថ្នាក់រៀន)**
- **Lesson Planning Support (ការគាំទ្រផែនការបង្រៀន)**
- **Reflective Practice (ការអនុវត្តឆ្លុះបញ្ចាំង)**
- **Peer Learning Circles (វង់សិក្សាមិត្តភក្តិ)**

### 3. Key Components

#### A. Mentoring Cycle Management
```
1. Pre-observation Planning (ផែនការមុនសង្កេត)
2. Classroom Observation (ការសង្កេតថ្នាក់រៀន)
3. Post-observation Reflection (ការឆ្លុះបញ្ចាំងក្រោយសង្កេត)
4. Action Planning (ផែនការសកម្មភាព)
5. Follow-up Support (ការគាំទ្របន្ត)
```

#### B. Cultural Considerations
- Respect hierarchical relationships (គោរពឋានានុក្រម)
- Face-saving feedback approaches (វិធីផ្តល់មតិរក្សាមុខមាត់)
- Community-based learning (ការរៀនសូត្រតាមសហគមន៍)
- Buddhist principles of continuous improvement (គោលការណ៍ពុទ្ធសាសនា)

### 4. Data Models

#### Mentoring Relationship
```prisma
model MentoringRelationship {
  id              String   @id @default(uuid())
  mentorId        String   @map("mentor_id")
  menteeId        String   @map("mentee_id")
  coordinatorId   String?  @map("coordinator_id")
  startDate       DateTime @map("start_date")
  endDate         DateTime? @map("end_date")
  status          MentoringStatus @default(ACTIVE)
  focusAreas      String[] @map("focus_areas")
  goals           Json?
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
}
```

#### Mentoring Session
```prisma
model MentoringSession {
  id                String   @id @default(uuid())
  relationshipId    String   @map("relationship_id")
  sessionType       MentoringSessionType @map("session_type")
  scheduledDate     DateTime @map("scheduled_date")
  actualDate        DateTime? @map("actual_date")
  duration          Int?     // in minutes
  location          String?
  status            SessionStatus @default(SCHEDULED)
  preSessionNotes   Json?    @map("pre_session_notes")
  sessionNotes      Json?    @map("session_notes")
  postSessionNotes  Json?    @map("post_session_notes")
  actionItems       Json?    @map("action_items")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")
}
```

### 5. Implementation Phases

#### Phase 1: Foundation (Current)
- Extend user roles for mentoring
- Create mentoring relationship model
- Basic session scheduling

#### Phase 2: Core Features
- Observation forms in Khmer
- Feedback management system
- Progress tracking

#### Phase 3: Advanced Features
- AI-powered feedback suggestions
- Analytics dashboard
- Mobile app integration

### 6. Integration Points
- Existing evaluation system
- Geographic hierarchy
- Role-based permissions
- Telegram notifications

### 7. Success Metrics
- Number of active mentoring relationships
- Session completion rates
- Teacher improvement scores
- Student outcome improvements