import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

interface UserPreferences {
  profile_id: string;
  min_age: number;
  max_age: number;
  max_distance_km: number;
  show_me: string[];
}

export function usePreferences() {
  return useQuery({
    queryKey: ['preferences'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as UserPreferences;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Omit<UserPreferences, 'profile_id'>>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('user_preferences')
        .update(data)
        .eq('profile_id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['preferences'] });
      const previousPrefs = queryClient.getQueryData<UserPreferences>(['preferences']);

      if (previousPrefs) {
        queryClient.setQueryData(['preferences'], {
          ...previousPrefs,
          ...newData,
        });
      }

      return { previousPrefs };
    },
    onError: (err, newData, context) => {
      if (context?.previousPrefs) {
        queryClient.setQueryData(['preferences'], context.previousPrefs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      // Also invalidate discovery feed since preferences affect it
      queryClient.invalidateQueries({ queryKey: ['discovery-feed'] });
    },
  });
}
