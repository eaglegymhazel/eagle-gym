'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function TestCreateWebAccountPage() {
  const [result, setResult] = useState('Loading…')

  useEffect(() => {
    const run = async () => {
      const { data: userRes, error: userErr } = await supabase.auth.getUser()
      if (userErr) return setResult(`Error: ${userErr.message}`)
      if (!userRes.user) return setResult('No user logged in')

      const user = userRes.user

      // Check if row already exists
      const { data: existing, error: selErr } = await supabase
        .from('web_accounts')
        .select('id, email, auth_user_id')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (selErr) return setResult(`Error: ${selErr.message}`)
      if (existing) return setResult(`Already exists: ${JSON.stringify(existing)}`)

      // Create row
      const { data: inserted, error: insErr } = await supabase
        .from('web_accounts')
        .insert({
          auth_user_id: user.id,
          email: user.email,
          full_name: 'Test User'
        })
        .select('id, email, auth_user_id')
        .single()

      if (insErr) return setResult(`Error: ${insErr.message}`)
      setResult(`Created: ${JSON.stringify(inserted)}`)
    }

    run()
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h1>Create web_accounts row</h1>
      <p>{result}</p>
    </div>
  )
}
