// AI client configuration - Using Groq for free, fast inference
import Groq from 'groq-sdk';
import type { Message, MedicalSummary } from '@/types';

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error(
    'Missing GROQ_API_KEY environment variable. Please add it to your .env.local file.\n' +
    'Get your free API key from: https://console.groq.com/keys'
  );
}

// Initialize Groq client
const groq = new Groq({ apiKey });

// Use Llama 3.3 70B (fast, free, multilingual)
const MODEL = 'llama-3.3-70b-versatile';

// Helper function to translate text using Groq
export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  context?: string
): Promise<string> {
  try {
    const systemPrompt = `You are a professional medical translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}.

IMPORTANT RULES:
1. Preserve all medical terminology accurately
2. Maintain the original meaning and tone
3. Return ONLY the translated text, no explanations
4. If translating medical symptoms or conditions, be precise
${context ? `\nContext: ${context}` : ''}`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const translatedText = completion.choices[0]?.message?.content?.trim();
    
    if (!translatedText) {
      throw new Error('No translation received from Groq API');
    }

    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

// Language name mapping for better prompts
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  hi: 'Hindi',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  zh: 'Chinese',
  ar: 'Arabic',
};

// Helper function to generate medical summary using Groq
export async function generateMedicalSummary(
  messages: Message[],
  outputLanguage: string = 'en'
): Promise<MedicalSummary> {
  try {
    // Format conversation for analysis - use English content for analysis
    const conversation = messages
      .map(m => {
        // Use translated content for patient (which is English), original for doctor
        const content = m.sender_role === 'patient' 
          ? (m.translated_content || m.original_content) 
          : m.original_content;
        return `${m.sender_role}: ${content}`;
      })
      .join('\n');

    const languageName = LANGUAGE_NAMES[outputLanguage] || 'English';
    
    const systemPrompt = `You are a medical AI assistant. Analyze this doctor-patient conversation and extract:

1. **Symptoms**: List all symptoms mentioned by the patient
2. **Medications**: List any medications discussed (prescribed, current, or allergies)
3. **Follow-up Actions**: List recommended tests, appointments, or instructions

CRITICAL INSTRUCTION: Your ENTIRE response MUST be written in ${languageName} language only. Every single word in the arrays must be in ${languageName}.

Return your response in this EXACT JSON format:
{
  "symptoms": ["symptom1", "symptom2"],
  "medications": ["medication1", "medication2"],
  "followUpActions": ["action1", "action2"]
}

Only include information explicitly mentioned in the conversation. If a category has no information, use an empty array.
REMINDER: Write ALL content in ${languageName} language.`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this conversation and respond in ${languageName}:\n${conversation}` }
      ],
      temperature: 0.2,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    });

    const summaryText = completion.choices[0]?.message?.content?.trim();
    
    if (!summaryText) {
      throw new Error('No summary received from Groq API');
    }

    // Parse JSON response
    const summary = JSON.parse(summaryText);
    
    return {
      symptoms: summary.symptoms || [],
      medications: summary.medications || [],
      followUpActions: summary.followUpActions || [],
      timestamp: new Date().toISOString(),
      messageCount: messages.length,
    };
  } catch (error) {
    console.error('Summary generation error:', error);
    throw error;
  }
}

// Helper function for AI Assistant chat
export async function chatWithAIAssistant(
  userMessage: string,
  systemPrompt: string,
  targetLanguage: string = 'en'
): Promise<string> {
  try {
    const languageName = LANGUAGE_NAMES[targetLanguage] || 'English';
    
    const enhancedSystemPrompt = `${systemPrompt}

IMPORTANT: You MUST respond ONLY in ${languageName} language. Do not use any other language.`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: enhancedSystemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const response = completion.choices[0]?.message?.content?.trim();
    
    if (!response) {
      throw new Error('No response received from Groq API');
    }

    return response;
  } catch (error) {
    console.error('AI Assistant error:', error);
    throw error;
  }
}
