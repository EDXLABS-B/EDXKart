// Drop-in client for the EDXKart Spring Boot API. Copy to edxkart/src/api.js.
// Vite already proxies /api -> http://localhost:8080 (see vite.config.js).
const BASE = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'edxkart:token'
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = t => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))

async function req(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: 'Bearer ' + getToken() } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw Object.assign(new Error(data?.message || 'Request failed'), { status: res.status, errors: data?.errors })
  return data
}
const qs = o => {
  const p = new URLSearchParams()
  Object.entries(o).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') [].concat(v).forEach(x => p.append(k, x)) })
  const s = p.toString(); return s ? '?' + s : ''
}

export const api = {
  // auth
  register: b => req('/auth/register', { method: 'POST', body: b }).then(r => (setToken(r.token), r)),
  login: b => req('/auth/login', { method: 'POST', body: b }).then(r => (setToken(r.token), r)),
  logout: () => setToken(null),
  me: () => req('/auth/me'),
  updateProfile: b => req('/users/me', { method: 'PUT', body: b }),
  // catalog   params: q, category, brand[], minPrice, maxPrice, deals, flash, sort(pop|price|priceD|rate), page, size
  products: (params = {}) => req('/products' + qs(params)),
  product: id => req(`/products/${id}`),
  related: id => req(`/products/${id}/related`),
  reviews: id => req(`/products/${id}/reviews`),
  addReview: (id, b) => req(`/products/${id}/reviews`, { method: 'POST', body: b }),
  categories: () => req('/categories'),
  brands: () => req('/brands'),
  // cart (server side, needs login)
  cart: () => req('/cart'),
  addToCart: (productId, quantity = 1, option = '') => req('/cart/items', { method: 'POST', body: { productId, quantity, option } }),
  setQty: (itemId, quantity) => req(`/cart/items/${itemId}`, { method: 'PUT', body: { quantity } }),
  removeItem: itemId => req(`/cart/items/${itemId}`, { method: 'DELETE' }),
  clearCart: () => req('/cart', { method: 'DELETE' }),
  // wishlist
  wishlist: () => req('/wishlist'),
  toggleWishlist: productId => req(`/wishlist/${productId}/toggle`, { method: 'POST' }),
  // addresses + dashboard
  addresses: () => req('/addresses'),
  saveAddress: (b, id) => req(id ? `/addresses/${id}` : '/addresses', { method: id ? 'PUT' : 'POST', body: b }),
  deleteAddress: id => req(`/addresses/${id}`, { method: 'DELETE' }),
  dashboard: () => req('/dashboard'),
  // orders. Omit `items` to order from the server-side cart.
  placeOrder: ({ address, paymentMethod, items }) => req('/orders', { method: 'POST', body: { address, paymentMethod, items } }),
  orders: () => req('/orders'),
  order: id => req(`/orders/${id}`),
  cancelOrder: id => req(`/orders/${id}/cancel`, { method: 'POST' }),
}
