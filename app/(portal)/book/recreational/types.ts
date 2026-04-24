export type ClassCardItem = {
  id: string;
  classId?: string;
  selectionKey?: string;
  name: string;
  startTime: string;
  endTime: string;
  durationMinutes: number | null;
  bookedDurationMinutes?: number | null;
  minAge: number | null;
  maxAge: number | null;
  capacity: number | null;
  spotsTaken: number;
  spotsLeft: number | null;
  isFull: boolean;
};

export type WeekdayGroup = {
  weekday: string;
  classes: ClassCardItem[];
};

export type SelectedClassDetail = {
  id: string;
  classId?: string;
  selectionKey?: string;
  name: string;
  weekday: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number | null;
  bookedDurationMinutes?: number | null;
  isFull: boolean;
};
