'use client';

import { memo, useCallback, useMemo } from 'react';
import { Message, SenderRole } from '@/types';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Volume2, Stethoscope, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageBubbleProps {
  message: Message;
  currentRole: SenderRole;
  searchQuery?: string;
}

// Helper function to highlight search matches
const HighlightedText = memo(function HighlightedText({ text, query }: { text: string; query?: string }) {
  if (!query?.trim()) {
    return <>{text}</>;
  }

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
  
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-300 text-black rounded px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
});

function MessageBubbleComponent({ message, currentRole, searchQuery }: MessageBubbleProps) {
  const isOwnMessage = message.sender_role === currentRole;
  
  // Memoize display content calculations
  const { displayContent, subtitleContent, isDoctor } = useMemo(() => {
    const isDoc = message.sender_role === 'doctor';
    
    // Display logic based on viewer and message sender:
    // - Doctor viewing Doctor message: show original (English), subtitle shows translation
    // - Doctor viewing Patient message: show translated (English), subtitle shows original
    // - Patient viewing Patient message: show original (their language), subtitle shows translation (English)
    // - Patient viewing Doctor message: show translated (their language), subtitle shows original (English)
    
    // Simplified: Viewer always sees their language as the main content
    // If viewer is Doctor: main content should be English
    // If viewer is Patient: main content should be patient's language
    
    let display: string;
    let subtitle: string | null;
    
    if (currentRole === 'doctor') {
      // Doctor wants to see English
      if (isDoc) {
        // Doctor's own message - original is English
        display = message.original_content;
        subtitle = message.translated_content;
      } else {
        // Patient's message - need the English version
        // If patient typed in their language, translated_content is English
        // Show translated (English) as main, original as subtitle
        display = message.translated_content || message.original_content;
        subtitle = message.translated_content ? message.original_content : null;
      }
    } else {
      // Patient wants to see their language
      if (!isDoc) {
        // Patient's own message - original is their language
        display = message.original_content;
        subtitle = message.translated_content;
      } else {
        // Doctor's message - need the translated version (patient's language)
        display = message.translated_content || message.original_content;
        subtitle = message.translated_content ? message.original_content : null;
      }
    }

    return { displayContent: display, subtitleContent: subtitle, isDoctor: isDoc };
  }, [message, currentRole]);

  const bubbleColor = isDoctor 
    ? 'bg-blue-500 text-white' 
    : 'bg-green-500 text-white';

  const alignment = isOwnMessage ? 'ml-auto' : 'mr-auto';

  const playAudio = useCallback(() => {
    if (message.audio_url) {
      const audio = new Audio(message.audio_url);
      audio.play().catch(err => console.error('Audio playback failed:', err));
    }
  }, [message.audio_url]);

  const formattedTime = useMemo(() => {
    return new Date(message.created_at).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, [message.created_at]);

  return (
    <div 
      id={`message-${message.id}`}
      className={cn('flex flex-col gap-1 max-w-[85%] sm:max-w-[75%] md:max-w-[70%]', alignment)}
    >
      {/* Sender indicator */}
      <div className={cn('flex items-center gap-1 px-2 text-xs text-muted-foreground', isOwnMessage && 'justify-end')}>
        {isDoctor ? (
          <>
            <Stethoscope className="h-3 w-3" />
            <span>Doctor</span>
          </>
        ) : (
          <>
            <User className="h-3 w-3" />
            <span>Patient</span>
          </>
        )}
      </div>

      <Card className={cn('p-3 rounded-2xl shadow-sm transition-all hover:shadow-md', bubbleColor, alignment)}>
        <p className="text-sm md:text-base break-words leading-relaxed">
          <HighlightedText text={displayContent} query={searchQuery} />
        </p>
        
        {/* Subtitle showing the other version */}
        {subtitleContent && subtitleContent !== displayContent && (
          <p className="text-xs mt-2 opacity-80 border-t border-white/20 pt-2 italic leading-relaxed">
            <HighlightedText text={subtitleContent} query={searchQuery} />
          </p>
        )}
        
        {message.audio_url && (
          <Button
            variant="ghost"
            size="sm"
            onClick={playAudio}
            className="mt-2 text-white hover:bg-white/20 h-8"
          >
            <Volume2 className="h-4 w-4 mr-2" />
            Play Audio
          </Button>
        )}
      </Card>
      
      <span className={cn('text-xs text-muted-foreground px-2', isOwnMessage && 'text-right')}>
        {formattedTime}
        {isOwnMessage && <span className="ml-1 opacity-60">(You)</span>}
      </span>
    </div>
  );
}

// Export memoized component for performance
export const MessageBubble = memo(MessageBubbleComponent);
