export type CompetitionBookingSelection = {
  classId: string;
  bookedDurationMinutes: number;
};

export function buildCompetitionSelectionKey(selection: CompetitionBookingSelection): string {
  return `${selection.classId}:${selection.bookedDurationMinutes}`;
}
