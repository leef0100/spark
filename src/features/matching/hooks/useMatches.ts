import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchingService, MatchWithDetails } from '../services/matchingService';

export function useMatches() {
  return useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const result = await matchingService.getMatches();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.matches;
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useUnmatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matchId: string) => {
      const result = await matchingService.unmatch(matchId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (_, matchId) => {
      // Remove from matches list
      queryClient.setQueryData(['matches'], (oldData: MatchWithDetails[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter((match) => match.matchId !== matchId);
      });
    },
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, matchId }: { userId: string; matchId?: string }) => {
      const result = await matchingService.blockUser(userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      // If there's a match, also unmatch
      if (matchId) {
        await matchingService.unmatch(matchId);
      }
      return result;
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['likes-received'] });
      queryClient.invalidateQueries({ queryKey: ['discovery-feed'] });
    },
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await matchingService.unblockUser(userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
    },
  });
}

export function useBlockedUsers() {
  return useQuery({
    queryKey: ['blocked-users'],
    queryFn: async () => {
      const result = await matchingService.getBlockedUsers();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.users;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
