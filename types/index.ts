// Core type definitions for the Healthcare Translator app

export type SenderRole = 'doctor' | 'patient';

export type LanguageCode = 'en' | 'es' | 'hi' | 'fr' | 'de' | 'pt' | 'zh' | 'ar';

export interface Message {
  id: string;
  created_at: string;
  sender_role: SenderRole;
  original_content: string;
  translated_content: string | null;
  audio_url: string | null;
  language: LanguageCode;
  metadata?: {
    transcription_confidence?: number;
    translation_model?: string;
    error?: string;
  };
}

export interface ChatMessage extends Message {
  isLoading?: boolean;
  error?: string;
}

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeName: string;
}

export interface MedicalSummary {
  symptoms: string[];
  medications: string[];
  followUpActions: string[];
  timestamp: string;
  messageCount: number;
}

export interface TranslationRequest {
  content: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  senderRole: SenderRole;
}

export interface TranslationResponse {
  originalContent: string;
  translatedContent: string;
  detectedLanguage?: LanguageCode;
}

export interface AudioTranscriptionRequest {
  audioUrl: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  senderRole: SenderRole;
}

export interface AudioTranscriptionResponse extends TranslationResponse {
  transcription: string;
  confidence?: number;
}
