import { NextRequest, NextResponse } from 'next/server';
import { translateText, chatWithAIAssistant } from '@/lib/groq';
import { SUPPORTED_LANGUAGES } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    // 1. Use the modern req.json() (standard in Next.js App Router)
    const body = await req.json();
    const { text, sourceLanguage, targetLanguage } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const validLanguages = SUPPORTED_LANGUAGES.map((lang) => lang.code);
    if (!validLanguages.includes(sourceLanguage) || !validLanguages.includes(targetLanguage)) {
      return NextResponse.json({ error: 'Invalid language code' }, { status: 400 });
    }

    if (sourceLanguage === targetLanguage) {
      return NextResponse.json({
        originalText: text,
        translatedText: text,
        sourceLanguage,
        targetLanguage,
      });
    }

    const sourceLangName = SUPPORTED_LANGUAGES.find((l) => l.code === sourceLanguage)?.label || sourceLanguage;
    const targetLangName = SUPPORTED_LANGUAGES.find((l) => l.code === targetLanguage)?.label || targetLanguage;

    // 2. Ensure translateText is not using url.parse internally
    const translatedText = await translateText(text, sourceLangName, targetLangName);

    return NextResponse.json({
      originalText: text,
      translatedText,
      sourceLanguage,
      targetLanguage,
      model: 'llama-3.3-70b',
    });
    
  } catch (error: any) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
