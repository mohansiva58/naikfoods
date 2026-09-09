import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Instagram, Play } from 'lucide-react';
import { api } from '@/services/api';

/**
 * InstagramFeed — "From Our Instagram" home page section.
 *
 * Data flow:  /api/instagram  →  normalized posts  →  grid of cards.
 *
 * Robustness contract (the section must NEVER look broken):
 *  - Backend always returns 200 with usable posts (API → Redis → Mongo → local).
 *  - If the request itself fails, the component silently renders the same
 *    local fallback dataset the backend would have returned.
 *  - If an individual image/thumbnail fails, the card swaps to the local
 *    fallback image (loop-protected; worst case shows a branded tile bg).
 *  - No console errors are emitted from this component.
 */

interface InstagramPost {
  id: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  mediaUrl: string;
  thumbnailUrl: string;
  caption: string;
  permalink: string;
  timestamp: string;
}

interface InstagramResponse {
  success: boolean;
  source: 'instagram' | 'cache' | 'fallback';
  posts: InstagramPost[];
}

/** Local mirror of the backend's curated fallback (used if even the API call fails). */
const LOCAL_FALLBACK_POSTS: InstagramPost[] = [
  { id: 'fallback-1', mediaType: 'IMAGE', mediaUrl: '/pics/instagram/fallback-1.svg', thumbnailUrl: '', caption: 'Taste of tradition', permalink: '', timestamp: '' },
  { id: 'fallback-2', mediaType: 'IMAGE', mediaUrl: '/pics/instagram/fallback-2.svg', thumbnailUrl: '', caption: 'Crispy goodness', permalink: '', timestamp: '' },
  { id: 'fallback-3', mediaType: 'IMAGE', mediaUrl: '/pics/instagram/fallback-3.svg', thumbnailUrl: '', caption: 'Authentic flavours', permalink: '', timestamp: '' },
  { id: 'fallback-4', mediaType: 'IMAGE', mediaUrl: '/pics/instagram/fallback-4.svg', thumbnailUrl: '', caption: 'Made with love', permalink: '', timestamp: '' },
  { id: 'fallback-5', mediaType: 'IMAGE', mediaUrl: '/pics/instagram/fallback-5.svg', thumbnailUrl: '', caption: 'Fresh every day', permalink: '', timestamp: '' },
  { id: 'fallback-6', mediaType: 'IMAGE', mediaUrl: '/pics/instagram/fallback-6.svg', thumbnailUrl: '', caption: 'From our kitchen', permalink: '', timestamp: '' },
];

const FALLBACK_IMAGE = '/pics/instagram/fallback-1.svg';

/** Optional: set VITE_INSTAGRAM_PROFILE_URL in the frontend .env to enable the CTA link. */
const INSTAGRAM_PROFILE_URL = (import.meta.env.VITE_INSTAGRAM_PROFILE_URL as string | undefined) || '';

const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('instagram.com');
  } catch {
    return false;
  }
};

function InstagramCard({ post, index }: { post: InstagramPost; index: number }) {
  const isVideo = post.mediaType === 'VIDEO';
  // Prefer the thumbnail for videos/reels; fall back to mediaUrl for images.
  const primarySrc = (isVideo && post.thumbnailUrl) || post.mediaUrl || FALLBACK_IMAGE;

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // Loop protection: only swap to fallback once; if the fallback itself
    // fails, hide the img but keep the branded card background visible.
    if (img.dataset.fbApplied !== 'true' && img.src !== window.location.origin + FALLBACK_IMAGE) {
      img.dataset.fbApplied = 'true';
      img.src = FALLBACK_IMAGE;
    } else {
      img.style.visibility = 'hidden';
    }
  };

  const media = (
    <img
      src={primarySrc}
      alt={post.caption || 'Naik Foods Instagram post'}
      loading="lazy"
      decoding="async"
      onError={handleImgError}
      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
    />
  );

  const content = (
    <>
      {media}

      {/* Subtle hover veil */}
      <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/25" />

      {/* Play badge for reels/videos */}
      {isVideo && (
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/70 bg-black/35 text-white backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
            <Play size={18} fill="currentColor" className="ml-0.5" />
          </span>
        </span>
      )}

      {/* Caption overlay (appears on hover/focus, decorative — full text via alt/title) */}
      {post.caption && (
        <div className="absolute inset-x-0 bottom-0 translate-y-2 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <p className="line-clamp-2 text-[11px] leading-snug text-white/95 drop-shadow">
            {post.caption}
          </p>
        </div>
      )}

      <Instagram
        size={14}
        aria-hidden="true"
        className="absolute right-2.5 top-2.5 text-white/80 drop-shadow"
      />
    </>
  );

  const cardClass =
    'group relative block aspect-square overflow-hidden rounded-sm bg-[linear-gradient(135deg,#1a1714_0%,#2b241c_100%)] outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

  // Only real API posts carry permalinks — never invent Instagram URLs.
  if (post.permalink && isValidUrl(post.permalink)) {
    return (
      <motion.a
        href={post.permalink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={post.caption ? `View on Instagram: ${post.caption}` : 'View post on Instagram'}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45, delay: index * 0.05 }}
        className={cardClass}
        title={post.caption || undefined}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.05 }}
      className={cardClass}
      title={post.caption || undefined}
    >
      {content}
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="aspect-square animate-pulse rounded-sm bg-secondary"
      aria-hidden="true"
    />
  );
}

export function InstagramFeed() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // api instance baseURL already ends with /api
        const { data } = await api.get<InstagramResponse>('/instagram', { timeout: 10000 });
        if (!cancelled && data?.success && Array.isArray(data.posts) && data.posts.length > 0) {
          setPosts(data.posts);
        } else if (!cancelled) {
          setPosts(LOCAL_FALLBACK_POSTS);
        }
      } catch {
        // Network/server failure — silently use the local curated feed.
        // The customer must never see an error state here.
        if (!cancelled) setPosts(LOCAL_FALLBACK_POSTS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="border-b border-border/50 bg-white py-12 sm:py-16" aria-label="From our Instagram">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* Section heading — matches existing section typography */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <p className="mb-3 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            <Instagram size={14} aria-hidden="true" />
            Stay Connected
          </p>
          <h2 className="mb-3 font-serif text-3xl font-bold text-foreground sm:text-4xl">
            From Our Instagram
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Fresh from our kitchen to your feed
          </p>
        </motion.div>

        {/* Feed grid / skeleton */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6" role="status" aria-label="Loading Instagram posts">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {posts.slice(0, 6).map((post, index) => (
              <InstagramCard key={post.id} post={post} index={index} />
            ))}
          </div>
        )}

        {/* CTA — link only when a real profile URL is configured (never invent URLs) */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          {INSTAGRAM_PROFILE_URL && isValidUrl(INSTAGRAM_PROFILE_URL) ? (
            <a
              href={INSTAGRAM_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 border border-border px-8 py-3 text-xs font-medium uppercase tracking-wider text-foreground transition-all duration-300 hover:bg-foreground hover:text-background outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Instagram size={16} aria-hidden="true" />
              Follow us on Instagram
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Instagram size={16} aria-hidden="true" />
              Follow us on Instagram
            </span>
          )}
        </motion.div>
      </div>
    </section>
  );
}