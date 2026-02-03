import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioBlob = formData.get('audio') as File;
    const language = formData.get('language') as string || 'en';

    if (!audioBlob) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB for Groq)
    if (audioBlob.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Audio file too large. Maximum size is 25MB.' },
        { status: 400 }
      );
    }

    // Convert to proper File with filename for Groq to detect type
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioFile = new File([arrayBuffer], 'audio.webm', { type: 'audio/webm' });

    // Transcribe audio using Groq Whisper
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3',
      language: language === 'en' ? 'en' : undefined, // Auto-detect if not English
      response_format: 'json',
      temperature: 0.0, // More accurate transcription
    });

    return NextResponse.json({
      text: transcription.text,
      language,
    });

  } catch (error) {
    console.error('Transcription error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Transcription failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred during transcription' },
      { status: 500 }
    );
  }
}
