import { Suspense } from 'react'
import AccountDetailsPanel from '@/app/account/_panels/AccountDetailsPanel'
import LogoutButton from '@/app/account/_components/LogoutButton'
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

export default function AccountPage() {

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
              <span
                className={`${styles.navItem} ${styles.navItemActive}`}
                aria-current="page"
              >
                Account details
              </span>
            </li>
            <li>
              <span className={`${styles.navItem} ${styles.navItemDisabled}`}>
                Children
              </span>
            </li>
            <li>
              <span className={`${styles.navItem} ${styles.navItemDisabled}`}>
                Bookings
              </span>
            </li>
            <li>
              <span className={`${styles.navItem} ${styles.navItemDisabled}`}>
                Membership
              </span>
            </li>
            <li>
              <span className={`${styles.navItem} ${styles.navItemDisabled}`}>
                Security
              </span>
            </li>
          </ul>
        </nav>

        <section className={styles.settingsContent}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h2>Account Details</h2>
              </div>
              <button className={styles.ghost} disabled>
                Edit (Coming soon)
              </button>
            </div>

            <Suspense fallback={<PanelSkeleton />}>
              <AccountDetailsPanel />
            </Suspense>
          </div>

          <LogoutButton />
        </section>
      </div>
    </div>
  )
}
