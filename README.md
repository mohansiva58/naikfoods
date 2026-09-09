# Naik Foods

Naik Foods is a full-stack food commerce platform prototype for demonstrating the end-to-end functionality of a regional food storefront. The application combines a responsive React storefront with an Express and MongoDB API, Firebase authentication, inventory reservations, Razorpay payments, email notifications, and an admin catalog workflow.

The product records included in this repository are fictional sample data created for development, testing, portfolio demonstrations, and feature validation. They are not actual Naik Foods products, live inventory, or production catalog content.

The project is designed around a simple customer journey:

1. Discover regional products through categories, new arrivals, bestsellers, and sales.
2. Inspect product details, ingredients, nutrition, dietary information, pack sizes, and stock.
3. Add products to a persistent cart and reserve inventory during checkout.
4. Pay online with Razorpay or choose Cash on Delivery.
5. Receive order confirmation and track order history.

## Highlights

- Sample regional food catalog with eight demonstration categories.
- Category browsing, search, price filters, sorting, and product detail pages.
- New arrivals, bestseller/on-sale collections, sale modes, and discount coupons.
- Product metadata including ingredients, nutrition, spice level, dietary tags, shelf life, and storage instructions.
- Firebase email and Google authentication.
- Persistent user carts with MongoDB and Redis caching.
- Inventory availability checks and temporary stock reservations.
- Razorpay online payments with signature and webhook verification.
- Cash on Delivery checkout.
- Address management and authenticated order history.
- Transactional HTML email notifications through Nodemailer.
- Admin dashboard for products, sales, coupons, orders, users, and low-stock monitoring.
- Cloudinary image upload support for catalog management.
- Real-time stock updates through Socket.IO.
- Responsive UI built with Tailwind CSS, Radix UI, Lucide icons, and Framer Motion.
- Security middleware including Helmet, CORS, compression, request logging, and rate limiting.

## Technology Stack

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Radix UI primitives
- Framer Motion
- Axios
- Vitest and Testing Library

### Backend

- Node.js
- Express
- TypeScript
- MongoDB with Mongoose
- Redis
- Firebase Admin SDK
- Razorpay
- Nodemailer
- Cloudinary
- Socket.IO

## Repository Structure

```text
.
├── src/                       # React frontend
│   ├── components/            # Storefront, admin, and reusable UI components
│   ├── contexts/              # Authentication context
│   ├── hooks/                 # Auth, socket, stock, and checkout hooks
│   ├── lib/                   # Client models, cart, wishlist, SEO, and utilities
│   ├── pages/                 # Home, shop, checkout, orders, admin, and policy pages
│   └── services/              # Frontend API service modules
├── server/
│   └── src/
│       ├── config/             # Database and third-party service setup
│       ├── controllers/        # Request handlers and business flows
│       ├── middleware/         # Authentication, authorization, uploads, and errors
│       ├── models/             # Mongoose models
│       ├── routes/             # REST API route definitions
│       ├── services/           # Inventory and reservation services
│       ├── seed-foods.js       # Food catalog and sales seed script
│       └── server.ts           # Express and Socket.IO entry point
├── public/                    # Static assets and SEO files
├── package.json               # Frontend scripts and workspace commands
├── render.yaml                # Render backend deployment configuration
└── vercel.json                # Vercel frontend configuration
```

## Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- MongoDB Atlas or a local MongoDB instance
- Redis Cloud or a local Redis instance
- Firebase project with Authentication enabled
- Razorpay account for payment integration
- SMTP provider, such as Gmail with an app password, for order emails
- Cloudinary account for admin image uploads

## Installation

Clone the repository and install both application layers:

```bash
git clone <repository-url>
cd naikfoods
npm install
npm --prefix server install
```

Create environment files before starting the application. The backend loads `server/.env` and can also read shared defaults from the root `.env`. Never commit real credentials.

### Frontend environment

Create a root `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=

# Optional Instagram profile CTA
VITE_INSTAGRAM_PROFILE_URL=
```

`VITE_API_URL` may include or omit `/api`; the frontend normalizes it automatically.

### Backend environment

Create `server/.env`:

```env
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb://127.0.0.1:27017/naikfoods
REDIS_URL=redis://127.0.0.1:6379
REDIS_PASSWORD=

FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
ADMIN_EMAILS=admin@example.com

# Firebase Admin SDK option 1: one-line service account JSON
FIREBASE_ADMIN_SDK={"type":"service_account","project_id":"your-project-id"}

# Firebase Admin SDK option 2: individual credentials
FIREBASE_PRIVATE_KEY_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
FIREBASE_CLIENT_ID=
FIREBASE_CERT_URL=

RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

INVENTORY_RESERVATION_TTL_SECONDS=300
INVENTORY_PAYMENT_RESERVATION_TTL_SECONDS=1800
```

For Render deployments, see [RENDER_ENV_VARS.txt](RENDER_ENV_VARS.txt) for the hosted environment variable checklist.

## Database Seeding

The food seeder creates fictional demo records for application functionality. It exists so developers and reviewers can test category pages, product details, filters, new-arrival and bestseller sections, sales, coupons, cart behavior, inventory reservations, checkout flows, and admin screens without manually creating records.

This data is not intended to represent actual products or real stock. Do not use the seeded prices, quantities, descriptions, images, or coupon in a production environment. The seeder is idempotent and upserts records by stable IDs, so it can be run repeatedly without creating duplicates.

From the repository root:

```bash
npm --prefix server run seed:sample
```

The seed creates demo data for:

- 40 fictional products total.
- Five sample products in each of the eight shop categories.
- New-arrival and bestseller flags for homepage collections.
- Complete product details including stock quantities, pack sizes, ingredients, nutrition, dietary tags, pricing, and images.
- Sale items and an active sale mode for the sales section.
- The `NAIK10` 10% discount coupon for orders over ₹499.

The legacy seed command is also available through `npm run seed`. Use `seed:sample` when you need sample records to exercise the current storefront functionality.

## Running Locally

Run the frontend and backend together:

```bash
npm run dev:all
```

Or run them separately:

```bash
# Terminal 1: backend at http://localhost:5000
npm run dev:server

# Terminal 2: frontend at http://localhost:5173
npm run dev
```

The backend health endpoint is available at `http://localhost:5000/health`.

## Available Scripts

### Root scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite frontend development server. |
| `npm run dev:server` | Start the Express backend with TypeScript watch mode. |
| `npm run dev:all` | Start frontend and backend concurrently. |
| `npm run build` | Build the frontend for production. |
| `npm run build:server` | Compile the backend TypeScript. |
| `npm run start:server` | Start the compiled backend. |
| `npm run seed` | Run the legacy server seed script. |
| `npm run lint` | Run ESLint across the repository. |
| `npm run test` | Run the Vitest test suite once. |
| `npm run preview` | Preview the production frontend build. |

### Server scripts

| Command | Purpose |
| --- | --- |
| `npm --prefix server run seed:sample` | Seed fictional demo products, sales, sale mode, and coupon data for functionality testing. |
| `npm --prefix server run build` | Compile the backend to `server/dist`. |
| `npm --prefix server run start` | Start the compiled backend. |

## API Overview

The REST API is prefixed with `/api`.

| Area | Main endpoints | Description |
| --- | --- | --- |
| Products | `GET /api/products`, `GET /api/products/featured`, `GET /api/products/:id` | Browse, filter, and inspect products. |
| Sales | `GET /api/sales/items`, `GET /api/sales/items/active`, `GET /api/sales/modes/active` | Retrieve sale products and active sale configuration. |
| Cart | `GET /api/cart`, `POST /api/cart/add`, `PUT /api/cart/update`, `DELETE /api/cart/remove/:productId/:size` | Manage the authenticated cart. |
| Inventory | `POST /api/inventory/reserve`, `POST /api/inventory/release` | Reserve and release stock during checkout. |
| Checkout | `/api/checkout/*` | Coordinate checkout and order preparation. |
| Orders | `/api/orders/*` | Create and manage authenticated orders. |
| Payments | `/api/payment/*` | Create, verify, and receive Razorpay payment events. |
| Users | `/api/users/*` | Manage profiles and delivery addresses. |
| Coupons | `POST /api/coupons/validate` | Validate active discount coupons. |
| Admin | `/api/admin/*` | Dashboard metrics and administrative operations. |
| Instagram | `/api/instagram/*` | Optional Instagram feed integration. |

Protected endpoints require a Firebase ID token in the `Authorization: Bearer <token>` header. Admin endpoints additionally check the configured `ADMIN_EMAILS` list.

## Authentication, Checkout, and Inventory

### Authentication

1. The user signs in through Firebase Email/Password or Google authentication.
2. The frontend obtains a Firebase ID token.
3. Axios attaches the token to protected API requests.
4. Firebase Admin verifies the token on the backend.
5. User profile and address data are stored in MongoDB.

### Checkout

1. The client validates cart items and stock availability.
2. Inventory is temporarily reserved to prevent overselling.
3. Razorpay orders are created for online payments, or the order is created directly for COD.
4. Razorpay signatures and webhooks are verified server-side.
5. The order is persisted, reservations are finalized, the cart is cleared, and confirmation email is sent.

### Caching and real-time updates

- Redis caches frequently accessed product data and cart data.
- MongoDB remains the source of truth for products, carts, orders, and reservations.
- Socket.IO broadcasts relevant stock changes to connected clients.
- Reservation TTLs automatically release abandoned checkout inventory.

## Testing and Quality Checks

Run the main checks before opening a pull request:

```bash
npm run lint
npm run test
npm run build
npm run build:server
```

Payment development should use Razorpay test credentials. Do not use live keys locally or commit credentials to the repository.

## Deployment

### Frontend

The frontend is configured for Vercel:

```bash
npm run build
vercel --prod
```

Set `VITE_API_URL` to the deployed backend URL. Set `VITE_SOCKET_URL` separately when Socket.IO is hosted on a different origin.

### Backend

The repository includes `render.yaml` for Render deployment. The backend build and start commands are:

```bash
cd server
npm install --include=dev
npm run build
npm start
```

Configure MongoDB, Redis, Firebase Admin, Razorpay, Cloudinary, email, CORS, and frontend URL values in the hosting provider dashboard. Run the seed command against the intended database after provisioning it.

## Security and Operational Notes

- Keep `.env` files and service-account credentials out of version control.
- Use Firebase Admin verification for protected API routes.
- Use Razorpay signature verification for every online payment result.
- Keep CORS origins restricted to trusted frontend domains in production.
- Use HTTPS for deployed frontend, API, payment, and webhook traffic.
- Monitor low-stock products and reservation failures through the admin dashboard and server logs.

## Project Status

Naik Foods is a private portfolio and commerce project demonstrating a production-style full-stack workflow: catalog management, authenticated shopping, stock safety, payments, transactional communication, and deployment configuration. The included catalog is sample data used only to demonstrate these functions.

## License

Private - Naik Foods © 2026
