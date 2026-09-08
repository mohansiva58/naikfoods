# Naikfoods - E-Commerce Platform

Full-stack e-commerce platform with React + Vite frontend and Express.js + MongoDB backend.

## 🏗️ Architecture

```
Frontend: React + TypeScript + Vite + Zustand
Backend: Express.js + TypeScript + MongoDB + Redis
Auth: Firebase Authentication
Payment: Razorpay (Test Mode)
Email: Nodemailer
Storage: Cloudinary
```

## 📦 Project Structure

```
shewear/
├── src/                    # Frontend React app
│   ├── pages/             # Page components
│   ├── components/        # UI components
│   ├── lib/              # State management (Zustand)
│   └── services/         # API service layer
│       ├── api.ts
│       ├── authService.ts
│       ├── cartService.ts
│       ├── productService.ts
│       ├── orderService.ts
│       └── paymentService.ts
├── server/                # Backend Express server
│   └── src/
│       ├── config/       # Database & service configs
│       ├── models/       # MongoDB models
│       ├── controllers/  # Route controllers
│       ├── routes/       # API routes
│       ├── middleware/   # Auth & error middleware
│       ├── utils/        # Helper functions
│       ├── server.ts     # Main server file
│       └── seed.ts       # Database seeding script
└── .env                  # Environment variables
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Redis Cloud account (or local Redis)
- Firebase project
- Razorpay account (test mode)

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Environment Setup

All environment variables are in the root `.env` file:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Redis
REDIS_URL=your_redis_host:port
REDIS_PASSWORD=your_redis_password

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# ... (other Firebase config)

# Razorpay
RAZORPAY_KEY_ID=your_test_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_test_key_id

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### 3. Seed Database

```bash
cd server
npx tsx src/seed.ts
cd ..
```

### 4. Run Development Servers

**Option 1: Run Both (Recommended)**
```bash
npm run dev:all
```

**Option 2: Run Separately**
```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev
```

## 📡 API Endpoints

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:id` - Get single product

### Cart (Protected)
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update item quantity
- `DELETE /api/cart/remove/:productId/:size` - Remove item
- `DELETE /api/cart/clear` - Clear cart

### Orders (Protected)
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:orderId` - Get order details
- `POST /api/orders/:orderId/cancel` - Cancel order

### Payment (Protected)
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment signature

### Users (Protected)
- `GET /api/users/me` - Get current user
- `POST /api/users/addresses` - Add address
- `PUT /api/users/addresses/:id` - Update address
- `DELETE /api/users/addresses/:id` - Delete address

## 🔐 Authentication Flow

1. User signs up/signs in with Firebase (Email or Google)
2. Firebase returns ID token
3. Frontend stores token in localStorage
4. Token sent with every API request in `Authorization` header
5. Backend verifies token with Firebase Admin SDK
6. User data stored/retrieved from MongoDB

## 💳 Payment Flow

### Razorpay (Online Payment)
1. User submits order
2. Backend creates Razorpay order → returns order ID
3. Frontend opens Razorpay checkout
4. User completes payment
5. Razorpay returns payment details
6. Frontend sends to backend for verification
7. Backend verifies signature
8. Order created, cart cleared, email sent

### Cash on Delivery (COD)
1. User selects COD at checkout
2. Order created directly with `paymentStatus: 'cod'`
3. Cart cleared, email sent

## 📧 Email Notifications

After successful order:
- Professional HTML email sent to customer
- Contains order details, items, shipping address
- Includes order ID and estimated delivery
- **No Return/No Exchange** policy displayed

## 🗄️ Caching Strategy

- **Redis**: Cart data, frequently accessed products
- **MongoDB**: Persistent storage for all data
- **TTL**: Cart cache expires after 30 minutes

## 🔒 Security Features

- Helmet.js for security headers
- Rate limiting (100 req/15min per IP)
- CORS protection
- Firebase token verification
- Razorpay signature verification
- Input validation with Joi (ready to implement)

## 📱 Policies

- ⚠️ **No Returns**
- ⚠️ **No Exchanges**
- ✅ Free shipping on orders > ₹2000
- ✅ Cash on Delivery available

## 🛠️ Production Deployment

### Backend (Recommended: Railway, Render, or Heroku)

```bash
cd server
npm run build
npm start
```

Set environment variables on hosting platform.

### Frontend (Vercel - Already Configured)

`vercel.json` is already set up. Deploy with:

```bash
vercel --prod
```

Update `VITE_API_URL` in frontend to point to production backend.
If your socket backend is on a different host, also set `VITE_SOCKET_URL`.
Otherwise the app derives the Socket.IO URL from `VITE_API_URL`.

## 📊 Database Models

- **Product**: Product catalog with images, prices, variants
- **User**: Firebase UID + addresses
- **Cart**: User cart with items (TTL: 30 days)
- **Order**: Order history with payment & shipping info

## 🧪 Testing Payment

Use Razorpay test cards:
- **Card**: 4111 1111 1111 1111
- **CVV**: Any 3 digits
- **Expiry**: Any future date

## 📞 Support

For issues or questions, check logs:
- Frontend: Browser console
- Backend: Terminal running server

## 🎯 Key Features Implemented

✅ Product browsing with filtering & sorting  
✅ Firebase authentication (Email + Google)  
✅ Cart with Redis caching + MongoDB persistence  
✅ Address management  
✅ Razorpay payment integration  
✅ Cash on Delivery  
✅ Order management  
✅ Email confirmations  
✅ Policy acknowledgment  
✅ Production-ready error handling  
✅ Rate limiting & security  

## 📝 License

Private - Naikfoods © 2026
