'use client';

import { useRef } from 'react';
import { motion, useInView, type Variants } from '@/lib/motion';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { MOTION_TOKENS } from '@/lib/animation-tokens';
import { cn } from '@/lib/utils';

interface TextRevealProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  splitBy?: 'words' | 'characters';
  stagger?: number;
  delay?: number;
  threshold?: number;
  once?: boolean;
}

export function TextReveal({
  text,
  className = '',
  as: Component = 'div',
  splitBy = 'words',
  stagger = MOTION_TOKENS.stagger.tight,
  delay = 0,
  threshold = 0.1,
  once = true,
}: TextRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });
  const shouldReduceMotion = useReducedMotion();

  const words = text.split(' ');
  const chars = text.split('');

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : stagger,
        delayChildren: delay,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: {
      y: '100%',
      opacity: 0,
      rotateX: -20,
    },
    visible: {
      y: 0,
      opacity: 1,
      rotateX: 0,
      transition: {
        duration: 0.8,
        ease: [0.215, 0.61, 0.355, 1.0], // custom ease
      },
    },
  };

  if (shouldReduceMotion) {
    return <Component className={className}>{text}</Component>;
  }

  if (splitBy === 'words') {
    return (
      <Component ref={ref} className={cn(className, 'inline-block overflow-hidden')}>
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={containerVariants}
          className="flex flex-wrap gap-x-[0.25em]"
        >
          {words.map((word, i) => (
            <span key={i} className="inline-block overflow-hidden leading-tight py-1 -my-1">
              <motion.span className="inline-block origin-bottom" variants={itemVariants}>
                {word}
              </motion.span>
            </span>
          ))}
        </motion.div>
      </Component>
    );
  }

  return (
    <Component ref={ref} className={cn(className, 'inline-block overflow-hidden')}>
      <motion.div
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={containerVariants}
      >
        {chars.map((char, i) => (
          <motion.span key={i} variants={itemVariants} className="inline-block origin-bottom">
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </motion.div>
    </Component>
  );
}
