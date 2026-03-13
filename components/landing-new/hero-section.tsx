'use client';

import { useState } from 'react';
import { ArrowRight, PlaneTakeoff } from 'lucide-react';
import { BookingDialog } from '@/components/bookings/BookingDialog';

export function HeroSection() {
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  return (
    <section className="relative min-h-[90vh] overflow-hidden pt-20 pb-16">
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(100%_0_0deg/0.05),transparent_65%)]" />

      {/* Background Gradient/Glow (Simulating the video shadow from Setrex) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary opacity-[0.07] blur-[120px] rounded-full pointer-events-none z-0"></div>


      <div className="relative z-10 mx-auto flex min-h-[90vh] max-w-5xl items-center px-6 text-center">
        <div className="w-full">
          {/* Setrex-style transparent badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] shadow-[0_0_10px_var(--primary)]"></span>
            <span className="text-sm font-medium text-zinc-300">
              Introducing TAC Global Routing
            </span>
          </div>

          {/* Setrex H1 sizing */}
          <h1 className="font-sans text-6xl sm:text-7xl md:text-[5rem] font-bold tracking-tighter text-zinc-100 mb-6 leading-[1.1]">
            Streamline your global <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50">
              logistics workflow.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-mono text-sm">
            Real-time shipment tracking, automated manifest management, and intelligent routing for
            international multi-modal freight operations.
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
              className="group flex w-full sm:w-auto items-center justify-center gap-3 rounded-full border border-zinc-800 bg-zinc-900/50 px-8 py-4 font-bold text-zinc-100 transition-all hover:bg-zinc-800 text-lg backdrop-blur-sm"
            >
              <PlaneTakeoff className="w-5 h-5 text-zinc-400 group-hover:text-primary transition-colors" />
              <span>Book a Demo</span>
            </button>
          </div>

          <div className="pt-8 border-t border-zinc-900">
            <p className="text-xs font-semibold text-zinc-600 mb-6">Trusted by industry leaders</p>
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
