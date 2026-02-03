'use client';

import { useState, useEffect, useCallback } from 'react';
import { Message, SenderRole, LanguageCode } from '@/types';
import { supabase } from '@/lib/supabase';

/**
 * Custom hook for managing real-time messages in the doctor-patient chat.
 * Handles CRUD operations and real-time subscriptions to Supabase.
 * 
 * @returns {object} Messages state and operations
 */
export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all messages from Supabase on mount
   */
  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setMessages(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(errorMessage);
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Add a new message to the database
   */
  const addMessage = useCallback(async (
    senderRole: SenderRole,
    originalContent: string,
    translatedContent: string,
    language: LanguageCode,
    audioUrl?: string
  ): Promise<Message | null> => {
    try {
      setError(null);

      const newMessage: Omit<Message, 'id' | 'created_at'> = {
        sender_role: senderRole,
        original_content: originalContent,
        translated_content: translatedContent,
        audio_url: audioUrl || null,
        language,
        metadata: {},
      };

      const { data, error: insertError } = await supabase
        .from('messages')
        .insert([newMessage])
        .select()
        .single();

      if (insertError) throw insertError;

      // Optimistically add the message locally for immediate feedback
      // Real-time subscription will also receive it, but we handle duplicates
      if (data) {
        setMessages((prev) => {
          const exists = prev.some(msg => msg.id === data.id);
          if (exists) return prev;
          return [...prev, data];
        });
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add message';
      setError(errorMessage);
      console.error('Error adding message:', err);
      return null;
    }
  }, []);

  /**
   * Delete a message by ID
   */
  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (deleteError) throw deleteError;

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete message';
      setError(errorMessage);
      console.error('Error deleting message:', err);
      return false;
    }
  }, []);

  /**
   * Clear all messages (useful for testing)
   */
  const clearMessages = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) throw deleteError;

      setMessages([]);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear messages';
      setError(errorMessage);
      console.error('Error clearing messages:', err);
      return false;
    }
  }, []);

  /**
   * Search messages by content
   */
  const searchMessages = useCallback(async (query: string): Promise<Message[]> => {
    try {
      setError(null);

      if (!query.trim()) {
        return messages;
      }

      const { data, error: searchError } = await supabase
        .rpc('search_messages', { search_query: query });

      if (searchError) throw searchError;
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search messages';
      setError(errorMessage);
      console.error('Error searching messages:', err);
      return [];
    }
  }, [messages]);

  /**
   * Get recent messages for medical summary
   */
  const getRecentMessages = useCallback(async (limit: number = 20): Promise<Message[]> => {
    try {
      setError(null);

      const { data, error: fetchError } = await supabase
        .rpc('get_recent_messages', { message_limit: limit });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get recent messages';
      setError(errorMessage);
      console.error('Error getting recent messages:', err);
      return [];
    }
  }, []);

  /**
   * Subscribe to real-time message updates
   */
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('messages_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('Real-time INSERT:', payload);
          setMessages((prev) => {
            // Avoid duplicates - check if message already exists
            const exists = prev.some(msg => msg.id === payload.new.id);
            if (exists) return prev;
            return [...prev, payload.new as Message];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('Real-time DELETE:', payload);
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('Real-time UPDATE:', payload);
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? payload.new as Message : msg))
          );
        }
      )
      .subscribe((status) => {
        console.log('Supabase realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages]);

  return {
    messages,
    isLoading,
    error,
    addMessage,
    deleteMessage,
    clearMessages,
    searchMessages,
    getRecentMessages,
    refetch: fetchMessages,
  };
}
