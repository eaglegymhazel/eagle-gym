'use client'

import { supabase } from '@/lib/supabaseClient'
import styles from '@/app/account/account.module.css'

export default function LogoutButton() {
  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <button onClick={logout} className={styles.logout}>
      Log out
    </button>
  )
}
