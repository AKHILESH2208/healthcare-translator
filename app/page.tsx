'use client';

import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoginPage } from '@/components/LoginPage';
import { AIAssistantChat } from '@/components/AIAssistantChat';
import { SenderRole, Message, LanguageCode } from '@/types';
import { DEFAULT_PATIENT_LANGUAGE } from '@/lib/constants';

type AppView = 'login' | 'chat' | 'ai-assistant';

interface UserSession {
  role: SenderRole;
  name: string;
}

export default function Home() {
  const [view, setView] = useState<AppView>('login');
  const [session, setSession] = useState<UserSession | null>(null);
  const [conversationForAI, setConversationForAI] = useState<Message[]>([]);
  const [patientLanguage, setPatientLanguage] = useState<LanguageCode>(DEFAULT_PATIENT_LANGUAGE);

  // Check for existing session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('naoMedicalSession');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setSession(parsed);
        setView('chat');
      } catch {
        localStorage.removeItem('naoMedicalSession');
      }
    }

    // Load saved language
    const savedLanguage = localStorage.getItem('patientLanguage');
    if (savedLanguage && ['en', 'es', 'hi', 'fr', 'de', 'pt', 'zh', 'ar'].includes(savedLanguage)) {
      setPatientLanguage(savedLanguage as LanguageCode);
    }
  }, []);

  const handleLogin = (role: SenderRole, name: string) => {
    const newSession = { role, name };
    setSession(newSession);
    setView('chat');
    localStorage.setItem('naoMedicalSession', JSON.stringify(newSession));
  };

  const handleLogout = () => {
    setSession(null);
    setView('login');
    localStorage.removeItem('naoMedicalSession');
  };

  const handleOpenAIAssistant = (messages: Message[], language: LanguageCode) => {
    setConversationForAI(messages);
    setPatientLanguage(language);
    setView('ai-assistant');
  };

  const handleBackFromAI = () => {
    setView('chat');
  };

  if (view === 'login' || !session) {
    return (
      <ErrorBoundary>
        <LoginPage onLogin={handleLogin} />
      </ErrorBoundary>
    );
  }

  if (view === 'ai-assistant' && session.role === 'patient') {
    return (
      <ErrorBoundary>
        <AIAssistantChat
          patientName={session.name}
          patientLanguage={patientLanguage}
          conversationHistory={conversationForAI}
          onBack={handleBackFromAI}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ChatInterface
        userRole={session.role}
        userName={session.name}
        onLogout={handleLogout}
        onOpenAIAssistant={session.role === 'patient' ? handleOpenAIAssistant : undefined}
      />
    </ErrorBoundary>
  );
}
