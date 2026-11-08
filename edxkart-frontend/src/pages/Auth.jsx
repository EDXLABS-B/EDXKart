import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useShop } from '../context/ShopContext.jsx'

export function Field({ label, error, children }) {
  return <label className="field"><span>{label}</span>{children}{error && <small className="er" role="alert">{error}</small>}</label>
}

function useRedirect() {
  const location = useLocation()
  const from = location.state?.from
  return from && !from.startsWith('/login') && !from.startsWith('/register') ? from : '/'
}

export function Login() {
  const { user, login } = useAuth()
  const { toast } = useShop()
  const navigate = useNavigate()
  const to = useRedirect()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (user && !busy) return <Navigate to={to} replace />

  const submit = async e => {
    e.preventDefault(); setError(''); setBusy(true)
    try { const u = await login(email, password); toast(`Welcome back, ${u.name.split(' ')[0]}`); navigate(to, { replace: true }) }
    catch (err) { setError(err.message); setBusy(false) }
  }
  return (
    <div className="authbox">
      <h1>Sign in</h1>
      <p className="muted">Access your cart, orders and wishlist.</p>
      <form onSubmit={submit} noValidate>
        <Field label="Email"><input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></Field>
        <Field label="Password"><input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></Field>
        {error && <div className="alert" role="alert">{error}</div>}
        <button className="btn full" disabled={busy || !email || !password}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <button className="btn ghost full" type="button" onClick={() => { setEmail('demo@edxkart.com'); setPassword('Demo@123') }}>Fill demo account</button>
      <p className="muted center">New to EDXKart? <Link to="/register" state={{ from: to }}>Create an account</Link></p>
    </div>
  )
}

export function Register() {
  const { user, register } = useAuth()
  const { toast } = useShop()
  const navigate = useNavigate()
  const to = useRedirect()
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' })
  const [errs, setErrs] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (user && !busy) return <Navigate to={to} replace />
  const set = k => e => setF({ ...f, [k]: e.target.value })

  const submit = async e => {
    e.preventDefault(); setError('')
    const er = {}
    if (!f.name.trim()) er.name = 'Enter your name'
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email address'
    if (f.phone && !/^[6-9]\d{9}$/.test(f.phone)) er.phone = 'Enter a valid 10-digit mobile number'
    if (f.password.length < 6) er.password = 'Use at least 6 characters'
    setErrs(er)
    if (Object.keys(er).length) return
    setBusy(true)
    try { const u = await register({ ...f, phone: f.phone || null }); toast(`Welcome to EDXKart, ${u.name.split(' ')[0]}`); navigate(to, { replace: true }) }
    catch (err) { setErrs(err.errors || {}); setError(err.message); setBusy(false) }
  }
  return (
    <div className="authbox">
      <h1>Create account</h1>
      <p className="muted">Save your cart, track orders and checkout faster.</p>
      <form onSubmit={submit} noValidate>
        <Field label="Full name" error={errs.name}><input autoComplete="name" value={f.name} onChange={set('name')} /></Field>
        <Field label="Email" error={errs.email}><input type="email" autoComplete="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Mobile number (optional)" error={errs.phone}><input inputMode="numeric" maxLength={10} autoComplete="tel" value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Password" error={errs.password}><input type="password" autoComplete="new-password" value={f.password} onChange={set('password')} /></Field>
        {error && <div className="alert" role="alert">{error}</div>}
        <button className="btn full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p className="muted center">Already have an account? <Link to="/login" state={{ from: to }}>Sign in</Link></p>
    </div>
  )
}
