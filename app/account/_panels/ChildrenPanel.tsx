import { redirect } from 'next/navigation'
import styles from '@/app/account/account.module.css'
import {
  getBootstrapAccount,
  type BootstrapAccountResult,
} from '@/lib/server/bootstrapAccount'
import { getChildrenForAccount } from '@/lib/server/children'
import { getMedicalInfoForChildren } from '@/lib/server/medical'
import ChildrenClientPanel from '@/app/account/_panels/ChildrenClientPanel'

export default async function ChildrenPanel() {
  let bootstrap: BootstrapAccountResult

  try {
    bootstrap = await getBootstrapAccount()
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown server error'
    return (
      <div className={styles.errorBanner} role="alert">
        <span>Unable to load children: {message}</span>
      </div>
    )
  }

  if (bootstrap.status === 'unauthorized') {
    redirect('/login')
  }

  if (bootstrap.status === 'missing') {
    return (
      <div className={styles.empty}>
        <p>There are no children on this account.</p>
      </div>
    )
  }

  let children = []
  try {
    children = await getChildrenForAccount(bootstrap.account.id)
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown server error'
    return (
      <div className={styles.errorBanner} role="alert">
        <span>Unable to load children: {message}</span>
      </div>
    )
  }

  if (!children.length) {
    return (
      <div className={styles.empty}>
        <p>There are no children on this account.</p>
      </div>
    )
  }

  let medicalByChildId = {}
  try {
    medicalByChildId = await getMedicalInfoForChildren(
      children.map((child) => child.id)
    )
  } catch {
    medicalByChildId = {}
  }

  return (
    <ChildrenClientPanel
      children={children}
      medicalByChildId={medicalByChildId}
    />
  )
}
