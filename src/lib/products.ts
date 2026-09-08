const product1 = 'https://images.unsplash.com/photo-1627662168223-7df99068099a?auto=format&fit=crop&w=900&q=85';
const product2 = 'https://images.unsplash.com/photo-1621939514649-280e2aa55345?auto=format&fit=crop&w=900&q=85';
const product3 = 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=900&q=85';
const product4 = 'https://images.unsplash.com/photo-1589135233689-3a3c8c7f6aa5?auto=format&fit=crop&w=900&q=85';
const product5 = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85';
const product6 = 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=85';

export interface ColorImage {
  _id?: string;
  url: string;
  publicId?: string;
}

export interface ColorVariant {
  colorName: string;
  colorCode?: string;
  image?: ColorImage;
  images?: ColorImage[];
  stock?: number;
}

export interface Product {
  id?: string;
  _id?: string;
  productId?: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category: string;
  sizes: string | string[];
  description: string;
  rating?: number;
  reviews?: number;
  isNew?: boolean;
  newArrival?: boolean;
  isBestseller?: boolean;
  stock?: number;
  sizeCounts?: Record<string, number>;
  sizeReservedCounts?: Record<string, number>;
  ingredients?: string[];
  storageInstructions?: string;
  shelfLife?: string;
  nutrition?: { calories?: number; protein?: number; fat?: number; carbohydrates?: number };
  vegStatus?: 'veg' | 'non_veg';
  spiceLevel?: 'mild' | 'medium' | 'spicy';
  dietaryTags?: string[];
  packQuantity?: string;
  setType?: string;
  colors?: ColorVariant[];
  cloudinaryId?: string;
  cloudinaryIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Hyderabadi Red Khada Dupatta',
    price: 15499,
    originalPrice: 18999,
    image: product1,
    images: [product1, product2, product3],
    category: 'Khada Dupatta',
    sizes: ['Free Size'],
    description: 'Traditional Hyderabadi Red Khada Dupatta set with heavy gold zardozi work. A timeless Nizami bridal outfit featuring a tunic, churidar, and the signature 6-yard draped dupatta.',
    rating: 4.9,
    reviews: 156,
    isNew: true,
  },
  {
    id: '2',
    name: 'Nizami Pink Zardozi Lehenga',
    price: 22999,
    originalPrice: 28999,
    image: product2,
    images: [product2, product1, product5],
    category: 'Lehengas',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description: 'Exquisite pink bridal lehenga handcrafted with authentic Hyderabadi Zardozi and stone work. Features a heavy border and intricate floral motifs inspired by the Chowmahalla Palace.',
    rating: 5.0,
    reviews: 89,
    isBestseller: true,
  },
  {
    id: '3',
    name: 'Royal Blue Velvet Anarkali',
    price: 8299,
    image: product3,
    images: [product3, product5, product6],
    category: 'Anarkali',
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Regal royal blue velvet Anarkali suit with antique gold embroidery. This floor-length ensemble captures the elegance of the Hyderabadi courtly attire.',
    rating: 4.8,
    reviews: 124,
  },
  {
    id: '4',
    name: 'Hyderabadi Gold Tissue Saree',
    price: 12999,
    originalPrice: 15999,
    image: product4,
    images: [product4, product1, product2],
    category: 'Sarees',
    sizes: ['Free Size'],
    description: 'Luxurious authentic Gold Tissue saree, a staple in Hyderabadi weddings. Woven with pure zari, this light yet grand saree exudes sophistication and grace.',
    rating: 4.9,
    reviews: 78,
    isNew: true,
  },
  {
    id: '5',
    name: 'Magenta Silk Sharara Set',
    price: 9799,
    image: product5,
    images: [product5, product2, product3],
    category: 'Sharara',
    sizes: ['XS', 'S', 'M', 'L'],
    description: 'Vibrant magenta silk Sharara set featuring traditional Karchob work. The flared pants and short kurti create a classic Hyderabadi silhouette perfect for festive occasions like Mehendi.',
    rating: 4.7,
    reviews: 92,
    isBestseller: true,
  },
  {
    id: '6',
    name: 'Mint Green Lancha Set',
    price: 6499,
    image: product6,
    images: [product6, product4, product3],
    category: 'Lancha',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    description: 'Elegant mint green Lancha set with delicate embroidery. A lighter, more playful variation of the lehenga, popular in Hyderabadi fashion for sangeets and receptions.',
    rating: 4.6,
    reviews: 145,
  },
  {
    id: '7',
    name: 'Pearl White Hyderabadi Salwar',
    price: 4999,
    image: product4,
    images: [product4, product1, product2],
    category: 'Salwar Kameez',
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'Inspired by the City of Pearls, this Pristine Pearl White Salwar Suit exudes understated elegance. Crafted from sheer organza fabric, the outfit is embellished with intricate pearl and stone work.',
    rating: 4.5,
    reviews: 62,
    isNew: true,
  },
  {
    id: '8',
    name: 'Emerald Green Gharara Set',
    price: 11499,
    image: product6,
    images: [product6, product3, product5],
    category: 'Gharara',
    sizes: ['XS', 'S', 'M', 'L'],
    description: 'Make a bold statement with this Emerald Green Gharara Set, a traditional Hyderabadi favorite. The rich green silk fabric is heavily embroidered with gold Zari and sequins.',
    rating: 4.8,
    reviews: 54,
    isNew: true,
    isBestseller: true,
  },
];

export const categories = [
  'All',
  'Snacks & Namkeen',
  'Pickles & Condiments',
  'Sweets & Bakery',
  'Dairy & Beverages',
  'Mukhvas & Digestives',
  'Confectionery',
  'Spices & Masalas',
  'Dry/Instant Grocery',
];

export const priceRanges = [
  { label: 'Under ₹4,000', min: 0, max: 4000 },
  { label: '₹4,000 - ₹7,000', min: 4000, max: 7000 },
  { label: '₹7,000 - ₹10,000', min: 7000, max: 10000 },
  { label: 'Above ₹10,000', min: 10000, max: Infinity },
];

export const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL', 'Free Size'];
