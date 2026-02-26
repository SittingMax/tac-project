export const MOTION_TOKENS = {
  // Durations (seconds)
  duration: {
    instant: 0.15,
    fast: 0.3,
    normal: 0.5,
    slow: 0.8,
    dramatic: 1.2,
  },

  // Easing (GSAP power curves mapped to strings for consistency)
  ease: {
    smooth: 'power2.out',
    snappy: 'power3.out',
    elastic: 'elastic.out(1, 0.5)',
    bounce: 'bounce.out',
    anticipate: 'power2.inOut',
    default: [0.215, 0.61, 0.355, 1.0], // Custom cubic-bezier
  },

  // Stagger delays (seconds)
  stagger: {
    tight: 0.03,
    normal: 0.08,
    relaxed: 0.15,
    dramatic: 0.25,
  },

  // Transform distances (pixels)
  distance: {
    micro: 8,
    small: 20,
    medium: 40,
    large: 80,
    hero: 120,
  },
} as const;
