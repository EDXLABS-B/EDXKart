import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api.js'
import { useAsync } from '../utils.js'
import ProductCard from '../components/ProductCard.jsx'
import { Empty, ErrorState, Spinner } from '../components/Layout.jsx'

const RANGES = [['Under ₹5,000', 0, 5000], ['₹5,000 - ₹10,000', 5000, 10000], ['₹10,000 - ₹20,000', 10000, 20000], ['₹20,000 - ₹50,000', 20000, 50000], ['Above ₹50,000', 50000, undefined]]
const SIZE = 12

export default function Products() {
  const [sp, setSp] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const cat = sp.get('cat') || ''
  const q = sp.get('q') || ''
  const brands = sp.getAll('brand')
  const price = sp.get('price')
  const sort = sp.get('sort') || 'pop'
  const deals = sp.get('deals') === '1'
  const page = Math.max(0, Number(sp.get('page') || 0))

  const update = patch => {
    const n = new URLSearchParams(sp)
    Object.entries(patch).forEach(([k, v]) => {
      n.delete(k)
      if (Array.isArray(v)) v.forEach(x => n.append(k, x))
      else if (v !== '' && v !== null && v !== undefined && v !== false) n.set(k, v === true ? '1' : v)
    })
    if (!('page' in patch)) n.delete('page')
    setSp(n)
  }

  const meta = useAsync(async () => { const [categories, brandList] = await Promise.all([api.categories(), api.brands()]); return { categories, brandList } }, [])
  const range = price !== null && RANGES[price] ? RANGES[price] : null
  const list = useAsync(() => api.products({ q, category: cat, brand: brands, minPrice: range ? range[1] : undefined, maxPrice: range ? range[2] : undefined, deals, sort, page, size: SIZE }), [sp.toString()])

  const total = list.data?.total || 0
  const pages = Math.ceil(total / SIZE)
  const title = cat || (q ? `Results for "${q}"` : deals ? 'Offers' : 'All Products')
  const filtered = cat || q || brands.length || range || deals

  return (
    <div className="wrap plist">
      <button className="btn ghost filter-toggle" onClick={() => setShowFilters(s => !s)}>{showFilters ? 'Hide filters' : 'Filters'}</button>
      <aside className={'filters' + (showFilters ? ' open' : '')}>
        <h4>All Categories</h4>
        <button className={!cat ? 'on' : ''} onClick={() => update({ cat: '' })}>All</button>
        {meta.data?.categories.map(c => <button key={c} className={cat === c ? 'on' : ''} onClick={() => update({ cat: c })}>{c}</button>)}
        <h4>Price Range</h4>
        {RANGES.map((r, i) => <label key={r[0]}><input type="radio" name="price" checked={price === String(i)} onChange={() => update({ price: i })} />{r[0]}</label>)}
        {range && <button className="link" onClick={() => update({ price: '' })}>Clear price</button>}
        <h4>Brand</h4>
        {meta.data?.brandList.map(b => (
          <label key={b}><input type="checkbox" checked={brands.includes(b)} onChange={() => update({ brand: brands.includes(b) ? brands.filter(x => x !== b) : [...brands, b] })} />{b}</label>
        ))}
        <label className="deal"><input type="checkbox" checked={deals} onChange={() => update({ deals: !deals })} />40%+ off only</label>
        {filtered && <button className="btn ghost full" onClick={() => setSp({})}>Clear all filters</button>}
      </aside>

      <section>
        <div className="sh">
          <div><h2>{title}</h2>{list.data && <small>Showing {list.data.items.length} of {total} products</small>}</div>
          <select value={sort} onChange={e => update({ sort: e.target.value })} aria-label="Sort products">
            <option value="pop">Sort by: Popularity</option>
            <option value="price">Price: Low to High</option>
            <option value="priceD">Price: High to Low</option>
            <option value="rate">Rating</option>
          </select>
        </div>
        {list.loading && !list.data && <Spinner />}
        {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
        {list.data && (list.data.items.length
          ? <div className={'grid4' + (list.loading ? ' dim' : '')}>{list.data.items.map(p => <ProductCard key={p.id} p={p} />)}</div>
          : <Empty title="No products match your filters" text="Try removing a filter or searching for something else." to="/products" cta="Clear filters" />)}
        {pages > 1 && (
          <nav className="pager" aria-label="Pagination">
            <button className="btn ghost" disabled={page === 0} onClick={() => update({ page: page - 1 })}>← Previous</button>
            <span>Page {page + 1} of {pages}</span>
            <button className="btn ghost" disabled={page + 1 >= pages} onClick={() => update({ page: page + 1 })}>Next →</button>
          </nav>
        )}
        <p className="muted"><Link to="/">← Back to home</Link></p>
      </section>
    </div>
  )
}
