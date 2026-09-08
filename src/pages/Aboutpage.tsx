import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import logo from '@/assets/logo.png';
import { SEO } from '@/components/SEO';
import { seoConfig } from '@/lib/seoConfig';
import admin from '@/assets/image.png';
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
                                            
                                            src={logo}
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
            </main>
            <Footer />
        </div>
    );
}
