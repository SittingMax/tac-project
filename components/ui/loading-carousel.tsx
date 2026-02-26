'use client';

import * as React from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import Autoplay from 'embla-carousel-autoplay';

import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from './carousel';
import { cn } from '@/lib/utils';

interface Tip {
  title: string;
  description: string;
  image: string;
  link?: string;
  width?: number;
  height?: number;
}

interface LoadingCarouselProps {
  tips: Tip[];
  autoplayInterval?: number;
}

export function LoadingCarousel({ tips, autoplayInterval = 5000 }: LoadingCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const plugin = React.useRef(Autoplay({ delay: autoplayInterval, stopOnInteraction: false }));

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const handleDotClick = (index: number) => {
    api?.scrollTo(index);
  };

  return (
    <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-[600px] border border-dashed border-border rounded-none overflow-hidden bg-background/50 backdrop-blur-sm">
      {/* Left: Content & Navigation */}
      <div className="flex flex-col justify-center p-8 lg:p-16 border-b lg:border-b-0 lg:border-r border-dashed border-border">
        <div className="mb-8 flex items-center gap-3">
          <div className="h-px w-8 bg-primary/50" />
          <span className="text-primary font-mono text-xs tracking-[0.2em] uppercase font-bold">
            SYSTEM CAPABILITY // 0{current + 1}
          </span>
        </div>

        <div className="relative min-h-[160px] mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-4xl lg:text-5xl font-bold mb-4 text-foreground tracking-tighter">
                {tips[current].title}
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                {tips[current].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation List */}
        <div className="flex flex-col gap-2 mt-auto">
          {tips.map((tip, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={cn(
                'relative group text-left px-5 py-4 rounded-none border border-transparent transition-all duration-300 isolate overflow-hidden',
                current === index
                  ? 'bg-foreground/5 border-primary/30'
                  : 'hover:bg-foreground/5 hover:border-border'
              )}
            >
              {/* Progress Background for Active */}
              {current === index && (
                <motion.div
                  layoutId="active-tab-bg"
                  className="absolute inset-0 bg-primary/10 -z-10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}

              <div className="flex items-center justify-between z-10 relative">
                <span
                  className={cn(
                    'font-mono text-sm font-medium transition-colors',
                    current === index
                      ? 'text-primary font-semibold'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  {tip.title}
                </span>
                {current === index ? (
                  <div className="h-1.5 w-1.5 rounded-none bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                ) : (
                  <span className="text-muted-foreground/30 text-xs font-mono">0{index + 1}</span>
                )}
              </div>

              {/* Progress Line */}
              {current === index && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: autoplayInterval / 1000, ease: 'linear' }}
                  className="absolute bottom-0 left-0 h-[2px] bg-primary w-full origin-left"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Carousel Visuals */}
      <div className="relative h-[400px] lg:h-auto overflow-hidden bg-muted">
        <Carousel
          setApi={setApi}
          plugins={[plugin.current]}
          className="h-full w-full"
          opts={{ loop: true }}
        >
          <CarouselContent className="h-full ml-0">
            {tips.map((tip, index) => (
              <CarouselItem key={index} className="pl-0 h-full relative w-full">
                <div className="relative h-full w-full group">
                  {/* Replace Next.js Image with img */}
                  <img
                    src={tip.image}
                    alt={tip.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10000ms] ease-linear scale-100 group-[.is-selected]:scale-110"
                  />

                  {/* Yuna Overlays */}
                  <div className="absolute inset-0 bg-grid opacity-30 mixed-blend-overlay pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent opacity-80 lg:opacity-60" />
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent opacity-80" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}
