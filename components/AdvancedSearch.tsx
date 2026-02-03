'use client';

import { memo, useMemo, useState, useCallback } from 'react';
import { Message } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Search, Stethoscope, User, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  message: Message;
  matchType: 'original' | 'translated' | 'both';
  contextBefore: string;
  matchedText: string;
  contextAfter: string;
}

interface AdvancedSearchProps {
  messages: Message[];
  isOpen: boolean;
  onClose: () => void;
  onResultClick?: (messageId: string) => void;
  initialQuery?: string;
}

function AdvancedSearchComponent({ 
  messages, 
  isOpen, 
  onClose,
  onResultClick,
  initialQuery = ''
}: AdvancedSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Handle query change and reset selection
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setSelectedIndex(0);
  }, []);

  // Search and extract context around matches
  const searchResults = useMemo((): SearchResult[] => {
    if (!query.trim() || query.length < 2) return [];

    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();
    const contextLength = 50; // Characters of context before/after match

    messages.forEach(msg => {
      const originalLower = msg.original_content.toLowerCase();
      const translatedLower = msg.translated_content?.toLowerCase() || '';

      const matchesOriginal = originalLower.includes(lowerQuery);
      const matchesTranslated = translatedLower.includes(lowerQuery);

      if (matchesOriginal || matchesTranslated) {
        // Get context from the first match
        const content = matchesOriginal ? msg.original_content : msg.translated_content!;
        const lowerContent = content.toLowerCase();
        const matchIndex = lowerContent.indexOf(lowerQuery);

        const startContext = Math.max(0, matchIndex - contextLength);
        const endContext = Math.min(content.length, matchIndex + query.length + contextLength);

        results.push({
          message: msg,
          matchType: matchesOriginal && matchesTranslated ? 'both' : matchesOriginal ? 'original' : 'translated',
          contextBefore: (startContext > 0 ? '...' : '') + content.slice(startContext, matchIndex),
          matchedText: content.slice(matchIndex, matchIndex + query.length),
          contextAfter: content.slice(matchIndex + query.length, endContext) + (endContext < content.length ? '...' : ''),
        });
      }
    });

    return results.sort((a, b) => 
      new Date(b.message.created_at).getTime() - new Date(a.message.created_at).getTime()
    );
  }, [messages, query]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && searchResults[selectedIndex]) {
      onResultClick?.(searchResults[selectedIndex].message.id);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [searchResults, selectedIndex, onResultClick, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card 
        className="w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Conversations
          </CardTitle>
          <div className="mt-3">
            <Input
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search messages... (min 2 characters)"
              className="w-full"
              autoFocus
            />
          </div>
        </CardHeader>

        <Separator />

        {/* Results Count & Navigation Hint */}
        {query.length >= 2 && (
          <div className="px-4 py-2 bg-muted/30 flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 bg-muted rounded">↑↓</kbd>
              <span>navigate</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded">↵</kbd>
              <span>select</span>
            </div>
          </div>
        )}

        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full max-h-[50vh]">
            {query.length < 2 ? (
              <div className="text-center text-muted-foreground py-12">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Enter at least 2 characters to search</p>
                <p className="text-xs mt-2">
                  Searches both original and translated text
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No messages match &quot;{query}&quot;</p>
                <p className="text-xs mt-2">
                  Try different keywords or check spelling
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {searchResults.map((result, index) => (
                  <div
                    key={result.message.id}
                    onClick={() => onResultClick?.(result.message.id)}
                    className={cn(
                      'p-4 cursor-pointer transition-colors',
                      index === selectedIndex ? 'bg-accent' : 'hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Role Icon */}
                      <div className={cn(
                        'p-1.5 rounded-full shrink-0 mt-0.5',
                        result.message.sender_role === 'doctor' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-green-100 text-green-600'
                      )}>
                        {result.message.sender_role === 'doctor' ? (
                          <Stethoscope className="h-3 w-3" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                      </div>

                      {/* Content with Highlighted Match */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed">
                          <span className="text-muted-foreground">{result.contextBefore}</span>
                          <mark className="bg-yellow-300 text-black px-0.5 rounded font-medium">
                            {result.matchedText}
                          </mark>
                          <span className="text-muted-foreground">{result.contextAfter}</span>
                        </p>
                        
                        {/* Match type indicator */}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span className={cn(
                            'px-1.5 py-0.5 rounded',
                            result.matchType === 'original' && 'bg-blue-100 text-blue-700',
                            result.matchType === 'translated' && 'bg-green-100 text-green-700',
                            result.matchType === 'both' && 'bg-purple-100 text-purple-700'
                          )}>
                            {result.matchType === 'both' ? 'Both' : 
                             result.matchType === 'original' ? 'Original' : 'Translated'}
                          </span>
                          {result.message.audio_url && (
                            <span className="flex items-center gap-1">
                              <Volume2 className="h-3 w-3" />
                              Audio
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className="shrink-0 text-xs text-muted-foreground text-right">
                        <div>
                          {new Date(result.message.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div>
                          {new Date(result.message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>

        <Separator />

        <div className="p-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </Card>
    </div>
  );
}

export const AdvancedSearch = memo(AdvancedSearchComponent);
