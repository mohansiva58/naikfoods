import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { productService } from '@/services/productService';
import { Product } from '@/lib/products';

interface ProductSectionProps {
  title: string;
  subtitle: string;
  category?: string;
  filter?: 'new' | 'bestseller';
  featured?: boolean;
}

export function ProductSection({ title, subtitle, category, filter, featured }: ProductSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let data: Product[] = [];
        if (featured) {
          data = await productService.getFeaturedProducts();
        } else {
          data = await productService.getAllProducts({ ...(category ? { category } : {}), ...(filter ? { filter } : {}) });
        }

        if (!Array.isArray(data) || data.length === 0) {
          setError('No products found.');
          setProducts([]);
        } else {
          setProducts(data.slice(0, 4));
          setError(null);
        }
      } catch (error) {
        console.error(`Failed to fetch products for ${title}:`, error);
        setError('Failed to load products. Please try again later.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, featured, filter, title]);

  if (loading) {
    return (
      <section className="py-12 sm:py-16 bg-white border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center mb-10">
            <div className="h-3 w-32 mx-auto mb-3 bg-secondary animate-pulse rounded" />
            <div className="h-8 w-48 mx-auto bg-secondary animate-pulse rounded" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <ProductCardSkeleton key={i} index={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!loading && products.length === 0 && !error) {
     return null;
  }

  return (
    <section className="py-12 sm:py-16 bg-white border-b border-border/50">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-3">
            {subtitle}
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-3">
            {title}
          </h2>
        </motion.div>

        <div className="mb-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {error ? (
            <div className="col-span-4 text-center text-muted-foreground p-4">
              {error}
            </div>
          ) : (
            products.map((product, index) => (
              <ProductCard key={product.productId || product._id || product.id} product={product} index={index} />
            ))
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link to={filter ? `/shop?filter=${filter}` : category ? `/shop?category=${encodeURIComponent(category)}` : "/shop"}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-8 py-3 border border-border text-foreground font-medium text-xs uppercase tracking-wider hover:bg-foreground hover:text-background transition-all duration-300 group"
            >
              View All
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
