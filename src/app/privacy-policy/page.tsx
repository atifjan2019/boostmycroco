import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Shield } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | BoostMyCroco',
  description: 'Learn how BoostMyCroco collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col pt-16 bg-white">
      <Navbar />
      <main className="flex-1">
        <article className="max-w-3xl mx-auto px-6 py-12 md:py-20">
          <header className="mb-12 border-b border-slate-100 pb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Legal</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-3">
              Privacy Policy
            </h1>
            <p className="text-slate-500 font-medium text-sm">Last updated: April 6, 2026</p>
          </header>

          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary">
            <h2>1. Introduction</h2>
            <p>
              At BoostMyCroco (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;), your privacy is important to us. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you visit our Platform at{' '}
              <a href="https://www.boostmycroco.com">www.boostmycroco.com</a>.
            </p>

            <h2>2. Information We Collect</h2>
            <h3>Personal Information</h3>
            <p>When you register for an account or use certain features, we may collect:</p>
            <ul>
              <li>Name and display name</li>
              <li>Email address</li>
              <li>Phone/WhatsApp number (if provided)</li>
              <li>Country of residence</li>
              <li>Profile information you choose to share</li>
            </ul>

            <h3>Automatically Collected Information</h3>
            <p>When you access the Platform, we automatically collect:</p>
            <ul>
              <li>Device information (browser type, operating system)</li>
              <li>IP address and general location data</li>
              <li>Usage data (pages visited, time spent, interactions)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, operate, and maintain the Platform</li>
              <li>Create and manage your account</li>
              <li>Facilitate connections between users and experts</li>
              <li>Send you notifications about your requests and quotes</li>
              <li>Respond to your comments, questions, and support requests</li>
              <li>Improve our Platform and develop new features</li>
              <li>Detect, prevent, and address technical issues and abuse</li>
              <li>Send marketing communications (with your consent)</li>
            </ul>

            <h2>4. Information Sharing</h2>
            <p>We may share your information in the following situations:</p>
            <ul>
              <li><strong>With other users:</strong> Your public profile information, requests, and quotes are visible to other Platform users</li>
              <li><strong>Service providers:</strong> We may share data with third-party services that help us operate the Platform (hosting, analytics, email)</li>
              <li><strong>Legal obligations:</strong> If required by law, regulation, or legal process</li>
              <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
            <p>We do not sell your personal information to third parties.</p>

            <h2>5. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to enhance your browsing experience, analyze usage patterns,
              and serve relevant content. You can control cookie preferences through your browser settings.
            </p>
            <p>We use the following types of cookies:</p>
            <ul>
              <li><strong>Essential cookies:</strong> Required for the Platform to function properly</li>
              <li><strong>Analytics cookies:</strong> Help us understand how visitors interact with the Platform</li>
              <li><strong>Functional cookies:</strong> Remember your preferences and settings</li>
            </ul>

            <h2>6. Third-Party Services</h2>
            <p>Our Platform may integrate with third-party services including:</p>
            <ul>
              <li><strong>Smartlook:</strong> Session recording and analytics</li>
              <li><strong>Google AdSense:</strong> Advertisement delivery</li>
              <li><strong>Cloudflare Turnstile:</strong> Bot protection and CAPTCHA verification</li>
            </ul>
            <p>These services have their own privacy policies governing the use of your information.</p>

            <h2>7. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your personal information.
              However, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee
              absolute security.
            </p>

            <h2>8. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide you services.
              We may also retain certain information to comply with legal obligations, resolve disputes, and enforce our agreements.
            </p>

            <h2>9. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul>
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent for data processing</li>
              <li>Export your data in a portable format</li>
              <li>Object to certain types of processing</li>
            </ul>
            <p>
              To exercise these rights, please contact us at{' '}
              <a href="mailto:hello@boostmycroco.com">hello@boostmycroco.com</a>.
            </p>

            <h2>10. Children&rsquo;s Privacy</h2>
            <p>
              The Platform is not intended for users under the age of 16. We do not knowingly collect personal information
              from children. If you become aware that a child has provided us with personal information, please contact us.
            </p>

            <h2>11. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence.
              We ensure appropriate safeguards are in place for such transfers in accordance with applicable data protection laws.
            </p>

            <h2>12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of changes by updating the
              &quot;Last updated&quot; date at the top of this page. We encourage you to review this policy periodically.
            </p>

            <h2>13. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <ul>
              <li>Email: <a href="mailto:hello@boostmycroco.com">hello@boostmycroco.com</a></li>
              <li>Contact form: <a href="/contact">boostmycroco.com/contact</a></li>
            </ul>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
