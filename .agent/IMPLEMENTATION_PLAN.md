# E-Commerce Purchase Workflow Implementation Plan

## Current State Analysis

### ✅ What Exists (Frontend Only)
1. **Product Display** - ProductDetailPage with images, size selection, quantity
2. **Cart Management** - Zustand store for client-side cart state
3. **Checkout UI** - Address form, payment method selection, order confirmation
4. **Environment Variables** - All services configured (.env file)

### ❌ What's Missing (Backend Integration)
1. **No API Server** - No backend/server directory
2. **No Database Integration** - MongoDB not connected
3. **No Firebase Auth** - Authentication not implemented
4. **No Redis Caching** - No caching layer
5. **No Razorpay Integration** - Payment gateway not integrated
6. **No API calls** - Everything is client-side only

## Implementation Architecture

### Tech Stack
```
Frontend (Existing): Vite + React + TypeScript + Zustand
Backend (To Create): Express.js + TypeScript
Database: MongoDB (products, orders, cart, addresses)
Cache: Redis (cart, sessions)
Auth: Firebase Auth
Payment: Razorpay (Test Mode)
Storage: Cloudinary (images)
```

### Folder Structure
```
shewear/
├── src/                    # Frontend (existing)
│   ├── pages/
│   ├── components/
│   ├── lib/
│   └── services/          # NEW: API service layer
│       ├── api.ts
│       ├── auth.ts
│       ├── cart.ts
│       ├── products.ts
│       └── orders.ts
├── server/                 # NEW: Backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── firebase.ts
│   │   ├── models/
│   │   │   ├── Product.ts
│   │   │   ├── Order.ts
│   │   │   ├── Cart.ts
│   │   │   └── Address.ts
│   │   ├── routes/
│   │   │   ├── products.ts
│   │   │   ├── cart.ts
│   │   │   ├── orders.ts
│   │   │   └── payment.ts
│   │   ├── controllers/
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
└── package.json           # Root package with scripts
```

## Implementation Phases

### Phase 1: Backend Setup ✓
- [ ] Create Express.js server with TypeScript
- [ ] Configure MongoDB connection
- [ ] Configure Redis connection
- [ ] Configure Firebase Admin SDK
- [ ] Setup CORS and middleware
- [ ] Create environment variable loader

### Phase 2: Database Models & Schemas ✓
- [ ] Product model (MongoDB)
- [ ] Order model (MongoDB)
- [ ] Cart model (MongoDB)
- [ ] Address model (MongoDB)
- [ ] User model (stores Firebase UID reference)

### Phase 3: Authentication Flow ✓
- [ ] Firebase client SDK integration (frontend)
- [ ] Firebase Admin verification (backend)
- [ ] Auth middleware for protected routes
- [ ] User session management with Redis
- [ ] Login/Signup UI components

### Phase 4: Product Management ✓
- [ ] Migrate static products to MongoDB
- [ ] Product API endpoints (GET /api/products)
- [ ] Single product endpoint (GET /api/products/:id)
- [ ] Cloudinary image URLs in database
- [ ] Frontend service to fetch products from API

### Phase 5: Cart Implementation ✓
- [ ] Cart Redis caching (userId:cart)
- [ ] Cart MongoDB persistence
- [ ] API endpoints:
  - POST /api/cart/add
  - PUT /api/cart/update
  - DELETE /api/cart/remove/:itemId
  - GET /api/cart
  - DELETE /api/cart/clear
- [ ] Sync Zustand store with backend
- [ ] Cart sync on login/logout

### Phase 6: Checkout & Address ✓
- [ ] Address CRUD API endpoints
- [ ] Save user addresses to MongoDB
- [ ] Address selection UI enhancement
- [ ] Policy acknowledgment checkbox
- [ ] Pre-order validation

### Phase 7: Payment Integration (Razorpay) ✓
- [ ] Razorpay SDK setup (frontend & backend)
- [ ] Create order API (POST /api/payment/create-order)
- [ ] Verify payment API (POST /api/payment/verify)
- [ ] Payment modal integration
- [ ] COD order creation
- [ ] Handle payment success/failure/cancellation

### Phase 8: Order Management ✓
- [ ] Create order on payment success
- [ ] Generate unique order ID
- [ ] Store order in MongoDB with:
  - Order items (product, size, quantity)
  - Shipping address
  - Payment method & status
  - Transaction reference
  - Order status (pending, confirmed, shipped, delivered)
- [ ] Clear cart after order completion
- [ ] Order confirmation email (Nodemailer)
- [ ] Order success page with details

### Phase 9: Testing & Optimization ✓
- [ ] Test complete purchase flow
- [ ] Test Redis cache invalidation
- [ ] Test payment flows (success, failure, COD)
- [ ] Error handling & validation
- [ ] Performance optimization

## API Endpoints Summary

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product

### Cart (Protected)
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update item quantity
- `DELETE /api/cart/remove/:itemId` - Remove item
- `DELETE /api/cart/clear` - Clear cart

### Addresses (Protected)
- `GET /api/addresses` - Get user addresses
- `POST /api/addresses` - Add new address
- `PUT /api/addresses/:id` - Update address
- `DELETE /api/addresses/:id` - Delete address

### Orders (Protected)
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details

### Payment (Protected)
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment signature
- `POST /api/payment/cod` - Create COD order

### Auth
- `POST /api/auth/verify-token` - Verify Firebase token
- `GET /api/auth/user` - Get current user

## Environment Variables Required

Already configured in .env:
- ✅ MONGODB_URI
- ✅ REDIS_URL, REDIS_PASSWORD
- ✅ FIREBASE_* credentials
- ✅ RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
- ✅ CLOUDINARY_* credentials
- ✅ EMAIL_* credentials use node mailer to send mails after purchase and order confirmation

## Key Implementation Constraints

1. ✅ **No rewrite** - Extend existing code, don't replace
2. ✅ **Maintain state** - Keep Zustand but sync with backend
3. ✅ **Preserve UI** - No UI changes, only connect to backend
4. ✅ **Error handling** - Proper validation and error messages
5. ✅ **Performance** - Use Redis for frequently accessed data

## Success Criteria

- [ ] User can browse products from MongoDB
- [ ] User can sign up/login with Firebase
- [ ] Cart persists across sessions (MongoDB + Redis)
- [ ] User can add/manage addresses
- [ ] User can checkout and select payment method
- [ ] Razorpay payment works (test mode)
- [ ] COD orders can be placed
- [ ] Orders are saved in MongoDB
- [ ] Order confirmation is displayed
- [ ] Cart is cleared after successful order
- [ ] Email confirmation is sent

## Timeline Estimate
- Phase 1-2: 2-3 hours (Backend setup + Models)
- Phase 3: 1-2 hours (Authentication)
- Phase 4: 1 hour (Products)
- Phase 5: 2 hours (Cart)
- Phase 6: 1 hour (Checkout/Address)
- Phase 7: 2-3 hours (Payment integration)
- Phase 8: 1-2 hours (Orders)
- Phase 9: 1-2 hours (Testing)
**Total: ~12-18 hours**
