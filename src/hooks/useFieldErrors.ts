'use client';

import { useCallback, useState } from 'react';
import type { FieldErrors } from '@/lib/form-errors';

/** Per-input validation messages for a form; an input's message goes away when the visitor edits it. */
export function useFieldErrors() {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clearFieldError = useCallback((name: string) => {
    setFieldErrors(prev => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  /** Props for an input: aria-invalid and aria-describedby pointing at its FieldError (id `${id}-error`). */
  const ariaFor = useCallback(
    (name: string, id: string) => ({
      'aria-invalid': fieldErrors[name] ? true : undefined,
      'aria-describedby': fieldErrors[name] ? `${id}-error` : undefined,
    }),
    [fieldErrors],
  );

  return { fieldErrors, setFieldErrors, clearFieldError, ariaFor };
}
