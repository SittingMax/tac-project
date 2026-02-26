import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Menu, Search, ScanBarcode, ChevronRight } from 'lucide-react';
import { useStore } from '@/store';
import { AnimatedThemeToggler } from '../ui/animated-theme-toggler';
import { NotificationBell } from '../domain/NotificationBell';
import { useScanner } from '@/context/useScanner';
import { CommandPalette } from '../domain/CommandPalette';

export const Header: React.FC = () => {
  const { toggleSidebar, setMobileSidebarOpen, mobileSidebarOpen, setTheme } = useStore();
  const { scan } = useScanner();
  const location = useLocation();
  const navigate = useNavigate();
  const [commandOpen, setCommandOpen] = useState(false);

  const handleMenuClick = () => {
    if (window.innerWidth < 1024) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    } else {
      toggleSidebar();
    }
  };

  const handleManualScan = async () => {
    try {
      const result = await scan();
      const cleanResult = result.trim().toUpperCase();
      if (!cleanResult) return;

      // Route to invoice page for shipment barcodes (TAC...)
      if (cleanResult.startsWith('TAC')) {
        navigate(`/finance?awb=${encodeURIComponent(cleanResult)}`);
        return;
      }

      // Route to manifests page for manifest barcodes (MAN...)
      if (cleanResult.startsWith('MAN')) {
        navigate(`/manifests?search=${encodeURIComponent(cleanResult)}`);
        return;
      }

      // Unknown format → general search
      navigate(`/search?q=${encodeURIComponent(cleanResult)}`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // Scan cancelled
    }
  };

  const generateBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length === 0) return null;

    return (
      <div className="hidden md:flex items-center text-sm ml-2">
        {paths.map((path, index) => {
          const isLast = index === paths.length - 1;
          const href = `/${paths.slice(0, index + 1).join('/')}`;
          const formattedPath = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');

          return (
            <React.Fragment key={path}>
              <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />
              {isLast ? (
                <span className="font-semibold text-foreground">{formattedPath}</span>
              ) : (
                <Link to={href} className="text-muted-foreground hover:text-foreground transition-colors">
                  {formattedPath}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <header className="h-16 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm z-40 px-4 lg:px-6 flex shrink-0 items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={handleMenuClick}
          className="p-2 rounded-none text-muted-foreground hover:text-primary hover:bg-primary/15 transition-all hover:scale-105"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {generateBreadcrumbs()}
      </div>

      <div className="flex-1 max-w-md px-4 hidden lg:flex justify-end lg:justify-center">
        <button
          data-tour="command-palette"
          onClick={() => setCommandOpen(true)}
          className="flex w-[400px] items-center gap-2 rounded-none border border-input bg-background/50 px-4 py-2 text-sm text-muted-foreground shadow-sm transition-all hover:shadow-md hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left">Search or type a command...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-none border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={handleManualScan}
          className="p-2 rounded-none text-muted-foreground hover:text-primary hover:bg-primary/15 transition-all hover:scale-105"
          aria-label="Scan QR/Barcode"
          title="Scan QR/Barcode"
        >
          <ScanBarcode className="w-5 h-5" />
        </button>

        <AnimatedThemeToggler
          className="text-muted-foreground hover:text-primary rounded-none hover:bg-primary/15 transition-all hover:scale-105"
          duration={500}
          onThemeChange={setTheme}
        />

        <NotificationBell />
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </header>
  );
};
