<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { groupByProblem, PROBLEMS, type Problem } from '#lib/kb/problems';
  import { tenantOf } from '#lib/kb/locales';

  // `issues` maps a problem to its ticket in the issue tracker: { parser: 'https://…/issues/1', … }
  let { ticket, issues = {} }: { ticket: number; issues?: Partial<Record<Problem, string>> } = $props();

  const rows = $derived(reports as Report[]);
  const merged = $derived(uniqueById(rows).filter((r) => r.mergedInto === ticket));
  const groups = $derived(groupByProblem(merged, tenantOf, notes.oneDayMove));
  const fmt = (n: Record<string, number>) =>
    Object.entries(n)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ×${v}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket} ({rows.length - merged.length} repeated rows in the export
  dropped) · <strong>{groups.length}</strong> problems
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>channels</th><th>intake tagged</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code><br /><span class="t">{PROBLEMS[g.problem].title}</span></td>
        <td class="n">{g.reports.length}</td>
        <td class="small">{g.tenants.length}: {g.tenants.join(', ')}</td>
        <td class="small">{fmt(g.channels)}</td>
        <td class="small">{fmt(g.taggedAs)}</td>
        <td class="small">{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if issues[g.problem]}<a href={issues[g.problem]}>{issues[g.problem]?.replace(/.*\/issues\//, '#')}</a>{:else}—{/if}</td>
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr><td>total</td><td class="n">{groups.reduce((n, g) => n + g.reports.length, 0)}</td><td colspan="5"></td></tr>
  </tfoot>
</table>

{#each groups.filter((g) => g.reports.length <= 10) as g (g.problem)}
  <p class="small"><code>{g.problem}</code> reports: {g.reports.map((r) => r.id).join(', ')}</p>
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .n { font-weight: 600; text-align: right; }
  .t { color: var(--muted); font-size: 0.85em; }
  .small { color: var(--muted); font-size: 0.85em; }
  tfoot td { font-weight: 600; }
</style>
