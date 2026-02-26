import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface HubOption {
  id: string;
  code: string;
  name: string;
}

const ALLOWED_HUB_CODES = ['IMF', 'DEL'];

export function useHubs() {
  return useQuery({
    queryKey: ['hubs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hubs')
        .select('id, code, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const allHubs = (data ?? []) as HubOption[];

      // Filter to only allow specific hubs
      return allHubs.filter((hub) => ALLOWED_HUB_CODES.includes(hub.code));
    },
  });
}
