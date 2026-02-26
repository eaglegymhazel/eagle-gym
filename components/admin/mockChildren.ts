export type ChildStatus = "Active" | "Inactive";

export type Child = {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  dateOfBirth: string;
  accountEmail: string;
  group: string;
  attendingClasses?: string[];
  lastAttended: string;
  lastAttendedClass?: string;
  status: ChildStatus;
};

const FIRST_NAMES = [
  "Olivia",
  "Amelia",
  "Ava",
  "Mia",
  "Sophia",
  "Isla",
  "Harper",
  "Lily",
  "Freya",
  "Emily",
  "Grace",
  "Ella",
  "Ivy",
  "Evie",
  "Chloe",
  "Noah",
  "Oliver",
  "George",
  "Arthur",
  "Leo",
  "Theo",
  "Oscar",
  "Harry",
  "Archie",
  "Henry",
  "Hudson",
  "Ethan",
  "Lucas",
  "Mason",
  "Jack",
];

const LAST_NAMES = [
  "Smith",
  "Jones",
  "Taylor",
  "Brown",
  "Williams",
  "Wilson",
  "Johnson",
  "Davies",
  "Patel",
  "Thomas",
  "Roberts",
  "Walker",
  "Wright",
  "Thompson",
  "White",
  "Edwards",
  "Hughes",
  "Green",
  "Hall",
  "Wood",
];

const GROUPS = [
  "Foundation",
  "Recreational A",
  "Recreational B",
  "Skills Development",
  "Advanced Squad",
  "Tumbling",
];

const LAST_ATTENDED = [
  "Mon 16:00",
  "Mon 17:00",
  "Tue 16:30",
  "Tue 18:00",
  "Wed 17:00",
  "Thu 16:30",
  "Fri 17:30",
  "Sat 10:00",
];

export function generateMockChildren(count = 300): Child[] {
  return Array.from({ length: count }, (_, index) => {
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
    const lastName = LAST_NAMES[Math.floor(index / 3) % LAST_NAMES.length];
    const group = GROUPS[index % GROUPS.length];
    const lastAttended = LAST_ATTENDED[index % LAST_ATTENDED.length];
    const age = 5 + (index % 12);
    const birthYear = 2026 - age;
    const dobMonth = String((index % 12) + 1).padStart(2, "0");
    const dobDay = String((index % 27) + 1).padStart(2, "0");
    const dateOfBirth = `${birthYear}-${dobMonth}-${dobDay}`;
    const accountEmail = `family${(index % 90) + 1}@example.com`;
    const status: ChildStatus = index % 7 === 0 ? "Inactive" : "Active";

    return {
      id: `child-${String(index + 1).padStart(3, "0")}`,
      firstName,
      lastName,
      age,
      dateOfBirth,
      accountEmail,
      group,
      attendingClasses: [group],
      lastAttended,
      lastAttendedClass: group,
      status,
    };
  });
}

export const MOCK_CHILDREN: Child[] = generateMockChildren(300);
