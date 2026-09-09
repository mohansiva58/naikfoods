import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import logo from '@/assets/logo.png';
import { SEO } from '@/components/SEO';
import { seoConfig } from '@/lib/seoConfig';
import admin from '@/assets/image.png';
import abt from '@/assets/abt.png';
import about from '@/assets/about.png';
import { Check, Leaf, Lightbulb, Send, Utensils } from 'lucide-react';

const processSteps = [
    {
        icon: Lightbulb,
        title: 'Sourcing Regional Recipes',
        description: 'Collaborating with local artisans from Konkan to Vidarbha.',
    },
    {
        icon: Leaf,
        title: 'Ingredient Selection',
        description: 'Only the finest local ingredients for peak freshness.',
    },
    {
        icon: Utensils,
        title: 'Preparation with Care',
        description: 'Traditional methods with modern hygiene standards.',
    },
    {
        icon: Send,
        title: 'Curation & Delivery',
        description: 'Freshly packed in Pune for your doorstep delivery.',
    },
    {
        icon: Check,
        title: 'Quality Assurance',
        description: 'Strict checks for taste, hygiene, and packaging.',
    },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background">
            <SEO
                title="About Naikfoods  "
                description="Learn the story of Naikfoods  , a boutique fashion brand founded   to bring  , hand-picked, designer-inspired ethnic wear to  ."
                path="/about"
                image="/image.png"
                keywords={['about Naikfoods  ', 'Alekhya boutique', '  fashion brand']}
                schema={{
                    '@context': 'https://schema.org',
                    '@type': 'AboutPage',
                    name: `About ${seoConfig.siteName}`,
                    url: `${seoConfig.siteUrl}/about`,
                    description: 'The story, values, and boutique fashion approach behind Naikfoods  .',
                }}
            />
            <Header />
            <main className="pt-24 pb-16">
                <section className="py-12 px-6 md:px-12 lg:px-24 bg-secondary rounded-3xl mx-4 md:mx-8 font-sans">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="relative"
                            >
                                <div className="relative">
                                    <div className="aspect-[4/5] rounded-[60px] overflow-hidden">
                                        <img
                                            src={admin}
                                            alt="Brand story"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Floating accent image */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.6, delay: 0.3 }}
                                        className="absolute -bottom-8 -right-8 w-40 h-52 rounded-3xl overflow-hidden shadow-2xl border-4 border-background"
                                    >
                                        <img
                                            
                                            src={abt}
                                            alt="Detail"
                                            className="w-full h-full object-cover"
                                        />

                                    </motion.div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="lg:pl-12"
                            >
                                <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-6 block">
                                    Our Story
                                </span>

                                <h2 className="text-4xl md:text-5xl font-light text-foreground leading-tight mb-8">
                                    From Seeds to,{' '}
                                    <span>Sustenance</span>
                                </h2>

                                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg mb-8">
Rooted in a legacy that began in 1938 with Late Shri Anant Balkrishna Naik, the Naik family has spent over eight decades building trust across agriculture, hospitality, and lifestyle sectors. From the foundation of Naik Seeds to ventures like Sushil Lodging, Sushil Dining Hall, and Naik Landscape Services, the journey has always been driven by quality, service, and innovation.
                                </p>

                                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg mb-10">
                            Continuing this legacy, Naik Foods, founded in 2025 by Mrs. Priya Chandan Naik, brings together wholesome and high-quality food products under one trusted name — carrying forward generations of dedication, purity, and excellence.

</p>

                                <div className="flex flex-wrap gap-12">
                                    <div>
                                        <span className="text-4xl font-light text-foreground">1938</span>
                                        <p className="text-muted-foreground text-sm mt-1">Legacy Began</p>
                                    </div>
                                    <div>
                                        <span className="text-4xl font-light text-foreground">75+</span>
                                        <p className="text-muted-foreground text-sm mt-1">Years of Trust</p>
                                    </div>
                                    <div>
                                        <span className="text-4xl font-light text-foreground">2025</span>
                                        <p className="text-muted-foreground text-sm mt-1">Naik Foods A new chapter begins.</p>
                                    </div>
                                    <div>
                                        <span className="text-4xl font-light text-foreground">04</span>
                                        <p className="text-muted-foreground text-sm mt-1">Family Ventures</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                <section className="px-6 py-20 md:px-12 lg:px-24 lg:py-28">
                    <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-24">
                        <motion.div
                            initial={{ opacity: 0, x: -40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="mb-6 block text-xs font-semibold uppercase tracking-[0.25em] text-[#62bd45]">
                                How We Work
                            </span>
                            <h2 className="mb-8 max-w-lg text-5xl font-semibold leading-[0.98] text-foreground md:text-6xl">
                                From Farm to{' '}
                                <span className="text-[#62bd45]">Your Kitchen</span>
                            </h2>
                            <p className="mb-12 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                                Our process is a labor of love, ensuring that the soul of Maharashtrian cuisine remains untampered and authentic.
                            </p>

                            <div className="relative aspect-[1.35/1] overflow-hidden rounded-[2rem] shadow-[0_20px_50px_-25px_rgba(0,0,0,0.35)]">
                                <img
                                    src={about}
                                    alt="Naik Foods traditional snacks and pickles"
                                    className="h-full w-full object-cover"
                                />
                                <a
                                    href="/shop"
                                    className="absolute bottom-6 left-6 inline-flex items-center gap-4 rounded-2xl bg-white px-7 py-4 text-base font-semibold text-foreground shadow-lg transition-transform hover:-translate-y-1"
                                >
                                    Learn More
                                    <span aria-hidden="true" className="text-2xl leading-none">-&gt;</span>
                                </a>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="relative"
                        >
                            <div className="absolute bottom-10 left-8 top-10 border-l-2 border-dashed border-[#62bd45]/25 md:left-9" aria-hidden="true" />
                            <div className="relative space-y-10 md:space-y-12">
                                {processSteps.map(({ icon: Icon, title, description }, index) => (
                                    <motion.div
                                        key={title}
                                        initial={{ opacity: 0, y: 18 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: '-40px' }}
                                        transition={{ duration: 0.5, delay: index * 0.08 }}
                                        className="relative flex gap-7 md:gap-8"
                                    >
                                        <div className="z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#62bd45] bg-background text-[#62bd45] shadow-[0_5px_16px_-8px_rgba(98,189,69,0.8)] md:h-[4.5rem] md:w-[4.5rem]">
                                            <Icon size={25} strokeWidth={2} />
                                        </div>
                                        <div className="pt-1">
                                            <h3 className="mb-2 text-2xl font-semibold leading-tight text-foreground md:text-[1.55rem]">
                                                {title}
                                            </h3>
                                            <p className="max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
                                                {description}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
