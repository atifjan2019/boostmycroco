'use client';

import { AlertCircle } from 'lucide-react';

interface TurnstileWidgetProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  error: string;
  isEnabled: boolean;
}

export default function TurnstileWidget({ containerRef, error, isEnabled }: TurnstileWidgetProps) {
  if (!isEnabled) return null;
  return (
    <div className="space-y-2">
      <div ref={containerRef} />
      {error && (
        <p className="text-red-500 text-xs font-medium flex items-center gap-1 mt-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}
