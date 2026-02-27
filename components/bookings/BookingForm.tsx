import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingSchema, type BookingFormData } from '@/lib/schemas/booking.schema';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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
        console.error('Failed to create system message for booking:', msgError);
        // Don't block the success flow if this fails
      }

      reset();
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-primary">Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <Label>
              WhatsApp Number <span className="text-destructive">*</span>
            </Label>
            <Input {...register('whatsappNumber')} placeholder="e.g. +91 9876543210" />
            {errors.whatsappNumber && (
              <p className="text-xs text-destructive">{errors.whatsappNumber.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              We will contact you on this number for shipment updates.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Consignor Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Consignor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input {...register('consignor.name')} placeholder="Consignor Name" />
              {errors.consignor?.name && (
                <p className="text-xs text-destructive">{errors.consignor.name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input {...register('consignor.phone')} placeholder="Consignor Phone" />
              {errors.consignor?.phone && (
                <p className="text-xs text-destructive">{errors.consignor.phone.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Address</Label>
              <Input {...register('consignor.address')} placeholder="Address Line 1" />
              {errors.consignor?.address && (
                <p className="text-xs text-destructive">{errors.consignor.address.message}</p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>City</Label>
                <Input {...register('consignor.city')} />
              </div>
              <div className="space-y-1">
                <Label>State</Label>
                <Input {...register('consignor.state')} />
              </div>
              <div className="space-y-1">
                <Label>ZIP</Label>
                <Input {...register('consignor.zip')} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consignee Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Consignee</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input {...register('consignee.name')} placeholder="Consignee Name" />
              {errors.consignee?.name && (
                <p className="text-xs text-destructive">{errors.consignee.name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input {...register('consignee.phone')} placeholder="Consignee Phone" />
              {errors.consignee?.phone && (
                <p className="text-xs text-destructive">{errors.consignee.phone.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Address</Label>
              <Input {...register('consignee.address')} placeholder="Address Line 1" />
              {errors.consignee?.address && (
                <p className="text-xs text-destructive">{errors.consignee.address.message}</p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>City</Label>
                <Input {...register('consignee.city')} />
              </div>
              <div className="space-y-1">
                <Label>State</Label>
                <Input {...register('consignee.state')} />
              </div>
              <div className="space-y-1">
                <Label>ZIP</Label>
                <Input {...register('consignee.zip')} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Volume Matrix */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Volume Matrix</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ length: 0, width: 0, height: 0, weight: 0, count: 1 })}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-6 gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Len (cm)</Label>
                <Input type="number" {...register(`volumeMatrix.${index}.length`)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Wid (cm)</Label>
                <Input type="number" {...register(`volumeMatrix.${index}.width`)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hgt (cm)</Label>
                <Input type="number" {...register(`volumeMatrix.${index}.height`)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Wgt (kg)</Label>
                <Input type="number" {...register(`volumeMatrix.${index}.weight`)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Count</Label>
                <Input type="number" {...register(`volumeMatrix.${index}.count`)} />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
          {errors.volumeMatrix && (
            <p className="text-xs text-destructive">{errors.volumeMatrix.message}</p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Image Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="border-2 border-dashed border-input rounded-none p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors relative">
              <input
                type="file"
                multiple
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
              />
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click or drag images here to upload</p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group border rounded-none p-2">
                    <div className="text-xs truncate w-full mb-1">{file.name}</div>
                    <div className="aspect-square bg-muted rounded-none overflow-hidden relative">
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
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-none opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || uploading}>
          {isSubmitting || uploading ? 'Submitting...' : 'Book Shipment'}
        </Button>
      </div>
    </form>
  );
};
