'use client';

import { openConsentBanner } from '@/lib/consent-store';

/** Footer link that reopens the cookie banner so visitors can change their choice. */
export default function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      // Focus the button first (Safari does not focus buttons on click), so focus returns here when the banner closes.
      onClick={(event) => {
        event.currentTarget.focus();
        openConsentBanner();
      }}
      className={className}
    >
      Cookie settings
    </button>
  );
}
