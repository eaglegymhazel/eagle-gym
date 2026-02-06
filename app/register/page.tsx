'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  const onRegister = async () => {
    setMsg(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setMsg(`Error: ${error.message}`)
      return
    }

    setMsg('Confirmation sent. Please check your email and follow the link to complete registration.')
  }

  return (
    <div style={{ padding: 24, maxWidth: 420 }}>
      <h1>Register</h1>

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
        autoComplete="new-password"
      />

      <button onClick={onRegister} style={{ padding: '8px 12px' }}>
        Create account
      </button>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  )
}
