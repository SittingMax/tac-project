import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export const GlobeRoutingIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn(
        'w-12 h-12 stroke-primary/80 fill-none drop-shadow-sm drop-shadow-primary/20',
        className
      )}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="50" cy="50" r="40" className="stroke-foreground/40" strokeWidth="0.5" />
      <ellipse cx="50" cy="50" rx="16" ry="40" className="stroke-foreground/20" strokeWidth="0.5" />
      <ellipse cx="50" cy="50" rx="40" ry="16" className="stroke-foreground/20" strokeWidth="0.5" />
      <path d="M10,50 L90,50 M50,10 L50,90" className="stroke-foreground/10" strokeWidth="0.5" />

      <circle cx="20" cy="60" r="1.5" className="fill-primary stroke-none" />
      <circle cx="80" cy="40" r="1.5" className="fill-primary stroke-none" />

      <motion.path
        d="M20,60 Q50,20 80,40"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="stroke-primary"
        strokeWidth="1.25"
        strokeDasharray="4 2"
      />
    </svg>
  );
};

export const CargoShipIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn(
        'w-12 h-12 stroke-primary/80 fill-none drop-shadow-sm drop-shadow-primary/20',
        className
      )}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15,65 L25,50 L85,50 L95,65 Z" className="stroke-foreground/40" />
      <path d="M25,50 L25,45 L85,45 L85,50" className="stroke-foreground/20" />

      {/* Minimal Grid Containers */}
      <rect x="35" y="30" width="12" height="15" className="stroke-foreground/30" />
      <rect x="50" y="30" width="12" height="15" className="stroke-primary/50" />
      <rect x="65" y="35" width="12" height="10" className="stroke-foreground/20" />
      <rect x="50" y="20" width="12" height="10" className="stroke-primary" />

      <motion.path
        d="M10,75 Q25,72 50,75 T90,75"
        initial={{ d: 'M10,75 Q25,72 50,75 T90,75' }}
        animate={{ d: 'M10,75 Q25,78 50,75 T90,75' }}
        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        className="stroke-primary/40"
        strokeWidth="0.5"
      />
    </svg>
  );
};

export const CargoPlaneIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn(
        'w-12 h-12 stroke-primary/80 fill-none drop-shadow-sm drop-shadow-primary/20',
        className
      )}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.path
        d="M10,30 L40,30 M20,20 L35,20 M5,80 L25,80 M15,90 L45,90"
        className="stroke-foreground/10"
        strokeWidth="0.5"
        initial={{ x: 10, opacity: 0 }}
        animate={{ x: -10, opacity: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, repeatType: 'loop', ease: 'linear' }}
      />

      {/* Hyper sharp plane wireframe */}
      <path
        d="M85,50 L65,48 L40,30 L35,30 L45,46 L15,46 L10,38 L5,38 L10,50 L5,62 L10,62 L15,54 L45,54 L35,70 L40,70 L65,52 Z"
        className="stroke-foreground/50"
      />
      <path d="M45,46 L65,48 M45,54 L65,52" className="stroke-foreground/20" strokeWidth="0.5" />
    </svg>
  );
};

export const AutomatedNodeIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn(
        'w-12 h-12 stroke-primary/80 fill-none drop-shadow-sm drop-shadow-primary/20',
        className
      )}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Minimal Hex Grid */}
      <polygon points="50,15 80,32 80,68 50,85 20,68 20,32" className="stroke-foreground/30" />
      <polygon
        points="50,25 70,36 70,64 50,75 30,64 30,36"
        className="stroke-foreground/10"
        strokeWidth="0.5"
      />

      <motion.circle
        cx="50"
        cy="50"
        r="6"
        className="stroke-primary"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Precision Lines */}
      <motion.path
        d="M50,15 L50,44 M80,32 L55,47 M80,68 L55,53 M50,85 L50,56 M20,68 L45,53 M20,32 L45,47"
        className="stroke-primary/50"
        strokeWidth="0.75"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: 'mirror' }}
      />
    </svg>
  );
};

export const CargoTruckIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn(
        'w-12 h-12 stroke-primary/80 fill-none drop-shadow-sm drop-shadow-primary/20',
        className
      )}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Minimal Cabin */}
      <path d="M70,70 L70,45 L82,45 L90,55 L90,70 Z" className="stroke-foreground/50" />
      <path d="M82,45 L82,55 L90,55" className="stroke-foreground/30" strokeWidth="0.5" />

      {/* Ultra-sharp Trailer Box */}
      <rect x="10" y="35" width="55" height="35" className="stroke-foreground/40" />
      <path
        d="M25,35 L25,70 M40,35 L40,70 M55,35 L55,70"
        className="stroke-foreground/10"
        strokeWidth="0.5"
      />

      {/* Wireframe Wheels */}
      <circle cx="25" cy="70" r="5" className="stroke-primary/60" />
      <circle cx="50" cy="70" r="5" className="stroke-primary/60" />
      <circle cx="78" cy="70" r="5" className="stroke-foreground/40" />

      {/* Speed Lines */}
      <motion.path
        d="M10,80 L35,80 M50,80 L80,80"
        className="stroke-primary/30"
        strokeWidth="0.5"
        initial={{ x: 5, opacity: 0 }}
        animate={{ x: -10, opacity: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </svg>
  );
};
