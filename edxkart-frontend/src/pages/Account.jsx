import { useState } from 'react'
import { Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useShop } from '../context/ShopContext.jsx'
import { fmtDate, inr, useAsync } from '../utils.js'
import ProductCard from '../components/ProductCard.jsx'
import { Empty, ErrorState, Spinner } from '../components/Layout.jsx'
import { Field } from './Auth.jsx'
import { AddressForm, validateAddress } from './Checkout.jsx'

const POLL = 15000
const Status = ({ s }) => <span className={'st ' + s}>{s}</span>
const Live = () => <span className="live" title={`Refreshes every ${POLL / 1000}s`}><i /> Live</span>

function Dashboard() {
  const { data, error, loading, reload } = useAsync(() => api.dashboard(), [], POLL)
  if (loading && !data) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={reload} />
  return (
    <>
      <div className="sh"><div><h2>Hello, {data.name.split(' ')[0]} 👋</h2><p className="muted">Here's what's happening with your account.</p></div><Live /></div>
      <div className="stats">
        <Link to="orders"><b>{data.totalOrders}</b>Total Orders</Link>
        <Link to="wishlist"><b>{data.wishlistCount}</b>Wishlist</Link>
        <Link to="addresses"><b>{data.addressCount}</b>Saved Addresses</Link>
      </div>
      <div className="box">
        <div className="sh"><h3>Recent Orders</h3><Link to="orders">View All →</Link></div>
        {data.recentOrders.length === 0 ? <p className="muted">No orders yet. <Link to="/products">Start shopping</Link></p> : (
          <table className="ord"><tbody>{data.recentOrders.map(o => (
            <tr key={o.id}><td><Link to={`orders/${o.id}`}>#{o.orderNo}</Link></td><td>{fmtDate(o.createdAt)}</td><td><Status s={o.status} /></td><td className="r">{inr(o.total)}</td></tr>
          ))}</tbody></table>
        )}
      </div>
      <div className="sh"><h3>Wishlist</h3><Link to="wishlist">View All →</Link></div>
      {data.wishlist.length ? <div className="grid4">{data.wishlist.slice(0, 4).map(p => <ProductCard key={p.id} p={p} />)}</div> : <p className="muted">Tap ♡ on any product to save it here.</p>}
    </>
  )
}

function Orders() {
  const { data, error, loading, reload } = useAsync(() => api.orders(), [], POLL)
  if (loading && !data) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={reload} />
  return (
    <>
      <div className="sh"><h2>My Orders</h2><Live /></div>
      {data.length === 0 ? <Empty title="No orders yet" text="Your orders will appear here after checkout." to="/products" cta="Start shopping" /> : data.map(o => (
        <Link to={o.id.toString()} className="box orderrow" key={o.id}>
          <div className="sh"><b>#{o.orderNo}</b><Status s={o.status} /></div>
          <p className="muted">{fmtDate(o.createdAt)} · {o.items.reduce((t, i) => t + i.quantity, 0)} items · {o.paymentMethod}</p>
          <p>{o.items.map(i => `${i.icon} ${i.name}`).join(', ')}</p>
          <b>{inr(o.total)}</b>
        </Link>
      ))}
    </>
  )
}

const STEPS = ['Placed', 'Shipped', 'Delivered']
function OrderDetail() {
  const { id } = useParams()
  const { toast } = useShop()
  const { data, error, loading, reload, setData } = useAsync(() => api.order(id), [id], POLL)
  const [busy, setBusy] = useState(false)
  if (loading && !data) return <Spinner />
  if (error) return <ErrorState error={error.status === 404 ? { message: 'Order not found.' } : error} onRetry={reload} />
  const idx = STEPS.indexOf(data.status)
  const cancel = async () => {
    if (!window.confirm('Cancel this order?')) return
    setBusy(true)
    try { setData(await api.cancelOrder(id)); toast('Order cancelled') } catch (e) { toast(e.message, 'err') } finally { setBusy(false) }
  }
  return (
    <>
      <p><Link to="..">← All orders</Link></p>
      <div className="sh"><h2>Order #{data.orderNo}</h2><Live /></div>
      <div className="box">
        {data.status === 'Cancelled' ? <p><Status s="Cancelled" /> This order was cancelled.</p> : (
          <ol className="timeline">{STEPS.map((s, i) => <li key={s} className={i <= idx ? 'done' : ''}><i>{i <= idx ? '✓' : i + 1}</i>{s}</li>)}</ol>
        )}
        <p className="muted">Placed {fmtDate(data.createdAt)}</p>
      </div>
      <div className="box">
        <h3>Items</h3>
        {data.items.map((i, k) => (
          <div className="line slim" key={k}><span className="lt sm">{i.icon}</span>
            <div className="li"><Link to={`/product/${i.productId}`}>{i.name}</Link>{i.option && <small>{i.option}</small>}<small>Qty {i.quantity} × {inr(i.price)}</small></div><b>{inr(i.price * i.quantity)}</b></div>
        ))}
        <div className="sumrow"><span>Subtotal</span><span>{inr(data.subtotal)}</span></div>
        <div className="sumrow"><span>Discount</span><span className="ok">-{inr(data.discount)}</span></div>
        <div className="sumrow tot"><span>Total paid via {data.paymentMethod}</span><span>{inr(data.total)}</span></div>
      </div>
      <div className="box"><h3>Delivery address</h3><p>{data.shipName} · {data.shipPhone}<br />{data.shipAddress}</p></div>
      {data.status === 'Placed' && <button className="btn ghost danger" disabled={busy} onClick={cancel}>{busy ? 'Cancelling…' : 'Cancel order'}</button>}
    </>
  )
}

function Wishlist() {
  const { wishIds } = useShop()
  const { data, error, loading, reload } = useAsync(() => api.wishlist(), [wishIds.length])
  if (loading && !data) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={reload} />
  return (
    <>
      <h2>My Wishlist</h2>
      {data.length === 0 ? <Empty title="Your wishlist is empty" text="Tap ♡ on any product to save it here." to="/products" cta="Browse products" /> : <div className="grid4">{data.map(p => <ProductCard key={p.id} p={p} />)}</div>}
    </>
  )
}

function Addresses() {
  const { toast } = useShop()
  const { data, error, loading, reload } = useAsync(() => api.addresses(), [])
  const [editing, setEditing] = useState(null)
  const [errs, setErrs] = useState({})
  const [busy, setBusy] = useState(false)
  if (loading && !data) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const save = async e => {
    e.preventDefault()
    const er = validateAddress(editing); setErrs(er)
    if (Object.keys(er).length) return
    setBusy(true)
    try {
      const { id, ...body } = editing
      await api.saveAddress({ ...body, state: body.state || null }, id)
      toast(id ? 'Address updated' : 'Address added'); setEditing(null); reload()
    } catch (err) { setErrs(err.errors || {}); toast(err.message, 'err') } finally { setBusy(false) }
  }
  const remove = async a => {
    if (!window.confirm('Delete this address?')) return
    try { await api.deleteAddress(a.id); toast('Address deleted'); reload() } catch (err) { toast(err.message, 'err') }
  }

  if (editing) return (
    <form onSubmit={save} noValidate className="box">
      <h2>{editing.id ? 'Edit address' : 'Add address'}</h2>
      <AddressForm value={editing} onChange={setEditing} errors={errs} />
      <label className="check"><input type="checkbox" checked={editing.defaultAddress} onChange={e => setEditing({ ...editing, defaultAddress: e.target.checked })} />Make this my default address</label>
      <div className="actions"><button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save address'}</button><button type="button" className="btn ghost" onClick={() => { setEditing(null); setErrs({}) }}>Cancel</button></div>
    </form>
  )
  return (
    <>
      <div className="sh"><h2>Saved Addresses</h2><button className="btn" onClick={() => { setErrs({}); setEditing({ fullName: '', phone: '', line: '', city: '', state: '', pin: '', defaultAddress: false }) }}>+ Add address</button></div>
      {data.length === 0 ? <Empty title="No saved addresses" text="Add one to check out faster." /> : data.map(a => (
        <div className="box addrcard" key={a.id}>
          <div><b>{a.fullName}</b> {a.defaultAddress && <em className="pill">Default</em>}<br />{a.line}, {a.city}{a.state ? `, ${a.state}` : ''} - {a.pin}<br />+91 {a.phone}</div>
          <div className="actions"><button className="link" onClick={() => { setErrs({}); setEditing({ ...a, state: a.state || '' }) }}>Edit</button><button className="link danger" onClick={() => remove(a)}>Delete</button></div>
        </div>
      ))}
    </>
  )
}

function Settings() {
  const { user, setUser, logout } = useAuth()
  const { toast } = useShop()
  const navigate = useNavigate()
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone || '')
  const [busy, setBusy] = useState(false)
  const save = async e => {
    e.preventDefault(); setBusy(true)
    try { setUser(await api.updateProfile({ name, phone: phone || null })); toast('Profile updated') } catch (err) { toast(err.errors?.name || err.message, 'err') } finally { setBusy(false) }
  }
  return (
    <>
      <h2>Account Settings</h2>
      <form className="box narrow" onSubmit={save}>
        <Field label="Full name"><input value={name} onChange={e => setName(e.target.value)} required /></Field>
        <Field label="Email"><input value={user.email} disabled /></Field>
        <Field label="Mobile number"><input value={phone} onChange={e => setPhone(e.target.value)} inputMode="numeric" maxLength={10} /></Field>
        <button className="btn" disabled={busy || !name.trim()}>{busy ? 'Saving…' : 'Save changes'}</button>
      </form>
      <button className="btn ghost danger" onClick={() => { logout(); navigate('/') }}>Sign out</button>
    </>
  )
}

export default function Account() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = [['', 'Dashboard'], ['orders', 'Orders'], ['wishlist', 'Wishlist'], ['addresses', 'Addresses'], ['settings', 'Account Settings']]
  return (
    <div className="wrap dash">
      <aside className="filters side">
        <div className="me"><span className="avatar lg">{user.name.charAt(0).toUpperCase()}</span><div><b>{user.name}</b><small>{user.email}</small></div></div>
        {links.map(([to, label]) => <NavLink key={label} to={to ? `/account/${to}` : '/account'} end={!to}>{label}</NavLink>)}
        <button onClick={() => { logout(); navigate('/') }}>Logout</button>
      </aside>
      <section>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="addresses" element={<Addresses />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Empty title="Page not found" to="/account" cta="Back to dashboard" />} />
        </Routes>
      </section>
    </div>
  )
}
