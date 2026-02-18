export type ClassCardItem = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  durationMinutes: number | null;
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
  name: string;
  weekday: string;
  startTime: string;
  durationMinutes: number | null;
  isFull: boolean;
};
