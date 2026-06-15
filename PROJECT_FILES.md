# CoreInventory – All Project Files

Complete list of source and config files in this project (excluding `node_modules` and `dist`).

---

## Root

```
d:\odooheckathon\
├── README.md              # Setup, API docs, sample requests
├── PROJECT_FILES.md       # This file – list of all files
```

---

## Backend

```
backend/
├── package.json
├── server.js
├── .env
├── .env.example
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── categoryController.js
│   ├── warehouseController.js
│   ├── productController.js
│   ├── receiptController.js
│   ├── deliveryController.js
│   ├── transferController.js
│   ├── adjustmentController.js
│   ├── stockLedgerController.js
│   ├── dashboardController.js
│   └── alertController.js
├── models/
│   ├── User.js
│   ├── Category.js
│   ├── Warehouse.js
│   ├── Product.js
│   ├── Receipt.js
│   ├── DeliveryOrder.js
│   ├── Transfer.js
│   ├── Adjustment.js
│   ├── StockLedger.js
│   └── OtpToken.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── categoryRoutes.js
│   ├── warehouseRoutes.js
│   ├── productRoutes.js
│   ├── receiptRoutes.js
│   ├── deliveryRoutes.js
│   ├── transferRoutes.js
│   ├── adjustmentRoutes.js
│   ├── stockLedgerRoutes.js
│   ├── dashboardRoutes.js
│   └── alertRoutes.js
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
├── utils/
│   ├── generateToken.js
│   ├── generateOtp.js
│   ├── generateReference.js
│   ├── email.js
│   └── seed.js
```

---

## Frontend

```
frontend/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── layouts/
    │   └── Layout.jsx
    ├── components/
    │   ├── Sidebar.jsx
    │   ├── Header.jsx
    │   ├── ProductForm.jsx
    │   └── ui/
    │       ├── Button.jsx
    │       ├── Card.jsx
    │       ├── Input.jsx
    │       ├── Select.jsx
    │       ├── Badge.jsx
    │       └── Modal.jsx
    ├── pages/
    │   ├── Login.jsx
    │   ├── Signup.jsx
    │   ├── ForgotPassword.jsx
    │   ├── ResetPassword.jsx
    │   ├── Dashboard.jsx
    │   ├── Products.jsx
    │   ├── ProductDetail.jsx
    │   ├── Categories.jsx
    │   ├── Warehouses.jsx
    │   ├── Receipts.jsx
    │   ├── ReceiptForm.jsx
    │   ├── Deliveries.jsx
    │   ├── DeliveryForm.jsx
    │   ├── Transfers.jsx
    │   ├── TransferForm.jsx
    │   ├── Adjustments.jsx
    │   ├── MoveHistory.jsx
    │   └── Profile.jsx
    ├── services/
    │   └── api.js
    └── hooks/
        ├── useAuth.jsx
        └── useTheme.jsx
```

---

## File counts

| Area     | Count |
|----------|--------|
| Backend  | 38 files (controllers, models, routes, middleware, utils, config) |
| Frontend | 35 files (pages, components, layouts, services, hooks, config) |
| Root     | 2 docs |
| **Total**| **75 source/config files** |

All of these files are already in your folder. Use this list as a reference or checklist.
