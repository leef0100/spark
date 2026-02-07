import { useEffect, useCallback, useRef } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { RealtimeChannel } from '@supabase/supabase-js';
import { messagingService, ChatMessage } from '../services/messagingService';
import { supabase } from '../../../lib/supabase';

const MESSAGES_PAGE_SIZE = 50;

export function useMessages(matchId: string) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const query = useInfiniteQuery({
    queryKey: ['messages', matchId],
    queryFn: async ({ pageParam }) => {
      const result = await messagingService.getMessages(
        matchId,
        MESSAGES_PAGE_SIZE,
        pageParam
      );
      if (result.error) {
        throw new Error(result.error);
      }
      return result.messages;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length < MESSAGES_PAGE_SIZE) {
        return undefined;
      }
      return lastPage[0]?.created_at;
    },
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60, // 1 minute
  });

  // Subscribe to real-time messages
  useEffect(() => {
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channelRef.current = messagingService.subscribeToMessages(
        matchId,
        (newMessage) => {
          // Add new message to the cache
          queryClient.setQueryData(
            ['messages', matchId],
            (oldData: any) => {
              if (!oldData) return oldData;

              const chatMessage: ChatMessage = {
                ...newMessage,
                isOwn: newMessage.sender_id === user.id,
              };

              // Add to the end of the first page (most recent)
              return {
                ...oldData,
                pages: oldData.pages.map((page: ChatMessage[], index: number) =>
                  index === 0 ? [...page, chatMessage] : page
                ),
              };
            }
          );

          // Invalidate matches to update last message preview
          queryClient.invalidateQueries({ queryKey: ['matches'] });
        }
      );
    };

    setupSubscription();

    return () => {
      if (channelRef.current) {
        messagingService.unsubscribeFromMessages(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [matchId, queryClient]);

  // Flatten messages from all pages
  const messages = query.data?.pages.flat() ?? [];

  return {
    messages,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
    isLoadingMore: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}

export function useSendMessage(matchId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const result = await messagingService.sendMessage(matchId, content);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.message;
    },
    onMutate: async (content) => {
      // Optimistic update
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        match_id: matchId,
        sender_id: user.id,
        content,
        read_at: null,
        created_at: new Date().toISOString(),
        isOwn: true,
      };

      queryClient.setQueryData(
        ['messages', matchId],
        (oldData: any) => {
          if (!oldData) {
            return {
              pages: [[optimisticMessage]],
              pageParams: [undefined],
            };
          }

          return {
            ...oldData,
            pages: oldData.pages.map((page: ChatMessage[], index: number) =>
              index === 0 ? [...page, optimisticMessage] : page
            ),
          };
        }
      );
    },
    onSuccess: () => {
      // Invalidate to get the real message with server timestamp
      queryClient.invalidateQueries({ queryKey: ['messages', matchId] });
      // Update matches list (to show new last message and stop expiry timer)
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useMarkMessagesAsRead(matchId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await messagingService.markMessagesAsRead(matchId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      // Update matches list to clear unread count
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['unread-count'],
    queryFn: () => messagingService.getUnreadCount(),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}
