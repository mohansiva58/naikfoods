import { Response } from 'express';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary';

/** Magic-byte sniffing (JPEG / PNG / WEBP / GIF / BMP) — not a substitute for malware scanning. */
export const validateImageBuffer = (buffer: Buffer): boolean => {
    if (!buffer || buffer.length < 4) return false;
    
    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
    
    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
    
    // WEBP: RIFF...WEBP
    if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return true;
    
    // GIF: GIF87a or GIF89a
    if (buffer.toString('ascii', 0, 3) === 'GIF') return true;
    
    // BMP: BM
    if (buffer[0] === 0x42 && buffer[1] === 0x4d) return true;
    
    return false;
};

/**
 * Shared utilities for product/sale creation — eliminates 80% duplicate code
 * between productController and saleController.
 */

/** Upload main image + additional images from multipart form. Returns false if failed (response already sent). */
export const handleImageUploads = async (
    files: { [fieldname: string]: Express.Multer.File[] } | undefined,
    data: Record<string, unknown>,
    res: Response,
    existingProduct?: { images?: string[]; cloudinaryIds?: string[] }
): Promise<boolean> => {
    const category = typeof data.category === 'string' ? data.category : undefined;

    console.log('=== HANDLE IMAGE UPLOADS ===');
    console.log('Files received:', Object.keys(files || {}));
    if (files?.image) console.log('  Main image files:', files.image.length);
    if (files?.images) console.log('  Additional image files:', files.images.length);

    // Handle main image upload
    if (files?.image?.[0]) {
        const buf = files.image[0].buffer;
        const filename = files.image[0].originalname;
        const filesize = buf.length;
        console.log('Processing main image:', filename, `(${filesize} bytes)`);
        
        if (!validateImageBuffer(buf)) {
            console.error(`❌ Invalid image format for: ${filename}`);
            console.error(`First 4 bytes: ${buf.slice(0, 4).toString('hex')}`);
            res.status(400).json({ 
                error: `Invalid image file format. Supported: JPEG, PNG, WEBP, GIF, BMP. File: ${filename}` 
            });
            return false;
        }
        try {
            const uploadedImage = await uploadToCloudinary(buf, category);
            data.image = uploadedImage.url;
            data.cloudinaryId = uploadedImage.publicId;
            console.log('✓ Main image uploaded:', (data.image as string).substring(0, 60));
        } catch (uploadError) {
            console.error('Image upload failed:', uploadError);
            res.status(500).json({ error: 'Failed to upload main image' });
            return false;
        }
    } else {
        console.log('⚠ No main image file received');
    }

    // Handle additional images upload
    if (files?.images || data.existingImages) {
        const partialIds: string[] = [];
        try {
            const urls: string[] = [];
            const ids: string[] = [];
            
            console.log('Processing additional images:');
            console.log('  Existing images from form:', data.existingImages ? (Array.isArray(data.existingImages) ? data.existingImages.length : 1) : 0);
            
            // Preserve existing images (from database)
            if (data.existingImages && existingProduct) {
                const existingImagesArray = Array.isArray(data.existingImages) 
                    ? data.existingImages 
                    : [data.existingImages];
                
                console.log(`  ✓ Processing ${existingImagesArray.length} existing images with IDs`);
                
                // Match existing images with their IDs from the database
                existingImagesArray.forEach((existingUrl: string) => {
                    urls.push(existingUrl);
                    
                    // Find the corresponding ID from the existing product
                    if (existingProduct.images && existingProduct.cloudinaryIds) {
                        const imageIndex = existingProduct.images.indexOf(existingUrl);
                        if (imageIndex >= 0 && existingProduct.cloudinaryIds[imageIndex]) {
                            ids.push(existingProduct.cloudinaryIds[imageIndex]);
                        }
                    }
                });
            } else if (data.existingImages) {
                // If no existing product provided, just preserve URLs without IDs
                const existingImagesArray = Array.isArray(data.existingImages) 
                    ? data.existingImages 
                    : [data.existingImages];
                console.log(`  ✓ Processing ${existingImagesArray.length} existing images without IDs`);
                urls.push(...existingImagesArray);
            }
            
            // Upload new images
            if (files?.images) {
                console.log(`  ✓ Uploading ${files.images.length} new images`);
                for (const file of files.images) {
                    const b = (file as Express.Multer.File).buffer;
                    if (!validateImageBuffer(b)) {
                        console.error(`❌ Invalid image format for: ${file.originalname}`);
                        console.error(`First 4 bytes: ${b.slice(0, 4).toString('hex')}`);
                        throw new Error(`invalid_additional_image:${file.originalname}`);
                    }
                    const uploaded = await uploadToCloudinary(b, category);
                    urls.push(uploaded.url);
                    ids.push(uploaded.publicId);
                    partialIds.push(uploaded.publicId);
                    console.log(`    Uploaded: ${file.originalname} → ${uploaded.url.substring(0, 50)}`);
                }
            }
            
            console.log(`✓ Additional images finalized: ${urls.length} total (${ids.length} with IDs)`);
            data.images = urls;
            data.cloudinaryIds = ids;
            delete data.existingImages; // Remove from data as it's been processed
        } catch (uploadError: unknown) {
            console.error('Additional images upload failed:', uploadError);
            for (const pid of partialIds) {
                await deleteFromCloudinary(pid).catch(() => undefined);
            }
            if (data.cloudinaryId) {
                await deleteFromCloudinary(data.cloudinaryId as string).catch(() => undefined);
                delete data.cloudinaryId;
                delete data.image;
            }
            const errorMsg = (uploadError as Error).message;
            if (errorMsg?.startsWith('invalid_additional_image:')) {
                const filename = errorMsg.replace('invalid_additional_image:', '');
                res.status(400).json({ 
                    error: `Invalid image format: "${filename}". Supported: JPEG, PNG, WEBP, GIF, BMP` 
                });
            } else if (errorMsg === 'invalid_additional_image') {
                res.status(400).json({ 
                    error: 'One or more additional images have invalid format. Supported: JPEG, PNG, WEBP, GIF, BMP' 
                });
            } else {
                res.status(500).json({ error: 'Failed to upload additional images' });
            }
            return false;
        }
    }

    return true;
};

/** Parse sizes from string (FormData) to array. Returns false if invalid (response already sent). */
export const parseSizes = (data: Record<string, unknown>, res: Response): boolean => {
    if (typeof data.sizes === 'string') {
        try {
            data.sizes = JSON.parse(data.sizes);
        } catch {
            data.sizes = (data.sizes as string).split(',').map((s: string) => s.trim());
        }
    }

    if (!Array.isArray(data.sizes) || data.sizes.length === 0) {
        res.status(400).json({ error: 'Sizes must be a non-empty array' });
        return false;
    }

    data.sizes = (data.sizes as string[]).filter((s: string) => s && s.trim().length > 0);

    if ((data.sizes as string[]).length === 0) {
        res.status(400).json({ error: 'At least one size is required' });
        return false;
    }

    return true;
};

/** Parse size counts from string/object to a normalized record. */
export const parseSizeCounts = (data: Record<string, unknown>): void => {
    const raw = data.sizeCounts;

    if (!raw) {
        return;
    }

    let parsed: unknown = raw;

    if (typeof raw === 'string') {
        try {
            parsed = JSON.parse(raw);
        } catch {
            const counts: Record<string, number> = {};
            raw.split(',').forEach((segment) => {
                const [sizePart, quantityPart] = segment.split('=');
                const size = (sizePart || '').trim();
                const quantity = Math.floor(Number(quantityPart));
                if (size && Number.isFinite(quantity) && quantity > 0) {
                    counts[size] = quantity;
                }
            });
            data.sizeCounts = counts;
            return;
        }
    }

    if (Array.isArray(parsed)) {
        const counts: Record<string, number> = {};
        parsed.forEach((entry) => {
            if (!entry || typeof entry !== 'object') return;
            const record = entry as { size?: unknown; quantity?: unknown; count?: unknown };
            const size = String(record.size || '').trim();
            const quantity = Math.floor(Number(record.quantity ?? record.count));
            if (size && Number.isFinite(quantity) && quantity > 0) {
                counts[size] = quantity;
            }
        });
        data.sizeCounts = counts;
        return;
    }

    if (parsed && typeof parsed === 'object') {
        const counts: Record<string, number> = {};
        for (const [size, quantity] of Object.entries(parsed as Record<string, unknown>)) {
            const normalizedQuantity = Math.floor(Number(quantity));
            if (size.trim() && Number.isFinite(normalizedQuantity) && normalizedQuantity > 0) {
                counts[size.trim()] = normalizedQuantity;
            }
        }
        data.sizeCounts = counts;
    }
};

/** Convert common numeric/boolean fields from FormData strings. */
export const parseCommonFields = (data: Record<string, unknown>): void => {
    if (data.price) data.price = Number(data.price);
    if (data.originalPrice) data.originalPrice = Number(data.originalPrice);
    if (data.stock) data.stock = Number(data.stock);
    if (data.rating) data.rating = Number(data.rating);
    if (data.reviews) data.reviews = Number(data.reviews);
    if (data.discount) data.discount = Number(data.discount);

    for (const field of ['ingredients', 'dietaryTags', 'nutrition']) {
        if (data[field] && typeof data[field] === 'string') {
            try {
                data[field] = JSON.parse(data[field] as string);
            } catch {
                data[field] = field === 'nutrition' ? undefined : (data[field] as string).split(',').map((value) => value.trim()).filter(Boolean);
            }
        }
    }
    
    // Parse colors from JSON string
    if (data.colors && typeof data.colors === 'string') {
        try {
            data.colors = JSON.parse(data.colors);
        } catch {
            data.colors = undefined;
        }
    }
};

/** Validate required fields for product/sale creation. Returns false if invalid (response already sent). */
export const validateRequiredItemFields = (data: Record<string, unknown>, res: Response): boolean => {
    if (!data.name || !data.price || !data.category || !data.description) {
        res.status(400).json({
            error: 'Missing required fields: name, price, category, description, and image are required',
        });
        return false;
    }

    if (!data.image) {
        res.status(400).json({ error: 'Image is required' });
        return false;
    }

    return true;
};

/** Generate a unique ID with a given prefix. */
export const generateItemId = (prefix: string): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

/** Handle Mongoose validation errors. Returns true if it was a validation error (response already sent). */
export const handleValidationError = (error: unknown, res: Response): boolean => {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
        const valErr = error as unknown as { errors: Record<string, { message: string }> };
        res.status(400).json({
            error: 'Validation failed',
            details: Object.keys(valErr.errors).map((key) => ({
                field: key,
                message: valErr.errors[key].message,
            })),
        });
        return true;
    }
    return false;
};
