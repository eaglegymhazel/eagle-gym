import Link from 'next/link'
import { Suspense } from 'react'
import AccountDetailsPanel from '@/app/account/_panels/AccountDetailsPanel'
import ChildrenPanel from '@/app/account/_panels/ChildrenPanel'
import styles from '@/app/account/account.module.css'


function PanelSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonRow} />
      <div className={styles.skeletonRow} />
      <div className={styles.skeletonRow} />
      <div className={styles.skeletonRow} />
      <div className={styles.skeletonRow} />
    </div>
  )
}

type AccountPageProps = {
  searchParams?: Promise<{ tab?: string }>
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined
  const tab = resolvedParams?.tab === 'children' ? 'children' : 'details'

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1>Account</h1>
        <p className={styles.subheading}>
          Manage your details and family profiles
        </p>
      </header>

      <div className={styles.settings}>
        <nav className={styles.settingsNav} aria-label="Account sections">
          <ul>
            <li>
              <Link
                className={`${styles.navItem} ${
                  tab === 'details' ? styles.navItemActive : ''
                }`}
                aria-current={tab === 'details' ? 'page' : undefined}
                href="/account?tab=details"
              >
                Account details
              </Link>
            </li>
            <li>
              <Link
                className={`${styles.navItem} ${
                  tab === 'children' ? styles.navItemActive : ''
                }`}
                aria-current={tab === 'children' ? 'page' : undefined}
                href="/account?tab=children"
              >
                Children
              </Link>
            </li>
          </ul>
        </nav>

        <section className={styles.settingsContent}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h2>{tab === 'children' ? 'Children' : 'Account Details'}</h2>
              </div>
              {tab === 'children' ? null : (
                <button className={styles.ghost} disabled>
                  Edit (Coming soon)
                </button>
              )}
            </div>

            <Suspense fallback={<PanelSkeleton />}>
              {tab === 'children' ? <ChildrenPanel /> : <AccountDetailsPanel />}
            </Suspense>
          </div>
        </section>
      </div>
    </div>
  )
}
