import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useShop } from '../context/ShopContext.jsx'
import { api } from '../api.js'
import { catIcon } from '../utils.js'

export function Header() {
  const { user, logout } = useAuth()
  const { cart, wishIds } = useShop()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const location = useLocation()
  const [q, setQ] = useState('')
  const [menu, setMenu] = useState(false)
  const [cats, setCats] = useState([])
  const menuRef = useRef(null)

  useEffect(() => { api.categories().then(setCats).catch(() => {}) }, [])
  useEffect(() => { setQ(location.pathname === '/products' ? sp.get('q') || '' : '') }, [location.pathname, sp])
  useEffect(() => { setMenu(false) }, [location.pathname])
  useEffect(() => {
    const close = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const submit = e => { e.preventDefault(); navigate('/products' + (q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '')) }
  const signOut = () => { logout(); navigate('/'); }

  return (
    <header className="site-header">
      <div className="topbar">Free shipping on orders above ₹499</div>
      <div className="wrap hrow">
        <Link to="/" className="logo" aria-label="EDXKart home">🛒 EDX<b>Kart</b></Link>
        <form onSubmit={submit} className="search" role="search">
          <input aria-label="Search products" value={q} onChange={e => setQ(e.target.value)} placeholder="Search for products, brands and more..." />
          <button aria-label="Search">🔍</button>
        </form>
        <div className="hactions">
          {user ? (
            <div className="usermenu" ref={menuRef}>
              <button className="hlink" onClick={() => setMenu(m => !m)} aria-haspopup="menu" aria-expanded={menu}>
                <span className="avatar">{user.name.charAt(0).toUpperCase()}</span><span className="hide-sm">{user.name.split(' ')[0]} ▾</span>
              </button>
              {menu && (
                <div className="dropdown" role="menu">
                  <Link to="/account">Dashboard</Link>
                  <Link to="/account/orders">My orders</Link>
                  <Link to="/account/wishlist">Wishlist</Link>
                  <Link to="/account/addresses">Addresses</Link>
                  <Link to="/account/settings">Account settings</Link>
                  <button onClick={signOut}>Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" state={{ from: location.pathname + location.search }} className="hlink">👤 <span className="hide-sm">Login / Register</span></Link>
          )}
          <Link to="/account/wishlist" className="hlink icon" aria-label={`Wishlist (${wishIds.length})`}>♡{wishIds.length > 0 && <i className="badge">{wishIds.length}</i>}</Link>
          <Link to="/cart" className="hlink icon" aria-label={`Cart (${cart.count})`}>🛍️{cart.count > 0 && <i className="badge">{cart.count}</i>}</Link>
        </div>
      </div>
      <nav className="cats" aria-label="Categories">
        <div className="wrap">
          <Link to="/products" className="allcat">☰ All Categories</Link>
          <NavLink to="/" end>Home</NavLink>
          {cats.slice(0, 7).map(c => <Link key={c} to={`/products?cat=${encodeURIComponent(c)}`}>{c}</Link>)}
          <Link to="/products?deals=1">Offers</Link>
        </div>
      </nav>
    </header>
  )
}

export function Footer() {
  const shop = ['Mobiles', 'Laptops', 'Electronics', 'Fashion', 'Home & Living']
  return (
    <footer>
      <div className="wrap fgrid">
        <div>
          <div className="logo light">🛒 EDX<b>Kart</b></div>
          <p>Your one-stop destination for the latest products, best deals and a seamless shopping experience.</p>
        </div>
        <div><h4>Quick Links</h4><Link to="/">Home</Link><Link to="/products">All Products</Link><Link to="/cart">Cart</Link><Link to="/account/orders">Track Order</Link></div>
        <div><h4>Shop</h4>{shop.map(s => <Link key={s} to={`/products?cat=${encodeURIComponent(s)}`}>{s}</Link>)}</div>
        <div><h4>Customer Care</h4><Link to="/account">My Account</Link><Link to="/account/addresses">Saved Addresses</Link><Link to="/account/orders">Return an Order</Link></div>
      </div>
      <div className="wrap copy">© {new Date().getFullYear()} EDXKart. All rights reserved.</div>
    </footer>
  )
}

export function MobileNav() {
  const { cart } = useShop()
  return (
    <nav className="mnav" aria-label="Primary">
      <NavLink to="/" end><span>🏠</span>Home</NavLink>
      <NavLink to="/products"><span>▦</span>Categories</NavLink>
      <NavLink to="/cart"><span>🛍️</span>Cart{cart.count ? ` (${cart.count})` : ''}</NavLink>
      <NavLink to="/account"><span>👤</span>Account</NavLink>
    </nav>
  )
}

export function Spinner({ label = 'Loading…' }) { return <div className="state"><div className="spin" aria-hidden /><p>{label}</p></div> }

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state err">
      <h3>Something went wrong</h3>
      <p>{error?.message || 'Please try again.'}</p>
      {onRetry && <button className="btn" onClick={onRetry}>Try again</button>}
    </div>
  )
}

export function Empty({ title, text, to, cta }) {
  return (
    <div className="state">
      <h3>{title}</h3>{text && <p>{text}</p>}
      {to && <Link className="btn" to={to}>{cta}</Link>}
    </div>
  )
}

export { catIcon }
