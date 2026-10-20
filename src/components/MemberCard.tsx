import Link from 'next/link';
import type { MemberCardData } from '@/lib/public-api';
import { isoDate, shortDate } from '@/lib/text';

/** Up to two initials for a member without a photo. */
export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  );
}

/** Round photo, or initials on the site's green to blue gradient. */
export function MemberAvatar({
  name,
  avatar,
  size,
  decorative = false,
}: {
  name: string;
  avatar: string | null;
  size: 64 | 96;
  /** True when the name is written next to the picture (then the image needs no alt text of its own). */
  decorative?: boolean;
}) {
  const box = size === 96 ? 'w-24 h-24 text-3xl shadow-lg' : 'w-16 h-16 text-xl shadow-md';
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={decorative ? '' : name}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className={`${box} rounded-full flex-shrink-0 object-cover shadow-slate-200`}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`${box} rounded-full flex-shrink-0 bg-gradient-to-br from-green-500 to-sky-400 flex items-center justify-center font-black text-white shadow-green-500/20`}
    >
      {initials(name)}
    </div>
  );
}

/** A member in the TeamWork list. Only the name is a link (stretched over the card). Server and client safe. */
export default function MemberCard({ member: m }: { member: MemberCardData }) {
  const since = shortDate(m.member_since);
  return (
    <article className="card p-6 text-center relative min-w-0">
      <div className="mx-auto mb-4 w-16">
        <MemberAvatar name={m.name} avatar={m.avatar} size={64} decorative />
      </div>
      <h2 className="font-bold text-slate-800 text-lg mb-1 truncate">
        {m.slug ? (
          <Link
            href={`/teamwork/${m.slug}`}
            className="outline-none hover:text-primary transition-colors after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-primary focus-visible:after:ring-offset-2"
          >
            {m.name}
          </Link>
        ) : (
          m.name
        )}
      </h2>
      <div className="text-slate-500 text-xs font-medium mb-6">
        {since ? (
          <>
            Member since <time dateTime={isoDate(m.member_since)}>{since}</time>
          </>
        ) : (
          'Community member'
        )}
      </div>
      <div className="flex justify-center gap-6 pt-4 border-t border-slate-100">
        {[
          { label: 'Requests', value: m.request_count },
          { label: 'Quotes', value: m.quote_count },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-black text-primary text-xl mb-0.5">{s.value.toLocaleString('en-GB')}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>
    </article>
  );
}
