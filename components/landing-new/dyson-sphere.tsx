'use client';

import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';

export function DysonSphere({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const ringsGroupRef = useRef<HTMLDivElement>(null);
  const satelliteGroupRef = useRef<HTMLDivElement>(null);
  const kineticRingsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Core Breathing (Sine wave for organic feel)
      if (coreRef.current) {
        gsap.to(coreRef.current, {
          scale: 1.1,
          opacity: 0.6,
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }

      // 2. Main Group Rotation (The "World" spinning)
      if (ringsGroupRef.current) {
        gsap.to(ringsGroupRef.current, {
          rotationY: 360,
          duration: 120, // Very slow, steady rotation
          repeat: -1,
          ease: 'none',
        });
      }

      // 3. Chaotic Ring Movement (Independent axes)
      kineticRingsRef.current.forEach((ring, i) => {
        if (ring) {
          gsap.to(ring, {
            rotationX: `+=${360}`,
            rotationY: `+=${i % 2 === 0 ? 360 : -360}`,
            rotationZ: `+=${180}`,
            duration: 20 + i * 5, // Varying durations
            repeat: -1,
            ease: 'linear', // Continuous flow
            transformOrigin: '50% 50%',
          });
        }
      });

      // 4. Satellite Orbit (Elliptical Motion)
      if (satelliteGroupRef.current) {
        gsap.to(satelliteGroupRef.current, {
          rotationZ: -360,
          rotationX: 360,
          duration: 40,
          repeat: -1,
          ease: 'none',
        });
      }
    }, containerRef);

    // 5. Interactive Parallax (Mouse Tilt)
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      gsap.to(containerRef.current, {
        rotationY: x * 15,
        rotationX: -y * 15,
        duration: 1,
        ease: 'power2.out',
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      ctx.revert();
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex items-center justify-center perspective-dramatic transform-style-3d',
        className
      )}
    >
      {/* Bright Core */}
      <div
        ref={coreRef}
        className="absolute w-[30%] h-[30%] bg-primary/30 rounded-none blur-[40px] z-0"
      />

      {/* Rotating Structure Container */}
      <div ref={ringsGroupRef} className="relative w-full h-full transform-style-3d">
        {/* --- GEODESIC RINGS (Static Base Structure) --- */}
        {/* Longitude Lines (Vertical) */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`long-${i}`}
            className="absolute inset-0 rounded-none border-[1px] border-foreground/10"
            style={{ transform: `rotateY(${i * 30}deg)` }}
          />
        ))}
        {/* Latitude Lines (Horizontal) */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[100%] rounded-none border-[1px] border-primary/20 transform-gpu rotate-x-90" />{' '}
        {/* Equator */}
        {[...Array(3)].map((_, i) => (
          <div
            key={`lat-north-${i}`}
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-none border-[1px] border-foreground/5"
            style={{
              height: `${85 - i * 25}%`,
              transform: `rotateX(90deg) translateZ(${15 + i * 20}px)`,
            }}
          />
        ))}
        {[...Array(3)].map((_, i) => (
          <div
            key={`lat-south-${i}`}
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-none border-[1px] border-foreground/5"
            style={{
              height: `${85 - i * 25}%`,
              transform: `rotateX(90deg) translateZ(-${15 + i * 20}px)`,
            }}
          />
        ))}
        {/* --- KINETIC RINGS (Moving Independently) --- */}
        {/* These rings spin on their own axes to create constant activity */}
        {[...Array(3)].map((_, i) => (
          <div
            key={`kinetic-${i}`}
            ref={(el) => {
              if (el) kineticRingsRef.current[i] = el;
            }}
            className="kinetic-ring absolute inset-0 rounded-none border-[1px] border-foreground/15 border-dashed"
            style={{
              width: `${90 + i * 5}%`,
              height: `${90 + i * 5}%`,
              left: `${(100 - (90 + i * 5)) / 2}%`,
              top: `${(100 - (90 + i * 5)) / 2}%`,
            }}
          />
        ))}
        {/* --- SATELLITES --- */}
        <div
          ref={satelliteGroupRef}
          className="satellite-group absolute inset-0 transform-style-3d"
        >
          <div className="absolute top-1/2 left-0 w-1.5 h-1.5 bg-primary/80 rounded-none shadow-[0_0_15px_currentColor]" />
          <div className="absolute bottom-0 right-1/4 w-1 h-1 bg-foreground/60 rounded-none" />
        </div>
      </div>
    </div>
  );
}
