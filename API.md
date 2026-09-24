# API

Base URL is configured by `VITE_API_BASE_URL`.

Public: `GET /api/health`, `/api/settings/site`, `/api/homepage`, `/api/products`, `/api/products/:slug`, `/api/categories`, `/api/collections`.

Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`.

Customer: `/api/cart`, `/api/wishlist`, `/api/orders`, `/api/orders/:id`, `/api/orders/:id/receipt`, `/api/reviews`.

Admin: `/api/admin/dashboard`, `/api/admin/products`, `/api/admin/products/:id`, `/api/admin/media`, `/api/admin/orders`, `/api/admin/orders/:id/status`, `/api/admin/payments/:id/verify`, `/api/admin/homepage`, `/api/admin/banners`, `/api/admin/content/:key`, `/api/admin/settings`, `/api/admin/export/orders.csv`, `/api/admin/setup`.

All write operations validate data server-side. Admin authorization is enforced by the Worker.
