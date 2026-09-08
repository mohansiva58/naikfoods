import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package,
    Truck,
    CheckCircle,
    Clock,
    ChevronDown,
    ChevronUp,
    Search,
    ExternalLink,
    Home,
    ShoppingCart,
    User
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { api } from '@/services/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface OrderItem {
    name: string;
    size: string;
    quantity: number;
    price: number;
    image?: string;
    variantImage?: string;
    color?: string;
}

interface Order {
    orderId: string;
    items: OrderItem[];
    total: number;
    orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
    createdAt: string;
    shippingAddress: {
        fullName: string;
        address?: string;
        addressLine1?: string;
        city: string;
        state: string;
        pincode?: string;
        postalCode?: string;
    };
}

const statusSteps = {
    pending: 1,
    confirmed: 2,
    processing: 2,
    shipped: 3,
    delivered: 4,
    cancelled: 0,
    returned: 0,
};

const stepIcons = {
    'Pending': Clock,
    'Processing': Package,
    'Shipped': Truck,
    'Delivered': CheckCircle,
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [trackId, setTrackId] = useState('');

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, []);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/orders'); // Assuming this returns { orders: [...] }
            setOrders(response.data.orders);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            toast.error('Failed to load your orders');
        } finally {
            setLoading(false);
        }
    };

    const handleTrackSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const order = orders.find(o => o.orderId.toLowerCase() === trackId.toLowerCase());
        if (order) {
            setExpandedOrder(order.orderId);
            const element = document.getElementById(`order-${order.orderId}`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            toast.error('Order not found in your history');
        }
    };

    const toggleOrder = (orderId: string) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />

            <main className="flex-1 pt-24 pb-16">
                <div className="container mx-auto px-4 max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="font-serif text-3xl font-bold mb-2">My Orders</h1>
                        <p className="text-muted-foreground">Track and manage your recent purchases</p>
                    </motion.div>

                    {/* Track Order Input */}
                    <div className="bg-card p-6 rounded-2xl shadow-sm border border-border mb-8">
                        <h2 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
                            <Truck size={20} className="text-primary" />
                            Track Order
                        </h2>
                        <form onSubmit={handleTrackSearch} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter Order ID (e.g. SW-123456)"
                                value={trackId}
                                onChange={(e) => setTrackId(e.target.value)}
                                className="flex-1 px-4 py-2 rounded-lg bg-secondary border-none focus:ring-2 focus:ring-primary outline-none"
                            />
                            <button className="btn-primary px-6 py-2">Track</button>
                        </form>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-secondary/50 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-20 bg-secondary/20 rounded-2xl">
                            <Package size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-lg font-medium mb-1">No orders found</h3>
                            <p className="text-muted-foreground">Looks like you haven't placed any orders yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <motion.div
                                    key={order.orderId}
                                    id={`order-${order.orderId}`}
                                    layout
                                    className={`bg-card rounded-xl border border-border overflow-hidden transition-all ${expandedOrder === order.orderId ? 'shadow-md ring-1 ring-primary/20' : 'shadow-sm'
                                        }`}
                                >
                                    <div
                                        onClick={() => toggleOrder(order.orderId)}
                                        className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                    >
                                        <div className="flex items-start sm:items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${order.orderStatus === 'delivered' ? 'bg-primary text-primary-foreground' :
                                                    order.orderStatus === 'cancelled' ? 'bg-destructive text-destructive-foreground' :
                                                        'bg-secondary text-primary'
                                                }`}>
                                                <Package size={20} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-foreground">{order.orderId}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        • {format(new Date(order.createdAt), 'MMM d, yyyy')}
                                                    </span>
                                                </div>
                                                <div className="text-sm font-medium text-primary">
                                                    {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-6">
                                            <span className="font-bold">₹{order.total.toLocaleString()}</span>
                                            {expandedOrder === order.orderId ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {expandedOrder === order.orderId && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-border bg-secondary/10"
                                            >
                                                <div className="p-6 space-y-6">
                                                    {/* Tracking Steps */}
                                                    {order.orderStatus !== 'cancelled' && (
                                                        <div className="relative flex justify-between mb-8 max-w-lg mx-auto">
                                                            {/* Progress Bar Background */}
                                                            <div className="absolute top-1/2 left-0 w-full h-1 bg-border -translate-y-1/2 z-0"></div>
                                                            {/* Active Progress Bar */}
                                                            <div
                                                                className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-500"
                                                                style={{ width: `${((statusSteps[order.orderStatus] - 1) / 3) * 100}%` }}
                                                            ></div>

                                                            {['Pending', 'Processing', 'Shipped', 'Delivered'].map((step, index) => {
                                                                const stepNum = index + 1;
                                                                const isActive = statusSteps[order.orderStatus] >= stepNum;
                                                                const StepIcon = stepIcons[step as keyof typeof stepIcons];
                                                                return (
                                                                    <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isActive ? 'bg-primary border-primary text-primary-foreground shadow-md' : 'bg-background border-border text-muted-foreground'
                                                                            }`}>
                                                                            <StepIcon size={18} />
                                                                        </div>
                                                                        <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                                                            {step}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* Order Details */}
                                                    <div className="grid md:grid-cols-2 gap-6">
                                                        <div>
                                                            <h4 className="font-semibold mb-3">Items</h4>
                                                            <div className="space-y-3">
                                                                {order.items.map((item, i) => (
                                                                    <div key={i} className="flex gap-3 text-sm">
                                                                        <div className="w-12 h-12 bg-secondary rounded-md overflow-hidden flex-shrink-0">
                                                                            {(item.variantImage || item.image) ? (
                                                                                <img src={item.variantImage || item.image} alt={item.name} className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <div className="w-full h-full bg-secondary" />
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-medium text-foreground">{item.name}</p>
                                                                            <p className="text-muted-foreground">
                                                                                Size: {item.size}
                                                                                {item.color && ` • Color: ${item.color}`}
                                                                                • Qty: {item.quantity}
                                                                            </p>
                                                                            <p className="font-medium">₹{item.price.toLocaleString()}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-6">
                                                            <div>
                                                                <h4 className="font-semibold mb-2">Shipping Address</h4>
                                                                <div className="text-sm text-muted-foreground">
                                                                    <p className="text-foreground font-medium">{order.shippingAddress.fullName}</p>
                                                                    <p>{order.shippingAddress.address || order.shippingAddress.addressLine1}</p>
                                                                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode || order.shippingAddress.postalCode}</p>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <h4 className="font-semibold mb-2">Payment</h4>
                                                                <p className="text-sm text-muted-foreground">Total: <span className="text-foreground font-bold">₹{order.total.toLocaleString()}</span></p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
