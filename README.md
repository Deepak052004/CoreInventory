# CoreInventory – Inventory Management System

A full-stack modular **Inventory Management System** with a modern dashboard, REST API, and scalable architecture.

## Tech Stack

| Layer    | Technologies |
|----------|----------------|
| Frontend | React (Vite), Tailwind CSS, React Router, Axios, Chart.js, Lucide Icons, React Hot Toast |
| Backend  | Node.js, Express.js, MongoDB, Mongoose, JWT, Nodemailer (OTP), express-validator |
| Features | JWT auth, OTP password reset, dark/light mode, responsive UI, dashboard analytics |

---

## Quick Start

### Prerequisites

- **Node.js** 18+
- **MongoDB** running locally (e.g. `mongodb://localhost:27017`) or a cloud URI

### 1. Clone and install

```bash
cd d:\odooheckathon
# Backend
cd backend && npm install
# Frontend
cd ../frontend && npm install
```

### 2. Environment variables

**Backend** – copy and edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/coreinventory
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
# Optional – for OTP password reset emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FRONTEND_URL=http://localhost:5173
```

**Frontend** – dev server proxies `/api` to `http://localhost:5000` (see `vite.config.js`). No env file required for basic run.

### 3. Seed database (optional)

From project root:

```bash
cd backend && npm run seed
```

This creates sample categories, warehouses, products, and a demo user:

- **Email:** `admin@coreinventory.com`  
- **Password:** `admin123`

### 4. Run the app

**Terminal 1 – Backend**

```bash
cd backend && npm run dev
```

**Terminal 2 – Frontend**

```bash
cd frontend && npm run dev
```

- Frontend: **http://localhost:5173**
- Backend API: **http://localhost:5000**

Login with the seeded user or sign up a new account. You are redirected to the dashboard after login.

---

## Project structure

```
backend/
  controllers/   # Request handlers
  models/       # Mongoose schemas (User, Product, Category, Warehouse, Receipt, DeliveryOrder, Transfer, Adjustment, StockLedger, OtpToken)
  routes/       # Express routers
  middleware/   # auth, errorHandler
  utils/        # generateToken, email, generateOtp, generateReference, seed
  server.js     # Entry point

frontend/
  src/
    components/ # UI (Button, Card, Input, Modal, Badge, Select), Sidebar, Header, ProductForm
    pages/      # Login, Signup, Dashboard, Products, Receipts, Deliveries, Transfers, Adjustments, MoveHistory, Warehouses, Categories, Profile
    layouts/    # Layout (sidebar + main)
    services/   # api.js (Axios + all API methods)
    hooks/      # useAuth, useTheme
  App.jsx       # Routes and protected/public wrappers
```

---

## API documentation

Base URL: `http://localhost:5000/api`  
Protected routes require header: `Authorization: Bearer <token>`.

### Auth

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST   | `/auth/signup` | `{ name, email, password, role? }` | Register (role: admin, manager, user) |
| POST   | `/auth/login` | `{ email, password }` | Login; returns `token` and `user` |
| POST   | `/auth/forgot-password` | `{ email }` | Send OTP to email |
| POST   | `/auth/reset-password` | `{ email, otp, newPassword }` | Reset password with OTP; returns token |
| GET    | `/auth/me` | – | Current user (protected) |

### Dashboard

| Method | Endpoint | Query | Description |
|--------|----------|--------|-------------|
| GET | `/dashboard/kpis` | – | Total products, low stock, out of stock, pending receipts/deliveries, scheduled transfers |
| GET | `/dashboard/inventory-distribution` | – | Quantity by category (for charts) |
| GET | `/dashboard/category-stats` | – | Count and total stock per category |
| GET | `/dashboard/stock-movement` | `days=30` | Movement count per day |
| GET | `/dashboard/filters` | – | Warehouses and categories for filters |

### Products

| Method | Endpoint | Body/Query | Description |
|--------|----------|------------|-------------|
| GET | `/products` | `search, category, warehouse, page, limit, sort` | List with pagination |
| GET | `/products/:id` | – | Single product with category and stockByLocation |
| POST | `/products` | `{ name, SKU, category, unitOfMeasure?, stockQuantity?, reorderLevel? }` | Create |
| PUT | `/products/:id` | same as create | Update |
| DELETE | `/products/:id` | – | Delete |

### Categories

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/categories` | – | List all |
| POST | `/categories` | `{ name, description? }` | Create |
| PUT | `/categories/:id` | `{ name, description? }` | Update |
| DELETE | `/categories/:id` | – | Delete |

### Warehouses

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/warehouses` | – | List all |
| GET | `/warehouses/:id` | – | Single warehouse |
| POST | `/warehouses` | `{ name, location?, description?, locations? }` | Create |
| PUT | `/warehouses/:id` | same | Update |
| DELETE | `/warehouses/:id` | – | Delete |

### Receipts (incoming)

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/receipts` | `status?, page, limit` | List |
| GET | `/receipts/:id` | – | Single receipt |
| POST | `/receipts` | `{ supplier, lines: [{ product, quantity, warehouse, locationName? }] }` | Create (draft) |
| PUT | `/receipts/:id` | same | Update (if not done) |
| POST | `/receipts/:id/validate` | – | Validate receipt; increase stock and log to ledger |
| DELETE | `/receipts/:id` | – | Delete (if not done) |

### Delivery orders (outgoing)

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/deliveries` | `status?, page, limit` | List |
| GET | `/deliveries/:id` | – | Single order |
| POST | `/deliveries` | `{ customer, lines: [{ product, quantity, warehouse, locationName? }] }` | Create (draft) |
| PUT | `/deliveries/:id` | same | Update (if not done) |
| POST | `/deliveries/:id/validate` | – | Validate; decrease stock and log to ledger |
| DELETE | `/deliveries/:id` | – | Delete (if not done) |

### Internal transfers

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/transfers` | `status?, page, limit` | List |
| GET | `/transfers/:id` | – | Single transfer |
| POST | `/transfers` | `{ product, quantity, sourceWarehouse, sourceLocationName?, destinationWarehouse, destinationLocationName?, status? }` | Create |
| POST | `/transfers/:id/complete` | – | Execute transfer (move stock, ledger entries) |
| DELETE | `/transfers/:id` | – | Delete (if not done) |

### Inventory adjustments

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/adjustments` | `page, limit` | List |
| POST | `/adjustments` | `{ product, warehouse, locationName?, countedQuantity, reason? }` | Create; system computes difference and updates stock + ledger |

### Stock ledger / move history

| Method | Endpoint | Query | Description |
|--------|----------|--------|-------------|
| GET | `/stock-ledger` | `product?, operationType?, warehouse?, page, limit` | List movements (receipt, delivery, transfer_in, transfer_out, adjustment) |

### Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/alerts` | Low stock, out of stock, pending deliveries (for dashboard/notifications) |

### User profile

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/users/profile` | – | Current user profile |
| PATCH | `/users/profile` | `{ name }` | Update name |

---

## Sample requests

**Login**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@coreinventory.com","password":"admin123"}'
```

**Create product** (use token from login)

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Widget X","SKU":"WX-001","category":"CATEGORY_ID","unitOfMeasure":"units","reorderLevel":10}'
```

**Create receipt**

```bash
curl -X POST http://localhost:5000/api/receipts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"supplier":"Acme Corp","lines":[{"product":"PRODUCT_ID","quantity":50,"warehouse":"WAREHOUSE_ID"}]}'
```

---

## Features summary

- **Auth:** Signup, login, JWT, OTP-based password reset, protected routes, redirect to dashboard after login.
- **Dashboard:** KPIs (total products, low/out of stock, pending receipts/deliveries, scheduled transfers), inventory distribution and category charts, stock movement history.
- **Products:** CRUD, search by name/SKU, category filter, stock by location, reorder level.
- **Receipts:** Create with supplier and lines; validate to increase stock and log movements.
- **Delivery orders:** Create with customer and lines; validate to decrease stock and log movements.
- **Internal transfers:** Move stock between warehouses/locations; complete to apply and log.
- **Adjustments:** Set counted quantity per product/warehouse; system adjusts stock and logs.
- **Move history:** Filterable stock ledger (product, type, warehouse).
- **Warehouses & categories:** Full CRUD.
- **Alerts:** Low stock, out of stock, pending deliveries in header dropdown.
- **UI:** Sidebar navigation, dark/light toggle, toasts, modals, loading states, pagination, responsive layout.

---

## Production build

```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run build
# Serve the contents of frontend/dist with your preferred server (e.g. nginx, or static hosting).
# Set FRONTEND_URL and CORS accordingly on the backend.
```

Ensure `JWT_SECRET` and `MONGODB_URI` are set correctly for production and that SMTP is configured if you use OTP reset.
