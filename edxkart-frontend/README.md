# EDXKart Frontend (React 18 + Vite 5)

Works with the **EDXKart Spring Boot backend** (`edxkart-backend.zip`).

## Run
1. Start the backend first: `mvn spring-boot:run` in the backend folder (port **8080**).
2. In this folder:
   ```bash
   npm install
   npm run dev          # http://localhost:5173
   ```
Vite proxies every `/api/*` request to `http://localhost:8080`, so there is no CORS setup.
Different backend address: `BACKEND_URL=http://host:port npm run dev`.

**Demo login:** `demo@edxkart.com` / `Demo@123` (the sign-in page has a "Fill demo account" button).

## Production build
```bash
npm run build && npm run preview     # serves dist/ on :5173 with the same /api proxy
```
For a deployed site, serve `dist/` and either reverse-proxy `/api` to the backend, or build with
`VITE_API_URL=https://your-api-host/api` and add your site's origin to the backend's `CORS_ORIGINS`.

## What works
- Sign in / register (JWT), session restored on refresh, auto sign-out when a token expires
- Product browsing with server-side search, category, brand, price range, 40%+ off, sorting and pagination (state kept in the URL)
- Product detail: options, quantity, stock warnings, reviews (post as signed-in user), related products
- Cart: guest cart in the browser, merged into your account on login; signed-in cart lives on the server
- Wishlist, saved addresses (add / edit / delete / default), account settings
- Checkout: pick or enter an address, payment method, server-priced order, stock checks
- Orders: live status (refreshes every 15s: Placed → Shipped → Delivered), order detail, cancel
- Responsive layout with mobile bottom navigation, loading / empty / error states, toast messages

## Structure
`src/api.js` API client · `src/context/` auth + cart/wishlist state · `src/pages/` screens · `src/components/` shared UI
