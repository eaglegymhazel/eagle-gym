"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import styles from "./account.module.css"
import ChildrenClientPanel from "./_panels/ChildrenClientPanel"
import ChildSelectModal from "./_components/ChildSelectModal"

type AccountDetails = {
  id: string
  email: string | null
  accFirstName: string | null
  accLastName: string | null
  accTelNo: string | null
  accEmergencyTelNo: string | null
  accAddress: string | null
}

type BootstrapResponse =
  | {
      ok: true
      status: "existing"
      account: AccountDetails
      children: {
        id: string
        firstName: string | null
        lastName: string | null
        dateOfBirth: string | null
      }[]
      medicalByChildId: Record<string, any>
      bookingsByChildId: Record<string, any[]>
      accountExists: true
      profileComplete: boolean
      nextRoute: string
    }
  | {
      ok: true
      status: "missing"
      account: null
      children: []
      medicalByChildId: Record<string, any>
      bookingsByChildId: Record<string, any[]>
      accountExists: false
      profileComplete: false
      nextRoute: string
    }
  | { error: string }

type TabKey = "details" | "children"
type NavItem = {
  key: TabKey
  label: string
  group?: string
}

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

export default function AccountShell() {
  const router = useRouter()
  const [tab, setTab] = useState<TabKey>("details")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<BootstrapResponse | null>(null)
  const [childrenResetKey, setChildrenResetKey] = useState(0)
  const [isChildDetail, setIsChildDetail] = useState(false)
  const [bookMessage, setBookMessage] = useState<string | null>(null)
  const [isChildModalOpen, setIsChildModalOpen] = useState(false)

  useEffect(() => {
    let isActive = true
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/account/bootstrap", {
          method: "POST",
          credentials: "include",
        })
        if (res.status === 401) {
          window.location.href = "/login"
          return
        }
        const json = (await res.json()) as BootstrapResponse
        if (!isActive) return
        if ("error" in json) {
          setError(json.error)
        } else {
          if (json.status === "missing") {
            router.replace("/complete-profile")
            return
          }
          setData(json)
        }
      } catch (err) {
        if (!isActive) return
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        if (isActive) setLoading(false)
      }
    }
    run()
    return () => {
      isActive = false
    }
  }, [])

  const rows = useMemo(() => {
    if (!data || "error" in data || data.status !== "existing" || !data.account) {
      return []
    }
    const account = data.account
    return [
      { label: "First name", value: account.accFirstName },
      { label: "Last name", value: account.accLastName },
      { label: "Contact number", value: account.accTelNo },
      { label: "Emergency contact number", value: account.accEmergencyTelNo },
      { label: "Address", value: account.accAddress },
    ]
  }, [data])

  const handleTab = (nextTab: TabKey) => {
    if (nextTab === "children") {
      setChildrenResetKey((prev) => prev + 1)
    }
    setBookMessage(null)
    setTab(nextTab)
    router.replace(`/account?tab=${nextTab}`)
  }

  const handleBookClassClick = () => {
    setBookMessage(null)
    const children = data && "error" in data === false ? data.children : []
    const count = children.length
    if (count === 0) {
      setBookMessage("Add a child to book classes.")
      setTab("children")
      return
    }
    if (count === 1) {
      const child = children[0]
      router.push(`/book?childId=${child.id}`)
      return
    }
    setIsChildModalOpen(true)
  }

  const navItems: NavItem[] = [
    { key: "details", label: "Account details" },
    { key: "children", label: "Children" },
  ]

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.accent} aria-hidden="true" />
        <div className={styles.pageTitleRow}>
          <h1 className={styles.pageTitle}>Account</h1>
          {tab === "children" && isChildDetail ? null : (
            <button
              type="button"
              className={styles.childActionButton}
              onClick={handleBookClassClick}
            >
              Book Class
            </button>
          )}
        </div>
        <p className={styles.subheading}>
          Manage your details and family profiles
        </p>
      </header>

      <div className={styles.settings}>
        <nav className={styles.settingsNav} aria-label="Account sections">
          <ul>
            {navItems.map((item, index) => {
              const showGroupHeading =
                item.group &&
                (index === 0 || navItems[index - 1]?.group !== item.group)
              return (
                <li key={item.key}>
                  {showGroupHeading ? (
                    <p className={styles.navGroup}>{item.group}</p>
                  ) : null}
                  <button
                    type="button"
                    className={`${styles.navItem} ${
                      tab === item.key ? styles.navItemActive : ""
                    }`}
                    aria-current={tab === item.key ? "page" : undefined}
                    onClick={() => handleTab(item.key)}
                  >
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <section className={styles.settingsContent}>
          <div className={styles.card}>
            {bookMessage ? (
              <div className={styles.bookMessage} role="status">
                {bookMessage}
              </div>
            ) : null}
            {tab === "children" && isChildDetail ? null : (
              <div className={styles.cardHeader}>
                <div>
                  <h2>{tab === "children" ? "Children" : "Account Details"}</h2>
                </div>
                {tab === "children" ? (
                  <div className={styles.headerAction}>
                    <button type="button" className={styles.editButton}>
                      Add Child
                    </button>
                    <button
                      type="button"
                      className={styles.infoIcon}
                      aria-label="Add child info"
                    >
                      i
                    </button>
                    <span className={styles.infoTooltip} role="tooltip">
                      Add a new child to your account so you can manage their
                      details and book them into classes under this account.
                    </span>
                  </div>
                ) : (
                  <div className={styles.headerAction}>
                    <button type="button" className={styles.editButton}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className={styles.infoIcon}
                      aria-label="Edit account details info"
                    >
                      i
                    </button>
                    <span className={styles.infoTooltip} role="tooltip">
                      Update your contact information and emergency telephone
                      number.
                    </span>
                  </div>
                )}
              </div>
            )}

            {loading && <PanelSkeleton />}

            {!loading && error && (
              <div className={styles.errorBanner} role="alert">
                <span>{error}</span>
              </div>
            )}

            {!loading && !error && data && "error" in data === false && (
              <>
                {tab === "details" && (
                  <>
                    {data.status === "missing" && (
                      <div className={styles.empty}>
                        <p>No account details yet.</p>
                        <button className={styles.primary} disabled>
                          Add your first child
                        </button>
                      </div>
                    )}
                    {data.status === "existing" && (
                      <dl className={styles.details}>
                        {rows.map((row) => (
                          <div key={row.label} className={styles.detailRow}>
                            <dt>{row.label}</dt>
                            <dd>{row.value && row.value.trim() ? row.value : "—"}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </>
                )}

                {tab === "children" && (
                  <ChildrenClientPanel
                    key={`children-${childrenResetKey}`}
                    children={data.children}
                    medicalByChildId={data.medicalByChildId}
                    bookingsByChildId={data.bookingsByChildId}
                    onSelectionChange={setIsChildDetail}
                    onBookChild={(childId) => {
                      router.push(`/book?childId=${childId}`)
                    }}
                  />
                )}
                <ChildSelectModal
                  isOpen={isChildModalOpen}
                  onClose={() => setIsChildModalOpen(false)}
                  children={data.children}
                  onSelect={(child) => {
                    setIsChildModalOpen(false)
                    router.push(`/book?childId=${child.id}`)
                  }}
                />
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
