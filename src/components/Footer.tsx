import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t border-border mt-24 pt-12 pb-6 bg-bg-card">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <div className="font-extrabold text-lg mb-3">
            <Image src="/colorlogo.png" alt="BoostMyCroco" width={160} height={40} className="object-contain h-8 w-auto" />
          </div>
          <p className="text-text-muted text-sm leading-relaxed">
            The community marketplace for Crocoblock developers. Post requests, get expert quotes.
          </p>
        </div>
        <div>
          <div className="font-semibold mb-4 text-text-muted text-xs uppercase tracking-wider">Platform</div>
          {[['Requests', '/requests'], ['TeamWork', '/teamwork'], ['Make a Request', '/make-a-request'], ['Contact Us', '/contact']].map(([label, href]) => (
            <Link key={href} href={href} className="block text-text-muted text-sm mb-2 hover:text-primary transition-colors">
              {label}
            </Link>
          ))}
        </div>
        <div>
          <div className="font-semibold mb-4 text-text-muted text-xs uppercase tracking-wider">Community</div>
          {[['Tips & Tricks', '/tips-and-tricks'], ['TeamWork Directory', '/teamwork'], ['Roadmap', '/roadmap']].map(([label, href]) => (
            <Link key={href} href={href} className="block text-text-muted text-sm mb-2 hover:text-primary transition-colors">
              {label}
            </Link>
          ))}
        </div>
        <div>
          <div className="font-semibold mb-4 text-text-muted text-xs uppercase tracking-wider">Legal</div>
          {[['Terms & Conditions', '/terms-and-conditions'], ['Privacy Policy', '/privacy-policy'], ['Sitemap', '/sitemap-page']].map(([label, href]) => (
            <Link key={href} href={href} className="block text-text-muted text-sm mb-2 hover:text-primary transition-colors">
              {label}
            </Link>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-8 pt-6 border-t border-border flex justify-between items-center flex-wrap gap-4">
        <p className="text-text-subtle text-xs">© {new Date().getFullYear()} BoostMyCroco. All rights reserved.</p>
        <p className="text-text-subtle text-xs">Built with ❤️ for the Crocoblock community</p>
      </div>
    </footer>
  );
}
