'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from '../account.module.css'

type ChildSummary = {
  id: string
  firstName: string | null
  lastName: string | null
  dateOfBirth: string | null
  photoConsent: boolean | null
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
  childId: string
  className: string | null
  weekday: string | null
  startTime: string | null
  endTime: string | null
  durationMinutes: number | null
}

type DetailTab = 'profile' | 'medical' | 'bookings' | 'badges'
type MobileSection = DetailTab

type EditableProfile = {
  firstName: string
  lastName: string
  dateOfBirth: string
  photoConsent: boolean
}

type EditableMedical = {
  medicalConditions: string
  medications: string
  disabilities: string
  behaviouralConditions: string
  allergies: string
  dietaryNeeds: string
  doctorName: string
  surgeryAddress: string
  surgeryTelephone: string
}

type BadgeTrack = 'recreational' | 'competition'
type ParentBadge = {
  id: string
  code: string
  title: string
  skills: string[]
  completedSkillCount: number
  track: BadgeTrack
}

const NAME_PATTERN = /^[A-Za-z]+$/

const toInputValue = (value: string | null | undefined) => value ?? ''

function formatDob(dateOfBirth: string | null) {
  if (!dateOfBirth) {
    return '-'
  }
  const date = new Date(dateOfBirth)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function computeAge(dateOfBirth: string | null) {
  if (!dateOfBirth) return null
  const birthDate = new Date(dateOfBirth)
  if (Number.isNaN(birthDate.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  const dayDiff = today.getDate() - birthDate.getDate()
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1
  }
  return age < 0 ? 0 : age
}

function buildPlaceholderSkills(prefix: string) {
  return Array.from({ length: 10 }, (_, index) => `${prefix} skill ${index + 1}`)
}

function placeholderCompletedDate(badgeId: string, skillIndex: number) {
  const base = new Date('2026-01-01T00:00:00Z')
  const numericSeed = badgeId.length * 11 + skillIndex * 3
  base.setUTCDate(base.getUTCDate() + numericSeed)
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(base)
}

const recreationalBadges: ParentBadge[] = Array.from({ length: 10 }, (_, index) => {
  const level = index + 1
  return {
    id: `rec-${level}`,
    code: `R${String(level).padStart(2, '0')}`,
    title: `Level ${level}`,
    skills: buildPlaceholderSkills(`Level ${level}`),
    completedSkillCount: (index * 2) % 11,
    track: 'recreational' as const,
  }
})

const competitionBadges: ParentBadge[] = Array.from({ length: 10 }, (_, index) => {
  const level = index + 1
  return {
    id: `comp-${level}`,
    code: `C${String(level).padStart(2, '0')}`,
    title: `Competition Badge ${level}`,
    skills: buildPlaceholderSkills(`Competition Badge ${level}`),
    completedSkillCount: (index * 3) % 11,
    track: 'competition' as const,
  }
})


export default function ChildrenClientPanel({
  children,
  medicalByChildId,
  bookingsByChildId,
  onSelectionChange,
  onActiveChildChange,
}: {
  children: ChildSummary[]
  medicalByChildId: Record<string, MedicalInformationRow>
  bookingsByChildId: Record<string, BookingSummary[]>
  onSelectionChange?: (isDetail: boolean) => void
  onActiveChildChange?: (childId: string | null) => void
}) {
  const [childRecords, setChildRecords] = useState<ChildSummary[]>(children)
  const [medicalRecords, setMedicalRecords] =
    useState<Record<string, MedicalInformationRow>>(medicalByChildId)
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<DetailTab>('profile')
  const [activeMobileSection, setActiveMobileSection] = useState<MobileSection | null>('profile')
  const [activeBadgeTrack, setActiveBadgeTrack] = useState<BadgeTrack>('recreational')
  const [expandedBadgeId, setExpandedBadgeId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [profileForm, setProfileForm] = useState<EditableProfile>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    photoConsent: false,
  })
  const [medicalForm, setMedicalForm] = useState<EditableMedical>({
    medicalConditions: '',
    medications: '',
    disabilities: '',
    behaviouralConditions: '',
    allergies: '',
    dietaryNeeds: '',
    doctorName: '',
    surgeryAddress: '',
    surgeryTelephone: '',
  })
  const [profileErrors, setProfileErrors] = useState<Partial<Record<keyof EditableProfile, string>>>({})

  const selectedChild = useMemo(
    () => childRecords.find((child) => child.id === selectedChildId) ?? null,
    [childRecords, selectedChildId]
  )

  useEffect(() => {
    onSelectionChange?.(!!selectedChildId)
  }, [onSelectionChange, selectedChildId])

  useEffect(() => {
    onActiveChildChange?.(selectedChildId)
  }, [onActiveChildChange, selectedChildId])

  useEffect(() => {
    setActiveBadgeTrack('recreational')
    setExpandedBadgeId(null)
  }, [selectedChildId])

  useEffect(() => {
    setChildRecords(children)
  }, [children])

  useEffect(() => {
    setMedicalRecords(medicalByChildId)
  }, [medicalByChildId])

  useEffect(() => {
    if (!selectedChild) {
      setProfileForm({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        photoConsent: false,
      })
      setMedicalForm({
        medicalConditions: '',
        medications: '',
        disabilities: '',
        behaviouralConditions: '',
        allergies: '',
        dietaryNeeds: '',
        doctorName: '',
        surgeryAddress: '',
        surgeryTelephone: '',
      })
      return
    }

    const medical = medicalRecords[selectedChild.id] ?? null
    setProfileForm({
      firstName: (selectedChild.firstName ?? '').trim(),
      lastName: (selectedChild.lastName ?? '').trim(),
      dateOfBirth: selectedChild.dateOfBirth ?? '',
      photoConsent: selectedChild.photoConsent === true,
    })
    setMedicalForm({
      medicalConditions: toInputValue(medical?.medicalConditions),
      medications: toInputValue(medical?.medications),
      disabilities: toInputValue(medical?.disabilities),
      behaviouralConditions: toInputValue(medical?.behaviouralConditions),
      allergies: toInputValue(medical?.allergies),
      dietaryNeeds: toInputValue(medical?.dietaryNeeds),
      doctorName: toInputValue(medical?.doctorName),
      surgeryAddress: toInputValue(medical?.surgeryAddress),
      surgeryTelephone: toInputValue(medical?.surgeryTelephone),
    })
  }, [medicalRecords, selectedChild])

  if (!selectedChild) {
    return (
      <ol className={styles.childrenList}>
        {childRecords.map((child) => {
          const age = computeAge(child.dateOfBirth)
          return (
            <li key={child.id} className={styles.childItem}>
              <button
                type="button"
                className={styles.childButton}
                onClick={() => setSelectedChildId(child.id)}
              >
                <div className={styles.childHeader}>
                  <span className={styles.childName}>
                    {(child.firstName ?? '').trim() || '-'}{' '}
                    {(child.lastName ?? '').trim()}
                  </span>
                  <span className={styles.childMetaRight}>
                    <span className={styles.agePill}>
                      {age === null ? '-' : `${age} yrs`}
                    </span>
                    <span className={styles.chevron} aria-hidden="true">
                      {'›'}
                    </span>
                  </span>
                </div>
                <div className={styles.childMetaLine}>
                  <span>DOB {formatDob(child.dateOfBirth)}</span>
                  <span className={styles.childHint}>View profile</span>
                </div>
              </button>
            </li>
          )
        })}
      </ol>
    )
  }

  const age = computeAge(selectedChild.dateOfBirth)
  const medical = medicalRecords[selectedChild.id] ?? null
  const bookings = bookingsByChildId[selectedChild.id] ?? []
  const isCompetitionChild = selectedChild.competitionEligible === true
  const showEditButton = activeTab === 'profile' || activeTab === 'medical'

  const isRenderable = (value: string | null) => {
    if (!value) return false
    const trimmed = value.trim()
    if (!trimmed) return false
    return trimmed.toLowerCase() !== 'not provided'
  }

  const healthFields = [
    { key: 'medicalConditions', label: 'Medical conditions' },
    { key: 'medications', label: 'Medications' },
    { key: 'disabilities', label: 'Disabilities' },
    { key: 'behaviouralConditions', label: 'Behavioural conditions' },
    { key: 'allergies', label: 'Allergies' },
    { key: 'dietaryNeeds', label: 'Dietary needs' },
  ] as const

  const doctorFields = [
    { key: 'doctorName', label: 'Doctor name' },
    { key: 'surgeryAddress', label: 'Surgery address' },
    { key: 'surgeryTelephone', label: 'Surgery telephone' },
  ] as const

  const renderMedicalFields = (
    fields: readonly { key: keyof MedicalInformationRow; label: string }[]
  ) => {
    const rows = fields
      .map((field) => {
        const value = medical ? medical[field.key] : null
        return isRenderable(value) ? { label: field.label, value } : null
      })
      .filter((row): row is { label: string; value: string } => !!row)

    return rows
  }

  const healthRows = renderMedicalFields(healthFields)
  const doctorRows = renderMedicalFields(doctorFields)
  const hasMedicalData = healthRows.length > 0 || doctorRows.length > 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayDate = today.toISOString().slice(0, 10)

  const resetEditingState = () => {
    setIsEditing(false)
    setIsSaving(false)
    setSaveError(null)
    setSaveSuccess(null)
    setProfileErrors({})
  }

  const handleTabChange = (tab: DetailTab) => {
    setActiveTab(tab)
    resetEditingState()
  }

  const handleMobileSectionChange = (section: MobileSection) => {
    const nextSection = activeMobileSection === section ? null : section
    setActiveMobileSection(nextSection)
    resetEditingState()
    if (nextSection) {
      setActiveTab(nextSection)
    }
  }

  const handleToggleEdit = () => {
    if (isEditing) {
      resetEditingState()
      return
    }
    setSaveError(null)
    setSaveSuccess(null)
    setProfileErrors({})
    setIsEditing(true)
  }

  const handleProfileChange = (field: keyof EditableProfile, value: string) => {
    if (field === 'photoConsent') {
      return
    }
    let nextValue = value
    if (field === 'firstName' || field === 'lastName') {
      nextValue = value.replace(/[^A-Za-z]/g, '')
    }
    setProfileForm((prev) => ({ ...prev, [field]: nextValue }))
    setProfileErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleProfileConsentChange = (checked: boolean) => {
    setProfileForm((prev) => ({ ...prev, photoConsent: checked }))
  }

  const handleMedicalChange = (field: keyof EditableMedical, value: string) => {
    const nextValue =
      field === 'surgeryTelephone' ? value.replace(/\D/g, '') : value
    setMedicalForm((prev) => ({ ...prev, [field]: nextValue }))
  }

  const saveProfile = async () => {
    const payload = {
      childId: selectedChild.id,
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
      dateOfBirth: profileForm.dateOfBirth,
      photoConsent: profileForm.photoConsent,
    }

    const nextErrors: Partial<Record<keyof EditableProfile, string>> = {}

    if (!payload.firstName) {
      nextErrors.firstName = 'First name is required.'
    } else if (!NAME_PATTERN.test(payload.firstName)) {
      nextErrors.firstName = 'First name can contain letters only.'
    }

    if (!payload.lastName) {
      nextErrors.lastName = 'Last name is required.'
    } else if (!NAME_PATTERN.test(payload.lastName)) {
      nextErrors.lastName = 'Last name can contain letters only.'
    }

    if (!payload.dateOfBirth) {
      nextErrors.dateOfBirth = 'Date of birth is required.'
    } else {
      const parsed = new Date(payload.dateOfBirth)
      if (Number.isNaN(parsed.getTime()) || parsed >= today) {
        nextErrors.dateOfBirth = 'Date of birth must be in the past.'
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setProfileErrors(nextErrors)
      setSaveError('Please correct the highlighted profile fields.')
      setSaveSuccess(null)
      return
    }

    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)
    try {
      const response = await fetch('/api/account/children/update-profile', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (response.status === 401) {
        window.location.href = '/login'
        return
      }
      const json = await response.json()
      if (!response.ok || !json?.ok || !json?.child) {
        throw new Error(json?.error ?? 'Unable to save child profile.')
      }

      setChildRecords((prev) =>
        prev.map((child) =>
          child.id === selectedChild.id
            ? {
                ...child,
                firstName: json.child.firstName ?? null,
                lastName: json.child.lastName ?? null,
                dateOfBirth: json.child.dateOfBirth ?? null,
                photoConsent: json.child.photoConsent ?? null,
              }
            : child
        )
      )
      setIsEditing(false)
      setSaveSuccess('Child profile saved.')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to save child profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const saveMedical = async () => {
    const payload = {
      childId: selectedChild.id,
      medicalConditions: medicalForm.medicalConditions,
      medications: medicalForm.medications,
      disabilities: medicalForm.disabilities,
      behaviouralConditions: medicalForm.behaviouralConditions,
      allergies: medicalForm.allergies,
      dietaryNeeds: medicalForm.dietaryNeeds,
      doctorName: medicalForm.doctorName,
      surgeryAddress: medicalForm.surgeryAddress,
      surgeryTelephone: medicalForm.surgeryTelephone,
    }

    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)
    try {
      const response = await fetch('/api/account/children/update-medical', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (response.status === 401) {
        window.location.href = '/login'
        return
      }
      const json = await response.json()
      if (!response.ok || !json?.ok || !json?.medical) {
        throw new Error(json?.error ?? 'Unable to save medical details.')
      }

      setMedicalRecords((prev) => ({
        ...prev,
        [selectedChild.id]: json.medical as MedicalInformationRow,
      }))
      setIsEditing(false)
      setSaveSuccess('Medical information saved.')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to save medical details.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    if (activeTab === 'profile') {
      await saveProfile()
      return
    }
    if (activeTab === 'medical') {
      await saveMedical()
    }
  }

  const profilePanel = (
    <div className={styles.childCard}>
      <div className={styles.profileRow}>
        <span>First name</span>
        {isEditing ? (
          <div>
            <input
              type="text"
              className={styles.detailInput}
              value={profileForm.firstName}
              onChange={(event) =>
                handleProfileChange('firstName', event.target.value)
              }
            />
            {profileErrors.firstName ? (
              <p className={styles.detailFieldError}>{profileErrors.firstName}</p>
            ) : null}
          </div>
        ) : (
          <span>{(selectedChild.firstName ?? '').trim() || '-'}</span>
        )}
      </div>
      <div className={styles.profileRow}>
        <span>Last name</span>
        {isEditing ? (
          <div>
            <input
              type="text"
              className={styles.detailInput}
              value={profileForm.lastName}
              onChange={(event) =>
                handleProfileChange('lastName', event.target.value)
              }
            />
            {profileErrors.lastName ? (
              <p className={styles.detailFieldError}>{profileErrors.lastName}</p>
            ) : null}
          </div>
        ) : (
          <span>{(selectedChild.lastName ?? '').trim() || '-'}</span>
        )}
      </div>
      <div className={styles.profileRow}>
        <span>Date of birth</span>
        {isEditing ? (
          <div>
            <input
              type="date"
              max={todayDate}
              className={styles.detailInput}
              value={profileForm.dateOfBirth}
              onChange={(event) =>
                handleProfileChange('dateOfBirth', event.target.value)
              }
            />
            {profileErrors.dateOfBirth ? (
              <p className={styles.detailFieldError}>{profileErrors.dateOfBirth}</p>
            ) : null}
          </div>
        ) : (
          <span>{formatDob(selectedChild.dateOfBirth)}</span>
        )}
      </div>
      <div className={styles.profileRow}>
        <span>Age</span>
        <span>{age === null ? '-' : `${age} years`}</span>
      </div>
      <div className={styles.profileRow}>
        <span>Photo consent</span>
        {isEditing ? (
          <label className={styles.profileCheckboxRow}>
            <input
              type="checkbox"
              checked={profileForm.photoConsent}
              onChange={(event) =>
                handleProfileConsentChange(event.target.checked)
              }
            />
            <span>Permitted to be photographed for coaching and training purposes</span>
          </label>
        ) : (
          <span
            className={
              selectedChild.photoConsent === true
                ? styles.consentTrue
                : styles.consentFalse
            }
          >
            {selectedChild.photoConsent === true ? "\u2713" : "\u2717"}
          </span>
        )}
      </div>
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
      {isEditing ? (
        <div className={styles.detailActions}>
          <button
            type="button"
            className={styles.childActionButton}
            onClick={() => {
              void handleSave()
            }}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      ) : null}
    </div>
  )

  const medicalPanel = (
    <div className={styles.childCard}>
      {isEditing ? (
        <div className={styles.medicalSections}>
          <div className={styles.medicalSection}>
            <p className={styles.sectionTitle}>Health</p>
            <div className={styles.medicalRows}>
              <div className={styles.medicalRow}>
                <span className={styles.medicalLabel}>Medical conditions</span>
                <textarea
                  rows={3}
                  className={styles.detailInput}
                  value={medicalForm.medicalConditions}
                  onChange={(event) =>
                    handleMedicalChange('medicalConditions', event.target.value)
                  }
                />
              </div>
              <div className={styles.medicalRow}>
                <span className={styles.medicalLabel}>Medications</span>
                <textarea
                  rows={3}
                  className={styles.detailInput}
                  value={medicalForm.medications}
                  onChange={(event) =>
                    handleMedicalChange('medications', event.target.value)
                  }
                />
              </div>
              <div className={styles.medicalRow}>
                <span className={styles.medicalLabel}>Disabilities</span>
                <textarea
                  rows={3}
                  className={styles.detailInput}
                  value={medicalForm.disabilities}
                  onChange={(event) =>
                    handleMedicalChange('disabilities', event.target.value)
                  }
                />
              </div>
              <div className={styles.medicalRow}>
                <span className={styles.medicalLabel}>Behavioural conditions</span>
                <textarea
                  rows={3}
                  className={styles.detailInput}
                  value={medicalForm.behaviouralConditions}
                  onChange={(event) =>
                    handleMedicalChange('behaviouralConditions', event.target.value)
                  }
                />
              </div>
              <div className={styles.medicalRow}>
                <span className={styles.medicalLabel}>Allergies</span>
                <textarea
                  rows={3}
                  className={styles.detailInput}
                  value={medicalForm.allergies}
                  onChange={(event) =>
                    handleMedicalChange('allergies', event.target.value)
                  }
                />
              </div>
              <div className={styles.medicalRow}>
                <span className={styles.medicalLabel}>Dietary needs</span>
                <textarea
                  rows={3}
                  className={styles.detailInput}
                  value={medicalForm.dietaryNeeds}
                  onChange={(event) =>
                    handleMedicalChange('dietaryNeeds', event.target.value)
                  }
                />
              </div>
            </div>
          </div>
          <div className={styles.medicalSection}>
            <p className={styles.sectionTitle}>Doctor / Surgery</p>
            <div className={styles.medicalRows}>
              <div className={styles.medicalRow}>
                <span className={styles.medicalLabel}>Doctor name</span>
                <input
                  type="text"
                  className={styles.detailInput}
                  value={medicalForm.doctorName}
                  onChange={(event) =>
                    handleMedicalChange('doctorName', event.target.value)
                  }
                />
              </div>
              <div className={styles.medicalRow}>
                <span className={styles.medicalLabel}>Surgery address</span>
                <textarea
                  rows={3}
                  className={styles.detailInput}
                  value={medicalForm.surgeryAddress}
                  onChange={(event) =>
                    handleMedicalChange('surgeryAddress', event.target.value)
                  }
                />
              </div>
              <div className={styles.medicalRow}>
                <span className={styles.medicalLabel}>Surgery telephone</span>
                <input
                  type="text"
                  className={styles.detailInput}
                  value={medicalForm.surgeryTelephone}
                  onChange={(event) =>
                    handleMedicalChange('surgeryTelephone', event.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </div>
      ) : hasMedicalData ? (
        <div className={styles.medicalSections}>
          {healthRows.length > 0 && (
            <div className={styles.medicalSection}>
              <p className={styles.sectionTitle}>Health</p>
              <div className={styles.medicalRows}>
                {healthRows.map((row) => (
                  <div key={row.label} className={styles.medicalRow}>
                    <span className={styles.medicalLabel}>{row.label}</span>
                    <span className={styles.medicalValue}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {doctorRows.length > 0 && (
            <div className={styles.medicalSection}>
              <p className={styles.sectionTitle}>Doctor / Surgery</p>
              <div className={styles.medicalRows}>
                {doctorRows.map((row) => (
                  <div key={row.label} className={styles.medicalRow}>
                    <span className={styles.medicalLabel}>{row.label}</span>
                    <span className={styles.medicalValue}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className={styles.cardBody}>
          No medical information has been provided for this child.
        </p>
      )}
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
      {isEditing ? (
        <div className={styles.detailActions}>
          <button
            type="button"
            className={styles.childActionButton}
            onClick={() => {
              void handleSave()
            }}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      ) : null}
    </div>
  )

  const bookingsPanel = (
    <div className={styles.childCardStack}>
      {bookings.length === 0 ? (
        <p className={`${styles.cardBody} ${styles.bookingsEmptyMessage}`}>
          There are no active bookings for this child.
        </p>
      ) : (
        bookings.map((booking, index) => (
          <div key={`${booking.childId}-${index}`} className={styles.childCard}>
            <h3 className={styles.cardTitle}>
              {booking.className ?? '-'}
            </h3>
            <div className={styles.bookingMeta}>
              <span className={styles.cardBody}>
                {(booking.startTime ?? '-') +
                  ' - ' +
                  (booking.endTime ?? '-')}
              </span>
              <span className={styles.bookingDuration}>
                {booking.durationMinutes != null
                  ? `${booking.durationMinutes} minutes`
                  : '-'}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  )

  const visibleBadges = activeBadgeTrack === 'competition' ? competitionBadges : recreationalBadges
  const recCompletedCount = recreationalBadges.filter((badge) => badge.completedSkillCount >= badge.skills.length).length
  const compCompletedCount = competitionBadges.filter((badge) => badge.completedSkillCount >= badge.skills.length).length

  const badgesPanel = (
    <div className={styles.childCard}>
      <div className={styles.badgesHeader}>
        <h3 className={styles.cardTitle}>Badge progress</h3>
        <div className={styles.badgesSummary}>
          <span className={styles.badgesSummaryLine}>
            Recreational: {recCompletedCount}/10 complete
          </span>
          {isCompetitionChild ? (
            <span className={styles.badgesSummaryLine}>
              Competition: {compCompletedCount}/10 complete
            </span>
          ) : null}
        </div>
      </div>

      <div className={styles.badgesTrackRow}>
        <div className={styles.badgesTrackSwitch}>
          {(['recreational', 'competition'] as BadgeTrack[])
            .filter((track) => (isCompetitionChild ? true : track === 'recreational'))
            .map((track) => {
              const isActive = activeBadgeTrack === track
              return (
                <button
                  key={track}
                  type="button"
                  className={[
                    styles.badgesTrackButton,
                    track === 'competition'
                      ? styles.badgesTrackButtonCompetition
                      : styles.badgesTrackButtonRecreational,
                    isActive ? styles.badgesTrackButtonActive : '',
                  ].join(' ')}
                  onClick={() => {
                    setActiveBadgeTrack(track)
                    setExpandedBadgeId(null)
                  }}
                >
                  {track === 'recreational' ? 'Recreational' : 'Competition'}
                </button>
              )
            })}
        </div>
      </div>

      <div className={styles.badgesList}>
        {visibleBadges.map((badge) => {
          const total = badge.skills.length
          const completed = Math.min(badge.completedSkillCount, total)
          const percent = Math.round((completed / total) * 100)
          const status =
            completed === 0 ? 'Not started' : completed === total ? 'Complete' : 'In progress'
          const badgeCompleted = completed === total
          const badgeCompletedDate = badgeCompleted
            ? placeholderCompletedDate(badge.id, total - 1)
            : null
          const isOpen = expandedBadgeId === badge.id
          const progressColor = badge.track === 'competition' ? '#e0b21a' : '#6c35c3'

          return (
            <article key={badge.id} className={styles.badgesItem}>
              <button
                type="button"
                className={`${styles.badgesItemHeader} ${
                  badgeCompleted ? styles.badgesItemHeaderComplete : ''
                }`}
                onClick={() => setExpandedBadgeId((prev) => (prev === badge.id ? null : badge.id))}
                aria-expanded={isOpen}
              >
                <div className={styles.badgesItemTitleRow}>
                  <span className={styles.badgesCode}>{badge.code}</span>
                  <h4 className={styles.badgesTitle}>{badge.title}</h4>
                  {badgeCompleted ? (
                    <span className={styles.badgesCompleteStar} aria-hidden="true">
                      ★
                    </span>
                  ) : null}
                </div>
                <div className={styles.badgesStatusRow}>
                  <span className={styles.badgesStatus}>
                    {badgeCompletedDate ? `Completed ${badgeCompletedDate}` : status}
                  </span>
                </div>
                <div className={styles.badgesMetaRow}>
                  <span>{completed}/{total} skills complete</span>
                </div>
                <div className={styles.badgesProgressTrack}>
                  <div
                    className={styles.badgesProgressFill}
                    style={{ width: `${percent}%`, backgroundColor: progressColor }}
                  />
                </div>
              </button>

              {isOpen ? (
                <ul className={styles.badgesSkillsList}>
                  {badge.skills.map((skill, index) => {
                    const done = index < completed
                    const completedDate = done ? placeholderCompletedDate(badge.id, index) : null
                    return (
                      <li
                        key={`${badge.id}-${index}`}
                        className={`${styles.badgesSkillRow} ${done ? styles.badgesSkillDone : ''}`}
                      >
                        <span className={styles.badgesSkillText}>{skill}</span>
                        <span className={styles.badgesSkillState}>
                          {done ? `Complete | ${completedDate}` : 'Pending'}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </article>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className={styles.childDetail}>
      <div className={styles.childIdentity}>
        <div className={styles.childIdentityRow}>
          <div className={styles.childNameLarge}>
            {(selectedChild.firstName ?? '').trim() || '-'}{' '}
            {(selectedChild.lastName ?? '').trim()}
          </div>
          {showEditButton ? (
            <div className={styles.desktopBookButton}>
              <button
                type="button"
                className={styles.editButton}
                onClick={handleToggleEdit}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className={styles.desktopChildView}>
        <div className={styles.childTabsRow}>
          <div className={styles.childTabs}>
            {(['profile', 'medical', 'bookings', 'badges'] as DetailTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`${styles.childTab} ${
                  activeTab === tab ? styles.childTabActive : ''
                }`}
                onClick={() => handleTabChange(tab)}
              >
                {tab === 'profile'
                  ? 'Profile'
                  : tab === 'medical'
                  ? 'Medical'
                  : tab === 'bookings'
                  ? 'Bookings'
                  : 'Badges'}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'profile' ? profilePanel : null}
        {activeTab === 'medical' ? medicalPanel : null}
        {activeTab === 'bookings' ? bookingsPanel : null}
        {activeTab === 'badges' ? badgesPanel : null}
      </div>

      <div className={styles.mobileChildView}>
        <div className={styles.mobileSections}>
          {([
            { key: 'profile', label: 'Profile', content: profilePanel, editable: true },
            { key: 'medical', label: 'Medical', content: medicalPanel, editable: true },
            { key: 'bookings', label: 'Bookings', content: bookingsPanel, editable: false },
            { key: 'badges', label: 'Badges', content: badgesPanel, editable: false },
          ] as const).map((section) => {
            const open = activeMobileSection === section.key
            const canEdit = section.editable
            return (
              <section key={section.key} className={styles.mobileSectionCard}>
                <div
                  className={`${styles.mobileSectionHeader} ${
                    open ? styles.mobileSectionHeaderActive : ''
                  }`}
                >
                  <button
                    type="button"
                    className={styles.mobileSectionToggle}
                    onClick={() => handleMobileSectionChange(section.key)}
                    aria-expanded={open}
                  >
                    <span>{section.label}</span>
                    <span
                      className={`${styles.mobileSectionChevron} ${
                        open ? styles.mobileSectionChevronOpen : ''
                      }`}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  </button>
                  {canEdit ? (
                    <div className={styles.mobileSectionActionSlot}>
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={handleToggleEdit}
                        style={{ visibility: open ? 'visible' : 'hidden' }}
                        tabIndex={open ? 0 : -1}
                        aria-hidden={!open}
                      >
                        {isEditing ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                  ) : null}
                </div>
                {open ? section.content : null}
              </section>
            )
          })}
        </div>
      </div>

    </div>
  )
}
