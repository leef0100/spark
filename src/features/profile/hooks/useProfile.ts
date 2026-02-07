import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService, ProfileWithDetails } from '../services/profileService';

export function useMyProfile() {
  return useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const result = await profileService.getMyProfile();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.profile;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Parameters<typeof profileService.updateProfile>[0]) => {
      const result = await profileService.updateProfile(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
  });
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uri, position }: { uri: string; position: number }) => {
      const result = await profileService.uploadPhoto(uri, position);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.photo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photoId: string) => {
      const result = await profileService.deletePhoto(photoId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
  });
}

export function useUpsertPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      promptText,
      answerText,
      position,
    }: {
      promptText: string;
      answerText: string;
      position: number;
    }) => {
      const result = await profileService.upsertPrompt(promptText, answerText, position);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
  });
}

export function useDeletePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (promptId: string) => {
      const result = await profileService.deletePrompt(promptId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
  });
}

export function useToggleProfileActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isActive: boolean) => {
      const result = await profileService.setProfileActive(isActive);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onMutate: async (isActive) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['my-profile'] });
      const previousProfile = queryClient.getQueryData<ProfileWithDetails>(['my-profile']);

      if (previousProfile) {
        queryClient.setQueryData(['my-profile'], {
          ...previousProfile,
          is_active: isActive,
        });
      }

      return { previousProfile };
    },
    onError: (err, isActive, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(['my-profile'], context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
  });
}

export function useBlockedUsers() {
  return useQuery({
    queryKey: ['blocked-users'],
    queryFn: async () => {
      const result = await profileService.getBlockedUsers();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.users;
    },
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await profileService.unblockUser(userId);
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

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const result = await profileService.deleteAccount();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
  });
}
