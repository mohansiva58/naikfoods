import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Product, { IProduct } from '../models/Product';
import Sale from '../models/Sale';
import Cart from '../models/Cart';
import { writeAudit } from '../utils/auditLog';
import { deleteFromCloudinary } from '../config/cloudinary';
import { cacheGet, cacheSet, cacheDel, cacheInvalidatePrefix, CACHE_TTL } from '../utils/cache';
import {
    handleImageUploads,
    parseSizes,
    parseSizeCounts,
    parseCommonFields,
    validateRequiredItemFields,
    generateItemId,
    handleValidationError,
} from '../utils/itemHelpers';
import mongoose from 'mongoose';

import { StockReservationService } from '../services/StockReservationService';
import { getProductStock } from './inventoryController';
import { getIO } from '../socket';

const findStockCatalogItem = async (productId: string) => {
    const product = await Product.findOne({ productId }).lean();
    if (product) return { item: product, id: product.productId };

    const sale = await Sale.findOne({ saleId: productId }).lean();
    if (sale) return { item: sale, id: sale.saleId };

    if (mongoose.Types.ObjectId.isValid(productId)) {
        const productById = await Product.findById(productId).lean();
        if (productById) return { item: productById, id: productById.productId };

        const saleById = await Sale.findById(productId).lean();
        if (saleById) return { item: saleById, id: saleById.saleId };
    }

    return null;
};

/** Invalidate all product caches */
const invalidateProductCache = async (product?: { _id?: mongoose.Types.ObjectId | string; productId?: string }) => {
    await cacheInvalidatePrefix('products:');
    if (product?._id) await cacheDel(`product:${product._id}`);
    if (product?.productId) await cacheDel(`product:${product.productId}`);
};

const warmProductReadCaches = async () => {
    const [recentProducts, popularProducts] = await Promise.all([
        Product.find({}).sort({ createdAt: -1 }).limit(12).lean(),
        Product.find({}).sort({ reviews: -1, rating: -1 }).limit(12).lean(),
    ]);

    await Promise.all([
        cacheSet('products:recent', recentProducts, CACHE_TTL.RECENT),
        cacheSet('products:popular', popularProducts, CACHE_TTL.FREQUENT),
    ]);
};

const validateProductPrice = (price: unknown, res: Response): boolean => {
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
        res.status(400).json({ error: 'Product price must be greater than 0' });
        return false;
    }
    return true;
};

const createProductSlug = (name: unknown, productId: unknown): string => {
    const source = String(name || productId || 'product');
    return source.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const productData = req.body;
        const files = req.files as unknown as { [fieldname: string]: Express.Multer.File[] };

        // Shared: upload images
        if (!(await handleImageUploads(files, productData, res))) return;

        console.log('=== AFTER IMAGE UPLOAD ===');
        console.log('Main image (productData.image):', productData.image ? '✓' : '✗ MISSING');
        console.log('Additional images (productData.images):', productData.images?.length || 0);
        if (productData.images?.length > 0) {
            productData.images.forEach((img: string, i: number) => {
                console.log(`  Image ${i + 1}:`, img.substring(0, 60));
            });
        }

        // Shared: parse sizes
        if (!parseSizes(productData, res)) return;
        parseSizeCounts(productData);

        if (productData.sizeCounts && typeof productData.sizeCounts === 'object') {
            productData.stock = Object.values(productData.sizeCounts as Record<string, unknown>)
                .reduce<number>((sum, value) => sum + Math.max(0, Math.floor(Number(value) || 0)), 0);
        }

        // Shared: convert types
        parseCommonFields(productData);
        if (!validateProductPrice(productData.price, res)) return;
        productData.newArrival = productData.isNew === 'true' || productData.isNew === true || productData.newArrival === 'true' || productData.newArrival === true;
        delete productData.isNew;
        productData.isBestseller = productData.isBestseller === 'true' || productData.isBestseller === true;

        // Shared: validate
        if (!validateRequiredItemFields(productData, res)) return;

        if (!productData.productId) {
            productData.productId = generateItemId('PROD');
        }
        if (!productData.slug) productData.slug = createProductSlug(productData.name, productData.productId);

        console.log('=== BEFORE DATABASE SAVE ===');
        console.log('Product name:', productData.name);
        console.log('Main image:', productData.image ? '✓ Present' : '✗ MISSING!');
        
        // FALLBACK: If no main image but additional images exist, use the first one
        if (!productData.image && productData.images && productData.images.length > 0) {
            console.warn('⚠️ FALLBACK: No main image provided, using first additional image as main');
            productData.image = productData.images[0];
            productData.cloudinaryId = productData.cloudinaryIds?.[0];
            console.log('Fallback main image set to:', productData.image.substring(0, 80));
        }
        
        if (!productData.image) {
            console.error('ERROR: Main image is missing! Product cannot be saved without a main image.');
            res.status(400).json({ error: 'Main image is required and must be properly uploaded' });
            return;
        }
        console.log('Main image URL:', productData.image.substring(0, 80));
        console.log('Additional images:', productData.images?.length || 0);
        if (productData.images?.length > 0) {
            productData.images.forEach((img: string, i: number) => {
                console.log(`  Additional ${i + 1}:`, img.substring(0, 80));
            });
        }

        const newProduct = await Product.create(productData);

        console.log('=== AFTER DATABASE SAVE ===');
        console.log('Saved product ID:', newProduct.productId);
        console.log('Saved main image:', newProduct.image ? '✓ Present' : '✗ MISSING IN DB!');
        if (!newProduct.image) {
            console.error('CRITICAL ERROR: Main image was not saved to database!');
        } else {
            console.log('Main image URL:', newProduct.image.substring(0, 80));
        }
        console.log('Saved additional images:', newProduct.images?.length || 0);
        if (newProduct.images && newProduct.images.length > 0) {
            newProduct.images.forEach((img: string, i: number) => {
                console.log(`  Saved additional ${i + 1}:`, img.substring(0, 80));
            });
        }

        // Shared: invalidate cache (uses SCAN, not KEYS)
        await invalidateProductCache();
        await warmProductReadCaches();

        await writeAudit(req.user!.uid, req.user!.email, 'product_create', 'product', newProduct.productId, {});

        res.status(201).json(newProduct);
    } catch (error: unknown) {
        if (!handleValidationError(error, res)) {
            console.error('Create product error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create product';
            res.status(500).json({ error: errorMessage });
        }
    }
};

export const bulkCreateProducts = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const products = req.body;

        if (!Array.isArray(products)) {
            res.status(400).json({ error: 'Input must be an array of products' });
            return;
        }

        const productsWithIds = products.map((p: Partial<IProduct>) => {
            const raw = p as Record<string, unknown>;
            return {
                ...p,
                productId: p.productId || generateItemId('PROD'),
                slug: (raw.slug as string) || createProductSlug(p.name, p.productId || raw.productId),
                newArrival: p.newArrival || raw.isNew === true || raw.isNew === 'true' || false,
                isNew: undefined,
            };
        });

        if (productsWithIds.some((product) => !validateProductPrice(product.price, res))) return;

        const result = await Product.insertMany(productsWithIds);
        await invalidateProductCache();
        await warmProductReadCaches();

        await writeAudit(req.user!.uid, req.user!.email, 'product_bulk_create', 'product', 'bulk', {
            count: result.length,
        });

        res.status(201).json({
            message: `Successfully created ${result.length} products`,
            products: result,
        });
    } catch (error: unknown) {
        console.error('Bulk create error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to bulk create products';
        res.status(500).json({ error: errorMessage });
    }
};

/**
 * Reserve stock for items.
 * POST body: { productId, size, quantity, sessionId, userId }
 */
export const reserveStock = async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId, size, quantity, sessionId, userId, color, idempotencyKey } = req.body;

        if (!productId || !size || !quantity || !sessionId) {
            res.status(400).json({ error: 'Missing required reservation fields' });
            return;
        }

        const reservation = await StockReservationService.reserveStock(
            productId,
            size,
            Number(quantity),
            sessionId,
            userId,
            {
                color: color ? String(color) : undefined,
                idempotencyKey: idempotencyKey ? String(idempotencyKey) : undefined,
            }
        );

        res.status(201).json(reservation);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Reservation failed';
        res.status(409).json({ error: errorMessage });
    }
};

export { getProductStock };

/**
 * Release stock reservation.
 * POST body: { reservationId }
 */
export const releaseStock = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reservationId } = req.body;

        if (!reservationId) {
            res.status(400).json({ error: 'Reservation ID is required' });
            return;
        }

        await StockReservationService.releaseStock(reservationId);
        res.status(200).json({ success: true, message: 'Stock released' });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Release failed';
        res.status(500).json({ error: errorMessage });
    }
};

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { category, minPrice, maxPrice, search, sort, page, limit, size, filter, fresh } = req.query;
        const query: Record<string, unknown> = {};

        if (category && category !== 'All') query.category = category;
        if (size) query.sizes = size;
        if (filter === 'new') query.newArrival = true;
        if (filter === 'bestseller') query.isBestseller = true;
        if (minPrice || maxPrice) {
            const priceQuery: Record<string, number> = {};
            if (minPrice) priceQuery.$gte = Number(minPrice);
            if (maxPrice) priceQuery.$lte = Number(maxPrice);
            query.price = priceQuery;
        }
        if (search) query.$text = { $search: search as string };

        const wantsPagination = typeof page !== 'undefined' || typeof limit !== 'undefined';
        const pageNumber = Math.max(1, Number(page || 1));
        const pageSize = Math.max(1, Math.min(24, Number(limit || 12)));

        // Try cache
        const isUnfiltered = Object.keys(query).length === 0;
        let cacheKey = `products:${JSON.stringify(query)}:${sort || 'default'}`;
        if (wantsPagination) cacheKey = `${cacheKey}:page=${pageNumber}:limit=${pageSize}`;
        if (!wantsPagination && isUnfiltered && !sort) cacheKey = 'products:recent';
        if (!wantsPagination && isUnfiltered && sort === 'popular') cacheKey = 'products:popular';

        const skipCache = fresh === 'true' || fresh === '1';
        if (!skipCache) {
            const cached = await cacheGet(cacheKey);
            if (cached) { res.json(cached); return; }
        }

        let sortOption: string | Record<string, mongoose.SortOrder> = { createdAt: -1 };
        if (sort === 'price-asc') sortOption = { price: 1 };
        if (sort === 'price-desc') sortOption = { price: -1 };
        if (sort === 'rating') sortOption = { rating: -1 };
        if (sort === 'popular') sortOption = { reviews: -1 };

        const baseQuery = Product.find(query).sort(sortOption);
        const productsQuery = wantsPagination
            ? baseQuery.skip((pageNumber - 1) * pageSize).limit(pageSize)
            : baseQuery;

        const products = await productsQuery.lean(); // .lean() = faster, no Mongoose overhead

        if (wantsPagination) {
            const total = await Product.countDocuments(query);
            const payload = {
                items: products,
                total,
                page: pageNumber,
                limit: pageSize,
                hasMore: pageNumber * pageSize < total,
            };
            if (!skipCache) await cacheSet(cacheKey, payload, CACHE_TTL.PRODUCTS);
            res.json(payload);
            return;
        }

        const ttl = cacheKey === 'products:recent' ? CACHE_TTL.RECENT : cacheKey === 'products:popular' ? CACHE_TTL.FREQUENT : CACHE_TTL.PRODUCTS;
        if (!skipCache) await cacheSet(cacheKey, products, ttl);
        res.json(products);
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const cacheKey = `product:${id}`;

        const cached = await cacheGet(cacheKey);
        if (cached) { 
            console.log('Product from cache:', id);
            res.json(cached); 
            return; 
        }

        const product = await Product.findOne({ productId: id }).lean();
        if (!product) { 
            console.warn('Product not found:', id);
            res.status(404).json({ error: 'Product not found' }); 
            return; 
        }

        console.log('=== PRODUCT RETRIEVED FROM DB ===');
        console.log('Product ID:', product.productId);
        console.log('Main image:', product.image ? 'Present' : 'MISSING');
        console.log('Additional images:', product.images?.length || 0);
        if (product.images?.length > 0) {
            product.images.forEach((img: string, i: number) => {
                console.log(`  Additional ${i + 1}:`, img.substring(0, 60));
            });
        }

        await cacheSet(cacheKey, product, CACHE_TTL.PRODUCTS);
        res.json(product);
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};

export const getFeaturedProducts = async (_req: Request, res: Response): Promise<void> => {
    try {
        const cacheKey = 'products:featured';
        const cached = await cacheGet(cacheKey);
        if (cached) { res.json(cached); return; }

        const products = await Product.find({}).limit(4).sort({ createdAt: -1 }).lean();
        await cacheSet(cacheKey, products, CACHE_TTL.PRODUCTS);
        res.json(products);
    } catch (error) {
        console.error('Get featured products error:', error);
        res.status(500).json({ error: 'Failed to fetch featured products' });
    }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const updates = req.body;
        const files = req.files as unknown as { [fieldname: string]: Express.Multer.File[] };
        
        // Try productId first, only try ObjectId if it looks like a valid MongoDB ID
        let existing = await Product.findOne({ productId: id });
        if (!existing && mongoose.Types.ObjectId.isValid(id)) {
            existing = await Product.findById(id);
        }

        // Preserve existing main image if not being updated
        if (updates.existingMainImage && !files?.image?.[0]) {
            updates.image = updates.existingMainImage;
            console.log('Preserving existing main image:', updates.image.substring(0, 60));
        }
        delete updates.existingMainImage;

        // Shared: upload images (pass existing product for ID preservation)
        if (!(await handleImageUploads(files, updates, res, existing || undefined))) return;

        // Shared: parse fields
        parseCommonFields(updates);
        if (typeof updates.price !== 'undefined' && !validateProductPrice(updates.price, res)) return;
        if (typeof updates.isNew !== 'undefined') {
            updates.newArrival = updates.isNew === 'true' || updates.isNew === true;
            delete updates.isNew;
        }
        if (typeof updates.isBestseller !== 'undefined') {
            updates.isBestseller = updates.isBestseller === 'true' || updates.isBestseller === true;
        }
        if (updates.sizes && typeof updates.sizes === 'string') {
            try { updates.sizes = JSON.parse(updates.sizes); } catch { updates.sizes = updates.sizes.split(',').map((s: string) => s.trim()); }
        }
        parseSizeCounts(updates);
        if (updates.sizeCounts && typeof updates.sizeCounts === 'object') {
            updates.stock = Object.values(updates.sizeCounts as Record<string, unknown>)
                .reduce<number>((sum, value) => sum + Math.max(0, Math.floor(Number(value) || 0)), 0);
        }

        // Try productId first, fallback to _id if valid ObjectId
        let updated = await Product.findOneAndUpdate({ productId: id }, updates, { new: true, runValidators: true });
        if (!updated && mongoose.Types.ObjectId.isValid(id)) {
            updated = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        }
        if (!updated) { res.status(404).json({ error: 'Product not found' }); return; }

        if (existing && files?.image?.[0] && existing.cloudinaryId) {
            await deleteFromCloudinary(existing.cloudinaryId);
        }
        if (existing && files?.images?.length && existing.cloudinaryIds?.length) {
            await deleteFromCloudinary(existing.cloudinaryIds);
        }

        await invalidateProductCache(updated);
        await warmProductReadCaches();

        // Broadcast stock updates via Socket.IO immediately to all clients
        try {
            const io = getIO();
            if (io) {
                const sizeCounts = updated.sizeCounts instanceof Map
                    ? Object.fromEntries(updated.sizeCounts)
                    : (updated.sizeCounts as Record<string, number> || {});
                const sizeReserved = updated.sizeReservedCounts instanceof Map
                    ? Object.fromEntries(updated.sizeReservedCounts)
                    : (updated.sizeReservedCounts as Record<string, number> || {});
                
                const sizesToUpdate = Array.isArray(updated.sizes) ? updated.sizes : [];
                for (const size of sizesToUpdate) {
                    const total = sizeCounts[size] || 0;
                    const reserved = sizeReserved[size] || 0;
                    const available = Math.max(0, total - reserved);
                    io.emit('stockUpdate', {
                        productId: updated.productId,
                        size,
                        stock: available,
                        totalStock: total,
                        reservedStock: reserved,
                    });
                }
            }
        } catch (socketErr) {
            console.error('Failed to broadcast admin stock update:', socketErr);
        }

        await writeAudit(req.user!.uid, req.user!.email, 'product_update', 'product', id, {});
        res.json(updated);
    } catch (error: unknown) {
        console.error('Update product error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update product';
        res.status(500).json({ error: errorMessage });
    }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);

        let deleted = await Product.findOneAndDelete({ productId: id });
        if (!deleted) deleted = await Product.findByIdAndDelete(id);
        if (!deleted) { res.status(404).json({ error: 'Product not found' }); return; }

        await Cart.updateMany(
            { 'items.productId': deleted.productId },
            { $pull: { items: { productId: deleted.productId } } }
        );
        await cacheInvalidatePrefix('cart:');
        await deleteFromCloudinary([deleted.cloudinaryId, ...(deleted.cloudinaryIds || [])].filter(Boolean) as string[]);
        await invalidateProductCache(deleted);
        await warmProductReadCaches();
        await writeAudit(req.user!.uid, req.user!.email, 'product_delete', 'product', id, {});
        res.json({ message: 'Product deleted successfully' });
    } catch (error: unknown) {
        console.error('Delete product error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';
        res.status(500).json({ error: errorMessage });
    }
};

/**
 * Check stock availability for items before checkout.
 * POST body: { items: [{ productId, size, quantity }, ...] }
 * Returns: { available: true/false, items: [{ productId, size, quantity, maxAvailable, name, image }] }
 */
export const checkStockAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
        const { items } = req.body as { items?: Array<{ productId: string; size: string; quantity: number }> };

        if (!items || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({ error: 'Items array is required' });
            return;
        }

        const stockResults: Array<{
            productId: string;
            size: string;
            quantity: number;
            maxAvailable: number;
            available: boolean;
            name?: string;
            image?: string;
        }> = [];
        let allAvailable = true;

        for (const item of items) {
            const { productId, size, quantity } = item;

            if (!productId || !size || !quantity) {
                allAvailable = false;
                stockResults.push({
                    productId: productId || 'unknown',
                    size: size || 'unknown',
                    quantity: quantity || 0,
                    maxAvailable: 0,
                    available: false,
                    name: 'Invalid item data',
                });
                continue;
            }

            const resolved = await findStockCatalogItem(productId);
            if (!resolved) {
                allAvailable = false;
                stockResults.push({
                    productId,
                    size,
                    quantity,
                    maxAvailable: 0,
                    available: false,
                });
                continue;
            }

            const { item: catalogItem, id: canonicalId } = resolved;
            if (!catalogItem.sizes?.includes(size)) {
                allAvailable = false;
                stockResults.push({
                    productId: canonicalId,
                    size,
                    quantity,
                    maxAvailable: 0,
                    available: false,
                    name: catalogItem.name,
                    image: catalogItem.image,
                });
                continue;
            }

            const rawSizeCounts = 'sizeCounts' in catalogItem ? catalogItem.sizeCounts : undefined;
            const sizeCounts = rawSizeCounts instanceof Map
                ? Object.fromEntries(rawSizeCounts)
                : rawSizeCounts as Record<string, number> | undefined;

                
            const rawReservedCounts = 'sizeReservedCounts' in catalogItem ? catalogItem.sizeReservedCounts : undefined;
            const sizeReservedCounts = rawReservedCounts instanceof Map
                ? Object.fromEntries(rawReservedCounts)
                : rawReservedCounts as Record<string, number> | undefined;

            const totalForSize =
                sizeCounts && typeof sizeCounts === 'object'
                    ? Number(sizeCounts[size] || 0)
                    : Number(catalogItem.stock || 0);

            const reservedForSize =
                sizeReservedCounts && typeof sizeReservedCounts === 'object'
                    ? Number(sizeReservedCounts[size] || 0)
                    : 0;

            const availableForSize = Math.max(0, totalForSize - reservedForSize);

            const isAvailable = availableForSize >= quantity;
            if (!isAvailable) allAvailable = false;

            stockResults.push({
                productId: canonicalId,
                size,
                quantity,
                maxAvailable: Math.max(0, availableForSize),
                available: isAvailable,
                name: catalogItem.name,
                image: catalogItem.image,
            });
        }

        res.json({
            available: allAvailable,
            items: stockResults,
        });
    } catch (error: unknown) {
        console.error('Check stock error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to check stock';
        res.status(500).json({ error: errorMessage });
    }
};
