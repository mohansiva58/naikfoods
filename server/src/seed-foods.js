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

const saleSchema = new mongoose.Schema(
    {
        saleId: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        originalPrice: { type: Number, min: 0 },
        image: { type: String, required: true },
        images: [{ type: String }],
        category: { type: String, required: true, index: true },
        sizes: { type: [String], required: true },
        description: { type: String, required: true },
        rating: { type: Number, default: 0 },
        reviews: { type: Number, default: 0 },
        stock: { type: Number, default: 0, min: 0 },
        discount: { type: Number, min: 0, max: 100 },
        saleMode: { type: String, required: true, index: true },
    },
    { timestamps: true }
);

const saleModeSchema = new mongoose.Schema(
    {
        saleName: { type: String, required: true, unique: true, trim: true, index: true },
        isActive: { type: Boolean, default: false, index: true },
        description: String,
        startDate: Date,
        endDate: Date,
    },
    { timestamps: true }
);

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
const Sale = mongoose.models.Sale || mongoose.model('Sale', saleSchema);
const SaleMode = mongoose.models.SaleMode || mongoose.model('SaleMode', saleModeSchema);
const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

const imageUrls = [
    'https://images.unsplash.com/photo-1627662168223-7df99068099a?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1621939514649-280e2aa55345?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1589135233689-3a3c8c7f6aa5?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=85',
];

const categoryDefinitions = [
    {
        name: 'Snacks & Namkeen',
        pack: ['250g', '500g'],
        shelfLife: 'Best before 45 days',
        ingredients: ['Rice flour', 'Chickpea flour', 'Sesame', 'Cumin', 'Chilli'],
        products: ['Aaji\'s Bhajani Chakli', 'Poha Chivda', 'Kolhapuri Bhakarwadi', 'Masala Shankarpali', 'Roasted Garlic Sev'],
        descriptions: ['Crisp, spiral chakli made with roasted bhajani flour and a warm Maharashtrian spice mix.', 'Light, crunchy poha tossed with peanuts, curry leaves and a gentle house masala.', 'Flaky, rolled pastry filled with coconut, sesame and a bold sweet-spicy masala.', 'Golden, bite-sized shankarpali with a delicate savoury crunch for tea-time snacking.', 'Thin, crisp sev roasted with garlic and mild chilli for a deeply savoury finish.'],
    },
    {
        name: 'Pickles & Condiments',
        pack: ['250g', '400g'],
        shelfLife: 'Best before 6 months',
        ingredients: ['Raw mango', 'Mustard', 'Fenugreek', 'Red chilli', 'Groundnut oil'],
        products: ['Raw Mango Loncha', 'Limbu Loncha', 'Thecha Garlic Chutney', 'Green Chilli Thecha', 'Amla Sweet Pickle'],
        descriptions: ['Tangy raw mango pickle matured with mustard, fenugreek and cold-pressed oil.', 'Sun-matured lemon pickle with mustard, chilli and a bright, tangy finish.', 'Fiery roasted garlic and peanut chutney inspired by traditional Maharashtrian thecha.', 'Fresh green chillies pounded with peanuts, garlic and spices for a rustic accompaniment.', 'Tender amla preserved with jaggery and warming spices for a sweet-tart pickle.'],
    },
    {
        name: 'Sweets & Bakery',
        pack: ['4 pieces', '6 pieces'],
        shelfLife: 'Best before 15 days',
        ingredients: ['Chana dal', 'Jaggery', 'Wheat flour', 'Cardamom', 'Ghee'],
        products: ['Puran Poli', 'Besan Ladoo', 'Coconut Anarsa', 'Jaggery Modak', 'Karanji Bites'],
        descriptions: ['Soft festive flatbreads filled with slow-cooked chana dal, jaggery, cardamom and nutmeg.', 'Melt-in-the-mouth gram flour ladoos roasted slowly with ghee and cardamom.', 'Traditional rice and jaggery anarsa with a crisp edge and soft coconut centre.', 'Hand-shaped modaks made with coconut, jaggery and fragrant cardamom.', 'Crisp pastry bites filled with coconut, poppy seeds and a lightly spiced jaggery mixture.'],
    },
    {
        name: 'Dairy & Beverages',
        pack: ['750ml', '1 litre'],
        shelfLife: 'Best before 15 days',
        ingredients: ['Kokum', 'Jaggery', 'Cumin', 'Black salt', 'Ginger'],
        products: ['Konkan Kokum Sherbet', 'Jeera Tak', 'Aam Panna Concentrate', 'Sol Kadhi Mix', 'Masala Chaas'],
        descriptions: ['A refreshing coastal cooler made from sun-dried kokum, jaggery and roasted cumin.', 'Cooling spiced buttermilk with roasted cumin, coriander and a soft hint of ginger.', 'Raw mango and jaggery concentrate with roasted cumin for a refreshing summer drink.', 'A coastal coconut and kokum blend that makes a bright, lightly spiced sol kadhi.', 'Creamy cultured buttermilk blended with coriander, ginger and a gentle masala.'],
    },
    {
        name: 'Mukhvas & Digestives',
        pack: ['150g', '200g'],
        shelfLife: 'Best before 6 months',
        ingredients: ['Fennel', 'Sesame', 'Dry coconut', 'Sugar pearls', 'Cardamom'],
        products: ['Roasted Saunf Mukhvas', 'Coconut Rose Mukhvas', 'Til Khus Digestive', 'Ajwain Digestive Mix', 'Paan Mukhvas'],
        descriptions: ['A clean, aromatic after-meal blend of roasted fennel, sesame and tiny sugar pearls.', 'A fragrant blend of coconut, rose petals and fennel with a delicate natural sweetness.', 'Roasted sesame and vetiver seeds blended into a fresh, cooling digestive.', 'Carom seeds, fennel and dry ginger balanced for a warm and comforting finish.', 'A colourful paan-inspired blend of fennel, coconut, rose and cardamom.'],
    },
    {
        name: 'Confectionery',
        pack: ['200g', '400g'],
        shelfLife: 'Best before 90 days',
        ingredients: ['Peanuts', 'Jaggery', 'Cardamom', 'Coconut', 'Sesame'],
        products: ['Peanut Jaggery Chikki', 'Tilgul Ladoo', 'Dry Fruit Chikki', 'Coconut Jaggery Fudge', 'Sesame Crunch Bites'],
        descriptions: ['Traditional crisp chikki made with roasted peanuts and slow-cooked Kolhapuri jaggery.', 'Soft sesame and jaggery ladoos shared during festive celebrations and family gatherings.', 'Almond, cashew and peanut brittle bound with fragrant cane jaggery.', 'Chewy coconut fudge made with fresh coconut, jaggery and cardamom.', 'Thin, crunchy sesame bites with a clean jaggery sweetness and roasted finish.'],
    },
    {
        name: 'Spices & Masalas',
        pack: ['100g', '250g'],
        shelfLife: 'Best before 9 months',
        ingredients: ['Coriander', 'Cumin', 'Dry coconut', 'Sesame', 'Cinnamon'],
        products: ['Goda Masala', 'Kolhapuri Masala', 'Kanda Lasun Masala', 'Kala Masala', 'Bharli Vangi Masala'],
        descriptions: ['A fragrant, balanced goda masala blended in small batches for amti, usal and bharli vangi.', 'A robust red masala blend for misal, usal and curries, with deep roasted notes.', 'A roasted onion and garlic masala that gives everyday curries a rich regional depth.', 'A dark, aromatic Maharashtrian spice blend for gravies, rice and slow-cooked vegetables.', 'A balanced nutty masala designed for stuffed brinjals, vegetables and festive meals.'],
    },
    {
        name: 'Dry/Instant Grocery',
        pack: ['500g', '1kg'],
        shelfLife: 'Best before 6 months',
        ingredients: ['Jowar', 'Bajra', 'Rice', 'Chickpea', 'Urad dal'],
        products: ['Thalipeeth Bhajani Mix', 'Sabudana Khichdi Mix', 'Misal Usal Mix', 'Instant Bhakri Flour', 'Moong Dal Dosa Mix'],
        descriptions: ['A ready-to-cook blend of roasted grains and lentils for crisp, nourishing thalipeeth.', 'A measured blend of sabudana, peanuts and spices for quick festive khichdi.', 'A homestyle sprouted lentil and spice mix for a hearty bowl of misal.', 'Stone-ground jowar and bajra flour blended for soft, rustic bhakri at home.', 'A protein-rich moong and rice blend for light, crisp dosas with minimal preparation.'],
    },
];

const products = categoryDefinitions.flatMap((category, categoryIndex) => category.products.map((name, productIndex) => {
    const price = 149 + categoryIndex * 18 + productIndex * 25;
    const originalPrice = price + 30 + (productIndex % 3) * 20;
    const image = imageUrls[(categoryIndex * 5 + productIndex) % imageUrls.length];
    const productId = `NF-${categoryIndex + 1}${productIndex + 1}-${name.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`;
    return {
        productId,
        slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${categoryIndex + 1}-${productIndex + 1}`,
        name,
        category: category.name,
        price,
        originalPrice,
        image,
        images: [image, imageUrls[(categoryIndex + productIndex + 1) % imageUrls.length]],
        sizes: category.pack,
        packQuantity: category.pack[0],
        description: category.descriptions[productIndex],
        ingredients: category.ingredients,
        storageInstructions: 'Store in a cool, dry place. Refrigerate after opening when applicable and use a clean, dry spoon.',
        shelfLife: category.shelfLife,
        nutrition: { calories: 180 + productIndex * 22, protein: 4 + productIndex, fat: 6 + productIndex, carbohydrates: 24 + productIndex * 2 },
        vegStatus: 'veg',
        spiceLevel: productIndex % 3 === 0 ? 'mild' : productIndex % 3 === 1 ? 'medium' : 'spicy',
        dietaryTags: ['Vegetarian'],
        rating: Number((4.4 + ((categoryIndex + productIndex) % 6) / 10).toFixed(1)),
        reviews: 18 + categoryIndex * 9 + productIndex * 7,
        stock: 24 + categoryIndex * 8 + productIndex * 5,
        newArrival: productIndex < 2,
        isBestseller: productIndex === 0 || productIndex === 4,
    };
}));

const sales = products.filter((product) => product.isBestseller).map((product, index) => ({
    saleId: `SALE-${product.productId}`,
    name: product.name,
    price: Math.round(product.price * 0.85),
    originalPrice: product.price,
    image: product.image,
    images: product.images,
    category: product.category,
    sizes: product.sizes,
    description: product.description,
    rating: product.rating,
    reviews: product.reviews,
    stock: product.stock,
    discount: 15,
    saleMode: 'Naik Foods Festive Savings',
    index,
}));

async function seed() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI is not defined in server/.env');

    await mongoose.connect(mongoUri);
    await Promise.all(products.map((product) => Product.updateOne({ productId: product.productId }, { $set: product }, { upsert: true, runValidators: true })));
    await Promise.all(sales.map(({ index, ...sale }) => Sale.updateOne({ saleId: sale.saleId }, { $set: sale }, { upsert: true, runValidators: true })));
    await SaleMode.updateOne(
        { saleName: 'Naik Foods Festive Savings' },
        { $set: { saleName: 'Naik Foods Festive Savings', isActive: true, description: 'Save 15% on regional favourites, packed fresh from our kitchen.', startDate: new Date(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
        { upsert: true, runValidators: true }
    );
    await Coupon.updateOne(
        { code: 'NAIK10' },
        { $set: { code: 'NAIK10', discountType: 'percentage', discountValue: 10, minOrderAmount: 499, isActive: true } },
        { upsert: true, runValidators: true }
    );

    const categoryCounts = categoryDefinitions.map((category) => `${category.name}: 5`).join(' | ');
    console.log(`Seeded ${products.length} products (${categoryCounts}), ${sales.length} sale items, active sale mode, and coupon NAIK10.`);
}

seed()
    .catch((error) => {
        console.error('Naik Foods seed failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
