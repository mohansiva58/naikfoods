import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { SalesSection } from '@/components/SalesSection';
import { ProductSection } from '@/components/ProductSection';
import { CategorySection } from '@/components/CategorySection';
import { Footer } from '@/components/Footer';
import { Marquee } from '@/components/Marquee';
import { AuthModal } from '@/components/AuthModal';
import { SEO } from '@/components/SEO';
import { seoConfig } from '@/lib/seoConfig';

const Index = () => {
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const st = location.state as { requireAuth?: boolean } | null;
    if (st?.requireAuth) {
      setShowAuthModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="    Naikfoods"
        description="Discover Naikfoods  , a boutique collection of    's ethnic wear including frocks, A-line dresses, 2-piece sets, 3-piece sets, anarkalis, lehenga sets, and hand-picked festive styles."
        path="/"
        keywords={['  collection', 'new arrivals', 'best selling ethnic wear', '  boutique online']}
        schema={[
          {
            '@context': 'https://schema.org',
            '@type': 'ClothingStore',
            name: seoConfig.siteName,
            url: seoConfig.siteUrl,
            image: seoConfig.defaultImage,
            logo: `${seoConfig.siteUrl}/favicon.ico`,
            description: seoConfig.defaultDescription,
            email: 'naikfoods001@gmail.com',
            address: {
              '@type': 'PostalAddress',
              // streetAddress: 'T.C. 22/2463-1',
              addressLocality: 'Ameenpur, Miyapur',
              addressRegion: 'Telangana',
              addressCountry: 'IN',
            },
            areaServed: 'IN',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: seoConfig.siteName,
            url: seoConfig.siteUrl,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${seoConfig.siteUrl}/shop?search={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          },
        ]}
      />
      <Header />
      <main>
        <HeroSection />
        <Marquee />
        <CategorySection />
        <SalesSection />
        {/* <ProductSection title="Dinu's Collections" subtitle="Exclusive Designer Wear" category="Dinu's Collections" /> */}
        {/* <ProductSection title="  Collection" subtitle="Handcrafted Luxury" featured={true} /> */}
        <ProductSection title="New Arrivals" subtitle="Latest Trends" filter="new" />
        <ProductSection title="On Sale" subtitle="Most Loved Pieces" filter="bestseller" />

      </main>
      <Footer />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Index;
