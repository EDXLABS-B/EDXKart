import { useCallback, useEffect, useRef, useState } from 'react'

export const inr = n => '₹' + Number(n || 0).toLocaleString('en-IN')
export const fmtDate = iso => iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
export const compact = n => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)

const ICONS = { Mobiles: '📱', Laptops: '💻', Electronics: '🎧', Fashion: '👕', 'Home & Living': '🛋️', Beauty: '🧴', Sports: '👟', 'Toys & Games': '🧸' }
export const catIcon = name => ICONS[name] || '🛍️'

/** Loads async data; optional silent polling keeps screens live. */
export function useAsync(fn, deps = [], pollMs = 0) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const fnRef = useRef(fn); fnRef.current = fn
  const seq = useRef(0)
  const run = useCallback(async silent => {
    const my = ++seq.current
    if (!silent) setState(s => ({ data: s.data, error: null, loading: true }))
    try {
      const data = await fnRef.current()
      if (my === seq.current) setState({ data, error: null, loading: false })
    } catch (error) {
      if (my !== seq.current) return
      if (silent) return
      setState({ data: null, error, loading: false })
    }
  }, [])
  useEffect(() => {
    run(false)
    if (!pollMs) return undefined
    const t = setInterval(() => { if (!document.hidden) run(true) }, pollMs)
    return () => { clearInterval(t); seq.current++ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, pollMs])
  return { ...state, reload: () => run(false), refresh: () => run(true), setData: d => setState(s => ({ ...s, data: d })) }
}
