'use client'

import { useEffect, useState } from 'react'
import { logAuthValidation } from '@/lib/authValidationDebug'
import { supabase } from '@/lib/supabaseClient'

export default function TestMePage() {
  const [result, setResult] = useState('Loading…')

  useEffect(() => {
    logAuthValidation({
      method: 'getUser',
      source: 'app/(marketing)/test-me/page.tsx',
    })
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        setResult(`Error: ${error.message}`)
      } else if (!data.user) {
        setResult('No user logged in')
      } else {
        setResult(
          `Logged in as: ${data.user.email} (id: ${data.user.id})`
        )
      }
    })
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h1>Auth test</h1>
      <p>{result}</p>
    </div>
  )
}
