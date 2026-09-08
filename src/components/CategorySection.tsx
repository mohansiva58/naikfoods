import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';

const fallbackImage = (label: string) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#02013f"/>
          <stop offset="55%" stop-color="#1b185c"/>
          <stop offset="100%" stop-color="#c8a65a"/>
        </linearGradient>
        <radialGradient id="glow" cx="34%" cy="25%" r="70%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="640" height="640" fill="url(#bg)"/>
      <rect width="640" height="640" fill="url(#glow)"/>
      <circle cx="320" cy="270" r="142" fill="none" stroke="#f6df9f" stroke-width="12" opacity="0.8"/>
      <path d="M210 380c72 54 148 54 220 0" fill="none" stroke="#f6df9f" stroke-width="14" stroke-linecap="round" opacity="0.9"/>
      <text x="320" y="505" text-anchor="middle" fill="#fff7df" font-family="Georgia, serif" font-size="52" font-weight="700">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const categories = [
  { label: 'Snacks & Namkeen', query: 'Snacks & Namkeen', image: '/pics/snacks.png' },
  { label: 'Pickles & Condiments', query: 'Pickles & Condiments', image: '/pics/pickles.png' },
  { label: 'Sweets & Bakery', query: 'Sweets & Bakery', image: '/pics/sweerts.png' },
  { label: 'Dairy & Beverages', query: 'Dairy & Beverages', image: '/pics/beverages.png' },
  { label: 'Mukhvas & Digestives', query: 'Mukhvas & Digestives', image: '/pics/mukhvas.png' },
  { label: 'Confectionery', query: 'Confectionery', image: '/pics/conofictonary.png' },
  { label: 'Spices & Masalas', query: 'Spices & Masalas', image: '/pics/species.png' },
  { label: 'Dry/Instant Grocery', query: 'Dry/Instant Grocery', image: '/pics/daily-grocessries.png' },
];


export function CategorySection() {
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) return;

    const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (shouldReduceMotion) return;

    const interval = window.setInterval(() => {
      api.scrollNext();
    }, 2600);

    return () => window.clearInterval(interval);
  }, [api]);

  return (
    <section className="overflow-hidden bg-white pt-14 pb-6 sm:pt-20 sm:pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center sm:mb-14"
        >
          <h2 className="font-serif text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            Shop By Category
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Regional favourites, made with familiar ingredients and Aaji-approved recipes.
          </p>
        </motion.div>

        <Carousel
          setApi={setApi}
          opts={{
            align: 'start',
            containScroll: 'trimSnaps',
            dragFree: true,
            loop: true,
          }}
          className="relative"
        >
          <CarouselContent className="-ml-4 py-1 sm:-ml-6 lg:justify-center">
            {categories.map((category, index) => (
              <CarouselItem
                key={category.label}
                className="basis-[42%] pl-4 sm:basis-[30%] sm:pl-6 md:basis-[24%] lg:basis-[18%] xl:basis-[16%]"
              >
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: index * 0.06, duration: 0.45 }}
                >
                  <Link
                    to={`/shop?category=${encodeURIComponent(category.query)}`}
                    className="group flex min-h-[170px] flex-col items-center justify-start text-center outline-none sm:min-h-[240px]"
                    aria-label={`Shop ${category.label}`}
                  >
                    <span className="relative block aspect-square w-full max-w-44 overflow-hidden rounded-2xl bg-[#f7f1e5] ring-1 ring-border/40 transition duration-300 group-hover:-translate-y-1 group-hover:ring-primary group-focus-visible:ring-2 group-focus-visible:ring-primary">
                      <img
                        src={category.image}
                        alt={`${category.label} collection`}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = fallbackImage(category.label);
                        }}
                        className="h-full w-full object-contain p-2 transition duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </span>
                    <span className="mt-3 text-[11px] font-medium uppercase tracking-wider text-foreground sm:mt-4 sm:text-sm">
                      {category.label}
                    </span>
                  </Link>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* <CarouselPrevious className="left-2 top-[38%] hidden h-10 w-10 border-border bg-white text-foreground shadow-md hover:bg-secondary disabled:hidden md:flex" />
          <CarouselNext className="right-2 top-[38%] h-10 w-10 border-border bg-white text-foreground shadow-md hover:bg-secondary disabled:hidden" /> */}
        </Carousel>
      </div>
    </section>
  );
}
