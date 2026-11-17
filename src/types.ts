import type { ReactNode } from 'react';

/** A school as the search shows it. Apps may pass extra fields; they are handed back on selection. */
export interface School {
  id: string;
  name: string;
  /** 'primary' | 'high' | 'combined', or any other label the app uses. */
  level?: string | null;
  town?: string | null;
  municipality?: string | null;
  province?: string | null;
  verified?: boolean;
}

export type SearchState = 'idle' | 'loading' | 'results' | 'empty' | 'error';

/**
 * Supplies the schools that match the typed text. Called after the search delay with the trimmed
 * text (at least `minChars` long). `signal` is aborted when a newer search replaces this one.
 * Throw (or reject) to show the error message and its "Try again" button.
 */
export type SearchSchools<S extends School = School> = (query: string, options: { signal: AbortSignal }) => Promise<S[]>;

/** A link shown inside a message, e.g. "donate without choosing a school". */
export interface FallbackLink {
  href: string;
  label: ReactNode;
}

/** Every piece of text the search shows, so the app can translate it. */
export interface SchoolSearchMessages {
  label: string;
  placeholder: string;
  submit: string;
  clear: string;
  listLabel: string;
  verified: string;
  loading: ReactNode;
  retry: string;
  /** `retry` is the "Try again" button; `link` is the app's error fallback link, or null. */
  error: (parts: { retry: ReactNode; link: ReactNode | null }) => ReactNode;
  /** `query` is the trimmed search text; `link` is the app's no-results link, or null. */
  empty: (parts: { query: string; link: ReactNode | null }) => ReactNode;
  /** Screen-reader announcements. */
  announceResults: (count: number) => string;
  announceEmpty: string;
  announceError: string;
}
