'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { SenderRole, LanguageCode, MedicalSummary } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Toggle } from '@/components/ui/toggle';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageBubble } from '@/components/MessageBubble';
import { MessageSkeletonGroup } from '@/components/MessageSkeleton';
import { MedicalSummaryModal } from '@/components/MedicalSummaryModal';
import { ConversationHistory } from '@/components/ConversationHistory';
import { AdvancedSearch } from '@/components/AdvancedSearch';
import { useMessages } from '@/hooks/useMessages';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { uploadAudioFile } from '@/lib/supabase';
import { SUPPORTED_LANGUAGES, DEFAULT_PATIENT_LANGUAGE, SUMMARY_MESSAGE_LIMIT } from '@/lib/constants';
import { 
  Stethoscope, 
  User, 
  Send, 
  Loader2,
  Mic,
  MicOff,
  X,
  Search,
  FileText,
  Trash2,
  ChevronDown,
  Wifi,
  WifiOff,
  History
} from 'lucide-react';

export function ChatInterface() {
  const [currentRole, setCurrentRole] = useState<SenderRole>('doctor');
  const [patientLanguage, setPatientLanguage] = useState<LanguageCode>(DEFAULT_PATIENT_LANGUAGE);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [medicalSummary, setMedicalSummary] = useState<MedicalSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  
  const { messages, isLoading, error, addMessage, getRecentMessages, clearMessages } = useMessages();
  const { 
    isRecording, 
    audioBlob, 
    audioUrl, 
    duration, 
    error: recordingError,
    startRecording, 
    stopRecording, 
    clearRecording 
  } = useAudioRecorder();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'instant' 
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close modals
      if (e.key === 'Escape') {
        if (showSearch) {
          setShowSearch(false);
          setSearchQuery('');
        }
        if (showAdvancedSearch) setShowAdvancedSearch(false);
        if (showHistory) setShowHistory(false);
      }
      // Ctrl/Cmd + K to open advanced search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowAdvancedSearch(true);
      }
      // Ctrl/Cmd + H to open history
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setShowHistory(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch, showAdvancedSearch, showHistory]);

  // Handle scroll to show/hide scroll button
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  // Filter messages based on search query
  const filteredMessages = searchQuery.trim()
    ? messages.filter(msg => 
        msg.original_content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (msg.translated_content?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : messages;

  const handleRoleToggle = (role: SenderRole) => {
    setCurrentRole(role);
  };

  const handleClearChat = async () => {
    toast('Clear all messages?', {
      description: 'This action cannot be undone.',
      action: {
        label: 'Clear',
        onClick: async () => {
          await clearMessages();
          toast.success('Messages cleared');
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  };

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || isSending || !isOnline) return;

    // Cancel any pending requests
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsSending(true);
    const content = messageInput.trim();
    setMessageInput('');

    try {
      const sourceLanguage = currentRole === 'doctor' ? 'en' : patientLanguage;
      const targetLanguage = currentRole === 'doctor' ? patientLanguage : 'en';

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: content,
          sourceLanguage,
          targetLanguage,
          context: 'medical',
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Translation failed');
      }

      const { translatedText } = await response.json();

      await addMessage(currentRole, content, translatedText, sourceLanguage);
    } catch (err) {
      // Don't show error for aborted requests
      if (err instanceof Error && err.name === 'AbortError') return;
      
      console.error('Failed to send message:', err);
      toast.error('Translation failed. Message sent without translation.');
      await addMessage(currentRole, content, content, currentRole === 'doctor' ? 'en' : patientLanguage);
    } finally {
      setIsSending(false);
    }
  }, [messageInput, isSending, isOnline, currentRole, patientLanguage, addMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Audio recording handlers
  const handleRecordingToggle = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const handleSendAudio = useCallback(async () => {
    if (!audioBlob || isTranscribing || !isOnline) return;

    // Cancel any pending requests
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setIsTranscribing(true);

    try {
      // Upload audio to Supabase Storage
      const fileName = `${currentRole}-${Date.now()}.webm`;
      const { url: audioPath, error: uploadError } = await uploadAudioFile(audioBlob, fileName);
      
      if (uploadError) throw uploadError;
      
      // Transcribe the audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('language', currentRole === 'doctor' ? 'en' : patientLanguage);

      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
        signal,
      });

      if (!transcribeResponse.ok) throw new Error('Transcription failed');

      const { text: transcribedText } = await transcribeResponse.json();

      // Translate the transcribed text
      const sourceLanguage = currentRole === 'doctor' ? 'en' : patientLanguage;
      const targetLanguage = currentRole === 'doctor' ? patientLanguage : 'en';

      const translateResponse = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: transcribedText,
          sourceLanguage,
          targetLanguage,
          context: 'medical',
        }),
        signal,
      });

      if (!translateResponse.ok) throw new Error('Translation failed');

      const { translatedText } = await translateResponse.json();

      // Add the message
      await addMessage(currentRole, transcribedText, translatedText, sourceLanguage, audioPath || undefined);
      
      clearRecording();
      toast.success('Audio message sent!');
    } catch (err) {
      // Don't show error for aborted requests
      if (err instanceof Error && err.name === 'AbortError') return;
      
      console.error('Failed to process audio:', err);
      toast.error('Failed to process audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  }, [audioBlob, isTranscribing, isOnline, currentRole, patientLanguage, addMessage, clearRecording]);

  const handleGenerateSummary = useCallback(async () => {
    if (!isOnline) {
      toast.error('Cannot generate summary while offline');
      return;
    }
    
    setIsGeneratingSummary(true);
    setShowSummaryModal(true);
    setMedicalSummary(null);

    try {
      const recentMessages = await getRecentMessages(SUMMARY_MESSAGE_LIMIT);
      if (recentMessages.length === 0) {
        toast.error('No messages to summarize');
        throw new Error('No messages to summarize');
      }

      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: recentMessages }),
      });

      if (!response.ok) throw new Error('Summary generation failed');

      const data = await response.json();
      setMedicalSummary(data.summary);
      toast.success('Summary generated');
    } catch (err) {
      console.error('Failed to generate summary:', err);
      toast.error('Failed to generate summary');
      setMedicalSummary({
        symptoms: [],
        medications: [],
        followUpActions: [],
        timestamp: new Date().toISOString(),
        messageCount: 0,
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [isOnline, getRecentMessages]);

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-2 sm:p-4">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg mb-3 flex items-center justify-center gap-2 text-sm font-medium">
          <WifiOff className="h-4 w-4" />
          You are offline. Messages will be sent when connection is restored.
        </div>
      )}
      
      {/* Header Card */}
      <Card className="mb-3 sm:mb-4 shadow-md">
        <CardHeader className="pb-3 px-3 sm:px-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg sm:text-xl md:text-2xl bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent font-bold">
                  Nao Medical Translator
                </CardTitle>
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-destructive" />
                )}
              </div>
              
              {/* Clear chat button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearChat}
                disabled={messages.length === 0}
                className="text-muted-foreground hover:text-destructive"
                title="Clear all messages"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Role Toggle */}
              <div className="flex items-center gap-2 bg-muted p-1 rounded-lg w-full sm:w-auto">
                <Toggle
                  pressed={currentRole === 'doctor'}
                  onPressedChange={() => handleRoleToggle('doctor')}
                  className="flex-1 sm:flex-none data-[state=on]:bg-blue-500 data-[state=on]:text-white"
                >
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Doctor
                </Toggle>
                <Toggle
                  pressed={currentRole === 'patient'}
                  onPressedChange={() => handleRoleToggle('patient')}
                  className="flex-1 sm:flex-none data-[state=on]:bg-green-500 data-[state=on]:text-white"
                >
                  <User className="h-4 w-4 mr-2" />
                  Patient
                </Toggle>
              </div>

              {/* Language Selector (shown only for patient) */}
              {currentRole === 'patient' && (
                <select
                  value={patientLanguage}
                  onChange={(e) => setPatientLanguage(e.target.value as LanguageCode)}
                  className="w-full sm:w-auto px-3 py-2 border rounded-md bg-background text-sm"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label} ({lang.nativeName})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages Card */}
      <Card className="flex-1 flex flex-col mb-3 sm:mb-4 relative overflow-hidden">
        {/* Search Bar (collapsible) */}
        {showSearch && (
          <div className="border-b p-2 flex gap-2 bg-muted/50">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="flex-1"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Search results count */}
        {showSearch && searchQuery && (
          <div className="px-3 py-1 text-xs text-muted-foreground bg-muted/30 border-b">
            Found {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
          </div>
        )}

        <CardContent className="flex-1 p-0 relative">
          {isLoading ? (
            <MessageSkeletonGroup />
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-destructive">{error}</p>
            </div>
          ) : (
            <ScrollArea 
              className="h-[calc(100vh-380px)] sm:h-[calc(100vh-350px)] p-3 sm:p-4"
              onScrollCapture={handleScroll}
              ref={scrollAreaRef}
            >
              <div className="flex flex-col gap-3 sm:gap-4">
                {filteredMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    {searchQuery ? (
                      <>
                        <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg">No matching messages</p>
                        <p className="text-sm mt-2">Try a different search term</p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg">💬 No messages yet</p>
                        <p className="text-sm mt-2">Start a conversation!</p>
                      </>
                    )}
                  </div>
                ) : (
                  filteredMessages.map((message) => (
                    <MessageBubble 
                      key={message.id} 
                      message={message} 
                      currentRole={currentRole}
                      searchQuery={searchQuery}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}

          {/* Scroll to bottom button */}
          {showScrollButton && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-4 right-4 rounded-full shadow-lg opacity-90 hover:opacity-100"
              onClick={() => scrollToBottom()}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Input Card */}
      <Card>
        <CardContent className="p-2 sm:p-3">
          {/* Audio Recording UI */}
          {(isRecording || audioBlob) && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-lg">
              {isRecording ? (
                <>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-sm font-medium text-red-600">
                      Recording... {formatDuration(duration)}
                    </span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={stopRecording}
                  >
                    <MicOff className="h-4 w-4 mr-1" />
                    Stop
                  </Button>
                </>
              ) : audioBlob && (
                <>
                  <audio src={audioUrl!} controls className="flex-1 h-8" />
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSendAudio}
                    disabled={isTranscribing}
                  >
                    {isTranscribing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Send className="h-4 w-4 mr-1" />
                    )}
                    {isTranscribing ? 'Processing...' : 'Send'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecording}
                    disabled={isTranscribing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Recording Error */}
          {recordingError && (
            <div className="text-xs text-destructive mb-2 p-2 bg-destructive/10 rounded">
              {recordingError}
            </div>
          )}

          {/* Message Input */}
          <div className="flex gap-2">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Type a message as ${currentRole}...`}
              disabled={isSending || isRecording}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!messageInput.trim() || isSending || isRecording} 
              size="icon"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
            <Button 
              variant={isRecording ? "destructive" : "outline"}
              size="icon"
              onClick={handleRecordingToggle}
              disabled={isSending || isTranscribing || !!audioBlob}
              title={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 mt-2">
            <Button 
              variant={showSearch ? "secondary" : "outline"}
              size="sm" 
              onClick={() => setShowAdvancedSearch(true)}
              className="flex-1"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
              <kbd className="hidden sm:inline-flex ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded">⌘K</kbd>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(true)}
              disabled={messages.length === 0}
              className="flex-1"
            >
              <History className="h-4 w-4 mr-2" />
              History
              <kbd className="hidden sm:inline-flex ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded">⌘H</kbd>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateSummary}
              disabled={isGeneratingSummary || messages.length === 0 || !isOnline}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isGeneratingSummary ? 'Generating...' : 'Summary'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Modal */}
      <MedicalSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        summary={medicalSummary}
        isLoading={isGeneratingSummary}
      />

      {/* Conversation History Modal */}
      <ConversationHistory
        messages={messages}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onMessageClick={(messageId) => {
          setShowHistory(false);
          // Scroll to message (could be enhanced with actual scroll-to logic)
          const element = document.getElementById(`message-${messageId}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      />

      {/* Advanced Search Modal */}
      <AdvancedSearch
        messages={messages}
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        initialQuery={searchQuery}
        onResultClick={(messageId) => {
          setShowAdvancedSearch(false);
          // Scroll to message
          const element = document.getElementById(`message-${messageId}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      />

      {/* Status Footer */}
      <footer className="mt-2 py-2 text-center text-xs text-muted-foreground border-t">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span>
            Viewing as: <span className={`font-semibold ${currentRole === 'doctor' ? 'text-blue-600' : 'text-green-600'}`}>
              {currentRole === 'doctor' ? '👨‍⚕️ Doctor' : '🧑 Patient'}
            </span>
          </span>
          {currentRole === 'patient' && (
            <span className="border-l pl-2">
              Language: <span className="font-semibold">
                {SUPPORTED_LANGUAGES.find(l => l.code === patientLanguage)?.nativeName}
              </span>
            </span>
          )}
          {messages.length > 0 && (
            <span className="border-l pl-2 opacity-70">{messages.length} messages</span>
          )}
        </div>
        <div className="mt-1 opacity-50">
          Powered by Nao Medical • AI Translation
        </div>
      </footer>
    </div>
  );
}
