import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../lib/database.types';
import type { RealtimeChannel } from '@supabase/supabase-js';

type Message = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];

export interface ChatMessage extends Message {
  isOwn: boolean;
}

export const messagingService = {
  /**
   * Get messages for a match
   */
  async getMessages(
    matchId: string,
    limit: number = 50,
    before?: string
  ): Promise<{ messages: ChatMessage[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { messages: [], error: 'Not authenticated' };
      }

      let query = supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error } = await query;

      if (error) {
        return { messages: [], error: error.message };
      }

      const messages: ChatMessage[] = (data || [])
        .reverse()
        .map((msg) => ({
          ...msg,
          isOwn: msg.sender_id === user.id,
        }));

      return { messages };
    } catch (error) {
      return { messages: [], error: 'Failed to fetch messages' };
    }
  },

  /**
   * Send a message
   */
  async sendMessage(
    matchId: string,
    content: string
  ): Promise<{ message: Message | null; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { message: null, error: 'Not authenticated' };
      }

      const messageData: MessageInsert = {
        match_id: matchId,
        sender_id: user.id,
        content: content.trim(),
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        return { message: null, error: error.message };
      }

      return { message: data };
    } catch (error) {
      return { message: null, error: 'Failed to send message' };
    }
  },

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(matchId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('match_id', matchId)
        .neq('sender_id', user.id)
        .is('read_at', null);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to mark messages as read' };
    }
  },

  /**
   * Subscribe to new messages in a match
   */
  subscribeToMessages(
    matchId: string,
    onMessage: (message: Message) => void,
    onError?: (error: Error) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          onMessage(payload.new as Message);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          onError?.(new Error('Failed to subscribe to messages'));
        }
      });

    return channel;
  },

  /**
   * Unsubscribe from messages
   */
  async unsubscribeFromMessages(channel: RealtimeChannel): Promise<void> {
    await supabase.removeChannel(channel);
  },

  /**
   * Subscribe to all user's matches for new message notifications
   */
  subscribeToAllMessages(
    onMessage: (matchId: string, message: Message) => void,
    onError?: (error: Error) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel('all-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const message = payload.new as Message;
          onMessage(message.match_id, message);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          onError?.(new Error('Failed to subscribe to messages'));
        }
      });

    return channel;
  },

  /**
   * Subscribe to new matches
   */
  subscribeToNewMatches(
    userId: string,
    onMatch: (match: any) => void,
    onError?: (error: Error) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel('new-matches')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
        },
        (payload) => {
          const match = payload.new;
          // Check if user is part of this match
          if (match.user1_id === userId || match.user2_id === userId) {
            onMatch(match);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          onError?.(new Error('Failed to subscribe to matches'));
        }
      });

    return channel;
  },

  /**
   * Get total unread message count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      // Get all user's active matches
      const { data: matches } = await supabase
        .from('matches')
        .select('id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('is_active', true);

      if (!matches || matches.length === 0) return 0;

      const matchIds = matches.map((m) => m.id);

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('match_id', matchIds)
        .neq('sender_id', user.id)
        .is('read_at', null);

      return count || 0;
    } catch {
      return 0;
    }
  },
};
