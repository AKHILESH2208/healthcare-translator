<p align="center">
  <img src="https://img.shields.io/badge/Nao-Medical-0066CC?style=for-the-badge" alt="Nao Medical"/>
</p>

<h1 align="center">🏥 Nao Medical Translator</h1>

<p align="center">
  <strong>Real-time AI-powered doctor-patient translation for multilingual medical consultations</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Supabase-Realtime-3FCF8E?logo=supabase" alt="Supabase"/>
  <img src="https://img.shields.io/badge/Groq-AI-F55036" alt="Groq AI"/>
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License"/>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Usage Guide](#-usage-guide)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Nao Medical Translator** is a professional healthcare communication platform that breaks language barriers between doctors and patients. Using advanced AI translation powered by Groq's Llama 3.3 70B model, it enables seamless real-time conversations in 8 different languages.

### Why Nao Medical Translator?

- **🏥 Medical Context Aware**: AI understands medical terminology for accurate translations
- **⚡ Real-time**: Instant translation with live message synchronization
- **🎙️ Voice Support**: Record and transcribe voice messages automatically
- **📊 AI Summaries**: Generate structured medical summaries from conversations
- **🔒 Secure**: All data stored securely in Supabase PostgreSQL

---

## ✨ Features

### 🌐 Multilingual Translation
- **8 Languages**: English, Spanish, Hindi, French, German, Portuguese, Chinese, Arabic
- **Bidirectional**: Doctor ↔ Patient translation in real-time
- **Medical Accuracy**: Preserves medical terminology and context

### 🎙️ Voice Input
- **Audio Recording**: One-click voice message recording
- **Speech-to-Text**: Powered by Groq Whisper Large V3
- **Auto Translation**: Voice messages automatically transcribed and translated

### 💬 Smart Chat Interface
- **Role Switching**: Toggle between Doctor and Patient views
- **Dual Language Display**: See both original and translated text
- **Real-time Sync**: Messages appear instantly via Supabase Realtime

### 🔍 Conversation Management
- **Advanced Search** (⌘K): Search across all messages with context preview
- **Conversation History** (⌘H): Browse messages grouped by date
- **Persistent Storage**: All conversations saved to database

### 📋 Medical Summaries
- **AI-Powered Analysis**: Extract key medical information
- **Structured Output**: Symptoms, Medications, Follow-up Actions
- **Copy to Clipboard**: Easy export for medical records

### 🎨 Professional UI
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Supports system theme preferences
- **Offline Detection**: Visual indicators for connection status

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 with App Router |
| **Language** | TypeScript 5 |
| **Database** | Supabase PostgreSQL |
| **Real-time** | Supabase Realtime Subscriptions |
| **Storage** | Supabase Storage (audio files) |
| **AI Translation** | Groq Llama 3.3 70B Versatile |
| **AI Transcription** | Groq Whisper Large V3 |
| **UI Components** | shadcn/ui + Radix UI |
| **Styling** | Tailwind CSS 4 |
| **Icons** | Lucide React |
| **Notifications** | Sonner |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (free tier works)
- Groq API key (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/naomedical/healthcare-translator.git
   cd healthcare-translator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GROQ_API_KEY=your_groq_api_key
   ```

4. **Set up Supabase Database**
   
   Run these SQL commands in your Supabase SQL Editor:

   ```sql
   -- Create messages table
   CREATE TABLE messages (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     sender_role TEXT NOT NULL CHECK (sender_role IN ('doctor', 'patient')),
     original_content TEXT NOT NULL,
     translated_content TEXT,
     audio_url TEXT,
     language TEXT NOT NULL,
     metadata JSONB DEFAULT '{}'::jsonb
   );

   -- Enable Row Level Security
   ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

   -- Create policy for public access (adjust for production)
   CREATE POLICY "Allow all operations" ON messages FOR ALL USING (true);

   -- Create search function
   CREATE OR REPLACE FUNCTION search_messages(search_query TEXT)
   RETURNS SETOF messages AS $$
   BEGIN
     RETURN QUERY
     SELECT * FROM messages
     WHERE original_content ILIKE '%' || search_query || '%'
        OR translated_content ILIKE '%' || search_query || '%'
     ORDER BY created_at DESC;
   END;
   $$ LANGUAGE plpgsql;

   -- Create recent messages function
   CREATE OR REPLACE FUNCTION get_recent_messages(message_limit INT DEFAULT 20)
   RETURNS SETOF messages AS $$
   BEGIN
     RETURN QUERY
     SELECT * FROM messages
     ORDER BY created_at DESC
     LIMIT message_limit;
   END;
   $$ LANGUAGE plpgsql;

   -- Enable Realtime
   ALTER PUBLICATION supabase_realtime ADD TABLE messages;
   ```

5. **Create Storage Bucket**
   
   In Supabase Dashboard → Storage:
   - Create a new bucket named `recordings`
   - Set it to **Public**

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   ```
   http://localhost:3000
   ```

---

## 📖 Usage Guide

### Basic Workflow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Doctor    │────▶│  Translator  │────▶│   Patient   │
│  (English)  │◀────│     App      │◀────│  (Spanish)  │
└─────────────┘     └──────────────┘     └─────────────┘
```

### Step-by-Step Guide

#### 1️⃣ Select Your Role
- Click **Doctor** or **Patient** toggle at the top
- Your messages will be styled accordingly (blue for Doctor, green for Patient)

#### 2️⃣ Set Patient Language
- When in Patient mode, select the preferred language from the dropdown
- Supported: Spanish, Hindi, French, German, Portuguese, Chinese, Arabic

#### 3️⃣ Send Text Messages
- Type your message in the input field
- Press **Enter** or click the Send button
- Message is automatically translated to the other party's language

#### 4️⃣ Send Voice Messages
- Click the **🎤 Microphone** button to start recording
- Speak your message clearly
- Click **Stop** when finished
- Review the recording and click **Send**
- Audio is transcribed and translated automatically

#### 5️⃣ View Translation
- **Main text**: Displayed in your language
- **Subtitle (italic)**: Shows the original/translated version
- Switch roles to see how the other party views the conversation

#### 6️⃣ Search Conversations
- Press **⌘K** (Mac) or **Ctrl+K** (Windows) to open search
- Type keywords to find matching messages
- Click a result to jump to that message

#### 7️⃣ View History
- Press **⌘H** (Mac) or **Ctrl+H** (Windows) to open history
- Messages are grouped by date
- Click to expand/collapse date sections

#### 8️⃣ Generate Medical Summary
- Click the **Summary** button
- AI analyzes the conversation and extracts:
  - 🩺 Symptoms reported
  - 💊 Medications discussed  
  - 📋 Follow-up actions
- Click **Copy** to save to clipboard

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Open Advanced Search |
| `⌘H` / `Ctrl+H` | Open Conversation History |
| `Enter` | Send message |
| `Escape` | Close modals |
| `↑` / `↓` | Navigate search results |

---

## 🔌 API Reference

### POST `/api/translate`
Translate text between languages.

**Request:**
```json
{
  "text": "Hello, how are you feeling today?",
  "sourceLanguage": "en",
  "targetLanguage": "es"
}
```

**Response:**
```json
{
  "originalText": "Hello, how are you feeling today?",
  "translatedText": "Hola, ¿cómo se siente hoy?",
  "sourceLanguage": "en",
  "targetLanguage": "es",
  "model": "llama-3.3-70b"
}
```

### POST `/api/transcribe`
Transcribe audio to text.

**Request:** `multipart/form-data`
- `audio`: Audio file (webm format)
- `language`: Language code (optional)

**Response:**
```json
{
  "text": "I have been experiencing headaches",
  "language": "en"
}
```

### POST `/api/summary`
Generate medical summary from messages.

**Request:**
```json
{
  "messages": [/* array of message objects */]
}
```

**Response:**
```json
{
  "summary": {
    "symptoms": ["Headache", "Fever"],
    "medications": ["Ibuprofen"],
    "followUpActions": ["Blood test recommended"]
  },
  "messageCount": 10,
  "timestamp": "2026-02-04T12:00:00Z"
}
```

---

## 📁 Project Structure

```
healthcare-translator/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── translate/     # Translation endpoint
│   │   ├── transcribe/    # Audio transcription
│   │   └── summary/       # Medical summary generation
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React Components
│   ├── ui/               # shadcn/ui components
│   ├── ChatInterface.tsx # Main chat component
│   ├── MessageBubble.tsx # Individual message display
│   ├── MedicalSummaryModal.tsx
│   ├── ConversationHistory.tsx
│   ├── AdvancedSearch.tsx
│   └── ErrorBoundary.tsx
├── hooks/                 # Custom React Hooks
│   ├── useMessages.ts    # Message CRUD & real-time
│   └── useAudioRecorder.ts # Audio recording logic
├── lib/                   # Utilities
│   ├── groq.ts           # Groq AI client
│   ├── supabase.ts       # Supabase client
│   ├── constants.ts      # App constants
│   └── utils.ts          # Helper functions
├── types/                 # TypeScript definitions
│   ├── index.ts          # Core types
│   └── supabase.ts       # Database types
└── public/               # Static assets
```

---

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `GROQ_API_KEY` | Groq API key for AI features | ✅ |

### Getting API Keys

1. **Supabase**: Create a free project at [supabase.com](https://supabase.com)
2. **Groq**: Get a free API key at [console.groq.com](https://console.groq.com)

---

## 🗄️ Database Schema

### Messages Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `created_at` | Timestamp | Message timestamp |
| `sender_role` | Text | 'doctor' or 'patient' |
| `original_content` | Text | Original message text |
| `translated_content` | Text | Translated text |
| `audio_url` | Text | URL to audio file (if voice message) |
| `language` | Text | Source language code |
| `metadata` | JSONB | Additional metadata |

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Nao Medical](https://naomedical.com) - Healthcare innovation
- [Groq](https://groq.com) - Lightning-fast AI inference
- [Supabase](https://supabase.com) - Open source Firebase alternative
- [Vercel](https://vercel.com) - Next.js hosting platform
- [shadcn/ui](https://ui.shadcn.com) - Beautiful UI components

---

<p align="center">
  <strong>Built with ❤️ for Nao Medical</strong>
</p>

<p align="center">
  <a href="https://naomedical.com">Website</a> •
  <a href="https://twitter.com/naomedical">Twitter</a> •
  <a href="mailto:support@naomedical.com">Contact</a>
</p>
