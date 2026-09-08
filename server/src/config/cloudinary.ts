import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

// ensure env variables are loaded
dotenv.config({ path: path.join(__dirname, '../../.env') });

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
    url: string;
    publicId: string;
}

const sanitizeFolderSegment = (value: string | undefined): string => {
    if (!value) return 'uncategorized';

    return value
        .toLowerCase()
        .trim()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'uncategorized';
};

export const getCloudinaryFolder = (category?: string, rootFolder = 'shewear-products'): string => {
    return `${rootFolder}/${sanitizeFolderSegment(category)}`;
};

export const uploadToCloudinary = async (
    fileBuffer: Buffer,
    category?: string
): Promise<CloudinaryUploadResult> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: getCloudinaryFolder(category),
                resource_type: 'image',
            },
            (error, result) => {
                if (error) return reject(error);
                if (result) {
                    return resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                    });
                }
                return reject(new Error('Cloudinary upload failed'));
            }
        );
        uploadStream.end(fileBuffer);
    });
};

export const deleteFromCloudinary = async (publicIds: string | string[] | undefined): Promise<void> => {
    if (!publicIds) return;

    const ids = Array.isArray(publicIds) ? publicIds.filter(Boolean) : [publicIds];
    if (ids.length === 0) return;

    await Promise.allSettled(ids.map((publicId) => cloudinary.uploader.destroy(publicId)));
};

export default cloudinary;
