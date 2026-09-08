import { motion } from 'framer-motion';

const marqueeItems = [
  "Aaji's recipes",
  "Small-batch goodness",
  "No artificial preservatives",
  "Authentic regional flavours",
  "Packed fresh with care",
  "Taste of tradition",
  "Aaji's recipes",
  "Small-batch goodness",
  "No artificial preservatives",
  "Authentic regional flavours",
  "Packed fresh with care",
  "Taste of tradition"
];

export function Marquee() {
  return (
    <div className="w-full border-y border-border/50 bg-background py-3 overflow-hidden flex items-center">
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: [0, -1035] }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: 20
        }}
      >
        <div className="flex items-center">
          {marqueeItems.map((item, i) => (
            <div key={i} className="flex items-center">
              <span className="text-xs font-semibold tracking-[0.15em] uppercase text-foreground/90 mx-6">
                {item}
              </span>
              <span className="text-primary text-[10px]">✦</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
