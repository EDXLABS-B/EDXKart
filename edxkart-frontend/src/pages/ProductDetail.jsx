import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useShop } from '../context/ShopContext.jsx'
import { fmtDate, inr, useAsync } from '../utils.js'
import ProductCard from '../components/ProductCard.jsx'
import { ErrorState, Spinner } from '../components/Layout.jsx'

const COLORS = ['Pink', 'Blue', 'Black', 'Green']
const STORAGE = ['128GB', '256GB', '512GB']
const Stars = ({ n }) => <span className="stars" aria-label={`${n} out of 5`}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToCart, toggleWish, wishIds, toast } = useShop()
  const [color, setColor] = useState('Pink')
  const [storage, setStorage] = useState('128GB')
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('Description')
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)

  const prod = useAsync(async () => {
    const [p, related] = await Promise.all([api.product(id), api.related(id)])
    return { p, related }
  }, [id])
  const reviews = useAsync(() => api.reviews(id), [id])

  if (prod.loading && !prod.data) return <Spinner />
  if (prod.error) return <div className="wrap"><ErrorState error={prod.error.status === 404 ? { message: 'This product could not be found.' } : prod.error} onRetry={prod.error.status === 404 ? undefined : prod.reload} /><p className="center"><Link className="btn" to="/products">Browse products</Link></p></div>
  const { p, related } = prod.data
  const phone = p.category === 'Mobiles'
  const option = phone ? `${color} / ${storage}` : ''
  const out = p.stock <= 0
  const liked = wishIds.includes(p.id)
  const maxQty = Math.max(1, Math.min(p.stock, 10))

  const buyNow = async () => { if (await addToCart(p, qty, option)) navigate('/checkout') }
  const submitReview = async e => {
    e.preventDefault()
    setPosting(true)
    try {
      await api.addReview(p.id, { rating, body })
      setBody(''); toast('Thanks for your review'); reviews.refresh(); prod.refresh()
    } catch (err) { toast(err.errors?.body || err.message, 'err') } finally { setPosting(false) }
  }

  return (
    <div className="wrap">
      <div className="crumb"><Link to="/">Home</Link> / <Link to={`/products?cat=${encodeURIComponent(p.category)}`}>{p.category}</Link> / {p.name}</div>
      <div className="pd">
        <div className="pdimg" role="img" aria-label={p.name}>{p.icon}</div>
        <div>
          <div className="titlerow"><h1>{p.name}</h1>
            <button className={'heart static' + (liked ? ' on' : '')} aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={liked} onClick={() => toggleWish(p)}>{liked ? '♥' : '♡'}</button>
          </div>
          <div className="rate"><span>★ {p.rating.toFixed(1)}</span> ({p.reviews.toLocaleString('en-IN')} reviews) · {p.brand}</div>
          <div className="price big"><b>{inr(p.price)}</b> <s>{inr(p.mrp)}</s> <em>{p.off}% OFF</em></div>
          {out ? <p className="bad">● Out of stock</p> : p.stock <= 10 ? <p className="warn">● Only {p.stock} left</p> : <p className="ok">● Available in stock</p>}
          {phone && (
            <>
              <h4>Select Color</h4>
              <div className="chips" role="radiogroup" aria-label="Color">{COLORS.map(c => <button key={c} role="radio" aria-checked={color === c} className={color === c ? 'on' : ''} onClick={() => setColor(c)}>{c}</button>)}</div>
              <h4>Select Storage</h4>
              <div className="chips" role="radiogroup" aria-label="Storage">{STORAGE.map(c => <button key={c} role="radio" aria-checked={storage === c} className={storage === c ? 'on' : ''} onClick={() => setStorage(c)}>{c}</button>)}</div>
            </>
          )}
          <div className="buy">
            <div className="qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity">−</button>
              <span aria-live="polite">{qty}</span>
              <button onClick={() => setQty(Math.min(maxQty, qty + 1))} aria-label="Increase quantity">+</button>
            </div>
            <button className="btn dark grow" disabled={out} onClick={() => addToCart(p, qty, option)}>🛒 Add to Cart</button>
          </div>
          <button className="btn ghost full" disabled={out} onClick={buyNow}>Buy Now</button>
          <div className="perks"><span>🚚 Free Shipping</span><span>↩️ 7 Days Return</span><span>🛡️ Secure Payments</span></div>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {['Description', 'Specifications', 'Reviews'].map(t => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}{t === 'Reviews' && reviews.data ? ` (${reviews.data.length})` : ''}</button>)}
      </div>
      <div className="tabbody">
        {tab === 'Description' && <><h3>About this item</h3><p>{p.description}</p><ul><li>Rated {p.rating.toFixed(1)}/5 by {p.reviews.toLocaleString('en-IN')} customers</li><li>Free shipping and 7-day easy returns</li><li>1-year manufacturer warranty</li></ul></>}
        {tab === 'Specifications' && <table className="spec"><tbody><tr><td>Brand</td><td>{p.brand}</td></tr><tr><td>Category</td><td>{p.category}</td></tr><tr><td>Price</td><td>{inr(p.price)} (MRP {inr(p.mrp)})</td></tr><tr><td>Warranty</td><td>1 year</td></tr><tr><td>Availability</td><td>{out ? 'Out of stock' : `${p.stock} in stock`}</td></tr></tbody></table>}
        {tab === 'Reviews' && (
          <>
            {user ? (
              <form className="reviewform" onSubmit={submitReview}>
                <h3>Write a review</h3>
                <div className="chips" role="radiogroup" aria-label="Rating">{[5, 4, 3, 2, 1].map(n => <button type="button" key={n} role="radio" aria-checked={rating === n} className={rating === n ? 'on' : ''} onClick={() => setRating(n)}>{n} ★</button>)}</div>
                <textarea required maxLength={1000} rows={3} value={body} onChange={e => setBody(e.target.value)} placeholder="What did you like or dislike?" aria-label="Review" />
                <button className="btn" disabled={posting || !body.trim()}>{posting ? 'Posting…' : 'Post review'}</button>
              </form>
            ) : <p><Link to="/login" state={{ from: `/product/${p.id}` }}>Sign in</Link> to write a review.</p>}
            {reviews.loading && !reviews.data && <Spinner />}
            {reviews.data?.length === 0 && <p className="muted">No written reviews yet. Be the first.</p>}
            {reviews.data?.map(r => (
              <div className="review" key={r.id}><div><b>{r.author}</b> <Stars n={r.rating} /></div><p>{r.body}</p><small>{fmtDate(r.createdAt)}</small></div>
            ))}
          </>
        )}
      </div>

      {related.length > 0 && (
        <section className="sec">
          <div className="sh"><h2>You Might Also Like</h2></div>
          <div className="grid4">{related.map(x => <ProductCard key={x.id} p={x} />)}</div>
        </section>
      )}
    </div>
  )
}
