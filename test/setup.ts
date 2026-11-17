import '@testing-library/jest-dom/vitest';

// Testing Library flushes its own setTimeout(0) under fake timers only when it finds a global `jest`.
// Point that at Vitest so user-event works with vi.useFakeTimers().
(globalThis as any).jest = { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) };
