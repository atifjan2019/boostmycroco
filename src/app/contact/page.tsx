import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, MessageSquare, Send, MapPin, Phone } from 'lucide-react';
import ContactForm from './ContactForm';

export const metadata = {
  title: 'Contact Us | BoostMyCroco',
  description: 'Get in touch with the BoostMyCroco team for any questions or support.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col pt-16">
      <Navbar />
      <main className="flex-1 bg-slate-50 isolate relative">
        {/* Background decorative elements */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,_rgba(22,163,74,0.06)_0%,_transparent_70%)] pointer-events-none" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[500px] bg-[linear-gradient(var(--color-border)_1px,_transparent_1px),_linear-gradient(90deg,_var(--color-border)_1px,_transparent_1px)] bg-[size:48px_48px] opacity-[0.15] [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto mb-16 animate-fadeIn">
            <h1 className="text-4xl md:text-6xl font-black mb-6 text-slate-900 tracking-tight">
              Get in Touch
            </h1>
            <p className="text-lg text-slate-600 font-medium">
              Have questions about BoostMyCroco? Need help with your account or requests? We're here to help you navigate the Crocoblock community.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start max-w-6xl mx-auto">
            {/* Contact Information Cards */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-50 text-primary rounded-2xl flex items-center justify-center mb-6">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Email Us</h3>
                <p className="text-slate-600 mb-4 font-medium">Our friendly team is here to help.</p>
                <a href="mailto:hello@boostmycroco.com" className="text-primary font-bold hover:underline inline-flex items-center gap-2">
                  hello@boostmycroco.com
                </a>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Community Support</h3>
                <p className="text-slate-600 mb-4 font-medium">Join the discussion with other experts.</p>
                <a href="/requests" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-2">
                  Browse Requests →
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3 bg-white p-8 md:p-10 rounded-3xl border border-border shadow-xl shadow-slate-200/40">
              <ContactForm />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
