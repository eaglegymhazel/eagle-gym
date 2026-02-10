'use client'

import { useMemo, useState } from 'react'
import styles from '@/app/account/account.module.css'
import type { ChildSummary } from '@/lib/server/children'
import type { MedicalInformationRow } from '@/lib/server/medical'

type DetailTab = 'profile' | 'medical' | 'bookings'

function formatDob(dateOfBirth: string | null) {
  if (!dateOfBirth) {
    return '—'
  }
  const date = new Date(dateOfBirth)
  if (Number.isNaN(date.getTime())) {
    return '—'
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

function initials(firstName: string | null, lastName: string | null) {
  const first = (firstName ?? '').trim()
  const last = (lastName ?? '').trim()
  const firstInitial = first ? first[0].toUpperCase() : ''
  const lastInitial = last ? last[0].toUpperCase() : ''
  const value = `${firstInitial}${lastInitial}`.trim()
  return value || '—'
}

export default function ChildrenClientPanel({
  children,
  medicalByChildId,
}: {
  children: ChildSummary[]
  medicalByChildId: Record<string, MedicalInformationRow>
}) {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<DetailTab>('profile')

  const selectedChild = useMemo(
    () => children.find((child) => child.id === selectedChildId) ?? null,
    [children, selectedChildId]
  )

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
                    {(child.firstName ?? '').trim() || '—'}{' '}
                    {(child.lastName ?? '').trim()}
                  </span>
                  <span className={styles.agePill}>
                    {age === null ? '—' : `${age} yrs`}
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
      <button type="button" className={styles.backLink} onClick={handleBack}>
        ← Back to children
      </button>

      <div className={styles.childIdentity}>
        <div className={styles.avatar}>{initials(selectedChild.firstName, selectedChild.lastName)}</div>
        <div>
          <div className={styles.childNameLarge}>
            {(selectedChild.firstName ?? '').trim() || '—'}{' '}
            {(selectedChild.lastName ?? '').trim()}
          </div>
          <div className={styles.childSubtext}>
            Born {formatDob(selectedChild.dateOfBirth)} ·{' '}
            {age === null ? '—' : `${age} years old`}
          </div>
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
            <span>{(selectedChild.firstName ?? '').trim() || '—'}</span>
          </div>
          <div className={styles.profileRow}>
            <span>Last name</span>
            <span>{(selectedChild.lastName ?? '').trim() || '—'}</span>
          </div>
          <div className={styles.profileRow}>
            <span>Date of birth</span>
            <span>{formatDob(selectedChild.dateOfBirth)}</span>
          </div>
          <div className={styles.profileRow}>
            <span>Age</span>
            <span>{age === null ? '—' : `${age} years`}</span>
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
                        <span className={styles.medicalLabel}>
                          {row.label}
                        </span>
                        <span className={styles.medicalValue}>
                          {row.value}
                        </span>
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
                        <span className={styles.medicalLabel}>
                          {row.label}
                        </span>
                        <span className={styles.medicalValue}>
                          {row.value}
                        </span>
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
          <div className={styles.childCard}>
            <h3 className={styles.cardTitle}>Recreational Gymnastics</h3>
            <p className={styles.cardBody}>Mondays · 4:00pm</p>
          </div>
          <div className={styles.childCard}>
            <h3 className={styles.cardTitle}>Recreational Gymnastics</h3>
            <p className={styles.cardBody}>Mondays · 4:00pm</p>
          </div>
        </div>
      )}
    </div>
  )
}
