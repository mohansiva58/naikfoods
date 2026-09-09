import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  ShieldCheck,
  Truck,
  ChevronLeft,
  Star,
  Sparkles,
  CreditCard,
  Loader2,
} from 'lucide-react';

import { toast } from 'sonner';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { ProductGallery } from '@/components/ProductGallery';
import { AuthModal } from '@/components/AuthModal';

import { Product, ColorVariant } from '@/lib/products';

import { useCartStore, getProductId, getCartItemImage } from '@/lib/cart';
import { useWishlistStore } from '@/lib/wishlist';

import { useAuth } from '@/hooks/useAuth';
import { useRealTimeStock } from '@/hooks/useRealTimeStock';

import { productService } from '@/services/productService';
import { saleService } from '@/services/saleService';
import { cartService } from '@/services/cartService';
import { applyServerCartToLocal, notifyCartChangedAcrossTabs } from '@/lib/cartServerSync';
import { preloadCheckoutPage } from '@/lib/preloadRoutes';
import { Skeleton } from '@/components/ui/skeleton';
import { SEO } from '@/components/SEO';
import { seoConfig } from '@/lib/seoConfig';

import logo from '@/assets/logo.png';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  useRealTimeStock();

  const [selectedImage, setSelectedImage] = useState<string | undefined>();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeCounts, setSizeCounts] = useState<Record<string, number>>({});
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [pendingBuyNowPayload, setPendingBuyNowPayload] = useState<NonNullable<ReturnType<typeof createBuyNowPayload>> | null>(null);

  // Fetch product using React Query
  const { data: product, isLoading: loading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        return await productService.getProductById(id);
      } catch (err: unknown) {
        const error = err as { response?: { status?: number } };
        if (error?.response?.status === 404) {
          const sale = await saleService.getSaleById(id);
          return {
            ...sale,
            productId: sale.saleId || sale._id,
            id: sale._id,
          } as Product;
        }
        throw err;
      }
    },
    enabled: !!id,
  });

  // Fetch recent products
  const { data: recentProducts = [] } = useQuery({
    queryKey: ['products', 'recent', id],
    queryFn: async () => {
      const response = await productService.getPagedProducts({ page: 1, limit: 8 });
      const currentProductIds = new Set([id, product?.productId, product?.id, product?._id].filter(Boolean));
      return response.items
        .filter((p: Product) => !currentProductIds.has(p.productId) && !currentProductIds.has(p.id) && !currentProductIds.has(p._id))
        .slice(0, 4);
    },
    enabled: !!product,
  });

  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const isWishlisted = isInWishlist(id || '');

  const [pendingAuthAction, setPendingAuthAction] = useState<'add' | 'buy' | null>(null);

  const updateBulkSizeCount = (size: string, delta: number) => {
    setSizeCounts((current) => {
      const nextValue = Math.max(0, (current[size] || 0) + delta);
      return { ...current, [size]: nextValue };
    });
  };

  const clearBulkSizeCounts = () => {
    setSizeCounts({});
  };

  const getSelectedSizeEntries = () => {
    if (!product) return [] as Array<{ size: string; quantity: number }>;

    const sizeList = Array.isArray(product.sizes)
      ? product.sizes
      : String(product.sizes || '').split(',').map((size) => size.trim()).filter(Boolean);
    const bulkEntries = sizeList
      .map((size) => ({ size, quantity: sizeCounts[size] || 0 }))
      .filter((entry) => entry.quantity > 0);

    if (bulkEntries.length > 0) {
      return bulkEntries;
    }

    if (!selectedSize) {
      return [] as Array<{ size: string; quantity: number }>;
    }

    return [{ size: selectedSize, quantity }];
  };

  const getActiveColorVariant = () => {
    return product?.colors?.find((c) => c.colorName === selectedColor);
  };

  const getCartSelectionPayload = () => {
    if (!product) return null;

    const selections = getSelectedSizeEntries();
    if (selections.length === 0) return null;

    const activeColorVariant = getActiveColorVariant();
    const cartImage = selectedImage || activeColorVariant?.image?.url || product.image;

    return {
      selections,
      cartImage,
      productId: getProductId(product),
      color: selectedColor || undefined,
    };
  };

  const createBuyNowPayload = () => {
    const payload = getCartSelectionPayload();
    if (!payload) return null;

    return {
      ...payload,
      cartItems: [...useCartStore.getState().items],
      totalAvailableStock,
    };
  };

  const getAvailableForSize = (size: string) => {
    if (!product) return undefined;

    return product.sizeCounts && Object.prototype.hasOwnProperty.call(product.sizeCounts, size)
      ? Math.max(0, Number(product.sizeCounts[size] || 0) - Number(product.sizeReservedCounts?.[size] || 0))
      : product.stock;
  };

  const getExistingCartQuantity = (
    payload: NonNullable<ReturnType<typeof getCartSelectionPayload>>,
    size: string
  ) => {
    return useCartStore.getState().items.reduce((sum, item) => {
      return getProductId(item.product) === payload.productId &&
        item.size === size &&
        item.color === payload.color &&
        getCartItemImage(item) === payload.cartImage
        ? sum + item.quantity
        : sum;
    }, 0);
  };

  const validateCartSelectionStock = (
    payload: NonNullable<ReturnType<typeof getCartSelectionPayload>>
  ) => {
    for (const selection of payload.selections) {
      const availableForSize = getAvailableForSize(selection.size);
      const existingQuantity = getExistingCartQuantity(payload, selection.size);

      if (availableForSize !== undefined && existingQuantity + selection.quantity > availableForSize) {
        toast.error(`Only ${availableForSize} item${availableForSize === 1 ? '' : 's'} available for size ${selection.size}.`);
        return false;
      }
    }

    return true;
  };

  const getOptimisticCartProduct = (selection: { size: string; quantity: number }) => {
    if (!product) return null;

    return {
      ...product,
      sizeCounts: product.sizeCounts ?? { [selection.size]: product.stock ?? selection.quantity },
      sizeReservedCounts: product.sizeReservedCounts ?? { [selection.size]: 0 },
    };
  };

  const addSelectionsToLocalCart = (
    payloadInput?: NonNullable<ReturnType<typeof createBuyNowPayload>>
  ) => {
    if (!product) return false;

    const payload = payloadInput ?? getCartSelectionPayload();
    if (!payload) {
      toast.error('Please select a size');
      return false;
    }

    const store = useCartStore.getState();

    if (!validateCartSelectionStock(payload)) return false;

    const successfulAdditions: Array<{
      selection: { size: string; quantity: number };
      previousQuantity: number;
    }> = [];

    for (const selection of payload.selections) {
      const optimisticProduct = getOptimisticCartProduct(selection);
      if (!optimisticProduct) return false;

      const previousQuantity = getExistingCartQuantity(payload, selection.size);

      const added = store.addItem(
        optimisticProduct,
        selection.size,
        selection.quantity,
        payload.cartImage,
        payload.color
      );

      if (!added) {
        for (const addedSelection of successfulAdditions.reverse()) {
          store.removeItem(payload.productId, addedSelection.selection.size, payload.cartImage, payload.color);
          if (addedSelection.previousQuantity > 0) {
            store.addItem(
              getOptimisticCartProduct({
                size: addedSelection.selection.size,
                quantity: addedSelection.previousQuantity,
              }) || product,
              addedSelection.selection.size,
              addedSelection.previousQuantity,
              payload.cartImage,
              payload.color
            );
          }
        }
        notifyCartChangedAcrossTabs();
        toast.error(`Size ${selection.size} is currently out of stock.`);
        return false;
      }

      successfulAdditions.push({ selection, previousQuantity });
    }

    notifyCartChangedAcrossTabs();
    return true;
  };

  const addSelectionsToCart = async (options?: { skipAuthCheck?: boolean }) => {
    if (!product) return false;

    const payload = getCartSelectionPayload();
    if (!payload) {
      toast.error('Please select a size');
      return false;
    }

    if (!validateCartSelectionStock(payload)) return false;

    if (!options?.skipAuthCheck && !isAuthenticated) {
      return false;
    }

    try {
      const cart = await cartService.addToCart(
        payload.productId,
        payload.selections[0].size,
        payload.selections[0].quantity,
        payload.cartImage,
        payload.color,
        payload.selections
      );
      applyServerCartToLocal(cart);
      notifyCartChangedAcrossTabs();

      // Invalidate product cache so stock display reflects the updated reserved count
      // The server broadcasts a stockUpdate socket event, but invalidating ensures
      // the next render fetches fresh data even if the socket event is delayed.
      queryClient.invalidateQueries({ queryKey: ['product', id] });

      return true;
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { error?: string; code?: string } } };
      const serverMsg = apiError.response?.data?.error;
      const code = apiError.response?.data?.code;

      if (code === 'OUT_OF_STOCK') {
        toast.error('This item just sold out.');
      } else if (code === 'MAX_QUANTITY_REACHED') {
        toast.error(serverMsg || 'You already have the maximum available quantity in your cart.');
      } else if (code === 'INSUFFICIENT_STOCK') {
        toast.error(serverMsg || 'Not enough stock available.');
      } else {
        toast.error(serverMsg || 'Failed to add item to cart. Please try again.');
      }
      return false;
    }
  };

  // Update selected color/image when product loads
  useEffect(() => {
    if (product) {
      if (product.colors && product.colors.length > 0 && !selectedColor) {
        setSelectedColor(product.colors[0].colorName);
        setSelectedImage(product.colors[0].image?.url || product.image);
      } else if (!selectedImage) {
        setSelectedImage(product.image);
      }
    }
  }, [product, selectedColor, selectedImage]);

  useEffect(() => {
    // Reset selections when product ID changes
    setSelectedSize(null);
    setSelectedColor(null);
    setSelectedImage(undefined);
    setQuantity(1);
    setSizeCounts({});
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (isAuthenticated) {
      void preloadCheckoutPage();
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8 pt-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Skeleton className="aspect-[3/4] rounded-3xl" />
            <div className="space-y-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <div className="space-y-4">
                <Skeleton className="h-6 w-20" />
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-16 rounded-full" />)}
                </div>
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-14 flex-1 rounded-full" />
                <Skeleton className="h-14 flex-1 rounded-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* NOT FOUND */

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <SEO
          title="Product Not Found"
          description="This Naikfoods   product could not be found. Browse the shop for available boutique ethnic wear and   collections."
          noIndex
        />
        <Header />

        <div className="flex h-screen flex-col items-center justify-center">
          <h2 className="mb-3 text-2xl font-semibold">
            Product Not Found
          </h2>

          <Link
            to="/shop"
            className="text-black underline"
          >
            Back to Shop
          </Link>
        </div>

        <Footer />
      </div>
    );
  }

  /* GALLERY */

  const galleryImages = (() => {
    const images: string[] = [];

    const activeColorVariant = product.colors?.find(
      (c) => c.colorName === selectedColor
    );

    if (activeColorVariant) {
      if (activeColorVariant.image?.url?.trim()) {
        images.push(activeColorVariant.image.url);
      }
      if (Array.isArray(activeColorVariant.images)) {
        activeColorVariant.images.forEach((img) => {
          if (img?.url?.trim()) {
            images.push(img.url);
          }
        });
      }
    } else {
      if (product.image?.trim()) {
        images.push(product.image);
      }

      if (
        Array.isArray(product.images) &&
        product.images.length > 0
      ) {
        const additional = product.images.filter(
          (img: string) =>
            img?.trim() && img !== product.image
        );

        images.push(...additional);
      }
    }

    return [...new Set(images)].filter(Boolean);
  })();

  const availableSizes = Array.isArray(product.sizes)
    ? product.sizes
    : String(product.sizes || '').split(',').map((size) => size.trim()).filter(Boolean);
  const sizeAvailability = product.sizeCounts || {};
  const sizeReserved = product.sizeReservedCounts || {};

  // Available stock per size: Total - Reserved
   const getAvailableStock = (size: string) => {
     const total = sizeAvailability[size] || 0;
     const reserved = sizeReserved[size] || 0;
     return Math.max(0, total - reserved);
   };

   const totalAvailableStock = Object.keys(sizeAvailability).length > 0
    ? Object.keys(sizeAvailability).reduce((acc, size) => acc + getAvailableStock(size), 0)
    : Math.max(0, (product.stock || 0) - Object.values(sizeReserved).reduce((a, b) => a + b, 0));

  const buyNowSelectionPayload = getCartSelectionPayload();
  const buyNowAlreadyInCart = buyNowSelectionPayload
    ? buyNowSelectionPayload.selections.every((sel) =>
        useCartStore.getState().items.some(
          (item) =>
            getProductId(item.product) === buyNowSelectionPayload.productId &&
            item.size === sel.size &&
            (item.color || undefined) === (buyNowSelectionPayload.color || undefined) &&
            item.quantity >= sel.quantity
        )
      )
    : false;

  /* ADD TO CART */

  const handleAddToCart = async () => {
    if (isBuyingNow) {
      return;
    }

    if (totalAvailableStock <= 0) {
      toast.error('Out of stock');
      return;
    }

    const selections = getSelectedSizeEntries();
    if (selections.length === 0) {
      toast.error('Please select a size');
      return;
    }

    if (!isAuthenticated) {
      setPendingAuthAction('add');
      setShowAuthModal(true);
      return;
    }

    const success = await addSelectionsToCart();

    if (success) {
      toast.success('Added to cart');
    }
  };

  /* BUY NOW */

  const performBuyNow = async (
    payload: NonNullable<ReturnType<typeof createBuyNowPayload>>,
    options?: { skipAuthCheck?: boolean }
  ) => {
    if (payload.selections.length === 0) {
      toast.error('Please select a size');
      return;
    }

    const productId = payload.productId;
    const cartItems = payload.cartItems;

    // If the item (same product + size + color) is already in cart with sufficient quantity,
    // skip trying to add again — just go straight to checkout.
    const alreadyInCart = payload.selections.every(sel =>
      cartItems.some(
        item =>
          getProductId(item.product) === productId &&
          item.size === sel.size &&
          (item.color || undefined) === (payload.color || undefined) &&
          item.quantity >= sel.quantity
      )
    );

    if (alreadyInCart) {
      // Item already held — just go to checkout directly.
      useCartStore.getState().clearReservations();
      navigate('/checkout', { state: { buyNowFastPath: true } });
      return;
    }

    useCartStore.getState().clearReservations();
    if (options?.skipAuthCheck || isAuthenticated) {
      const addedLocally = addSelectionsToLocalCart(payload);
      if (addedLocally) {
        navigate('/checkout', { state: { buyNowFastPath: true } });
      }
      return;
    }

    const success = await addSelectionsToCart(options);
    if (success) {
      navigate('/checkout');
    }
  };

  const runBuyNow = async (
    payload: NonNullable<ReturnType<typeof createBuyNowPayload>>,
    options?: { skipAuthCheck?: boolean }
  ) => {
    setIsBuyingNow(true);

    try {
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      await performBuyNow(payload, options);
    } finally {
      setIsBuyingNow(false);
    }
  };

  const handleBuyNow = async () => {
    if (isBuyingNow) {
      return;
    }

    const payload = createBuyNowPayload();
    if (!payload) {
      toast.error('Please select a size');
      return;
    }

    if (!isAuthenticated) {
      setPendingAuthAction('buy');
      setPendingBuyNowPayload(payload);
      setShowAuthModal(true);
      return;
    }

    const cartItems = payload.cartItems;
    const alreadyInCart = payload.selections.every(sel =>
      cartItems.some(
        item =>
          getProductId(item.product) === payload.productId &&
          item.size === sel.size &&
          (item.color || undefined) === (payload.color || undefined) &&
          item.quantity >= sel.quantity
      )
    );

    // Only block on out-of-stock if the item is NOT already in cart
    if (!alreadyInCart && payload.totalAvailableStock <= 0) {
      toast.error('This item is sold out.');
      return;
    }

    await runBuyNow(payload);
  };

  /* WISHLIST */

  const handleWishlistToggle = () => {
    const productId =
      product.productId ||
      product.id ||
      product._id ||
      '';

    if (isWishlisted) {
      removeFromWishlist(productId);

      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);

      toast.success('Added to wishlist');
    }
  };

  const productId = product.productId || product.id || product._id || id || '';
  const productPath = `/product/${encodeURIComponent(productId)}`;
  const productImage = selectedImage || product.image || galleryImages[0] || seoConfig.defaultImage;
  const schemaImages = [...new Set([...galleryImages, productImage].filter(Boolean))];
  const productDescription =
    product.description || `${product.name} from Naikfoods      's ethnic wear collection.`;
  const productSchema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: schemaImages.length > 0 ? schemaImages : [seoConfig.defaultImage],
      description: productDescription,
      sku: productId,
      brand: {
        '@type': 'Brand',
        name: seoConfig.siteName,
      },
      category: product.category,
      offers: {
        '@type': 'Offer',
        url: `${seoConfig.siteUrl}${productPath}`,
        priceCurrency: 'INR',
        price: product.price,
        availability: totalAvailableStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
      },
      aggregateRating: product.rating && product.reviews
        ? {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviews,
          }
        : undefined,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: seoConfig.siteUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Shop',
          item: `${seoConfig.siteUrl}/shop`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: product.name,
          item: `${seoConfig.siteUrl}${productPath}`,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={product.name}
        description={productDescription}
        path={productPath}
        image={productImage}
        type="product"
        keywords={[product.name, product.category, 'buy ethnic wear online', 'Naikfoods   product']}
        schema={productSchema}
      />
      <Header />

      <main className="bg-white pt-16 lg:pt-20 pb-8">
        <div className="mx-auto max-w-7xl px-4">
          {/* BREADCRUMB */}

          <div className="mb-5">
            <Link
              to="/shop"
              className="
                inline-flex
                items-center
                gap-2
                text-sm
                font-medium
                text-neutral-500
                transition-colors
                hover:text-black
              "
            >
              <ChevronLeft size={18} />
              Back to Shop
            </Link>
          </div>

          {/* MAIN GRID */}

          <div
            className="
              grid
              gap-6
              lg:grid-cols-[0.9fr_1fr]
            "
          >
            {/* GALLERY */}

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="
                relative
                lg:sticky
                lg:top-24
              "
            >
              <div
                className="
                  overflow-hidden
                  rounded-[32px]
                  border
                  border-neutral-200
                  bg-neutral-50
                "
              >
                <ProductGallery
                  images={galleryImages}
                  productName={product.name}
                  selectedImage={selectedImage}
                  onSelectedImageChange={(img) =>
                    setSelectedImage(img)
                  }
                />
              </div>

              {/* BADGES */}

              <div className="absolute left-4 top-4 flex flex-col gap-2">
                {(product.isNew ||
                  product.newArrival) && (
                    <span
                      className="
                      rounded-full
                      bg-black
                      px-4
                      py-1.5
                      text-[10px]
                      font-semibold
                      tracking-[0.2em]
                      text-white
                    "
                    >
                      NEW
                    </span>
                  )}
              </div>

              {/* WISHLIST */}

              <button
                onClick={handleWishlistToggle}
                className="
                  absolute
                  right-4
                  top-4
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-full
                  bg-white/90
                  shadow-lg
                  backdrop-blur
                "
              >
                <Heart
                  size={20}
                  className={
                    isWishlisted
                      ? 'fill-red-500 text-red-500'
                      : 'text-black'
                  }
                />
              </button>
            </motion.div>

            {/* INFO SECTION */}

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              {/* CATEGORY */}

              <div>
                <p
                  className="
                    mb-2
                    text-xs
                    font-medium
                    uppercase
                    tracking-[0.3em]
                    text-neutral-400
                  "
                >
                  {product.category}
                </p>

                {/* TITLE */}

                <h1
                  className="
                    text-3xl
                    font-semibold
                    leading-tight
                    tracking-tight
                    text-black
                    sm:text-4xl
                  "
                >
                  {product.name}
                </h1>

                {/* RATING */}

                <div className="mt-3 flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={
                          i <
                            Math.floor(
                              product.rating || 5
                            )
                            ? 'fill-black text-black'
                            : 'text-neutral-300'
                        }
                      />
                    ))}
                  </div>

                  <span className="text-sm text-neutral-500">
                      Quality
                  </span>
                </div>

                {/* PRICE */}

                <div className="mt-5 flex items-center gap-3 flex-wrap">
                  <span
                    className="
                      text-3xl
                      font-bold
                      tracking-tight
                      text-black
                    "
                  >
                    ₹
                    {product.price.toLocaleString()}
                  </span>

                  {product.originalPrice && (
                    <>
                      <span
                        className="
                          text-lg
                          text-neutral-400
                          line-through
                        "
                      >
                        ₹
                        {product.originalPrice.toLocaleString()}
                      </span>

                      <span
                        className="
                          rounded-full
                          bg-red-50
                          px-3
                          py-1
                          text-xs
                          font-semibold
                          text-red-500
                        "
                      >
                        {Math.round(
                          (1 -
                            product.price /
                            product.originalPrice) *
                          100
                        )}
                        % OFF
                      </span>
                    </>
                  )}
                </div>

                {/* STOCK */}

                {product.stock !== undefined && (
                  <div className="mt-4">
                    <div
                      className={`
                        inline-flex
                        items-center
                        gap-2
                        rounded-full
                        border
                        px-4
                        py-2
                        text-sm
                        font-medium
                        transition-all
                        duration-300
                        ${totalAvailableStock > 5
                          ? 'border-green-200 bg-green-50 text-green-700'
                          : totalAvailableStock > 0
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-red-200 bg-red-50 text-red-700'
                        }
                      `}
                    >
                      <div className={`h-2 w-2 rounded-full ${totalAvailableStock > 5 ? 'bg-green-500 animate-pulse' : totalAvailableStock > 0 ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />

                      {totalAvailableStock > 5
                        ? 'In Stock'
                        : totalAvailableStock > 0
                        ? `Only ${totalAvailableStock} left`
                        : 'Sold Out'}
                    </div>
                  </div>
                )}
              </div>

              {/* DETAILS CARD */}

              <div
                className="
                  rounded-[28px]
                  border
                  border-neutral-200
                  bg-neutral-50
                  p-5
                "
              >
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles size={16} />

                  <h2
                    className="
                      text-sm
                      font-semibold
                      uppercase
                      tracking-[0.2em]
                    "
                  >
                    Product Details
                  </h2>
                </div>

                <p
                  className="
                    text-sm
                    leading-7
                    text-neutral-600
                  "
                >
                  {product.description}
                </p>
              </div>

              {/* PACK QUANTITY */}

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">
                    Pack Quantity
                  </h3>

                  {/* <button
                    className="
                      text-sm
                      text-neutral-500
                    "
                  >
                    Size Guide
                  </button> */}
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => {
                    const remaining = getAvailableStock(size);
                    const isOutOfStock = remaining <= 0;

                    return (
                    <motion.button
                      key={`${size}-${remaining}`}
                      initial={false}
                      animate={remaining === 0 ? {
                        backgroundColor: ["#ffffff", "#fee2e2", "#f9fafb"],
                        transition: { duration: 0.8 }
                      } : {}}
                      disabled={isOutOfStock || isBuyingNow}
                      onClick={() => {
                        if (isBuyingNow) return;
                        setSelectedSize(size);
                        // Reset quantity to 1 when switching size so it never exceeds new size's stock
                        setQuantity(1);
                      }}
                      className={`
                        h-11
                        min-w-[84px]
                        rounded-full
                        border
                        px-4
                        text-sm
                        font-medium
                        transition-all
                        relative
                        overflow-hidden
                        ${isOutOfStock
                          ? 'cursor-not-allowed border-neutral-200 bg-neutral-50 text-neutral-400'
                          : selectedSize === size
                            ? 'border-black bg-black text-white'
                            : 'border-neutral-300 bg-white text-black hover:border-black'
                        }
                      `}
                    >
                      {/* Strike-through for Out of Stock */}
                      <AnimatePresence>
                        {isOutOfStock && (
                          <motion.div 
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: "140%", opacity: 1 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                          >
                            <div className="w-full h-[2px] bg-red-500 -rotate-[35deg] transform origin-center shadow-sm" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      <span className="flex items-center gap-2 relative z-10">
                        <span>{size}</span>
                        <motion.span 
                          key={remaining}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`text-[10px] ${isOutOfStock ? 'text-neutral-400' : 'opacity-75'}`}
                        >
                          {isOutOfStock ? 'Out' : remaining <= 3 ? `${remaining} left` : ''}
                        </motion.span>
                      </span>
                    </motion.button>
                  )})}
                </div>

             
              </div>

              {/* COLORS */}

              {product.colors &&
                product.colors.length > 0 && (
                  <div>
                    <h3 className="mb-3 font-semibold">
                      Select Color
                    </h3>

                    <div className="flex flex-wrap gap-4">
                      {product.colors.map(
                        (
                          color: ColorVariant,
                          idx: number
                        ) => (
                          <button
                            key={idx}
                            disabled={isBuyingNow}
                            onClick={() => {
                              if (isBuyingNow) return;
                              setSelectedColor(
                                color.colorName
                              );

                              setSelectedImage(
                                color.image?.url
                              );
                            }}
                            className="flex flex-col items-center gap-2"
                          >
                            <div
                              className={`
                              h-10
                              w-10
                              rounded-full
                              border-2
                              ${selectedColor ===
                                  color.colorName
                                  ? 'border-black'
                                  : 'border-neutral-300'
                                }
                            `}
                              style={{
                                backgroundColor:
                                  color.colorCode ||
                                  '#ddd',
                              }}
                            />

                            <span className="text-xs text-neutral-500">
                              {color.colorName}
                            </span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* QUANTITY */}

              <div>
                <h3 className="mb-3 font-semibold">
                  Quantity
                </h3>
                <p className="mb-3 text-xs text-neutral-500">
                  Use this for a single selected size. Bulk counts above will override this section.
                </p>

                <div
                  className="
                    inline-flex
                    items-center
                    rounded-full
                    border
                    border-neutral-200
                    bg-neutral-50
                    p-1
                  "
                >
                  <button
                    onClick={() =>
                    {
                      if (isBuyingNow) return;
                      setQuantity(
                        Math.max(
                          1,
                          quantity - 1
                        )
                      );
                    }
                    }
                    disabled={isBuyingNow}
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                    "
                  >
                    <Minus size={16} />
                  </button>

                  <span className="w-10 text-center font-semibold">
                    {quantity}
                  </span>

                  <button
                    onClick={() => {
                      if (isBuyingNow) return;
                      const maxQty = selectedSize ? getAvailableStock(selectedSize) : 0;
                      if (maxQty > 0 && quantity >= maxQty) {
                        toast.error(`Only ${maxQty} item${maxQty === 1 ? '' : 's'} available for size ${selectedSize}.`);
                        return;
                      }
                      setQuantity(quantity + 1);
                    }}
                    disabled={
                      isBuyingNow ||
                      !selectedSize ||
                      (selectedSize ? quantity >= getAvailableStock(selectedSize) : false)
                    }
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      disabled:opacity-40
                      disabled:cursor-not-allowed
                    "
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* ACTION BUTTONS */}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={totalAvailableStock <= 0 || isBuyingNow}
                  className="
                    flex
                    flex-1
                    items-center
                    justify-center
                    gap-2
                    rounded-full
                    border
                    border-neutral-200
                    bg-white
                    py-4
                    font-semibold
                    text-black
                    transition-all
                    hover:bg-neutral-50
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >
                  <ShoppingBag size={18} />
                  Add To Cart
                </button>

                <button
                  onClick={handleBuyNow}
                  onFocus={() => void preloadCheckoutPage()}
                  onMouseEnter={() => void preloadCheckoutPage()}
                  onTouchStart={() => void preloadCheckoutPage()}
                  disabled={(totalAvailableStock <= 0 && !buyNowAlreadyInCart) || isBuyingNow}
                  className="
                    flex-1
                    rounded-full
                    bg-black
                    py-4
                    font-semibold
                    text-white
                    transition-all
                    hover:opacity-90
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {isBuyingNow ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      Adding...
                    </span>
                  ) : (
                    'Buy Now'
                  )}
                </button>
              </div>

              {/* FEATURES */}

              <div
                className="
                  grid
                  grid-cols-3
                  gap-3
                  border-t
                  border-neutral-200
                  pt-5
                "
              >
                <div className="text-center">
                  <Truck
                    className="mx-auto mb-2"
                    size={20}
                  />

                  <p className="text-xs text-neutral-500">
                    Fast Shipping
                  </p>
                </div>

                <div className="text-center">
                  <CreditCard
                    className="mx-auto mb-2"
                    size={20}
                  />

                  <p className="text-xs text-neutral-500">
                    Secure Payment
                  </p>
                </div>

                <div className="text-center">
                  <ShieldCheck
                    className="mx-auto mb-2"
                    size={20}
                  />

                  <p className="text-xs text-neutral-500">
                      Quality
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RECENT PRODUCTS */}

          {recentProducts.length > 0 && (
            <section className="mt-12">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p
                    className="
                      mb-2
                      text-xs
                      font-medium
                      uppercase
                      tracking-[0.25em]
                      text-neutral-400
                    "
                  >
                    Recently Posted
                  </p>

                <h2
                  className="
                    text-2xl
                    font-semibold
                    tracking-tight
                    text-black
                  "
                >
                  Latest Arrivals
                </h2>
                </div>

                <Link
                  to="/shop?filter=new"
                  className="
                    hidden
                    text-sm
                    font-medium
                    text-neutral-500
                    transition-colors
                    hover:text-black
                    sm:inline
                  "
                >
                  View All
                </Link>
              </div>

              <div
                className="
                  grid
                  grid-cols-2
                  gap-3
                  sm:grid-cols-3
                  lg:grid-cols-4
                "
              >
                {recentProducts.map(
                  (product, index) => (
                    <ProductCard
                      key={
                        product.productId ||
                        product.id ||
                        product._id
                      }
                      product={product}
                      index={index}
                    />
                  )
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* AUTH MODAL */}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingAuthAction(null);
          setPendingBuyNowPayload(null);
        }}
        onSuccess={async () => {
          setShowAuthModal(false);
          if (!product) return;

          if (pendingAuthAction === 'buy') {
            setPendingAuthAction(null);
            const payload = pendingBuyNowPayload;
            setPendingBuyNowPayload(null);
            if (payload) {
              await runBuyNow(payload, { skipAuthCheck: true });
            }
            return;
          }

          if (pendingAuthAction === 'add') {
            setPendingAuthAction(null);
            const success = await addSelectionsToCart({ skipAuthCheck: true });
            if (success) {
              toast.success('Added to cart');
            }
          }
        }}
      />

      <Footer />
    </div>
  );
}
