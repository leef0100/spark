import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchingService, LikeReceived } from '../services/matchingService';

export function useLikesReceived() {
  return useQuery({
    queryKey: ['likes-received'],
    queryFn: async () => {
      const result = await matchingService.getLikesReceived();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.likes;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useLikesCount() {
  return useQuery({
    queryKey: ['likes-count'],
    queryFn: () => matchingService.getLikesCount(),
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
  });
}

export function useAcceptLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (likerId: string) => {
      const result = await matchingService.acceptLike(likerId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (_, likerId) => {
      // Remove from likes list
      queryClient.setQueryData(['likes-received'], (oldData: LikeReceived[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter((like) => like.likerProfile.id !== likerId);
      });
      // Invalidate matches to show new match
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      // Update likes count
      queryClient.invalidateQueries({ queryKey: ['likes-count'] });
    },
  });
}

export function useDeclineLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (likerId: string) => {
      const result = await matchingService.declineLike(likerId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (_, likerId) => {
      // Remove from likes list
      queryClient.setQueryData(['likes-received'], (oldData: LikeReceived[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter((like) => like.likerProfile.id !== likerId);
      });
      // Update likes count
      queryClient.invalidateQueries({ queryKey: ['likes-count'] });
    },
  });
}
