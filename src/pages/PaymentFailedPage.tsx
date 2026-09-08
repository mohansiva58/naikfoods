import { motion } from 'framer-motion';
import { XCircle, RefreshCw, ShoppingCart, AlertCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function PaymentFailedPage() {
    const location = useLocation();
    const error = location.state?.error || "Transaction was declined by the bank.";

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1 flex items-center justify-center p-4 py-12">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-card rounded-3xl shadow-2xl overflow-hidden"
                >
                    <div className="bg-destructive p-8 text-destructive-foreground text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
                            <XCircle size={40} strokeWidth={2.5} />
                        </div>
                        <h1 className="text-3xl font-serif font-bold mb-2">Payment Failed</h1>
                        <p className="opacity-90">Don't worry, no money was deducted.</p>
                    </div>

                    <div className="p-8 text-center">
                        <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-xl mb-8 text-left">
                            <AlertCircle className="text-destructive shrink-0" size={20} />
                            <p className="text-sm text-destructive-foreground/80 leading-relaxed">
                                <span className="font-bold">Reason:</span> {error}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Link to="/checkout" className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                                <RefreshCw size={20} />
                                Try Payment Again
                            </Link>
                            <Link to="/cart" className="flex items-center justify-center gap-2 w-full py-4 bg-secondary text-secondary-foreground rounded-xl font-bold hover:bg-secondary/80 transition-colors">
                                <ShoppingCart size={20} />
                                Return to Cart
                            </Link>
                        </div>

                        <p className="mt-8 text-xs text-muted-foreground">
                            If the amount was deducted, it will be refunded within 5-7 working days.
                        </p>
                    </div>
                </motion.div>
            </main>
            <Footer />
        </div>
    );
}
