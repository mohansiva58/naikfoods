const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const productSchema = new mongoose.Schema(
    {
        productId: { type: String, required: true, unique: true, index: true },
        slug: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 1 },
        originalPrice: { type: Number, min: 1 },
        image: { type: String, required: true },
        images: { type: [String], default: [] },
        category: { type: String, required: true, index: true },
        sizes: { type: [String], required: true },
        description: { type: String, required: true },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        reviews: { type: Number, default: 0, min: 0 },
        newArrival: { type: Boolean, default: false },
        isBestseller: { type: Boolean, default: false },
        stock: { type: Number, default: 0, min: 0 },
        ingredients: { type: [String], default: [] },
        storageInstructions: String,
        shelfLife: String,
        nutrition: {
            calories: { type: Number, min: 0 },
            protein: { type: Number, min: 0 },
            fat: { type: Number, min: 0 },
            carbohydrates: { type: Number, min: 0 },
        },
        vegStatus: { type: String, enum: ['veg', 'non_veg'], required: true },
        spiceLevel: { type: String, enum: ['mild', 'medium', 'spicy'] },
        dietaryTags: { type: [String], default: [] },
        packQuantity: String,
    },
    { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', category: 'text', ingredients: 'text', dietaryTags: 'text' });

const couponSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true, uppercase: true, trim: true },
        discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
        discountValue: { type: Number, required: true, min: 0 },
        isActive: { type: Boolean, default: true },
        expiryDate: Date,
        minOrderAmount: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

const image = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=85`;

const products = [
    {
        productId: 'NF-CHAKLI-250G', name: 'Aaji\'s Bhajani Chakli', category: 'Snacks & Namkeen', price: 249, originalPrice: 299,
        image: image('photo-1627662168223-7df99068099a'), sizes: ['250g', '500g'], packQuantity: '250g',
        description: 'Crisp, spiral chakli made with our roasted bhajani flour blend and a warm Maharashtrian spice mix.',
        ingredients: ['Rice flour', 'Chickpea flour', 'Urad dal', 'Sesame', 'Chilli', 'Cumin'], storageInstructions: 'Store in an airtight container in a cool, dry place.', shelfLife: 'Best before 45 days', vegStatus: 'veg', spiceLevel: 'medium', dietaryTags: ['Vegetarian'], stock: 80, isBestseller: true, newArrival: true,
    },
    {
        productId: 'NF-BHAKARWADI-200G', name: 'Kolhapuri Bhakarwadi', category: 'Snacks & Namkeen', price: 199, originalPrice: 229,
        image: image('photo-1621939514649-280e2aa55345'), sizes: ['200g', '400g'], packQuantity: '200g',
        description: 'Flaky, rolled pastry filled with coconut, sesame and a bold sweet-spicy masala.',
        ingredients: ['Refined flour', 'Coconut', 'Sesame', 'Poppy seeds', 'Tamarind', 'Spices'], storageInstructions: 'Keep sealed away from moisture.', shelfLife: 'Best before 30 days', vegStatus: 'veg', spiceLevel: 'spicy', dietaryTags: ['Vegetarian'], stock: 65, isBestseller: true,
    },
    {
        productId: 'NF-GARLIC-CHUTNEY-150G', name: 'Thecha Garlic Chutney', category: 'Pickles & Condiments', price: 179, originalPrice: 209,
        image: image('photo-1596040033229-a9821ebd058d'), sizes: ['150g', '300g'], packQuantity: '150g',
        description: 'Fiery roasted garlic and peanut chutney inspired by the traditional Maharashtrian thecha.',
        ingredients: ['Garlic', 'Peanuts', 'Dry coconut', 'Red chilli', 'Salt'], storageInstructions: 'Refrigerate after opening and use a dry spoon.', shelfLife: 'Best before 90 days', vegStatus: 'veg', spiceLevel: 'spicy', dietaryTags: ['Vegan', 'Gluten-Free'], stock: 45, newArrival: true,
    },
    {
        productId: 'NF-MANGO-PICKLE-400G', name: 'Raw Mango Loncha', category: 'Pickles & Condiments', price: 289, originalPrice: 329,
        image: image('photo-1589135233689-3a3c8c7f6aa5'), sizes: ['400g', '800g'], packQuantity: '400g',
        description: 'Tangy raw mango pickle matured with mustard, fenugreek and cold-pressed oil.',
        ingredients: ['Raw mango', 'Mustard', 'Fenugreek', 'Red chilli', 'Groundnut oil', 'Salt'], storageInstructions: 'Refrigerate after opening and keep the mangoes covered in oil.', shelfLife: 'Best before 6 months', vegStatus: 'veg', spiceLevel: 'medium', dietaryTags: ['Vegan', 'Gluten-Free'], stock: 52, isBestseller: true,
    },
    {
        productId: 'NF-PURAN-POLI-4PC', name: 'Puran Poli', category: 'Sweets & Bakery', price: 299, originalPrice: 349,
        image: image('photo-1601050690597-df0568f70950'), sizes: ['4 pieces', '8 pieces'], packQuantity: '4 pieces',
        description: 'Soft festive flatbreads filled with slow-cooked chana dal, jaggery, cardamom and nutmeg.',
        ingredients: ['Chana dal', 'Jaggery', 'Wheat flour', 'Cardamom', 'Nutmeg', 'Ghee'], storageInstructions: 'Refrigerate and warm gently before serving.', shelfLife: 'Best before 5 days', vegStatus: 'veg', spiceLevel: 'mild', dietaryTags: ['Vegetarian'], stock: 24, newArrival: true,
    },
    {
        productId: 'NF-KOKUM-SHERBET-750ML', name: 'Konkan Kokum Sherbet', category: 'Dairy & Beverages', price: 249, originalPrice: 279,
        image: image('photo-1544145945-f90425340c7e'), sizes: ['750ml'], packQuantity: '750ml',
        description: 'A refreshing coastal cooler made from sun-dried kokum, jaggery and roasted cumin.',
        ingredients: ['Kokum', 'Jaggery', 'Cumin', 'Black salt'], storageInstructions: 'Refrigerate after opening. Shake well before serving.', shelfLife: 'Best before 6 months', vegStatus: 'veg', spiceLevel: 'mild', dietaryTags: ['Vegan', 'Gluten-Free'], stock: 38,
    },
    {
        productId: 'NF-SOLAPURI-CHUTNEY-200G', name: 'Solapuri Peanut Chutney', category: 'Mukhvas & Digestives', price: 159, originalPrice: 189,
        image: image('photo-1601050690117-94f5f6fa8bd7'), sizes: ['200g', '400g'], packQuantity: '200g',
        description: 'Roasted peanut, garlic and chilli powder that brings a rustic Solapur kick to bhakri and rice.',
        ingredients: ['Peanuts', 'Garlic', 'Dry coconut', 'Chilli', 'Cumin', 'Salt'], storageInstructions: 'Store airtight in a cool, dry place.', shelfLife: 'Best before 60 days', vegStatus: 'veg', spiceLevel: 'spicy', dietaryTags: ['Vegan', 'Gluten-Free'], stock: 70,
    },
    {
        productId: 'NF-GOD-MASALA-100G', name: 'Goda Masala', category: 'Spices & Masalas', price: 149, originalPrice: 169,
        image: image('photo-1596040033229-a9821ebd058d'), sizes: ['100g', '250g'], packQuantity: '100g',
        description: 'A fragrant, balanced goda masala blended in small batches for amti, usal and bharli vangi.',
        ingredients: ['Coriander', 'Cumin', 'Dry coconut', 'Sesame', 'Cinnamon', 'Stone flower'], storageInstructions: 'Store airtight away from sunlight and moisture.', shelfLife: 'Best before 9 months', vegStatus: 'veg', spiceLevel: 'medium', dietaryTags: ['Vegan', 'Gluten-Free'], stock: 90, isBestseller: true,
    },
    {
        productId: 'NF-MILLET-MIX-500G', name: 'Thalipeeth Bhajani Mix', category: 'Dry/Instant Grocery', price: 229, originalPrice: 259,
        image: image('photo-1601050690117-94f5f6fa8bd7'), sizes: ['500g', '1kg'], packQuantity: '500g',
        description: 'A ready-to-cook blend of roasted grains and lentils for crisp, nourishing thalipeeth at home.',
        ingredients: ['Jowar', 'Bajra', 'Rice', 'Chickpea', 'Urad dal', 'Coriander'], storageInstructions: 'Keep sealed in a cool, dry place.', shelfLife: 'Best before 6 months', vegStatus: 'veg', spiceLevel: 'mild', dietaryTags: ['Vegan', 'Gluten-Free'], stock: 76,
    },
    {
        productId: 'NF-CHIVDA-250G', name: 'Poha Chivda', category: 'Snacks & Namkeen', price: 169, originalPrice: 199,
        image: image('photo-1627662168223-7df99068099a'), sizes: ['250g', '500g'], packQuantity: '250g',
        description: 'Light, crunchy poha tossed with peanuts, curry leaves and a gentle Maharashtrian masala.',
        ingredients: ['Flattened rice', 'Peanuts', 'Curry leaves', 'Mustard', 'Turmeric', 'Salt'], storageInstructions: 'Store airtight after opening.', shelfLife: 'Best before 45 days', vegStatus: 'veg', spiceLevel: 'mild', dietaryTags: ['Vegan', 'Gluten-Free'], stock: 88,
    },
    {
        productId: 'NF-LIMBU-PICKLE-400G', name: 'Limbu Loncha', category: 'Pickles & Condiments', price: 239, originalPrice: 269,
        image: image('photo-1589135233689-3a3c8c7f6aa5'), sizes: ['400g', '800g'], packQuantity: '400g',
        description: 'Sun-matured lemon pickle with mustard, chilli and a bright, tangy finish.',
        ingredients: ['Lemon', 'Mustard', 'Red chilli', 'Fenugreek', 'Groundnut oil', 'Salt'], storageInstructions: 'Refrigerate after opening and use a dry spoon.', shelfLife: 'Best before 6 months', vegStatus: 'veg', spiceLevel: 'spicy', dietaryTags: ['Vegan', 'Gluten-Free'], stock: 47,
    },
    {
        productId: 'NF-BESAN-LADOO-6PC', name: 'Besan Ladoo', category: 'Sweets & Bakery', price: 329, originalPrice: 379,
        image: image('photo-1601050690597-df0568f70950'), sizes: ['6 pieces', '12 pieces'], packQuantity: '6 pieces',
        description: 'Melt-in-the-mouth gram flour ladoos roasted slowly with ghee, cardamom and a touch of jaggery.',
        ingredients: ['Gram flour', 'Ghee', 'Jaggery', 'Cardamom', 'Almonds'], storageInstructions: 'Store cool and dry. Refrigerate in warm weather.', shelfLife: 'Best before 20 days', vegStatus: 'veg', spiceLevel: 'mild', dietaryTags: ['Vegetarian'], stock: 32,
    },
    {
        productId: 'NF-TAK-750ML', name: 'Jeera Tak', category: 'Dairy & Beverages', price: 149, originalPrice: 169,
        image: image('photo-1544145945-f90425340c7e'), sizes: ['750ml'], packQuantity: '750ml',
        description: 'Cooling spiced buttermilk with roasted cumin, coriander and a soft hint of ginger.',
        ingredients: ['Cultured buttermilk', 'Cumin', 'Coriander', 'Ginger', 'Black salt'], storageInstructions: 'Keep refrigerated and consume within 2 days of opening.', shelfLife: 'Best before 15 days', vegStatus: 'veg', spiceLevel: 'mild', dietaryTags: ['Vegetarian', 'Gluten-Free'], stock: 28, newArrival: true,
    },
    {
        productId: 'NF-SAUNF-MUKHVAS-150G', name: 'Roasted Saunf Mukhvas', category: 'Mukhvas & Digestives', price: 129, originalPrice: 149,
        image: image('photo-1601050690117-94f5f6fa8bd7'), sizes: ['150g', '300g'], packQuantity: '150g',
        description: 'A clean, aromatic after-meal blend of roasted fennel, sesame and tiny sugar pearls.',
        ingredients: ['Fennel', 'Sesame', 'Sugar pearls', 'Dry coconut'], storageInstructions: 'Store airtight away from sunlight.', shelfLife: 'Best before 6 months', vegStatus: 'veg', spiceLevel: 'mild', dietaryTags: ['Vegetarian', 'Gluten-Free'], stock: 60,
    },
    {
        productId: 'NF-JAGGERY-PEANUT-200G', name: 'Peanut Jaggery Chikki', category: 'Confectionery', price: 189, originalPrice: 219,
        image: image('photo-1575377427642-087cf684f29d'), sizes: ['200g', '400g'], packQuantity: '200g',
        description: 'Traditional crisp chikki made with roasted peanuts and slow-cooked Kolhapuri jaggery.',
        ingredients: ['Peanuts', 'Jaggery', 'Cardamom'], storageInstructions: 'Keep sealed in a cool, dry place.', shelfLife: 'Best before 90 days', vegStatus: 'veg', spiceLevel: 'mild', dietaryTags: ['Vegan', 'Gluten-Free'], stock: 72, isBestseller: true,
    },
    {
        productId: 'NF-GARAM-MASALA-100G', name: 'Kolhapuri Masala', category: 'Spices & Masalas', price: 159, originalPrice: 179,
        image: image('photo-1596040033229-a9821ebd058d'), sizes: ['100g', '250g'], packQuantity: '100g',
        description: 'A robust red masala blend for misal, usal and curries, with deep roasted notes.',
        ingredients: ['Coriander', 'Dry coconut', 'Red chilli', 'Cumin', 'Black pepper', 'Clove'], storageInstructions: 'Store airtight away from heat and moisture.', shelfLife: 'Best before 9 months', vegStatus: 'veg', spiceLevel: 'spicy', dietaryTags: ['Vegan', 'Gluten-Free'], stock: 84,
    },
];

for (const product of products) {
    product.slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function seed() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI is not defined in server/.env');

    await mongoose.connect(mongoUri);
    for (const product of products) {
        await Product.updateOne({ productId: product.productId }, { $set: product }, { upsert: true, runValidators: true });
    }
    await Coupon.updateOne(
        { code: 'NAIK10' },
        { $set: { code: 'NAIK10', discountType: 'percentage', discountValue: 10, minOrderAmount: 499, isActive: true } },
        { upsert: true, runValidators: true }
    );
    console.log(`Seeded ${products.length} Naik Foods products and coupon NAIK10`);
}

seed()
    .catch((error) => {
        console.error('Sample data seed failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
