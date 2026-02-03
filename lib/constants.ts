// Supported languages for the Healthcare Translator app
import { LanguageOption } from '@/types';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'es', label: 'Spanish', nativeName: 'Español' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'fr', label: 'French', nativeName: 'Français' },
  { code: 'de', label: 'German', nativeName: 'Deutsch' },
  { code: 'pt', label: 'Portuguese', nativeName: 'Português' },
  { code: 'zh', label: 'Chinese', nativeName: '中文' },
  { code: 'ar', label: 'Arabic', nativeName: 'العربية' },
];

export const DEFAULT_DOCTOR_LANGUAGE = 'en';
export const DEFAULT_PATIENT_LANGUAGE = 'es';

// Medical terminology guidelines for translation
export const MEDICAL_CONTEXT_PROMPT = `
You are a professional medical translator. Maintain accuracy of medical terms, 
symptom descriptions, and medication names. When translating:
- Preserve medical terminology accurately
- Maintain clarity for non-medical speakers when translating to patient language
- Use formal/professional tone for doctor communications
- Use clear, simple language for patient communications
- Keep drug names and dosages unchanged
`;

// Audio recording settings
export const AUDIO_CONFIG = {
  mimeType: 'audio/webm;codecs=opus',
  audioBitsPerSecond: 128000,
  maxRecordingDuration: 120000, // 2 minutes in milliseconds
};

// API endpoints
export const API_ROUTES = {
  translate: '/api/translate',
  transcribe: '/api/transcribe',
  summary: '/api/summary',
};

// UI Constants
export const MAX_MESSAGE_LENGTH = 1000;
export const MESSAGES_PER_PAGE = 50;
export const SUMMARY_MESSAGE_LIMIT = 20;
