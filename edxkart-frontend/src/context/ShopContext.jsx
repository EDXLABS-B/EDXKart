import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from './AuthContext.jsx'

const Ctx = createContext(null)
export const useShop = () => useContext(Ctx)

const GUEST_KEY = 'edxkart:guest-cart'
const readGuest = () => { try { return JSON.parse(localStorage.getItem(GUEST_KEY)) || [] } catch { return [] } }
const writeGuest = items => { try { localStorage.setItem(GUEST_KEY, JSON.stringify(items)) } catch { /* ignore */ } }

function totals(items) {
  const subtotal = items.reduce((t, i) => t + i.mrp * i.quantity, 0)
  const total = items.reduce((t, i) => t + i.price * i.quantity, 0)
  return { items, count: items.reduce((t, i) => t + i.quantity, 0), subtotal, discount: subtotal - total, total }
}

/**
 * Cart + wishlist state. Signed-in users use the server cart; guests use a local cart
 * that is merged into the account on login.
 */
export function ShopProvider({ children }) {
  const { user, ready } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [cart, setCart] = useState(() => totals(readGuest()))
  const [wishIds, setWishIds] = useState([])
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'ok') => {
    const id = Math.random()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  const loadServer = useCallback(async () => {
    const [c, w] = await Promise.all([api.cart(), api.wishlist()])
    setCart(c); setWishIds(w.map(p => p.id))
  }, [])

  useEffect(() => {
    if (!ready) return undefined
    let cancelled = false
    const run = async () => {
      if (!user) { setWishIds([]); setCart(totals(readGuest())); return }
      const guest = readGuest()
      let merged = 0
      for (const g of guest) {
        try { await api.addToCart(g.productId, g.quantity, g.option); merged++ } catch { /* skip items that no longer fit */ }
      }
      if (guest.length) writeGuest([])
      try { await loadServer() } catch (e) { if (!cancelled) toast(e.message, 'err') }
      if (merged && !cancelled) toast('Items from your guest cart were added to your account')
    }
    run()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, ready])

  const addToCart = useCallback(async (product, quantity = 1, option = '') => {
    if (product.stock <= 0) { toast('This product is out of stock', 'err'); return false }
    if (user) {
      try { setCart(await api.addToCart(product.id, quantity, option)); toast(`${product.name} added to cart`); return true }
      catch (e) { toast(e.message, 'err'); return false }
    }
    const items = readGuest()
    const found = items.find(i => i.productId === product.id && i.option === option)
    const qty = (found ? found.quantity : 0) + quantity
    if (qty > product.stock) { toast(`Only ${product.stock} in stock`, 'err'); return false }
    if (found) found.quantity = qty
    else items.push({ id: `${product.id}|${option}`, productId: product.id, name: product.name, icon: product.icon, price: product.price, mrp: product.mrp, stock: product.stock, quantity: qty, option })
    writeGuest(items); setCart(totals(items)); toast(`${product.name} added to cart`)
    return true
  }, [user, toast])

  const setQty = useCallback(async (item, quantity) => {
    if (quantity < 1) return
    if (user) {
      try { setCart(await api.setQty(item.id, quantity)) } catch (e) { toast(e.message, 'err') }
      return
    }
    const items = readGuest()
    const found = items.find(i => i.id === item.id)
    if (!found) return
    if (found.stock && quantity > found.stock) { toast(`Only ${found.stock} in stock`, 'err'); return }
    found.quantity = quantity; writeGuest(items); setCart(totals(items))
  }, [user, toast])

  const removeItem = useCallback(async item => {
    if (user) {
      try { setCart(await api.removeItem(item.id)) } catch (e) { toast(e.message, 'err') }
      return
    }
    const items = readGuest().filter(i => i.id !== item.id)
    writeGuest(items); setCart(totals(items))
  }, [user, toast])

  const toggleWish = useCallback(async product => {
    if (!user) { toast('Sign in to save items to your wishlist'); navigate('/login', { state: { from: location.pathname + location.search } }); return }
    try {
      const { wishlisted } = await api.toggleWishlist(product.id)
      setWishIds(ids => wishlisted ? [...new Set([...ids, product.id])] : ids.filter(i => i !== product.id))
      toast(wishlisted ? 'Saved to wishlist' : 'Removed from wishlist')
    } catch (e) { toast(e.message, 'err') }
  }, [user, toast, navigate, location])

  const value = useMemo(() => ({
    cart, wishIds, toast, addToCart, setQty, removeItem, toggleWish, reloadServer: loadServer,
  }), [cart, wishIds, toast, addToCart, setQty, removeItem, toggleWish, loadServer])

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map(t => <div key={t.id} className={'toast ' + t.type}>{t.message}</div>)}
      </div>
    </Ctx.Provider>
  )
}
