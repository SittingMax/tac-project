import { supabase } from '@/lib/supabase';
import { orgService } from '@/lib/services/orgService';
import type { BookingFormData } from '@/lib/schemas/booking.schema';

export const bookingService = {
  /**
   * Create a new booking request.
   * Handles both authenticated (admin) and public submissions.
   */
  async createBooking(data: BookingFormData, imageUrls: string[] = [], userId?: string) {
    // If not authenticated, orgId might not be available
    let orgId: string | undefined;
    try {
      orgId = orgService.getCurrentOrgId();
    } catch {
      // Allow public booking without org context if the DB policy permits it
    }

    const { data: result, error } = await supabase
      .from('bookings')
      .insert({
        consignor_details: data.consignor,
        consignee_details: data.consignee,
        whatsapp_number: data.whatsappNumber,
        volume_matrix: data.volumeMatrix,
        status: 'PENDING',
        ...(userId && { created_by: userId }),
        ...(orgId && { org_id: orgId }),
        metadata: {
          images: imageUrls,
        },
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return result;
  },
};
