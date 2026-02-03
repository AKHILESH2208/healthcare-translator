import { NextRequest, NextResponse } from 'next/server';
import { generateMedicalSummary } from '@/lib/groq';
import { Message, SenderRole, LanguageCode } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, viewerRole = 'doctor', patientLanguage = 'en' } = body;

    // Validation
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages to summarize' },
        { status: 400 }
      );
    }

    // Determine output language: Doctor gets English, Patient gets their language
    const outputLanguage = viewerRole === 'doctor' ? 'en' : patientLanguage;

    // Format messages for Groq
    const formattedMessages: Message[] = messages.map((msg: {
      id?: string;
      sender_role: SenderRole;
      original_content?: string;
      translated_content?: string;
      translated_text?: string;
      audio_url?: string | null;
      language?: LanguageCode;
      created_at?: string;
    }) => ({
      id: msg.id || crypto.randomUUID(),
      sender_role: msg.sender_role,
      original_content: msg.original_content || msg.translated_text || '',
      translated_content: msg.translated_content || msg.translated_text || null,
      audio_url: msg.audio_url || null,
      language: msg.language || 'en' as LanguageCode,
      created_at: msg.created_at || new Date().toISOString(),
    }));

    // Generate summary using Groq with the appropriate output language
    const summary = await generateMedicalSummary(formattedMessages, outputLanguage);

    return NextResponse.json({
      summary,
      messageCount: messages.length,
      timestamp: new Date().toISOString(),
      model: 'llama-3.3-70b-versatile',
    });
  } catch (error) {
    console.error('Summary API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
