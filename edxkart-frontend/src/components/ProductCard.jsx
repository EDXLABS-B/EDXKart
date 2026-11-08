import { Link } from 'react-router-dom'
import { useShop } from '../context/ShopContext.jsx'
import { compact, inr } from '../utils.js'

export default function ProductCard({ p }) {
  const { addToCart, toggleWish, wishIds } = useShop()
  const liked = wishIds.includes(p.id)
  const out = p.stock <= 0
  return (
    <article className="card">
      <span className={'tag' + (p.flash ? ' flash' : '')}>{p.flash ? 'Flash Sale' : `${p.off}% OFF`}</span>
      <button className={'heart' + (liked ? ' on' : '')} aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={liked} onClick={() => toggleWish(p)}>{liked ? '♥' : '♡'}</button>
      <Link to={`/product/${p.id}`} className="thumb" aria-label={p.name}>{p.icon}</Link>
      <Link to={`/product/${p.id}`} className="pname">{p.name}</Link>
      <div className="rate"><span>★ {p.rating.toFixed(1)}</span> ({compact(p.reviews)})</div>
      <div className="price"><b>{inr(p.price)}</b> <s>{inr(p.mrp)}</s></div>
      <button className="btn sm" disabled={out} onClick={() => addToCart(p, 1, '')}>{out ? 'Out of stock' : 'Add to Cart'}</button>
    </article>
  )
}
