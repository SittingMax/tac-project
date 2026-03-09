import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingSchema, type BookingFormData } from '@/lib/schemas/booking.schema';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface BookingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

export const BookingForm: React.FC<BookingFormProps> = ({ onSuccess, onCancel }) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { user } = useAuthStore();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BookingFormData>({
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
    control,
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
            logger.error('BookingForm', 'Upload error', { error: uploadError });
            toast.error(`Failed to upload ${file.name}`);
            continue;
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from('shipment-docs').getPublicUrl(filePath);

          imageUrls.push(publicUrl);
        }
      }

      // Create booking
      const bookingData = {
        user_id: user?.id || null, // Optional user binding
        consignor_details: data.consignor,
        consignee_details: data.consignee,
        volume_matrix: data.volumeMatrix,
        images: imageUrls,
        whatsapp_number: data.whatsappNumber,
        status: 'PENDING',
      };

      const { error } = await supabase.from('bookings').insert(bookingData);

      if (error) throw error;

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
        logger.error('BookingForm', 'Failed to create system message', { error: msgError });
        // Don't block the success flow if this fails
      }

      reset();
      setSelectedFiles([]);
      onSuccess?.();
    } catch (error) {
      logger.error('BookingForm', 'Booking error', { error });
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-12">
      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70 border-b border-border/50 pb-2">
          Contact Information
        </h3>
        <div className="space-y-1">
          <Label className="text-[10px] font-mono uppercase tracking-widest">
            WhatsApp Number <span className="text-destructive">*</span>
          </Label>
          <Input {...register('whatsappNumber')} placeholder="+91 9876543210" className="max-w-md bg-transparent" />
          {errors.whatsappNumber && (
            <p className="text-[10px] text-destructive">{errors.whatsappNumber.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Consignor Details */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70 border-b border-border/50 pb-2">
            Consignor Details
          </h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-mono uppercase tracking-widest">Name</Label>
              <Input {...register('consignor.name')} placeholder="Sender Name" className="bg-transparent" />
              {errors.consignor?.name && (
                <p className="text-[10px] text-destructive">{errors.consignor.name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-mono uppercase tracking-widest">Phone</Label>
              <Input {...register('consignor.phone')} placeholder="Sender Phone" className="bg-transparent" />
              {errors.consignor?.phone && (
                <p className="text-[10px] text-destructive">{errors.consignor.phone.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-mono uppercase tracking-widest">Address</Label>
              <Input {...register('consignor.address')} placeholder="Address Line 1" className="bg-transparent" />
              {errors.consignor?.address && (
                <p className="text-[10px] text-destructive">{errors.consignor.address.message}</p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-mono uppercase tracking-widest">City</Label>
                <Input {...register('consignor.city')} className="bg-transparent" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-mono uppercase tracking-widest">State</Label>
                <Input {...register('consignor.state')} className="bg-transparent" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-mono uppercase tracking-widest">ZIP</Label>
                <Input {...register('consignor.zip')} className="bg-transparent" />
              </div>
            </div>
          </div>
        </div>

        {/* Consignee Details */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70 border-b border-border/50 pb-2">
            Consignee Details
          </h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-mono uppercase tracking-widest">Name</Label>
              <Input {...register('consignee.name')} placeholder="Recipient Name" className="bg-transparent" />
              {errors.consignee?.name && (
                <p className="text-[10px] text-destructive">{errors.consignee.name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-mono uppercase tracking-widest">Phone</Label>
              <Input {...register('consignee.phone')} placeholder="Recipient Phone" className="bg-transparent" />
              {errors.consignee?.phone && (
                <p className="text-[10px] text-destructive">{errors.consignee.phone.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-mono uppercase tracking-widest">Address</Label>
              <Input {...register('consignee.address')} placeholder="Address Line 1" className="bg-transparent" />
              {errors.consignee?.address && (
                <p className="text-[10px] text-destructive">{errors.consignee.address.message}</p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-mono uppercase tracking-widest">City</Label>
                <Input {...register('consignee.city')} className="bg-transparent" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-mono uppercase tracking-widest">State</Label>
                <Input {...register('consignee.state')} className="bg-transparent" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-mono uppercase tracking-widest">ZIP</Label>
                <Input {...register('consignee.zip')} className="bg-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Volume Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
            Volume Matrix
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-[10px] font-mono uppercase tracking-widest bg-transparent"
            onClick={() => append({ length: 0, width: 0, height: 0, weight: 0, count: 1 })}
          >
            <Plus className="w-3 h-3 mr-1.5" /> Add
          </Button>
        </div>
        
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-6 gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-[10px] font-mono uppercase tracking-widest">Len (cm)</Label>
                <Input type="number" {...register(`volumeMatrix.${index}.length`)} className="bg-transparent" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-mono uppercase tracking-widest">Wid (cm)</Label>
                <Input type="number" {...register(`volumeMatrix.${index}.width`)} className="bg-transparent" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-mono uppercase tracking-widest">Hgt (cm)</Label>
                <Input type="number" {...register(`volumeMatrix.${index}.height`)} className="bg-transparent" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-mono uppercase tracking-widest">Wgt (kg)</Label>
                <Input type="number" {...register(`volumeMatrix.${index}.weight`)} className="bg-transparent" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-mono uppercase tracking-widest">Count</Label>
                <Input type="number" {...register(`volumeMatrix.${index}.count`)} className="bg-transparent" />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {errors.volumeMatrix && (
            <p className="text-[10px] text-destructive">{errors.volumeMatrix.message}</p>
          )}
        </div>
      </div>

      {/* Image Upload */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70 border-b border-border/50 pb-2">
          Documentation Images
        </h3>
        
        <div className="flex flex-col gap-4">
          <div className="border border-dashed border-border/60 bg-muted/5 p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/10 transition-colors relative">
            <input
              type="file"
              multiple
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
            <Upload className="w-6 h-6 text-muted-foreground/50 mb-3" />
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/70">Click or Drag Files</p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative group border border-border p-1 bg-muted/10">
                  <div className="text-[10px] font-mono truncate w-full px-1 py-0.5 text-muted-foreground">{file.name}</div>
                  <div className="aspect-square bg-transparent overflow-hidden relative">
                    {/* codeql[js/xss-through-dom] - Safe object URL from file input */}
                    {/* lgtm[js/xss-through-dom] */}
                    <img
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="w-full h-full object-cover mix-blend-luminosity"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-none opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
        <Button type="button" variant="ghost" onClick={onCancel} className="font-mono text-xs uppercase tracking-widest">
          Abort
        </Button>
        <Button type="submit" disabled={isSubmitting || uploading} className="font-mono text-xs uppercase tracking-widest px-8">
          {isSubmitting || uploading ? 'Processing...' : 'Confirm Request'}
        </Button>
      </div>
    </form>
  );
};
