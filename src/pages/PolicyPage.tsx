import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { seoConfig } from '@/lib/seoConfig';
import { useEffect } from 'react';
import { 
  Mail, 
  ShieldAlert, 
  Ban, 
  AlertTriangle, 
  Clock, 
  Video, 
  Info, 
  FileText, 
  Lock,
  CreditCard,
  Globe
} from 'lucide-react';

type PolicyPageProps = {
  title: string;
  intro: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
  bulletList?: boolean;
};

const getSectionIcon = (heading: string) => {
  const h = heading.toLowerCase();
  if (h.includes('return') || h.includes('exchange')) return <ShieldAlert className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />;
  if (h.includes('cancel')) return <Ban className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />;
  if (h.includes('damage') && !h.includes('report')) return <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />;
  if (h.includes('report') || h.includes('time') || h.includes('hour')) return <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />;
  if (h.includes('video') || h.includes('parcel')) return <Video className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />;
  if (h.includes('collect') || h.includes('information')) return <Lock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />;
  if (h.includes('use') || h.includes('how we')) return <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />;
  if (h.includes('sharing') || h.includes('data')) return <Globe className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />;
  if (h.includes('pricing') || h.includes('payment') || h.includes('product')) return <CreditCard className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />;
  return <FileText className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />;
};

export function PolicyPage({ title, intro, sections, bulletList = false }: PolicyPageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const policyPath =
    title === 'Privacy Policy'
      ? '/privacy-policy'
      : title === 'Terms & Conditions'
        ? '/terms-and-conditions'
        : title === 'Refund / Return Policy'
          ? '/refund-return-policy'
          : undefined;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${title} | ${seoConfig.siteName}`}
        description={intro}
        path={policyPath}
        keywords={[title, 'Naikfoods   policies', 'boutique shopping policy']}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: `${title} | ${seoConfig.siteName}`,
          url: policyPath ? `${seoConfig.siteUrl}${policyPath}` : seoConfig.siteUrl,
          description: intro,
        }}
      />
      <Header />
      <main className="pt-24 pb-16">
        <section className="container mx-auto max-w-4xl px-4">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-blue-600">
            Naikfoods
          </p>
          <h1 className="font-serif text-4xl font-bold text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            {intro}
          </p>

          {bulletList ? (
            <article className="mt-10 rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">
              <ul className="space-y-3 text-sm leading-7 text-muted-foreground sm:text-base">
                {sections.map((section) => (
                  <li key={section.heading} className="flex gap-3">
                    <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                    <span>
                      <strong className="font-semibold text-foreground">{section.heading}:</strong>{' '}
                      {section.body}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ) : (
            <div className="mt-10 space-y-6">
              {sections.map((section) => (
                <article key={section.heading} className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex gap-4">
                    {getSectionIcon(section.heading)}
                    <div>
                      <h2 className="mb-2 text-xl font-semibold text-foreground">
                        {section.heading}
                      </h2>
                      <p className="leading-relaxed text-muted-foreground text-sm sm:text-base">
                        {section.body}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Help Banner */}
          <div className="mt-12 rounded-xl border border-blue-100 bg-blue-50/30 p-6 md:p-8 text-center">
            <h3 className="text-lg font-semibold text-foreground">Need Assistance?</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
              If you have any questions about our policy, need to report a damaged product, or want to submit an unboxing video, please contact our customer support team.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm font-medium">
              {/* <a href="tel:+919730046247" className="flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-blue-600 transition-colors hover:bg-blue-50">
                <Phone className="h-4 w-4" />
                <span>9032624257</span>
              </a> */}
              <a href="mailto:naikfoods001@gmail.com" className="flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-blue-600 transition-colors hover:bg-blue-50">
                <Mail className="h-4 w-4" />
                <span>naikfoods001@gmail.com</span>
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      intro="We respect your privacy and protect the personal information you share with us while browsing, shopping, or contacting Naikfoods."
      sections={[
        {
          heading: 'Information We Collect',
          body: 'We collect details needed to process your order, including your name, email address, phone number, shipping address, cart details, and payment confirmation status. Payment card or UPI details are handled securely by Razorpay and are not stored on our servers.',
        },
        {
          heading: 'How We Use Information',
          body: 'Your information is used to confirm orders, arrange delivery, provide customer support, prevent fraud, and improve your shopping experience.',
        },
        {
          heading: 'Data Sharing',
          body: 'We share only the required information with payment, delivery, hosting, and support partners to complete your order. We do not sell customer data.',
        },
        {
          heading: 'Contact',
          body: 'For privacy questions, contact us at naikfoods001@gmail.com .',
        },
      ]}
    />
  );
}

export function TermsPage() {
  return (
    <PolicyPage
      title="Terms & Conditions"
      intro="By using Naikfoods, you agree to the terms below for browsing, ordering, payment, and customer support."
      bulletList
      sections={[
        {
          heading: 'Orders',
          body: 'Orders are confirmed only after successful payment and availability verification. We may contact you if product details, stock, or delivery information needs confirmation.',
        },
        {
          heading: 'Pricing & Payments',
          body: 'All prices are shown in INR. Online payments are processed through Razorpay. We do not store sensitive payment credentials.',
        },
        {
          heading: 'Product Information',
          body: 'We make every effort to show accurate product images, prices, and descriptions. Slight color or fit variation can occur due to lighting, screen settings, and garment styling.',
        },
        {
          heading: 'Use Of Website',
          body: 'Customers must provide accurate contact and shipping information. Any misuse, fraudulent transaction, or abusive activity may lead to order cancellation.',
        },
      ]}
    />
  );
}

export function RefundPolicyPage() {
  return (
    <PolicyPage
      title="Refund / Return Policy"
      intro="Review our policy before placing an order. We want customers to make informed purchases."
      bulletList
      sections={[
        {
          heading: 'No Returns / No Exchanges',
          body: 'We do not accept returns or exchanges for issues related to satisfaction, color variation, or size, as all product details are clearly mentioned in the product description. Kindly review all details carefully before placing your order.',
        },
        {
          heading: 'Order Cancellation',
          body: 'Orders once placed cannot be cancelled.',
        },
        {
          heading: 'Damaged Products',
          body: 'Returns or exchanges will be accepted only if a damaged product is received.',
        },
        {
          heading: 'Reporting Damage',
          body: 'Any damage claim must be reported within 24–48 hours of receiving the product.',
        },
        {
          heading: 'Mandatory Parcel Opening Video',
          body: 'A clear 360° parcel opening video is mandatory to process any damage claim.',
        },
      ]}
    />
  );
}

export function ContactPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`Contact ${seoConfig.siteName}`}
        description="Contact Naikfoods   for boutique ethnic wear orders, customer care, shipping questions, and support."
        path="/contact"
        keywords={['contact Naikfoods  ', 'Naikfoods boutique customer care', 'Ameenpur boutique']}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: `Contact ${seoConfig.siteName}`,
          url: `${seoConfig.siteUrl}/contact`,
          description: 'Customer care and location details for Naikfoods  .',
          mainEntity: {
            '@type': 'ClothingStore',
            name: seoConfig.siteName,
            email: 'naikfoods001@gmail.com',
            address: {
              '@type': 'PostalAddress',
              // streetAddress: 'T.C. 22/2463-1',
              addressLocality: 'Ameenpur, Miyapur',
              addressRegion: 'Telangana',
              addressCountry: 'IN',
            },
          },
        }}
      />
      <Header />
      <main className="pt-24 pb-16">
        <section className="container mx-auto max-w-4xl px-4">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-10">
              <div className="flex flex-col">
                <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
                  Naikfoods
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  +91 9730046247
                </p>

                {/* Address Box */}
                <div className="mt-8 rounded-lg border border-border bg-secondary/50 p-6">
                  <p className="text-sm leading-relaxed text-foreground">
                    <br />
                    Telangana
                  </p>
                </div>

                {/* Contact Info Box */}
                <div className="mt-6 flex-1 rounded-lg border border-border p-6 text-sm">
                  <div className="grid grid-cols-[120px_1fr] gap-4 sm:grid-cols-[140px_1fr]">

                    {/* <div className="text-muted-foreground">Customer Care</div> */}
                    {/* <div className="space-y-1"> */}
                      {/* <p>Phone: <a href="tel:+919730046247" className="text-blue-600 hover:text-blue-700 hover:underline">9032624257</a></p> */}
                      {/* <p>WhatsApp: <a href="https://wa.me/919730046247" className="text-blue-600 hover:text-blue-700 hover:underline">9032624257</a></p> */}
                      {/* <p>Email: <a href="mailto:naikfoods001@gmail.com" className="text-blue-600 hover:text-blue-700 hover:underline">naikfoods001@gmail.com</a></p>
                    </div> */}

                    {/* <div className="text-muted-foreground mt-4">Opening Hours</div>
                    <div className="mt-4">
                      <p>Everyday, 9:00 AM – 6:00 PM</p>
                    </div> */}

                  

                    <div className="text-muted-foreground mt-4">Careers</div>
                    <div className="mt-4">
                      <p>Email: <a href="mailto:naikfoods001@gmail.com" className="text-blue-600 hover:text-blue-700 hover:underline">naikfoods001@gmail.com</a></p>
                    </div>

                  </div>

                  {/* Buttons */}
                  <div className="mt-8 flex flex-wrap gap-3">
                    {/* <a href="tel:+919730046247" className="rounded-full bg-secondary px-5 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200">
                      Call Customer Care
                    </a> */}
                    <a href="mailto:naikfoods001@gmail.com" className="rounded-full bg-secondary px-5 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200">
                      Email Us
                    </a>
                  </div>
                </div>
              </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
