import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Booking } from '@/types';

export const useBookings = (options?: { limit?: number }) => {
  return useQuery({
    queryKey: ['bookings', options?.limit ?? null],
    queryFn: async () => {
      let query = supabase.from('bookings').select('*').order('created_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Booking[];
    },
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      booking: Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'status'>
    ) => {
      const { data, error } = await supabase.from('bookings').insert(booking).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};
