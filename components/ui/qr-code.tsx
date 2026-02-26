'use client';

import { QRCodeCanvas } from 'qrcode.react';
// import { useTheme } from "next-themes";
import { useEffect, useState } from 'react';

// Mock useTheme if not available, or use a context.
// For now, simple mock or assume light/dark from class.
const useTheme = () => {
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = document.documentElement;
    const compute = () => {
      setResolvedTheme(root.classList.contains('dark') ? 'dark' : 'light');
    };

    compute();

    const observer = new MutationObserver(() => compute());
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  return { resolvedTheme };
};

interface ThemeAwareQRCodeProps {
  value: string;
  size?: number;
  className?: string;
  bgColor?: string;
  fgColor?: string;
  level?: 'L' | 'M' | 'Q' | 'H';
  'aria-label'?: string;
}

/**
 * Theme-aware QR Code wrapper component
 */
export function ThemeAwareQRCode({
  value,
  size = 64,
  className,
  bgColor,
  fgColor,
  level = 'M',
  'aria-label': ariaLabel,
}: ThemeAwareQRCodeProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getThemeColors = () => {
    if (!mounted || typeof globalThis === 'undefined') {
      return { bg: '#ffffff', fg: '#0a0a0a' };
    }

    const styles = getComputedStyle(document.documentElement);
    const bgVar = resolvedTheme === 'dark' ? '--background' : '--background';
    const fgVar = resolvedTheme === 'dark' ? '--foreground' : '--foreground';
    const bg = styles.getPropertyValue(bgVar).trim();
    const fg = styles.getPropertyValue(fgVar).trim();
    return {
      bg: bg || '#ffffff',
      fg: fg || '#0a0a0a',
    };
  };

  const colors = getThemeColors();

  if (!mounted) {
    return <div className={className} style={{ width: size, height: size }} aria-hidden="true" />;
  }

  return (
    <QRCodeCanvas
      value={value}
      size={size}
      bgColor={bgColor || colors.bg}
      fgColor={fgColor || colors.fg}
      level={level}
      className={className}
      role="img"
      aria-label={ariaLabel || `QR code for: ${value}`}
    />
  );
}
