import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Code2, ExternalLink, Globe2, Home, Instagram, Layers3, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { seoConfig } from '@/lib/seoConfig';

const developerProfile = {
  brand: 'Sybarites.Tech',
  logo: '/image%20copy.png',
  website: 'https://sybarites.tech',
  instagramUrl: 'https://www.instagram.com/sybarites.tech',
  whatsappUrl: 'https://wa.me/919701630276',
  developers: [
    {
      name: 'Mohan Siva',
      url: 'https://mohansiva.tech',
    },
    {
      name: 'Sujay Babu',
      url: 'https://sujaybabu.vercel.app/',
    },
  ],
};

const services = [
  'Business websites and landing pages',
  'E-commerce website with payment gateways',
  'Mobile app development for customer and business workflows',
  'Admin dashboards and custom web applications',
  'Logo design and brand identity basics',
  'RAG agents and AI-powered workflow automation',
  // 'SEO-ready pages, responsive UI, and performance-focused builds',
  // 'API integration, payment setup, and production deployment',
];

const stats = [
  {
    value: '15+',
    label: 'Clients',
  },
  {
    value: 'Multiple',
    label: 'Domain work',
  },
  {
    value: 'Code',
    label: 'Implemented',
  },
];

export default function DevelopedBySybaritesPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  const pagePath = '/developedby-sybarites';
  const description =
    'Sybarites Tech builds professional websites and custom applications using advanced technologies, code implementation, and flexible solutions based on each client budget range and requirements.';

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Developed by Sybarites Tech | ${seoConfig.siteName}`,
      url: `${seoConfig.siteUrl}${pagePath}`,
      description,
      isPartOf: {
        '@type': 'WebSite',
        name: seoConfig.siteName,
        url: seoConfig.siteUrl,
      },
      about: {
        '@type': 'Organization',
        name: developerProfile.brand,
        url: developerProfile.website,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: developerProfile.brand,
      url: developerProfile.website,
      logo: `${seoConfig.siteUrl}${developerProfile.logo}`,
      sameAs: [
        developerProfile.instagramUrl,
        developerProfile.whatsappUrl,
        ...developerProfile.developers.map((developer) => developer.url),
      ],
      description,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-950">
      <SEO
        title="Developed by Sybarites Tech"
        description={description}
        path={pagePath}
        image={developerProfile.logo}
        keywords={[
          'Sybarites Tech',
          'developed by Sybarites',
          'web development India',
          'custom website development',
          'ecommerce website developer',
          'advanced technology web development',
        ]}
        schema={schema}
      />

      <main className="flex min-h-screen items-center px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/"
          aria-label="Return to home"
          className="fixed left-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-950 shadow-sm transition-colors hover:border-[#02013f] hover:text-[#02013f] focus:outline-none focus:ring-2 focus:ring-[#02013f]/30"
        >
          <Home size={20} />
        </Link>
        <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex min-h-[460px] flex-col justify-between rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div>
              <img
                src={developerProfile.logo}
                alt="Sybarites Tech logo"
                className="h-16 w-16 rounded-md border border-slate-200 object-contain p-2"
              />

              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Developed by
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Sybarites.Tech
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
                We build clean, scalable digital products based on your budget range and
                requirements, using advanced technologies with real code implementation.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <a
                  href={developerProfile.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Sybarites Tech Instagram"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 bg-[radial-gradient(circle_at_30%_110%,#fdf497_0%,#fdf497_12%,#fd5949_34%,#d6249f_58%,#285AEB_100%)]"
                >
                  <Instagram size={18} />
                </a>
                <a
                  href={developerProfile.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Sybarites Tech WhatsApp"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:bg-emerald-700"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.993L2 22l5.13-1.346a9.945 9.945 0 0 0 4.881 1.279h.005c5.505 0 9.989-4.478 9.99-9.985A9.983 9.983 0 0 0 12.012 2zm5.726 14.127c-.246.696-1.428 1.258-1.957 1.346-.48.08-1.107.133-3.176-.72-2.646-1.09-4.33-3.79-4.46-3.96-.13-.172-1.05-1.398-1.05-2.673 0-1.274.66-1.902.893-2.147.23-.245.508-.306.677-.306.17 0 .341.002.49.009.155.008.363-.06.568.437.21.51.717 1.748.778 1.874.06.126.1.272.016.438-.083.166-.124.272-.248.417-.124.145-.26.324-.372.437-.125.126-.255.263-.11.513.146.25.648 1.07 1.39 1.733.957.854 1.76 1.118 2.01 1.243.25.125.395.105.543-.066.147-.172.63-.733.798-.983.168-.25.337-.21.567-.124.23.087 1.458.687 1.71.812.252.125.42.187.482.294.062.106.062.616-.184 1.312z" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="mt-8">
              <div className="grid grid-cols-3 gap-3 border-y border-slate-200 py-5">
                {stats.map((item) => (
                  <div key={item.label}>
                    <p className="text-2xl font-semibold text-slate-950">{item.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                  </div>
                ))}
              </div>

              <p className="mt-5 flex items-center gap-2 text-sm font-medium text-slate-700">
                <ShieldCheck size={18} className="text-[#02013f]" />
                Trusted by 15+ clients across multiple domains.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#02013f] text-white">
                    <Layers3 size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      What we provide
                    </p>
                    <h2 className="text-2xl font-semibold text-slate-950">Simple, professional builds</h2>
                  </div>
                </div>

                <ul className="space-y-3">
                  {services.map((service) => (
                    <li key={service} className="flex gap-3 text-sm leading-6 text-slate-700">
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#02013f]" />
                      <span>{service}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7 rounded-md border border-slate-200 bg-slate-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <Code2 size={18} className="text-[#02013f]" />
                    Built with modern stacks
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    React, TypeScript, APIs, payments, SEO, hosting, dashboards, and deployment
                    workflows tailored to the project.
                  </p>
                </div>
              </div>

              <aside className="flex flex-col justify-between rounded-md bg-slate-950 p-5 text-white">
                <div>
                  <Sparkles size={22} className="text-slate-300" />
                  <h3 className="mt-4 text-xl font-semibold">Developers</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Reach the team behind the implementation.
                  </p>
                </div>

                <div className="mt-8 space-y-3">
                  {developerProfile.developers.map((developer) => (
                    <a
                      key={developer.url}
                      href={developer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-white/15 px-3 py-2 text-sm font-medium text-white transition-colors hover:border-white/35 hover:bg-white/10"
                    >
                      <span>{developer.name}</span>
                      <ExternalLink size={15} />
                    </a>
                  ))}
                  <a
                    href={developerProfile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-200"
                  >
                    <span>Sybarites Tech</span>
                    <Globe2 size={15} />
                  </a>
                </div>
              </aside>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
