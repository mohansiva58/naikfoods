import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const customEase = [0.76, 0, 0.23, 1] as const;
const TRANSITION = { duration: 1.2, ease: customEase as unknown as "easeInOut" };

const PANEL_HEIGHT = 140;
const THUMB_H = 160;
const THUMB_W = 110;

type HeroSlide = {
  id: string;
  name: string;
  bgColor: string;
  description: string;
  themeText: string;
  heroImage: string;
  thumbnail: string;
  useVideo?: boolean;
};

const slides: HeroSlide[] = [
  {
    id: "banana-chips",
    name: "Banana Chips",
    bgColor: "#072911",
    description:
      "Thin, crisp banana chips made in small batches with traditional flavours. A golden snack for every gathering.",
    themeText: "BANANA CHIPS",
    heroImage: "/image2.png",
    thumbnail: "/image2.png",
  },

  {
    id: "ambadi-pickle",
    name: "Ambadi Bhajiche Lonche",
    bgColor: "#330909",
    description:
      "Ambadi bhajiche lonche with a bright tang, warm spice and the unmistakable taste of a Maharashtrian kitchen.",
    themeText: "TRADITION",
    heroImage: "/image3.png",
    thumbnail: "/image3.png",
  },

  {
    id: "murukku",
    name: "Murukku",
    bgColor: "#5b7410",
    description:
      "Crispy, crunchy murukku prepared with familiar ingredients and a recipe that tastes like home.",
    themeText: "MURUKKU",
    heroImage: "/image.png",
    thumbnail: "/image.png",
  },
];

export function HeroSection() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (index: number) => {
    if (isAnimating) return;
    setCurrentIndex(index);
  };

  const nextSlide = useCallback(() => {
    if (isAnimating) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [isAnimating]);

  const prevSlide = useCallback(() => {
    if (isAnimating) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [isAnimating]);

  const resetAutoPlay = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
  };

  useEffect(() => {
    resetAutoPlay();
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        resetAutoPlay();
        nextSlide();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        resetAutoPlay();
        prevSlide();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAnimating, nextSlide, prevSlide]);

  const currentSlide = slides[currentIndex];

  return (
    <section
      id="home"
      className="relative w-full overflow-hidden select-none cursor-pointer"
      style={{ height: "100svh" }}
      onClick={() => {
        resetAutoPlay();
        nextSlide();
      }}
    >
      {/* Background Color */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id + "-bg"}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{ backgroundColor: currentSlide.bgColor }}
          onAnimationStart={() => setIsAnimating(true)}
          onAnimationComplete={() => setIsAnimating(false)}
        />
      </AnimatePresence>

      {/* Grain overlay */}
      <div className="bg-noise" />

      {/* ─── LARGE BACKGROUND TEXT TRACK ─── */}
      {/* Parent must NOT use flex centering — track starts at top:0 */}
      <div
        className="absolute inset-0 z-10 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <motion.div
          className="flex flex-col w-full"
          style={{ top: 0, left: 0, right: 0, position: "absolute" }}
          animate={{ y: `${-currentIndex * 100}vh` }}
          transition={TRANSITION}
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="flex-shrink-0 flex items-center justify-center"
              style={{ height: "100svh", width: "100%" }}
            >
              <h1
                className="font-heading font-black text-white text-gradient-mask"
                style={{
                  fontSize: "clamp(80px, 22vw, 340px)",
                  lineHeight: 0.85,
                  letterSpacing: "-0.02em",
                  userSelect: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {slide.themeText}
              </h1>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ─── CENTER HERO IMAGE / VIDEO ─── */}
      <div
        className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
        style={{ paddingTop: "72px" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id + "-hero"}
            initial={{ opacity: 0, x: "6%", scale: 1.05 }}
            animate={{ opacity: 1, x: "0%", scale: 1 }}
            exit={{ opacity: 0, x: "-6%", scale: 0.95 }}
            transition={{ ...TRANSITION, delay: 0.15 }}
            className="flex h-[56vh] w-[82vw] items-center justify-center sm:h-[66vh] sm:w-auto sm:max-w-[78vw]"
          >
            {currentSlide.useVideo ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-contain drop-shadow-[0_22px_45px_rgba(0,0,0,0.4)] sm:w-auto"
                src="https://bosmartwash.in/assets/images/hero.mp4"
              />
            ) : (
              <img
                src={currentSlide.heroImage}
                alt={currentSlide.name}
                className="h-full w-full object-contain drop-shadow-[0_22px_45px_rgba(0,0,0,0.4)] sm:w-auto"
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── BOOK CTA — bottom center ─── */}
      <div className="absolute z-30 bottom-15 left-1/2 -translate-x-1/2">
        <button
          onClick={(e) => { e.stopPropagation(); navigate('/shop'); }}
          className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold rounded-full px-7 py-3 text-sm shadow-xl hover:bg-neutral-100 transition-colors"
        >
          Shop Collection
          <span className="w-6 h-6 bg-black rounded-full flex items-center justify-center text-white text-xs">→</span>
        </button>
      </div>

      {/* ─── INFO PANEL — BOTTOM LEFT ─── */}
      <div
        className="absolute z-30 pointer-events-none"
        style={{ bottom: 56, left: "clamp(20px, 4vw, 48px)" }}
      >
        <div
          className="overflow-hidden"
          style={{ height: PANEL_HEIGHT, width: "min(340px, calc(100vw - 200px))" }}
        >
          <motion.div
            className="flex flex-col"
            animate={{ y: -currentIndex * PANEL_HEIGHT }}
            transition={TRANSITION}
          >
            {slides.map((slide) => (
              <div
                key={slide.id}
                className="flex flex-col justify-center"
                style={{ height: PANEL_HEIGHT, flexShrink: 0 }}
              >
                <h2
                  className="font-sans font-black text-white uppercase"
                  style={{ fontSize: "clamp(16px, 2vw, 26px)", letterSpacing: "0.08em", marginBottom: 10 }}
                >
                  {slide.name}
                </h2>
                <div style={{ width: 48, height: 1, background: "rgba(255,255,255,0.4)", marginBottom: 10 }} />
                <p
                  className="text-white/80 leading-relaxed"
                  style={{ fontSize: "clamp(11px, 1.1vw, 14px)", maxWidth: 320 }}
                >
                  {slide.description}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ─── TAGLINE — RIGHT CENTER ─── */}
      <div
        className="absolute z-30 pointer-events-none hidden md:block"
        style={{ right: 48, top: "50%", transform: "translateY(-50%)", width: 180, textAlign: "right" }}
      >
        <h3
          className="font-heading text-white uppercase"
          style={{ fontSize: "clamp(14px, 1.4vw, 20px)", lineHeight: 1.2, letterSpacing: "0.05em" }}
        >
          From our kitchen to yours.
        </h3>
      </div>

      {/* ─── THUMBNAIL — BOTTOM RIGHT ─── */}
      <div
        className="absolute z-30 pointer-events-none hidden sm:block"
        style={{ bottom: 56, right: 48 }}
      >
        <div
          className="overflow-hidden rounded-xl shadow-2xl"
          style={{ width: THUMB_W, height: THUMB_H, border: "1px solid rgba(255,255,255,0.15)" }}
        >
          <motion.div
            className="flex flex-col"
            animate={{ y: -currentIndex * THUMB_H }}
            transition={TRANSITION}
          >
            {slides.map((slide) => (
              <div
                key={slide.id}
                className="bg-black/20 flex-shrink-0"
                style={{ width: THUMB_W, height: THUMB_H }}
              >
                <img
                  src={slide.thumbnail}
                  alt={slide.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ─── PROGRESS DOTS ─── */}
      <div
        className="absolute z-30 flex gap-3 items-center"
        style={{ bottom: 24, left: "50%", transform: "translateX(-50%)" }}
      >
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              goTo(i);
              resetAutoPlay();
            }}
            aria-label={`Go to slide ${i + 1}`}
            style={{ background: "none", border: "none", padding: "8px 4px", cursor: "pointer" }}
          >
            <div
              style={{
                height: 4,
                borderRadius: 9999,
                transition: "all 0.4s ease",
                width: i === currentIndex ? 48 : 16,
                background: i === currentIndex ? "white" : "rgba(255,255,255,0.35)",
              }}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
