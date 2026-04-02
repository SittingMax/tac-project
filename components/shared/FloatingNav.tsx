import { useEffect, useState } from 'react';
import { ArrowUp, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function FloatingNav() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show pill after scrolling down 200px
      if (window.scrollY > 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={cn(
        'fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition duration-500 ease-in-out',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'
      )}
    >
      <div className="flex items-center gap-1 p-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border/50 shadow-lg shadow-black/5">
        <Link to="/">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full px-4 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Home size={16} strokeWidth={1.5} className="mr-2" />
            Home
          </Button>
        </Link>
        <div className="w-px h-4 bg-border/50 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={scrollToTop}
          className="rounded-full px-4 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <ArrowUp size={16} strokeWidth={1.5} className="mr-2" />
          Top
        </Button>
      </div>
    </div>
  );
}
