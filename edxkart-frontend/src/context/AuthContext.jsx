import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, setToken, setUnauthorizedHandler } from '../api.js'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))
    if (!getToken()) { setReady(true); return }
    api.me().then(setUser).catch(() => setToken(null)).finally(() => setReady(true))
  }, [])

  const finish = useCallback(res => { setToken(res.token); setUser(res.user); return res.user }, [])
  const login = useCallback(async (email, password) => finish(await api.login({ email, password })), [finish])
  const register = useCallback(async body => finish(await api.register(body)), [finish])
  const logout = useCallback(() => { setToken(null); setUser(null) }, [])

  const value = useMemo(() => ({ user, ready, login, register, logout, setUser }), [user, ready, login, register, logout])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
