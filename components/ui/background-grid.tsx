export function BackgroundGrid() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 flex h-full w-full justify-center opacity-40 dark:opacity-20">
      {/* Main Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--grid-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-line)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Secondary finer grid for detail (only visible on high dpi or specific areas if needed, kept subtle) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--grid-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-line)_1px,transparent_1px)] bg-[size:10px_10px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)]" />
    </div>
  );
}
