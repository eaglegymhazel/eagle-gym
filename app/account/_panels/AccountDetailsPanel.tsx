import { redirect } from 'next/navigation'
import {
  getBootstrapAccount,
  type BootstrapAccountResult,
} from '@/lib/server/bootstrapAccount'
import styles from '@/app/account/account.module.css'

function EmptyState() {
  return (
    <div className={styles.empty}>
      <p>No account details yet.</p>
      <button className={styles.primary} disabled>
        Add your first child
      </button>
    </div>
  )
}

export default async function AccountDetailsPanel() {
  let bootstrap: BootstrapAccountResult

  try {
    bootstrap = await getBootstrapAccount()
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown server error'
    return (
      <div className={styles.errorBanner} role="alert">
        <span>Unable to load account details: {message}</span>
        <form method="get">
          <input type="hidden" name="tab" value="details" />
          <button className={styles.retry} type="submit">
            Try again
          </button>
        </form>
      </div>
    )
  }

  if (bootstrap.status === 'unauthorized') {
    redirect('/login')
  }

  if (bootstrap.status === 'missing') {
    return <EmptyState />
  }

  const { account } = bootstrap
  const rows = [
    { label: 'First name', value: account.accFirstName },
    { label: 'Last name', value: account.accLastName },
    { label: 'Contact number', value: account.accTelNo },
    { label: 'Emergency contact number', value: account.accEmergencyTelNo },
    { label: 'Address', value: account.accAddress },
  ]

  return (
    <dl className={styles.details}>
      {rows.map((row) => (
        <div key={row.label} className={styles.detailRow}>
          <dt>{row.label}</dt>
          <dd>{row.value && row.value.trim() ? row.value : '—'}</dd>
        </div>
      ))}
    </dl>
  )
}
