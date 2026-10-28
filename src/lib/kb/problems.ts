// What a big ticket really holds: one problem per fix. Builds on causes.ts.
import { causeOf, type Report, type Tenant } from '#lib/kb/causes';

// `parser` and `hint` come from causes.ts. `move` is a report whose date moved by one day without
// a day/month swap: a time-zone fault, not a date-order one. The desk read these by hand
// (desk-notes.json, oneDayMove) and counts them where causes.ts files them, under their tenant's
// cause. We count the same way, so a `move` report is in its cause's group and in `move`.
export type Problem = 'parser' | 'hint' | 'move' | 'unplaced';

export const PROBLEMS: Record<Problem, { title: string; fix: string }> = {
  parser: {
    title: 'Shared parser reads day-first dates month first',
    fix: 'Parse with the tenant locale (day first where the locale says so).',
  },
  hint: {
    title: 'booking-v3 hint says MM/DD, form reads the tenant way',
    fix: 'Make the booking-v3 hint and the form read the same order.',
  },
  move: {
    title: 'Invite date moves by one day across time zones',
    fix: 'Keep the booking time zone when the invite is built and sent.',
  },
  unplaced: { title: 'No cause on file', fix: 'Read by hand.' },
};

// Every problem a report belongs to: its cause, plus `move` when the desk read it as one.
export function problemsOf(r: Report, t: Tenant | undefined, moved: readonly string[]): Problem[] {
  const cause = causeOf(r, t) ?? 'unplaced';
  return moved.includes(r.id) ? [cause, 'move'] : [cause];
}

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: string[];
  channels: Record<string, number>;
  taggedAs: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

const tally = (xs: string[]) => xs.reduce<Record<string, number>>((n, x) => ({ ...n, [x]: (n[x] ?? 0) + 1 }), {});

export function groupByProblem(
  reports: Report[],
  tenantOf: (r: Report) => Tenant | undefined,
  moved: readonly string[],
): ProblemGroup[] {
  const by = new Map<Problem, Report[]>();
  for (const r of reports) {
    for (const p of problemsOf(r, tenantOf(r), moved)) by.set(p, [...(by.get(p) ?? []), r]);
  }
  return [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        channels: tally(rs.map((r) => r.channel)),
        taggedAs: tally(rs.map((r) => r.meta.intakeTag)),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}
