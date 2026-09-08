import { motion } from 'framer-motion';
import { ShieldCheck, Lock, CreditCard } from 'lucide-react';

const steps = [
    { label: 'Validating your payment', done: true },
    { label: 'Confirming stock availability', done: true },
    { label: 'Creating your order', done: false },
];

export default function ProcessingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#66021F] via-[#4a0116] to-[#2a000d] flex flex-col items-center justify-center p-4">
            {/* Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.93 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-10 text-white text-center shadow-2xl"
            >
                {/* Animated lock icon */}
                <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
                    className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 relative"
                >
                    {/* Pulsing ring */}
                    <motion.div
                        className="absolute inset-0 rounded-full bg-white/10"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <Lock size={32} className="relative z-10" />
                </motion.div>

                <motion.h1
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-bold mb-2"
                >
                    Securing Your Order
                </motion.h1>

                <motion.p
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-white/70 text-sm mb-8 leading-relaxed"
                >
                    Please do not refresh or press the back button.
                    <br />Your transaction is being processed securely.
                </motion.p>

                {/* Progress steps */}
                <div className="space-y-3 mb-8">
                    {steps.map((step, i) => (
                        <motion.div
                            key={step.label}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.35 + i * 0.12 }}
                            className="flex items-center gap-3 text-left"
                        >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-green-400' : 'bg-white/20'}`}>
                                {step.done ? (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <motion.div
                                        className="w-2.5 h-2.5 rounded-full bg-white"
                                        animate={{ scale: [1, 0.6, 1] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    />
                                )}
                            </div>
                            <span className={`text-sm ${step.done ? 'text-white/90' : 'text-white/50'}`}>
                                {step.label}
                            </span>
                        </motion.div>
                    ))}
                </div>

                {/* Progress bar */}
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-6">
                    <motion.div
                        className="h-full bg-gradient-to-r from-white/60 to-white"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                    />
                </div>

                {/* Security badges */}
                <div className="flex items-center justify-center gap-4 text-white/50 text-xs">
                    <div className="flex items-center gap-1">
                        <ShieldCheck size={14} />
                        <span>256-bit SSL</span>
                    </div>
                    <div className="w-px h-4 bg-white/20" />
                    <div className="flex items-center gap-1">
                        <CreditCard size={14} />
                        <span>Razorpay Secured</span>
                    </div>
                </div>
            </motion.div>

            {/* Brand at bottom */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-8 text-white/30 text-xs tracking-widest uppercase"
            >
                Naikfoods · Authentic regional foods
            </motion.p>
        </div>
    );
}
