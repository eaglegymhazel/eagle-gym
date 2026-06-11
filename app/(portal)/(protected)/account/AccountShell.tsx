"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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

type ChildSummary = {
  id: string
  firstName: string | null
  lastName: string | null
  dateOfBirth: string | null
  photoConsent: boolean | null
  pickedUp: string | null
  competitionEligible: boolean | null
}

type MedicalInformationRow = {
  childId: string
  medicalConditions: string | null
  medications: string | null
  disabilities: string | null
  behaviouralConditions: string | null
  allergies: string | null
  dietaryNeeds: string | null
  doctorName: string | null
  surgeryAddress: string | null
  surgeryTelephone: string | null
}

type BookingSummary = {
  bookingKind: "class" | "summer-camp" | "birthday-party"
  childId: string | null
  programme: "recreational" | "competition" | null
  stripeSubscriptionId: string | null
  className: string | null
  weekday: string | null
  startTime: string | null
  endTime: string | null
  durationMinutes: number | null
  campDate: string | null
  createdAt: string | null
  status: string | null
  partySize: number | null
  totalAmountPence: number | null
  birthdayChildFirstName: string | null
  birthdayChildLastName: string | null
  birthdayChildDateOfBirth: string | null
  slotDate: string | null
}

type BillingSummary = {
  subscriptionId: string
  programme: "recreational" | "competition"
  subscriptionStatus: string | null
  latestInvoiceDate: string | null
  latestInvoicePaidAt: string | null
  latestInvoiceAmountPence: number | null
  nextInvoiceDate: string | null
  nextInvoiceAmountPence: number | null
  currency: string | null
}

type ChildBadgeSkill = {
  id: string
  name: string
  description: string | null
  sortOrder: number
  completedAt: string | null
}

type ChildAssignedBadge = {
  assignmentId: string
  badgeId: string
  name: string
  description: string | null
  category: string | null
  isCompleted: boolean
  completedAt: string | null
  skills: ChildBadgeSkill[]
}

type BootstrapResponse =
  | {
      ok: true
      status: "existing"
      account: AccountDetails
      children: ChildSummary[]
      medicalByChildId: Record<string, MedicalInformationRow>
      accountBookings: BookingSummary[]
      accountBillingSummaries: BillingSummary[]
      badgesByChildId: Record<string, ChildAssignedBadge[]>
      childDetailsIncluded: boolean
      accountExists: true
      profileComplete: boolean
      nextRoute: string
      devImpersonatedEmail?: string | null
    }
  | {
      ok: true
      status: "missing"
      account: null
      children: []
      medicalByChildId: Record<string, MedicalInformationRow>
      accountBookings: BookingSummary[]
      accountBillingSummaries: BillingSummary[]
      badgesByChildId: Record<string, ChildAssignedBadge[]>
      childDetailsIncluded: false
      accountExists: false
      profileComplete: false
      nextRoute: string
      devImpersonatedEmail?: string | null
    }
  | { error: string }

type TabKey = "details" | "children" | "bookings"
type BookingsViewKey = "classes" | "billing" | "summer-camps" | "birthday-parties"
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
const WEEKDAY_ORDER = new Map([
  ["Monday", 1],
  ["Tuesday", 2],
  ["Wednesday", 3],
  ["Thursday", 4],
  ["Friday", 5],
  ["Saturday", 6],
  ["Sunday", 7],
])

const JS_DAY_TO_WEEKDAY = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const

const sanitizeEditableValue = (field: keyof EditableFields, value: string) => {
  if (field === "accFirstName" || field === "accLastName") {
    return value.replace(/[^A-Za-z]/g, "")
  }
  if (field === "accTelNo" || field === "accEmergencyTelNo") {
    return value.replace(/[^0-9]/g, "")
  }
  return value.replace(/[^A-Za-z0-9 ]/g, "")
}

const normalizeEditableFields = (account: AccountDetails): EditableFields => ({
  accFirstName: account.accFirstName?.replace(/[^A-Za-z]/g, "") ?? "",
  accLastName: account.accLastName?.replace(/[^A-Za-z]/g, "") ?? "",
  accTelNo: account.accTelNo?.replace(/\D/g, "") ?? "",
  accEmergencyTelNo: account.accEmergencyTelNo?.replace(/\D/g, "") ?? "",
  accAddress:
    account.accAddress
      ?.replace(/,/g, " ")
      .replace(/[^A-Za-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim() ?? "",
})

const formatAccountDate = (value: string | null) => {
  if (!value) return "-"
  const date = value.includes("T")
    ? new Date(value)
    : new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

const formatDateOfBirth = (value: string | null) => {
  if (!value) return "-"
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

const parseTimeToMinutes = (value: string | null) => {
  if (!value) return Number.MAX_SAFE_INTEGER
  const [hoursRaw, minutesRaw] = value.split(":")
  const hours = Number.parseInt(hoursRaw ?? "", 10)
  const minutes = Number.parseInt(minutesRaw ?? "", 10)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return Number.MAX_SAFE_INTEGER
  return hours * 60 + minutes
}

const getNextClassOccurrenceSortValue = (booking: BookingSummary) => {
  const weekday = booking.weekday?.trim() ?? ""
  const targetWeekday = WEEKDAY_ORDER.get(weekday)
  if (!targetWeekday) return Number.MAX_SAFE_INTEGER

  const now = new Date()
  const todayWeekday = WEEKDAY_ORDER.get(JS_DAY_TO_WEEKDAY[now.getDay()]) ?? 1
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const classMinutes = parseTimeToMinutes(booking.startTime)
  let dayOffset = targetWeekday - todayWeekday

  if (dayOffset < 0) {
    dayOffset += 7
  } else if (dayOffset === 0 && classMinutes <= nowMinutes) {
    dayOffset = 7
  }

  return dayOffset * 1440 + classMinutes
}

const formatPaidAmount = (value: number | null, currency = "GBP") => {
  if (typeof value !== "number") return null
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(value / 100)
}

const formatTimeRange = (startTime: string | null, endTime: string | null) => {
  if (startTime && endTime) return `${startTime}-${endTime}`
  return startTime ?? endTime ?? "-"
}

const formatSubscriptionStatus = (value: string | null) => {
  if (!value) return "-"
  return value.replaceAll("_", " ")
}

const getBirthdayTurningAge = (dateOfBirth: string | null, slotDate: string | null) => {
  if (!dateOfBirth || !slotDate) return null
  const birth = new Date(`${dateOfBirth}T12:00:00`)
  const party = new Date(`${slotDate}T12:00:00`)
  if (Number.isNaN(birth.getTime()) || Number.isNaN(party.getTime())) return null
  return party.getFullYear() - birth.getFullYear()
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
  const searchParams = useSearchParams()
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [tab, setTab] = useState<TabKey>("details")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<BootstrapResponse | null>(null)
  const [childrenResetKey, setChildrenResetKey] = useState(0)
  const [isChildDetail, setIsChildDetail] = useState(false)
  const [activeChildId, setActiveChildId] = useState<string | null>(null)
  const [bookMessage, setBookMessage] = useState<string | null>(null)
  const [isChildModalOpen, setIsChildModalOpen] = useState(false)
  const [loadingChildDetails, setLoadingChildDetails] = useState(false)
  const [bookingsView, setBookingsView] = useState<BookingsViewKey>("classes")
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
    isActive: () => boolean,
    forceFresh = false
  ) => {
    const requestBootstrap = async () =>
      fetch("/api/account/bootstrap", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ includeChildDetails, forceFresh }),
      })

    let res: Response

    try {
      res = await requestBootstrap()
    } catch (error) {
      if (!isActive()) return null
      await new Promise((resolve) => window.setTimeout(resolve, 250))
      if (!isActive()) return null
      res = await requestBootstrap().catch(() => {
        throw error
      })
    }

    if (res.status === 401) {
      await new Promise((resolve) => window.setTimeout(resolve, 250))
      if (!isActive()) return null

      res = await requestBootstrap()

      if (res.status === 401) {
        window.location.href = "/login"
        return null
      }
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
    const requestedTab = searchParams.get("tab")
    if (
      requestedTab === "details" ||
      requestedTab === "children" ||
      requestedTab === "bookings"
    ) {
      setTab(requestedTab)
    }
  }, [searchParams])

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
        const forceFresh = searchParams.get("refresh") === "bookings"
        const activeTab = searchParams.get("tab")
        const includeChildDetails =
          forceFresh || activeTab === "bookings" || activeTab === "children"
        const json = await loadBootstrap(includeChildDetails, () => isActive, forceFresh)
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
  }, [loadBootstrap, searchParams])

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

  const childNameById = useMemo(() => {
    const map = new Map<string, string>()
    if (!data || "error" in data || data.status !== "existing") {
      return map
    }

    data.children.forEach((child) => {
      const name = `${child.firstName?.trim() ?? ""} ${child.lastName?.trim() ?? ""}`.trim()
      map.set(child.id, name || "Child")
    })

    return map
  }, [data])

  const groupedBookings = useMemo(() => {
    const grouped = {
      classes: [] as BookingSummary[],
      summerCamps: [] as BookingSummary[],
      birthdayParties: [] as BookingSummary[],
    }

    if (!data || "error" in data || data.status !== "existing") {
      return grouped
    }

    data.accountBookings.forEach((booking) => {
      if (booking.bookingKind === "class") {
        grouped.classes.push(booking)
        return
      }
      if (booking.bookingKind === "summer-camp") {
        grouped.summerCamps.push(booking)
        return
      }
      grouped.birthdayParties.push(booking)
    })

    grouped.classes.sort((a, b) => {
      const aOrder = getNextClassOccurrenceSortValue(a)
      const bOrder = getNextClassOccurrenceSortValue(b)
      if (aOrder !== bOrder) return aOrder - bOrder
      return `${a.weekday ?? ""}${a.startTime ?? ""}${a.className ?? ""}`.localeCompare(
        `${b.weekday ?? ""}${b.startTime ?? ""}${b.className ?? ""}`
      )
    })

    grouped.summerCamps.sort((a, b) =>
      `${a.campDate ?? ""}${a.startTime ?? ""}`.localeCompare(
        `${b.campDate ?? ""}${b.startTime ?? ""}`
      )
    )

    grouped.birthdayParties.sort((a, b) =>
      `${a.slotDate ?? ""}${a.startTime ?? ""}`.localeCompare(
        `${b.slotDate ?? ""}${b.startTime ?? ""}`
      )
    )

    return grouped
  }, [data])

  const billingSummaries = useMemo(() => {
    if (!data || "error" in data || data.status !== "existing") return []
    return [...data.accountBillingSummaries].sort((a, b) =>
      a.programme.localeCompare(b.programme)
    )
  }, [data])

  const availableBookingsViews = useMemo(() => {
    const views: Array<{ key: BookingsViewKey; label: string }> = []
    if (groupedBookings.classes.length > 0) views.push({ key: "classes", label: "Class bookings" })
    if (billingSummaries.length > 0) views.push({ key: "billing", label: "Billing" })
    if (groupedBookings.summerCamps.length > 0) views.push({ key: "summer-camps", label: "Summer camps" })
    if (groupedBookings.birthdayParties.length > 0) views.push({ key: "birthday-parties", label: "Birthday parties" })
    return views
  }, [billingSummaries.length, groupedBookings.birthdayParties.length, groupedBookings.classes.length, groupedBookings.summerCamps.length])

  useEffect(() => {
    if (tab !== "bookings") return
    if (availableBookingsViews.some((item) => item.key === bookingsView)) return
    setBookingsView(availableBookingsViews[0]?.key ?? "classes")
  }, [availableBookingsViews, bookingsView, tab])

  useEffect(() => {
    if (!data || "error" in data || data.status !== "existing" || !data.account) {
      return
    }

    setEditableFields(normalizeEditableFields(data.account))
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
        setEditableFields(normalizeEditableFields(data.account))
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
    if (
      PHONE_PATTERN.test(payload.accTelNo) &&
      PHONE_PATTERN.test(payload.accEmergencyTelNo) &&
      payload.accTelNo === payload.accEmergencyTelNo
    ) {
      nextFieldErrors.accEmergencyTelNo =
        "Emergency contact number must be different from the contact number."
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
    if (nextTab === "children" || nextTab === "bookings") {
      setChildrenResetKey((prev) => prev + 1)
      const canLoadExtendedAccountData =
        !!data &&
        "error" in data === false &&
        data.status === "existing" &&
        !loadingChildDetails
      const shouldLoadChildDetails =
        canLoadExtendedAccountData && !data.childDetailsIncluded
      const shouldRefreshBookings =
        canLoadExtendedAccountData && nextTab === "bookings"

      if (shouldLoadChildDetails || shouldRefreshBookings) {
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
      window.location.assign(`/book?childId=${encodeURIComponent(child.id)}`)
      return
    }
    setIsChildModalOpen(true)
  }

  const navItems: NavItem[] = [
    { key: "details", label: "Account details" },
    { key: "children", label: "Children" },
    { key: "bookings", label: "Bookings" },
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
            {data && "error" in data === false && data.devImpersonatedEmail ? (
              <p className={styles.devImpersonationBanner}>
                Dev impersonation active: {data.devImpersonatedEmail}
              </p>
            ) : null}
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
          {!isMobileViewport ? (
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
                  <h2>
                    {tab === "children"
                      ? "Children"
                      : tab === "bookings"
                        ? "Bookings"
                        : "Account Details"}
                  </h2>
                </div>
                {tab === "children" ? (
                  <div className={styles.headerAction}>
                    <button
                      type="button"
                      className={`${styles.editButton} ${styles.saveButton}`}
                      onClick={() => router.push("/account/children/add")}
                    >
                      Add Child
                    </button>
                  </div>
                ) : tab === "details" ? (
                  <div className={styles.headerAction}>
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={handleEditToggle}
                    >
                      {isEditingDetails ? "Cancel" : "Edit"}
                    </button>
                  </div>
                ) : null}
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
                              className={`${styles.childActionButton} ${styles.saveButton}`}
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
                    childSummaries={data.children}
                    medicalByChildId={data.medicalByChildId}
                    badgesByChildId={data.badgesByChildId}
                    onSelectionChange={setIsChildDetail}
                    onActiveChildChange={setActiveChildId}
                  />
                  )
                )}
                {tab === "bookings" && (
                  loadingChildDetails ? (
                    <PanelSkeleton />
                  ) : (
                  <div className={styles.accountBookingsLayout}>
                    {data.accountBookings.length === 0 ? (
                      <p className={styles.accountBookingsEmpty}>
                        There are no active bookings on this account right now.
                      </p>
                    ) : (
                      <>
                        {availableBookingsViews.length > 1 ? (
                          <div className={styles.accountBookingsSwitcher} role="tablist" aria-label="Booking sections">
                            {availableBookingsViews.map((item) => (
                              <button
                                key={item.key}
                                type="button"
                                role="tab"
                                aria-selected={bookingsView === item.key}
                                className={`${styles.accountBookingsSwitcherButton} ${
                                  bookingsView === item.key ? styles.accountBookingsSwitcherButtonActive : ""
                                }`}
                                onClick={() => setBookingsView(item.key)}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        ) : null}

                        {groupedBookings.classes.length > 0 && bookingsView === "classes" ? (
                          <section className={styles.accountBookingsSection}>
                            <div className={styles.accountBookingsSectionHeader}>
                              <h3>Class bookings</h3>
                              <p>Active recreational and competition class bookings.</p>
                            </div>
                            <div className={styles.accountBookingsGrid}>
                              {groupedBookings.classes.map((booking, index) => (
                                <article
                                  key={`class-${booking.childId ?? "unknown"}-${booking.className ?? "class"}-${index}`}
                                  className={styles.accountBookingCard}
                                >
                                  <div className={styles.accountBookingIntro}>
                                    <div className={styles.accountBookingType}>
                                      {booking.programme === "competition"
                                        ? "Competition booking"
                                        : "Recreational booking"}
                                    </div>
                                    <h3 className={styles.accountBookingTitle}>
                                      <span className={styles.accountBookingChildName}>
                                        {booking.childId ? childNameById.get(booking.childId) ?? "Child" : "Child"}
                                      </span>
                                    </h3>
                                    <div className={styles.accountBookingPrimary}>
                                      {booking.className ?? "Class booking"}
                                    </div>
                                  </div>
                                  <div className={styles.accountBookingDetails}>
                                    <div className={styles.accountBookingMeta}>
                                      <span className={styles.accountBookingMetaLabel}>Day</span>
                                      <span>{booking.weekday ?? "-"}</span>
                                    </div>
                                    <div className={styles.accountBookingMeta}>
                                      <span className={styles.accountBookingMetaLabel}>Time</span>
                                      <span>{formatTimeRange(booking.startTime, booking.endTime)}</span>
                                    </div>
                                    <div className={styles.accountBookingMeta}>
                                      <span className={styles.accountBookingMetaLabel}>Duration</span>
                                      <span>
                                        {booking.durationMinutes != null
                                          ? `${booking.durationMinutes} minutes`
                                          : "-"}
                                      </span>
                                    </div>
                                  </div>
                                </article>
                              ))}
                            </div>
                          </section>
                        ) : null}

                        {billingSummaries.length > 0 && bookingsView === "billing" ? (
                          <section className={styles.accountBookingsSection}>
                            <div className={styles.accountBookingsSectionHeader}>
                              <h3>Billing</h3>
                              <p>Current subscription billing for your active class bookings.</p>
                            </div>
                            <div className={styles.accountBookingsGrid}>
                              {billingSummaries.map((billing) => (
                                <article
                                  key={`${billing.programme}-${billing.subscriptionId}`}
                                  className={styles.accountBookingCard}
                                >
                                  <div className={styles.accountBookingIntro}>
                                    <div className={styles.accountBookingType}>
                                      {billing.programme === "competition"
                                        ? "Competition billing"
                                        : "Recreational billing"}
                                    </div>
                                    <h3 className={styles.accountBookingTitle}>
                                      {billing.programme === "competition"
                                        ? "Competition subscription"
                                        : "Recreational subscription"}
                                    </h3>
                                  </div>
                                  <div className={styles.accountBookingDetails}>
                                    <div className={styles.accountBookingMeta}>
                                      <span className={styles.accountBookingMetaLabel}>Subscription status</span>
                                      <span>{formatSubscriptionStatus(billing.subscriptionStatus)}</span>
                                    </div>
                                    <div className={styles.accountBookingMeta}>
                                      <span className={styles.accountBookingMetaLabel}>Latest payment</span>
                                      <span>{formatPaidAmount(billing.latestInvoiceAmountPence, billing.currency ?? "GBP") ?? "-"}</span>
                                    </div>
                                    <div className={styles.accountBookingMeta}>
                                      <span className={styles.accountBookingMetaLabel}>Latest invoice</span>
                                      <span>{formatAccountDate(billing.latestInvoiceDate)}</span>
                                    </div>
                                    <div className={styles.accountBookingMeta}>
                                      <span className={styles.accountBookingMetaLabel}>Paid on</span>
                                      <span>{formatAccountDate(billing.latestInvoicePaidAt)}</span>
                                    </div>
                                    <div className={styles.accountBookingMeta}>
                                      <span className={styles.accountBookingMetaLabel}>Next payment</span>
                                      <span>{formatPaidAmount(billing.nextInvoiceAmountPence, billing.currency ?? "GBP") ?? "-"}</span>
                                    </div>
                                    <div className={styles.accountBookingMeta}>
                                      <span className={styles.accountBookingMetaLabel}>Next invoice date</span>
                                      <span>{formatAccountDate(billing.nextInvoiceDate)}</span>
                                    </div>
                                  </div>
                                </article>
                              ))}
                            </div>
                          </section>
                        ) : null}

                        {groupedBookings.summerCamps.length > 0 && bookingsView === "summer-camps" ? (
                          <section className={styles.accountBookingsSection}>
                            <div className={styles.accountBookingsSectionHeader}>
                              <h3>Summer Camps</h3>
                              <p>Active summer camp sessions booked on this account.</p>
                            </div>
                            <div className={styles.accountBookingsGrid}>
                              {groupedBookings.summerCamps.map((booking, index) => (
                                <article
                                  key={`camp-${booking.childId ?? "unknown"}-${booking.campDate ?? "camp"}-${index}`}
                                  className={styles.accountBookingCard}
                                >
                                  <div className={styles.accountBookingIntro}>
                                    <div className={styles.accountBookingType}>Summer camp</div>
                                    <h3 className={styles.accountBookingTitle}>
                                      {booking.className ?? "Summer Camp"}
                                    </h3>
                                  </div>
                                  <div className={styles.accountBookingDetails}>
                                    <div className={styles.accountBookingMeta}>
                                      <span className={styles.accountBookingMetaLabel}>Booked for</span>
                                      <span className={styles.accountBookingChildName}>
                                        {booking.childId ? childNameById.get(booking.childId) ?? "Child" : "Child"}
                                      </span>
                                    </div>
                                    <div className={styles.accountBookingMeta}>
                                      <span className={styles.accountBookingMetaLabel}>Date</span>
                                      <span>{formatAccountDate(booking.campDate)}</span>
                                    </div>
                                    <div className={styles.accountBookingMeta}>
                                      <span className={styles.accountBookingMetaLabel}>Time</span>
                                      <span>{formatTimeRange(booking.startTime, booking.endTime)}</span>
                                    </div>
                                  </div>
                                </article>
                              ))}
                            </div>
                          </section>
                        ) : null}

                        {groupedBookings.birthdayParties.length > 0 && bookingsView === "birthday-parties" ? (
                          <section className={styles.accountBookingsSection}>
                            <div className={styles.accountBookingsSectionHeader}>
                              <h3>Birthday Parties</h3>
                            </div>
                            <div className={styles.accountBookingsGrid}>
                              {groupedBookings.birthdayParties.map((booking, index) => {
                                const childName = `${booking.birthdayChildFirstName?.trim() ?? ""} ${booking.birthdayChildLastName?.trim() ?? ""}`.trim() || "Birthday child"
                                const turningAge = getBirthdayTurningAge(
                                  booking.birthdayChildDateOfBirth,
                                  booking.slotDate
                                )
                                return (
                                  <article
                                    key={`birthday-${booking.slotDate ?? "party"}-${index}`}
                                    className={styles.accountBookingCard}
                                  >
                                    <div className={styles.accountBookingIntro}>
                                      <div className={styles.accountBookingType}>Birthday party</div>
                                      <h3 className={styles.accountBookingTitle}>{childName}</h3>
                                      <div className={styles.accountBookingPrimary}>
                                        {formatAccountDate(booking.slotDate)}
                                      </div>
                                    </div>
                                    <div className={styles.accountBookingDetails}>
                                      <div className={styles.accountBookingMeta}>
                                        <span className={styles.accountBookingMetaLabel}>Time</span>
                                        <span>{formatTimeRange(booking.startTime, booking.endTime)}</span>
                                      </div>
                                      <div className={styles.accountBookingMeta}>
                                        <span className={styles.accountBookingMetaLabel}>Age on the day</span>
                                        <span>{turningAge == null ? "-" : `Turning ${turningAge}`}</span>
                                      </div>
                                      <div className={styles.accountBookingMeta}>
                                        <span className={styles.accountBookingMetaLabel}>Party size</span>
                                        <span>{booking.partySize == null ? "-" : `${booking.partySize} children`}</span>
                                      </div>
                                      <div className={styles.accountBookingMeta}>
                                        <span className={styles.accountBookingMetaLabel}>Date of birth</span>
                                        <span>{formatDateOfBirth(booking.birthdayChildDateOfBirth)}</span>
                                      </div>
                                      <div className={styles.accountBookingMeta}>
                                        <span className={styles.accountBookingMetaLabel}>Amount paid</span>
                                        <span>{formatPaidAmount(booking.totalAmountPence) ?? "-"}</span>
                                      </div>
                                    </div>
                                  </article>
                                )
                              })}
                            </div>
                          </section>
                        ) : null}
                      </>
                    )}
                  </div>
                  )
                )}
                <ChildSelectModal
                  isOpen={isChildModalOpen}
                  onClose={() => setIsChildModalOpen(false)}
                  childOptions={data.children}
                  onSelect={(child) => {
                    setIsChildModalOpen(false)
                    window.location.assign(`/book?childId=${encodeURIComponent(child.id)}`)
                  }}
                />
              </>
            )}
          </div>
        </section>
      </div>

      {isMobileViewport ? (
        <div className={styles.mobileBookBar}>
          <button
            type="button"
            className={`${styles.childActionButton} ${styles.mobileBookAction}`}
            onClick={() => {
              if (tab === "children" && isChildDetail && activeChildId) {
                router.push(`/book?childId=${activeChildId}`)
                return
              }
              handleBookClassClick()
            }}
          >
            Book Class
          </button>
        </div>
      ) : null}
    </div>
  )
}
