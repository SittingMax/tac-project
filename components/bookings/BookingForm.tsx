import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingSchema, type BookingFormData } from '@/lib/schemas/booking.schema';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from '@/components/ui/form';
import { FormSection, FormGrid, FormFooter, FieldGroup } from '@/components/ui-core';
import { Trash2, Plus, Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { bookingService } from '@/lib/services/bookingService';

interface BookingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isMobile?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

export const BookingForm: React.FC<BookingFormProps> = ({ onSuccess, onCancel, isMobile }) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { user } = useAuthStore();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      volumeMatrix: [{ length: 0, width: 0, height: 0, weight: 0, count: 1 }],
      consignor: {
        name: '',
        phone: '',
        address: '',
        city: 'Imphal',
        state: 'Manipur',
        zip: '795001',
      },
      consignee: { name: '', phone: '', address: '', city: 'Delhi', state: 'Delhi', zip: '110037' },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'volumeMatrix',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);

      if (selectedFiles.length + newFiles.length > MAX_FILES) {
        toast.error(`You can only upload up to ${MAX_FILES} images.`);
        return;
      }

      const validFiles = newFiles.filter((file) => {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`File ${file.name} is too large (max 5MB).`);
          return false;
        }
        if (!file.type.startsWith('image/')) {
          toast.error(`File ${file.name} is not an image.`);
          return false;
        }
        return true;
      });

      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: BookingFormData) => {
    try {
      setUploading(true);
      const imageUrls: string[] = [];

      // Upload images
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `public-bookings/${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('shipment-docs')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            toast.error(`Failed to upload ${file.name}`);
            continue;
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from('shipment-docs').getPublicUrl(filePath);

          imageUrls.push(publicUrl);
        }
      }

      // Create booking via centralized service
      await bookingService.createBooking(data, imageUrls, user?.id);

      toast.success('Booking request sent successfully!');

      // Create a system message for the admin
      try {
        const messageText =
          `New Booking Request from ${data.consignor.name}\n` +
          `Route: ${data.consignor.city} -> ${data.consignee.city}\n` +
          `Items: ${data.volumeMatrix.reduce((acc, curr) => acc + Number(curr.count), 0)}\n` +
          `Total Weight: ${data.volumeMatrix.reduce((acc, curr) => acc + Number(curr.weight) * Number(curr.count), 0)} kg\n` +
          `WhatsApp: ${data.whatsappNumber}`;

        await supabase.from('contact_messages').insert({
          org_id: user?.orgId ?? null,
          name: data.consignor.name,
          phone: data.whatsappNumber,
          // Use user email if available, otherwise explicit string or null
          email: user?.email || null,
          message: messageText,
          status: 'unread',
          archived: false,
          replied: false,
        });
      } catch (msgError) {
        console.error('Failed to create system message for booking:', msgError);
        // Don't block the success flow if this fails
      }

      form.reset();
      setSelectedFiles([]);
      onSuccess?.();
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <FormSection
          title="Contact Information"
          description="We will contact you on this number for shipment updates."
        >
          <FormGrid columns={1}>
            <div className="max-w-md">
              <FormField
                control={form.control}
                name="whatsappNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FieldGroup label="WhatsApp Number" required error={form.formState.errors.whatsappNumber?.message}>
                        <Input
                          className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                          placeholder="e.g. +91 9876543210"
                          {...field}
                        />
                      </FieldGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title="Consignor Details">
          <FormGrid columns={2}>
            <FormField
              control={form.control}
              name="consignor.name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FieldGroup label="Name">
                      <Input
                        className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                        placeholder="Consignor Name"
                        {...field}
                      />
                    </FieldGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="consignor.phone"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FieldGroup label="Phone">
                      <Input
                        className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                        placeholder="Consignor Phone"
                        {...field}
                      />
                    </FieldGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="consignor.address"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FieldGroup label="Address">
                        <Input
                          className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                          placeholder="Address Line 1"
                          {...field}
                        />
                      </FieldGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="consignor.city"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FieldGroup label="City">
                        <Input
                          className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                          {...field}
                        />
                      </FieldGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="consignor.state"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FieldGroup label="State">
                        <Input
                          className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                          {...field}
                        />
                      </FieldGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="consignor.zip"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FieldGroup label="Zip">
                        <Input
                          className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                          {...field}
                        />
                      </FieldGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title="Consignee Details">
          <FormGrid columns={2}>
            <FormField
              control={form.control}
              name="consignee.name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FieldGroup label="Name">
                      <Input
                        className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                        placeholder="Consignee Name"
                        {...field}
                      />
                    </FieldGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="consignee.phone"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FieldGroup label="Phone">
                      <Input
                        className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                        placeholder="Consignee Phone"
                        {...field}
                      />
                    </FieldGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="consignee.address"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FieldGroup label="Address">
                        <Input
                          className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                          placeholder="Address Line 1"
                          {...field}
                        />
                      </FieldGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="consignee.city"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FieldGroup label="City">
                        <Input
                          className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                          {...field}
                        />
                      </FieldGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="consignee.state"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FieldGroup label="State">
                        <Input
                          className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                          {...field}
                        />
                      </FieldGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="consignee.zip"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FieldGroup label="Zip">
                        <Input
                          className="h-8 bg-transparent hover:border-ring/50 transition-colors px-3 text-sm"
                          {...field}
                        />
                      </FieldGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </FormGrid>
        </FormSection>

        {/* Volume Matrix */}
        <FormSection
          title="Volume Matrix"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ length: 0, width: 0, height: 0, weight: 0, count: 1 })}
            >
              <Plus size={16} strokeWidth={1.5} className="mr-2" /> Add Item
            </Button>
          }
        >
          <div className="flex flex-col gap-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-6 gap-3 items-end">
                <div className="flex flex-col gap-1">
                  <FormField
                    control={form.control}
                    name={`volumeMatrix.${index}.length`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FieldGroup label="Len(cm)">
                            <Input
                              className="h-8 bg-transparent hover:border-ring/50 transition-colors px-2 text-xs"
                              type="number"
                              {...field}
                            />
                          </FieldGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <FormField
                    control={form.control}
                    name={`volumeMatrix.${index}.width`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FieldGroup label="Wid(cm)">
                            <Input
                              className="h-8 bg-transparent hover:border-ring/50 transition-colors px-2 text-xs"
                              type="number"
                              {...field}
                            />
                          </FieldGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <FormField
                    control={form.control}
                    name={`volumeMatrix.${index}.height`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FieldGroup label="Hgt(cm)">
                            <Input
                              className="h-8 bg-transparent hover:border-ring/50 transition-colors px-2 text-xs"
                              type="number"
                              {...field}
                            />
                          </FieldGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <FormField
                    control={form.control}
                    name={`volumeMatrix.${index}.weight`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FieldGroup label="Wgt(kg)">
                            <Input
                              className="h-8 bg-transparent hover:border-ring/50 transition-colors px-2 text-xs"
                              type="number"
                              {...field}
                            />
                          </FieldGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <FormField
                    control={form.control}
                    name={`volumeMatrix.${index}.count`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FieldGroup label="Count">
                            <Input
                              className="h-8 bg-transparent hover:border-ring/50 transition-colors px-2 text-xs"
                              type="number"
                              {...field}
                            />
                          </FieldGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <Trash2 size={16} strokeWidth={1.5} className="text-destructive" />
                </Button>
              </div>
            ))}
            {form.formState.errors.volumeMatrix && (
              <p className="text-xs text-destructive">
                {form.formState.errors.volumeMatrix.message}
              </p>
            )}
          </div>
        </FormSection>

        {/* Image Upload */}
        <FormSection title="Images" className={isMobile ? 'mb-6' : ''}>
          <div className="flex flex-col gap-4">
            <div className="border-2 border-dashed border-input rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors relative">
              <input
                type="file"
                multiple
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
              />
              <Upload size={32} strokeWidth={1.5} className="text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click or drag images here to upload</p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group border rounded-md p-2">
                    <div className="text-xs truncate w-full mb-1">{file.name}</div>
                    <div className="aspect-square bg-muted rounded-md overflow-hidden relative">
                      {/* codeql[js/xss-through-dom] - Safe object URL from file input */}
                      {/* lgtm[js/xss-through-dom] */}
                      <img
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FormSection>

        <div className={isMobile ? 'sticky bottom-0 -mx-4 -mb-4 mt-6 p-4 bg-background z-10' : ''}>
          <FormFooter
            onCancel={onCancel}
            submitLabel="Book Shipment"
            isLoading={form.formState.isSubmitting || uploading}
          />
        </div>
      </form>
    </Form>
  );
};
