import { Link, useNavigate } from 'react-router-dom'
import { useShop } from '../context/ShopContext.jsx'
import { inr } from '../utils.js'
import { Empty } from '../components/Layout.jsx'

export function Summary({ cart, children }) {
  return (
    <aside className="sum" aria-label="Order summary">
      <h3>Order Summary</h3>
      <div><span>Subtotal ({cart.count} items)</span><span>{inr(cart.subtotal)}</span></div>
      <div><span>Shipping</span><span className="ok">FREE</span></div>
      <div><span>Discount</span><span className="ok">-{inr(cart.discount)}</span></div>
      <div className="tot"><span>Total</span><span>{inr(cart.total)}</span></div>
      {children}
    </aside>
  )
}

export default function Cart() {
  const { cart, setQty, removeItem } = useShop()
  const navigate = useNavigate()
  if (!cart.items.length) return <div className="wrap"><Empty title="Your cart is empty" text="Add something you like and it will show up here." to="/products" cta="Start shopping" /></div>
  return (
    <div className="wrap two-col">
      <section>
        <h2>Your Cart ({cart.count} {cart.count === 1 ? 'item' : 'items'})</h2>
        {cart.items.map(x => (
          <div className="line" key={x.id}>
            <Link to={`/product/${x.productId}`} className="lt" aria-label={x.name}>{x.icon}</Link>
            <div className="li">
              <Link to={`/product/${x.productId}`}>{x.name}</Link>
              {x.option && <small>{x.option}</small>}
              <div className="price"><b>{inr(x.price)}</b> <s>{inr(x.mrp)}</s></div>
            </div>
            <div className="qty">
              <button aria-label={`Decrease quantity of ${x.name}`} disabled={x.quantity <= 1} onClick={() => setQty(x, x.quantity - 1)}>−</button>
              <span>{x.quantity}</span>
              <button aria-label={`Increase quantity of ${x.name}`} onClick={() => setQty(x, x.quantity + 1)}>+</button>
            </div>
            <button className="link" onClick={() => removeItem(x)}>Remove</button>
          </div>
        ))}
      </section>
      <Summary cart={cart}>
        <button className="btn dark full" onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
        <p className="accept">We accept: VISA · Mastercard · UPI · Net Banking · COD</p>
      </Summary>
    </div>
  )
}
