import mongoose from 'mongoose';
import Product from '../models/Product';
import Sale from '../models/Sale';
import { resolveSizeQuantities } from '../utils/sizeQuantities';
import { cacheInvalidatePrefix, cacheDel } from '../utils/cache';
import { StockReservationService } from './StockReservationService';

interface ImageItem {
    image: string;
    images?: string[];
    colors?: Array<{ image?: { url: string }; images?: Array<{ url: string }> }>;
}

export interface ResolvedLine {
    productId: string;
    name: string;
    price: number;
    image: string;
    size: string;
    quantity: number;
    source: 'product' | 'sale';
    variantImage?: string;
    color?: string;
}

export interface RawOrderItemInput {
    productId: string;
    size?: string;
    quantity?: number;
    image?: string;
    variantImage?: string;
    color?: string;
    sizeQuantities?: Array<{ size: string; quantity: number }> | Record<string, unknown> | string;
    sizeCounts?: Array<{ size: string; quantity: number }> | Record<string, unknown> | string;
}

function resolveVariantImage(item: ImageItem, raw: RawOrderItemInput): string {
    const requestedImage = raw.variantImage || raw.image;
    if (!requestedImage) return item.image;

    const allowedImages = new Set<string>([item.image, ...(item.images || [])]);
    if (item.colors && Array.isArray(item.colors)) {
        for (const col of item.colors) {
            if (col.image?.url) {
                allowedImages.add(col.image.url);
            }
            if (col.images && Array.isArray(col.images)) {
                for (const img of col.images) {
                    if (img?.url) {
                        allowedImages.add(img.url);
                    }
                }
            }
        }
    }
    return allowedImages.has(requestedImage) ? requestedImage : item.image;
}

/**
 * Resolve catalog lines from DB (ignore client-supplied prices).
 */
export async function resolveOrderLines(
    rawItems: RawOrderItemInput[]
): Promise<{ lines: ResolvedLine[]; subtotal: number }> {
    const lines: ResolvedLine[] = [];
    let subtotal = 0;

    for (const raw of rawItems) {
        if (!raw.productId) {
            throw new Error('Each item must include productId');
        }

        const sizeItems = resolveSizeQuantities({
            size: raw.size,
            quantity: raw.quantity,
            sizeQuantities: raw.sizeQuantities,
            sizeCounts: raw.sizeCounts,
        });

        if (sizeItems.length === 0) {
            throw new Error('Each item must include at least one size and quantity');
        }

        const totalRequested = sizeItems.reduce((sum, item) => sum + item.quantity, 0);

        const product = await Product.findOne({ productId: raw.productId });
        if (product) {
            if (product.stock < totalRequested) {
                throw new Error(`Insufficient stock for ${product.name}`);
            }

            for (const sizeItem of sizeItems) {
                if (!product.sizes?.includes(sizeItem.size)) {
                    throw new Error(`Invalid size for product ${raw.productId}`);
                }

                const lineImage = resolveVariantImage(product, raw);
                lines.push({
                    productId: raw.productId,
                    name: product.name,
                    price: product.price,
                    image: lineImage,
                    size: sizeItem.size,
                    quantity: sizeItem.quantity,
                    source: 'product',
                    variantImage: lineImage,
                    color: raw.color,
                });
                subtotal += product.price * sizeItem.quantity;
            }
            continue;
        }

        const sale = await Sale.findOne({ saleId: raw.productId });
        if (sale) {
            if (sale.stock < totalRequested) {
                throw new Error(`Insufficient stock for ${sale.name}`);
            }

            for (const sizeItem of sizeItems) {
                if (!sale.sizes?.includes(sizeItem.size)) {
                    throw new Error(`Invalid size for sale item ${raw.productId}`);
                }

                const lineImage = resolveVariantImage(sale, raw);
                lines.push({
                    productId: raw.productId,
                    name: sale.name,
                    price: sale.price,
                    image: lineImage,
                    size: sizeItem.size,
                    quantity: sizeItem.quantity,
                    source: 'sale',
                    variantImage: lineImage,
                    color: raw.color,
                });
                subtotal += sale.price * sizeItem.quantity;
            }
            continue;
        }

        throw new Error(`Unknown product or sale: ${raw.productId}`);
    }

    return { lines, subtotal };
}

export async function decrementStockForLines(
    lines: ResolvedLine[],
    session?: mongoose.ClientSession
): Promise<void> {
    // Group by source and productId to prevent partial success on same item
    const grouped = lines.reduce((acc, line) => {
        const key = `${line.source}:${line.productId}`;
        if (!acc[key]) {
            acc[key] = { source: line.source, productId: line.productId, quantity: 0, sizes: {} as Record<string, number> };
        }
        acc[key].quantity += line.quantity;
        acc[key].sizes[line.size] = (acc[key].sizes[line.size] || 0) + line.quantity;
        return acc;
    }, {} as Record<string, { source: string, productId: string, quantity: number, sizes: Record<string, number> }>);

    for (const key in grouped) {
        const { source, productId, quantity, sizes } = grouped[key];
        
        if (source === 'product') {
            const sizeUpdate: Record<string, number> = {};
            for (const size in sizes) {
                sizeUpdate[`sizeCounts.${size}`] = -sizes[size];
            }

            const res = await Product.updateOne(
                {
                    productId,
                    stock: { $gte: quantity },
                    $and: Object.keys(sizes).map(size => ({
                        $or: [
                            { sizeCounts: { $exists: false } },
                            { [`sizeCounts.${size}`]: { $gte: sizes[size] } }
                        ]
                    }))
                },
                { $inc: { stock: -quantity, ...sizeUpdate } },
                session ? { session } : {}
            );

            if (res.modifiedCount !== 1) {
                throw new Error(`Stock conflict: Item ${productId} is out of stock or does not have requested quantity`);
            }
            await cacheDel(`product:${productId}`);
            // Broadcast real-time stock update for all affected sizes
            StockReservationService.broadcastStockUpdate(productId).catch(() => {});
        } else {
            const res = await Sale.updateOne(
                { saleId: productId, stock: { $gte: quantity } },
                { $inc: { stock: -quantity } },
                session ? { session } : {}
            );
            if (res.modifiedCount !== 1) {
                throw new Error(`Stock conflict: Sale item ${productId} is out of stock`);
            }
            await cacheDel(`sale:${productId}`);
        }
    }
    await cacheInvalidatePrefix('products:');
}

export async function incrementStockForLines(
    lines: ResolvedLine[],
    session?: mongoose.ClientSession
): Promise<void> {
    for (const line of lines) {
        if (line.source === 'product') {
            const sizeKey = `sizeCounts.${line.size}`;
            await Product.updateOne(
                { productId: line.productId },
                { $inc: { stock: line.quantity, [sizeKey]: line.quantity } },
                session ? { session } : {}
            );
            // Invalidate cache for this product after stock update
            await cacheDel(`product:${line.productId}`);
            // Broadcast real-time stock update
            StockReservationService.broadcastStockUpdate(line.productId).catch(() => {});
        } else {
            await Sale.updateOne(
                { saleId: line.productId },
                { $inc: { stock: line.quantity } },
                session ? { session } : {}
            );
            // Invalidate cache for this sale item after stock update
            await cacheDel(`sale:${line.productId}`);
        }
    }
    // Also invalidate all product list caches to show updated stock immediately
    await cacheInvalidatePrefix('products:');
}
