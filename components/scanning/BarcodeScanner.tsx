import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, BrowserCodeReader } from '@zxing/browser';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
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

interface ScannerControls {
  stop: () => void;
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
  const controlsRef = useRef<ScannerControls | null>(null);

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
      const AudioContextClass =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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
      logger.error('BarcodeScanner', 'Audio playback failed', { error: e });
    }
  }, []);

  // Stable stopScanning via useCallback — prevents stale closure in cleanup effects
  const stopScanning = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Initialize scanner
  useEffect(() => {
    if (!active) return;

    // Get available cameras via static method (@zxing/browser API)
    BrowserCodeReader.listVideoInputDevices()
      .then((devices) => {
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
        logger.error('BarcodeScanner', 'Camera access error', { error: err });
        setHasCamera(false);
        onErrorRef.current?.(err);
      });

    return () => {
      stopScanning();
    };
  }, [active, stopScanning]);

  // Start scanning when camera is selected
  useEffect(() => {
    if (!selectedCamera || !videoRef.current || !active) return;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    // Stop previous scan if any
    if (controlsRef.current) {
      controlsRef.current.stop();
    }

    setIsScanning(true);

    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: selectedCamera,
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
        advanced: [{ zoom: zoomLevel, torch: torchEnabled } as unknown as MediaTrackConstraintSet],
      },
    };

    reader
      .decodeFromConstraints(constraints, videoRef.current!, (result, _error) => {
        if (result) {
          const text = result.getText();
          if (text !== lastScannedRef.current) {
            lastScannedRef.current = text;
            setLastScanned(text);
            onScanRef.current(text);
            if (lastScannedTimerRef.current) clearTimeout(lastScannedTimerRef.current);
            lastScannedTimerRef.current = setTimeout(() => {
              lastScannedRef.current = null;
              setLastScanned(null);
            }, 2000);
          }
        }
      })
      .then((controls) => {
        controlsRef.current = controls;

        const track =
          videoRef.current?.srcObject instanceof MediaStream
            ? videoRef.current.srcObject.getVideoTracks()[0]
            : null;

        if (track) {
          setCapabilities(track.getCapabilities() as ExtendedCapabilities);
        }
      })
      .catch((err) => {
        logger.error('BarcodeScanner', 'Decode error', { error: err });
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
          .catch((e) => logger.warn('BarcodeScanner', 'Failed to apply constraints', { error: e }));
      } catch (e) {
        logger.warn('BarcodeScanner', 'Constraints error', { error: e });
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
      const reader = new BrowserMultiFormatReader();
      const url = URL.createObjectURL(file);
      const result = await reader.decodeFromImageUrl(url);
      URL.revokeObjectURL(url);

      if (result) {
        const text = result.getText();
        playBeep();
        onScanRef.current(text);
      }
    } catch (err) {
      logger.error('BarcodeScanner', 'Failed to decode image', { error: err });
      onErrorRef.current?.(err as Error);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!hasCamera) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-card/50 rounded-lg border border-white/10 p-8',
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
      className={cn('relative overflow-hidden rounded-lg bg-background dark:bg-black', className)}
    >
      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

      {/* Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Corner brackets */}
        <div className="absolute inset-8 border-2 border-primary/30 rounded-md">
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-md" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-md" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-md" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-md" />
        </div>

        {/* Scanning line animation */}
        {isScanning && (
          <div className="absolute left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-status-error to-transparent shadow-[0_0_10px_var(--color-status-error)] animate-scan" />
        )}

        {/* Status indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span
            className={cn(
              'w-3 h-3 rounded-full',
              isScanning ? 'bg-status-success animate-pulse' : 'bg-status-warning'
            )}
          />
          <span className="text-xs font-medium text-foreground bg-background/60 backdrop-blur-sm px-2 py-1 rounded-md">
            {isScanning ? 'Scanning...' : 'Initializing...'}
          </span>
        </div>

        {/* Last scan indicator */}
        {lastScanned && (
          <div className="absolute bottom-4 left-4 right-4 bg-status-success/90 text-primary-foreground px-4 py-2 rounded-md text-center font-mono text-sm animate-pulse">
            ✓ {lastScanned}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 inset-x-0 flex flex-col items-center gap-4 pointer-events-auto px-4">
        {/* Zoom Slider */}
        {supportsZoom && (
          <div className="w-full max-w-xs flex items-center gap-2 bg-background/40 backdrop-blur rounded-md px-4 py-1">
            <ZoomOut size={16} strokeWidth={1.5} className="text-foreground" />
            <Slider
              value={[zoomLevel]}
              min={minZoom}
              max={maxZoom}
              step={0.1}
              onValueChange={handleZoomChange}
              className="flex-1"
            />
            <ZoomIn size={16} strokeWidth={1.5} className="text-foreground" />
          </div>
        )}

        <div className="flex items-center gap-4">
          {/* File Upload for Image Scan */}
          <Button
            size="icon"
            variant="secondary"
            className="rounded-md bg-muted/30 hover:bg-muted/50 text-foreground backdrop-blur-md"
            onClick={() => fileInputRef.current?.click()}
            title="Scan Image"
          >
            <Upload size={20} strokeWidth={1.5} />
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
              className="rounded-md bg-muted/30 hover:bg-muted/50 text-foreground backdrop-blur-md"
              onClick={switchCamera}
            >
              <RefreshCw size={20} strokeWidth={1.5} />
            </Button>
          )}

          {supportsTorch && (
            <Button
              size="icon"
              variant={torchEnabled ? 'default' : 'secondary'}
              className={`rounded-md backdrop-blur-md ${torchEnabled ? 'bg-status-warning text-primary-foreground hover:bg-status-warning/80' : 'bg-muted/30 text-foreground hover:bg-muted/50'}`}
              onClick={toggleTorch}
            >
              {torchEnabled ? (
                <Flashlight size={20} strokeWidth={1.5} />
              ) : (
                <FlashlightOff size={20} strokeWidth={1.5} />
              )}
            </Button>
          )}

          <Button
            size="icon"
            variant="secondary"
            className="rounded-md bg-muted/30 hover:bg-muted/50 text-foreground backdrop-blur-md"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 size={20} strokeWidth={1.5} /> : <VolumeX size={20} strokeWidth={1.5} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
