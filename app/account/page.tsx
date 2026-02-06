'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AccountPage() {
  const [result, setResult] = useState('Loading…')

  useEffect(() => {
    const run = async () => {
      const { data: userRes, error: userErr } = await supabase.auth.getUser()
      if (userErr) {
        setResult(`Error: ${userErr.message}`)
        return
      }

      if (!userRes.user) {
        setResult('Not logged in')
        return
      }

      const user = userRes.user

      // 1) Try to fetch existing web_accounts row
      const { data: existing, error: fetchError } = await supabase
        .from('web_accounts')
        .select('email, full_name')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (fetchError) {
        setResult(`Error: ${fetchError.message}`)
        return
      }

      // 2) If none exists, create it (first login / first visit)
      if (!existing) {
        const { error: insertError } = await supabase
          .from('web_accounts')
          .insert({
            auth_user_id: user.id,
            email: user.email,
          })

        if (insertError) {
          setResult(`Error: ${insertError.message}`)
          return
        }

        setResult(`Account created for ${user.email}`)
        return
      }

      // 3) Show existing account email
      setResult(`Account email: ${existing.email}`)
    }

    run()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>My account</h1>
      <p>{result}</p>

      <button onClick={logout} style={{ padding: '8px 12px', marginTop: 12 }}>
        Log out
      </button>
    </div>
  )
}
