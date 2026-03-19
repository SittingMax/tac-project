import { describe, expect, it } from 'vitest';
import { BookingForm as canonicalBookingForm } from '@/components/bookings/BookingForm';
import { BookingForm as portalBookingForm } from '@/components/portal/BookingForm';

describe('components/portal/BookingForm compatibility', () => {
  it('re-exports the canonical booking form', () => {
    expect(portalBookingForm).toBe(canonicalBookingForm);
  });
});
