import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Calendar, ChevronLeft, Code2, HelpCircle } from 'lucide-react';

interface Faq { question: string; answer: string; }
interface Tip { 
  id: number; 
  title: string; 
  content: string; 
  created_at: string; 
  slug: string; 
  featured_image?: string; 
  meta_title?: string; 
  meta_description?: string; 
  schema_markup?: string; 
  image_alt_text?: string; 
  code?: string; 
  text_after_code?: string; 
  faqs?: Faq[]; 
  og_title?: string; 
  og_description?: string; 
  og_image_url?: string; 
  twitter_card_type?: string; 
  twitter_title?: string; 
  twitter_description?: string; 
  canonical_url?: string; 
  author_name?: string; 
}

async function getTip(slug: string): Promise<Tip | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tips-and-tricks/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return data;
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tip = await getTip(slug);
  
  if (!tip) {
    return { title: 'Post not found - BoostMyCroco' };
  }

  const canonicalUrl = tip.canonical_url || `https://www.boostmycroco.com/tips-and-tricks/${slug}`;

  return {
    title: tip.meta_title || `${tip.title} - BoostMyCroco`,
    description: tip.meta_description || 'Check out this tip on BoostMyCroco.',
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: tip.og_title || tip.meta_title || tip.title,
      description: tip.og_description || tip.meta_description || undefined,
      images: tip.og_image_url || tip.featured_image ? [tip.og_image_url || tip.featured_image!] : [],
      type: 'article',
    },
    twitter: {
      card: (tip.twitter_card_type as any) || 'summary_large_image',
      title: tip.twitter_title || tip.og_title || tip.meta_title || tip.title,
      description: tip.twitter_description || tip.og_description || tip.meta_description || undefined,
    },
  };
}

export default async function TipDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tip = await getTip(slug);

  if (!tip) return (
    <div className="min-h-screen flex flex-col pt-16 bg-white">
      <Navbar />
      <div className="flex-1 text-center py-32 text-slate-500 font-medium">Post not found.</div>
      <Footer />
    </div>
  );

  const canonicalUrl = tip.canonical_url || `https://www.boostmycroco.com/tips-and-tricks/${slug}`;

  const schema = tip.schema_markup ? null : {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    },
    "headline": tip.title,
    "image": tip.featured_image ? [tip.featured_image] : [],
    "datePublished": tip.created_at,
    "dateModified": tip.created_at,
    "author": tip.author_name 
      ? { "@type": "Person", "name": tip.author_name }
      : { "@type": "Organization", "name": "BoostMyCroco", "url": "https://www.boostmycroco.com" }
  };

  const processedContent = tip.content?.replace(/<img(.*?)>/gi, (match, attrs) => {
    if (!/alt=["']/i.test(attrs)) {
      return `<img${attrs} alt="${(tip.image_alt_text || tip.title).replace(/"/g, '&quot;')}">`;
    }
    return match;
  });

  return (
    <div className="min-h-screen flex flex-col pt-16 bg-white">
      {tip.schema_markup ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: tip.schema_markup }} />
      ) : (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      )}
      <Navbar />
      <main className="flex-1">
        <article className="max-w-3xl mx-auto px-6 py-8">
          <Link href="/tips-and-tricks" className="inline-flex items-center text-slate-500 text-sm font-semibold hover:text-primary transition-colors mb-6 group">
            <ChevronLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" /> Back to Tips & Tricks
          </Link>

          <header className="mb-8 border-b border-slate-100 pb-8">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-4 tracking-tight text-balance">
              {tip.title}
            </h1>
            <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
              <Calendar className="w-4 h-4" />
              Published on {new Date(tip.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </header>

          {tip.featured_image && (
            <div className="mb-8 rounded-2xl overflow-hidden shadow-lg border border-slate-100">
              <img src={tip.featured_image} alt={tip.image_alt_text || tip.title} fetchPriority="high" decoding="async" className="w-full h-auto object-cover max-h-[500px]" />
            </div>
          )}

          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary hover:prose-a:text-primary-dark prose-img:rounded-xl prose-img:shadow-md">
            <div dangerouslySetInnerHTML={{ __html: processedContent || '' }} />
          </div>

          {tip.code && (
            <div className="mt-12">
              <div className="flex items-center gap-2 mb-4">
                <Code2 className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-slate-900">Code</h2>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <pre className="bg-[#1e1e2f] text-[#a6accd] p-6 overflow-x-auto text-sm leading-relaxed">
                  <code>{tip.code}</code>
                </pre>
              </div>
            </div>
          )}

          {tip.text_after_code && (
            <div className="mt-8 prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary hover:prose-a:text-primary-dark prose-img:rounded-xl prose-img:shadow-md">
              <div dangerouslySetInnerHTML={{ __html: tip.text_after_code }} />
            </div>
          )}

          {tip.faqs && tip.faqs.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center gap-2 mb-6">
                <HelpCircle className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h2>
              </div>
              <div className="space-y-4">
                {tip.faqs.map((faq, i) => (
                  <details key={i} className="group rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
                    <summary className="flex items-center justify-between cursor-pointer px-6 py-4 font-semibold text-slate-800 hover:bg-slate-100 transition-colors">
                      {faq.question}
                      <ChevronLeft className="w-4 h-4 text-slate-400 -rotate-90 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="px-6 pb-5 pt-1 text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
}
