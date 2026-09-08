import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { productService } from '@/services/productService';
import { Product } from '@/lib/products';

const FEATURED_PRODUCTS_ERROR = 'Failed to load featured products. Please try again later.';

export function FeaturedProducts() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const products = await productService.getFeaturedProducts();

        if (!Array.isArray(products) || products.length === 0) {
          console.warn('No featured products found. Products:', products);
          setError(FEATURED_PRODUCTS_ERROR);
          setFeaturedProducts([]);
        } else {
          setFeaturedProducts(products.slice(0, 4));
          setError(null);
        }
      } catch (error) {
        console.error('Failed to fetch featured products:', error);
        setError(FEATURED_PRODUCTS_ERROR);
        setFeaturedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8 text-center">
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-full h-72 bg-secondary/50 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-3">
            Curated For You
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground mb-3">
            Featured Collection
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Discover our handpicked selection of elegant pieces designed to make you feel confident and beautiful.
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="mb-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {error ? (
            <div className="col-span-4 text-center text-destructive bg-destructive/10 p-4">
              {error}
            </div>
          ) : featuredProducts.length > 0 ? (
            featuredProducts.map((product, index) => (
              <ProductCard key={product.productId || product._id || product.id} product={product} index={index} />
            ))
          ) : (
            <div className="col-span-4 text-center text-muted-foreground">
              {FEATURED_PRODUCTS_ERROR}
            </div>
          )}
        </div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link to="/shop">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-10 py-3 border border-foreground text-foreground font-medium text-xs uppercase tracking-wider hover:bg-foreground hover:text-background transition-all duration-300 group"
            >
              View All Products
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
