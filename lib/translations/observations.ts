export const observationTranslations = {
  km: {
    // Page title and navigation
    title: 'ការសង្កេតក្នុងថ្នាក់រៀន',
    newObservation: 'ការសង្កេតថ្មី',
    
    // Table columns
    date: 'កាលបរិច្ឆេទ',
    school: 'សាលារៀន',
    teacher: 'គ្រូបង្រៀន',
    subject: 'មុខវិជ្ជា',
    grade: 'ថ្នាក់',
    level: 'កម្រិត',
    status: 'ស្ថានភាព',
    location: 'ទីតាំង',
    createdBy: 'បង្កើតដោយ',
    actions: 'សកម្មភាព',
    
    // Status labels
    completed: 'បានបញ្ចប់',
    inProgress: 'កំពុងដំណើរការ',
    scheduled: 'បានកំណត់ពេល',
    cancelled: 'បានលុបចោល',
    
    // Search and filters
    searchPlaceholder: 'ស្វែងរកតាមសាលា គ្រូ ឬមុខវិជ្ជា',
    statusPlaceholder: 'ស្ថានភាព',
    levelPlaceholder: 'កម្រិត',
    searchButton: 'ស្វែងរក',
    
    // Actions
    view: 'មើល',
    edit: 'កែសម្រួល',
    delete: 'លុប',
    confirmDelete: 'តើអ្នកប្រាកដថាចង់លុបការសង្កេតនេះទេ?',
    
    // Messages
    deleteSuccess: 'បានលុបការសង្កេតដោយជោគជ័យ',
    deleteFailed: 'បរាជ័យក្នុងការលុបការសង្កេត',
    loadFailed: 'បរាជ័យក្នុងការផ្ទុកការសង្កេត',
    loading: 'កំពុងផ្ទុក...',
    
    // Pagination
    totalObservations: 'ការសង្កេតសរុប',
    
    // Level display
    levelDisplay: 'កម្រិត'
  },
  en: {
    // Page title and navigation
    title: 'Classroom Observations',
    newObservation: 'New Observation',
    
    // Table columns
    date: 'Date',
    school: 'School',
    teacher: 'Teacher',
    subject: 'Subject',
    grade: 'Grade',
    level: 'Level',
    status: 'Status',
    location: 'Location',
    createdBy: 'Created By',
    actions: 'Actions',
    
    // Status labels
    completed: 'Completed',
    inProgress: 'In Progress',
    scheduled: 'Scheduled',
    cancelled: 'Cancelled',
    
    // Search and filters
    searchPlaceholder: 'Search by school, teacher, or subject',
    statusPlaceholder: 'Status',
    levelPlaceholder: 'Level',
    searchButton: 'Search',
    
    // Actions
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to delete this observation?',
    
    // Messages
    deleteSuccess: 'Observation deleted successfully',
    deleteFailed: 'Failed to delete observation',
    loadFailed: 'Failed to load observations',
    loading: 'Loading...',
    
    // Pagination
    totalObservations: 'Total observations',
    
    // Level display
    levelDisplay: 'Level'
  }
};

export type Language = 'km' | 'en';
export type TranslationKey = keyof typeof observationTranslations.en;