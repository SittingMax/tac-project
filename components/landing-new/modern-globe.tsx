'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { gsap } from '@/lib/gsap';

interface Point {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
}

export function ModernGlobe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Configuration (now mutable in ref)
  const configRef = useRef({
    particleCount: 300,
    baseRadius: 100,
    connectionDistance: 35,
    rotationSpeed: 0.002,
    mouseRotationSpeed: 0.05,
    dotSize: 1.5,
  });

  // State refs for animation loop
  const state = useRef({
    points: [] as Point[],
    rotationX: 0,
    rotationY: 0,
    targetRotationX: 0,
    targetRotationY: 0,
    width: 0,
    height: 0,
    colors: {
      foreground: 'rgba(0,0,0,1)',
      primary: 'rgba(0,0,0,0.1)',
    },
  });

  // Initialize Points (Fibonacci Sphere)
  const initPoints = () => {
    const points: Point[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
    const { particleCount, baseRadius } = configRef.current;

    for (let i = 0; i < particleCount; i++) {
      const y = 1 - (i / (particleCount - 1)) * 2; // y goes from 1 to -1
      const radius = Math.sqrt(1 - y * y); // Radius at y
      const theta = phi * i; // Golden angle increment

      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;

      // Scale by base radius
      points.push({
        x: x * baseRadius,
        y: y * baseRadius,
        z: z * baseRadius,
        baseX: x * baseRadius,
        baseY: y * baseRadius,
        baseZ: z * baseRadius,
      });
    }
    state.current.points = points;
  };

  // Handle Resize & Colors
  const handleResize = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvasRef.current.width = rect.width * dpr;
    canvasRef.current.height = rect.height * dpr;
    canvasRef.current.style.width = `${rect.width}px`;
    canvasRef.current.style.height = `${rect.height}px`;

    state.current.width = rect.width;
    state.current.height = rect.height;

    // Scale radius based on container size
    configRef.current.baseRadius = Math.min(rect.width, rect.height) * 0.4;
    initPoints(); // Re-init points with new radius

    // Update Colors
    // Resolve OKLCH/HSL vars to RGB for Canvas
    // Quick hack: Use a temp element to resolve the color
    const getColor = (varName: string) => {
      const temp = document.createElement('div');
      temp.style.color = `var(${varName})`;
      document.body.appendChild(temp);
      const color = getComputedStyle(temp).color; // Returns rgb() string
      document.body.removeChild(temp);
      return color;
    };

    state.current.colors.foreground = getColor('--foreground');
    state.current.colors.primary = getColor('--primary');
  }, []);

  useEffect(() => {
    initPoints();
    handleResize();

    window.addEventListener('resize', handleResize);

    // Mutation observer for theme changes (class on html)
    const observer = new MutationObserver(handleResize);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Mouse Move Parallax
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      state.current.targetRotationY = x * Math.PI * 0.5; // Max rotation
      state.current.targetRotationX = -y * Math.PI * 0.5;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // GSAP Ticker Loop
    const render = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx || !canvasRef.current) return;

      const { width, height, points, colors } = state.current;
      const config = configRef.current;

      // Clear
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      ctx.save();
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
      ctx.translate(width / 2, height / 2);

      // Update Rotation (Smooth Lerp)
      state.current.rotationY += (state.current.targetRotationY - state.current.rotationY) * 0.05;
      state.current.rotationX += (state.current.targetRotationX - state.current.rotationX) * 0.05;

      // Constant Auto-Spin
      const autoSpin = gsap.ticker.time * config.rotationSpeed;

      const finalRotY = state.current.rotationY + autoSpin;
      const finalRotX = state.current.rotationX;

      // Rotation Matrices
      const cosY = Math.cos(finalRotY);
      const sinY = Math.sin(finalRotY);
      const cosX = Math.cos(finalRotX);
      const sinX = Math.sin(finalRotX);

      // Project and Draw
      const projectedPoints: { x: number; y: number; z: number; visible: boolean }[] = [];

      points.forEach((p) => {
        // Rotate Y
        const x1 = p.baseX * cosY - p.baseZ * sinY;
        const z1 = p.baseZ * cosY + p.baseX * sinY;

        // Rotate X
        const y1 = p.baseY * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.baseY * sinX;

        // Simple Perspective (Safe division)
        const perspective = 400;
        const scale = perspective / (perspective - z2 + 0.001);
        const x2D = x1 * scale;
        const y2D = y1 * scale;

        projectedPoints.push({ x: x2D, y: y2D, z: z2, visible: z2 < 150 });
      });

      // Draw Lines (Connections)
      ctx.lineWidth = 0.5;
      // ctx.strokeStyle = colors.primary.replace(')', ', 0.15)').replace('rgb', 'rgba'); // Hacky alpha -> Removed
      ctx.strokeStyle = colors.primary;

      // Only verify distance for a subset to save perf, or straightforward check
      // For 300 points, straightforward is fine on modern devices
      for (let i = 0; i < projectedPoints.length; i++) {
        const p1 = projectedPoints[i];
        // Skip particles behind the globe "core" for a cleaner look if desired,
        // but strictly we just want to draw lines between close points

        // Draw Dot
        const alpha = Math.max(0.1, (p1.z + config.baseRadius) / (config.baseRadius * 2)); // Depth fog
        // ctx.fillStyle = colors.foreground.replace(')', `, ${alpha})`).replace('rgb', 'rgba'); -> Removed
        ctx.fillStyle = colors.foreground;

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, config.dotSize * scalePoint(p1.z), 0, Math.PI * 2);
        ctx.fill();

        // Connections
        for (let j = i + 1; j < projectedPoints.length; j++) {
          const p2 = projectedPoints[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < config.connectionDistance) {
            const lineAlpha = (1 - dist / config.connectionDistance) * 0.2;
            // Depth check for lines too
            if (p1.z > -50 && p2.z > -50) {
              // Only draw lines on front-ish hemisphere
              // ctx.strokeStyle = colors.foreground.replace(')', `, ${lineAlpha})`).replace('rgb', 'rgba'); -> Removed
              ctx.strokeStyle = colors.foreground;
              ctx.globalAlpha = lineAlpha;

              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }

      ctx.restore();
    };

    gsap.ticker.add(render);

    return () => {
      gsap.ticker.remove(render);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect();
    };
  }, [handleResize]);

  const scalePoint = (z: number) => {
    // Scale dot size based on depth
    return Math.max(0.5, (z + 200) / 300);
  };

  return (
    <motion.div
      ref={containerRef}
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </motion.div>
  );
}
