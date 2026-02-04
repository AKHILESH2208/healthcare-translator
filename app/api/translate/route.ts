import { NextRequest, NextResponse } from 'next/server';
import { translateText, chatWithAIAssistant } from '@/lib/groq';
import { SUPPORTED_LANGUAGES } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, sourceLanguage, targetLanguage, isAIAssistant, systemPrompt } = body;

    // Validation
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    // Handle AI Assistant requests
    if (isAIAssistant && systemPrompt) {
      const response = await chatWithAIAssistant(text, systemPrompt, targetLanguage);
      return NextResponse.json({
        originalText: text,
        translatedText: response,
        sourceLanguage,
        targetLanguage,
        model: 'llama-3.3-70b',
        type: 'ai_assistant',
      });
    }

    if (!sourceLanguage || !targetLanguage) {
      return NextResponse.json(
        { error: 'Source and target languages are required' },
        { status: 400 }
      );
    }

    // Validate language codes
    const validLanguages = SUPPORTED_LANGUAGES.map((lang) => lang.code);
    if (!validLanguages.includes(sourceLanguage) || !validLanguages.includes(targetLanguage)) {
      return NextResponse.json(
        { error: 'Invalid language code' },
        { status: 400 }
      );
    }

    // If source and target are the same, return original text
    if (sourceLanguage === targetLanguage) {
      return NextResponse.json({
        originalText: text,
        translatedText: text,
        sourceLanguage,
        targetLanguage,
      });
    }

    // Get language names
    const sourceLangName =
      SUPPORTED_LANGUAGES.find((lang) => lang.code === sourceLanguage)?.label || sourceLanguage;
    const targetLangName =
      SUPPORTED_LANGUAGES.find((lang) => lang.code === targetLanguage)?.label || targetLanguage;

    // Translate using Groq AI
    const translatedText = await translateText(
      text,
      sourceLangName,
      targetLangName
    );

    return NextResponse.json({
      originalText: text,
      translatedText,
      sourceLanguage,
      targetLanguage,
      model: 'llama-3.3-70b',
    });
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
