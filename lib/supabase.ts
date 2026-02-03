// Supabase client configuration for Healthcare Translator
import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.\n' +
    'Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We're not using auth for this demo
  },
  realtime: {
    params: {
      eventsPerSecond: 20, // Allow more real-time events
    },
  },
  global: {
    headers: {
      'x-client-info': 'healthcare-translator',
    },
  },
});

// Helper function to upload audio files to the recordings bucket
export async function uploadAudioFile(
  file: Blob,
  fileName: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.storage
      .from('recordings')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'audio/webm',
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('recordings')
      .getPublicUrl(data.path);

    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading audio file:', error);
    return { url: null, error: error as Error };
  }
}

// Helper function to delete audio files
export async function deleteAudioFile(
  fileName: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.storage
      .from('recordings')
      .remove([fileName]);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting audio file:', error);
    return { success: false, error: error as Error };
  }
}

// Test connection function
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('messages').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Supabase connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}
