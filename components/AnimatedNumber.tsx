'use client';

import { useEffect, useRef, RefObject } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { CountUp, CountUpOptions } from 'countup.js';

export interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  formatValue?: (value: number) => string;
  autoStart?: boolean;
}

/**
 * 숫자 카운팅 애니메이션 컴포넌트
 */
export default function AnimatedNumber({
  value,
  decimals = 2,
  prefix = '',
  suffix = '',
  duration = 2,
  className = '',
  formatValue,
  autoStart = true,
}: AnimatedNumberProps) {
  const { elementRef, isVisible } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
  });
  const countUpRef = useRef<CountUp | null>(null);

  useEffect(() => {
    // prefers-reduced-motion 확인
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion || !elementRef.current || !isVisible || !autoStart) {
      return;
    }

    const options: CountUpOptions = {
      startVal: 0,
      duration: duration,
      decimalPlaces: decimals,
      prefix: prefix,
      suffix: suffix,
      separator: ',',
      decimal: '.',
      useEasing: true,
      easingFn: (t, b, c, d) => {
        // ease-out
        return c * (1 - Math.pow(1 - t / d, 3)) + b;
      },
    };

    const countUp = new CountUp(elementRef.current, value, options);
    
    if (!countUp.error) {
      countUpRef.current = countUp;
      countUp.start();
    }

    return () => {
      if (countUpRef.current) {
        countUpRef.current = null;
      }
    };
  }, [value, decimals, prefix, suffix, duration, isVisible, autoStart]);

  // 커스텀 포맷팅이 있는 경우
  if (formatValue) {
    return (
      <span ref={elementRef as RefObject<HTMLSpanElement>} className={className}>
        {isVisible ? formatValue(value) : formatValue(0)}
      </span>
    );
  }

  return (
    <span
      ref={elementRef as RefObject<HTMLSpanElement>}
      className={className}
    />
  );
}
