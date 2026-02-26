'use client';

import * as React from 'react';
import { Link } from 'react-router-dom';
import { Box, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { useGSAP, gsap } from '@/lib/gsap';
import { MOTION_TOKENS } from '@/lib/animation-tokens';
import { useStore } from '@/store';

import { BookingDialog } from '@/components/bookings/BookingDialog';

export function Navbar() {
  const { setTheme } = useStore();
  const [mounted, setMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [activeSection, setActiveSection] = React.useState<string>('');
  const navRef = React.useRef<HTMLElement>(null);
  const blurBgRef = React.useRef<HTMLDivElement>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Track active section via IntersectionObserver
  React.useEffect(() => {
    const sectionIds = ['tracking', 'global-fleet', 'system-capabilities', 'about', 'contact'];
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${id}`);
          }
        },
        { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // GSAP Scroll Animation
  useGSAP(() => {
    const nav = navRef.current;
    const blurBg = blurBgRef.current;
    if (!nav || !blurBg) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        start: 'top top',
        end: '+=100',
        toggleActions: 'play none none reverse',
        scrub: 0.5,
      },
    });

    tl.to(
      nav,
      {
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
        backgroundColor: 'rgba(0,0,0,0.8)',
      },
      0
    );
  }, []);

  const navLinks = [
    { name: 'Tracking', href: '#tracking' },
    { name: 'Network', href: '#global-fleet' },
    { name: 'Intelligence', href: '#system-capabilities' },
    { name: 'Services', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ];

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.scrollY - 80; // Adjust for navbar height
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
      });
      setIsOpen(false);
    }
  };

  return (
    <>
      <motion.nav
        ref={navRef}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: MOTION_TOKENS.duration.normal,
          ease: [0.215, 0.61, 0.355, 1.0],
        }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl rounded-none.5rem] border border-border/50 bg-background/40 backdrop-blur-2xl transition-all shadow-xl shadow-black/5"
        style={{ willChange: 'transform' }}
      >
        <div className="relative flex h-16 items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group relative z-50"
            onClick={(e) => handleScroll(e, '#home')}
          >
            <div className="relative flex h-11 w-11 items-center justify-center rounded-none bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-all duration-500 shadow-sm shadow-primary/10">
              <Box className="h-6 w-6 text-primary fill-primary/20 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-foreground text-xl font-sans font-bold tracking-tighter leading-none group-hover:text-primary transition-colors duration-300">
                TAC
              </span>
              <span className="text-[9px] text-muted-foreground font-mono tracking-widest uppercase mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                Tapan Associate Cargo
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link, index) => {
              const isActive = activeSection === link.href;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleScroll(e, link.href)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={cn(
                    'relative px-5 py-2 text-sm font-medium transition-colors',
                    isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {/* Active indicator (persistent) */}
                  {isActive && hoveredIndex === null && (
                    <motion.span
                      className="absolute inset-0 rounded-none bg-foreground/10 border border-foreground/5 shadow-sm"
                      layoutId="activeBackground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  {/* Hover indicator */}
                  <AnimatePresence>
                    {hoveredIndex === index && (
                      <motion.span
                        className="absolute inset-0 rounded-none bg-foreground/5 shadow-sm"
                        layoutId="hoverBackground"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </AnimatePresence>
                  <span className="relative z-10">{link.name}</span>
                </a>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            <AnimatedThemeToggler onThemeChange={setTheme} />
            <div className="w-px h-6 bg-border/60 mx-1" />
            <Link to="/login">
              <Button variant="ghost" className="rounded-none font-medium hover:bg-muted/50">
                Login
              </Button>
            </Link>

            <Button
              onClick={() => setBookingDialogOpen(true)}
              className="relative overflow-hidden rounded-none px-6 font-semibold shadow-glow-primary transition-all duration-300 hover:scale-105 active:scale-95 group"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="relative z-10">Book Shipment</span>
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="flex items-center gap-3 md:hidden relative z-50">
            <AnimatedThemeToggler onThemeChange={setTheme} />
            {mounted && (
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-none hover:bg-muted/50">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[300px] border-l border-border bg-background/95 backdrop-blur-2xl p-0"
                >
                  <div className="flex flex-col h-full">
                    <div className="h-20 flex items-center justify-between px-6 border-b border-border/50">
                      <span className="font-sans font-bold text-lg">Menu</span>
                      <SheetClose asChild>
                        <Button variant="ghost" size="icon" className="rounded-none -mr-2">
                          <X className="h-5 w-5" />
                        </Button>
                      </SheetClose>
                    </div>
                    <div className="flex flex-col py-6">
                      {navLinks.map((link, i) => (
                        <motion.a
                          key={link.name}
                          href={link.href}
                          onClick={(e: React.MouseEvent<HTMLAnchorElement>) =>
                            handleScroll(e, link.href)
                          }
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.05 }}
                          className="flex items-center h-14 px-8 text-lg font-medium text-muted-foreground hover:text-primary hover:bg-muted/30 transition-colors border-l-2 border-transparent hover:border-primary"
                        >
                          {link.name}
                        </motion.a>
                      ))}
                    </div>
                    <div className="p-6 mt-auto space-y-4">
                      <Link to="/login" className="block" onClick={() => setIsOpen(false)}>
                        <Button
                          variant="outline"
                          className="w-full rounded-none h-12 text-base font-medium"
                        >
                          Login
                        </Button>
                      </Link>

                      <Button
                        onClick={() => {
                          setIsOpen(false);
                          setBookingDialogOpen(true);
                        }}
                        className="w-full rounded-none h-12 text-base font-medium shadow-lg shadow-primary/20"
                      >
                        Book Shipment
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </motion.nav>

      <BookingDialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen} />
    </>
  );
}
