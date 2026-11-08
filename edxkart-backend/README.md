# EDXKart Backend

Java 21 · Spring Boot 3.3 · Spring Security (JWT) · Spring Data JPA · H2 (default) or MySQL

## Run
```bash
mvn spring-boot:run            # http://localhost:8080  (needs JDK 21 + Maven 3.9+)
```
Zero setup: it uses a file-based H2 database in `./data`, creates the tables, and seeds 16 products plus a demo user.

**Demo login:** `demo@edxkart.com` / `Demo@123`

### MySQL instead of H2
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=mysql      # env: DB_URL, DB_USER, DB_PASSWORD
# or everything in Docker (MySQL + API):
docker compose up --build
```
### Config (env vars)
`JWT_SECRET` (set a long random value in production), `CORS_ORIGINS` (comma separated, default Vite 5173/3000), `DB_*` for MySQL. Set `app.seed=false` to disable seeding.

## API
Public: `POST /api/auth/register|login`, `GET /api/products`, `/products/{id}`, `/products/{id}/related`, `/products/{id}/reviews`, `/categories`, `/brands`, `/actuator/health`
Everything else needs `Authorization: Bearer <token>`.

| Area | Endpoints |
|---|---|
| Auth | `GET /api/auth/me`, `PUT /api/users/me` |
| Products | `GET /api/products?q=&category=&brand=&minPrice=&maxPrice=&deals=&flash=&sort=pop\|price\|priceD\|rate&page=&size=` |
| Reviews | `POST /api/products/{id}/reviews` `{rating, body}` |
| Cart | `GET /api/cart`, `POST /api/cart/items` `{productId, quantity, option}`, `PUT /api/cart/items/{id}` `{quantity}`, `DELETE /api/cart/items/{id}`, `DELETE /api/cart` |
| Wishlist | `GET /api/wishlist`, `POST /api/wishlist/{productId}/toggle` |
| Addresses | `GET/POST /api/addresses`, `PUT/DELETE /api/addresses/{id}` |
| Orders | `POST /api/orders` `{address, paymentMethod: UPI\|Card\|NetBanking\|COD, items?}` (omit `items` to use the server cart), `GET /api/orders`, `GET /api/orders/{id}`, `POST /api/orders/{id}/cancel` |
| Dashboard | `GET /api/dashboard` |

Prices are always read from the database at checkout; stock is locked and decremented per order and restored on cancel. Order status advances automatically (Placed → Shipped after 2 min → Delivered after 5 min) so the dashboard shows live changes.

Errors are JSON: `{status, message, errors?{field: reason}}`.

## Quick test
```bash
TOKEN=$(curl -s localhost:8080/api/auth/login -H 'Content-Type: application/json' -d '{"email":"demo@edxkart.com","password":"Demo@123"}' | sed 's/.*"token":"\([^"]*\)".*/\1/')
curl -s localhost:8080/api/products?sort=price | head -c 400
curl -s -X POST localhost:8080/api/cart/items -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"productId":1,"quantity":1,"option":"Pink / 128GB"}'
curl -s -X POST localhost:8080/api/orders -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"paymentMethod":"UPI","address":{"fullName":"Aditya Pandey","phone":"9876543210","line":"123 Green Park","city":"Bangalore","pin":"560001"}}'
```

## Connect the React app
Copy `frontend-integration/api.js` over `edxkart/src/api.js`. The product JSON uses the same field names as the frontend's mock data (`price, mrp, off, rating, reviews, icon, flash`). Vite's `/api` proxy already points at port 8080.
