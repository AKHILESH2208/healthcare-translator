'use client';

import { memo, useMemo, useState } from 'react';
import { Message } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { History, Calendar, Stethoscope, User, Volume2, X, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationHistoryProps {
  messages: Message[];
  isOpen: boolean;
  onClose: () => void;
  onMessageClick?: (messageId: string) => void;
}

interface GroupedMessages {
  date: string;
  displayDate: string;
  messages: Message[];
}

function ConversationHistoryComponent({ 
  messages, 
  isOpen, 
  onClose,
  onMessageClick 
}: ConversationHistoryProps) {
  // Initialize with today expanded by default
  const getInitialExpanded = () => {
    const today = new Date().toISOString().split('T')[0];
    return new Set([today]);
  };
  
  const [expandedDates, setExpandedDates] = useState<Set<string>>(getInitialExpanded);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: Map<string, Message[]> = new Map();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
    
    messages.forEach(msg => {
      const date = new Date(msg.created_at);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(msg);
    });

    // Convert to array and sort by date (newest first)
    const result: GroupedMessages[] = [];

    groups.forEach((msgs, dateKey) => {
      let displayDate: string;
      if (dateKey === todayStr) {
        displayDate = 'Today';
      } else if (dateKey === yesterdayStr) {
        displayDate = 'Yesterday';
      } else {
        displayDate = new Date(dateKey).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: dateKey.split('-')[0] !== todayStr.split('-')[0] ? 'numeric' : undefined,
        });
      }

      result.push({
        date: dateKey,
        displayDate,
        messages: msgs.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
      });
    });

    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [messages]);

  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  if (!isOpen) return null;

  const totalMessages = messages.length;
  const totalAudio = messages.filter(m => m.audio_url).length;
  const doctorMessages = messages.filter(m => m.sender_role === 'doctor').length;
  const patientMessages = messages.filter(m => m.sender_role === 'patient').length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Conversation History
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <Separator />

        {/* Stats Bar */}
        <div className="px-4 py-2 bg-muted/30 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {groupedMessages.length} days
          </span>
          <span>{totalMessages} messages</span>
          <span className="flex items-center gap-1 text-blue-600">
            <Stethoscope className="h-3 w-3" />
            {doctorMessages}
          </span>
          <span className="flex items-center gap-1 text-green-600">
            <User className="h-3 w-3" />
            {patientMessages}
          </span>
          {totalAudio > 0 && (
            <span className="flex items-center gap-1">
              <Volume2 className="h-3 w-3" />
              {totalAudio} audio
            </span>
          )}
        </div>

        <Separator />

        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {groupedMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No conversation history yet</p>
                </div>
              ) : (
                groupedMessages.map(group => (
                  <div key={group.date} className="border rounded-lg overflow-hidden">
                    {/* Date Header */}
                    <button
                      onClick={() => toggleDate(group.date)}
                      className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        {expandedDates.has(group.date) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-medium">{group.displayDate}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {group.messages.length} message{group.messages.length !== 1 ? 's' : ''}
                      </span>
                    </button>

                    {/* Messages List */}
                    {expandedDates.has(group.date) && (
                      <div className="divide-y">
                        {group.messages.map(msg => (
                          <div
                            key={msg.id}
                            onClick={() => onMessageClick?.(msg.id)}
                            className={cn(
                              'p-3 hover:bg-muted/30 cursor-pointer transition-colors',
                              'flex gap-3 items-start'
                            )}
                          >
                            {/* Role Icon */}
                            <div className={cn(
                              'p-1.5 rounded-full shrink-0',
                              msg.sender_role === 'doctor' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                            )}>
                              {msg.sender_role === 'doctor' ? (
                                <Stethoscope className="h-3 w-3" />
                              ) : (
                                <User className="h-3 w-3" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm line-clamp-2">
                                {msg.original_content}
                              </p>
                              {msg.translated_content && msg.translated_content !== msg.original_content && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
                                  → {msg.translated_content}
                                </p>
                              )}
                            </div>

                            {/* Metadata */}
                            <div className="shrink-0 text-right">
                              <span className="text-xs text-muted-foreground">
                                {new Date(msg.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {msg.audio_url && (
                                <Volume2 className="h-3 w-3 text-muted-foreground mt-1 ml-auto" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export const ConversationHistory = memo(ConversationHistoryComponent);
