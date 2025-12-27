/**
 * Logger utility - Development environment only
 *
 * Production 환경에서는 로그를 출력하지 않아 성능과 보안을 개선합니다.
 * NODE_ENV가 'production'이 아닐 때만 console에 로그를 출력합니다.
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = {
  /**
   * 일반 정보 로그
   */
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * 경고 로그
   */
  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * 에러 로그
   */
  error: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.error(...args);
    }
  },

  /**
   * 디버그 로그
   */
  debug: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * 정보성 로그
   */
  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};

export default logger;
