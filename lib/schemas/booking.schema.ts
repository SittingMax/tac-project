import { z } from 'zod';

export const volumeItemSchema = z.object({
  id: z.string().optional(),
  length: z.coerce.number().min(0, 'Length must be positive'),
  width: z.coerce.number().min(0, 'Width must be positive'),
  height: z.coerce.number().min(0, 'Height must be positive'),
  weight: z.coerce.number().min(0, 'Weight must be positive'),
  count: z.coerce.number().min(1, 'Count must be at least 1').int(),
});

export const addressSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zip: z.string().min(4, 'ZIP code is required'),
  gstin: z.string().optional(),
});

export const bookingSchema = z.object({
  consignor: addressSchema,
  consignee: addressSchema,
  volumeMatrix: z.array(volumeItemSchema).min(1, 'At least one item is required'),
  images: z.array(z.string()).optional(),
  whatsappNumber: z.string().min(10, 'Valid WhatsApp number is required'),
});

export type BookingFormData = z.infer<typeof bookingSchema>;
export type VolumeItem = z.infer<typeof volumeItemSchema>;
