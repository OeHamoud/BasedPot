"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Deal, Company, Contact } from "@/lib/types";
import {
  Card, PageHeader, Button, Input, Select, Textarea, Field,
  EmptyState, Notice, fmtMoney, fmtDate,
} from "@/components/ui";

type FormState = {
  title: string;
  value: string;
  stage: string;
  company_id: string;
  contact_id: string;
  expected_close: string;
  notes: string;
};

const emptyForm: FormState = {
  title: "", value: "", stage: "lead", company_id: "", contact_id: "", expected_close: "", notes: "",
};

export function DealsClient() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    const [d, co, c] = await Promise.all([
      api.get<{ deals: Deal[] }>("/api/deals"),
      api.get<{ companies: Company[] }>("/api/companies"),
      api.get<{ contacts: Contact[] }>("/api/contacts"),
    ]);
    return { deals: d.deals, companies: co.companies, contacts: c.contacts };
  }

  async function load() {
    try {
      const { deals, companies, contacts } = await fetchData();
      setDeals(deals);
      setCompanies(companies);
      setContacts(contacts);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load deals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { deals, companies, contacts } = await fetchData();
        if (!cancelled) {
          setDeals(deals);
          setCompanies(companies);
          setContacts(contacts);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load deals");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return deals.filter((d) => {
      const hay = `${d.title} ${d.company_name ?? ""} ${d.contact_name ?? ""}`.toLowerCase();
      const matchesQ = !q || hay.includes(q);
      const matchesStage = stageFilter === "all" || d.stage === stageFilter;
      return matchesQ && matchesStage;
    });
  }, [deals, query, stageFilter]);

  const totalValue = useMemo(
    () => filtered.filter((d) => d.stage !== "won" && d.stage !== "lost")
      .reduce((sum, d) => sum + Number(d.value), 0),
    [filtered]
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(d: Deal) {
    setEditing(d);
    setForm({
      title: d.title, value: String(d.value), stage: d.stage,
      company_id: d.company_id ? String(d.company_id) : "",
      contact_id: d.contact_id ? String(d.contact_id) : "",
      expected_close: d.expected_close ?? "", notes: d.notes ?? "",
    });
    setFormOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        value: Number(form.value) || 0,
        stage: form.stage,
        company_id: form.company_id ? Number(form.company_id) : null,
        contact_id: form.contact_id ? Number(form.contact_id) : null,
        expected_close: form.expected_close || null,
        notes: form.notes,
      };
      if (editing) {
        await api.patch(`/api/deals/${editing.id}`, payload);
      } else {
        await api.post("/api/deals", payload);
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(d: Deal) {
    if (!window.confirm(`Delete "${d.title}"? This cannot be undone.`)) return;
    try {
      await api.del(`/api/deals/${d.id}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  }

  async function quickStage(d: Deal, stage: string) {
    try {
      await api.patch(`/api/deals/${d.id}`, { stage });
      setDeals((prev) => prev.map((x) => (x.id === d.id ? { ...x, stage } : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  }

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const stageOptions = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];

  return (
    <div>
      <PageHeader
        title="Deals"
        subtitle={`${filtered.length} deals · ${fmtMoney(totalValue)} open`}
        action={<Button onClick={openCreate}>+ Add deal</Button>}
      />

      {error && !formOpen ? <div className="mb-4"><Notice>{error}</Notice></div> : null}

      <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
        <Input
          placeholder="Search deals…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="w-44">
          <option value="all">All stages</option>
          {stageOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </Card>

      {formOpen ? (
        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-base font-semibold text-ink-900">
            {editing ? `Edit "${editing.title}"` : "Add a deal"}
          </h2>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Title" className="sm:col-span-2">
              <Input required value={form.title} onChange={set("title")} placeholder="Annual contract renewal" />
            </Field>
            <Field label="Value (USD)">
              <Input type="number" min="0" step="0.01" value={form.value} onChange={set("value")} placeholder="50000" />
            </Field>
            <Field label="Stage">
              <Select value={form.stage} onChange={set("stage")}>
                {stageOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Company">
              <Select value={form.company_id} onChange={set("company_id")}>
                <option value="">— None —</option>
                {companies.map((co) => <option key={co.id} value={co.id}>{co.name}</option>)}
              </Select>
            </Field>
            <Field label="Contact">
              <Select value={form.contact_id} onChange={set("contact_id")}>
                <option value="">— None —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Expected close">
              <Input type="date" value={form.expected_close} onChange={set("expected_close")} />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea rows={2} value={form.notes} onChange={set("notes")} placeholder="Next steps, blockers…" />
            </Field>
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save changes" : "Create deal"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {loading ? (
        <Card className="p-10 text-center text-sm text-ink-500">Loading deals…</Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query || stageFilter !== "all" ? "No deals match" : "No deals yet"}
          hint={query || stageFilter !== "all" ? "Try a different search or filter." : "Create your first deal to track the pipeline."}
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                <th className="px-5 py-3 font-semibold">Deal</th>
                <th className="hidden px-5 py-3 font-semibold md:table-cell">Company</th>
                <th className="hidden px-5 py-3 font-semibold lg:table-cell">Contact</th>
                <th className="px-5 py-3 font-semibold">Stage</th>
                <th className="hidden px-5 py-3 font-semibold lg:table-cell">Close</th>
                <th className="px-5 py-3 text-right font-semibold">Value</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map((d) => (
                <tr key={d.id} className="transition-colors hover:bg-brand-50/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink-900">{d.title}</p>
                    <p className="text-xs text-ink-500 lg:hidden">
                      {[d.company_name, d.contact_name].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </td>
                  <td className="hidden px-5 py-3 text-ink-600 md:table-cell">{d.company_name ?? "—"}</td>
                  <td className="hidden px-5 py-3 text-ink-600 lg:table-cell">{d.contact_name ?? "—"}</td>
                  <td className="px-5 py-3">
                    <Select
                      value={d.stage}
                      onChange={(e) => quickStage(d, e.target.value)}
                      className="w-32 py-1.5 text-xs"
                    >
                      {stageOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </td>
                  <td className="hidden px-5 py-3 text-ink-600 lg:table-cell">{fmtDate(d.expected_close)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-ink-900">{fmtMoney(d.value)}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" className="px-2.5 py-1.5 text-xs" onClick={() => openEdit(d)}>Edit</Button>
                      <Button variant="ghost" className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50" onClick={() => remove(d)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
