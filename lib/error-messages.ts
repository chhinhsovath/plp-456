// Error message translations and user-friendly messages
export interface ErrorMessage {
  title: string;
  message: string;
  action?: string;
  icon?: string;
}

export const ERROR_MESSAGES: Record<string, ErrorMessage> = {
  // Authentication errors
  UNAUTHORIZED: {
    title: 'មិនបានអនុញ្ញាត',
    message: 'អ្នកមិនបានអនុញ្ញាតឱ្យចូលប្រើប្រាស់ឬធ្វើសកម្មភាពនេះទេ។ សូមចូលប្រើប្រាស់ម្តងទៀត។',
    action: 'ចូលប្រើប្រាស់ម្តងទៀត',
    icon: 'lock',
  },
  FORBIDDEN: {
    title: 'ត្រូវបានហាមឃាត់',
    message: 'អ្នកមិនមានសិទ្ធិគ្រប់គ្រាន់ដើម្បីចូលប្រើប្រាស់ធនធាននេះទេ។',
    action: 'ទាក់ទងអ្នកគ្រប់គ្រង',
    icon: 'shield',
  },
  INVALID_CREDENTIALS: {
    title: 'ព័ត៌មានចូលមិនត្រឹមត្រូវ',
    message: 'អ៊ីមែល ឬពាក្យសម្ងាត់ដែលអ្នកបានបញ្ចូលមិនត្រឹមត្រូវទេ។ សូមព្យាយាមម្តងទៀត។',
    action: 'ព្យាយាមម្តងទៀត',
    icon: 'key',
  },
  SESSION_EXPIRED: {
    title: 'អស់សុពលភាពចូលប្រើប្រាស់',
    message: 'វគ្គចូលប្រើប្រាស់របស់អ្នកបានផុតកំណត់ហើយ។ សូមចូលប្រើប្រាស់ម្តងទៀត។',
    action: 'ចូលប្រើប្រាស់ម្តងទៀត',
    icon: 'clock',
  },

  // Validation errors
  VALIDATION_ERROR: {
    title: 'ព័ត៌មានមិនត្រឹមត្រូវ',
    message: 'ព័ត៌មានដែលអ្នកបានបញ្ចូលមិនត្រឹមត្រូវ។ សូមពិនិត្យ និងព្យាយាមម្តងទៀត។',
    action: 'ពិនិត្យព័ត៌មាន',
    icon: 'warning',
  },
  REQUIRED_FIELD: {
    title: 'បំពេញព័ត៌មានចាំបាច់',
    message: 'សូមបំពេញព័ត៌មានចាំបាច់ទាំងអស់។',
    action: 'បំពេញព័ត៌មាន',
    icon: 'edit',
  },
  INVALID_EMAIL: {
    title: 'អ៊ីមែលមិនត្រឹមត្រូវ',
    message: 'សូមបញ្ចូលអ៊ីមែលដែលមានទម្រង់ត្រឹមត្រូវ។',
    action: 'ពិនិត្យអ៊ីមែល',
    icon: 'mail',
  },
  INVALID_PHONE: {
    title: 'លេខទូរស័ព្ទមិនត្រឹមត្រូវ',
    message: 'សូមបញ្ចូលលេខទូរស័ព្ទដែលមានទម្រង់ត្រឹមត្រូវ។',
    action: 'ពិនិត្យលេខទូរស័ព្ទ',
    icon: 'phone',
  },
  PASSWORD_TOO_SHORT: {
    title: 'ពាក្យសម្ងាត់ខ្លីពេក',
    message: 'ពាក្យសម្ងាត់ត្រូវតែមានយ៉ាងតិច ៨ តួអក្សរ។',
    action: 'បង្កើតពាក្យសម្ងាត់ថ្មី',
    icon: 'lock',
  },
  PASSWORDS_DONT_MATCH: {
    title: 'ពាក្យសម្ងាត់មិនដូចគ្នា',
    message: 'ពាក្យសម្ងាត់ និងការបញ្ជាក់ពាក្យសម្ងាត់មិនដូចគ្នាទេ។',
    action: 'ពិនិត្យពាក្យសម្ងាត់',
    icon: 'lock',
  },

  // Database errors
  DATABASE_ERROR: {
    title: 'បញ្ហាមូលដ្ឋានទិន្នន័យ',
    message: 'មានបញ្ហាក្នុងការភ្ជាប់ទៅមូលដ្ឋានទិន្នន័យ។ សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិច។',
    action: 'ព្យាយាមម្តងទៀត',
    icon: 'database',
  },
  DUPLICATE_ENTRY: {
    title: 'ព័ត៌មានស្ទួន',
    message: 'ព័ត៌មាននេះមានរួចហើយក្នុងប្រព័ន្ធ។ សូមប្រើព័ត៌មានផ្សេង។',
    action: 'ប្រើព័ត៌មានផ្សេង',
    icon: 'copy',
  },
  FOREIGN_KEY_CONSTRAINT: {
    title: 'មិនអាចលុបបាន',
    message: 'មិនអាចលុបទិន្នន័យនេះបានទេ ដោយសារវាកំពុងត្រូវបានប្រើប្រាស់ដោយទិន្នន័យផ្សេងទៀត។',
    action: 'ពិនិត្យការចង់',
    icon: 'link',
  },

  // Network errors
  NETWORK_ERROR: {
    title: 'បញ្ហាបណ្តាញ',
    message: 'មានបញ្ហាក្នុងការភ្ជាប់បណ្តាញ។ សូមពិនិត្យការភ្ជាប់អ៊ីនធឺណិត និងព្យាយាមម្តងទៀត។',
    action: 'ពិនិត្យបណ្តាញ',
    icon: 'wifi',
  },
  TIMEOUT: {
    title: 'អស់ពេលកំណត់',
    message: 'សំណើសុំបានអស់ពេលកំណត់។ សូមព្យាយាមម្តងទៀត។',
    action: 'ព្យាយាមម្តងទៀត',
    icon: 'clock',
  },
  CONNECTION_FAILED: {
    title: 'មិនអាចភ្ជាប់បាន',
    message: 'មិនអាចភ្ជាប់ទៅកាន់ម៉ាស៊ីនសេវាកម្មបានទេ។ សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិច។',
    action: 'ព្យាយាមម្តងទៀត',
    icon: 'disconnect',
  },

  // File errors
  FILE_TOO_LARGE: {
    title: 'ឯកសារធំពេក',
    message: 'ឯកសារដែលអ្នកបានជ្រើសរើសមានទំហំធំពេក។ សូមជ្រើសរើសឯកសារដែលមានទំហំតូចជាងនេះ។',
    action: 'ជ្រើសរើសឯកសារថ្មី',
    icon: 'file',
  },
  INVALID_FILE_TYPE: {
    title: 'ប្រភេទឯកសារមិនត្រឹមត្រូវ',
    message: 'ប្រភេទឯកសារដែលអ្នកបានជ្រើសរើសមិនត្រូវបានគាំទ្រទេ។',
    action: 'ជ្រើសរើសប្រភេទឯកសារផ្សេង',
    icon: 'file',
  },
  UPLOAD_FAILED: {
    title: 'បរាជ័យក្នុងការបញ្ចូល',
    message: 'មិនអាចបញ្ចូលឯកសារបានទេ។ សូមពិនិត្យការភ្ជាប់បណ្តាញ និងព្យាយាមម្តងទៀត។',
    action: 'ព្យាយាមម្តងទៀត',
    icon: 'upload',
  },

  // Not found errors
  NOT_FOUND: {
    title: 'រកមិនឃើញ',
    message: 'ធនធានដែលអ្នកកំពុងតែស្វែងរករកមិនឃើញទេ។',
    action: 'ត្រលប់ទៅទំព័រដើម',
    icon: 'search',
  },
  USER_NOT_FOUND: {
    title: 'រកមិនឃើញអ្នកប្រើប្រាស់',
    message: 'អ្នកប្រើប្រាស់ដែលអ្នកកំពុងតែស្វែងរករកមិនឃើញទេ។',
    action: 'ពិនិត្យព័ត៌មាន',
    icon: 'user',
  },
  SCHOOL_NOT_FOUND: {
    title: 'រកមិនឃើញសាលារៀន',
    message: 'សាលារៀនដែលអ្នកកំពុងតែស្វែងរករកមិនឃើញទេ។',
    action: 'ពិនិត្យព័ត៌មាន',
    icon: 'school',
  },
  EVALUATION_NOT_FOUND: {
    title: 'រកមិនឃើញការវាយតម្លៃ',
    message: 'ការវាយតម្លៃដែលអ្នកកំពុងតែស្វែងរករកមិនឃើញទេ។',
    action: 'ពិនិត្យព័ត៌មាន',
    icon: 'file-text',
  },

  // Server errors
  INTERNAL_ERROR: {
    title: 'បញ្ហាផ្ទៃក្នុងម៉ាស៊ីនសេវាកម្រ',
    message: 'មានបញ្ហាបណ្តាលមកពីម៉ាស៊ីនសេវាកម្ម។ សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិច។',
    action: 'ព្យាយាមម្តងទៀត',
    icon: 'server',
  },
  SERVICE_UNAVAILABLE: {
    title: 'សេវាកម្មមិនមាន',
    message: 'សេវាកម្មកំពុងមានបញ្ហា ឬកំពុងត្រូវបានថែទាំ។ សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិច។',
    action: 'ព្យាយាមម្តងទៀត',
    icon: 'tool',
  },
  RATE_LIMIT_EXCEEDED: {
    title: 'សំណើសុំច្រើនពេក',
    message: 'អ្នកបានផ្ញើសំណើសុំច្រើនពេកក្នុងរយៈពេលខ្លី។ សូមរង់ចាំបន្តិច និងព្យាយាមម្តងទៀត។',
    action: 'រង់ចាំបន្តិច',
    icon: 'clock',
  },

  // External service errors
  EXTERNAL_SERVICE_ERROR: {
    title: 'បញ្ហាសេវាកម្មខាងក្រៅ',
    message: 'មានបញ្ហាក្នុងការភ្ជាប់ទៅកាន់សេវាកម្មខាងក្រៅ។ សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិច។',
    action: 'ព្យាយាមម្តងទៀត',
    icon: 'link',
  },
  AI_SERVICE_ERROR: {
    title: 'បញ្ហាសេវាកម្ម AI',
    message: 'មានបញ្ហាក្នុងការភ្ជាប់ទៅកាន់សេវាកម្ម AI។ សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិច។',
    action: 'ព្យាយាមម្តងទៀត',
    icon: 'robot',
  },
  EMAIL_SERVICE_ERROR: {
    title: 'បញ្ហាសេវាកម្មអ៊ីមែល',
    message: 'មិនអាចផ្ញើអ៊ីមែលបានទេ។ សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិច។',
    action: 'ព្យាយាមម្តងទៀត',
    icon: 'mail',
  },

  // Statistical operation errors
  STATS_CALCULATION_ERROR: {
    title: 'បញ្ហាគណនាស្ថិតិ',
    message: 'មានបញ្ហាក្នុងការគណនាស្ថិតិ។ ទិន្នន័យមួយចំនួនអាចមិនអាចប្រើបានទេ។',
    action: 'ផ្ទុកទិន្នន័យឡើងវិញ',
    icon: 'bar-chart',
  },
  INSUFFICIENT_DATA: {
    title: 'ទិន្នន័យមិនគ្រប់គ្រាន់',
    message: 'មិនមានទិន្នន័យគ្រប់គ្រាន់ដើម្បីបង្ហាញស្ថិតិនេះទេ។',
    action: 'បន្ថែមទិន្នន័យ',
    icon: 'pie-chart',
  },
  DATA_PROCESSING_ERROR: {
    title: 'បញ្ហាដំណើរការទិន្នន័យ',
    message: 'មានបញ្ហាក្នុងការដំណើរការទិន្នន័យ។ សូមព្យាយាមម្តងទៀត។',
    action: 'ដំណើរការម្តងទៀត',
    icon: 'sync',
  },

  // Permission errors
  INSUFFICIENT_PERMISSIONS: {
    title: 'សិទ្ធិមិនគ្រប់គ្រាន់',
    message: 'អ្នកមិនមានសិទ្ធិគ្រប់គ្រាន់ដើម្បីធ្វើសកម្មភាពនេះទេ។',
    action: 'ទាក់ទងអ្នកគ្រប់គ្រង',
    icon: 'shield',
  },
  RESOURCE_LOCKED: {
    title: 'ធនធានត្រូវបានចាក់សោ',
    message: 'ធនធាននេះកំពុងត្រូវបានប្រើប្រាស់ដោយអ្នកប្រើប្រាស់ផ្សេង។',
    action: 'ព្យាយាមម្តងទៀតក្នុងពេលបន្តិច',
    icon: 'lock',
  },
};

// Context-specific error messages for different operations
export const OPERATION_ERROR_MESSAGES = {
  CREATE_USER: {
    SUCCESS: 'បានបង្កើតអ្នកប្រើប្រាស់ដោយជោគជ័យ',
    DUPLICATE_EMAIL: 'អ៊ីមែលនេះត្រូវបានប្រើប្រាស់រួចហើយ',
    INVALID_ROLE: 'តួនាទីដែលបានជ្រើសរើសមិនត្រឹមត្រូវទេ',
  },
  UPDATE_USER: {
    SUCCESS: 'បានកែប្រែព័ត៌មានអ្នកប្រើប្រាស់ដោយជោគជ័យ',
    NOT_FOUND: 'រកមិនឃើញអ្នកប្រើប្រាស់ដែលត្រូវកែប្រែ',
    PERMISSION_DENIED: 'អ្នកមិនមានសិទ្ធិកែប្រែអ្នកប្រើប្រាស់នេះទេ',
  },
  DELETE_USER: {
    SUCCESS: 'បានលុបអ្នកប្រើប្រាស់ដោយជោគជ័យ',
    NOT_FOUND: 'រកមិនឃើញអ្នកប្រើប្រាស់ដែលត្រូវលុប',
    HAS_DEPENDENCIES: 'មិនអាចលុបអ្នកប្រើប្រាស់នេះបានទេ ដោយសារមានទិន្នន័យពាក់ព័ន្ធ',
  },
  CREATE_EVALUATION: {
    SUCCESS: 'បានបង្កើតការវាយតម្លៃដោយជោគជ័យ',
    INVALID_DATE: 'កាលបរិច្ឆេទដែលបានកំណត់មិនត្រឹមត្រូវទេ',
    MENTOR_NOT_AVAILABLE: 'អ្នកណែនាំមិនអាចធ្វើការនៅពេលនេះទេ',
  },
  SUBMIT_EVALUATION: {
    SUCCESS: 'បានដាក់ស្នើការវាយតម្លៃដោយជោគជ័យ',
    ALREADY_SUBMITTED: 'ការវាយតម្លៃនេះត្រូវបានដាក់ស្នើរួចហើយ',
    INCOMPLETE_SCORES: 'សូមវាយតម្លៃលក្ខណៈវិនិច្ឆ័យទាំងអស់',
  },
};

// Get user-friendly error message
export function getUserFriendlyErrorMessage(
  errorCode: string,
  fallbackMessage?: string
): ErrorMessage {
  const message = ERROR_MESSAGES[errorCode];
  if (message) {
    return message;
  }

  // Fallback for unknown errors
  return {
    title: 'មានបញ្ហាបណ្តាលមកពីប្រព័ន្ធ',
    message: fallbackMessage || 'មានបញ្ហាមិនរំពឹងទុក។ សូមព្យាយាមម្តងទៀត។',
    action: 'ព្យាយាមម្តងទៀត',
    icon: 'warning',
  };
}

// Get operation-specific error message
export function getOperationErrorMessage(
  operation: keyof typeof OPERATION_ERROR_MESSAGES,
  result: string
): string {
  return OPERATION_ERROR_MESSAGES[operation]?.[result as keyof typeof OPERATION_ERROR_MESSAGES[typeof operation]] || 
         'មានបញ្ហាក្នុងការធ្វើសកម្មភាពនេះ';
}

// Format validation errors for display
export function formatValidationErrors(errors: Array<{ field: string; message: string }>): string {
  if (errors.length === 1) {
    return errors[0].message;
  }

  return errors.map((error, index) => `${index + 1}. ${error.message}`).join('\n');
}

// Statistical operation error messages
export const STATS_ERROR_MESSAGES = {
  CALCULATION_TIMEOUT: {
    title: 'ការគណនាអស់ពេលកំណត់',
    message: 'ការគណនាស្ថិតិកំពុងតែចំណាយពេលយូរពេក។ សូមព្យាយាមម្តងទៀតជាមួយទិន្នន័យតិចជាងនេះ។',
    action: 'កំណត់ជួរកាលបរិច្ឆេទតូចជាងនេះ',
    icon: 'clock',
  },
  MEMORY_LIMIT_EXCEEDED: {
    title: 'ទិន្នន័យច្រើនពេក',
    message: 'ទិន្នន័យដែលត្រូវគណនាមានច្រើនពេក។ សូមកំណត់ជួរកាលបរិច្ឆេទតូចជាងនេះ។',
    action: 'កំណត់ជួរកាលបរិច្ឆេទតូចជាងនេះ',
    icon: 'database',
  },
  INVALID_DATE_RANGE: {
    title: 'ជួរកាលបរិច្ឆេទមិនត្រឹមត្រូវ',
    message: 'ជួរកាលបរិច្ឆេទដែលបានកំណត់មិនត្រឹមត្រូវទេ។ កាលបរិច្ឆេទចាប់ផ្តើមត្រូវតែមុនកាលបរិច្ឆេទបញ្ចប់។',
    action: 'ពិនិត្យកាលបរិច្ឆេទ',
    icon: 'calendar',
  },
  NO_DATA_AVAILABLE: {
    title: 'គ្មានទិន្នន័យ',
    message: 'គ្មានទិន្នន័យសម្រាប់ជួរកាលបរិច្ឆេទដែលបានកំណត់ទេ។',
    action: 'ជ្រើសរើសកាលបរិច្ឆេទផ្សេង',
    icon: 'pie-chart',
  },
  AGGREGATION_ERROR: {
    title: 'បញ្ហាបង្រួបបង្រួមទិន្នន័យ',
    message: 'មានបញ្ហាក្នុងការបង្រួបបង្រួមទិន្នន័យ។ ទិន្នន័យមួយចំនួនអាចមិនត្រឹមត្រូវ។',
    action: 'ផ្ទុកទិន្នន័យឡើងវិញ',
    icon: 'sync',
  },
};