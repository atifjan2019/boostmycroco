import { serializeJsonLd } from '@/lib/jsonld';

/** Structured data tag. A native <script> (not next/script) because JSON-LD is data, not code. */
export default function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
