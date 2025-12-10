'use client';

import { ReactNode, RefObject } from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export interface AnimatedCardProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale';
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

/**
 * 카드 전환 애니메이션 컴포넌트
 */
export default function AnimatedCard({
  children,
  delay = 0,
  direction = 'fade',
  className = '',
  hover = true,
  onClick,
}: AnimatedCardProps) {
  const { elementRef, isVisible } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
    delay: delay,
  });

  // prefers-reduced-motion 확인
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 애니메이션 방향별 초기값 및 최종값 설정
  const getAnimationProps = () => {
    if (prefersReducedMotion) {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
      };
    }

    const baseProps = {
      initial: { opacity: 0 },
      animate: isVisible ? { opacity: 1 } : { opacity: 0 },
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1] as const, // ease-out (cubic-bezier)
        delay: delay / 1000,
      },
    };

    switch (direction) {
      case 'up':
        return {
          ...baseProps,
          initial: { ...baseProps.initial, y: 30 },
          animate: isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 },
        };
      case 'down':
        return {
          ...baseProps,
          initial: { ...baseProps.initial, y: -30 },
          animate: isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: -30 },
        };
      case 'left':
        return {
          ...baseProps,
          initial: { ...baseProps.initial, x: 30 },
          animate: isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 },
        };
      case 'right':
        return {
          ...baseProps,
          initial: { ...baseProps.initial, x: -30 },
          animate: isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 },
        };
      case 'scale':
        return {
          ...baseProps,
          initial: { ...baseProps.initial, scale: 0.9 },
          animate: isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 },
        };
      case 'fade':
      default:
        return baseProps;
    }
  };

  const animationProps = getAnimationProps();

  return (
    <motion.div
      ref={elementRef as RefObject<HTMLDivElement>}
      {...animationProps}
      whileHover={hover && !prefersReducedMotion ? { scale: 1.02 } : {}}
      whileTap={onClick && !prefersReducedMotion ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={className}
      style={{
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </motion.div>
  );
}

