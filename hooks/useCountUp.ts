import { useEffect, useRef, useState } from 'react';
import { CountUp, CountUpOptions } from 'countup.js';

export interface UseCountUpOptions {
  start?: number;
  end: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  separator?: string;
  decimal?: string;
  useEasing?: boolean;
  easingFn?: (t: number, b: number, c: number, d: number) => number;
  onStart?: () => void;
  onUpdate?: (value: number) => void;
  onComplete?: () => void;
  autoStart?: boolean;
}

/**
 * 숫자 카운팅 애니메이션 훅
 */
export function useCountUp(options: UseCountUpOptions) {
  const {
    start = 0,
    end,
    duration = 2,
    decimals = 2,
    prefix = '',
    suffix = '',
    separator = ',',
    decimal = '.',
    useEasing = true,
    onStart,
    onUpdate,
    onComplete,
    autoStart = true,
  } = options;

  const [value, setValue] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);
  const countUpRef = useRef<CountUp | null>(null);
  const elementRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    // prefers-reduced-motion 확인
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // 애니메이션 비활성화 시 즉시 최종 값 표시
      const formatted = formatNumber(end, decimals, separator, decimal);
      setValue(`${prefix}${formatted}${suffix}`);
      return;
    }

    if (!elementRef.current) {
      // 초기 값 설정
      const formatted = formatNumber(start, decimals, separator, decimal);
      setValue(`${prefix}${formatted}${suffix}`);
      return;
    }

    // CountUp 인스턴스 생성
    const options: CountUpOptions = {
      startVal: start,
      duration: duration,
      decimalPlaces: decimals,
      prefix: prefix,
      suffix: suffix,
      separator: separator,
      decimal: decimal,
      useEasing: useEasing,
      easingFn: (t, b, c, d) => {
        // ease-out
        return c * (1 - Math.pow(1 - t / d, 3)) + b;
      },
    };

    const countUp = new CountUp(elementRef.current, end, options);

    if (!countUp.error) {
      countUpRef.current = countUp;

      if (autoStart) {
        startAnimation();
      }
    } else {
      // 에러 시 최종 값 표시
      const formatted = formatNumber(end, decimals, separator, decimal);
      setValue(`${prefix}${formatted}${suffix}`);
    }

    return () => {
      if (countUpRef.current) {
        countUpRef.current = null;
      }
    };
  }, [end, start, duration, decimals, prefix, suffix, separator, decimal, useEasing, autoStart]);

  const startAnimation = () => {
    if (!countUpRef.current || isAnimating) return;

    setIsAnimating(true);
    onStart?.();

    countUpRef.current.start((instance) => {
      // 업데이트 콜백
      const currentValue = instance.value;
      onUpdate?.(currentValue);
    });

    // 애니메이션 완료 감지
    setTimeout(() => {
      setIsAnimating(false);
      onComplete?.();
    }, duration * 1000);
  };

  const reset = () => {
    if (countUpRef.current) {
      countUpRef.current.reset();
      setIsAnimating(false);
    }
  };

  const update = (newEnd: number) => {
    if (countUpRef.current) {
      countUpRef.current.update(newEnd);
    }
  };

  return {
    value,
    isAnimating,
    elementRef,
    start: startAnimation,
    reset,
    update,
  };
}

/**
 * 숫자 포맷팅 헬퍼 함수
 */
function formatNumber(
  num: number,
  decimals: number,
  separator: string,
  decimal: string
): string {
  const fixed = num.toFixed(decimals);
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return parts.join(decimal);
}

