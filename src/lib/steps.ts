// Step definitions and gating logic.
export const STEPS = [1, 2, 3, 4, 5, 6, 7] as const;
export type Step = (typeof STEPS)[number];

export const STEP_KEYS: Record<Step, `step.${Step}`> = {
  1: "step.1",
  2: "step.2",
  3: "step.3",
  4: "step.4",
  5: "step.5",
  6: "step.6",
  7: "step.7",
};

export type StepStatus = "locked" | "in_progress" | "submitted" | "approved";

export interface ProgressRow {
  step: number;
  status: StepStatus;
}

export function buildStepMap(rows: ProgressRow[]) {
  const map = new Map<number, StepStatus>();
  STEPS.forEach((s) => map.set(s, "locked"));
  rows.forEach((r) => map.set(r.step, r.status));
  // Step 1 is always at least in_progress
  if (map.get(1) === "locked") map.set(1, "in_progress");
  // Unlock next step after current is approved
  for (let s = 2; s <= 7; s++) {
    if (map.get(s - 1) === "approved" && map.get(s) === "locked") {
      map.set(s as Step, "in_progress");
    }
  }
  return map;
}

export function progressPct(map: Map<number, StepStatus>) {
  const done = STEPS.filter((s) => map.get(s) === "approved").length;
  return { done, total: STEPS.length, pct: Math.round((done / STEPS.length) * 100) };
}
