import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, ShoppingBag, Search, X, Heart, User, LogOut, Truck, Home, Info } from 'lucide-react';
import logo from '@/assets/logo.png';
import { useCartStore } from '@/lib/cart';
import { useWishlistStore } from '@/lib/wishlist';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from './AuthModal';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const { user, isAuthenticated, signOut } = useAuth();

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeSearch = useCallback((clearQuery = false) => {
    setIsSearchOpen(false);

    if (clearQuery) {
      setSearchQuery('');
      setDebouncedQuery('');
      if (location.pathname === '/shop' && searchParams.get('search')) {
        navigate('/shop');
      }
    }
  }, [location.pathname, searchParams, navigate]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync search query with URL parameter
  useEffect(() => {
    const query = searchParams.get('search') || '';
    setSearchQuery(query);
  }, [searchParams]);

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Handle outside click for search
  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      if (!isSearchOpen) return;
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        closeSearch(location.pathname === '/shop');
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeSearch(location.pathname === '/shop');
    }
    document.addEventListener('mousedown', handleDocClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDocClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isSearchOpen, location.pathname, searchParams, closeSearch]);

  // Handle outside click for user menu
  useEffect(() => {
    function handleUserMenuClick(e: MouseEvent) {
      if (!showUserMenu) return;
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowUserMenu(false);
    }
    document.addEventListener('mousedown', handleUserMenuClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleUserMenuClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showUserMenu]);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (!isSearchOpen) return;

    const nextQuery = debouncedQuery.trim();
    if (nextQuery) {
      navigate(`/shop?search=${encodeURIComponent(nextQuery)}`);
      return;
    }

    if (location.pathname === '/shop' && searchParams.get('search')) {
      navigate('/shop');
    }
  }, [debouncedQuery, navigate, isSearchOpen, location.pathname, searchParams]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  const handleClearSearch = () => {
    closeSearch(true);
  };

  const handleLogout = async () => {
    await signOut();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <>
      {/* Main Header - One Line Layout */}
      <header className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-border transition-all duration-300 ${isScrolled ? 'shadow-sm' : ''}`}>
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex h-16 lg:h-20 items-center justify-between">

            {/* LEFT - Logo */}
            <div className="flex-shrink-0 flex items-center justify-center py-1">
              <Link to="/" className="flex items-center overflow-visible">
                <img
                  src={logo}
                  alt="Naikfoods"
                  className="h-20 w-18 transition-transform duration-300 hover:scale-110"
                />
              </Link>
            </div>

            {/* CENTER - Desktop Navigation */}
            <nav className="hidden lg:flex flex-1 items-center justify-center px-8">
              <div className="flex items-center gap-8">
                <Link
                  to="/"
                  className={`text-xs font-medium uppercase tracking-[0.15em] transition-colors ${location.pathname === '/' ? 'text-[#02013f]' : 'text-foreground hover:text-[#02013f]'
                    }`}
                >
                  Home
                </Link>
                <Link
                  to="/shop"
                  className={`text-xs font-medium uppercase tracking-[0.15em] transition-colors ${location.pathname === '/shop' ? 'text-[#02013f]' : 'text-foreground hover:text-[#02013f]'
                    }`}
                >
                  Shop
                </Link>
                <Link
                  to="/shop?filter=new"
                  className="text-xs font-medium uppercase tracking-[0.15em] text-foreground hover:text-[#02013f] transition-colors"
                >
                  New Arrivals
                </Link>
                <Link
                  to="/shop?filter=bestseller"
                  className="text-xs font-medium uppercase tracking-[0.15em] text-foreground hover:text-[#02013f] transition-colors"
                >
                  On Sale
                </Link>
                <Link
                  to="/about"
                  className={`text-xs font-medium uppercase tracking-[0.15em] transition-colors ${location.pathname === '/about' ? 'text-[#02013f]' : 'text-foreground hover:text-[#02013f]'
                    }`}
                >
                  About
                </Link>
                {isAuthenticated && (
                  <Link
                    to="/orders"
                    className={`text-xs font-medium uppercase tracking-[0.15em] transition-colors ${location.pathname === '/orders' ? 'text-[#02013f]' : 'text-foreground hover:text-[#02013f]'
                      }`}
                  >
                    My Orders
                  </Link>
                )}
                <a
                  href="#contact"
                  className="text-xs font-medium uppercase tracking-[0.15em] text-foreground transition-colors hover:text-[#02013f]"
                >
                  Contact
                </a>
              </div>
            </nav>

            {/* RIGHT - Utility Icons */}
            <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">

              {/* Search */}
              <div ref={searchWrapperRef} className="relative flex items-center">
                <button
                  onClick={() => {
                    if (isSearchOpen) {
                      closeSearch(location.pathname === '/shop');
                      return;
                    }
                    setIsSearchOpen(true);
                  }}
                  className="p-2 hover:bg-secondary transition"
                  aria-label="Search"
                >
                  <Search size={20} className="text-foreground" />
                </button>

                <div className="flex items-center">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className={`absolute right-0 top-12 z-50 bg-white text-sm shadow-xl ring-1 ring-border transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#02013f] lg:static lg:shadow-none ${isSearchOpen
                      ? 'w-[200px] lg:w-64 px-4 py-2 opacity-100 ml-2'
                      : 'pointer-events-none w-0 px-0 py-0 opacity-0'
                      }`}
                    aria-label="Search products"
                  />
                  {searchQuery && isSearchOpen && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-2 top-[3.25rem] z-50 p-2 hover:bg-secondary transition lg:static lg:ml-1 lg:p-1"
                      aria-label="Clear search"
                    >
                      <X size={14} className="text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>

              {/* Wishlist - Desktop Only */}
              <Link to="/wishlist" className="hidden lg:flex p-2 hover:bg-secondary transition relative">
                <Heart size={20} className="text-foreground" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 bg-[#02013f] text-white text-[10px] font-medium w-4 h-4 flex items-center justify-center rounded-full">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* User Menu/Avatar - Desktop Only */}
              {isAuthenticated ? (
                <div ref={userMenuRef} className="relative hidden lg:block">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="p-2 hover:bg-secondary transition"
                    aria-label="Account"
                  >
                    <Avatar className="h-7 w-7 border border-border cursor-pointer hover:border-[#02013f] transition-colors">
                      <AvatarImage src={user?.photoURL || ""} />
                      <AvatarFallback className="bg-secondary text-foreground font-semibold text-xs">
                        {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "M"}
                      </AvatarFallback>
                    </Avatar>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white shadow-xl border border-border py-2 z-50">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {user?.displayName || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email}
                        </p>
                      </div>
                      <Link
                        to="/orders"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Truck size={16} />
                        My Orders
                      </Link>
                      <Link
                        to="/wishlist"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Heart size={16} />
                        Wishlist
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-secondary flex items-center gap-2 transition-colors"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="hidden lg:flex p-2 hover:bg-secondary transition"
                  aria-label="Login"
                >
                  <User size={20} className="text-foreground" />
                </button>
              )}

              {/* Cart */}
              <Link to="/cart" className="relative flex p-2 hover:bg-secondary transition">
                <ShoppingCart size={20} className="text-foreground" />
                {totalItems > 0 && (
                  <span className="absolute top-0 right-0 bg-[#02013f] text-white text-[10px] font-medium w-4 h-4 flex items-center justify-center rounded-full">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border lg:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="flex justify-around items-center h-16 px-2">

          {/* Home */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center min-w-[60px] transition-colors ${location.pathname === "/"
              ? "text-[#02013f]"
              : "text-muted-foreground"
              }`}
          >
            <Home size={22} strokeWidth={1.5} />
            <span className="text-[10px] mt-1 font-medium uppercase tracking-wide">Home</span>
          </Link>

          {/* Shop */}
          <Link
            to="/shop"
            className={`flex flex-col items-center justify-center min-w-[60px] transition-colors ${location.pathname === "/shop"
              ? "text-[#02013f]"
              : "text-muted-foreground"
              }`}
          >
            <ShoppingBag size={22} strokeWidth={1.5} />
            <span className="text-[10px] mt-1 font-medium uppercase tracking-wide">Shop</span>
          </Link>

          {/* About */}
          <Link
            to="/about"
            className={`flex flex-col items-center justify-center min-w-[50px] transition-colors ${location.pathname === "/about"
              ? "text-[#02013f]"
              : "text-muted-foreground"
              }`}
          >
            <Info size={22} strokeWidth={1.5} />
            <span className="text-[10px] mt-1 font-medium uppercase tracking-wide">About</span>
          </Link>

          {/* Wishlist */}
          <Link
            to="/wishlist"
            className={`flex flex-col items-center justify-center relative min-w-[50px] transition-colors ${location.pathname === "/wishlist"
              ? "text-[#02013f]"
              : "text-muted-foreground"
              }`}
          >
            <div className="relative">
              <Heart size={22} strokeWidth={1.5} />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-[#02013f] text-white text-[10px] w-4 h-4 flex items-center justify-center font-semibold rounded-full">
                  {wishlistCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 font-medium uppercase tracking-wide">Wishlist</span>
          </Link>

          {/* Profile / Orders / Logout */}
          {!isAuthenticated ? (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex flex-col items-center justify-center min-w-[50px] text-muted-foreground transition-colors hover:text-[#02013f]"
            >
              <User size={22} strokeWidth={1.5} />
              <span className="text-[10px] mt-1 font-medium uppercase tracking-wide">Login</span>
            </button>
          ) : (
            <>
              {/* Orders */}
              <Link
                to="/orders"
                className={`flex flex-col items-center justify-center min-w-[50px] transition-colors ${location.pathname === "/orders"
                  ? "text-[#02013f]"
                  : "text-muted-foreground"
                  }`}
              >
                <Truck size={22} strokeWidth={1.5} />
                <span className="text-[10px] mt-1 font-medium uppercase tracking-wide">Orders</span>
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex flex-col items-center justify-center min-w-[50px] text-muted-foreground transition-colors hover:text-red-500"
              >
                <LogOut size={22} strokeWidth={1.5} />
                <span className="text-[10px] mt-1 font-medium uppercase tracking-wide">Logout</span>
              </button>
            </>
          )}

        </div>
      </div>
    </>
  );
}
