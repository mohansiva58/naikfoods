import api from './api';
import { Product } from '@/lib/products';

export interface ProductFilters {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sort?: 'price-asc' | 'price-desc' | 'rating' | 'popular';
    filter?: 'new' | 'bestseller' | null;
}

export interface PagedProductFilters extends ProductFilters {
    size?: string | null;
    filter?: 'new' | 'bestseller' | null;
    page: number;
    limit: number;
}

export interface PagedProductResponse {
    items: Product[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

export interface StockCheckItem {
    productId: string;
    size: string;
    quantity: number;
}

export interface StockCheckResponse {
    available: boolean;
    items: Array<{
        productId: string;
        size: string;
        quantity: number;
        maxAvailable: number;
        available: boolean;
        name?: string;
        image?: string;
    }>;
}

export interface InventoryReservationResponse {
    reservationGroupId?: string;
    reservationId?: string;
    reservationIds: string[];
    expiresAt: string;
    ttlSeconds: number;
}

const isRouteNotFound = (error: unknown) => {
    const status = (error as { response?: { status?: number } })?.response?.status;
    return status === 404;
};

export const productService = {
    getAllProducts: async (filters?: ProductFilters): Promise<Product[]> => {
        const params = new URLSearchParams();
        if (filters?.category) params.append('category', filters.category);
        if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
        if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
        if (filters?.search) params.append('search', filters.search);
        if (filters?.sort) params.append('sort', filters.sort);
        if (filters?.filter) params.append('filter', filters.filter);

        const response = await api.get(`/products?${params.toString()}`);
        console.log('Fetched products:', response.data);
        // Log image URLs for debugging
        response.data.forEach((p: Product) => {
            if (!p.image) {
                console.warn('Product missing image:', p.name);
            }
        });
        return response.data;
    },

    getPagedProducts: async (filters: PagedProductFilters): Promise<PagedProductResponse> => {
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
        if (filters.search) params.append('search', filters.search);
        if (filters.sort) params.append('sort', filters.sort);
        if (filters.size) params.append('size', filters.size);
        if (filters.filter) params.append('filter', filters.filter);
        params.append('page', filters.page.toString());
        params.append('limit', filters.limit.toString());

        const response = await api.get(`/products?${params.toString()}`);
        console.log('Fetched paged products:', response.data);
        if (Array.isArray(response.data)) {
            const items = response.data;
            return {
                items,
                total: items.length,
                page: filters.page,
                limit: filters.limit,
                hasMore: items.length >= filters.limit,
            };
        }

        return {
            items: Array.isArray(response.data?.items) ? response.data.items : [],
            total: Number(response.data?.total || 0),
            page: Number(response.data?.page || filters.page),
            limit: Number(response.data?.limit || filters.limit),
            hasMore: Boolean(response.data?.hasMore),
        };
    },

    getProductById: async (id: string): Promise<Product> => {
        const response = await api.get(`/products/${id}`);
        console.log('Fetched product:', response.data);
        return response.data;
    },

    reserveStock: async (data: {
        productId: string;
        size: string;
        quantity: number;
        sessionId: string;
        userId?: string;
        color?: string;
        idempotencyKey?: string;
    }): Promise<{ reservationId: string }> => {
        const response = await api.post('/products/reserve', data);
        return response.data;
    },

    reserveInventory: async (data: {
        items: StockCheckItem[];
        sessionId: string;
        idempotencyKey?: string;
    }): Promise<InventoryReservationResponse> => {
        try {
            const response = await api.post('/inventory/reserve', data);
            return response.data;
        } catch (error) {
            if (!isRouteNotFound(error)) {
                throw error;
            }

            const reservations: Array<{ reservationId: string; expiresAt?: string }> = [];
            try {
                for (const item of data.items) {
                    const response = await api.post('/products/reserve', {
                        ...item,
                        sessionId: data.sessionId,
                        idempotencyKey: `${data.idempotencyKey || data.sessionId}:${item.productId}:${item.size}`,
                    });
                    reservations.push(response.data);
                }
            } catch (fallbackError) {
                await Promise.all(
                    reservations.map((reservation) =>
                        api.post('/products/release', { reservationId: reservation.reservationId }).catch(() => undefined)
                    )
                );
                throw fallbackError;
            }

            const expiresAt = reservations
                .map((reservation) => reservation.expiresAt)
                .filter(Boolean)
                .sort()[0] || new Date(Date.now() + 10 * 60 * 1000).toISOString();

            return {
                reservationIds: reservations.map((reservation) => reservation.reservationId),
                expiresAt,
                ttlSeconds: Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)),
            };
        }
    },

    releaseStock: async (reservationId: string): Promise<void> => {
        await api.post('/inventory/release', { reservationId });
    },

    releaseInventory: async (reservationIds: string[], reason?: string): Promise<void> => {
        try {
            await api.post('/inventory/release', { reservationIds, reason });
        } catch (error) {
            if (!isRouteNotFound(error)) {
                throw error;
            }

            await Promise.all(
                reservationIds.map((reservationId) =>
                    api.post('/products/release', { reservationId, reason })
                )
            );
        }
    },

    getProductStock: async (productId: string) => {
        const response = await api.get(`/products/${productId}/stock`);
        return response.data;
    },

    getFeaturedProducts: async (): Promise<Product[]> => {
        const response = await api.get('/products/featured');
        return response.data;
    },

    checkStockAvailability: async (items: StockCheckItem[]): Promise<StockCheckResponse> => {
        const response = await api.post('/products/check-stock', { items });
        return response.data;
    },
};
