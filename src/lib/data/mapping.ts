// Convert between the app's camelCase types and Postgres snake_case rows.

const toSnake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const toCamel = (k: string) => k.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

export function rowToObj<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) out[toCamel(k)] = v === null ? undefined : v;
  return out as T;
}

export function objToRow(obj: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[toSnake(k)] = v;
  return out;
}

/** Table name for each workspace collection. */
export const TABLES = {
  team: "team_members",
  families: "families",
  guardians: "guardians",
  students: "students",
  tutors: "tutors",
  enquiries: "enquiries",
  lessons: "lessons",
  packages: "packages",
  credits: "credit_balances",
  invoices: "invoices",
  reports: "progress_reports",
  goals: "goals",
  automations: "automations",
  runs: "automation_runs",
  messages: "messages",
  tasks: "tasks",
} as const;
