import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, Mail, Lock, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { getPopupErrorMessage } from '@/utils/popupErrorHandler';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, signUp, signInWithGoogle } = useAuth();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                await signIn(email, password);
            } else {
                await signUp(email, password);
            }
            onClose();
            onSuccess?.();
        } catch (err: unknown) {
            const error = err as { code?: string; message?: string };
            // If email already exists during signup, auto-switch to login
            if (error.code === 'auth/email-already-in-use') {
                setTimeout(() => {
                    setIsLogin(true);
                    toast.info('Switched to Sign In mode - please enter your password');
                }, 1500);
            }
            console.error('Auth error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            await signInWithGoogle();
            onClose();
            onSuccess?.();
        } catch (error: unknown) {
            const authError = error as { code?: string; message?: string };
            console.error('Google sign in error:', authError);
            
            // Show user-friendly error message using utility
            const errorMessage = getPopupErrorMessage(error);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl overflow-hidden lg:max-w-lg"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-secondary rounded-full transition-colors z-10"
                    aria-label="Close login"
                >
                    <X size={20} />
                </button>

                <Link
                    to="/"
                    onClick={onClose}
                    className="absolute left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/15 text-primary-foreground transition-colors hover:bg-background/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background"
                    aria-label="Go to home"
                >
                    <Home size={18} />
                </Link>

                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-accent p-8 pt-14 text-primary-foreground">
                    <h2 className="text-3xl font-serif font-bold mb-2">
                        {isLogin ? 'Welcome Back!' : 'Create Account'}
                    </h2>
                    <p className="text-primary-foreground/80">
                        {isLogin ? 'Sign in to continue shopping' : 'Join Naikfoods today'}
                    </p>
                </div>

                {/* Form */}
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="your@email.com"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full pl-10 pr-4 py-3 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="••••••••"
                                />
                            </div>
                            {!isLogin && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Password must be at least 6 characters
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3 font-semibold disabled:opacity-50"
                        >
                            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                        </motion.button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-sm text-muted-foreground">OR</span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Google Sign In */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-3 bg-background text-foreground rounded-lg border border-border hover:bg-secondary transition-colors font-medium disabled:opacity-50"
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" />
                            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.71.48-1.62.75-2.7.75-2.08 0-3.84-1.4-4.47-3.29H1.8v2.08A7.98 7.98 0 0 0 8.98 17z" />
                            <path fill="#FBBC05" d="M4.5 10.52A4.8 4.8 0 0 1 4.25 9c0-.53.09-1.04.25-1.52V5.4H1.8a7.98 7.98 0 0 0 0 7.2l2.7-2.08z" />
                            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A7.98 7.98 0 0 0 1.8 5.4l2.7 2.08c.63-1.89 2.39-3.29 4.47-3.29z" />
                        </svg>
                        Continue with Google
                    </motion.button>

                    {/* Toggle */}
                    <p className="text-center mt-6 text-sm text-muted-foreground">
                        {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setPassword(''); // Clear password when switching
                            }}
                            className="text-primary font-medium hover:underline"
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};
