import { supabase } from '@/lib/supabase';
import type { BookingFormData } from '@/lib/schemas/booking.schema';

export const bookingService = {
  /**
   * Create a new booking request.
   * Handles both authenticated (admin) and public submissions.
   * Column mapping matches the `bookings` table schema:
   *   user_id (uuid), images (text[]), consignor_details, consignee_details,
   *   whatsapp_number, volume_matrix, status
   */
  async createBooking(data: BookingFormData, imageUrls: string[] = [], userId?: string) {
    const { data: result, error } = await supabase
      .from('bookings')
      .insert({
        consignor_details: data.consignor,
        consignee_details: data.consignee,
        whatsapp_number: data.whatsappNumber,
        volume_matrix: data.volumeMatrix,
        status: 'PENDING',
        ...(userId && { user_id: userId }),
        ...(imageUrls.length > 0 && { images: imageUrls }),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return result;
  },
};
