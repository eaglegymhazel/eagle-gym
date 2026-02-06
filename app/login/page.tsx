'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const onLogin = async () => {
    setMsg(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMsg(`Error: ${error.message}`)
    else setMsg('Logged in. Now go to /test-me')
  }

  const onLogout = async () => {
    setMsg(null)
    await supabase.auth.signOut()
    setMsg('Logged out.')
  }

  return (
    <div style={{ padding: 24, maxWidth: 420 }}>
      <h1>Login</h1>

      <label>Email</label>
      <input
        style={{ width: '100%', padding: 8, margin: '6px 0 12px' }}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />

      <label>Password</label>
      <input
        style={{ width: '100%', padding: 8, margin: '6px 0 12px' }}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
      />

      <button onClick={onLogin} style={{ padding: '8px 12px', marginRight: 8 }}>
        Log in
      </button>
      <button onClick={onLogout} style={{ padding: '8px 12px' }}>
        Log out
      </button>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  )
}
