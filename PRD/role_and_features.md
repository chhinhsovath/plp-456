Core Technologies

  - Framework: Next.js 15.4.4 with App Router and Turbopack
  - Database: PostgreSQL with Prisma ORM v6.12.0
  - UI Library: Ant Design (antd) v5.26.6
  - Authentication: Custom implementation with bcryptjs + Telegram OAuth integration
  - TypeScript: Strict mode enabled
  - State Management: TanStack Query (React Query) v5.83.0
  - Charts: Recharts v3.1.0 and ECharts v5.6.0
  - Maps: Leaflet v1.9.4 with React Leaflet
  - Messaging: Telegraf v4.16.3 (Telegram Bot) + Twilio v5.8.0
  - Storage: Vercel Blob (for photos)
  - Export: ExcelJS, json2csv, xlsx
  - PWA: next-pwa with workbox

  Role Hierarchy & Permissions

  The system implements a 7-level hierarchical role-based access control system:

  1. Administrator
    - Can view: All reports
    - Manages: Zone, Provincial, Department, Cluster, Director, Teacher
    - Can approve missions: Yes
    - Access: System-wide
  2. Zone
    - Can view: All reports in their zone
    - Manages: Provincial, Department
    - Can approve missions: Yes
    - Access: Zone-wide
  3. Provincial
    - Can view: All reports in their province
    - Manages: Department, Cluster
    - Can approve missions: Yes
    - Access: Province-wide
  4. Department
    - Can view: Department & Cluster reports
    - Manages: Cluster, Director
    - Can approve missions: No
    - Access: District-wide
  5. Cluster
    - Can view: Cluster staff reports
    - Manages: Director, Teacher
    - Can approve missions: No
    - Access: School cluster
  6. Director
    - Can view: Teachers in their school
    - Manages: Teacher
    - Can approve missions: No
    - Access: School-wide
  7. Teacher
    - Can view: Only their own reports
    - Manages: None
    - Can approve missions: No
    - Access: Self only

  Cascading Geographic System

  The geographic system uses a 4-level hierarchy stored in the geographic table:

  1. Province (province_code: Int)
    - Example: province_code: 1, province_name_kh: "បន្ទាយមានជ័យ"
  2. District (district_code: BigInt)
    - Filtered by province_code
    - Example: district_code: 101, district_name_kh: "ក្រុងសិរីសោភ័ណ"
  3. Commune (commune_code: BigInt)
    - Filtered by district_code
    - Example: commune_code: 10101, commune_name_kh: "ឃុំអូរអំបិល"
  4. Village (village_code: BigInt)
    - Filtered by commune_code
    - Example: village_code: 1010101, village_name_kh: "ភូមិអូរអំបិល"

  The API endpoints use cascading filters:
  - /api/geographic/provinces - Returns all provinces
  - /api/geographic/districts?provinceId=X - Returns districts for province X
  - /api/geographic/communes?districtId=Y - Returns communes for district Y
  - /api/geographic/villages?communeId=Z - Returns villages for commune Z

  Telegram Login Integration

  The system includes Telegram OAuth authentication:

  1. Frontend Component: TelegramLoginButton.tsx
    - Uses Telegram Login Widget
    - Configurable bot name, size, language
    - Handles authentication callback
  2. Backend Authentication: /api/auth/telegram/route.ts
    - Verifies Telegram auth data using HMAC-SHA256
    - Creates/updates user accounts with Telegram info
    - Auto-assigns "Director" role to new users
    - Sets auth_provider as "telegram"
  3. User Fields for Telegram:
    - telegram_id: BigInt (unique)
    - telegram_username: String
    - telegram_photo_url: String
    - auth_provider: "telegram" or "email"
  4. Security Features:
    - Auth data verification with bot token
    - 30-days expiration check
    - Automatic user activation for Telegram users
    - Cookie-based session management
