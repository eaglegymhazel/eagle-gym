"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
        photoConsent: boolean | null
      }[]
      medicalByChildId: Record<string, any>
      bookingsByChildId: Record<string, any[]>
      childDetailsIncluded: boolean
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
      childDetailsIncluded: false
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

type EditableFields = {
  accFirstName: string
  accLastName: string
  accTelNo: string
  accEmergencyTelNo: string
  accAddress: string
}

type DetailRow = {
  key: keyof EditableFields
  label: string
  value: string | null
}

const NAME_PATTERN = /^[A-Za-z]+$/
const PHONE_PATTERN = /^[0-9]+$/
const ADDRESS_PATTERN = /^[A-Za-z0-9 ]*$/

const sanitizeEditableValue = (field: keyof EditableFields, value: string) => {
  if (field === "accFirstName" || field === "accLastName") {
    return value.replace(/[^A-Za-z]/g, "")
  }
  if (field === "accTelNo" || field === "accEmergencyTelNo") {
    return value.replace(/[^0-9]/g, "")
  }
  return value.replace(/[^A-Za-z0-9 ]/g, "")
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
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [tab, setTab] = useState<TabKey>("details")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<BootstrapResponse | null>(null)
  const [childrenResetKey, setChildrenResetKey] = useState(0)
  const [isChildDetail, setIsChildDetail] = useState(false)
  const [bookMessage, setBookMessage] = useState<string | null>(null)
  const [isChildModalOpen, setIsChildModalOpen] = useState(false)
  const [loadingChildDetails, setLoadingChildDetails] = useState(false)
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [isSavingDetails, setIsSavingDetails] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof EditableFields, string>>>({})
  const [editableFields, setEditableFields] = useState<EditableFields>({
    accFirstName: "",
    accLastName: "",
    accTelNo: "",
    accEmergencyTelNo: "",
    accAddress: "",
  })

  const loadBootstrap = useCallback(async (
    includeChildDetails: boolean,
    isActive: () => boolean
  ) => {
    const res = await fetch("/api/account/bootstrap", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ includeChildDetails }),
    })

    if (res.status === 401) {
      window.location.href = "/login"
      return null
    }

    const json = (await res.json()) as BootstrapResponse
    if (!isActive()) return null
    if ("error" in json) {
      throw new Error(json.error)
    }
    if (json.status === "missing") {
      router.replace("/complete-profile")
      return null
    }

    return json
  }, [router])

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)")
    const syncViewport = () => setIsMobileViewport(media.matches)
    syncViewport()
    media.addEventListener("change", syncViewport)
    return () => media.removeEventListener("change", syncViewport)
  }, [])

  useEffect(() => {
    let isActive = true
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const json = await loadBootstrap(false, () => isActive)
        if (json) {
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
  }, [loadBootstrap])

  const rows = useMemo<DetailRow[]>(() => {
    if (!data || "error" in data || data.status !== "existing" || !data.account) {
      return []
    }
    const account = data.account
    return [
      { key: "accFirstName", label: "First name", value: account.accFirstName },
      { key: "accLastName", label: "Last name", value: account.accLastName },
      { key: "accTelNo", label: "Contact number", value: account.accTelNo },
      { key: "accEmergencyTelNo", label: "Emergency contact number", value: account.accEmergencyTelNo },
      { key: "accAddress", label: "Address", value: account.accAddress },
    ]
  }, [data])

  useEffect(() => {
    if (!data || "error" in data || data.status !== "existing" || !data.account) {
      return
    }

    setEditableFields({
      accFirstName: data.account.accFirstName ?? "",
      accLastName: data.account.accLastName ?? "",
      accTelNo: data.account.accTelNo ?? "",
      accEmergencyTelNo: data.account.accEmergencyTelNo ?? "",
      accAddress: data.account.accAddress ?? "",
    })
  }, [data])

  const handleEditableFieldChange = (field: keyof EditableFields, value: string) => {
    const sanitizedValue = sanitizeEditableValue(field, value)
    setEditableFields((prev) => ({ ...prev, [field]: sanitizedValue }))
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleEditToggle = () => {
    if (isEditingDetails) {
      setIsEditingDetails(false)
      setSaveError(null)
      setSaveSuccess(null)
      setFieldErrors({})
      if (data && "error" in data === false && data.status === "existing" && data.account) {
        setEditableFields({
          accFirstName: data.account.accFirstName ?? "",
          accLastName: data.account.accLastName ?? "",
          accTelNo: data.account.accTelNo ?? "",
          accEmergencyTelNo: data.account.accEmergencyTelNo ?? "",
          accAddress: data.account.accAddress ?? "",
        })
      }
      return
    }

    setSaveError(null)
    setSaveSuccess(null)
    setFieldErrors({})
    setIsEditingDetails(true)
  }

  const handleSaveDetails = async () => {
    const payload = {
      accFirstName: editableFields.accFirstName.trim(),
      accLastName: editableFields.accLastName.trim(),
      accTelNo: editableFields.accTelNo.trim(),
      accEmergencyTelNo: editableFields.accEmergencyTelNo.trim(),
      accAddress: editableFields.accAddress.trim(),
    }

    if (!payload.accFirstName || !payload.accLastName || !payload.accTelNo || !payload.accEmergencyTelNo) {
      setSaveError("First name, last name, contact number and emergency contact number are required.")
      setSaveSuccess(null)
      return
    }

    const nextFieldErrors: Partial<Record<keyof EditableFields, string>> = {}

    if (!NAME_PATTERN.test(payload.accFirstName)) {
      nextFieldErrors.accFirstName = "First name can contain letters only (no spaces)."
    }
    if (!NAME_PATTERN.test(payload.accLastName)) {
      nextFieldErrors.accLastName = "Last name can contain letters only (no spaces)."
    }
    if (!PHONE_PATTERN.test(payload.accTelNo)) {
      nextFieldErrors.accTelNo = "Contact number can contain numbers only."
    }
    if (!PHONE_PATTERN.test(payload.accEmergencyTelNo)) {
      nextFieldErrors.accEmergencyTelNo = "Emergency contact number can contain numbers only."
    }
    if (payload.accAddress && !ADDRESS_PATTERN.test(payload.accAddress)) {
      nextFieldErrors.accAddress = "Address can contain letters, numbers and spaces only."
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      setSaveError("Please correct the highlighted fields.")
      setSaveSuccess(null)
      return
    }

    setFieldErrors({})

    setIsSavingDetails(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const response = await fetch("/api/account/update", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.status === 401) {
        window.location.href = "/login"
        return
      }

      const json = await response.json()
      if (!response.ok || !json?.ok || !json?.account) {
        throw new Error(json?.error ?? "Unable to save account details.")
      }

      const updatedAccount = json.account as AccountDetails
      setData((prev) => {
        if (!prev || "error" in prev || prev.status !== "existing") {
          return prev
        }

        return {
          ...prev,
          account: {
            ...prev.account,
            accFirstName: updatedAccount.accFirstName ?? null,
            accLastName: updatedAccount.accLastName ?? null,
            accTelNo: updatedAccount.accTelNo ?? null,
            accEmergencyTelNo: updatedAccount.accEmergencyTelNo ?? null,
            accAddress: updatedAccount.accAddress ?? null,
          },
        }
      })
      setIsEditingDetails(false)
      setSaveSuccess("Account details saved.")
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unable to save account details.")
    } finally {
      setIsSavingDetails(false)
    }
  }

  const handleTab = (nextTab: TabKey) => {
    if (nextTab === "children") {
      setChildrenResetKey((prev) => prev + 1)
      const shouldLoadChildDetails =
        !!data &&
        "error" in data === false &&
        data.status === "existing" &&
        !data.childDetailsIncluded &&
        !loadingChildDetails
      if (shouldLoadChildDetails) {
        setLoadingChildDetails(true)
        void loadBootstrap(true, () => true)
          .then((json) => {
            if (json) {
              setData(json)
            }
          })
          .catch((err) => {
            setError(err instanceof Error ? err.message : "Unknown error")
          })
          .finally(() => {
            setLoadingChildDetails(false)
          })
      }
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
          <div className={styles.pageTitleBlock}>
            <h1 className={styles.pageTitle}>Account</h1>
            <p className={styles.subheading}>
              Manage your details and family profiles
            </p>
          </div>
        </div>
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
          {tab === "children" && isChildDetail ? null : !isMobileViewport ? (
            <div className={styles.navPrimaryActionWrap}>
              <button
                type="button"
                className={`${styles.childActionButton} ${styles.navPrimaryAction}`}
                onClick={handleBookClassClick}
              >
                Book Class
              </button>
            </div>
          ) : null}
        </nav>

        <section className={styles.settingsContent}>
          <div className={styles.card}>
            {bookMessage ? (
              <div className={styles.bookMessage} role="status">
                {bookMessage}
              </div>
            ) : null}
            {tab === "children" && isChildDetail ? null : (
              <div
                className={`${styles.cardHeader} ${
                  tab === "children" ? styles.childrenCardHeader : ""
                }`}
              >
                <div>
                  <h2>{tab === "children" ? "Children" : "Account Details"}</h2>
                </div>
                {tab === "children" ? (
                  <div className={styles.headerAction}>
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={() => router.push("/account/children/add")}
                    >
                      Add Child
                    </button>
                  </div>
                ) : (
                  <div className={styles.headerAction}>
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={handleEditToggle}
                    >
                      {isEditingDetails ? "Cancel" : "Edit"}
                    </button>
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
                      <>
                        <dl className={styles.details}>
                          {rows.map((row) => (
                            <div key={row.label} className={styles.detailRow}>
                              <dt>{row.label}</dt>
                              <dd>
                                {isEditingDetails ? (
                                  <>
                                    {row.key === "accAddress" ? (
                                      <textarea
                                        className={styles.detailInput}
                                        rows={3}
                                        value={editableFields[row.key]}
                                        onChange={(event) =>
                                          handleEditableFieldChange(row.key, event.target.value)
                                        }
                                      />
                                    ) : (
                                      <input
                                        className={styles.detailInput}
                                        type="text"
                                        value={editableFields[row.key]}
                                        onChange={(event) =>
                                          handleEditableFieldChange(row.key, event.target.value)
                                        }
                                      />
                                    )}
                                    {fieldErrors[row.key] ? (
                                      <p className={styles.detailFieldError}>
                                        {fieldErrors[row.key]}
                                      </p>
                                    ) : null}
                                  </>
                                ) : row.value && row.value.trim() ? (
                                  row.value
                                ) : (
                                  "—"
                                )}
                              </dd>
                            </div>
                          ))}
                        </dl>
                        {saveError ? (
                          <p className={styles.detailSaveError} role="alert">
                            {saveError}
                          </p>
                        ) : null}
                        {saveSuccess ? (
                          <p className={styles.detailSaveSuccess} role="status">
                            {saveSuccess}
                          </p>
                        ) : null}
                        {isEditingDetails ? (
                          <div className={styles.detailActions}>
                            <button
                              type="button"
                              className={styles.childActionButton}
                              onClick={handleSaveDetails}
                              disabled={isSavingDetails}
                            >
                              {isSavingDetails ? "Saving..." : "Save"}
                            </button>
                          </div>
                        ) : null}
                      </>
                    )}
                  </>
                )}

                {tab === "children" && (
                  loadingChildDetails ? (
                    <PanelSkeleton />
                  ) : (
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
                  )
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

      {tab === "children" && isChildDetail ? null : isMobileViewport ? (
        <div className={styles.mobileBookBar}>
          <button
            type="button"
            className={`${styles.childActionButton} ${styles.mobileBookAction}`}
            onClick={handleBookClassClick}
          >
            Book Class
          </button>
        </div>
      ) : null}
    </div>
  )
}
