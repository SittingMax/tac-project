import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Search, ScanBarcode, Command } from 'lucide-react';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { useStore } from '@/store';
import { AnimatedThemeToggler } from '../ui/animated-theme-toggler';
import { NotificationBell } from '../domain/NotificationBell';
import { useScanner } from '@/context/useScanner';
import { CommandPalette } from '../domain/CommandPalette';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Kbd } from '@/components/ui/kbd';

export const Header: React.FC = () => {
  const { setTheme } = useStore();
  const { scan } = useScanner();
  const location = useLocation();
  const navigate = useNavigate();
  const [commandOpen, setCommandOpen] = React.useState(false);

  const handleManualScan = async () => {
    try {
      const result = await scan();
      const cleanResult = result.trim().toUpperCase();
      if (!cleanResult) return;

      if (cleanResult.startsWith('TAC')) {
        navigate(`/search?q=${encodeURIComponent(cleanResult)}`);
        return;
      }

      if (cleanResult.startsWith('MAN')) {
        navigate(`/manifests?search=${encodeURIComponent(cleanResult)}`);
        return;
      }

      navigate(`/search?q=${encodeURIComponent(cleanResult)}`);
    } catch {
      // Scan cancelled
    }
  };

  const paths = location.pathname.split('/').filter(Boolean);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-background/40 backdrop-blur-xl border-b border-border/30 px-6 z-40 sticky top-0">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-2 hover:bg-accent hover:text-accent-foreground transition-colors" />

        {paths.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              {paths.map((path, index) => {
                const isLast = index === paths.length - 1;
                const href = `/${paths.slice(0, index + 1).join('/')}`;
                const formattedPath =
                  path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');

                return (
                  <React.Fragment key={path}>
                    <BreadcrumbItem className="hidden md:block">
                      {isLast ? (
                        <BreadcrumbPage className="font-semibold">{formattedPath}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link
                            to={href}
                            className="text-muted-foreground/70 transition-colors hover:text-foreground"
                          >
                            {formattedPath}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator className="hidden md:block opacity-50" />}
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>

      <div className="flex flex-1 items-center justify-end gap-3 md:gap-5">
        <button
          onClick={() => setCommandOpen(true)}
          className="group hidden lg:flex h-9 w-full max-w-[280px] items-center gap-2 rounded-full bg-muted/20 px-4 text-sm text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          <Search className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
          <span className="flex-1 text-left text-[13px] font-medium tracking-wide">
            Search everywhere...
          </span>
          <Kbd className="bg-background/40 border-none shadow-none text-muted-foreground">
            <Command className="h-2.5 w-2.5 mr-0.5" /> K
          </Kbd>
        </button>

        <div className="flex items-center gap-1.5 border-l border-border/50 pl-3 md:pl-5">
          <button
            onClick={handleManualScan}
            className="flex items-center justify-center p-2 rounded-full text-muted-foreground/70 hover:text-primary hover:bg-primary/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            title="Scan QR/Barcode"
          >
            <ScanBarcode className="h-[18px] w-[18px]" strokeWidth={2.5} />
          </button>

          <AnimatedThemeToggler
            className="flex items-center justify-center p-2 rounded-full text-muted-foreground/70 hover:text-foreground hover:bg-accent transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            duration={500}
            onThemeChange={setTheme}
          />

          <NotificationBell />
        </div>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </header>
  );
};
