'use client';

import { ArrowRight } from 'lucide-react';
import { TrackingDialog } from './tracking-dialog';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { BookingDialog } from '@/components/bookings/BookingDialog';
import { MockCargoControlCenter } from '@/components/landing-new/mock-cargo-control.tsx';

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Timeline for entrance sequence
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // 1. Container Intro
      tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5 });

      // 2. Text Stagger Reveal
      tl.fromTo(
        textRef.current?.children || [],
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.2 },
        '-=1.2'
      );

      // 3. CTA Reveal
      tl.fromTo(
        ctaRef.current,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        '-=0.4'
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <main
      id="home"
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-start overflow-hidden pt-36 pb-24 w-full"
    >
      {/* Deep Radial Background Glow */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-secondary opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 z-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] bg-[size:50px_50px]" />

      {/* Hero Content */}
      <div className="relative z-20 text-center max-w-5xl px-6 w-full flex flex-col items-center mt-12">
        <div ref={textRef} className="space-y-6 mb-12 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none border border-primary/20 bg-primary/10 text-primary text-xs font-mono font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-none h-2 w-2 bg-primary"></span>
            </span>
            TAC Network Live
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[6.5rem] leading-[1.1] font-extrabold tracking-tighter text-foreground pb-1">
            Seamless Logistics <br />
            with <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground">TAC.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            TAC delivers high-performance freight solutions specialized for the Northeast corridor. <br className="hidden md:block" />
            Experience speed, reliability, and total transparency for every shipment.
          </p>
        </div>

        {/* CTAs */}
        <div
          ref={ctaRef}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 w-full mb-24"
        >
          {/* Primary CTA */}
          <Button
            size="lg"
            className="rounded-none px-10 h-14 text-base font-bold group shadow-[0_0_40px_-5px_var(--tw-shadow-color)] shadow-primary/40"
            onClick={() => setBookingDialogOpen(true)}
          >
            Book Shipment
            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>

          {/* Secondary CTA */}
          <TrackingDialog
            trigger={
              <Button variant="outline" size="lg" className="rounded-none px-10 h-14 text-base font-bold border-primary/20 hover:border-primary/40 hover:bg-primary/5 backdrop-blur-sm transition-all">
                Track Cargo
              </Button>
            }
          />
        </div>

        {/* The Anchor Graphic */}
        <MockCargoControlCenter />
      </div>

      <BookingDialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen} />
    </main>
  );
}
