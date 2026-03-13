'use client';

import * as React from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { BookingDialog } from '@/components/bookings/BookingDialog';
import { TacLogo } from '@/components/shared/tac-logo';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = React.useState(false);

  const navLinks = [
    { name: 'Tracking', href: '#tracking' },
    { name: 'Services', href: '#system-capabilities' },
    { name: 'Contact', href: '#contact' },
  ];

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      setIsOpen(false);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 border-b border-border/20">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center pr-8 border-r border-border/40 h-full">
              <TacLogo size="md" className="rounded-md" showSubtitle />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <div className="flex items-center gap-8 bg-background border-r border-border/40 px-8 h-16">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleScroll(e, link.href)}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:-bottom-5 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <AnimatedThemeToggler className="rounded-md border border-border/50 hover:bg-muted/50 transition-colors" />
                <Link
                  to="/login"
                  className="text-xs font-medium text-foreground hover:text-muted-foreground transition-colors ml-2"
                >
                  Log in
                </Link>
                <Button
                  onClick={() => setBookingDialogOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-6 h-10 font-semibold text-xs shadow-sm ml-2 relative overflow-hidden group border border-primary"
                >
                  <span className="relative z-10">Book Shipment</span>
                  <div className="absolute inset-0 h-full w-full scale-0 rounded-md transition-all duration-300 ease-out group-hover:scale-100 group-hover:bg-primary-foreground/10"></div>
                </Button>
              </div>
            </div>

            {/* Mobile Menu */}
            <div className="flex items-center gap-2 md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-md border border-border/50"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] border-l border-border/50">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between py-4 border-b border-border">
                      <span className="font-semibold text-sm">Menu</span>
                      <SheetClose asChild>
                        <Button variant="ghost" size="icon" className="rounded-md">
                          <X className="h-4 w-4" />
                        </Button>
                      </SheetClose>
                    </div>
                    <div className="flex flex-col py-4">
                      {navLinks.map((link) => (
                        <a
                          key={link.name}
                          href={link.href}
                          onClick={(e) => handleScroll(e, link.href)}
                          className="py-4 border-b border-border/20 text-xs font-medium text-muted-foreground hover:text-foreground hover:pl-2 transition-all"
                        >
                          {link.name}
                        </a>
                      ))}
                    </div>
                    <div className="mt-auto space-y-3 py-4">
                      <Link to="/login" className="block" onClick={() => setIsOpen(false)}>
                        <Button
                          variant="outline"
                          className="w-full rounded-md text-xs font-medium h-12"
                        >
                          Login
                        </Button>
                      </Link>
                      <Button
                        onClick={() => {
                          setIsOpen(false);
                          setBookingDialogOpen(true);
                        }}
                        className="w-full bg-primary text-primary-foreground rounded-md text-xs font-semibold h-12"
                      >
                        Book Shipment
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      <BookingDialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen} />
    </>
  );
}
