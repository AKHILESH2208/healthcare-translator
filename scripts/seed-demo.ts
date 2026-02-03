// Demo data script for Healthcare Translator
// Run with: npx tsx scripts/seed-demo.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const demoConversation = [
  {
    sender_role: 'patient',
    original_content: 'Hola doctor, tengo dolor de cabeza desde hace dos días.',
    translated_content: 'Hello doctor, I have had a headache for two days.',
    language: 'es',
  },
  {
    sender_role: 'doctor',
    original_content: 'I understand. Can you describe the pain? Is it sharp, dull, or throbbing?',
    translated_content: 'Entiendo. ¿Puede describir el dolor? ¿Es agudo, sordo o pulsante?',
    language: 'en',
  },
  {
    sender_role: 'patient',
    original_content: 'Es un dolor pulsante, especialmente en las sienes.',
    translated_content: 'It is a throbbing pain, especially in the temples.',
    language: 'es',
  },
  {
    sender_role: 'doctor',
    original_content: 'Have you experienced any nausea, sensitivity to light, or vision changes?',
    translated_content: '¿Ha experimentado náuseas, sensibilidad a la luz o cambios en la visión?',
    language: 'en',
  },
  {
    sender_role: 'patient',
    original_content: 'Sí, tengo sensibilidad a la luz y a veces veo puntos brillantes.',
    translated_content: 'Yes, I have sensitivity to light and sometimes I see bright spots.',
    language: 'es',
  },
  {
    sender_role: 'doctor',
    original_content: 'Based on your symptoms, this sounds like it could be a migraine. Have you had migraines before?',
    translated_content: 'Basándome en sus síntomas, parece que podría ser una migraña. ¿Ha tenido migrañas antes?',
    language: 'en',
  },
  {
    sender_role: 'patient',
    original_content: 'No, es la primera vez que tengo este tipo de dolor.',
    translated_content: 'No, this is the first time I have this type of pain.',
    language: 'es',
  },
  {
    sender_role: 'doctor',
    original_content: 'I recommend you take ibuprofen 400mg for the pain. Rest in a dark, quiet room. If symptoms persist for more than a week, we should do further tests.',
    translated_content: 'Le recomiendo que tome ibuprofeno 400mg para el dolor. Descanse en una habitación oscura y silenciosa. Si los síntomas persisten más de una semana, debemos hacer más pruebas.',
    language: 'en',
  },
  {
    sender_role: 'patient',
    original_content: 'Gracias doctor. ¿Debo evitar algún alimento o actividad?',
    translated_content: 'Thank you doctor. Should I avoid any food or activity?',
    language: 'es',
  },
  {
    sender_role: 'doctor',
    original_content: 'Avoid bright screens, loud noises, and alcohol. Stay hydrated and try to reduce stress. Schedule a follow-up in one week.',
    translated_content: 'Evite pantallas brillantes, ruidos fuertes y alcohol. Manténgase hidratado y trate de reducir el estrés. Programe un seguimiento en una semana.',
    language: 'en',
  },
];

async function seedDemoData() {
  console.log('🏥 Healthcare Translator - Demo Data Seeder\n');
  console.log('📝 Clearing existing messages...');

  // Clear existing messages
  const { error: deleteError } = await supabase
    .from('messages')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteError) {
    console.error('❌ Failed to clear messages:', deleteError.message);
    return;
  }

  console.log('✅ Existing messages cleared\n');
  console.log('💬 Inserting demo conversation...\n');

  // Insert demo messages with slight delays between timestamps
  for (let i = 0; i < demoConversation.length; i++) {
    const message = demoConversation[i];
    const timestamp = new Date(Date.now() - (demoConversation.length - i) * 60000); // 1 min apart

    const { error } = await supabase.from('messages').insert({
      ...message,
      created_at: timestamp.toISOString(),
      metadata: {},
    });

    if (error) {
      console.error(`❌ Failed to insert message ${i + 1}:`, error.message);
    } else {
      const role = message.sender_role === 'doctor' ? '👨‍⚕️ Doctor' : '🧑 Patient';
      console.log(`  ${role}: "${message.original_content.substring(0, 50)}..."`);
    }
  }

  console.log('\n✅ Demo data seeded successfully!');
  console.log('🌐 Open http://localhost:3000 to see the conversation');
}

seedDemoData().catch(console.error);
