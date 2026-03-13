/**
 * DeliveryConfirmation Component
 * Proof of Delivery (POD) capture with signature, photo, and GPS
 * Used for final delivery confirmation
 */

import { useState, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { DialogFooter } from '@/components/ui/dialog';
import { SizedDialog } from '@/components/ui-core/dialog/sized-dialog';
import {
  CheckCircle,
  Camera,
  MapPin,
  PenTool,
  User,
  FileText,
  RefreshCw,
  Trash2,
  Loader2,
  Check,
  Navigation,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Types
export interface DeliveryConfirmationProps {
  shipmentId: string;
  cnNumber: string;
  consigneeName?: string;
  consigneePhone?: string;
  onConfirm?: (data: DeliveryData) => void;
  className?: string;
}

export interface DeliveryData {
  recipient_name: string;
  recipient_phone?: string;
  recipient_id_type?: string;
  recipient_id_number?: string;
  delivery_notes?: string;
  signature_url?: string;
  photo_url?: string;
  latitude?: number;
  longitude?: number;
  delivered_at: string;
}

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onClear: () => void;
  className?: string;
}

// Signature Pad Component
function SignaturePad({ onSave, onClear, className }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    lastPosRef.current = getCoordinates(e);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCoordinates(e);

    ctx.strokeStyle = 'hsl(var(--foreground))';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    if (lastPosRef.current) {
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(pos.x, pos.y);
    }
    ctx.stroke();

    lastPosRef.current = pos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onClear();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <Label className="flex items-center gap-2">
        <PenTool className="size-4" />
        Recipient Signature
      </Label>
      <div className="relative border-2 border-dashed border-border rounded-lg overflow-hidden bg-muted/20">
        <canvas
          ref={canvasRef}
          width={300}
          height={150}
          className="w-full h-[150px] touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-muted-foreground">Sign here</p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={!hasSignature}
          className="gap-2"
        >
          <Trash2 className="size-4" />
          Clear
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!hasSignature} className="gap-2">
          <Check className="size-4" />
          Confirm Signature
        </Button>
      </div>
    </div>
  );
}

// Photo Capture Component
function PhotoCapture({
  onCapture,
  className,
}: {
  onCapture: (file: File) => void;
  className?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      onCapture(file);
    };
    reader.readAsDataURL(file);
  };

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleRetake = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <Label className="flex items-center gap-2">
        <Camera className="size-4" />
        Delivery Photo (Optional)
      </Label>

      {preview ? (
        <div className="relative rounded-lg overflow-hidden border border-border">
          <img src={preview} alt="Delivery proof" className="w-full h-48 object-cover" />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRetake}
            className="absolute bottom-2 right-2 gap-2"
          >
            <RefreshCw className="size-4" />
            Retake
          </Button>
        </div>
      ) : (
        <div
          onClick={handleCapture}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
        >
          <Camera className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Tap to capture delivery photo</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

export function DeliveryConfirmation({
  shipmentId,
  cnNumber,
  consigneeName,
  consigneePhone,
  onConfirm,
  className,
}: DeliveryConfirmationProps) {
  const queryClient = useQueryClient();

  // Form state
  const [recipientName, setRecipientName] = useState(consigneeName || '');
  const [recipientPhone, setRecipientPhone] = useState(consigneePhone || '');
  const [recipientIdType, setRecipientIdType] = useState('');
  const [recipientIdNumber, setRecipientIdNumber] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        toast.success('Location captured');
        setGettingLocation(false);
      },
      (error) => {
        toast.error(`Location error: ${error.message}`);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Confirm delivery mutation
  const confirmMutation = useMutation({
    mutationFn: async () => {
      // Upload signature if exists
      let signaturePath: string | null = null;
      if (signatureUrl) {
        const signatureBlob = await fetch(signatureUrl).then((r) => r.blob());
        const signatureFileName = `signatures/${shipmentId}-${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
          .from('delivery-proofs')
          .upload(signatureFileName, signatureBlob);

        if (uploadError) throw uploadError;
        signaturePath = signatureFileName;
      }

      // Upload photo if exists
      let photoPath: string | null = null;
      if (photoFile) {
        const photoFileName = `photos/${shipmentId}-${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('delivery-proofs')
          .upload(photoFileName, photoFile);

        if (uploadError) throw uploadError;
        photoPath = photoFileName;
      }

      // Update shipment status
      const { error: updateError } = await supabase
        .from('shipments')
        .update({
          status: 'DELIVERED',
          delivered_at: new Date().toISOString(),
          delivery_details: {
            recipient_name: recipientName,
            recipient_phone: recipientPhone,
            recipient_id_type: recipientIdType || null,
            recipient_id_number: recipientIdNumber || null,
            delivery_notes: deliveryNotes || null,
            signature_url: signaturePath,
            photo_url: photoPath,
            latitude: location?.lat,
            longitude: location?.lng,
          },
        })
        .eq('id', shipmentId);

      if (updateError) throw updateError;

      // Create tracking event
      await supabase.from('tracking_events').insert({
        org_id: '00000000-0000-0000-0000-000000000001',
        shipment_id: shipmentId,
        cn_number: cnNumber,
        event_code: 'DELIVERED',
        event_time: new Date().toISOString(),
        source: 'DELIVERY_APP',
        location: location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : null,
      });

      return {
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        delivered_at: new Date().toISOString(),
      };
    },
    onSuccess: (data) => {
      toast.success('Delivery confirmed successfully');
      queryClient.invalidateQueries({ queryKey: ['shipment', shipmentId] });
      onConfirm?.({
        recipient_name: data.recipient_name,
        recipient_phone: data.recipient_phone,
        delivered_at: data.delivered_at,
      });
      setShowConfirmDialog(false);
    },
    onError: (error) => {
      toast.error(`Failed to confirm delivery: ${error.message}`);
    },
  });

  // Validate form
  const isValid = recipientName.trim().length >= 2 && signatureUrl !== null;

  // Handle signature save
  const handleSignatureSave = (dataUrl: string) => {
    setSignatureUrl(dataUrl);
    toast.success('Signature captured');
  };

  // Handle signature clear
  const handleSignatureClear = () => {
    setSignatureUrl(null);
  };

  // Handle photo capture
  const handlePhotoCapture = (file: File) => {
    setPhotoFile(file);
  };

  return (
    <Card className={cn('max-w-lg mx-auto', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="size-5 text-status-success" />
          Confirm Delivery
        </CardTitle>
        <CardDescription>
          Complete delivery for <span className="font-mono font-semibold">{cnNumber}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recipient Details */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <User className="size-4" />
            Recipient Details
          </h4>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipient-name">Recipient Name *</Label>
              <Input
                id="recipient-name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Full name of person receiving"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient-phone">Phone Number</Label>
              <Input
                id="recipient-phone"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="Contact number"
                type="tel"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id-type">ID Type</Label>
                <Input
                  id="id-type"
                  value={recipientIdType}
                  onChange={(e) => setRecipientIdType(e.target.value)}
                  placeholder="Aadhaar, PAN, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="id-number">ID Number</Label>
                <Input
                  id="id-number"
                  value={recipientIdNumber}
                  onChange={(e) => setRecipientIdNumber(e.target.value)}
                  placeholder="Last 4 digits"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Location */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Navigation className="size-4" />
              GPS Location
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className="gap-2"
            >
              {gettingLocation ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MapPin className="size-4" />
              )}
              {location ? 'Update Location' : 'Get Location'}
            </Button>
          </div>

          {location && (
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p className="font-mono">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Signature */}
        <SignaturePad onSave={handleSignatureSave} onClear={handleSignatureClear} />

        {signatureUrl && (
          <div className="flex items-center gap-2 text-sm text-status-success">
            <Check className="size-4" />
            Signature captured
          </div>
        )}

        <Separator />

        {/* Photo */}
        <PhotoCapture onCapture={handlePhotoCapture} />

        {photoFile && (
          <div className="flex items-center gap-2 text-sm text-status-success">
            <Check className="size-4" />
            Photo captured
          </div>
        )}

        <Separator />

        {/* Delivery Notes */}
        <div className="space-y-2">
          <Label htmlFor="delivery-notes" className="flex items-center gap-2">
            <FileText className="size-4" />
            Delivery Notes
          </Label>
          <Textarea
            id="delivery-notes"
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            placeholder="Any additional notes about the delivery..."
            rows={3}
          />
        </div>

        {/* Confirm Button */}
        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={!isValid}
          className="w-full"
          size="lg"
        >
          <CheckCircle className="size-5 mr-2" />
          Confirm Delivery
        </Button>

        {!isValid && (
          <p className="text-xs text-muted-foreground text-center">
            Recipient name and signature are required
          </p>
        )}

        {/* Confirmation Dialog */}
        <SizedDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          title="Confirm Delivery"
          size="sm"
        >
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Recipient</p>
              <p className="font-semibold">{recipientName}</p>
            </div>
            {recipientPhone && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-mono">{recipientPhone}</p>
              </div>
            )}
            {location && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-mono text-sm">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Time</p>
              <p className="font-semibold">{format(new Date(), 'PPpp')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => confirmMutation.mutate()} disabled={confirmMutation.isPending}>
              {confirmMutation.isPending ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="size-4 mr-2" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </SizedDialog>
      </CardContent>
    </Card>
  );
}

export default DeliveryConfirmation;
