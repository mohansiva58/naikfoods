import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  IndianRupee,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Upload,
  AlertCircle,
  Flame,
  Lock,
  Home,
  Ticket
} from 'lucide-react';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { api } from '@/services/api';
import { couponService, Coupon } from '@/services/couponService';
import { AddProductModal } from '@/components/admin/AddProductModal';
import { AddSaleModal } from '@/components/admin/AddSaleModal';
import { OrderDetailsModal } from '@/components/admin/OrderDetailsModal';
import { saleService, Sale, SaleMode } from '@/services/saleService';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';

import { OrderItem } from '@/services/orderService';

// Stat interface
interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalCancelledAmount?: number;
  totalReturnedAmount?: number;
  recentOrders: Order[];
  lowStockProducts?: number;
  pendingOrders?: number;
  totalProducts?: number;
}

// Shipping Address interface
interface ShippingAddress {
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

// Order interface (aligned with backend)
interface Order {
  orderId: string;
  userId: string | { displayName: string; email: string; };
  userEmail: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod?: 'razorpay' | 'cod';
  createdAt: string;
  shippingAddress: ShippingAddress;
  trackingNumber?: string;
  estimatedDelivery?: string;
  deliveryDate?: string;
}

const statusColors: Record<string, string> = {
  Delivered: 'bg-primary text-primary-foreground',
  Shipped: 'bg-primary/15 text-primary',
  Processing: 'bg-secondary text-foreground',
  Pending: 'bg-muted text-muted-foreground',
};

const ADMIN_PRODUCTS_PAGE_SIZE = 12;

type TabType = 'dashboard' | 'orders' | 'products' | 'sales' | 'coupons';

const orderTransitions: Record<string, string[]> = {
  pending: ['confirmed', 'processing', 'cancelled', 'returned'],
  confirmed: ['processing', 'cancelled', 'returned'],
  processing: ['shipped', 'cancelled', 'returned'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

const orderStatusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

const getOrderStatusBadgeClass = (status: string) => {
  if (status === 'delivered') return 'bg-primary text-primary-foreground';
  if (status === 'cancelled') return 'bg-destructive text-destructive-foreground';
  if (status === 'returned') return 'bg-purple-100 text-purple-800';
  return 'bg-secondary text-foreground';
};

const formatCurrency = (value: unknown) =>
  `₹${Number(value || 0).toLocaleString('en-IN')}`;

interface ApiErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
}

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiErrorResponse;
  return apiError.response?.data?.error || fallback;
};

// Interface for Product from API
interface Product {
  _id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  sizes: string | string[];
  rating: number;
  newArrival: boolean;
  isBestseller: boolean;
  stock: number;
  images?: string[];
  colors?: Array<{ colorName: string; colorCode?: string }>;
  originalPrice?: number;
}

const normalizeList = <T,>(value: unknown, keys: string[] = []): T[] => {
  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['items', ...keys]) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }
  }

  return [];
};

const isPagedProductsResponse = (value: unknown): value is {
  items?: Product[];
  total?: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
} => Boolean(value && typeof value === 'object' && !Array.isArray(value));

const mergeProductsById = (existing: Product[], incoming: Product[]) => {
  const merged = new Map<string, Product>();
  existing.forEach((product) => merged.set(product.productId, product));
  incoming.forEach((product) => merged.set(product.productId, product));
  return Array.from(merged.values());
};

export default function AdminPage() {
  const { user, isAuthenticated, loading: authLoading, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isAuthenticated || !user) {
        setIsAdmin(false);
        setAdminChecked(true);
        return;
      }
      setAdminChecked(false);
      try {
        const { data } = await api.get('/users/me');
        if (!cancelled) setIsAdmin(!!data.isAdmin);
      } catch {
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) setAdminChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsPage, setProductsPage] = useState(0);
  const [productsHasMore, setProductsHasMore] = useState(false);
  const [productsTotal, setProductsTotal] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [saleModes, setSaleModes] = useState<SaleMode[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddSaleModalOpen, setIsAddSaleModalOpen] = useState(false);
  const [isAddCouponModalOpen, setIsAddCouponModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [editingSale, setEditingSale] = useState<Sale | undefined>(undefined);
  const [newCoupon, setNewCoupon] = useState<{
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minOrderAmount: number;
    expiryDate: string;
  }>({
    code: '',
    discountType: 'percentage',
    discountValue: 0,
    minOrderAmount: 0,
    expiryDate: ''
  });
  const [newSaleMode, setNewSaleMode] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseProductsPage = useCallback((data: unknown, fallbackPage: number) => {
    if (Array.isArray(data)) {
      return {
        items: data as Product[],
        total: data.length,
        page: fallbackPage,
        hasMore: data.length >= ADMIN_PRODUCTS_PAGE_SIZE,
      };
    }

    if (isPagedProductsResponse(data)) {
      const items = Array.isArray(data.items) ? data.items : [];
      return {
        items,
        total: Number(data.total ?? items.length),
        page: Number(data.page ?? fallbackPage),
        hasMore: Boolean(data.hasMore ?? items.length >= ADMIN_PRODUCTS_PAGE_SIZE),
      };
    }

    return {
      items: [] as Product[],
      total: 0,
      page: fallbackPage,
      hasMore: false,
    };
  }, []);

  const fetchProductsPage = useCallback(async (page: number, mode: 'reset' | 'append') => {
    if (mode === 'reset') {
      setLoading(true);
    } else {
      setLoadingMoreProducts(true);
    }

    try {
      const response = await api.get(`/products?fresh=true&page=${page}&limit=${ADMIN_PRODUCTS_PAGE_SIZE}&_=${Date.now()}`);
      const parsed = parseProductsPage(response.data, page);

      setProducts((current) => (mode === 'append' ? mergeProductsById(current, parsed.items) : parsed.items));
      setProductsPage(parsed.page);
      setProductsHasMore(parsed.hasMore);
      setProductsTotal(parsed.total);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
      if (mode === 'reset') {
        setProducts([]);
        setProductsPage(0);
        setProductsHasMore(false);
        setProductsTotal(0);
      }
    } finally {
      if (mode === 'reset') {
        setLoading(false);
      } else {
        setLoadingMoreProducts(false);
      }
    }
  }, [parseProductsPage]);

  const refreshLoadedProducts = useCallback(async () => {
    const pagesToLoad = Math.max(productsPage, 1);

    try {
      setLoading(true);
      const responses = await Promise.all(
        Array.from({ length: pagesToLoad }, (_, index) =>
          api.get(`/products?fresh=true&page=${index + 1}&limit=${ADMIN_PRODUCTS_PAGE_SIZE}&_=${Date.now()}`)
        )
      );

      const pages = responses.map((response, index) => parseProductsPage(response.data, index + 1));
      const merged = pages.flatMap((page) => page.items);
      const lastPage = pages[pages.length - 1];

      setProducts(merged);
      setProductsPage(lastPage?.page ?? pagesToLoad);
      setProductsHasMore(lastPage?.hasMore ?? false);
      setProductsTotal(lastPage?.total ?? merged.length);
    } catch (error) {
      console.error('Failed to refresh products:', error);
      toast.error('Failed to refresh products');
    } finally {
      setLoading(false);
    }
  }, [parseProductsPage, productsPage]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    await fetchProductsPage(1, 'reset');
  }, [fetchProductsPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/orders');
      setOrders(normalizeList<Order>(response.data, ['orders']));
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await saleService.getAllSales();
      setSales(normalizeList<Sale>(response, ['sales']));
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      toast.error('Failed to load sales');
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSaleModes = async () => {
    try {
      const response = await saleService.getAllSaleModes();
      setSaleModes(normalizeList<SaleMode>(response, ['saleModes', 'modes']));
    } catch (error) {
      console.error('Failed to fetch sale modes:', error);
      toast.error('Failed to load sale modes');
      setSaleModes([]);
    }
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await couponService.getAllCoupons();
      setCoupons(normalizeList<Coupon>(response, ['coupons']));
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
      toast.error('Failed to load coupons');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await couponService.createCoupon(newCoupon);
      toast.success('Coupon created successfully');
      setIsAddCouponModalOpen(false);
      setNewCoupon({
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        minOrderAmount: 0,
        expiryDate: ''
      });
      fetchCoupons();
    } catch (error: unknown) {
      console.error('Create coupon error:', error);
      toast.error(getApiErrorMessage(error, 'Failed to create coupon'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await couponService.deleteCoupon(id);
      toast.success('Coupon deleted successfully');
      fetchCoupons();
    } catch (error) {
      console.error('Delete coupon error:', error);
      toast.error('Failed to delete coupon');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.put(`/admin/orders/${orderId}`, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders(); // Refresh
      fetchStats();
    } catch (error: unknown) {
      console.error('Update status error:', error);
      toast.error(getApiErrorMessage(error, 'Failed to update order status'));
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !isAdmin || !adminChecked) return;
    if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'sales') {
      fetchSales();
      fetchSaleModes();
    } else if (activeTab === 'coupons') {
      fetchCoupons();
    } else if (activeTab === 'dashboard') {
      fetchStats();
      fetchProducts();
    }
  }, [activeTab, isAuthenticated, isAdmin, adminChecked, fetchProducts]);

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as Product[];
        if (!Array.isArray(json)) {
          toast.error('Invalid format. File must contain an array of products.');
          return;
        }

        const loadingToast = toast.loading('Uploading products...');

        await api.post('/products/bulk', json);

        toast.dismiss(loadingToast);
        toast.success(`Successfully uploaded ${json.length} products`);
        await refreshLoadedProducts();
      } catch (error) {
        console.error('Bulk upload error:', error);
        toast.error('Failed to process bulk upload. Ensure valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/products/${productId}`);
      toast.success('Product deleted successfully');
      await refreshLoadedProducts();
    } catch (error) {
      console.error('Delete product error:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm('Are you sure you want to delete this sale item?')) return;

    try {
      await saleService.deleteSale(saleId);
      toast.success('Sale item deleted successfully');
      fetchSales();
    } catch (error) {
      console.error('Delete sale error:', error);
      toast.error('Failed to delete sale item');
    }
  };

  const handleToggleSaleMode = async (saleName: string) => {
    try {
      await saleService.toggleSaleMode(saleName);
      toast.success('Sale mode toggled successfully');
      fetchSaleModes();
    } catch (error) {
      console.error('Toggle sale mode error:', error);
      toast.error('Failed to toggle sale mode');
    }
  };

  const handleCreateSaleMode = async () => {
    if (!newSaleMode.trim()) {
      toast.error('Please enter a sale name');
      return;
    }

    try {
      await saleService.createOrUpdateSaleMode({
        saleName: newSaleMode,
        isActive: false,
      });
      toast.success('Sale mode created successfully');
      setNewSaleMode('');
      fetchSaleModes();
    } catch (error) {
      console.error('Create sale mode error:', error);
      toast.error('Failed to create sale mode');
    }
  };

  const handleDeleteSaleMode = async (saleName: string) => {
    if (!confirm('Are you sure you want to delete this sale mode?')) return;

    try {
      await saleService.deleteSaleMode(saleName);
      toast.success('Sale mode deleted successfully');
      fetchSaleModes();
    } catch (error) {
      console.error('Delete sale mode error:', error);
      toast.error('Failed to delete sale mode');
    }
  };

  const filteredProducts = normalizeList<Product>(products).filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLoadMoreProducts = async () => {
    if (loadingMoreProducts || !productsHasMore) return;
    await fetchProductsPage(productsPage + 1, 'append');
  };

  if (authLoading || !adminChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 text-muted-foreground">
        <Link
          to="/"
          className="fixed left-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-card text-primary shadow-md ring-1 ring-border transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Go to home"
        >
          <Home size={20} />
        </Link>
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Link
          to="/"
          className="fixed left-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-card text-primary shadow-md ring-1 ring-border transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Go to home"
        >
          <Home size={20} />
        </Link>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-card rounded-2xl shadow-2xl overflow-hidden border border-border p-8 text-center space-y-4"
        >
          <Lock className="mx-auto text-primary" size={40} />
          <h2 className="text-2xl font-serif font-bold">Admin Dashboard</h2>
          <p className="text-muted-foreground text-sm">Sign in with your store account (admin email must be listed in server ADMIN_EMAILS).</p>
          <button type="button" className="btn-primary w-full py-3" onClick={() => setShowAuthModal(true)}>
            Sign in
          </button>
        </motion.div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Link
          to="/"
          className="fixed left-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-card text-primary shadow-md ring-1 ring-border transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Go to home"
        >
          <Home size={20} />
        </Link>
        <div className="max-w-md text-center space-y-3">
          <h2 className="text-xl font-bold text-destructive">Access denied</h2>
          <p className="text-muted-foreground text-sm">
            This account is not an admin. Ask the owner to add your email to <code className="text-xs bg-secondary px-1 rounded">ADMIN_EMAILS</code> on the server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-start justify-between"
          >
            <div>
              <h1 className="font-serif text-4xl font-bold text-foreground mb-2">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage your store, orders, and products
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-destructive border border-destructive/30 rounded-full hover:bg-destructive/10 transition-colors"
            >
              <Lock size={15} /> Logout
            </motion.button>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'orders', label: 'Orders', icon: ShoppingCart },
              { id: 'products', label: 'Products', icon: Package },
              { id: 'sales', label: 'Sales', icon: Flame },
              { id: 'coupons', label: 'Coupons', icon: Ticket },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors ${activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-primary/20'
                  }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </motion.button>
            ))}
          </div>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {[
                  { label: 'Total Revenue', value: stats ? formatCurrency(stats.totalRevenue) : '-', icon: IndianRupee, color: 'text-primary' },
                  { label: 'Cancelled Amount', value: stats ? formatCurrency(stats.totalCancelledAmount || 0) : '-', icon: AlertCircle, color: 'text-destructive' },
                  { label: 'Returned Amount', value: stats ? formatCurrency(stats.totalReturnedAmount || 0) : '-', icon: TrendingUp, color: 'text-primary' },
                  { label: 'Total Orders', value: stats ? stats.totalOrders : '-', icon: ShoppingCart, color: 'text-primary' },
                  { label: 'Total Users', value: stats ? stats.totalUsers : '-', icon: Users, color: 'text-primary' },
                  { label: 'Catalog products', value: stats ? (stats.totalProducts ?? products.length) : '-', icon: Package, color: 'text-primary' },
                  // { label: 'Low stock (≤10)', value: stats?.lowStockProducts ?? '-', icon: AlertCircle, color: 'text-amber-600' },
                  // { label: 'Active pipeline', value: stats?.pendingOrders ?? '-', icon: TrendingUp, color: 'text-primary' },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-2xl p-6 shadow-sm border border-border"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <stat.icon size={24} className={stat.color} />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-1">{stat.value}</h3>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <h3 className="font-serif text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => { setActiveTab('products'); setEditingProduct(undefined); setIsAddModalOpen(true); }}
                    className="btn-primary flex items-center gap-2 px-6 py-3"
                  >
                    <Plus size={18} /> Add New Product
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="px-6 py-3 border border-border rounded-full hover:bg-secondary flex items-center gap-2"
                  >
                    <ShoppingCart size={18} /> View Orders
                  </button>
                </div>
              </div>

            </motion.div>
          )}

          {/* Orders Tab - Placeholder for now until we connect fully */}
          {activeTab === 'orders' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden"
            >
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold">Manage Orders</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Order ID</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Customer</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Total</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.map((order) => {
                      const allowedStatuses = orderTransitions[order.orderStatus] || [];
                      const statusOptions = [order.orderStatus, ...allowedStatuses].filter(Boolean);

                      return (
                      <tr key={order.orderId} className="hover:bg-secondary/50">
                        <td className="px-6 py-4 font-mono text-sm">{order.orderId || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium">{order.shippingAddress?.fullName || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">{order.userEmail || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 font-medium">{formatCurrency(order.total)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getOrderStatusBadgeClass(order.orderStatus)}`}>
                            {(orderStatusLabels[order.orderStatus] || order.orderStatus || 'Unknown').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsOrderDetailsOpen(true);
                            }}
                            className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                          >
                            View Details
                          </button>
                          <select
                            className="text-sm border border-border rounded px-2 py-1 bg-background"
                            value={order.orderStatus}
                            onChange={(e) => handleUpdateOrderStatus(order.orderId, e.target.value)}
                            disabled={order.orderStatus === 'cancelled' || order.orderStatus === 'returned'}
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {orderStatusLabels[status] || status}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    )})}
                    {orders.length === 0 && !loading && (
                      <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No orders found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-secondary rounded-full border-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex gap-3">
                    {/* <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-secondary flex items-center gap-2 transition-colors"
                    >
                      <Upload size={18} /> Bulk Upload (JSON)
                    </button> */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleBulkUpload}
                      className="hidden"
                      accept=".json"
                    />

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setEditingProduct(undefined); setIsAddModalOpen(true); }}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Add Product
                    </motion.button>
                  </div>
                </div>

                {loading ? (
                  <div className="p-10 text-center text-muted-foreground">Loading products...</div>
                ) : (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-secondary">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Product</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Category</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Price</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Rating</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredProducts.map((product) => (
                            <tr key={product._id} className="hover:bg-secondary/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-14 rounded-lg overflow-hidden bg-secondary">
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <span className="font-medium text-sm">{product.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-muted-foreground">{product.category}</td>
                              <td className="px-6 py-4 text-sm font-medium">{formatCurrency(product.price)}</td>
                              <td className="px-6 py-4 text-sm">⭐ {product.rating}</td>
                              <td className="px-6 py-4">
                                {product.newArrival && (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-secondary text-foreground mr-1">
                                    New
                                  </span>
                                )}
                                {product.isBestseller && (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                                    Bestseller
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => { setEditingProduct(product); setIsAddModalOpen(true); }}
                                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(product.productId)}
                                    className="p-2 hover:bg-secondary rounded-lg transition-colors text-destructive"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredProducts.length === 0 && (
                            <tr>
                              <td colSpan={6} className="text-center py-10 text-muted-foreground">
                                No products found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-muted-foreground">
                        Loaded {products.length} of {productsTotal || products.length} products
                      </p>
                      <button
                        type="button"
                        onClick={handleLoadMoreProducts}
                        disabled={!productsHasMore || loadingMoreProducts}
                        className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loadingMoreProducts ? 'Loading more...' : productsHasMore ? 'Load More Products' : 'All products loaded'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Sales Tab */}
          {activeTab === 'sales' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Sale Modes Management */}
              <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h2 className="text-xl font-bold mb-4">Manage Sale Modes</h2>
                  <div className="flex gap-3 flex-wrap">
                    {saleModes.map((mode) => (
                      <div key={mode._id} className="flex items-center gap-2 bg-secondary rounded-full px-4 py-2">
                        <span className="font-medium text-sm">{mode.saleName}</span>
                        <button
                          onClick={() => handleToggleSaleMode(mode.saleName)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            mode.isActive ? 'bg-primary' : 'bg-muted'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                              mode.isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => handleDeleteSaleMode(mode.saleName)}
                          className="p-1 hover:bg-destructive/20 rounded transition-colors text-destructive ml-2"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-6 border-t border-border">
                  <label className="block text-sm font-medium mb-2">Create New Sale Mode</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSaleMode}
                      onChange={(e) => setNewSaleMode(e.target.value)}
                      placeholder="e.g., Summer Sale, Diwali Sale"
                      className="flex-1 px-4 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateSaleMode()}
                    />
                    <button
                      onClick={handleCreateSaleMode}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Plus size={18} /> Create
                    </button>
                  </div>
                </div>
              </div>

              {/* Sale Items Management */}
              <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                      type="text"
                      placeholder="Search sale items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-secondary rounded-full border-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setEditingSale(undefined); setIsAddSaleModalOpen(true); }}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add Sale Item
                  </motion.button>
                </div>

                {loading ? (
                  <div className="p-10 text-center text-muted-foreground">Loading sales...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-secondary">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Item</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Category</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Price</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Discount</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Stock</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {sales.filter(s =>
                          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.category.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((sale) => (
                          <tr key={sale._id} className="hover:bg-secondary/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-14 rounded-lg overflow-hidden bg-secondary">
                                  <img
                                    src={sale.image}
                                    alt={sale.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <span className="font-medium text-sm">{sale.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{sale.category}</td>
                            <td className="px-6 py-4 text-sm font-medium">{formatCurrency(sale.price)}</td>
                            <td className="px-6 py-4 text-sm">
                              {sale.discount ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                                  -{sale.discount}%
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm">{sale.stock}</td>
                            <td className="px-6 py-4">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => { setEditingSale(sale); setIsAddSaleModalOpen(true); }}
                                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteSale(sale.saleId)}
                                  className="p-2 hover:bg-secondary rounded-lg transition-colors text-destructive"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {sales.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-10 text-muted-foreground">
                              No sale items found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
                            </motion.div>
          )}

          {/* Coupons Tab */}
          {activeTab === 'coupons' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                      type="text"
                      placeholder="Search coupons..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-secondary rounded-full border-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsAddCouponModalOpen(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add Coupon
                  </motion.button>
                </div>

                {loading ? (
                  <div className="p-10 text-center text-muted-foreground">Loading coupons...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-secondary">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Code</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Discount</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Min Order</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Expiry</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(Array.isArray(coupons) ? coupons : []).filter(c =>
                          c.code.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((coupon) => (
                          <tr key={coupon._id} className="hover:bg-secondary/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-sm">{coupon.code}</td>
                            <td className="px-6 py-4 text-sm font-medium text-primary">
                              {coupon.discountType === 'percentage' 
                                ? `${coupon.discountValue}% OFF` 
                                : `₹${coupon.discountValue} OFF`
                              }
                            </td>
                            <td className="px-6 py-4 text-sm">₹{coupon.minOrderAmount || 0}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'No expiry'}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {coupon.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleDeleteCoupon(coupon._id)}
                                className="p-2 hover:bg-secondary rounded-lg transition-colors text-destructive"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {coupons.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-10 text-muted-foreground">
                              No coupons found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Add Coupon Modal */}
      {isAddCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold">Create Coupon</h2>
              <button
                onClick={() => setIsAddCouponModalOpen(false)}
                className="p-2 hover:bg-secondary rounded-full transition-colors"
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleCreateCoupon} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Coupon Code</label>
                <input
                  required
                  type="text"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SUMMER50"
                  className="w-full px-4 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Discount Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="discountType"
                      checked={newCoupon.discountType === 'percentage'}
                      onChange={() => setNewCoupon({ ...newCoupon, discountType: 'percentage' })}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">Percentage (%)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="discountType"
                      checked={newCoupon.discountType === 'fixed'}
                      onChange={() => setNewCoupon({ ...newCoupon, discountType: 'fixed' })}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">Fixed Amount (₹)</span>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {newCoupon.discountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  max={newCoupon.discountType === 'percentage' ? 100 : undefined}
                  value={newCoupon.discountValue}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Order Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={newCoupon.minOrderAmount}
                  onChange={(e) => setNewCoupon({ ...newCoupon, minOrderAmount: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={newCoupon.expiryDate}
                  onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                  className="w-full px-4 py-2 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="pt-4">
                <button
                  disabled={loading}
                  type="submit"
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                >
                  {loading ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <Footer />

      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingProduct(undefined); }}
        onSuccess={refreshLoadedProducts}
        product={editingProduct}
      />

      <AddSaleModal
        isOpen={isAddSaleModalOpen}
        onClose={() => { setIsAddSaleModalOpen(false); setEditingSale(undefined); }}
        onSuccess={() => fetchSales()}
        sale={editingSale}
      />

      <OrderDetailsModal
        isOpen={isOrderDetailsOpen}
        onClose={() => {
          setIsOrderDetailsOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
      />
    </div>
  );
}
