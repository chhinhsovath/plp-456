# Teacher Observation Tool

A comprehensive teacher evaluation and mentoring system for grades 4-6 in Cambodia.

## 🏗 Architecture Overview

```mermaid
graph TB
    subgraph "Frontend (Next.js 15.4.4)"
        A[React Components] --> B[TanStack Query]
        B --> C[API Routes]
        A --> D[Ant Design UI]
        A --> E[Charts/Maps]
    end
    
    subgraph "Backend (Node.js)"
        C --> F[Authentication]
        F --> G[JWT/Telegram OAuth]
        C --> H[Prisma ORM]
    end
    
    subgraph "Database (PostgreSQL)"
        H --> I[(PostgreSQL)]
        I --> J[Users]
        I --> K[Teachers]
        I --> L[Evaluations]
        I --> M[Geographic]
    end
    
    subgraph "External Services"
        G --> N[Telegram Bot API]
        A --> O[Vercel Blob Storage]
        A --> P[Twilio SMS]
    end
```

## 🔐 Role-Based Access Control

```mermaid
graph TD
    A[Administrator] --> B[Zone]
    B --> C[Provincial]
    C --> D[Department]
    D --> E[Cluster]
    E --> F[Director]
    F --> G[Teacher]
    
    A --> |"Manages All"| ALL[All Users]
    B --> |"Manages"| BM[Provincial, Department]
    C --> |"Manages"| CM[Department, Cluster]
    D --> |"Manages"| DM[Cluster, Director]
    E --> |"Manages"| EM[Director, Teacher]
    F --> |"Manages"| FM[Teacher]
    G --> |"Self Only"| GM[Own Data]
```

## 🌍 Geographic Hierarchy

```mermaid
graph TD
    P[Province] --> D[District]
    D --> C[Commune]
    C --> V[Village]
    
    P --> |"Example"| P1[បន្ទាយមានជ័យ]
    D --> |"Example"| D1[ក្រុងសិរីសោភ័ណ]
    C --> |"Example"| C1[ឃុំអូរអំបិល]
    V --> |"Example"| V1[ភូមិអូរអំបិល]
```

## 📊 Evaluation Flow

```mermaid
sequenceDiagram
    participant E as Evaluator
    participant S as System
    participant T as Teacher
    participant AI as AI Mentor
    
    E->>S: Start Evaluation
    S->>S: Load Indicators
    E->>S: Fill General Info
    E->>S: Score Indicators
    E->>S: Assess Students
    E->>S: Submit Evaluation
    S->>T: Notify Results
    T->>AI: Request Mentoring
    AI->>T: Provide Recommendations
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Telegram Bot Token (for OAuth)
- Twilio Account (for SMS)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd teacher-observation
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations:
```bash
npm run prisma:migrate
npm run prisma:seed
```

5. Start the development server:
```bash
npm run dev
```

### Docker Setup

```bash
docker-compose up -d
```

## 📱 Features

### Core Features
- ✅ Teacher evaluation forms with Khmer/English support
- ✅ Multi-level role-based access control
- ✅ Cascading geographic filtering
- ✅ Telegram OAuth authentication
- ✅ Real-time sync status
- ✅ Offline support (PWA)
- ✅ AI-powered mentoring chat
- ✅ Data export (Excel, CSV)

### Dashboard Features
- 📊 Real-time analytics
- 📈 Progress tracking by region
- 🗺️ Interactive maps with Leaflet
- 📱 Mobile-responsive design

### Security Features
- 🔐 JWT authentication
- 🔑 Telegram OAuth integration
- 🛡️ Role-based permissions
- 📝 Audit logging

## 🗂 Database Schema

The system uses PostgreSQL with the following main tables:

- **users**: System users with roles and geographic assignments
- **teachers**: Teacher profiles
- **evaluation_sessions**: Evaluation records
- **indicators**: Main evaluation categories
- **sub_indicators**: Specific evaluation criteria
- **evaluation_scores**: Individual scores for each indicator
- **student_assessment**: Sample student evaluations
- **ai_chat_sessions**: AI mentoring conversations
- **geographic**: Province/District/Commune/Village hierarchy

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15.4.4 with App Router and Turbopack
- **UI Library**: Ant Design v5.26.6
- **State Management**: TanStack Query v5.83.0
- **Charts**: Recharts v3.1.0, ECharts v5.6.0
- **Maps**: Leaflet v1.9.4

### Backend
- **Runtime**: Node.js
- **Database**: PostgreSQL with Prisma ORM v6.12.0
- **Authentication**: JWT + Telegram OAuth
- **APIs**: RESTful with Next.js API Routes

### External Services
- **Storage**: Vercel Blob
- **Messaging**: Telegram Bot API, Twilio SMS
- **PWA**: next-pwa with Workbox

## 📄 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/telegram` - Telegram OAuth
- `POST /api/auth/logout` - Logout

### Geographic API
- `GET /api/geographic/provinces` - List all provinces
- `GET /api/geographic/districts?provinceId=X` - Districts by province
- `GET /api/geographic/communes?districtId=Y` - Communes by district
- `GET /api/geographic/villages?communeId=Z` - Villages by commune

### Evaluation API
- `GET /api/evaluations` - List evaluations
- `POST /api/evaluations` - Create evaluation
- `GET /api/evaluations/:id` - Get evaluation details
- `PUT /api/evaluations/:id` - Update evaluation

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.