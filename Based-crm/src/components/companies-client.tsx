"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Company } from "@/lib/types";
import {
  Card, PageHeader, Button, Input, Textarea, Field, Badge, EmptyState, Notice, Avatar,
} from "@/components/ui";

type FormState = {
  name: string;
  industry: string;
  website: string;
  phone: string;
  city: string;
  country: string;
  notes: string;
};

const emptyForm: FormState = {
  name: "", industry: "", website: "", phone: "", city: "", country: "", notes: "",
};

export function CompaniesClient() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function fetchCompanies() {
    return (await api.get<{ companies: Company[] }>("/api/companies")).companies;
  }

  async function load() {
    try {
      setCompanies(await fetchCompanies());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load companies");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const companies = await fetchCompanies();
        if (!cancelled) {
          setCompanies(companies);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load companies");
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
    if (!q) return companies;
    return companies.filter((c) =>
      `${c.name} ${c.industry ?? ""} ${c.city ?? ""} ${c.country ?? ""}`.toLowerCase().includes(q)
    );
  }, [companies, query]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(c: Company) {
    setEditing(c);
    setForm({
      name: c.name, industry: c.industry ?? "", website: c.website ?? "",
      phone: c.phone ?? "", city: c.city ?? "", country: c.country ?? "", notes: c.notes ?? "",
    });
    setFormOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await api.patch(`/api/companies/${editing.id}`, form);
      } else {
        await api.post("/api/companies", form);
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: Company) {
    if (!window.confirm(`Delete ${c.name}? Contacts linked to it will be kept but unlinked.`)) return;
    try {
      await api.del(`/api/companies/${c.id}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  }

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <PageHeader
        title="Companies"
        subtitle={`${companies.length} accounts`}
        action={<Button onClick={openCreate}>+ Add company</Button>}
      />

      {error && !formOpen ? <div className="mb-4"><Notice>{error}</Notice></div> : null}

      <Card className="mb-4 p-4">
        <Input
          placeholder="Search companies…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
      </Card>

      {formOpen ? (
        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-base font-semibold text-ink-900">
            {editing ? `Edit ${editing.name}` : "Add a company"}
          </h2>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Name">
              <Input required value={form.name} onChange={set("name")} />
            </Field>
            <Field label="Industry">
              <Input value={form.industry} onChange={set("industry")} placeholder="Technology" />
            </Field>
            <Field label="Website">
              <Input value={form.website} onChange={set("website")} placeholder="company.com" />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={set("phone")} placeholder="+1 555 000 0000" />
            </Field>
            <Field label="City">
              <Input value={form.city} onChange={set("city")} placeholder="New York" />
            </Field>
            <Field label="Country">
              <Input value={form.country} onChange={set("country")} placeholder="USA" />
            </Field>
            <Field label="Notes" className="sm:col-span-2 lg:col-span-3">
              <Textarea rows={2} value={form.notes} onChange={set("notes")} placeholder="About the company…" />
            </Field>
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save changes" : "Create company"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {loading ? (
        <Card className="p-10 text-center text-sm text-ink-500">Loading companies…</Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query ? "No companies match" : "No companies yet"}
          hint={query ? "Try a different search." : "Add your first company to get started."}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="flex flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={c.name} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-900">{c.name}</p>
                    <p className="text-xs text-ink-500">{c.industry ?? "—"}</p>
                  </div>
                </div>
              </div>
              <div className="mb-4 space-y-1 text-sm text-ink-600">
                {c.website ? <p>🌐 {c.website}</p> : null}
                {c.phone ? <p>☏ {c.phone}</p> : null}
                {c.city || c.country ? <p>📍 {[c.city, c.country].filter(Boolean).join(", ")}</p> : null}
              </div>
              {c.notes ? <p className="mb-4 line-clamp-2 text-xs text-ink-500">{c.notes}</p> : null}
              <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-3">
                <Badge tone="neutral">
                  {c.contact_count ?? 0} contact{(c.contact_count ?? 0) === 1 ? "" : "s"}
                </Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" className="px-2.5 py-1.5 text-xs" onClick={() => openEdit(c)}>Edit</Button>
                  <Button variant="ghost" className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50" onClick={() => remove(c)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
