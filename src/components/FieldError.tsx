import { AlertCircle } from 'lucide-react';

/** A validation message under one input. Give the input aria-describedby={id} so screen readers read it. */
export default function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-red-500 text-xs font-medium flex items-center gap-1 mt-1.5">
      <AlertCircle className="w-3 h-3 shrink-0" /> {message}
    </p>
  );
}
