import { Link, useLocation, useParams } from 'react-router-dom'
import { api } from '../api.js'
import { fmtDate, inr, useAsync } from '../utils.js'
import { ErrorState, Spinner } from '../components/Layout.jsx'

export default function OrderSuccess() {
  const { id } = useParams()
  const { state } = useLocation()
  const { data, error, loading, reload } = useAsync(() => state?.order && String(state.order.id) === id ? Promise.resolve(state.order) : api.order(id), [id])
  if (loading && !data) return <Spinner />
  if (error) return <div className="wrap"><ErrorState error={error} onRetry={reload} /></div>
  return (
    <div className="wrap success">
      <div className="tick" aria-hidden>✓</div>
      <h1>Order placed</h1>
      <p>Thank you! Your order <b>{data.orderNo}</b> for <b>{inr(data.total)}</b> is confirmed. Placed on {fmtDate(data.createdAt)}.</p>
      <div className="box left">
        <h3>Items</h3>
        {data.items.map((i, k) => <div className="miniline" key={k}><span>{i.icon} {i.name}{i.option ? ` (${i.option})` : ''} × {i.quantity}</span><b>{inr(i.price * i.quantity)}</b></div>)}
        <h3>Delivering to</h3>
        <p>{data.shipName} · {data.shipPhone}<br />{data.shipAddress}</p>
        <p className="muted">Payment: {data.paymentMethod}. Status updates appear live in your orders.</p>
      </div>
      <div className="actions"><Link className="btn" to={`/account/orders/${data.id}`}>Track order</Link><Link className="btn ghost" to="/products">Continue shopping</Link></div>
    </div>
  )
}
