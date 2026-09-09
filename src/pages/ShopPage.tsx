import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { ProductCardSkeleton } from '@/components/ProductCardSkeleton';
import { sizes, categories, Product } from '@/lib/products';
import { productService } from '@/services/productService';
import { useRealTimeStock } from '@/hooks/useRealTimeStock';
import { SEO } from '@/components/SEO';
import { seoConfig } from '@/lib/seoConfig';

export default function ShopPage() {
  useRealTimeStock();
  const PAGE_SIZE = 12;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('featured');

  const filterParam = searchParams.get('filter');
  const categoryParam = searchParams.get('category');
  const search = searchParams.get('search');

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [categoryParam, filterParam, search]);

  const normalizeProductsResponse = (data: unknown): Product[] => {
    if (Array.isArray(data)) {
      return data as Product[];
    }

    if (data && typeof data === 'object') {
      const response = data as { items?: unknown };
      if (Array.isArray(response.items)) {
        return response.items as Product[];
      }
    }

    return [];
  };

  useEffect(() => {
    const fetchProducts = async (nextPage = 1, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
          setError(null);
        }

        const data = await productService.getPagedProducts({
          page: nextPage,
          limit: PAGE_SIZE,
          category: categoryParam || undefined,
          search: search || undefined,
          sort:
            sortBy === 'price-low'
              ? 'price-asc'
              : sortBy === 'price-high'
                ? 'price-desc'
                : sortBy === 'rating'
                  ? 'rating'
                  : undefined,
          size: selectedSize || undefined,
          filter: filterParam === 'new' ? 'new' : filterParam === 'bestseller' ? 'bestseller' : undefined,
        });

        console.log('Fetched paged products:', data);
        const items = normalizeProductsResponse(data);
        const total = data && typeof data === 'object' && 'total' in data ? Number((data as { total?: number }).total || items.length) : items.length;
        const hasMoreValue = data && typeof data === 'object' && 'hasMore' in data ? Boolean((data as { hasMore?: boolean }).hasMore) : false;
        const pageValue = data && typeof data === 'object' && 'page' in data ? Number((data as { page?: number }).page || nextPage) : nextPage;

        setTotalProducts(total);
        setHasMore(hasMoreValue);
        setPage(pageValue);
        setProducts((current) => (append ? [...current, ...items] : items));
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };
    
    // Sync selectedCategory with URL parameter
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory(null);
    }
    
    setProducts([]);
    setPage(1);
    setHasMore(true);
    fetchProducts(1, false);
  }, [categoryParam, search, sortBy, selectedSize, filterParam]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) {
      return;
    }

    const nextPage = page + 1;
    try {
      setLoadingMore(true);
      const data = await productService.getPagedProducts({
        page: nextPage,
        limit: PAGE_SIZE,
        category: categoryParam || undefined,
        search: search || undefined,
        sort:
          sortBy === 'price-low'
            ? 'price-asc'
            : sortBy === 'price-high'
              ? 'price-desc'
              : sortBy === 'rating'
                ? 'rating'
                : undefined,
        size: selectedSize || undefined,
        filter: filterParam === 'new' ? 'new' : filterParam === 'bestseller' ? 'bestseller' : undefined,
      });

      const items = normalizeProductsResponse(data);
      const total = data && typeof data === 'object' && 'total' in data ? Number((data as { total?: number }).total || items.length) : items.length;
      const hasMoreValue = data && typeof data === 'object' && 'hasMore' in data ? Boolean((data as { hasMore?: boolean }).hasMore) : false;
      const pageValue = data && typeof data === 'object' && 'page' in data ? Number((data as { page?: number }).page || nextPage) : nextPage;

      setProducts((current) => [...current, ...items]);
      setHasMore(hasMoreValue);
      setPage(pageValue);
      setTotalProducts(total);
    } catch (error) {
      console.error('Failed to load more products:', error);
      setError('Failed to load more products. Please try again.');
    } finally {
      setLoadingMore(false);
    }
  };

  const clearFilters = () => {
    setSelectedSize(null);
    setSelectedCategory(null);
    if (search || filterParam || categoryParam) {
      navigate('/shop');
    }
  };

  const activeFiltersCount = (selectedSize ? 1 : 0) + (selectedCategory ? 1 : 0);
  const visibleProducts = Array.isArray(products) ? products : [];
  const pageHeading = search
    ? `Search results for ${search}`
    : filterParam === 'new'
      ? 'New Arrivals'
      : filterParam === 'bestseller'
        ? 'Best Selling Ethnic Wear'
        : categoryParam
          ? categoryParam
          : 'Shop All Collections';
  const shopDescription = search
    ? `Browse Naikfoods   products matching "${search}", including boutique ethnic wear, dresses, sets, and festive fashion.`
    : `Shop ${pageHeading.toLowerCase()} from Naikfoods  . Explore    's ethnic wear, hand-picked boutique outfits, and designer-inspired styles.`;
  const shopPath = categoryParam
    ? `/shop?category=${encodeURIComponent(categoryParam)}`
    : filterParam
      ? `/shop?filter=${encodeURIComponent(filterParam)}`
      : search
        ? `/shop?search=${encodeURIComponent(search)}`
        : '/shop';
  const shopUrl = `${seoConfig.siteUrl}${shopPath}`;
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${pageHeading} | ${seoConfig.siteName}`,
    url: shopUrl,
    description: shopDescription,
    isPartOf: {
      '@type': 'WebSite',
      name: seoConfig.siteName,
      url: seoConfig.siteUrl,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={pageHeading}
        description={shopDescription}
        path={shopPath}
        keywords={[pageHeading, 'shop ethnic wear online', '  boutique collection']}
        schema={collectionSchema}
      />
      <Header />

      <main className="pt-16 lg:pt-20 pb-10">
        {/* Shop Hero Section */}
        <section className="bg-elegant py-5 mb-4 border-b border-border/50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-2xl mx-auto"
            >
              <nav className="flex justify-center items-center space-x-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
                <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                <span>/</span>
                <span className="text-primary font-medium">Shop</span>
              </nav>
              <h1 className="mb-2 font-serif text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
                {search
                  ? `Search: "${search}"`
                  : filterParam === 'new'
                    ? 'New Arrivals'
                    : filterParam === 'bestseller'
                      ? 'On Sale'
                      : categoryParam
                        ? categoryParam
                        : 'Shop All'}
              </h1>
              {/* <div className="w-20 h-1 bg-primary mx-auto mb-6"></div> */}

            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-4">
          {/* Mobile Filter & Sort Bar */}
          <div className="lg:hidden flex items-center justify-between gap-4 mb-4 sticky top-[64px] z-30 bg-background/80 backdrop-blur-md py-2 px-1">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary rounded-full text-sm font-medium border border-border/50"
            >
              <SlidersHorizontal size={16} />
              Filter {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>
            <div className="flex-1 relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 bg-secondary rounded-full text-sm font-medium cursor-pointer focus:outline-none border border-border/50"
              >
                <option value="featured">Sort by: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
            </div>
          </div>

          {/* Desktop Filter/Sort Bar */}
          <div className="hidden lg:flex items-center justify-end gap-4 mb-6 pb-4 border-b border-border/50">
            <div className="flex items-center gap-6">
              <p className="text-sm text-muted-foreground">
                Showing <span className="text-foreground font-semibold">{visibleProducts.length}</span>
                {totalProducts > 0 ? ` of ${totalProducts}` : ''} products
              </p>
              <div className="relative min-w-[200px]">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none px-4 py-2 pr-10 bg-transparent border-b border-foreground/20 text-sm font-medium cursor-pointer focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
                <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Desktop Sidebar Filters */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-24 space-y-8 pr-8">
                {/* Category */}
                <div>
                  <h3 className="font-serif text-xl font-semibold mb-6 pb-2 border-b border-border/50">Categories</h3>
                  <div className="flex flex-col gap-3">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          if (selectedCategory === cat) {
                            setSelectedCategory(null);
                            navigate('/shop');
                          } else {
                            setSelectedCategory(cat);
                            navigate(cat === 'All' ? '/shop' : `/shop?category=${encodeURIComponent(cat)}`);
                          }
                        }}
                        className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all text-left ${selectedCategory === cat || (categoryParam === cat)
                          ? 'bg-primary text-primary-foreground shadow-lg'
                          : 'bg-secondary/50 text-foreground hover:bg-primary/20 hover:text-primary'
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pack quantity */}
                <div>
                  <h3 className="font-serif text-xl font-semibold mb-6 pb-2 border-b border-border/50">Pack Quantity</h3>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                        className={`w-11 h-11 flex items-center justify-center rounded-sm text-xs font-bold transition-all ${selectedSize === size
                          ? 'bg-primary text-primary-foreground shadow-lg scale-110'
                          : 'bg-secondary/50 text-foreground hover:bg-primary/20 hover:text-primary'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-primary text-sm font-semibold hover:gap-3 transition-all pt-4"
                  >
                    <X size={16} />
                    Clear all filters
                  </motion.button>
                )}
              </div>
            </aside>

            {/* Mobile Filter Panel */}
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -300 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -300 }}
                  className="fixed inset-0 z-50 lg:hidden"
                >
                  <div className="absolute inset-0 bg-foreground/50" onClick={() => setIsFilterOpen(false)} />
                  <div className="absolute left-0 top-0 bottom-0 w-80 bg-background p-8 overflow-y-auto shadow-2xl">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                      <h2 className="font-serif text-2xl font-bold">Filters</h2>
                      <button onClick={() => setIsFilterOpen(false)} className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <X size={20} />
                      </button>
                    </div>

                    {/* Category */}
                    <div className="mb-10">
                      <h3 className="font-serif text-lg font-semibold mb-4">Category</h3>
                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => {
                              if (selectedCategory === cat) {
                                setSelectedCategory(null);
                                navigate('/shop');
                              } else {
                                setSelectedCategory(cat);
                                navigate(cat === 'All' ? '/shop' : `/shop?category=${encodeURIComponent(cat)}`);
                              }
                              setIsFilterOpen(false);
                            }}
                            className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all text-left ${selectedCategory === cat || (categoryParam === cat)
                              ? 'bg-primary text-primary-foreground shadow-lg'
                              : 'bg-secondary/30 text-foreground hover:bg-primary/10'
                              }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pack quantity */}
                    <div className="mb-10">
                      <h3 className="font-serif text-lg font-semibold mb-4">Pack Quantity</h3>
                      <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                            className={`w-12 h-12 flex items-center justify-center rounded-sm text-xs font-bold transition-all ${selectedSize === size
                              ? 'bg-primary text-primary-foreground shadow-lg'
                              : 'bg-secondary/30 text-foreground hover:bg-primary/10'
                              }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 sticky bottom-0 bg-background pt-4 border-t border-border mt-auto">
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={() => {
                            clearFilters();
                            setIsFilterOpen(false);
                          }}
                          className="flex-1 px-4 py-3 border border-border text-foreground text-sm font-bold rounded-full"
                        >
                          Reset
                        </button>
                      )}
                      <button
                        onClick={() => setIsFilterOpen(false)}
                        className="flex-[2] btn-primary py-3 rounded-full"
                      >
                        Show Results
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Products Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <ProductCardSkeleton key={i} index={i} />
                  ))}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-24 px-4 bg-secondary/20 rounded-sm border border-border/50">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                    <X size={40} className="mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="font-serif text-2xl font-semibold mb-2">Unable to load products</h3>
                    <p className="text-muted-foreground mb-8 max-w-xs mx-auto">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="btn-primary px-8 py-3 rounded-full"
                    >
                      Retry
                    </button>
                  </motion.div>
                </div>
              ) : visibleProducts.length > 0 ? (
                <>
                <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-3">
                  {visibleProducts.map((product, index) => (
                    <ProductCard key={product.productId || product.id || product._id} product={product} index={index} />
                  ))}
                </div>
                <div className="mt-10 flex justify-center">
                  {hasMore ? (
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="btn-primary px-8 py-3 rounded-full disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loadingMore ? 'Loading more...' : 'Load More Products'}
                    </button>
                  ) : (
                    <p className="text-sm text-muted-foreground">You have reached the end of the catalog.</p>
                  )}
                </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 px-4 bg-secondary/20 rounded-sm border border-border/50">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                  >
                    <X size={40} className="mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="font-serif text-2xl font-semibold mb-2">No items match your selection</h3>
                    <p className="text-muted-foreground mb-8 max-w-xs mx-auto">Try adjusting your filters or search terms to find what you're looking for.</p>
                    <button
                      onClick={clearFilters}
                      className="btn-primary px-8 py-3 rounded-full"
                    >
                      Reset All Filters
                    </button>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
