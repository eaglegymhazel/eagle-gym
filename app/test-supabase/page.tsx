'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function TestSupabasePage() {
  const [result, setResult] = useState<string>('Loading…')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'MISSING'
  const keyPresent = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').length > 0

  useEffect(() => {
    supabase
      .from('Accounts')
      .select('*')
      .limit(1)
      .then(({ data, error }) => {
        if (error) setResult(`Error: ${error.message}`)
        else setResult(`Result: ${JSON.stringify(data)}`)
      })
      .catch((e) => setResult(`Error: ${String(e)}`))
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h1>Supabase connection test</h1>
      <p><strong>URL:</strong> {url}</p>
      <p><strong>Anon key present:</strong> {keyPresent ? 'YES' : 'NO'}</p>
      <p>{result}</p>
    </div>
  )
}
