import 'server-only'

import { createServerClient } from '@supabase/ssr'

export type MedicalInformationRow = {
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

export async function getMedicalInfoForChildren(
  childIds: string[]
): Promise<Record<string, MedicalInformationRow>> {
  if (!childIds.length) {
    return {}
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const serviceRole = createServerClient(supabaseUrl!, supabaseServiceRoleKey!, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
  })

  const { data, error } = await serviceRole
    .from('MedicalInformation')
    .select(
      'childId,medicalConditions,medications,disabilities,behaviouralConditions,allergies,dietaryNeeds,doctorName,surgeryAddress,surgeryTelephone'
    )
    .in('childId', childIds)

  if (error) {
    throw new Error(error.message)
  }

  const map: Record<string, MedicalInformationRow> = {}
  ;(data ?? []).forEach((row) => {
    if (!map[row.childId]) {
      map[row.childId] = {
        childId: row.childId,
        medicalConditions: row.medicalConditions ?? null,
        medications: row.medications ?? null,
        disabilities: row.disabilities ?? null,
        behaviouralConditions: row.behaviouralConditions ?? null,
        allergies: row.allergies ?? null,
        dietaryNeeds: row.dietaryNeeds ?? null,
        doctorName: row.doctorName ?? null,
        surgeryAddress: row.surgeryAddress ?? null,
        surgeryTelephone: row.surgeryTelephone ?? null,
      }
    }
  })

  return map
}
