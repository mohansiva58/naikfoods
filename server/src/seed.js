const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('redis');

dotenv.config({ path: path.join(__dirname, '../.env') });

// Pexels, Pixabay & Freepik Image URLs for  's Indian Clothing
// High-quality, royalty-free images for Sarees, Lehengas, Kurtis, Salwar Suits, Bridal & Party Wear

const ColorImageSchema = new mongoose.Schema({
    url: { type: String, required: true },
    publicId: { type: String }
});

const ProductSchema = new mongoose.Schema(
    {
        productId: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        originalPrice: { type: Number, min: 0 },
        image: { type: String, required: true },
        images: [{ type: String }],
        category: { type: String, required: true, index: true },
        sizes: {
            type: [String],
            required: true,
            validate: {
                validator: (v) => v && v.length > 0 && v.every((s) => s && s.trim().length > 0),
                message: 'At least one valid size is required',
            },
        },
        description: { type: String, required: true },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        reviews: { type: Number, default: 0, min: 0 },
        newArrival: { type: Boolean, default: false },
        isBestseller: { type: Boolean, default: false },
        stock: { type: Number, default: 100, min: 0 },
        setType: { type: String },
        colors: [{
            colorName: { type: String, required: true },
            colorCode: { type: String },
            image: { type: ColorImageSchema, required: true },
            images: [ColorImageSchema],
            stock: { type: Number, min: 0, default: 0 }
        }],
        cloudinaryId: { type: String },
        cloudinaryIds: [{ type: String }],
    },
    { timestamps: true }
);

ProductSchema.index({ category: 1, price: 1 });
ProductSchema.index({ newArrival: 1, isBestseller: 1 });
ProductSchema.index({ name: 'text', description: 'text' });

const SaleSchema = new mongoose.Schema(
    {
        saleId: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        originalPrice: { type: Number, min: 0 },
        image: { type: String, required: true },
        images: [{ type: String }],
        category: { type: String, required: true, index: true },
        sizes: {
            type: [String],
            required: true,
            validate: {
                validator: (v) => v && v.length > 0 && v.every((s) => s && s.trim().length > 0),
                message: 'At least one valid size is required',
            },
        },
        description: { type: String, required: true },
        reviews: { type: Number, default: 0, min: 0 },
        stock: { type: Number, min: 0, default: 100 },
        discount: { type: Number, min: 0, max: 100 },
        saleMode: { type: String, required: true, index: true },
        setType: { type: String },
        colors: [{
            colorName: { type: String, required: true },
            colorCode: { type: String },
            image: { type: ColorImageSchema, required: true },
            images: [ColorImageSchema],
            stock: { type: Number, min: 0, default: 0 }
        }],
        cloudinaryId: { type: String },
        cloudinaryIds: [{ type: String }],
    },
    { timestamps: true }
);

SaleSchema.index({ category: 1, createdAt: -1 });
SaleSchema.index({ saleMode: 1, createdAt: -1 });

const SaleModeSchema = new mongoose.Schema(
    {
        saleName: { type: String, required: true, unique: true, trim: true, index: true },
        isActive: { type: Boolean, default: false, index: true },
        description: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
    },
    { timestamps: true }
);

const CartSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, unique: true, index: true },
        items: [
            {
                productId: String,
                name: String,
                price: Number,
                image: String,
                size: String,
                quantity: Number,
                color: String,
            },
        ],
    },
    { timestamps: true }
);

const OrderSchema = new mongoose.Schema({}, { strict: false, timestamps: true });

const Product = mongoose.model('Product', ProductSchema);
const Sale = mongoose.model('Sale', SaleSchema);
const SaleMode = mongoose.model('SaleMode', SaleModeSchema);
const Cart = mongoose.model('Cart', CartSchema);
const Order = mongoose.model('Order', OrderSchema);

// High-quality Indian  's Wear Image Catalog from Pexels and Pixabay
// NO UNSPLASH LINKS -  -only Indian clothing imagery for all seed data
const catalogImages = {
    // Sarees - Traditional & Elegant ( 's Indian Attire)
    rubySaree: [
        'https://images.pexels.com/photos/7920188/pexels-photo-7920188.jpeg?cs=srgb&dl=pexels-sakshi-patwa-3335937-7920188.jpg&fm=jpg',
        'https://images.pexels.com/photos/37054322/pexels-photo-37054322.jpeg?cs=srgb&dl=pexels-satyampixels-37054322.jpg&fm=jpg',
        'https://images.pexels.com/photos/28943474/pexels-photo-28943474.jpeg?cs=srgb&dl=pexels-manishjangid-28943474.jpg&fm=jpg',
    ],
    pinkSaree: [
        'https://images.pexels.com/photos/27918896/pexels-photo-27918896.jpeg?cs=srgb&dl=pexels-kewal-nagda-1669654142-27918896.jpg&fm=jpg',
        'https://images.pexels.com/photos/30244535/pexels-photo-30244535.jpeg?cs=srgb&dl=pexels-aa-s-photography-785966153-30244535.jpg&fm=jpg',
        'https://images.pexels.com/photos/37054318/pexels-photo-37054318.jpeg?cs=srgb&dl=pexels-satyampixels-37054318.jpg&fm=jpg',
    ],
    goldSaree: [
        'https://images.pexels.com/photos/12791932/pexels-photo-12791932.jpeg?cs=srgb&dl=pexels-1054048-12791932.jpg&fm=jpg',
        'https://images.pexels.com/photos/12962584/pexels-photo-12962584.jpeg?cs=srgb&dl=pexels-lunatic-editz-1053159-12962584.jpg&fm=jpg',
        'https://images.pexels.com/photos/11748794/pexels-photo-11748794.jpeg?cs=srgb&dl=pexels-1054048-11748794.jpg&fm=jpg',
    ],
    purpleSaree: [
        'https://images.pexels.com/photos/7920194/pexels-photo-7920194.jpeg?cs=srgb&dl=pexels-sakshi-patwa-3335937-7920194.jpg&fm=jpg',
        'https://images.pexels.com/photos/35390253/pexels-photo-35390253.jpeg?cs=srgb&dl=pexels-rahul-gurjar-2149067193-35390253.jpg&fm=jpg',
        'https://images.pexels.com/photos/28135787/pexels-photo-28135787.jpeg?cs=srgb&dl=pexels-dream_-makkerzz-1603229-28135787.jpg&fm=jpg',
    ],
    
    // Lehengas - Bridal & Festive ( 's Indian Attire)
    roseLehenga: [
        'https://images.pexels.com/photos/37628608/pexels-photo-37628608.jpeg?cs=srgb&dl=pexels-aksinfo7-37628608.jpg&fm=jpg',
        'https://images.pexels.com/photos/33343591/pexels-photo-33343591.jpeg?cs=srgb&dl=pexels-shadievents-2154673515-33343591.jpg&fm=jpg',
        'https://images.pexels.com/photos/33343613/pexels-photo-33343613.jpeg?cs=srgb&dl=pexels-shadievents-2154673515-33343613.jpg&fm=jpg',
    ],
    brideLehenga: [
        'https://images.pexels.com/photos/12791932/pexels-photo-12791932.jpeg?cs=srgb&dl=pexels-1054048-12791932.jpg&fm=jpg',
        'https://images.pexels.com/photos/12762484/pexels-photo-12762484.jpeg?cs=srgb&dl=pexels-1054048-12762484.jpg&fm=jpg',
        'https://images.pexels.com/photos/12959396/pexels-photo-12959396.jpeg?cs=srgb&dl=pexels-1054048-12959396.jpg&fm=jpg',
    ],
    magentaLehenga: [
        'https://images.pexels.com/photos/16803130/pexels-photo-16803130.jpeg?cs=srgb&dl=pexels-pratik-patil-415018186-16803130.jpg&fm=jpg',
        'https://images.pexels.com/photos/12062663/pexels-photo-12062663.jpeg?cs=srgb&dl=pexels-prajapatisanju-12062663.jpg&fm=jpg',
        'https://images.pexels.com/photos/12792006/pexels-photo-12792006.jpeg?cs=srgb&dl=pexels-1054048-12792006.jpg&fm=jpg',
    ],
    
    // Kurtis - Casual & Elegant ( 's Indian Attire)
    cottonKurti: [
        'https://images.pexels.com/photos/28512787/pexels-photo-28512787.jpeg?cs=srgb&dl=pexels-neha-mishra-1851906907-28512787.jpg&fm=jpg',
        'https://images.pexels.com/photos/35521738/pexels-photo-35521738.jpeg?cs=srgb&dl=pexels-kunal-yadav-photography-2158088461-35521738.jpg&fm=jpg',
        'https://images.pexels.com/photos/36311379/pexels-photo-36311379.jpeg?cs=srgb&dl=pexels-kolkatarphotographer-36311379.jpg&fm=jpg',
    ],
    flowerKurti: [
        'https://images.pexels.com/photos/37523792/pexels-photo-37523792.jpeg?cs=srgb&dl=pexels-sk8805-37523792.jpg&fm=jpg',
        'https://images.pexels.com/photos/37523793/pexels-photo-37523793.jpeg?cs=srgb&dl=pexels-sk8805-37523793.jpg&fm=jpg',
        'https://images.pexels.com/photos/37593738/pexels-photo-37593738.jpeg?cs=srgb&dl=pexels-sk8805-37593738.jpg&fm=jpg',
    ],
    
    // Salwar Suits - Traditional ( 's Indian Attire)
    salwarSuit: [
        'https://images.pexels.com/photos/33824984/pexels-photo-33824984.jpeg?cs=srgb&dl=pexels-shiva-rijal-701652870-33824984.jpg&fm=jpg',
        'https://images.pexels.com/photos/30196701/pexels-photo-30196701.jpeg?cs=srgb&dl=pexels-divyam-arora-260498068-30196701.jpg&fm=jpg',
        'https://images.pexels.com/photos/13584944/pexels-photo-13584944.jpeg?cs=srgb&dl=pexels-abdullah-khan-314140297-13584944.jpg&fm=jpg',
    ],
    embroideredSalwar: [
        'https://images.pexels.com/photos/20777181/pexels-photo-20777181.jpeg?cs=srgb&dl=pexels-dhanno-20777181.jpg&fm=jpg',
        'https://images.pexels.com/photos/11840167/pexels-photo-11840167.jpeg?cs=srgb&dl=pexels-imadclicks-11840167.jpg&fm=jpg',
        'https://images.pexels.com/photos/34933671/pexels-photo-34933671.jpeg?cs=srgb&dl=pexels-dhanno-34933671.jpg&fm=jpg',
    ],
    
    // Party Wear ( 's Indian Attire)
    partyWear: [
        'https://images.pexels.com/photos/37628608/pexels-photo-37628608.jpeg?cs=srgb&dl=pexels-aksinfo7-37628608.jpg&fm=jpg',
        'https://images.pexels.com/photos/30686200/pexels-photo-30686200.jpeg?cs=srgb&dl=pexels-kashif-khan-khan-563571688-30686200.jpg&fm=jpg',
        'https://images.pexels.com/photos/32500101/pexels-photo-32500101.jpeg?cs=srgb&dl=pexels-legacy-shots-by-sharan-sathya-692552845-32500101.jpg&fm=jpg',
    ],
    
    // Bridal Collections ( 's Indian Attire)
    bridalElegance: [
        'https://images.pexels.com/photos/12791932/pexels-photo-12791932.jpeg?cs=srgb&dl=pexels-1054048-12791932.jpg&fm=jpg',
        'https://images.pexels.com/photos/12791934/pexels-photo-12791934.jpeg?cs=srgb&dl=pexels-1054048-12791934.jpg&fm=jpg',
        'https://images.pexels.com/photos/12959396/pexels-photo-12959396.jpeg?cs=srgb&dl=pexels-1054048-12959396.jpg&fm=jpg',
    ],
    bridalRed: [
        'https://images.pexels.com/photos/12792006/pexels-photo-12792006.jpeg?cs=srgb&dl=pexels-1054048-12792006.jpg&fm=jpg',
        'https://images.pexels.com/photos/12762484/pexels-photo-12762484.jpeg?cs=srgb&dl=pexels-1054048-12762484.jpg&fm=jpg',
        'https://images.pexels.com/photos/12962584/pexels-photo-12962584.jpeg?cs=srgb&dl=pexels-lunatic-editz-1053159-12962584.jpg&fm=jpg',
    ],
};

const products = [
    // ==================== SAREES ====================
    {
        productId: 'PROD-RUBY-SILK-SAREE',
        name: 'Ruby Banarasi Silk Saree',
        price: 8499,
        originalPrice: 10999,
        image: catalogImages.rubySaree[0],
        images: catalogImages.rubySaree,
        category: 'Sarees',
        sizes: ['Free Size'],
        description: 'A magnificent ruby silk saree with intricate zari weaving and traditional Banarasi patterns. Perfect for weddings, receptions, and festive occasions. Features a luxurious silk blend and timeless elegance.',
        rating: 4.9,
        reviews: 184,
        newArrival: true,
        isBestseller: true,
        stock: 26,
        weight: 1.2,
        setType: 'Saree with Blouse',
        colors: [
            {
                colorName: 'Ruby Red',
                colorCode: '#E0115F',
                image: { url: catalogImages.rubySaree[0] },
                images: [{ url: catalogImages.rubySaree[0] }, { url: catalogImages.rubySaree[1] }],
                stock: 26
            }
        ]
    },
    {
        productId: 'PROD-PINK-COTTON-SAREE',
        name: 'Pink Printed Cotton Saree',
        price: 4299,
        originalPrice: 5999,
        image: catalogImages.pinkSaree[0],
        images: catalogImages.pinkSaree,
        category: 'Sarees',
        sizes: ['Free Size'],
        description: 'Elegant pink cotton saree with beautiful traditional block print patterns. Lightweight and breathable, ideal for daily wear and office settings. Features a classic pallu design.',
        rating: 4.7,
        reviews: 156,
        newArrival: false,
        isBestseller: true,
        stock: 35,
        weight: 0.9,
        setType: 'Saree with Blouse',
        colors: [
            {
                colorName: 'Light Pink',
                colorCode: '#FFB6C1',
                image: { url: catalogImages.pinkSaree[0] },
                images: [{ url: catalogImages.pinkSaree[0] }, { url: catalogImages.pinkSaree[1] }],
                stock: 35
            }
        ]
    },
    {
        productId: 'PROD-GOLD-TISSUE-SAREE',
        name: 'Gold Tissue Saree with Zari',
        price: 12499,
        originalPrice: 15999,
        image: catalogImages.goldSaree[0],
        images: catalogImages.goldSaree,
        category: 'Sarees',
        sizes: ['Free Size'],
        description: 'A festive gold tissue saree with shimmering zari borders and ornate detailing. Perfect for ceremonies, pujas, and wedding functions. Ensures a luminous, regal appearance.',
        rating: 4.9,
        reviews: 88,
        newArrival: true,
        isBestseller: false,
        stock: 21,
        weight: 1.3,
        setType: 'Saree with Blouse',
        colors: [
            {
                colorName: 'Antique Gold',
                colorCode: '#D4AF37',
                image: { url: catalogImages.goldSaree[0] },
                images: [{ url: catalogImages.goldSaree[0] }, { url: catalogImages.goldSaree[1] }],
                stock: 21
            }
        ]
    },
    {
        productId: 'PROD-PURPLE-GEORGETTE-SAREE',
        name: 'Purple Georgette Saree',
        price: 6299,
        originalPrice: 7999,
        image: catalogImages.purpleSaree[0],
        images: catalogImages.purpleSaree,
        category: 'Sarees',
        sizes: ['Free Size'],
        description: 'Lightweight purple georgette saree with subtle shimmer and elegant design. Perfect for parties and evening gatherings. The breathable fabric ensures comfort all day long.',
        rating: 4.8,
        reviews: 121,
        newArrival: false,
        isBestseller: true,
        stock: 32,
        weight: 0.8,
        setType: 'Saree with Blouse',
        colors: [
            {
                colorName: 'Royal Purple',
                colorCode: '#7851A9',
                image: { url: catalogImages.purpleSaree[0] },
                images: [{ url: catalogImages.purpleSaree[0] }, { url: catalogImages.purpleSaree[1] }],
                stock: 32
            }
        ]
    },
    {
        productId: 'PROD-CREAM-LINEN-SAREE',
        name: 'Cream Linen Traditional Saree',
        price: 3599,
        originalPrice: 4799,
        image: catalogImages.pinkSaree[2],
        images: catalogImages.pinkSaree,
        category: 'Sarees',
        sizes: ['Free Size'],
        description: 'Pure cream linen saree perfect for everyday elegance and comfort. Features traditional border design. Ideal for office wear and casual gatherings.',
        rating: 4.6,
        reviews: 98,
        newArrival: true,
        isBestseller: false,
        stock: 40,
        weight: 0.85,
        setType: 'Saree with Blouse',
        colors: [
            {
                colorName: 'Cream',
                colorCode: '#FFFDD0',
                image: { url: catalogImages.pinkSaree[2] },
                images: [{ url: catalogImages.pinkSaree[2] }, { url: catalogImages.pinkSaree[0] }],
                stock: 40
            }
        ]
    },

    // ==================== LEHENGAS ====================
    {
        productId: 'PROD-ROSE-ZARDOZI-LEHENGA',
        name: 'Rose Ivory Zardozi Lehenga',
        price: 21999,
        originalPrice: 27999,
        image: catalogImages.roseLehenga[0],
        images: catalogImages.roseLehenga,
        category: 'Lehengas',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        description: 'Exquisite rose ivory lehenga set with intricate Zardozi embroidery and soft flare. Features a graceful dupatta perfect for bridal occasions and grand celebrations.',
        rating: 5.0,
        reviews: 96,
        newArrival: true,
        isBestseller: true,
        stock: 14,
        weight: 1.8,
        setType: '3 piece set (Lehenga, Choli, Dupatta)',
        colors: [
            {
                colorName: 'Rose Ivory',
                colorCode: '#F5E6D3',
                image: { url: catalogImages.roseLehenga[0] },
                images: [{ url: catalogImages.roseLehenga[0] }, { url: catalogImages.roseLehenga[1] }],
                stock: 14
            }
        ]
    },
    {
        productId: 'PROD-MAGENTA-SILK-LEHENGA',
        name: 'Magenta Silk Sharara Lehenga Set',
        price: 18999,
        originalPrice: 24999,
        image: catalogImages.magentaLehenga[0],
        images: catalogImages.magentaLehenga,
        category: 'Lehengas',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        description: 'Festive magenta silk lehenga set with rich embroidery and comfortable sharara style. Perfect for wedding functions and celebrations with beautiful movement.',
        rating: 4.8,
        reviews: 92,
        newArrival: true,
        isBestseller: true,
        stock: 18,
        weight: 1.7,
        setType: '3 piece set (Lehenga, Choli, Dupatta)',
        colors: [
            {
                colorName: 'Magenta',
                colorCode: '#FF1493',
                image: { url: catalogImages.magentaLehenga[0] },
                images: [{ url: catalogImages.magentaLehenga[0] }, { url: catalogImages.magentaLehenga[1] }],
                stock: 18
            }
        ]
    },
    {
        productId: 'PROD-TEAL-EMBROIDERED-LEHENGA',
        name: 'Teal Embroidered Party Lehenga',
        price: 15999,
        originalPrice: 20999,
        image: catalogImages.roseLehenga[2],
        images: catalogImages.roseLehenga,
        category: 'Lehengas',
        sizes: ['S', 'M', 'L', 'XL'],
        description: 'Elegant teal lehenga with stone embroidery and graceful fit. Perfect for festive celebrations and parties. Comes with matching choli and dupatta.',
        rating: 4.7,
        reviews: 78,
        newArrival: false,
        isBestseller: true,
        stock: 20,
        weight: 1.6,
        setType: '3 piece set (Lehenga, Choli, Dupatta)',
        colors: [
            {
                colorName: 'Teal',
                colorCode: '#008080',
                image: { url: catalogImages.roseLehenga[2] },
                images: [{ url: catalogImages.roseLehenga[2] }, { url: catalogImages.roseLehenga[0] }],
                stock: 20
            }
        ]
    },

    // ==================== KURTIS ====================
    {
        productId: 'PROD-FLORAL-COTTON-KURTI',
        name: 'Elegant Floral Cotton Kurti',
        price: 2499,
        originalPrice: 3499,
        image: catalogImages.cottonKurti[0],
        images: catalogImages.cottonKurti,
        category: 'Kurtis',
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        description: 'Beautiful everyday floral kurti in   breathable cotton. Perfect for office and casual wear. Features a straight-cut design with matching dupatta and comfortable fit.',
        rating: 4.8,
        reviews: 142,
        newArrival: true,
        isBestseller: true,
        stock: 65,
        weight: 0.65,
        setType: '2 piece set (Kurti, Dupatta)',
        colors: [
            {
                colorName: 'Teal Green',
                colorCode: '#008080',
                image: { url: catalogImages.cottonKurti[0] },
                images: [{ url: catalogImages.cottonKurti[0] }, { url: catalogImages.cottonKurti[1] }],
                stock: 35
            },
            {
                colorName: 'Cream Beige',
                colorCode: '#FFFDD0',
                image: { url: catalogImages.cottonKurti[1] },
                images: [{ url: catalogImages.cottonKurti[1] }, { url: catalogImages.cottonKurti[2] }],
                stock: 30
            }
        ]
    },
    {
        productId: 'PROD-CHIKANKARI-KURTI',
        name: 'Pastel Chikankari Kurti Set',
        price: 3199,
        originalPrice: 4299,
        image: catalogImages.flowerKurti[0],
        images: catalogImages.flowerKurti,
        category: 'Kurtis',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        description: 'Hand-embroidered Chikankari kurti in soft pastel tones. Made with lightweight georgette, this features detailed threadwork and comes with an inner slip and palazzo pants.',
        rating: 4.9,
        reviews: 131,
        newArrival: true,
        isBestseller: false,
        stock: 45,
        weight: 0.70,
        setType: '2 piece set (Kurti, Palazzo)',
        colors: [
            {
                colorName: 'Lavender Purple',
                colorCode: '#E6E6FA',
                image: { url: catalogImages.flowerKurti[0] },
                images: [{ url: catalogImages.flowerKurti[0] }, { url: catalogImages.flowerKurti[1] }],
                stock: 22
            },
            {
                colorName: 'Pale Yellow',
                colorCode: '#FFFFE0',
                image: { url: catalogImages.flowerKurti[1] },
                images: [{ url: catalogImages.flowerKurti[1] }, { url: catalogImages.flowerKurti[2] }],
                stock: 23
            }
        ]
    },
    {
        productId: 'PROD-PRINTED-COTTON-KURTI',
        name: 'Printed Cotton Casual Kurti',
        price: 1999,
        originalPrice: 2799,
        image: catalogImages.cottonKurti[2],
        images: catalogImages.cottonKurti,
        category: 'Kurtis',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        description: 'Casual printed cotton kurti with traditional motifs. Perfect for everyday wear, shopping, and casual outings. Comfortable, breathable, and stylish.',
        rating: 4.6,
        reviews: 158,
        newArrival: false,
        isBestseller: true,
        stock: 75,
        weight: 0.55,
        setType: '1 piece (Kurti)',
        colors: [
            {
                colorName: 'Navy Blue',
                colorCode: '#000080',
                image: { url: catalogImages.cottonKurti[2] },
                images: [{ url: catalogImages.cottonKurti[2] }, { url: catalogImages.cottonKurti[0] }],
                stock: 75
            }
        ]
    },
    {
        productId: 'PROD-EMBROIDERED-TUNIC-KURTI',
        name: 'Embroidered Tunic Kurti',
        price: 3899,
        originalPrice: 5299,
        image: catalogImages.flowerKurti[2],
        images: catalogImages.flowerKurti,
        category: 'Kurtis',
        sizes: ['S', 'M', 'L', 'XL'],
        description: 'Elegant tunic-style kurti with beautiful embroidery work. Crafted from   cotton-silk blend. Ideal for semi-formal occasions and evening gatherings.',
        rating: 4.8,
        reviews: 87,
        newArrival: true,
        isBestseller: false,
        stock: 40,
        weight: 0.75,
        setType: '1 piece (Kurti)',
        colors: [
            {
                colorName: 'Burgundy',
                colorCode: '#800020',
                image: { url: catalogImages.flowerKurti[2] },
                images: [{ url: catalogImages.flowerKurti[2] }, { url: catalogImages.flowerKurti[0] }],
                stock: 40
            }
        ]
    },

    // ==================== SALWAR SUITS ====================
    {
        productId: 'PROD-PEARL-WHITE-SALWAR',
        name: 'Pearl White Salwar Kameez',
        price: 4999,
        originalPrice: 6499,
        image: catalogImages.salwarSuit[0],
        images: catalogImages.salwarSuit,
        category: 'Salwar Suits',
        sizes: ['S', 'M', 'L', 'XL'],
        description: 'Refined pearl white salwar kameez with light embellishment and polished boutique feel. Perfect for formal gatherings and festive celebrations. Comes with matching dupatta.',
        rating: 4.5,
        reviews: 158,
        newArrival: false,
        isBestseller: false,
        stock: 42,
        weight: 0.85,
        setType: '3 piece set (Kameez, Salwar, Dupatta)',
        colors: [
            {
                colorName: 'Pearl White',
                colorCode: '#FDEEF4',
                image: { url: catalogImages.salwarSuit[0] },
                images: [{ url: catalogImages.salwarSuit[0] }, { url: catalogImages.salwarSuit[1] }],
                stock: 42
            }
        ]
    },
    {
        productId: 'PROD-EMBROIDERED-SALWAR-SUIT',
        name: 'Embroidered Blue Salwar Suit',
        price: 5799,
        originalPrice: 7999,
        image: catalogImages.embroideredSalwar[0],
        images: catalogImages.embroideredSalwar,
        category: 'Salwar Suits',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        description: 'Beautiful blue salwar suit with intricate embroidery on neckline and sleeves. Made from   cotton silk blend. Includes matching straight pants and sheer dupatta.',
        rating: 4.7,
        reviews: 173,
        newArrival: true,
        isBestseller: true,
        stock: 55,
        weight: 0.90,
        setType: '3 piece set (Kameez, Salwar, Dupatta)',
        colors: [
            {
                colorName: 'Deep Blue',
                colorCode: '#00008B',
                image: { url: catalogImages.embroideredSalwar[0] },
                images: [{ url: catalogImages.embroideredSalwar[0] }, { url: catalogImages.embroideredSalwar[1] }],
                stock: 55
            }
        ]
    },
    {
        productId: 'PROD-DESIGNER-SALWAR',
        name: 'Designer Silk Salwar Suit',
        price: 8999,
        originalPrice: 11999,
        image: catalogImages.salwarSuit[2],
        images: catalogImages.salwarSuit,
        category: 'Salwar Suits',
        sizes: ['S', 'M', 'L', 'XL'],
        description: '  designer salwar suit in rich silk fabric with traditional patterns and gold detailing. Perfect for weddings and special occasions. Includes heavy dupatta.',
        rating: 4.8,
        reviews: 195,
        newArrival: true,
        isBestseller: true,
        stock: 38,
        weight: 1.0,
        setType: '3 piece set (Kameez, Salwar, Dupatta)',
        colors: [
            {
                colorName: 'Maroon Gold',
                colorCode: '#800000',
                image: { url: catalogImages.salwarSuit[2] },
                images: [{ url: catalogImages.salwarSuit[2] }, { url: catalogImages.salwarSuit[0] }],
                stock: 38
            }
        ]
    },
    {
        productId: 'PROD-GREEN-COTTON-SALWAR',
        name: 'Green Cotton Salwar Suit',
        price: 3999,
        originalPrice: 5499,
        image: catalogImages.embroideredSalwar[2],
        images: catalogImages.embroideredSalwar,
        category: 'Salwar Suits',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        description: 'Light green cotton salwar suit with subtle borders. Perfect for office and casual wear. Comfortable and breathable fabric with matching dupatta.',
        rating: 4.6,
        reviews: 102,
        newArrival: false,
        isBestseller: true,
        stock: 60,
        weight: 0.80,
        setType: '3 piece set (Kameez, Salwar, Dupatta)',
        colors: [
            {
                colorName: 'Light Green',
                colorCode: '#90EE90',
                image: { url: catalogImages.embroideredSalwar[2] },
                images: [{ url: catalogImages.embroideredSalwar[2] }, { url: catalogImages.embroideredSalwar[0] }],
                stock: 60
            }
        ]
    },

    // ==================== PARTY WEAR ====================
    {
        productId: 'PROD-PARTY-WEAR-GOWN',
        name: 'Elegant Party Wear Gown',
        price: 7999,
        originalPrice: 10999,
        image: catalogImages.partyWear[0],
        images: catalogImages.partyWear,
        category: 'Party Wear',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        description: 'Sophisticated party wear gown with elegant draping and subtle shimmer. Features intricate embroidery and a flattering silhouette. Perfect for evening events and celebrations.',
        rating: 4.8,
        reviews: 167,
        newArrival: true,
        isBestseller: true,
        stock: 32,
        weight: 1.1,
        setType: '1 piece (Gown)',
        colors: [
            {
                colorName: 'Midnight Black',
                colorCode: '#0C0C0C',
                image: { url: catalogImages.partyWear[0] },
                images: [{ url: catalogImages.partyWear[0] }, { url: catalogImages.partyWear[1] }],
                stock: 32
            }
        ]
    },
    {
        productId: 'PROD-HEAVY-PARTY-SAREE',
        name: 'Heavy Embroidered Party Saree',
        price: 14999,
        originalPrice: 19999,
        image: catalogImages.partyWear[1],
        images: catalogImages.partyWear,
        category: 'Party Wear',
        sizes: ['Free Size'],
        description: 'Stunning party saree with heavy zari and stone embroidery. Perfect for grand celebrations and festive events. Features intricate traditional patterns and luxurious finish.',
        rating: 4.9,
        reviews: 182,
        newArrival: true,
        isBestseller: true,
        stock: 24,
        weight: 1.5,
        setType: 'Saree with Blouse',
        colors: [
            {
                colorName: 'Emerald Green',
                colorCode: '#50C878',
                image: { url: catalogImages.partyWear[1] },
                images: [{ url: catalogImages.partyWear[1] }, { url: catalogImages.partyWear[2] }],
                stock: 24
            }
        ]
    },
    {
        productId: 'PROD-SEQUIN-PARTY-KURTI',
        name: 'Sequin Embellished Party Kurti',
        price: 3999,
        originalPrice: 5499,
        image: catalogImages.partyWear[2],
        images: catalogImages.partyWear,
        category: 'Party Wear',
        sizes: ['S', 'M', 'L', 'XL'],
        description: 'Glamorous party kurti with sequin embellishments and mirror work. Perfect for evening parties and celebrations. Pairs beautifully with palazzo or leggings.',
        rating: 4.7,
        reviews: 145,
        newArrival: true,
        isBestseller: false,
        stock: 42,
        weight: 0.75,
        setType: '2 piece set (Kurti, Dupatta)',
        colors: [
            {
                colorName: 'Gold Shimmer',
                colorCode: '#FFD700',
                image: { url: catalogImages.partyWear[2] },
                images: [{ url: catalogImages.partyWear[2] }, { url: catalogImages.partyWear[0] }],
                stock: 42
            }
        ]
    },
    {
        productId: 'PROD-WINE-PARTY-SHARARA',
        name: 'Wine Silk Party Sharara',
        price: 6999,
        originalPrice: 9299,
        image: catalogImages.partyWear[0],
        images: catalogImages.partyWear,
        category: 'Party Wear',
        sizes: ['S', 'M', 'L', 'XL'],
        description: 'Rich wine-colored silk sharara suit with stone and thread embroidery. Perfect for festive celebrations with comfortable wide-leg silhouette. Includes matching choli and dupatta.',
        rating: 4.7,
        reviews: 98,
        newArrival: false,
        isBestseller: true,
        stock: 35,
        weight: 1.2,
        setType: '3 piece set (Sharara, Choli, Dupatta)',
        colors: [
            {
                colorName: 'Wine Red',
                colorCode: '#722F37',
                image: { url: catalogImages.partyWear[0] },
                images: [{ url: catalogImages.partyWear[0] }, { url: catalogImages.partyWear[1] }],
                stock: 35
            }
        ]
    },

    // ==================== BRIDAL COLLECTIONS ====================
    {
        productId: 'PROD-BRIDAL-RED-SAREE',
        name: 'Bridal Red Banarasi Saree',
        price: 28999,
        originalPrice: 36999,
        image: catalogImages.bridalElegance[0],
        images: catalogImages.bridalElegance,
        category: 'Bridal Collections',
        sizes: ['Free Size'],
        description: 'Majestic bridal saree in traditional red with heavy gold zari and intricate Banarasi weaving. Features a stunning pallu and border. Perfect for weddings and grand celebrations.',
        rating: 5.0,
        reviews: 212,
        newArrival: true,
        isBestseller: true,
        stock: 12,
        weight: 1.8,
        setType: 'Saree with Blouse',
        colors: [
            {
                colorName: 'Royal Bridal Red',
                colorCode: '#8B0000',
                image: { url: catalogImages.bridalElegance[0] },
                images: [{ url: catalogImages.bridalElegance[0] }, { url: catalogImages.bridalElegance[1] }],
                stock: 12
            }
        ]
    },
    {
        productId: 'PROD-BRIDE-COLLECTION-LEHENGA',
        name: 'Bridal Elegance Red Lehenga',
        price: 35999,
        originalPrice: 45999,
        image: catalogImages.bridalRed[0],
        images: catalogImages.bridalRed,
        category: 'Bridal Collections',
        sizes: ['XS', 'S', 'M', 'L'],
        description: 'Stunning bridal lehenga in deep red with intricate stone and zari embroidery. Features a heavily embellished blouse and designer dupatta. A show-stopper for weddings.',
        rating: 5.0,
        reviews: 164,
        newArrival: true,
        isBestseller: true,
        stock: 11,
        weight: 2.5,
        setType: '3 piece set (Lehenga, Choli, Dupatta)',
        colors: [
            {
                colorName: 'Bridal Red',
                colorCode: '#DC143C',
                image: { url: catalogImages.bridalRed[0] },
                images: [{ url: catalogImages.bridalRed[0] }, { url: catalogImages.bridalRed[1] }],
                stock: 11
            }
        ]
    },
    {
        productId: 'PROD-BRIDAL-GOLD-LEHENGA',
        name: 'Bridal Gold Silk Lehenga',
        price: 38999,
        originalPrice: 49999,
        image: catalogImages.bridalElegance[1],
        images: catalogImages.bridalElegance,
        category: 'Bridal Collections',
        sizes: ['XS', 'S', 'M', 'L'],
        description: 'Extravagant bridal lehenga in rich gold silk with exquisite stone and pearl embroidery throughout. Features a heavily embellished blouse and an ornate designer dupatta.',
        rating: 5.0,
        reviews: 189,
        newArrival: true,
        isBestseller: true,
        stock: 9,
        weight: 2.5,
        setType: '3 piece set (Lehenga, Choli, Dupatta)',
        colors: [
            {
                colorName: 'Antique Gold',
                colorCode: '#D4AF37',
                image: { url: catalogImages.bridalElegance[1] },
                images: [{ url: catalogImages.bridalElegance[1] }, { url: catalogImages.bridalElegance[2] }],
                stock: 9
            }
        ]
    },
    {
        productId: 'PROD-BRIDAL-PINK-COLLECTION',
        name: 'Bridal Pink Embroidered Lehenga',
        price: 32999,
        originalPrice: 42999,
        image: catalogImages.bridalElegance[2],
        images: catalogImages.bridalElegance,
        category: 'Bridal Collections',
        sizes: ['XS', 'S', 'M', 'L'],
        description: 'Gorgeous bridal lehenga in blush pink with intricate zari and stone embroidery. Features a voluminous skirt with traditional patterns and a luxurious dupatta.',
        rating: 4.9,
        reviews: 176,
        newArrival: true,
        isBestseller: true,
        stock: 13,
        weight: 2.3,
        setType: '3 piece set (Lehenga, Choli, Dupatta)',
        colors: [
            {
                colorName: 'Bridal Pink',
                colorCode: '#FFB6C1',
                image: { url: catalogImages.bridalElegance[2] },
                images: [{ url: catalogImages.bridalElegance[2] }, { url: catalogImages.bridalElegance[0] }],
                stock: 13
            }
        ]
    },
    {
        productId: 'PROD-BRIDAL-MAROON-SAREE',
        name: 'Bridal Maroon Zari Saree',
        price: 31999,
        originalPrice: 40999,
        image: catalogImages.bridalRed[2],
        images: catalogImages.bridalRed,
        category: 'Bridal Collections',
        sizes: ['Free Size'],
        description: 'Exquisite bridal saree in deep maroon with extensive gold zari work and traditional motifs. Features a grand pallu and decorated border perfect for wedding ceremonies.',
        rating: 5.0,
        reviews: 156,
        newArrival: true,
        isBestseller: true,
        stock: 10,
        weight: 1.7,
        setType: 'Saree with Blouse',
        colors: [
            {
                colorName: 'Bridal Maroon',
                colorCode: '#800000',
                image: { url: catalogImages.bridalRed[2] },
                images: [{ url: catalogImages.bridalRed[2] }, { url: catalogImages.bridalRed[0] }],
                stock: 10
            }
        ]
    },
];
/*
            {
                colorName: 'Royal Purple',
                colorCode: '#7851A9',
                image: { url: catalogImages.purpleSaree[0] },
                images: [{ url: catalogImages.purpleSaree[0] }, { url: catalogImages.purpleSaree[1] }],
                stock: 32
            }
        ]
    },

    // ==================== LEHENGAS ====================
    {
        productId: 'PROD-ROSE-ZARDOZI-LEHENGA',
        name: 'Rose Ivory Zardozi Lehenga',
        price: 21999,
        originalPrice: 27999,
        image: catalogImages.roseLehenga[0],
        images: catalogImages.roseLehenga,
        category: 'Lehengas',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        description: 'Exquisite rose ivory lehenga set with intricate Zardozi embroidery and soft flare. Features a graceful dupatta perfect for bridal occasions and grand celebrations.',
        rating: 5.0,
        reviews: 96,
        newArrival: true,
        isBestseller: true,
        stock: 14,
        weight: 1.8,
        setType: '3 piece set (Lehenga, Choli, Dupatta)',
        colors: [
            {
                colorName: 'Rose Ivory',
                colorCode: '#F5E6D3',
                image: { url: catalogImages.roseLehenga[0] },
                images: [{ url: catalogImages.roseLehenga[0] }, { url: catalogImages.roseLehenga[1] }],
                stock: 14
            }
        ]
    },
    {
        productId: 'PROD-BRIDE-COLLECTION-LEHENGA',
        name: 'Bridal Elegance Red Lehenga',
        price: 35999,
        originalPrice: 45999,
        image: catalogImages.brideLehenga[0],
        images: catalogImages.brideLehenga,
        category: 'Bridal Collections',
        sizes: ['XS', 'S', 'M', 'L'],
        description: 'Stunning bridal lehenga in deep red with intricate stone and zari embroidery. Features a heavily embellished blouse and designer dupatta. A show-stopper for weddings.',
        rating: 5.0,
        reviews: 64,
        newArrival: true,
        isBestseller: true,
        stock: 8,
        weight: 2.5,
        setType: '3 piece set (Lehenga, Choli, Dupatta)',
        colors: [
            {
                colorName: 'Bridal Red',
                colorCode: '#DC143C',
                image: { url: catalogImages.brideLehenga[0] },
                images: [{ url: catalogImages.brideLehenga[0] }, { url: catalogImages.brideLehenga[1] }],
                stock: 8
            }
        ]
    },

    // ==================== KURTIS ====================
    {
        productId: 'PROD-FLORAL-COTTON-KURTI',
        name: 'Elegant Floral Cotton Kurti',
        price: 2499,
        originalPrice: 3499,
        image: catalogImages.cottonKurti[0],
        images: catalogImages.cottonKurti,
        category: 'Kurtis',
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        description: 'Beautiful everyday floral kurti in   breathable cotton. Perfect for office and casual wear. Features a straight-cut design with matching dupatta and comfortable fit.',
        rating: 4.8,
        reviews: 42,
        newArrival: true,
        isBestseller: true,
        stock: 45,
        weight: 0.65,
        setType: '2 piece set (Kurti, Dupatta)',
        colors: [
            {
                colorName: 'Teal Green',
                colorCode: '#008080',
                image: { url: catalogImages.cottonKurti[0] },
                images: [{ url: catalogImages.cottonKurti[0] }, { url: catalogImages.cottonKurti[1] }],
                stock: 23
            },
            {
                colorName: 'Cream Beige',
                colorCode: '#FFFDD0',
                image: { url: catalogImages.cottonKurti[1] },
                images: [{ url: catalogImages.cottonKurti[1] }, { url: catalogImages.cottonKurti[2] }],
                stock: 22
            }
        ]
    },
    {
        productId: 'PROD-CHIKANKARI-KURTI',
        name: 'Pastel Chikankari Kurti Set',
        price: 3199,
        originalPrice: 4299,
        image: catalogImages.cottonKurti[1],
        images: catalogImages.cottonKurti,
        category: 'Kurtis',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        description: 'Hand-embroidered Chikankari kurti in soft pastel tones. Made with lightweight georgette, this features detailed threadwork and comes with an inner slip and palazzo pants.',
        rating: 4.9,
        reviews: 31,
        newArrival: true,
        isBestseller: false,
        stock: 30,
        weight: 0.70,
        setType: '2 piece set (Kurti, Palazzo)',
        colors: [
            {
                colorName: 'Lavender Purple',
                colorCode: '#E6E6FA',
                image: { url: catalogImages.cottonKurti[1] },
                images: [{ url: catalogImages.cottonKurti[1] }, { url: catalogImages.cottonKurti[2] }],
                stock: 15
            },
            {
                colorName: 'Pale Yellow',
                colorCode: '#FFFFE0',
                image: { url: catalogImages.cottonKurti[2] },
                images: [{ url: catalogImages.cottonKurti[2] }, { url: catalogImages.cottonKurti[0] }],
                stock: 15
            }
        ]
    },
    {
        productId: 'PROD-PRINTED-COTTON-KURTI',
        name: 'Printed Cotton Casual Kurti',
        price: 1999,
        originalPrice: 2799,
        image: catalogImages.cottonKurti[2],
        images: catalogImages.cottonKurti,
        category: 'Kurtis',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        description: 'Casual printed cotton kurti with traditional motifs. Perfect for everyday wear, shopping, and casual outings. Comfortable, breathable, and stylish.',
        rating: 4.6,
        reviews: 58,
        newArrival: false,
        isBestseller: true,
        stock: 50,
        weight: 0.55,
        setType: '1 piece (Kurti)',
        colors: [
            {
                colorName: 'Navy Blue',
                colorCode: '#000080',
                image: { url: catalogImages.cottonKurti[2] },
                images: [{ url: catalogImages.cottonKurti[2] }],
                stock: 50
            }
        ]
    },

    // ==================== SALWAR SUITS ====================
    {
        productId: 'PROD-PEARL-WHITE-SALWAR',
        name: 'Pearl White Salwar Kameez',
        price: 4999,
        originalPrice: 6499,
        image: catalogImages.salwarSuit[0],
        images: catalogImages.salwarSuit,
        category: 'Salwar Suits',
        sizes: ['S', 'M', 'L', 'XL'],
        description: 'Refined pearl white salwar kameez with light embellishment and polished boutique feel. Perfect for formal gatherings and festive celebrations. Comes with matching dupatta.',
        rating: 4.5,
        reviews: 58,
        newArrival: false,
        isBestseller: false,
        stock: 42,
        weight: 0.85,
        setType: '3 piece set (Kameez, Salwar, Dupatta)',
        colors: [
            {
                colorName: 'Pearl White',
                colorCode: '#FDEEF4',
                image: { url: catalogImages.salwarSuit[0] },
                images: [{ url: catalogImages.salwarSuit[0] }, { url: catalogImages.salwarSuit[1] }],
                stock: 42
            }
        ]
    },
    {
        productId: 'PROD-EMBROIDERED-SALWAR-SUIT',
        name: 'Embroidered Blue Salwar Suit',
        price: 5799,
        originalPrice: 7999,
        image: catalogImages.salwarSuit[1],
        images: catalogImages.salwarSuit,
        category: 'Salwar Suits',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        description: 'Beautiful blue salwar suit with intricate embroidery on neckline and sleeves. Made from   cotton silk blend. Includes matching straight pants and sheer dupatta.',
        rating: 4.7,
        reviews: 73,
        newArrival: true,
        isBestseller: true,
        stock: 38,
        weight: 0.90,
        setType: '3 piece set (Kameez, Salwar, Dupatta)',
        colors: [
            {
                colorName: 'Deep Blue',
                colorCode: '#00008B',
                image: { url: catalogImages.salwarSuit[1] },
                images: [{ url: catalogImages.salwarSuit[1] }, { url: catalogImages.salwarSuit[2] }],
                stock: 38
            }
        ]
    },
    {
        productId: 'PROD-DESIGNER-SALWAR',
        name: 'Designer Silk Salwar Suit',
        price: 8999,
        originalPrice: 11999,
        image: catalogImages.salwarSuit[2],
        images: catalogImages.salwarSuit,
        category: 'Salwar Suits',
        sizes: ['S', 'M', 'L', 'XL'],
        description: '  designer salwar suit in rich silk fabric with traditional patterns and gold detailing. Perfect for weddings and special occasions. Includes heavy dupatta.',
        rating: 4.8,
        reviews: 95,
        newArrival: true,
        isBestseller: true,
        stock: 25,
        weight: 1.0,
        setType: '3 piece set (Kameez, Salwar, Dupatta)',
        colors: [
            {
                colorName: 'Maroon Gold',
                colorCode: '#800000',
                image: { url: catalogImages.salwarSuit[2] },
                images: [{ url: catalogImages.salwarSuit[2] }, { url: catalogImages.salwarSuit[0] }],
                stock: 25
            }
        ]
    },

    // ==================== PARTY WEAR ====================
    {
        productId: 'PROD-PARTY-WEAR-GOWN',
        name: 'Elegant Party Wear Gown',
        price: 7999,
        originalPrice: 10999,
        image: catalogImages.partyWear[0],
        images: catalogImages.partyWear,
        category: 'Party Wear',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        description: 'Sophisticated party wear gown with elegant draping and subtle shimmer. Features intricate embroidery and a flattering silhouette. Perfect for evening events and celebrations.',
        rating: 4.8,
        reviews: 67,
        newArrival: true,
        isBestseller: true,
        stock: 22,
        weight: 1.1,
        setType: '1 piece (Gown)',
        colors: [
            {
                colorName: 'Midnight Black',
                colorCode: '#0C0C0C',
                image: { url: catalogImages.partyWear[0] },
                images: [{ url: catalogImages.partyWear[0] }, { url: catalogImages.partyWear[1] }],
                stock: 22
            }
        ]
    },
    {
        productId: 'PROD-HEAVY-PARTY-SAREE',
        name: 'Heavy Embroidered Party Saree',
        price: 14999,
        originalPrice: 19999,
        image: catalogImages.partyWear[1],
        images: catalogImages.partyWear,
        category: 'Party Wear',
        sizes: ['Free Size'],
        description: 'Stunning party saree with heavy zari and stone embroidery. Perfect for grand celebrations and festive events. Features intricate traditional patterns and luxurious finish.',
        rating: 4.9,
        reviews: 82,
        newArrival: true,
        isBestseller: true,
        stock: 15,
        weight: 1.5,
        setType: 'Saree with Blouse',
        colors: [
            {
                colorName: 'Emerald Green',
                colorCode: '#50C878',
                image: { url: catalogImages.partyWear[1] },
                images: [{ url: catalogImages.partyWear[1] }, { url: catalogImages.partyWear[2] }],
                stock: 15
            }
        ]
    },
    {
        productId: 'PROD-SEQUIN-PARTY-KURTI',
        name: 'Sequin Embellished Party Kurti',
        price: 3999,
        originalPrice: 5499,
        image: catalogImages.partyWear[2],
        images: catalogImages.partyWear,
        category: 'Party Wear',
        sizes: ['S', 'M', 'L', 'XL'],
        description: 'Glamorous party kurti with sequin embellishments and mirror work. Perfect for evening parties and celebrations. Pairs beautifully with palazzo or leggings.',
        rating: 4.7,
        reviews: 45,
        newArrival: true,
        isBestseller: false,
        stock: 28,
        weight: 0.75,
        setType: '2 piece set (Kurti, Dupatta)',
        colors: [
            {
                colorName: 'Gold Shimmer',
                colorCode: '#FFD700',
                image: { url: catalogImages.partyWear[2] },
                images: [{ url: catalogImages.partyWear[2] }, { url: catalogImages.partyWear[0] }],
                stock: 28
            }
        ]
    },

    // ==================== BRIDAL COLLECTIONS ====================
    {
        productId: 'PROD-BRIDAL-RED-SAREE',
        name: 'Bridal Red Banarasi Saree',
        price: 28999,
        originalPrice: 36999,
        image: catalogImages.bridalElegance[0],
        images: catalogImages.bridalElegance,
        category: 'Bridal Collections',
        sizes: ['Free Size'],
        description: 'Majestic bridal saree in traditional red with heavy gold zari and intricate Banarasi weaving. Features a stunning pallu and border. Perfect for weddings and grand celebrations.',
        rating: 5.0,
        reviews: 112,
        newArrival: true,
        isBestseller: true,
        stock: 10,
        weight: 1.8,
        setType: 'Saree with Blouse',
        colors: [
            {
                colorName: 'Royal Bridal Red',
                colorCode: '#8B0000',
                image: { url: catalogImages.bridalElegance[0] },
                images: [{ url: catalogImages.bridalElegance[0] }, { url: catalogImages.bridalElegance[1] }],
                stock: 10
            }
        ]
    },
    {
        productId: 'PROD-BRIDAL-GOLD-LEHENGA',
        name: 'Bridal Gold Silk Lehenga',
        price: 38999,
        originalPrice: 49999,
        image: catalogImages.bridalElegance[1],
        images: catalogImages.bridalElegance,
        category: 'Bridal Collections',
        sizes: ['XS', 'S', 'M', 'L'],
        description: 'Extravagant bridal lehenga in rich gold silk with exquisite stone and pearl embroidery throughout. Features a heavily embellished blouse and an ornate designer dupatta.',
        rating: 5.0,
        reviews: 89,
        newArrival: true,
        isBestseller: true,
        stock: 7,
        weight: 2.5,
        setType: '3 piece set (Lehenga, Choli, Dupatta)',
        colors: [
            {
                colorName: 'Antique Gold',
                colorCode: '#D4AF37',
                image: { url: catalogImages.bridalElegance[1] },
                images: [{ url: catalogImages.bridalElegance[1] }, { url: catalogImages.bridalElegance[2] }],
                stock: 7
            }
        ]
    },
    {
        productId: 'PROD-BRIDAL-PINK-COLLECTION',
        name: 'Bridal Pink Embroidered Lehenga',
        price: 32999,
        originalPrice: 42999,
        image: catalogImages.bridalElegance[2],
        images: catalogImages.bridalElegance,
        category: 'Bridal Collections',
        sizes: ['XS', 'S', 'M', 'L'],
        description: 'Gorgeous bridal lehenga in blush pink with intricate zari and stone embroidery. Features a voluminous skirt with traditional patterns and a luxurious dupatta.',
        rating: 4.9,
        reviews: 76,
        newArrival: true,
        isBestseller: true,
        stock: 9,
        weight: 2.3,
        setType: '3 piece set (Lehenga, Choli, Dupatta)',
        colors: [
            {
                colorName: 'Bridal Pink',
                colorCode: '#FFB6C1',
                image: { url: catalogImages.bridalElegance[2] },
                images: [{ url: catalogImages.bridalElegance[2] }, { url: catalogImages.bridalElegance[0] }],
                stock: 9
            }
        ]
    },
];
*/

const saleModes = [
    {
        saleName: 'Ruby Weekend Sale',
        isActive: true,
        description: 'Limited-time festive markdowns on selected Ruby and Rose Ivory styles.',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
];

const sales = [
    {
        saleId: 'SALE-RUBY-SILK-SAREE',
        name: 'Ruby Banarasi Silk Saree',
        price: 6999,
        originalPrice: 10999,
        discount: 36,
        image: catalogImages.rubySaree[0],
        images: catalogImages.rubySaree,
        category: 'Sarees',
        sizes: ['Free Size'],
        description: 'Weekend special on a ruby silk saree with a luxurious festive finish.',
        reviews: 184,
        stock: 10,
        saleMode: 'Ruby Weekend Sale',
    },
    {
        saleId: 'SALE-PURPLE-GEORGETTE-SAREE',
        name: 'Purple Georgette Saree',
        price: 4999,
        originalPrice: 7999,
        discount: 38,
        image: catalogImages.purpleSaree[0],
        images: catalogImages.purpleSaree,
        category: 'Sarees',
        sizes: ['Free Size'],
        description: 'Special markdown on a lightweight georgette saree for effortless evening style.',
        reviews: 121,
        stock: 14,
        saleMode: 'Ruby Weekend Sale',
    },
    {
        saleId: 'SALE-MAGENTA-SHARARA',
        name: 'Magenta Silk Sharara Set',
        price: 7999,
        originalPrice: 12999,
        discount: 38,
        image: catalogImages.rubySaree[2],
        images: [catalogImages.rubySaree[2], catalogImages.roseLehenga[1], catalogImages.goldSaree[2]],
        category: 'Sharara',
        sizes: ['XS', 'S', 'M', 'L'],
        description: 'Festive sharara set with rich color, embroidery, and comfortable movement.',
        reviews: 92,
        stock: 9,
        saleMode: 'Ruby Weekend Sale',
    },
    {
        saleId: 'SALE-PEARL-SALWAR',
        name: 'Pearl White Salwar Kameez',
        price: 3999,
        originalPrice: 6499,
        discount: 38,
        image: catalogImages.roseLehenga[2],
        images: [catalogImages.roseLehenga[2], catalogImages.goldSaree[0], catalogImages.embroideredSalwar[1]],
        category: 'Salwar Kameez',
        sizes: ['S', 'M', 'L', 'XL'],
        description: 'Soft pearl tones and subtle embellishment at a limited-time sale price.',
        reviews: 58,
        stock: 18,
        saleMode: 'Ruby Weekend Sale',
    },
];

const buildRedisUrl = () => {
    const raw = process.env.REDIS_URL;
    const password = process.env.REDIS_PASSWORD;
    if (!raw) return null;
    if (raw.startsWith('redis://') || raw.startsWith('rediss://')) return raw;
    return password ? `redis://:${password}@${raw}` : `redis://${raw}`;
};

const clearRedisCache = async () => {
    const url = buildRedisUrl();
    if (!url) {
        console.warn('Redis URL missing, skipping cache clear.');
        return;
    }

    let client;
    try {
        client = createClient({
            url,
            socket: {
                connectTimeout: 3000,
                reconnectStrategy: false,
            },
        });
        client.on('error', () => undefined);
        await client.connect();
        await client.flushAll();
        console.log('Cleared Redis cache.');
    } catch (error) {
        console.warn('Redis cache clear skipped:', error.message);
    } finally {
        if (client) await client.quit().catch(() => undefined);
    }
};

const seedDatabase = async () => {
    try {
        console.warn('[⚠️  SEED DISABLED] This seed script is disabled for safety.');
        console.warn('To manually clear all data, set SEED_MODE=clear_all in your environment and re-run.');
        
        if (process.env.SEED_MODE === 'clear_all') {
            if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
                console.error(
                    '[SEED ERROR] Refusing to run destructive clear in production. Set ALLOW_DESTRUCTIVE_SEED=true only on a disposable database.'
                );
                process.exit(1);
            }

            const mongoUri = process.env.MONGODB_URI;
            if (!mongoUri) {
                throw new Error('MONGODB_URI not found in environment variables');
            }

            console.log('🗑️  CLEARING all database collections...');
            await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
            
            await Promise.all([
                Product.deleteMany({}),
                Sale.deleteMany({}),
                SaleMode.deleteMany({}),
                Cart.deleteMany({}),
                Order.deleteMany({}),
            ]);
            console.log('✓ Database cleared successfully.');

            await clearRedisCache();
            await mongoose.disconnect();
            process.exit(0);
        } else {
            console.log('✓ Seed script skipped (disabled by default for safety)');
            process.exit(0);
        }
    } catch (error) {
        console.error('Error in seed script:', error);
        await mongoose.disconnect().catch(() => undefined);
        process.exit(1);
    }
};

seedDatabase();
