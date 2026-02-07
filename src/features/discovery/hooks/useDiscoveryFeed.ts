import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discoveryService, DiscoveryProfile } from '../services/discoveryService';

const FEED_PAGE_SIZE = 10;

export function useDiscoveryFeed() {
  return useInfiniteQuery({
    queryKey: ['discovery-feed'],
    queryFn: async ({ pageParam = 0 }) => {
      const result = await discoveryService.getDiscoveryFeed(FEED_PAGE_SIZE, pageParam);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data!;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return lastPage.offset;
      }
      return undefined;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useLikeProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetId: string) => {
      const result = await discoveryService.likeProfile(targetId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (_, targetId) => {
      // Remove the profile from the feed
      removeProfileFromCache(queryClient, targetId);
    },
  });
}

export function useCommentOnProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetId,
      comment,
      contentType,
      contentId,
    }: {
      targetId: string;
      comment: string;
      contentType: 'photo' | 'prompt';
      contentId: string;
    }) => {
      const result = await discoveryService.commentOnProfile(
        targetId,
        comment,
        contentType,
        contentId
      );
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (_, { targetId }) => {
      removeProfileFromCache(queryClient, targetId);
    },
  });
}

export function usePassProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetId: string) => {
      const result = await discoveryService.passProfile(targetId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (_, targetId) => {
      removeProfileFromCache(queryClient, targetId);
    },
  });
}

function removeProfileFromCache(queryClient: ReturnType<typeof useQueryClient>, profileId: string) {
  queryClient.setQueryData(['discovery-feed'], (oldData: any) => {
    if (!oldData) return oldData;

    return {
      ...oldData,
      pages: oldData.pages.map((page: any) => ({
        ...page,
        profiles: page.profiles.filter(
          (profile: DiscoveryProfile) => profile.profile_id !== profileId
        ),
      })),
    };
  });
}
