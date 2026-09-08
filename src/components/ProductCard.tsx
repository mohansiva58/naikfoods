import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

import { Product } from '@/lib/products';
import { useWishlistStore } from '@/lib/wishlist';
import logo from '@/assets/logo.png';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({
  product,
  index = 0,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const { addItem, removeItem, isInWishlist } =
    useWishlistStore();

  const productId =
    product.productId || product._id || product.id || '';

  const isWishlisted = isInWishlist(productId);

  const isNew = product.newArrival || product.isNew;
  const availableStock = product.sizeCounts
    ? Object.entries(product.sizeCounts).reduce((sum, [size, total]) => {
      const reserved = product.sizeReservedCounts?.[size] || 0;
      return sum + Math.max(0, Number(total || 0) - Number(reserved || 0));
    }, 0)
    : typeof product.stock === 'number'
      ? product.stock
      : undefined;

  const discountPercentage =
    product.originalPrice &&
      product.price < product.originalPrice
      ? Math.round(
        ((product.originalPrice - product.price) /
          product.originalPrice) *
        100
      )
      : 0;

  const handleWishlistToggle = (
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (isWishlisted) {
      removeItem(productId);
    } else {
      addItem(product);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
      }}
      className="group"
    >
      <Link to={`/product/${productId}`}>
        <div
          className="
            overflow-hidden
            rounded-[28px]
            border-0
            bg-white
            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-xl
          "
        >
          {/* IMAGE */}
          <div className="relative aspect-[3/3.6] overflow-hidden bg-neutral-100">
            <motion.img
              src={imageError ? logo : product.image}
              alt={product.name}
              onError={() => setImageError(true)}
              className="
                h-full
                w-full
                object-cover
                transition-transform
                duration-500
                group-hover:scale-105
              "
            />

            {/* BADGES */}
            <div className="absolute left-3 top-3 flex flex-col gap-2">
              {typeof availableStock === 'number' && availableStock <= 0 && (
                <span
                  className="
                    rounded-full
                    bg-neutral-900
                    px-3
                    py-1
                    text-[10px]
                    font-semibold
                    text-white
                  "
                >
                  OUT OF STOCK
                </span>
              )}
              {typeof availableStock === 'number' && availableStock > 0 && availableStock <= 2 && (
                <span
                  className="
                    rounded-full
                    bg-amber-600
                    px-3
                    py-1
                    text-[10px]
                    font-semibold
                    text-white
                  "
                >
                  ONLY {availableStock} LEFT
                </span>
              )}
              {isNew && (
                <span
                  className="
                    rounded-full
                    bg-blue-600
                    px-3
                    py-1
                    text-[10px]
                    font-semibold
                    tracking-[0.2em]
                    text-white
                    shadow-sm
                  "
                >
                  NEW
                </span>
              )}

              {discountPercentage > 0 && (
                <span
                  className="
                    rounded-full
                    bg-red-500
                    px-3
                    py-1
                    text-[10px]
                    font-semibold
                    text-white
                  "
                >
                  {discountPercentage}% OFF
                </span>
              )}
            </div>

            {/* WISHLIST */}
            <button
              onClick={handleWishlistToggle}
              className="
                absolute
                right-3
                top-3
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-white/90
                shadow-md
                backdrop-blur
              "
            >
              <Heart
                size={18}
                className={
                  isWishlisted
                    ? 'fill-red-500 text-red-500'
                    : 'text-neutral-700'
                }
              />
            </button>
          </div>

          {/* INFO */}
          <div className="space-y-2 p-4">
            <p
              className="
                text-[11px]
                uppercase
                tracking-[0.25em]
                text-neutral-400
              "
            >
              {product.category || 'Collection'}
            </p>

            <h3
              className="
                line-clamp-2
                text-[15px]
                font-medium
                leading-[1.4]
                text-neutral-900
              "
            >
              {product.name}
            </h3>

            {/* PRICE */}
            <div className="flex items-center gap-2 pt-1">
              <span
                className="
                  text-xl
                  font-bold
                  tracking-tight
                  text-black
                "
              >
                ₹{product.price.toLocaleString('en-IN')}
              </span>

              {/* ORIGINAL PRICE */}
              {product.originalPrice && (
                <span
                  className="
                    text-sm
                    font-medium
                    text-neutral-400
                    line-through
                  "
                >
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
