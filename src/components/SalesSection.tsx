import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { saleService } from '@/services/saleService';
import { Sale, SaleMode } from '@/services/saleService';
import { Product } from '@/lib/products';

export function SalesSection() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [saleMode, setSaleMode] = useState<SaleMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);
        
        // First, check if there's an active sale mode
        const activeSaleMode = await saleService.getActiveSaleMode();
        setSaleMode(activeSaleMode);
        
        // If there's an active sale mode, fetch active sales
        if (activeSaleMode && activeSaleMode.isActive) {
          const activeSales = await saleService.getActiveSales();
          console.log('Active sales fetched:', activeSales);
          
          if (!Array.isArray(activeSales) || activeSales.length === 0) {
            setSales([]);
            setError('No sale items available at the moment.');
          } else {
            setSales(activeSales.slice(0, 4));
            setError(null);
          }
        } else {
          // No active sale mode, so don't show sales section
          setSales([]);
        }
      } catch (error) {
        console.error('Failed to fetch sales data:', error);
        setError('Failed to load sales. Please try again later.');
        setSales([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  // If no active sale mode, don't render the section
  if (!saleMode?.isActive) {
    return null;
  }

  if (loading) {
    return (
      <section className="py-10 sm:py-12 bg-cream">
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
    <section className="py-10 sm:py-12 bg-cream relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 md:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Flame className="w-5 h-5 text-primary" />
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
              {saleMode?.saleName || 'Special Offer'}
            </p>
            <Flame className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground mb-3">
            Sales & Deals
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            {saleMode?.description || 'Limited time offers on our exclusive collection. Don\'t miss out!'}
          </p>
        </motion.div>

        {/* Sales Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {error ? (
            <div className="col-span-4 text-center text-destructive bg-destructive/10 p-4">
              {error}
            </div>
          ) : sales.length > 0 ? (
            sales.map((sale, index) => (
              <motion.div
                key={sale.saleId}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Convert Sale to Product format for ProductCard */}
                <ProductCard
                  key={sale.saleId}
                  product={{
                    ...sale,
                    productId: sale.saleId,
                    id: sale._id,
                    rating: 0,
                    reviews: 0,
                  } as Product}
                  index={index}
                />
                {/* Discount Badge */}
                {sale.discount && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-charcoal text-white w-12 h-12 flex items-center justify-center font-bold text-xs shadow-lg z-20"
                  >
                    -{sale.discount}%
                  </motion.div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="col-span-4 text-center text-muted-foreground">
              No sale items available right now. Check back soon!
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
