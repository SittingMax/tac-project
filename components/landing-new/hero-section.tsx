'use client';

import { ArrowRight, PlaneTakeoff } from 'lucide-react';
import { useState } from 'react';
import { BookingDialog } from '@/components/bookings/BookingDialog';
import { RetroGrid } from '@/components/ui/retro-grid';

export function HeroSection() {
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  return (
    <section className="relative min-h-[90vh] overflow-hidden pt-20 pb-16">
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-background to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.foreground/.08),transparent_65%)] dark:bg-[radial-gradient(ellipse_at_top,theme(colors.foreground/.14),transparent_65%)]" />

      {/* Background Gradient/Glow (Simulating the video shadow from Setrex) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary opacity-[0.07] blur-[120px] rounded-full pointer-events-none z-0"></div>

      <RetroGrid
        className="z-0"
        opacity={0.72}
        angle={68}
        cellSize={64}
        lightLineColor="color-mix(in oklab, var(--foreground) 18%, transparent)"
        darkLineColor="color-mix(in oklab, var(--foreground) 34%, transparent)"
      />
      <div className="relative z-10 mx-auto flex min-h-[90vh] max-w-5xl items-center px-6 text-center">
        <div className="w-full">
          {/* Setrex-style transparent badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/40 bg-muted/20 backdrop-blur-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-sm font-medium text-foreground">
              Introducing TAC Global Routing
            </span>
          </div>

          {/* Setrex H1 sizing */}
          <h1 className="font-sans text-6xl sm:text-7xl md:text-[5rem] font-bold tracking-tighter text-foreground mb-6 leading-[1.1]">
            Streamline your global <br className="hidden md:block" />
            <span className="text-primary">logistics workflow.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Real-time shipment tracking, automated manifest management, and intelligent routing for
            air and ground freight operations.
          </p>

          {/* Setrex Button Group */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 w-full sm:w-auto">
            <a
              href="#tracking"
              className="group relative flex w-full sm:w-auto items-center justify-center gap-3 overflow-hidden rounded-full bg-primary px-8 py-4 font-bold text-black transition-all hover:scale-105 shadow-[0_0_40px_-10px_var(--primary)] text-lg"
            >
              <span>Start Tracking</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>

            <button
              onClick={() => setBookingDialogOpen(true)}
              className="group flex w-full sm:w-auto items-center justify-center gap-3 rounded-full border border-border/50 bg-card px-8 py-4 font-bold text-foreground transition-all hover:bg-muted/50 text-lg"
            >
              <PlaneTakeoff className="w-5 h-5" />
              <span>Book a Demo</span>
            </button>
          </div>

          <div className="pt-8 border-t border-border/40">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
              Trusted by industry leaders
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale filter hover:grayscale-0 transition-all duration-500">
              {/* Placeholder for logos matching Setrex style */}
              <div className="text-xl font-bold font-serif">ACME Corp</div>
              <div className="text-xl font-bold tracking-widest">GLOBAL</div>
              <div className="text-xl font-bold italic">TechFlow</div>
              <div className="text-xl font-bold">NEXUS</div>
            </div>
          </div>
        </div>
      </div>
      <BookingDialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen} />
    </section>
  );
}
