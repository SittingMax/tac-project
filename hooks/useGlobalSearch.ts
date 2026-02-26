import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { SearchResult } from '@/types/search';
import { useAuthStore } from '@/store/authStore';

export const useGlobalSearch = (query: string) => {
  const { user } = useAuthStore();
  const orgId = user?.orgId;

  return useQuery({
    queryKey: ['globalSearch', query, orgId],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!query || query.length < 2) return [];
      if (!orgId) throw new Error('Organization ID requires for search');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('search_global', {
        p_query: query,
        p_org_id: orgId,
        p_limit: 50,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!query && query.length >= 2 && !!orgId,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
};
