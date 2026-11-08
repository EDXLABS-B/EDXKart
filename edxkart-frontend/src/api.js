// Single API client for the EDXKart Spring Boot backend.
const BASE = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'edxkart:token'

export class ApiError extends Error {
  constructor(message, status, errors) { super(message); this.status = status; this.errors = errors || {} }
}

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } }
export const setToken = t => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY) } catch { /* storage unavailable */ } }

let onUnauthorized = () => {}
export const setUnauthorizedHandler = fn => { onUnauthorized = fn }

async function request(path, { method = 'GET', body } = {}) {
  const token = getToken()
  let res
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Cannot reach the server. Check that the backend is running on port 8080.', 0)
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && token) { setToken(null); onUnauthorized() }
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data?.errors)
  }
  return data
}

const qs = params => {
  const p = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '' || v === false) return
    ;[].concat(v).forEach(x => p.append(k, x === true ? 'true' : x))
  })
  const s = p.toString()
  return s ? '?' + s : ''
}

export const api = {
  // auth
  register: b => request('/auth/register', { method: 'POST', body: b }),
  login: b => request('/auth/login', { method: 'POST', body: b }),
  me: () => request('/auth/me'),
  updateProfile: b => request('/users/me', { method: 'PUT', body: b }),
  // catalog
  products: (params = {}) => request('/products' + qs(params)),
  product: id => request(`/products/${id}`),
  related: id => request(`/products/${id}/related`),
  reviews: id => request(`/products/${id}/reviews`),
  addReview: (id, b) => request(`/products/${id}/reviews`, { method: 'POST', body: b }),
  categories: () => request('/categories'),
  brands: () => request('/brands'),
  // cart + wishlist
  cart: () => request('/cart'),
  addToCart: (productId, quantity = 1, option = '') => request('/cart/items', { method: 'POST', body: { productId, quantity, option } }),
  setQty: (itemId, quantity) => request(`/cart/items/${itemId}`, { method: 'PUT', body: { quantity } }),
  removeItem: itemId => request(`/cart/items/${itemId}`, { method: 'DELETE' }),
  wishlist: () => request('/wishlist'),
  toggleWishlist: productId => request(`/wishlist/${productId}/toggle`, { method: 'POST' }),
  // account
  dashboard: () => request('/dashboard'),
  addresses: () => request('/addresses'),
  saveAddress: (b, id) => request(id ? `/addresses/${id}` : '/addresses', { method: id ? 'PUT' : 'POST', body: b }),
  deleteAddress: id => request(`/addresses/${id}`, { method: 'DELETE' }),
  // orders
  placeOrder: b => request('/orders', { method: 'POST', body: b }),
  orders: () => request('/orders'),
  order: id => request(`/orders/${id}`),
  cancelOrder: id => request(`/orders/${id}/cancel`, { method: 'POST' }),
}
