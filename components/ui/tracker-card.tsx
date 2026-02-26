import React from 'react';
import { motion } from '@/lib/motion';
import { CheckCircle2, QrCode, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeAwareQRCode } from '@/components/ui/qr-code';

// Props interface for type safety and reusability
export interface PackageTrackerCardProps {
  status: string;
  packageNumber: string;
  destination: string;
  destinationFlag: React.ReactNode;
  date: string;
  qrCodeValue?: string;
  packageImage?: React.ReactNode;
  onTrackClick?: () => void;
  className?: string;
}

// A simple container for the package image with an animated background
const PackageImageContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-muted/20 relative flex h-48 w-full items-center justify-center overflow-hidden">
    {/* Animated background to simulate a conveyor belt */}
    <div
      className={cn(
        'absolute inset-0 z-0 h-full w-full',
        'bg-muted/30',
        'bg-[size:80px_80px]',
        'bg-gradient-to-r from-transparent via-[hsl(var(--muted)/0.3)] to-transparent'
        // "animate-conveyor-belt" // Removed custom animation for simplicity, using framer motion instead
      )}
      style={{
        backgroundImage: `
          repeating-linear-gradient(45deg, transparent, transparent 25px, rgba(128,128,128,0.1) 25px, rgba(128,128,128,0.1) 50px),
          repeating-linear-gradient(-45deg, transparent, transparent 25px, rgba(128,128,128,0.1) 25px, rgba(128,128,128,0.1) 50px)
        `,
      }}
    />
    {/* Moving conveyor effect */}
    <motion.div
      className="absolute inset-0 opacity-20"
      initial={{ backgroundPosition: '0px 0px' }}
      animate={{ backgroundPosition: '100px 0px' }}
      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
      style={{
        backgroundImage: 'linear-gradient(90deg, transparent 50%, #000 50%)',
        backgroundSize: '20px 2px',
        top: '80%',
      }}
    />
    <div className="relative z-10">{children}</div>
  </div>
);

export const PackageTrackerCard = ({
  status,
  packageNumber,
  destination,
  destinationFlag,
  date,
  qrCodeValue,
  packageImage,
  onTrackClick,
  className,
}: PackageTrackerCardProps) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
        staggerChildren: 0.1,
      } as const,
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'bg-card text-card-foreground w-full max-w-sm overflow-hidden rounded-none border shadow-lg relative',
        className
      )}
    >
      {/* Top Section */}
      <div className="p-4 relative z-20">
        <motion.button
          variants={itemVariants}
          onClick={onTrackClick}
          className="bg-muted/50 text-muted-foreground hover:bg-muted flex w-full items-center justify-center gap-2 rounded-none px-4 py-2 text-sm transition-colors"
        >
          <CheckCircle2 className="h-4 w-4 text-status-success" />
          Show full tracking
        </motion.button>
      </div>

      {/* Image Section */}
      <motion.div variants={itemVariants}>
        <PackageImageContainer>
          {packageImage || (
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Package className="w-20 h-20 text-primary stroke-[1.5]" />
            </motion.div>
          )}
        </PackageImageContainer>
      </motion.div>

      {/* Details Section */}
      <div className="p-6 relative z-20 bg-card/80 backdrop-blur-sm">
        <motion.div variants={itemVariants} className="flex items-center gap-2">
          {destinationFlag}
          <span className="text-muted-foreground text-sm font-medium">{destination}</span>
        </motion.div>

        <motion.h2
          variants={itemVariants}
          className="mt-2 text-3xl font-bold tracking-tight text-foreground"
        >
          {status}
        </motion.h2>

        <div className="mt-6 flex items-end justify-between">
          <motion.div variants={itemVariants} className="space-y-1">
            <p className="text-muted-foreground text-xs">Package Number:</p>
            <p className="font-mono text-sm font-bold text-primary">{packageNumber}</p>
            <p className="text-muted-foreground text-xs">{date}</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="border-border/50 bg-background rounded-none border p-1"
          >
            {qrCodeValue ? (
              <ThemeAwareQRCode value={qrCodeValue} size={64} />
            ) : (
              <div className="bg-muted flex h-16 w-16 items-center justify-center">
                <QrCode className="text-muted-foreground h-8 w-8" />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
