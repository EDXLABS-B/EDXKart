import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { catIcon, useAsync } from '../utils.js'
import ProductCard from '../components/ProductCard.jsx'
import { ErrorState, Spinner } from '../components/Layout.jsx'
import { useState } from 'react'

const Row = ({ title, to, items }) => (
  <section className="wrap sec">
    <div className="sh"><h2>{title}</h2><Link to={to}>View All →</Link></div>
    <div className="grid6">{items.map(p => <ProductCard key={p.id} p={p} />)}</div>
  </section>
)

export default function Home() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const { data, error, loading, reload } = useAsync(async () => {
    const [deals, flash, cats, brands] = await Promise.all([
      api.products({ deals: true, size: 12 }), api.products({ flash: true, size: 6 }), api.categories(), api.brands(),
    ])
    return { deals: [...deals.items.filter(p => !p.flash), ...deals.items.filter(p => p.flash)].slice(0, 6), flash: flash.items, cats, brands }
  }, [])

  return (
    <>
      <section className="hero">
        <div className="wrap heroin">
          <div>
            <small>Latest. Smart. For You.</small>
            <h1>Smart Devices for a Smarter Life</h1>
            <p>Explore the latest mobiles, laptops, electronics and more — all at unbeatable prices.</p>
            <Link className="btn" to="/products">Shop Now →</Link>
          </div>
          <div className="herogfx" aria-hidden="true">💻<span>📱</span><span>🎧</span><em>UP TO<br /><b>50%</b><br />OFF</em></div>
        </div>
      </section>

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (
        <>
          <section className="wrap sec">
            <div className="sh"><h2>Shop by Category</h2><Link to="/products">View All →</Link></div>
            <div className="cat8">
              {data.cats.map(c => <Link key={c} className="catc" to={`/products?cat=${encodeURIComponent(c)}`}><i>{catIcon(c)}</i>{c}</Link>)}
            </div>
          </section>
          {data.deals.length > 0 && <Row title="Best Deals of the Day" to="/products?deals=1" items={data.deals} />}
          <section className="wrap two">
            <div className="promo dark"><h3>iPhone 15</h3><p>New camera. New possibilities.</p><Link className="btn light" to="/products?cat=Mobiles">Shop Now →</Link></div>
            <div className="promo blue"><h3>Up to 70% Off</h3><p>Top Electronics Brands</p><Link className="btn" to="/products?cat=Electronics">Shop Now →</Link></div>
          </section>
          {data.flash.length > 0 && <Row title="⚡ Flash Sale" to="/products?deals=1" items={data.flash} />}
          <section className="wrap sec">
            <div className="why">
              <h2>Why Shop with EDXKart?</h2>
              <div className="why4">
                {[['🚚', 'Free Shipping', 'On orders above ₹499'], ['🛡️', 'Secure Payments', '100% secure checkout'], ['↩️', 'Easy Returns', 'Hassle free returns'], ['🎧', '24/7 Support', 'We are here to help']].map(([i, t, s]) => (
                  <div key={t}><i>{i}</i><b>{t}</b><span>{s}</span></div>
                ))}
              </div>
            </div>
          </section>
          <section className="wrap sec">
            <div className="sh"><h2>Top Brands</h2></div>
            <div className="brands">{data.brands.map(b => <Link key={b} to={`/products?brand=${encodeURIComponent(b)}`}>{b}</Link>)}</div>
          </section>
        </>
      )}

      <section className="wrap sec">
        <form className="news" onSubmit={e => { e.preventDefault(); setSubscribed(true); setEmail('') }}>
          <div><h3>Stay Updated</h3><p>{subscribed ? 'Thanks for subscribing. Your first offers are on the way.' : 'Get the latest deals, new arrivals and exclusive offers in your inbox.'}</p></div>
          {!subscribed && <><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email address" aria-label="Email address" /><button className="btn">Subscribe</button></>}
        </form>
      </section>
    </>
  )
}
