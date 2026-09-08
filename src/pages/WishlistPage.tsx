import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useWishlistStore } from '@/lib/wishlist';
import { Heart, Trash2 } from 'lucide-react';

export default function WishlistPage() {
    const { items, removeItem } = useWishlistStore();

    const handleRemove = (productId: string) => {
        removeItem(productId);
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-24 pb-16">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <h1 className="font-serif text-4xl font-bold text-foreground mb-4">
                            My Wishlist
                        </h1>
                        <p className="text-muted-foreground">
                            {items.length} items saved
                        </p>
                    </motion.div>

                    {items.length === 0 ? (
                        <div className="text-center py-20 bg-secondary/20 rounded-2xl">
                            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <Heart size={32} className="text-muted-foreground" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
                            <p className="text-muted-foreground mb-8">
                                Save items you love to buy them later.
                            </p>
                            <Link to="/shop" className="btn-primary inline-flex">
                                Start Shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-6 lg:grid-cols-4">
                            <AnimatePresence mode="popLayout">
                                {items.map((product, index) => {
                                    const productId = product.productId || product.id || product._id || '';

                                    return (
                                        <motion.div
                                            key={String(productId)}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.8, height: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="group"
                                        >
                                            <div className="card-product relative">
                                                {/* Image Container */}
                                                <div className="relative aspect-[4/4.5] overflow-hidden bg-secondary rounded-lg group-hover:shadow-lg transition-shadow">
                                                    <Link to={`/product/${productId}`}>
                                                        <motion.img
                                                            src={product.image}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                            whileHover={{ scale: 1.05 }}
                                                            transition={{ duration: 0.5, ease: 'easeOut' }}
                                                        />
                                                    </Link>

                                                    {/* Remove Button - Always Visible */}
                                                    <motion.button
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        whileHover={{ scale: 1.05, backgroundColor: 'rgb(239, 68, 68)' }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleRemove(String(productId))}
                                                        className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 font-medium text-sm shadow-lg"
                                                        title="Remove from wishlist"
                                                    >
                                                        <Trash2 size={16} />
                                                        <span className="hidden sm:inline">Remove</span>
                                                    </motion.button>
                                                </div>

                                                {/* Product Info */}
                                                <div className="p-2">
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                                                        {product.category}
                                                    </p>

                                                    <Link to={`/product/${productId}`}>
                                                        <h3 className="font-serif text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1">
                                                            {product.name}
                                                        </h3>
                                                    </Link>

                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="font-semibold text-xs text-foreground">
                                                            ₹{product.price.toLocaleString()}
                                                        </span>

                                                        {product.originalPrice && (
                                                            <span className="text-[10px] text-muted-foreground line-through">
                                                                ₹{product.originalPrice.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Rating */}
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="flex">
                                                            {[...Array(5)].map((_, i) => (
                                                                <span
                                                                    key={i}
                                                                    className={`text-[10px] ${
                                                                        i < Math.floor(product.rating)
                                                                            ? 'text-primary'
                                                                            : 'text-muted'
                                                                    }`}
                                                                >
                                                                    ★
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            ({product.reviews})
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
