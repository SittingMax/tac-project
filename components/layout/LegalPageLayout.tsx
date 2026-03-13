import React, { useEffect, useState, useRef } from 'react';
import { FadeUp } from '@/components/motion/FadeUp';
import { Footer } from '@/components/landing-new/footer';
import { FloatingNav } from '@/components/shared/FloatingNav';
import { TacLogo } from '@/components/shared/tac-logo';
import { Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

export interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface LegalPageLayoutProps {
  title: string;
  effectiveDate: string;
  sections: LegalSection[];
}

// Sub-component for the progress bar to isolate re-renders
const ScrollProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (docHeight > 0) {
            setProgress((scrollY / docHeight) * 100);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-50 bg-muted/30">
      <div
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export function LegalPageLayout({ title, effectiveDate, sections }: LegalPageLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>('');
  const location = useLocation();
  const lastActiveRef = useRef<string>('');

  // Intersection Observer for Active TOC Item
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          const topVisible = visibleEntries.reduce((prev, current) =>
            current.boundingClientRect.top < prev.boundingClientRect.top ? current : prev
          );

          if (topVisible.target.id !== lastActiveRef.current) {
            lastActiveRef.current = topVisible.target.id;
            setActiveSection(topVisible.target.id);
          }
        }
      },
      { rootMargin: '-10% 0px -80% 0px', threshold: [0, 0.1] }
    );

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  // Handle Hash Navigation on Initial Load
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location.hash]);

  const copyLink = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url);
    // Optional: Could add a small toast here if we imported sonner
  };

  return (
    <div className="min-h-screen bg-background relative text-foreground flex flex-col">
      <ScrollProgress />

      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full pointer-events-none -z-10" />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-24 relative z-10 w-full">
        <FadeUp>
          <div className="mb-12 flex justify-start">
            <TacLogo size="lg" showSubtitle />
          </div>

          <header className="mb-16 border-b border-border/50 pb-8 max-w-prose">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-balance">
              {title}
            </h1>
            <p className="text-xl text-muted-foreground font-mono">
              Effective Date: {effectiveDate}
            </p>
          </header>
        </FadeUp>

        <div className="flex flex-col lg:flex-row gap-16 relative items-start">
          {/* Main Content */}
          <div className="flex-1 max-w-prose space-y-8">
            <FadeUp delay={0.1}>
              {sections.map((section, index) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 group">
                    <span className="text-sm font-mono text-primary bg-primary/10 px-2 py-1 select-none">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-balance">{section.title}</span>
                    <a
                      href={`#${section.id}`}
                      onClick={(e) => copyLink(section.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary focus-visible:opacity-100 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded p-1"
                      aria-label={`Link to ${section.title}`}
                      title="Copy link to section"
                    >
                      <Link2 className="w-5 h-5" />
                    </a>
                  </h2>
                  <div className="space-y-4 text-muted-foreground leading-loose text-pretty">
                    {section.content}
                  </div>
                </section>
              ))}
            </FadeUp>
          </div>

          {/* Sticky Sidebar TOC (Desktop Only) */}
          <aside className="hidden lg:block w-72 sticky top-24 shrink-0">
            <div className="p-6 rounded-md border border-border/50 bg-muted/10 backdrop-blur-sm">
              <h3 className="text-xs font-semibold text-foreground mb-4">Contents</h3>
              <nav aria-label="Table of contents">
                <ul className="space-y-3 border-l border-border/40 ml-1">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className={cn(
                          'block -ml-[1px] pl-4 border-l transition-all text-sm py-1 outline-none focus-visible:bg-muted/50 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary',
                          activeSection === section.id
                            ? 'border-primary text-foreground font-medium'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          const el = document.getElementById(section.id);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                            window.history.pushState(null, '', `#${section.id}`);
                          }
                        }}
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>
        </div>
      </main>

      <FloatingNav />
      {/* Remove the fixed height rounded-none from Footer wrapper so it flows naturally */}
      <div className="w-full shrink-0">
        <Footer />
      </div>
    </div>
  );
}
