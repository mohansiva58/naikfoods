import { Request, Response } from 'express';
import InstagramPost from '../models/InstagramPost';
import { cacheGet, cacheSet } from '../utils/cache';

/**
 * Instagram feed controller.
 *
 * Fallback priority (never throws to the client):
 *   1. Fresh Instagram Graph API data
 *   2. Redis cache (recent successful sync)
 *   3. MongoDB cache (last successful sync)
 *   4. Local curated fallback posts (bundled with the site)
 *
 * The endpoint ALWAYS returns HTTP 200 with usable posts so the
 * frontend never enters an error state. Technical errors are logged
 * server-side only — no API errors, tokens, or stack traces are
 * ever exposed to the browser.
 */

const POST_LIMIT = 6;

// Refresh cadence: do not hit the Instagram API more than once every 30 min
const REDIS_TTL_SECONDS = 30 * 60;

const REDIS_KEY = 'instagram:feed';

interface NormalizedPost {
    id: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
    mediaUrl: string;
    thumbnailUrl: string;
    caption: string;
    permalink: string;
    timestamp: string;
}

/** Curated local fallback — always available, no network required. */
const LOCAL_FALLBACK_POSTS: NormalizedPost[] = [
    {
        id: 'fallback-1',
        mediaType: 'IMAGE',
        mediaUrl: '/pics/instagram/fallback-1.svg',
        thumbnailUrl: '',
        caption: 'Taste of tradition',
        permalink: '',
        timestamp: '',
    },
    {
        id: 'fallback-2',
        mediaType: 'IMAGE',
        mediaUrl: '/pics/instagram/fallback-2.svg',
        thumbnailUrl: '',
        caption: 'Crispy goodness',
        permalink: '',
        timestamp: '',
    },
    {
        id: 'fallback-3',
        mediaType: 'IMAGE',
        mediaUrl: '/pics/instagram/fallback-3.svg',
        thumbnailUrl: '',
        caption: 'Authentic flavours',
        permalink: '',
        timestamp: '',
    },
    {
        id: 'fallback-4',
        mediaType: 'IMAGE',
        mediaUrl: '/pics/instagram/fallback-4.svg',
        thumbnailUrl: '',
        caption: 'Made with love',
        permalink: '',
        timestamp: '',
    },
    {
        id: 'fallback-5',
        mediaType: 'IMAGE',
        mediaUrl: '/pics/instagram/fallback-5.svg',
        thumbnailUrl: '',
        caption: 'Fresh every day',
        permalink: '',
        timestamp: '',
    },
    {
        id: 'fallback-6',
        mediaType: 'IMAGE',
        mediaUrl: '/pics/instagram/fallback-6.svg',
        thumbnailUrl: '',
        caption: 'From our kitchen',
        permalink: '',
        timestamp: '',
    },
];

/** Safely extract caption text, truncated for UI display. */
const normalizeCaption = (raw: unknown): string => {
    if (typeof raw !== 'string') return '';
    const clean = raw.replace(/\s+/g, ' ').trim();
    return clean.length > 120 ? `${clean.slice(0, 117)}…` : clean;
};

/** Only allow https permalinks back to instagram.com (never invent URLs). */
const normalizePermalink = (raw: unknown): string => {
    if (typeof raw !== 'string') return '';
    try {
        const url = new URL(raw);
        if (url.protocol === 'https:' && url.hostname.endsWith('instagram.com')) {
            return url.toString();
        }
    } catch {
        // ignore malformed URLs
    }
    return '';
};

/**
 * Transform a raw Instagram Graph API media object into the clean,
 * frontend-friendly shape. Returns null for entries that are unusable
 * (e.g. deleted media with no URL) so one bad post never breaks the feed.
 */
const normalizeApiPost = (item: any): NormalizedPost | null => {
    if (!item || typeof item !== 'object' || !item.id) return null;

    const mediaType: NormalizedPost['mediaType'] =
        item.media_type === 'VIDEO'
            ? 'VIDEO'
            : item.media_type === 'CAROUSEL_ALBUM'
            ? 'CAROUSEL_ALBUM'
            : 'IMAGE';

    const mediaUrl = typeof item.media_url === 'string' ? item.media_url : '';
    const thumbnailUrl = typeof item.thumbnail_url === 'string' ? item.thumbnail_url : '';

    // A post must have at least one usable visual; otherwise skip it.
    if (!mediaUrl && !thumbnailUrl) return null;

    return {
        id: String(item.id),
        mediaType,
        mediaUrl,
        thumbnailUrl,
        caption: normalizeCaption(item.caption),
        permalink: normalizePermalink(item.permalink),
        timestamp: typeof item.timestamp === 'string' ? item.timestamp : '',
    };
};

/** Fetch + normalize from the Instagram Graph API. Returns null on any failure. */
const fetchFromInstagramApi = async (): Promise<NormalizedPost[] | null> => {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    const userId = process.env.INSTAGRAM_USER_ID;

    // Credentials not configured yet — silently use fallback content.
    if (!token || !userId) return null;

    const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
    const url = `https://graph.instagram.com/v21.0/${encodeURIComponent(
        userId
    )}/media?fields=${fields}&limit=${POST_LIMIT}&access_token=${encodeURIComponent(token)}`;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) return null;

        const data: unknown = await response.json();
        if (
            !data ||
            typeof data !== 'object' ||
            !Array.isArray((data as { data?: unknown }).data)
        ) {
            return null;
        }

        const posts = (data as { data: unknown[] }).data
            .map(normalizeApiPost)
            .filter((p: NormalizedPost | null): p is NormalizedPost => p !== null)
            .slice(0, POST_LIMIT);

        return posts.length > 0 ? posts : null;
    } catch {
        // Network failure, timeout, invalid JSON, expired token, etc.
        return null;
    }
};

/** Persist a successful sync to Redis (short TTL) and MongoDB (long-lived). */
const persistFeed = async (posts: NormalizedPost[]): Promise<void> => {
    await cacheSet(REDIS_KEY, posts, REDIS_TTL_SECONDS);

    try {
        // Replace the cached collection with the fresh snapshot.
        await InstagramPost.deleteMany({});
        if (posts.length > 0) {
            await InstagramPost.insertMany(
                posts.map((p) => ({ ...p, fetchedAt: new Date() }))
            );
        }
    } catch (err) {
        console.error('Instagram cache persist failed:', (err as Error).message);
    }
};

/** Read the last synced feed from MongoDB (Level-2 fallback). */
const readMongoCache = async (): Promise<NormalizedPost[] | null> => {
    try {
        const docs = await InstagramPost.find({})
            .sort({ timestamp: -1, fetchedAt: -1 })
            .limit(POST_LIMIT)
            .lean();

        if (!docs || docs.length === 0) return null;

        return docs.map((d) => ({
            id: d.postId,
            mediaType: d.mediaType,
            mediaUrl: d.mediaUrl,
            thumbnailUrl: d.thumbnailUrl,
            caption: d.caption,
            permalink: d.permalink,
            timestamp: d.timestamp,
        }));
    } catch {
        return null;
    }
};

/**
 * GET /api/instagram
 * Always responds 200 with { success, source, posts }.
 */
export const getInstagramFeed = async (_req: Request, res: Response): Promise<void> => {
    // 1) Redis cache first (fast path, avoids hammering the Instagram API)
    const cached = await cacheGet<NormalizedPost[]>(REDIS_KEY);
    if (cached && Array.isArray(cached) && cached.length > 0) {
        res.status(200).json({ success: true, source: 'cache', posts: cached });
        return;
    }

    // 2) Fresh Instagram API data
    const apiPosts = await fetchFromInstagramApi();
    if (apiPosts) {
        await persistFeed(apiPosts);
        res.status(200).json({ success: true, source: 'instagram', posts: apiPosts });
        return;
    }

    // 3) MongoDB cache (last successful sync)
    const mongoPosts = await readMongoCache();
    if (mongoPosts && mongoPosts.length > 0) {
        res.status(200).json({ success: true, source: 'cache', posts: mongoPosts });
        return;
    }

    // 4) Local curated fallback — the site always looks complete.
    res.status(200).json({ success: true, source: 'fallback', posts: LOCAL_FALLBACK_POSTS });
};