'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from '../account.module.css'

type ChildSummary = {
  id: string
  firstName: string | null
  lastName: string | null
  dateOfBirth: string | null
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

type DetailTab = 'profile' | 'medical' | 'bookings'

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

export default function ChildrenClientPanel({
  children,
  medicalByChildId,
  bookingsByChildId,
  onSelectionChange,
  onBookChild,
}: {
  children: ChildSummary[]
  medicalByChildId: Record<string, MedicalInformationRow>
  bookingsByChildId: Record<string, BookingSummary[]>
  onSelectionChange?: (isDetail: boolean) => void
  onBookChild?: (childId: string) => void
}) {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<DetailTab>('profile')

  const selectedChild = useMemo(
    () => children.find((child) => child.id === selectedChildId) ?? null,
    [children, selectedChildId]
  )

  useEffect(() => {
    onSelectionChange?.(!!selectedChildId)
  }, [onSelectionChange, selectedChildId])

  const handleBack = () => {
    setSelectedChildId(null)
    setActiveTab('profile')
  }

  if (!selectedChild) {
    return (
      <ol className={styles.childrenList}>
        {children.map((child) => {
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
                      ›
                    </span>
                  </span>
                </div>
              </button>
            </li>
          )
        })}
      </ol>
    )
  }

  const age = computeAge(selectedChild.dateOfBirth)
  const medical = medicalByChildId[selectedChild.id] ?? null
  const bookings = bookingsByChildId[selectedChild.id] ?? []

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

  return (
    <div className={styles.childDetail}>
      <div className={styles.childIdentity}>
        <div className={styles.childIdentityRow}>
          <div className={styles.childNameLarge}>
            {(selectedChild.firstName ?? '').trim() || '-'}{' '}
            {(selectedChild.lastName ?? '').trim()}
          </div>
          <button
            type="button"
            className={styles.childActionButton}
            onClick={() => onBookChild?.(selectedChild.id)}
          >
            Book Class
          </button>
        </div>
      </div>

      <div className={styles.childTabs}>
        {(['profile', 'medical', 'bookings'] as DetailTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`${styles.childTab} ${
              activeTab === tab ? styles.childTabActive : ''
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'profile'
              ? 'Profile'
              : tab === 'medical'
              ? 'Medical'
              : 'Bookings'}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className={styles.childCard}>
          <div className={styles.profileRow}>
            <span>First name</span>
            <span>{(selectedChild.firstName ?? '').trim() || '-'}</span>
          </div>
          <div className={styles.profileRow}>
            <span>Last name</span>
            <span>{(selectedChild.lastName ?? '').trim() || '-'}</span>
          </div>
          <div className={styles.profileRow}>
            <span>Date of birth</span>
            <span>{formatDob(selectedChild.dateOfBirth)}</span>
          </div>
          <div className={styles.profileRow}>
            <span>Age</span>
            <span>{age === null ? '-' : `${age} years`}</span>
          </div>
        </div>
      )}

      {activeTab === 'medical' && (
        <div className={styles.childCard}>
          <h3 className={styles.cardTitle}>Medical information</h3>
          {hasMedicalData ? (
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
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className={styles.childCardStack}>
          {bookings.length === 0 ? (
            <p className={styles.cardBody}>
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
      )}
    </div>
  )
}
