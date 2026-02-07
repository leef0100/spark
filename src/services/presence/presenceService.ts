import { supabase } from '../../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceState {
  odguser_id: string;
  online_at: string;
  status: 'online' | 'away' | 'offline';
}

export interface TypingState {
  user_id: string;
  match_id: string;
  is_typing: boolean;
}

class PresenceService {
  private presenceChannel: RealtimeChannel | null = null;
  private typingChannels: Map<string, RealtimeChannel> = new Map();
  private currentUserId: string | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize presence tracking for the current user
   */
  async initialize(userId: string): Promise<void> {
    this.currentUserId = userId;

    // Update user's online status in the database
    await this.updatePresenceStatus('online');

    // Start heartbeat to keep presence alive
    this.startHeartbeat();

    // Subscribe to global presence channel
    this.presenceChannel = supabase.channel('presence:global', {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    this.presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = this.presenceChannel?.presenceState();
        console.log('Presence sync:', state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.presenceChannel?.track({
            user_id: userId,
            online_at: new Date().toISOString(),
            status: 'online',
          });
        }
      });
  }

  /**
   * Clean up presence when user logs out or app closes
   */
  async cleanup(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.currentUserId) {
      await this.updatePresenceStatus('offline');
    }

    if (this.presenceChannel) {
      await this.presenceChannel.unsubscribe();
      this.presenceChannel = null;
    }

    // Clean up all typing channels
    for (const [, channel] of this.typingChannels) {
      await channel.unsubscribe();
    }
    this.typingChannels.clear();

    this.currentUserId = null;
  }

  /**
   * Update presence status in database
   */
  private async updatePresenceStatus(status: 'online' | 'away' | 'offline'): Promise<void> {
    if (!this.currentUserId) return;

    try {
      await supabase.from('user_presence').upsert({
        user_id: this.currentUserId,
        status,
        last_seen: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }

  /**
   * Start heartbeat to keep presence alive
   */
  private startHeartbeat(): void {
    // Update presence every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.updatePresenceStatus('online');
    }, 30000);
  }

  /**
   * Set user as away (when app goes to background)
   */
  async setAway(): Promise<void> {
    await this.updatePresenceStatus('away');

    if (this.presenceChannel && this.currentUserId) {
      await this.presenceChannel.track({
        user_id: this.currentUserId,
        online_at: new Date().toISOString(),
        status: 'away',
      });
    }
  }

  /**
   * Set user as online (when app comes to foreground)
   */
  async setOnline(): Promise<void> {
    await this.updatePresenceStatus('online');

    if (this.presenceChannel && this.currentUserId) {
      await this.presenceChannel.track({
        user_id: this.currentUserId,
        online_at: new Date().toISOString(),
        status: 'online',
      });
    }
  }

  /**
   * Get a user's presence status
   */
  async getUserPresence(userId: string): Promise<{
    status: 'online' | 'away' | 'offline';
    lastSeen: Date | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('status, last_seen')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return { status: 'offline', lastSeen: null };
      }

      // If last seen is more than 2 minutes ago, consider offline
      const lastSeen = new Date(data.last_seen);
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

      if (lastSeen < twoMinutesAgo) {
        return { status: 'offline', lastSeen };
      }

      return {
        status: data.status as 'online' | 'away' | 'offline',
        lastSeen,
      };
    } catch (error) {
      return { status: 'offline', lastSeen: null };
    }
  }

  /**
   * Subscribe to typing indicators for a specific match
   */
  subscribeToTyping(
    matchId: string,
    onTypingChange: (userId: string, isTyping: boolean) => void
  ): () => void {
    const channelName = `typing:${matchId}`;

    // Reuse existing channel if available
    let channel = this.typingChannels.get(channelName);

    if (!channel) {
      channel = supabase.channel(channelName, {
        config: {
          broadcast: {
            self: false,
          },
        },
      });

      channel
        .on('broadcast', { event: 'typing' }, ({ payload }) => {
          onTypingChange(payload.user_id, payload.is_typing);
        })
        .subscribe();

      this.typingChannels.set(channelName, channel);
    }

    return () => {
      // Don't unsubscribe immediately - keep channel open for reuse
    };
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(matchId: string, isTyping: boolean): Promise<void> {
    if (!this.currentUserId) return;

    const channelName = `typing:${matchId}`;
    let channel = this.typingChannels.get(channelName);

    if (!channel) {
      channel = supabase.channel(channelName, {
        config: {
          broadcast: {
            self: false,
          },
        },
      });

      await channel.subscribe();
      this.typingChannels.set(channelName, channel);
    }

    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: this.currentUserId,
        match_id: matchId,
        is_typing: isTyping,
      },
    });
  }

  /**
   * Unsubscribe from typing for a specific match
   */
  async unsubscribeFromTyping(matchId: string): Promise<void> {
    const channelName = `typing:${matchId}`;
    const channel = this.typingChannels.get(channelName);

    if (channel) {
      await channel.unsubscribe();
      this.typingChannels.delete(channelName);
    }
  }
}

export const presenceService = new PresenceService();
