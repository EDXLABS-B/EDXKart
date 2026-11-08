import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useShop } from '../context/ShopContext.jsx'
import { useAsync } from '../utils.js'
import { Empty, ErrorState, Spinner } from '../components/Layout.jsx'
import { Summary } from './Cart.jsx'
import { Field } from './Auth.jsx'

const PAYMENTS = [['UPI', 'UPI (PhonePe, Google Pay, Paytm)'], ['Card', 'Credit / Debit Card'], ['NetBanking', 'Net Banking'], ['COD', 'Cash on Delivery']]
const blank = { fullName: '', phone: '', line: '', city: '', state: '', pin: '', defaultAddress: false }

export function validateAddress(a) {
  const e = {}
  if (!a.fullName.trim()) e.fullName = 'Enter the recipient name'
  if (!/^[6-9]\d{9}$/.test(a.phone)) e.phone = 'Enter a valid 10-digit mobile number'
  if (!a.line.trim()) e.line = 'Enter the street address'
  if (!a.city.trim()) e.city = 'Enter the city'
  if (!/^\d{6}$/.test(a.pin)) e.pin = 'Enter a 6-digit PIN code'
  return e
}

export function AddressForm({ value, onChange, errors = {} }) {
  const set = k => e => onChange({ ...value, [k]: e.target.value })
  return (
    <div className="fields">
      <Field label="Full name" error={errors.fullName}><input value={value.fullName} onChange={set('fullName')} autoComplete="name" /></Field>
      <Field label="Mobile number" error={errors.phone}><input value={value.phone} onChange={set('phone')} inputMode="numeric" maxLength={10} autoComplete="tel" /></Field>
      <Field label="House no., street, area" error={errors.line}><input value={value.line} onChange={set('line')} autoComplete="street-address" /></Field>
      <div className="row2">
        <Field label="City" error={errors.city}><input value={value.city} onChange={set('city')} autoComplete="address-level2" /></Field>
        <Field label="State" error={errors.state}><input value={value.state || ''} onChange={set('state')} autoComplete="address-level1" /></Field>
      </div>
      <Field label="PIN code" error={errors.pin}><input value={value.pin} onChange={set('pin')} inputMode="numeric" maxLength={6} autoComplete="postal-code" /></Field>
    </div>
  )
}

export default function Checkout() {
  const { user } = useAuth()
  const { cart, reloadServer, toast } = useShop()
  const navigate = useNavigate()
  const addrs = useAsync(() => api.addresses(), [])
  const [sel, setSel] = useState(null)
  const [form, setForm] = useState({ ...blank, fullName: user.name, phone: user.phone || '' })
  const [saveIt, setSaveIt] = useState(true)
  const [pay, setPay] = useState('UPI')
  const [errs, setErrs] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!addrs.data) return
    setSel(s => s !== null ? s : (addrs.data.find(a => a.defaultAddress) || addrs.data[0])?.id ?? 'new')
  }, [addrs.data])

  if (addrs.loading && !addrs.data) return <Spinner />
  if (addrs.error) return <div className="wrap"><ErrorState error={addrs.error} onRetry={addrs.reload} /></div>
  if (!cart.items.length) return <div className="wrap"><Empty title="Nothing to check out" text="Your cart is empty." to="/products" cta="Browse products" /></div>

  const saved = addrs.data
  const placeOrder = async e => {
    e.preventDefault(); setError('')
    let address
    if (sel === 'new') {
      const er = validateAddress(form)
      setErrs(er)
      if (Object.keys(er).length) return
      address = { ...form, state: form.state || null }
    } else address = saved.find(a => a.id === sel)
    setBusy(true)
    try {
      if (sel === 'new' && saveIt) { try { await api.saveAddress({ ...address, defaultAddress: saved.length === 0 }) } catch { /* address save is best effort */ } }
      const { id, fullName, phone, line, city, state, pin } = { ...address }
      const order = await api.placeOrder({ address: { fullName, phone, line, city, state, pin, defaultAddress: false }, paymentMethod: pay })
      await reloadServer()
      toast(`Order ${order.orderNo} placed`)
      navigate(`/order-success/${order.id}`, { replace: true, state: { order } })
    } catch (err) {
      setErrs(Object.fromEntries(Object.entries(err.errors || {}).map(([k, v]) => [k.replace('address.', ''), v])))
      setError(err.message)
      if (err.status === 409) reloadServer().catch(() => {})
      setBusy(false)
    }
  }

  return (
    <form className="wrap two-col" onSubmit={placeOrder} noValidate>
      <div>
        <section className="box">
          <h3>1. Shipping Address</h3>
          {saved.map(a => (
            <label key={a.id} className={'radio addr' + (sel === a.id ? ' on' : '')}>
              <input type="radio" name="addr" checked={sel === a.id} onChange={() => setSel(a.id)} />
              <span><b>{a.fullName}</b> {a.defaultAddress && <em className="pill">Default</em>}<br />{a.line}, {a.city}{a.state ? `, ${a.state}` : ''} - {a.pin}<br />+91 {a.phone}</span>
            </label>
          ))}
          <label className={'radio' + (sel === 'new' ? ' on' : '')}>
            <input type="radio" name="addr" checked={sel === 'new'} onChange={() => setSel('new')} />Use a new address
          </label>
          {sel === 'new' && (
            <>
              <AddressForm value={form} onChange={setForm} errors={errs} />
              <label className="check"><input type="checkbox" checked={saveIt} onChange={e => setSaveIt(e.target.checked)} />Save this address for next time</label>
            </>
          )}
        </section>
        <section className="box">
          <h3>2. Payment Method</h3>
          {PAYMENTS.map(([v, l]) => <label key={v} className={'radio' + (pay === v ? ' on' : '')}><input type="radio" name="pay" checked={pay === v} onChange={() => setPay(v)} />{l}</label>)}
          <p className="muted">This is a demo store: no real payment is taken.</p>
        </section>
        <section className="box">
          <h3>3. Review items</h3>
          {cart.items.map(i => <div className="miniline" key={i.id}><span>{i.icon} {i.name}{i.option ? ` (${i.option})` : ''} × {i.quantity}</span></div>)}
          <Link to="/cart" className="link">Edit cart</Link>
        </section>
      </div>
      <Summary cart={cart}>
        {error && <div className="alert" role="alert">{error}</div>}
        <button className="btn dark full" disabled={busy}>{busy ? 'Placing order…' : 'Place Order'}</button>
        <p className="accept">🔒 Your data is safe and secure</p>
      </Summary>
    </form>
  )
}
