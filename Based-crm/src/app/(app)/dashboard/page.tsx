import { pool } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, Badge, statusTone, fmtMoney, fmtDate, Avatar, EmptyState } from "@/components/ui";

export const metadata = { title: "Dashboard — Based CRM" };

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [stats, pipeline, deals, activities, companies] = await Promise.all([
    pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM contacts) AS contacts,
         (SELECT COUNT(*)::int FROM companies) AS companies,
         (SELECT COUNT(*)::int FROM deals WHERE stage NOT IN ('won','lost')) AS open_deals,
         (SELECT COALESCE(SUM(value),0)::numeric FROM deals WHERE stage NOT IN ('won','lost')) AS open_value,
         (SELECT COALESCE(SUM(value),0)::numeric FROM deals WHERE stage = 'won') AS won_value`
    ),
    pool.query(
      `SELECT stage, COUNT(*)::int AS count, COALESCE(SUM(value),0)::numeric AS value
       FROM deals GROUP BY stage`
    ),
    pool.query(
      `SELECT d.id, d.title, d.value, d.stage, d.expected_close, co.name AS company_name
       FROM deals d LEFT JOIN companies co ON co.id = d.company_id
       WHERE d.stage NOT IN ('won','lost')
       ORDER BY d.value DESC LIMIT 6`
    ),
    pool.query(
      `SELECT a.id, a.kind, a.subject, a.created_at, u.name AS author_name,
              CONCAT(c.first_name, ' ', c.last_name) AS contact_name
       FROM activities a
       LEFT JOIN users u ON u.id = a.author_id
       LEFT JOIN contacts c ON c.id = a.contact_id
       ORDER BY a.created_at DESC LIMIT 6`
    ),
    pool.query(
      `SELECT co.id, co.name, co.industry, COUNT(c.id)::int AS contact_count
       FROM companies co LEFT JOIN contacts c ON c.company_id = co.id
       GROUP BY co.id ORDER BY contact_count DESC, co.name LIMIT 5`
    ),
  ]);

  const s = stats.rows[0];
  const stageOrder = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];
  type StageRow = { stage: string; count: number; value: string | number };
  const byStage = new Map(pipeline.rows.map((r) => [r.stage, r as StageRow]));
  const maxCount = Math.max(1, ...pipeline.rows.map((r) => (r as StageRow).count));

  const kindIcon: Record<string, string> = { note: "✎", call: "☏", email: "✉", meeting: "◉" };

  const statCards = [
    { label: "Contacts", value: s.contacts, icon: "👥", tint: "from-sky-500 to-blue-600" },
    { label: "Companies", value: s.companies, icon: "🏢", tint: "from-violet-500 to-purple-600" },
    { label: "Open deals", value: s.open_deals, icon: "💼", tint: "from-amber-500 to-orange-600" },
    { label: "Pipeline value", value: fmtMoney(s.open_value), icon: "◆", tint: "from-emerald-500 to-teal-600" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Welcome back, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Here’s what’s happening across your pipeline.
          </p>
        </div>
        <Card className="flex items-center gap-3 px-4 py-2.5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Won to date</p>
            <p className="text-lg font-bold text-emerald-600">{fmtMoney(s.won_value)}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((c) => (
          <Card key={c.label} className="p-5">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${c.tint} text-lg text-white shadow-sm`}
              >
                {c.icon}
              </span>
              <div>
                <p className="text-xs font-medium text-ink-500">{c.label}</p>
                <p className="text-xl font-bold tracking-tight text-ink-900">{c.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Pipeline by stage</h2>
          <div className="space-y-3">
            {stageOrder.map((stage) => {
              const row = byStage.get(stage);
              if (!row) return null;
              return (
                <div key={stage}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium capitalize text-ink-700">{stage}</span>
                    <span className="text-ink-500">
                      {row.count} · <span className="font-semibold text-ink-800">{fmtMoney(row.value)}</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className={`h-full rounded-full ${
                        stage === "won"
                          ? "bg-emerald-500"
                          : stage === "lost"
                            ? "bg-rose-400"
                            : stage === "negotiation"
                              ? "bg-amber-500"
                              : "bg-brand-500"
                      }`}
                      style={{ width: `${Math.max(4, (row.count / maxCount) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-900">Top open deals</h2>
            </div>
            {deals.rows.length === 0 ? (
              <EmptyState title="No open deals" hint="Create your first deal from the Deals tab." />
            ) : (
              <div className="divide-y divide-ink-100">
                {deals.rows.map((d: { id: number; title: string; stage: string; value: string | number; expected_close: string | null; company_name: string | null }) => (
                  <div key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-800">{d.title}</p>
                      <p className="truncate text-xs text-ink-500">
                        {d.company_name ?? "No company"} · closes {fmtDate(d.expected_close)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={statusTone(d.stage)}>{d.stage}</Badge>
                      <span className="text-sm font-semibold text-ink-800">{fmtMoney(d.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-ink-900">Recent activity</h2>
            {activities.rows.length === 0 ? (
              <p className="text-sm text-ink-500">No activity yet.</p>
            ) : (
              <ul className="space-y-4">
                {activities.rows.map((a: { id: number; kind: string; subject: string; created_at: string; author_name: string | null; contact_name: string | null }) => (
                  <li key={a.id} className="flex gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm text-brand-700">
                      {kindIcon[a.kind] ?? "✎"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug text-ink-800">{a.subject}</p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {a.author_name ?? "Someone"} · {fmtDate(a.created_at)}
                        {a.contact_name ? ` · ${a.contact_name}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-ink-900">Companies with most contacts</h2>
            {companies.rows.length === 0 ? (
              <p className="text-sm text-ink-500">No companies yet.</p>
            ) : (
              <ul className="space-y-3">
                {companies.rows.map((c: { id: number; name: string; industry: string | null; contact_count: number }) => (
                  <li key={c.id} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={c.name} className="h-7 w-7 text-[10px]" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink-800">{c.name}</p>
                        <p className="text-xs text-ink-500">{c.industry ?? "—"}</p>
                      </div>
                    </div>
                    <Badge tone="neutral">
                      {c.contact_count} contact{c.contact_count === 1 ? "" : "s"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
