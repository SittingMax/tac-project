import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { cn } from '@/lib/utils';
import {
  CameraOff,
  RefreshCw,
  Volume2,
  VolumeX,
  Flashlight,
  FlashlightOff,
  ZoomIn,
  ZoomOut,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '../ui/slider';

// Extended capabilities that include torch and zoom (non-standard but widely supported)
interface ExtendedCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
  zoom?: { min: number; max: number; step: number };
}

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onError?: (error: Error) => void;
  active?: boolean;
  className?: string;
  enableTorch?: boolean;
}

export function BarcodeScanner({
  onScan,
  onError,
  active = true,
  className,
  enableTorch: initialTorch = false,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  // Stable refs for callbacks to prevent stale closures in decode loop
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const [hasCamera, setHasCamera] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [torchEnabled, setTorchEnabled] = useState(initialTorch);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [capabilities, setCapabilities] = useState<ExtendedCapabilities | null>(null);
  const lastScannedRef = useRef<string | null>(null);
  const lastScannedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');

  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  // Success beep sound (uses ref to stay stable)
  const playBeep = useCallback(() => {
    if (!soundEnabledRef.current) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 1200;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 100);
    } catch (e) {
      console.error('Audio playback failed', e);
    }
  }, []);

  // Stable stopScanning via useCallback — prevents stale closure in cleanup effects
  const stopScanning = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    if (readerRef.current) {
      readerRef.current.reset();
    }
    setIsScanning(false);
  }, []);

  // Initialize scanner
  useEffect(() => {
    if (!active) return;

    // eslint-disable-next-line no-console
    console.debug('[BarcodeScanner] Initializing camera...', { active });
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    // Get available cameras
    reader
      .listVideoInputDevices()
      .then((devices) => {
        // eslint-disable-next-line no-console
        console.debug('[BarcodeScanner] Cameras found:', devices);
        setCameras(devices);
        if (devices.length > 0) {
          // Prefer back camera on mobile
          const backCamera = devices.find(
            (d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('rear') ||
              d.label.toLowerCase().includes('environment')
          );
          setSelectedCamera(backCamera?.deviceId || devices[0].deviceId);
        } else {
          setHasCamera(false);
        }
      })
      .catch((err) => {
        console.error('Camera access error:', err);
        setHasCamera(false);
        onErrorRef.current?.(err);
      });

    return () => {
      stopScanning();
    };
  }, [active, stopScanning]);

  // Start scanning when camera is selected
  useEffect(() => {
    if (!selectedCamera || !videoRef.current || !readerRef.current || !active) return;

    const reader = readerRef.current;

    // Stop previous scan if any
    if (controlsRef.current) {
      controlsRef.current.stop();
    }

    setIsScanning(true);

    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: selectedCamera,
        facingMode: 'environment', // Prefer back camera
        width: { ideal: 1280 },
        height: { ideal: 720 },
        // Advanced constraints for zoom/torch (non-standard but widely supported)
        advanced: [{ zoom: zoomLevel, torch: torchEnabled } as unknown as MediaTrackConstraintSet],
      },
    };

    reader
      .decodeFromConstraints(constraints, videoRef.current, (result, _error) => {
        if (result) {
          const text = result.getText();
          // eslint-disable-next-line no-console
          console.debug('[BarcodeScanner] Decoded text:', text);
          // Debounce: skip if same barcode scanned within 2s
          if (text !== lastScannedRef.current) {
            // eslint-disable-next-line no-console
            console.debug('[BarcodeScanner] Valid new scan (not debounced):', text);
            lastScannedRef.current = text;
            setLastScanned(text);
            // Audio feedback is handled by the business-logic layer
            onScanRef.current(text);
            // Reset debounce after 2s
            if (lastScannedTimerRef.current) clearTimeout(lastScannedTimerRef.current);
            lastScannedTimerRef.current = setTimeout(() => {
              lastScannedRef.current = null;
              setLastScanned(null);
            }, 2000);
          }
        }
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((controls: any) => {
        controlsRef.current = controls;

        // Get capabilities for zoom/torch
        const track =
          videoRef.current?.srcObject instanceof MediaStream
            ? videoRef.current.srcObject.getVideoTracks()[0]
            : null;

        if (track) {
          setCapabilities(track.getCapabilities() as ExtendedCapabilities);
        }
      })
      .catch((err) => {
        console.error('Decode error', err);
        setIsScanning(false);
        onErrorRef.current?.(err);
      });

    return () => {
      stopScanning();
    };
    // Only re-init when camera selection or active state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCamera, active]);

  // Apply track constraints when zoom/torch changes without restarting stream
  useEffect(() => {
    const track =
      videoRef.current?.srcObject instanceof MediaStream
        ? videoRef.current.srcObject.getVideoTracks()[0]
        : null;

    if (track && isScanning) {
      try {
        track
          .applyConstraints({
            advanced: [
              {
                torch: torchEnabled,
                zoom: zoomLevel,
              } as unknown as MediaTrackConstraintSet,
            ],
          })
          .catch((e) => console.warn('Failed to apply constraints', e));
      } catch (e) {
        console.warn('Constraints error', e);
      }
    }
  }, [torchEnabled, zoomLevel, isScanning]);

  const switchCamera = () => {
    const currentIndex = cameras.findIndex((c) => c.deviceId === selectedCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCamera(cameras[nextIndex].deviceId);
  };

  const handleZoomChange = (value: number[]) => {
    setZoomLevel(value[0]);
  };

  const toggleTorch = () => {
    setTorchEnabled(!torchEnabled);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Need a separate reader instance or ensure current is clean
      // We'll use the existing readerRef if available, or create new
      const reader = readerRef.current || new BrowserMultiFormatReader();
      const url = URL.createObjectURL(file);

      // eslint-disable-next-line no-console
      console.debug('[BarcodeScanner] Decoding image file...');
      const result = await reader.decodeFromImageUrl(url);
      URL.revokeObjectURL(url);

      if (result) {
        const text = result.getText();
        // eslint-disable-next-line no-console
        console.debug('[BarcodeScanner] Decoded from image:', text);
        playBeep();
        onScanRef.current(text);
      }
    } catch (err) {
      console.error('[BarcodeScanner] Failed to decode image:', err);
      onErrorRef.current?.(err as Error);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!hasCamera) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-card/50 rounded-none border border-white/10 p-8',
          className
        )}
      >
        <CameraOff className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-center">
          Camera not available.
          <br />
          Use manual entry below.
        </p>
      </div>
    );
  }

  const supportsTorch = capabilities?.torch || false;
  const supportsZoom = !!capabilities?.zoom;
  const minZoom = capabilities?.zoom?.min || 1;
  const maxZoom = capabilities?.zoom?.max || 3;

  return (
    <div
      className={cn('relative overflow-hidden rounded-none bg-background dark:bg-black', className)}
    >
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

      {/* Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Corner brackets */}
        <div className="absolute inset-8 border-2 border-primary/30 rounded-none">
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-none" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-none" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-none" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-none" />
        </div>

        {/* Scanning line animation */}
        {isScanning && (
          <div className="absolute left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-status-error to-transparent shadow-[0_0_10px_var(--color-status-error)] animate-scan" />
        )}

        {/* Status indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span
            className={cn(
              'w-3 h-3 rounded-none',
              isScanning ? 'bg-status-success animate-pulse' : 'bg-status-warning'
            )}
          />
          <span className="text-xs font-medium text-foreground bg-background/60 backdrop-blur-sm px-2 py-1 rounded-none">
            {isScanning ? 'Scanning...' : 'Initializing...'}
          </span>
        </div>

        {/* Last scan indicator */}
        {lastScanned && (
          <div className="absolute bottom-4 left-4 right-4 bg-status-success/90 text-primary-foreground px-4 py-2 rounded-none text-center font-mono text-sm animate-pulse">
            ✓ {lastScanned}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 inset-x-0 flex flex-col items-center gap-4 pointer-events-auto px-4">
        {/* Zoom Slider */}
        {supportsZoom && (
          <div className="w-full max-w-xs flex items-center gap-2 bg-background/40 backdrop-blur rounded-none px-3 py-1">
            <ZoomOut className="w-4 h-4 text-foreground" />
            <Slider
              value={[zoomLevel]}
              min={minZoom}
              max={maxZoom}
              step={0.1}
              onValueChange={handleZoomChange}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-foreground" />
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* File Upload for Image Scan */}
          <Button
            size="icon"
            variant="secondary"
            className="rounded-none bg-muted/30 hover:bg-muted/50 text-foreground backdrop-blur-md"
            onClick={() => fileInputRef.current?.click()}
            title="Scan Image"
          >
            <Upload className="w-5 h-5" />
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
          />

          {cameras.length > 1 && (
            <Button
              size="icon"
              variant="secondary"
              className="rounded-none bg-muted/30 hover:bg-muted/50 text-foreground backdrop-blur-md"
              onClick={switchCamera}
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          )}

          {supportsTorch && (
            <Button
              size="icon"
              variant={torchEnabled ? 'default' : 'secondary'}
              className={`rounded-none backdrop-blur-md ${torchEnabled ? 'bg-status-warning text-primary-foreground hover:bg-status-warning/80' : 'bg-muted/30 text-foreground hover:bg-muted/50'}`}
              onClick={toggleTorch}
            >
              {torchEnabled ? (
                <Flashlight className="w-5 h-5" />
              ) : (
                <FlashlightOff className="w-5 h-5" />
              )}
            </Button>
          )}

          <Button
            size="icon"
            variant="secondary"
            className="rounded-none bg-muted/30 hover:bg-muted/50 text-foreground backdrop-blur-md"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
