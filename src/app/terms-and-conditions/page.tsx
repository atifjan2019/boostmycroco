import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Scale } from 'lucide-react';

export const metadata = {
  title: 'Terms & Conditions | BoostMyCroco',
  description: 'Read the terms and conditions for using the BoostMyCroco platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col pt-16 bg-white">
      <Navbar />
      <main className="flex-1">
        <article className="max-w-3xl mx-auto px-6 py-12 md:py-20">
          <header className="mb-12 border-b border-slate-100 pb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Legal</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-3">
              Terms &amp; Conditions
            </h1>
            <p className="text-slate-500 font-medium text-sm">Last updated: April 6, 2026</p>
          </header>

          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using BoostMyCroco (&quot;the Platform&quot;), you agree to be bound by these Terms and Conditions.
              If you do not agree with any part of these terms, you should not use the Platform.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              BoostMyCroco is a community marketplace that connects Crocoblock users with developers and experts.
              The Platform allows users to post requests for help, receive quotes from experts, collaborate on projects, and share tips and tricks.
            </p>

            <h2>3. User Accounts</h2>
            <p>
              To access certain features of the Platform, you must register for an account. You agree to:
            </p>
            <ul>
              <li>Provide accurate and complete information during registration</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>

            <h2>4. User Conduct</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Platform for any illegal or unauthorized purpose</li>
              <li>Post content that is offensive, abusive, defamatory, or infringes on others&rsquo; rights</li>
              <li>Attempt to interfere with the proper functioning of the Platform</li>
              <li>Submit false, misleading, or spam content</li>
              <li>Impersonate another person or entity</li>
              <li>Use automated tools or bots to access the Platform</li>
            </ul>

            <h2>5. Content Ownership</h2>
            <p>
              Users retain ownership of the content they post on the Platform. By posting content, you grant BoostMyCroco
              a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content in connection
              with operating the Platform.
            </p>

            <h2>6. Marketplace Transactions</h2>
            <p>
              BoostMyCroco facilitates connections between users seeking help and experts offering services.
              We are not a party to any agreement between users. All transactions, quotes, and work arrangements
              are solely between the requesting user and the expert.
            </p>
            <ul>
              <li>BoostMyCroco does not guarantee the quality, accuracy, or delivery of any work</li>
              <li>Pricing and payment terms are agreed upon between users</li>
              <li>We encourage users to clearly define project requirements and expectations</li>
            </ul>

            <h2>7. Intellectual Property</h2>
            <p>
              The Platform, its design, features, and content (excluding user-submitted content) are the intellectual
              property of BoostMyCroco and are protected by copyright, trademark, and other intellectual property laws.
            </p>

            <h2>8. Privacy</h2>
            <p>
              Your use of the Platform is also governed by our <a href="/privacy-policy">Privacy Policy</a>,
              which explains how we collect, use, and protect your personal information.
            </p>

            <h2>9. Disclaimer of Warranties</h2>
            <p>
              The Platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied.
              We do not guarantee that the Platform will be uninterrupted, error-free, or secure.
            </p>

            <h2>10. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, BoostMyCroco shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages arising from your use of the Platform, including but not limited
              to loss of profits, data, or goodwill.
            </p>

            <h2>11. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at our sole discretion, without prior notice,
              for conduct that we determine violates these Terms or is harmful to other users, us, or third parties.
            </p>

            <h2>12. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. When we do, we will revise the &quot;Last updated&quot; date at the top
              of this page. Continued use of the Platform after changes constitutes acceptance of the updated Terms.
            </p>

            <h2>13. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact us at{' '}
              <a href="mailto:hello@boostmycroco.com">hello@boostmycroco.com</a> or through our{' '}
              <a href="/contact">Contact page</a>.
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
