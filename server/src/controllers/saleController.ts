import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { writeAudit } from '../utils/auditLog';
import Sale from '../models/Sale';
import SaleMode from '../models/SaleMode';
import Cart from '../models/Cart';
import { deleteFromCloudinary } from '../config/cloudinary';
import { cacheGet, cacheSet, cacheDel, cacheInvalidatePrefix, CACHE_TTL } from '../utils/cache';
import {
    handleImageUploads,
    parseSizes,
    parseCommonFields,
    validateRequiredItemFields,
    generateItemId,
    handleValidationError,
} from '../utils/itemHelpers';
import mongoose from 'mongoose';

/** Invalidate all sale caches */
const invalidateSaleCache = async (sale?: { _id?: mongoose.Types.ObjectId | string; saleId?: string }) => {
    await cacheInvalidatePrefix('sales:');
    if (sale?._id) await cacheDel(`sale:${sale._id}`);
    if (sale?.saleId) await cacheDel(`sale:${sale.saleId}`);
};

const warmSaleReadCaches = async () => {
    const recentSales = await Sale.find({}).sort({ createdAt: -1 }).limit(12).lean();
    await cacheSet('sales:recent', recentSales, CACHE_TTL.RECENT);
};

export const createSale = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const saleData = req.body;
        const files = req.files as unknown as { [fieldname: string]: Express.Multer.File[] };

        // Shared: upload images
        if (!(await handleImageUploads(files, saleData, res))) return;

        // Shared: parse sizes
        if (!parseSizes(saleData, res)) return;

        // Shared: convert types
        parseCommonFields(saleData);

        // Shared: validate
        if (!validateRequiredItemFields(saleData, res)) return;

        if (!saleData.saleId) {
            saleData.saleId = generateItemId('SALE');
        }

        const newSale = await Sale.create(saleData);

        // Shared: invalidate cache (uses SCAN, not KEYS)
        await invalidateSaleCache();
        await warmSaleReadCaches();

        await writeAudit(req.user!.uid, req.user!.email, 'sale_create', 'sale', newSale.saleId, {});

        res.status(201).json(newSale);
    } catch (error: unknown) {
        if (!handleValidationError(error, res)) {
            console.error('Create sale error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create sale item';
            res.status(500).json({ error: errorMessage });
        }
    }
};

export const getAllSales = async (_req: Request, res: Response): Promise<void> => {
    try {
        const cacheKey = 'sales:recent';
        const cached = await cacheGet(cacheKey);
        if (cached) { res.json(cached); return; }

        const sales = await Sale.find({}).sort({ createdAt: -1 }).lean();
        await cacheSet(cacheKey, sales, CACHE_TTL.RECENT);
        res.json(sales);
    } catch (error) {
        console.error('Get all sales error:', error);
        res.status(500).json({ error: 'Failed to fetch sales' });
    }
};

export const getActiveSales = async (_req: Request, res: Response): Promise<void> => {
    try {
        const activeSaleMode = await SaleMode.findOne({ isActive: true }).lean();
        if (!activeSaleMode) { res.json([]); return; }

        const cacheKey = 'sales:active';
        const cached = await cacheGet(cacheKey);
        if (cached) { res.json(cached); return; }

        const sales = await Sale.find({ saleMode: activeSaleMode.saleName }).sort({ createdAt: -1 }).lean();
        await cacheSet(cacheKey, sales, CACHE_TTL.SALES);
        res.json(sales);
    } catch (error) {
        console.error('Get active sales error:', error);
        res.status(500).json({ error: 'Failed to fetch active sales' });
    }
};

export const getSaleById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const cacheKey = `sale:${id}`;

        const cached = await cacheGet(cacheKey);
        if (cached) { res.json(cached); return; }

        let sale = await Sale.findOne({ saleId: id }).lean();
        if (!sale && mongoose.Types.ObjectId.isValid(id)) {
            sale = await Sale.findById(id).lean();
        }
        if (!sale) { res.status(404).json({ error: 'Sale item not found' }); return; }

        await cacheSet(cacheKey, sale, CACHE_TTL.SALES);
        res.json(sale);
    } catch (error) {
        console.error('Get sale error:', error);
        res.status(500).json({ error: 'Failed to fetch sale item' });
    }
};

export const updateSale = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const updates = req.body;
        const files = req.files as unknown as { [fieldname: string]: Express.Multer.File[] };
        
        // Try saleId first, only try ObjectId if it looks like a valid MongoDB ID
        let existing = await Sale.findOne({ saleId: id });
        if (!existing && mongoose.Types.ObjectId.isValid(id)) {
            existing = await Sale.findById(id);
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
        if (updates.sizes && typeof updates.sizes === 'string') {
            try { updates.sizes = JSON.parse(updates.sizes); } catch { updates.sizes = updates.sizes.split(',').map((s: string) => s.trim()); }
        }

        let updated = await Sale.findOneAndUpdate({ saleId: id }, updates, { new: true });
        if (!updated && mongoose.Types.ObjectId.isValid(id)) {
            updated = await Sale.findByIdAndUpdate(id, updates, { new: true });
        }
        if (!updated) { res.status(404).json({ error: 'Sale item not found' }); return; }

        if (existing && files?.image?.[0] && existing.cloudinaryId) {
            await deleteFromCloudinary(existing.cloudinaryId);
        }
        if (existing && files?.images?.length && existing.cloudinaryIds?.length) {
            await deleteFromCloudinary(existing.cloudinaryIds);
        }

        await invalidateSaleCache(updated);
        await warmSaleReadCaches();
        await writeAudit(req.user!.uid, req.user!.email, 'sale_update', 'sale', id, {});
        res.json(updated);
    } catch (error: unknown) {
        console.error('Update sale error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update sale item';
        res.status(500).json({ error: errorMessage });
    }
};

export const deleteSale = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);

        let deleted = await Sale.findOneAndDelete({ saleId: id });
        if (!deleted) deleted = await Sale.findByIdAndDelete(id);
        if (!deleted) { res.status(404).json({ error: 'Sale item not found' }); return; }

        await Cart.updateMany(
            { 'items.productId': deleted.saleId },
            { $pull: { items: { productId: deleted.saleId } } }
        );
        await cacheInvalidatePrefix('cart:');
        await deleteFromCloudinary([deleted.cloudinaryId, ...(deleted.cloudinaryIds || [])].filter(Boolean) as string[]);
        await invalidateSaleCache(deleted);
        await warmSaleReadCaches();
        await writeAudit(req.user!.uid, req.user!.email, 'sale_delete', 'sale', id, {});
        res.json({ message: 'Sale item deleted successfully' });
    } catch (error: unknown) {
        console.error('Delete sale error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete sale item';
        res.status(500).json({ error: errorMessage });
    }
};

// Sale Mode Controllers
export const createOrUpdateSaleMode = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { saleName, isActive, description, startDate, endDate } = req.body;

        if (!saleName) {
            res.status(400).json({ error: 'Sale name is required' });
            return;
        }

        const saleMode = await SaleMode.findOneAndUpdate(
            { saleName },
            { saleName, isActive, description, startDate, endDate },
            { upsert: true, new: true }
        );

        console.log('Sale mode created/updated:', saleMode.saleName, 'Active:', saleMode.isActive);

        // Invalidate cache
        await cacheDel('sales:active');

        await writeAudit(req.user!.uid, req.user!.email, 'sale_mode_upsert', 'sale_mode', saleName, {});

        res.status(200).json(saleMode);
    } catch (error: unknown) {
        console.error('Create/Update sale mode error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to create/update sale mode';
        res.status(500).json({ error: errorMessage });
    }
};

export const getAllSaleModes = async (_req: Request, res: Response): Promise<void> => {
    try {
        const saleModes = await SaleMode.find({}).sort({ createdAt: -1 });
        console.log('getAllSaleModes - Found', saleModes.length, 'sale modes');
        res.json(saleModes);
    } catch (error) {
        console.error('Get all sale modes error:', error);
        res.status(500).json({ error: 'Failed to fetch sale modes' });
    }
};

export const getActiveSaleMode = async (_req: Request, res: Response): Promise<void> => {
    try {
        const activeMode = await SaleMode.findOne({ isActive: true });

        if (!activeMode) {
            console.log('No active sale mode found');
            res.json(null);
            return;
        }

        console.log('Active sale mode:', activeMode.saleName);
        res.json(activeMode);
    } catch (error) {
        console.error('Get active sale mode error:', error);
        res.status(500).json({ error: 'Failed to fetch active sale mode' });
    }
};

export const toggleSaleMode = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const saleName = String(req.params.saleName);

        // Deactivate all other sale modes
        await SaleMode.updateMany({ saleName: { $ne: saleName } }, { isActive: false });

        // Toggle the requested sale mode
        const saleMode = await SaleMode.findOneAndUpdate(
            { saleName },
            [{ $set: { isActive: { $not: '$isActive' } } }],
            { new: true }
        );

        if (!saleMode) {
            res.status(404).json({ error: 'Sale mode not found' });
            return;
        }

        console.log('Sale mode toggled:', saleMode.saleName, 'Active:', saleMode.isActive);

        // Invalidate cache
        await cacheDel('sales:active');

        await writeAudit(req.user!.uid, req.user!.email, 'sale_mode_toggle', 'sale_mode', saleName, {
            isActive: saleMode.isActive,
        });

        res.json(saleMode);
    } catch (error: unknown) {
        console.error('Toggle sale mode error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to toggle sale mode';
        res.status(500).json({ error: errorMessage });
    }
};

export const deleteSaleMode = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const saleName = String(req.params.saleName);

        const deletedMode = await SaleMode.findOneAndDelete({ saleName });

        if (!deletedMode) {
            res.status(404).json({ error: 'Sale mode not found' });
            return;
        }

        console.log('Sale mode deleted:', saleName);

        // Invalidate cache
        await cacheDel('sales:active');

        await writeAudit(req.user!.uid, req.user!.email, 'sale_mode_delete', 'sale_mode', saleName, {});

        res.json({ message: 'Sale mode deleted successfully' });
    } catch (error: unknown) {
        console.error('Delete sale mode error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete sale mode';
        res.status(500).json({ error: errorMessage });
    }
};
