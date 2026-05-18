export type SummerCampDay = {
  id: string;
  label: string;
};

export type SummerCampWeek = {
  id: string;
  label: string;
  dateRange: string;
  days: SummerCampDay[];
};

export type SummerCampConfig = {
  slug: string;
  title: string;
  year: number;
  ageRequirement: string;
  maxClassSize: number;
  requiresPackedLunch: boolean;
  pricing: Record<number, number>;
  weeks: SummerCampWeek[];
};

export const SUMMER_CAMP_2026: SummerCampConfig = {
  slug: "summer-camps-2026",
  title: "Summer Camps 2026",
  year: 2026,
  ageRequirement: "Ages 4+",
  maxClassSize: 32,
  requiresPackedLunch: true,
  pricing: {
    1: 40,
    2: 70,
    3: 105,
    4: 120,
    5: 130,
  },
  weeks: [
    {
      id: "week-1",
      label: "Week 1",
      dateRange: "6th - 10th July",
      days: [
        { id: "2026-07-06", label: "Monday 6th July" },
        { id: "2026-07-07", label: "Tuesday 7th July" },
        { id: "2026-07-08", label: "Wednesday 8th July" },
        { id: "2026-07-09", label: "Thursday 9th July" },
        { id: "2026-07-10", label: "Friday 10th July" },
      ],
    },
    {
      id: "week-2",
      label: "Week 2",
      dateRange: "13th - 17th July",
      days: [
        { id: "2026-07-13", label: "Monday 13th July" },
        { id: "2026-07-14", label: "Tuesday 14th July" },
        { id: "2026-07-15", label: "Wednesday 15th July" },
        { id: "2026-07-16", label: "Thursday 16th July" },
        { id: "2026-07-17", label: "Friday 17th July" },
      ],
    },
    {
      id: "week-3",
      label: "Week 3",
      dateRange: "27th - 31st July",
      days: [
        { id: "2026-07-27", label: "Monday 27th July" },
        { id: "2026-07-28", label: "Tuesday 28th July" },
        { id: "2026-07-29", label: "Wednesday 29th July" },
        { id: "2026-07-30", label: "Thursday 30th July" },
        { id: "2026-07-31", label: "Friday 31st July" },
      ],
    },
  ],
};

export type SummerCampSelectedDaysByWeek = Record<string, string[]>;

export type SummerCampWeekSelectionSummary = {
  weekId: string;
  weekLabel: string;
  dateRange: string;
  selectedDays: SummerCampDay[];
  selectedDayCount: number;
  price: number;
};

export function calculateSummerCampWeekPrice(selectedDayCount: number): number {
  const pricing = {
    0: 0,
    1: 40,
    2: 70,
    3: 105,
    4: 120,
    5: 130,
  } as const;

  return pricing[selectedDayCount as keyof typeof pricing] ?? 0;
}

export function calculateSummerCampTotal(
  selectedDaysByWeek: SummerCampSelectedDaysByWeek
): number {
  return Object.values(selectedDaysByWeek).reduce((total, selectedDays) => {
    return total + calculateSummerCampWeekPrice(selectedDays.length);
  }, 0);
}

export function getSummerCampDayIds(config: SummerCampConfig): Set<string> {
  return new Set(config.weeks.flatMap((week) => week.days.map((day) => day.id)));
}

export function buildSummerCampWeekMap(
  config: SummerCampConfig
): Map<string, SummerCampWeek> {
  return new Map(config.weeks.map((week) => [week.id, week]));
}

export function parseSummerCampSelection(rawDays: string | undefined): string[] {
  const uniqueDays: string[] = [];
  const seen = new Set<string>();

  (rawDays ?? "")
    .split(",")
    .map((dayId) => dayId.trim())
    .filter(Boolean)
    .forEach((dayId) => {
      if (seen.has(dayId)) return;
      seen.add(dayId);
      uniqueDays.push(dayId);
    });

  return uniqueDays;
}

export function buildSummerCampSelectionByWeek(
  config: SummerCampConfig,
  selectedDayIds: string[]
): SummerCampSelectedDaysByWeek {
  const selectedSet = new Set(selectedDayIds);

  return config.weeks.reduce<SummerCampSelectedDaysByWeek>((acc, week) => {
    acc[week.id] = week.days
      .map((day) => day.id)
      .filter((dayId) => selectedSet.has(dayId));
    return acc;
  }, {});
}

export function validateSummerCampSelection(
  config: SummerCampConfig,
  selectedDayIds: string[]
): string[] {
  const errors: string[] = [];
  const validDayIds = getSummerCampDayIds(config);
  const selectedByWeek = buildSummerCampSelectionByWeek(config, selectedDayIds);

  if (selectedDayIds.length === 0) {
    errors.push("Select at least one day before continuing.");
  }

  const invalidDayIds = selectedDayIds.filter((dayId) => !validDayIds.has(dayId));
  if (invalidDayIds.length > 0) {
    errors.push("One or more selected days are not valid for Summer Camps 2026.");
  }

  config.weeks.forEach((week) => {
    if ((selectedByWeek[week.id] ?? []).length > week.days.length) {
      errors.push(`${week.label} cannot exceed ${week.days.length} selected days.`);
    }
  });

  return errors;
}

export function getSummerCampSelectionSummary(
  config: SummerCampConfig,
  selectedDayIds: string[]
): SummerCampWeekSelectionSummary[] {
  const selectedSet = new Set(selectedDayIds);

  return config.weeks
    .map((week) => {
      const selectedDays = week.days.filter((day) => selectedSet.has(day.id));
      return {
        weekId: week.id,
        weekLabel: week.label,
        dateRange: week.dateRange,
        selectedDays,
        selectedDayCount: selectedDays.length,
        price: calculateSummerCampWeekPrice(selectedDays.length),
      };
    })
    .filter((week) => week.selectedDayCount > 0);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
}
