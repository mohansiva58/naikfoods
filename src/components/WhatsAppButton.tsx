import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export function WhatsAppButton() {
  const location = useLocation();
  const phoneNumber = '+919730046247';
  const message = 'Hi! I\'m interested in your products.';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  if (location.pathname === '/developedby-sybarites') {
    return null;
  }

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-20 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow lg:bottom-6"
    >
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" className="text-white">
        <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.993L2 22l5.13-1.346a9.945 9.945 0 0 0 4.881 1.279h.005c5.505 0 9.989-4.478 9.99-9.985A9.983 9.983 0 0 0 12.012 2zm5.726 14.127c-.246.696-1.428 1.258-1.957 1.346-.48.08-1.107.133-3.176-.72-2.646-1.09-4.33-3.79-4.46-3.96-.13-.172-1.05-1.398-1.05-2.673 0-1.274.66-1.902.893-2.147.23-.245.508-.306.677-.306.17 0 .341.002.49.009.155.008.363-.06.568.437.21.51.717 1.748.778 1.874.06.126.1.272.016.438-.083.166-.124.272-.248.417-.124.145-.26.324-.372.437-.125.126-.255.263-.11.513.146.25.648 1.07 1.39 1.733.957.854 1.76 1.118 2.01 1.243.25.125.395.105.543-.066.147-.172.63-.733.798-.983.168-.25.337-.21.567-.124.23.087 1.458.687 1.71.812.252.125.42.187.482.294.062.106.062.616-.184 1.312z" />
      </svg>
      <motion.span
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[9px] flex items-center justify-center font-medium"
      >
        1
      </motion.span>
    </motion.a>
  );
}
