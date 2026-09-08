import { motion } from 'framer-motion';
import { Check, ShoppingBag, List, Download, Truck, Calendar, ShieldCheck } from 'lucide-react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import Confetti from 'react-confetti';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface OrderSuccessItem {
    name: string;
    image?: string;
    size: string;
    color?: string;
    quantity: number;
    price: number;
}

interface OrderSuccessData {
    orderId: string;
    items: OrderSuccessItem[];
    subtotal?: number;
    discount?: number;
    shipping?: number;
    total: number;
    shippingAddress: {
        fullName: string;
        address: string;
        city: string;
        state: string;
        pincode: string;
        phone: string;
    };
}

export default function OrderSuccessPage() {
    const location = useLocation();
    const orderData = (location.state as { order?: OrderSuccessData } | null)?.order;
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!orderData) {
        return <Navigate to="/" replace />;
    }

    const handleDownloadInvoice = () => {
        toast.success('Downloading your invoice...', {
            description: `Invoice for Order #${orderData.orderId} will be ready shortly.`,
        });
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#121212] flex flex-col antialiased">
            <Confetti 
                width={windowSize.width} 
                height={windowSize.height} 
                recycle={false} 
                numberOfPieces={250}
                gravity={0.12}
            />
            <Header />
            
            <main className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-4 pt-28 pb-16">
                <motion.div 
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="bg-white dark:bg-[#1E1E1E] rounded-[32px] border border-neutral-100 dark:border-neutral-800 shadow-[0_10px_40px_rgba(0,0,0,0.03)] overflow-hidden"
                >
                    {/* Brand Banner & Elegant Hero Success */}
                    <div className="relative bg-gradient-to-br from-[#66021F] to-[#400113] p-6 sm:p-10 text-white text-center overflow-hidden">
                        {/* Decorative glass elements */}
                        <div className="absolute top-[-50px] left-[-50px] w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-[-50px] right-[-50px] w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

                        <motion.div 
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                            className="inline-flex items-center justify-center w-20 h-20 bg-white text-[#66021F] rounded-full mb-5 shadow-lg mx-auto"
                        >
                            <Check size={36} strokeWidth={3} className="text-[#66021F]" />
                        </motion.div>
                        
                        <motion.h1 
                            initial={{ y: 15, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-4xl font-serif font-bold mb-2 tracking-tight"
                        >
                            Order Confirmed!
                        </motion.h1>
                        
                        <motion.p 
                            initial={{ y: 15, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-white/80 max-w-md mx-auto text-sm sm:text-base leading-relaxed"
                        >
                            Thanks for shopping with us! Your   items are secured, and we have begun preparing your package.
                        </motion.p>
                        
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/10 text-xs font-mono tracking-wider max-w-full overflow-hidden"
                        >
                            <span className="shrink-0">ORDER ID:</span>
                            <span className="font-bold truncate">{orderData.orderId}</span>
                        </motion.div>
                    </div>

                    <div className="p-5 sm:p-8 lg:p-10 space-y-10">
                        {/* Highlights Grid */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="p-5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl flex items-start gap-4">
                                <div className="p-3 bg-[#66021F]/10 dark:bg-[#66021F]/20 text-[#66021F] rounded-xl flex-shrink-0">
                                    <Truck size={22} />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wider font-bold text-neutral-400 dark:text-neutral-500 mb-1">Status</p>
                                    <p className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">Processing & Ready to Ship</p>
                                </div>
                            </div>
                            <div className="p-5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl flex items-start gap-4">
                                <div className="p-3 bg-[#66021F]/10 dark:bg-[#66021F]/20 text-[#66021F] rounded-xl flex-shrink-0">
                                    <Calendar size={22} />
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wider font-bold text-neutral-400 dark:text-neutral-500 mb-1">Estimated Arrival</p>
                                    <p className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">5 - 7 Business Days</p>
                                </div>
                            </div>
                        </div>

                        {/* Order Details Column Breakdown */}
                        <div className="grid md:grid-cols-[1.2fr_1fr] gap-10">
                            {/* Product List */}
                            <div className="space-y-6">
                                <h3 className="font-serif text-xl font-bold border-b border-neutral-100 dark:border-neutral-800 pb-3 text-neutral-900 dark:text-neutral-100">
                                    Your Curated Selection
                                </h3>
                                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                                    {orderData.items.map((item: OrderSuccessItem, idx: number) => (
                                        <motion.div 
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 * idx }}
                                            key={idx} 
                                            className="flex gap-4 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30"
                                        >
                                            <div className="w-16 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-hidden flex-shrink-0 border border-neutral-200/50 dark:border-neutral-700/50">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">{item.name}</p>
                                                <div className="flex flex-wrap gap-2 mt-1.5">
                                                    <span className="inline-flex px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-[10px] font-semibold rounded text-neutral-600 dark:text-neutral-400">
                                                        Size: {item.size}
                                                    </span>
                                                    {item.color && (
                                                        <span className="inline-flex px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-[10px] font-semibold rounded text-neutral-600 dark:text-neutral-400">
                                                            Color: {item.color}
                                                        </span>
                                                    )}
                                                    <span className="inline-flex px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-[10px] font-semibold rounded text-neutral-600 dark:text-neutral-400">
                                                        Qty: {item.quantity}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col justify-center items-end flex-shrink-0 pl-2">
                                                <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                                                    ₹{(item.price * item.quantity).toLocaleString()}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Shipping Address Card */}
                                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                    <h4 className="text-xs uppercase tracking-wider font-bold text-neutral-400 dark:text-neutral-500 mb-3">Delivery Address</h4>
                                    <div className="p-5 bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-100 dark:border-neutral-800 rounded-2xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                                        <p className="font-bold text-neutral-900 dark:text-neutral-100 text-base mb-1">{orderData.shippingAddress.fullName}</p>
                                        <p>{orderData.shippingAddress.address}</p>
                                        <p>{orderData.shippingAddress.city}, {orderData.shippingAddress.state} - {orderData.shippingAddress.pincode}</p>
                                        <p className="mt-3 font-semibold text-xs text-neutral-500 dark:text-neutral-400">Phone: {orderData.shippingAddress.phone}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Billing & Summary */}
                            <div className="flex flex-col justify-between space-y-6">
                                <div className="space-y-6">
                                    <h3 className="font-serif text-xl font-bold border-b border-neutral-100 dark:border-neutral-800 pb-3 text-neutral-900 dark:text-neutral-100">
                                        Receipt Details
                                    </h3>
                                    <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-4 sm:p-6 space-y-4">
                                        <div className="flex justify-between items-center text-sm text-neutral-600 dark:text-neutral-400 gap-2">
                                            <span className="shrink-0">Basket Subtotal</span>
                                            <span className="font-medium text-neutral-900 dark:text-neutral-100 text-right">
                                                ₹{(orderData.subtotal || orderData.total).toLocaleString()}
                                            </span>
                                        </div>
                                        {orderData.discount > 0 && (
                                            <div className="flex justify-between items-center text-sm text-green-600 dark:text-green-400 font-medium gap-2">
                                                <span className="shrink-0">Coupon Discount</span>
                                                <span className="text-right">-₹{orderData.discount.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-sm text-neutral-600 dark:text-neutral-400 gap-2">
                                            <span className="shrink-0">Delivery Charge</span>
                                            {(orderData.shipping ?? 0) > 0
                                                ? <span className="font-medium text-neutral-900 dark:text-neutral-100">₹{orderData.shipping}</span>
                                                : <span className="font-medium text-green-600 dark:text-green-400">FREE</span>
                                            }
                                        </div>
                                        
                                        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center gap-2">
                                            <span className="font-bold text-neutral-900 dark:text-neutral-100 shrink-0">Total Paid</span>
                                            <span className="text-xl sm:text-2xl font-bold text-[#66021F] text-right">
                                                ₹{orderData.total.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900 rounded-xl text-green-800 dark:text-green-200 text-xs justify-center font-medium">
                                        <ShieldCheck size={16} />
                                        <span>Guaranteed Safe Checkout</span>
                                    </div>
                                </div>

                                {/* Call to actions */}
                                <div className="space-y-3 pt-6">
                                    <Link 
                                        to="/shop" 
                                        className="flex items-center justify-center gap-2 w-full py-4 bg-[#66021F] hover:bg-[#520118] text-white rounded-2xl font-bold transition-all shadow-md active:scale-[0.98]"
                                    >
                                        <ShoppingBag size={18} />
                                        Continue Shopping
                                    </Link>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <Link 
                                            to="/orders" 
                                            className="flex items-center justify-center gap-2 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-2xl font-semibold text-sm transition-all"
                                        >
                                            <List size={16} />
                                            My Orders
                                        </Link>
                                        {/* <button 
                                            onClick={handleDownloadInvoice}
                                            className="flex items-center justify-center gap-2 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-2xl font-semibold text-sm transition-all"
                                        >
                                            <Download size={16} />
                                            Invoice
                                        </button> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>
            
            <Footer />
        </div>
    );
}
