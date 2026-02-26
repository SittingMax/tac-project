import { FadeUp } from '@/components/motion/FadeUp';

const PARTNER_NAMES = [
  'Kangla Global',
  'Siroi Logistics',
  'Loktak Hydro',
  'Ima Exports',
  'Sangai Systems',
  'Barak Valley Corp',
  'Classic Group',
  'Hills & Valley',
] as const;

export function TrustedBy() {
  return (
    <section
      className="bg-muted/50 overflow-hidden border-y border-border/10 pt-10 pb-10"
      aria-label="Our trusted partners"
      style={{
        maskImage: 'linear-gradient(90deg, transparent, black 20%, black 80%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, black 20%, black 80%, transparent)',
      }}
    >
      <FadeUp className="mx-auto max-w-7xl px-6" delay={0.2} duration={0.8}>
        <p className="text-muted-foreground mb-8 text-center text-xs font-medium">
          Trusted by businesses across Manipur
        </p>
        <div
          className="group relative flex overflow-x-hidden"
          role="marquee"
          aria-label={`Partners: ${PARTNER_NAMES.join(', ')}`}
        >
          {/* Primary content - visible to screen readers */}
          <div className="animate-marquee flex items-center gap-16 whitespace-nowrap opacity-50 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0">
            {PARTNER_NAMES.map((name, i) => (
              <span
                key={`primary-${name}`}
                className={`text-xl font-bold tracking-tight ${i % 3 === 0 ? 'font-serif italic' : i % 2 === 0 ? 'font-mono' : 'font-sans'}`}
              >
                {name}
              </span>
            ))}
          </div>
          {/* Duplicated content for seamless loop - hidden from screen readers */}
          <div
            className="animate-marquee flex items-center gap-16 whitespace-nowrap opacity-50 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0"
            aria-hidden="true"
          >
            {PARTNER_NAMES.map((name, i) => (
              <span
                key={`duplicate-${name}`}
                className={`text-xl font-bold tracking-tight ${i % 3 === 0 ? 'font-serif italic' : i % 2 === 0 ? 'font-mono' : 'font-sans'}`}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </FadeUp>
    </section>
  );
}
