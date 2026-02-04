'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Message, LanguageCode } from '@/types';
import { SUPPORTED_LANGUAGES } from '@/lib/constants';
import { 
  Bot, 
  Send, 
  Loader2, 
  ArrowLeft, 
  Sparkles,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  User
} from 'lucide-react';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantChatProps {
  patientName: string;
  patientLanguage: LanguageCode;
  conversationHistory: Message[];
  onBack: () => void;
}

export function AIAssistantChat({ 
  patientName, 
  patientLanguage, 
  conversationHistory,
  onBack 
}: AIAssistantChatProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showContext, setShowContext] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoize language label to avoid recalculating on every render
  const languageLabel = useMemo(() => 
    SUPPORTED_LANGUAGES.find(l => l.code === patientLanguage)?.nativeName || 'English',
    [patientLanguage]
  );

  // Memoize context summary for AI
  const contextSummary = useMemo(() => 
    conversationHistory.map(msg => 
      `${msg.sender_role === 'doctor' ? 'Doctor' : 'Patient'}: ${msg.original_content}${msg.translated_content ? ` (Translation: ${msg.translated_content})` : ''}`
    ).join('\n'),
    [conversationHistory]
  );

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Generate welcome message based on language
  useEffect(() => {
    if (showWelcome) {
      const welcomeMessages: Record<string, string> = {
        en: `Hello ${patientName}! I'm your AI health assistant. I have access to your recent conversation with the doctor. Feel free to ask me any follow-up questions about your diagnosis, medications, or care instructions.`,
        es: `¡Hola ${patientName}! Soy tu asistente de salud con IA. Tengo acceso a tu conversación reciente con el médico. No dudes en hacerme preguntas de seguimiento sobre tu diagnóstico, medicamentos o instrucciones de cuidado.`,
        hi: `नमस्ते ${patientName}! मैं आपका AI स्वास्थ्य सहायक हूं। मेरे पास डॉक्टर के साथ आपकी हाल की बातचीत तक पहुंच है। अपने निदान, दवाओं, या देखभाल निर्देशों के बारे में कोई भी अनुवर्ती प्रश्न पूछने में संकोच न करें।`,
        fr: `Bonjour ${patientName}! Je suis votre assistant santé IA. J'ai accès à votre conversation récente avec le médecin. N'hésitez pas à me poser des questions de suivi sur votre diagnostic, vos médicaments ou vos instructions de soins.`,
        de: `Hallo ${patientName}! Ich bin Ihr KI-Gesundheitsassistent. Ich habe Zugang zu Ihrem kürzlichen Gespräch mit dem Arzt. Stellen Sie mir gerne Folgefragen zu Ihrer Diagnose, Medikamenten oder Pflegeanweisungen.`,
        pt: `Olá ${patientName}! Sou seu assistente de saúde com IA. Tenho acesso à sua conversa recente com o médico. Sinta-se à vontade para me fazer perguntas de acompanhamento sobre seu diagnóstico, medicamentos ou instruções de cuidados.`,
        zh: `您好 ${patientName}！我是您的AI健康助手。我可以访问您最近与医生的对话。请随时向我询问有关您的诊断、药物或护理说明的任何后续问题。`,
        ar: `مرحباً ${patientName}! أنا مساعدك الصحي بالذكاء الاصطناعي. لدي إمكانية الوصول إلى محادثتك الأخيرة مع الطبيب. لا تتردد في طرح أي أسئلة متابعة حول تشخيصك أو أدويتك أو تعليمات الرعاية.`,
      };

      const welcomeMsg: AIMessage = {
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessages[patientLanguage] || welcomeMessages.en,
        timestamp: new Date(),
      };

      setMessages([welcomeMsg]);
      setShowWelcome(false);
    }
  }, [showWelcome, patientName, patientLanguage]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: input.trim(),
          sourceLanguage: patientLanguage,
          targetLanguage: patientLanguage,
          context: 'ai_assistant',
          systemPrompt: `You are a helpful, empathetic AI health assistant for NAO Medical. You have access to the patient's recent conversation with their doctor. 

IMPORTANT CONTEXT - Previous Doctor-Patient Conversation:
${contextSummary || 'No previous conversation available.'}

Your role:
1. Answer follow-up questions about the diagnosis, medications, or care instructions discussed
2. Explain medical terms in simple language
3. Provide general health information (but always recommend consulting the doctor for specific medical decisions)
4. Be supportive and reassuring
5. ALWAYS respond in ${languageLabel} language
6. If the patient asks something unrelated to their health or the conversation, politely redirect them

Remember: You are NOT a replacement for medical advice. Always encourage the patient to contact their healthcare provider for serious concerns.`,
          isAIAssistant: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('Failed to get response');

      const { translatedText } = await response.json();

      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: translatedText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      
      console.error('AI Assistant error:', err);
      const errorMessages: Record<string, string> = {
        en: "I'm sorry, I encountered an error. Please try again.",
        es: "Lo siento, encontré un error. Por favor, inténtalo de nuevo.",
        hi: "मुझे खेद है, एक त्रुटि हुई। कृपया पुनः प्रयास करें।",
        fr: "Je suis désolé, j'ai rencontré une erreur. Veuillez réessayer.",
        de: "Es tut mir leid, es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
        pt: "Desculpe, encontrei um erro. Por favor, tente novamente.",
        zh: "抱歉，遇到错误。请重试。",
        ar: "أنا آسف، واجهت خطأ. يرجى المحاولة مرة أخرى.",
      };

      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessages[patientLanguage] || errorMessages.en,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, contextSummary, patientLanguage, languageLabel]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Memoize suggested questions
  const suggestedQuestions = useMemo(() => {
    const questions: Record<string, string[]> = {
      en: [
        "Can you explain my diagnosis in simpler terms?",
        "What are the side effects of my medication?",
        "When should I take my medicine?",
        "What symptoms should I watch for?",
      ],
      es: [
        "¿Puede explicar mi diagnóstico en términos más simples?",
        "¿Cuáles son los efectos secundarios de mi medicamento?",
        "¿Cuándo debo tomar mi medicina?",
        "¿Qué síntomas debo vigilar?",
      ],
      hi: [
        "क्या आप मेरे निदान को सरल शब्दों में समझा सकते हैं?",
        "मेरी दवा के दुष्प्रभाव क्या हैं?",
        "मुझे अपनी दवा कब लेनी चाहिए?",
        "मुझे किन लक्षणों पर ध्यान देना चाहिए?",
      ],
      fr: [
        "Pouvez-vous expliquer mon diagnostic en termes plus simples?",
        "Quels sont les effets secondaires de mon médicament?",
        "Quand dois-je prendre mon médicament?",
        "Quels symptômes dois-je surveiller?",
      ],
      de: [
        "Können Sie meine Diagnose einfacher erklären?",
        "Was sind die Nebenwirkungen meines Medikaments?",
        "Wann soll ich mein Medikament einnehmen?",
        "Auf welche Symptome sollte ich achten?",
      ],
      pt: [
        "Você pode explicar meu diagnóstico em termos mais simples?",
        "Quais são os efeitos colaterais do meu medicamento?",
        "Quando devo tomar meu remédio?",
        "Quais sintomas devo observar?",
      ],
      zh: [
        "您能用更简单的话解释我的诊断吗？",
        "我的药物有哪些副作用？",
        "我应该什么时候服药？",
        "我应该注意哪些症状？",
      ],
      ar: [
        "هل يمكنك شرح تشخيصي بعبارات أبسط؟",
        "ما هي الآثار الجانبية لدوائي؟",
        "متى يجب أن أتناول دوائي؟",
        "ما الأعراض التي يجب أن أراقبها؟",
      ],
    };
    return questions[patientLanguage] || questions.en;
  }, [patientLanguage]);

  // Memoize context card title
  const contextCardTitle = useMemo(() => {
    const titles: Record<string, string> = {
      en: 'Doctor Conversation Context',
      es: 'Contexto de la conversación con el médico',
      hi: 'डॉक्टर के साथ बातचीत का संदर्भ',
      fr: 'Contexte de la conversation avec le médecin',
      de: 'Kontext des Arztgesprächs',
      pt: 'Contexto da conversa com o médico',
      zh: '与医生对话的背景',
      ar: 'سياق المحادثة مع الطبيب',
    };
    return titles[patientLanguage] || titles.en;
  }, [patientLanguage]);

  // Memoize input placeholder
  const inputPlaceholder = useMemo(() => {
    const placeholders: Record<string, string> = {
      en: 'Type your question...',
      es: 'Escribe tu pregunta...',
      hi: 'अपना प्रश्न लिखें...',
      fr: 'Écrivez votre question...',
      de: 'Schreiben Sie Ihre Frage...',
      pt: 'Escreva sua pergunta...',
      zh: '输入您的问题...',
      ar: 'اكتب سؤالك...',
    };
    return placeholders[patientLanguage] || placeholders.en;
  }, [patientLanguage]);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-2 sm:p-4">
      {/* Header */}
      <Card className="mb-3 sm:mb-4 shadow-md">
        <CardHeader className="pb-3 px-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                    AI Health Assistant
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Ask follow-up questions about your visit
                  </p>
                </div>
              </div>
            </div>
            <Image
              src="https://naomedical.com/main-page-assets/images/about-us/banner-logo.svg"
              alt="NAO Medical"
              width={80}
              height={24}
              className="h-6 w-auto hidden sm:block"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Conversation Context Card */}
      {conversationHistory.length > 0 && (
        <Card className="mb-3 sm:mb-4 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30">
          <CardContent className="p-3">
            <button
              onClick={() => setShowContext(!showContext)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  {contextCardTitle}
                </span>
                <span className="text-xs text-purple-500 bg-purple-100 dark:bg-purple-900 px-2 py-0.5 rounded-full">
                  {conversationHistory.length} {conversationHistory.length === 1 ? 'message' : 'messages'}
                </span>
              </div>
              {showContext ? (
                <ChevronUp className="h-4 w-4 text-purple-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-purple-500" />
              )}
            </button>
            
            {showContext && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {conversationHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 p-2 rounded-lg text-sm ${
                      msg.sender_role === 'doctor'
                        ? 'bg-blue-100 dark:bg-blue-900/50'
                        : 'bg-green-100 dark:bg-green-900/50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.sender_role === 'doctor'
                        ? 'bg-blue-500 text-white'
                        : 'bg-green-500 text-white'
                    }`}>
                      {msg.sender_role === 'doctor' ? (
                        <Stethoscope className="h-3 w-3" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs text-muted-foreground mb-0.5">
                        {msg.sender_role === 'doctor' ? 'Doctor' : 'You'}
                      </p>
                      <p className="text-xs break-words">
                        {msg.sender_role === 'patient' ? msg.original_content : (msg.translated_content || msg.original_content)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col mb-3 sm:mb-4 overflow-hidden">
        <CardContent className="flex-1 p-0">
          <ScrollArea className={`${conversationHistory.length > 0 ? 'h-[calc(100vh-400px)] sm:h-[calc(100vh-380px)]' : 'h-[calc(100vh-320px)] sm:h-[calc(100vh-300px)]'}`}>
            <div className="flex flex-col gap-4 p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-br-md'
                        : 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-bl-md'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-200 dark:border-purple-700">
                        <Bot className="h-4 w-4 text-purple-500" />
                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                          AI Assistant
                        </span>
                      </div>
                    )}
                    <p className="text-sm sm:text-base whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-white/70' : 'text-muted-foreground'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <Card className="mb-3 sm:mb-4">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              Suggested questions:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-1.5 px-3"
                  onClick={() => setInput(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input */}
      <Card>
        <CardContent className="p-2 sm:p-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={inputPlaceholder}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            ⚠️ This AI assistant provides general information only. Always consult your doctor for medical advice.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
