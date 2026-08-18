"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Contact, Company } from "@/lib/types";
import {
  Card, PageHeader, Button, Input, Select, Textarea, Field, Badge, statusTone,
  EmptyState, Notice, Avatar,
} from "@/components/ui";

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  job_title: string;
  status: string;
  company_id: string;
  notes: string;
};

const emptyForm: FormState = {
  first_name: "", last_name: "", email: "", phone: "", job_title: "",
  status: "lead", company_id: "", notes: "",
};

export function ContactsClient() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  async function fetchData() {
    const [c, co] = await Promise.all([
      api.get<{ contacts: Contact[] }>("/api/contacts"),
      api.get<{ companies: Company[] }>("/api/companies"),
    ]);
    return { contacts: c.contacts, companies: co.companies };
  }

  async function load() {
    try {
      const { contacts, companies } = await fetchData();
      setContacts(contacts);
      setCompanies(companies);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { contacts, companies } = await fetchData();
        if (!cancelled) {
          setContacts(contacts);
          setCompanies(companies);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load contacts");
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
    return contacts.filter((c) => {
      const hay = `${c.first_name} ${c.last_name} ${c.email ?? ""} ${c.company_name ?? ""} ${c.job_title ?? ""}`.toLowerCase();
      const matchesQ = !q || hay.includes(q);
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesQ && matchesStatus;
    });
  }, [contacts, query, statusFilter]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(c: Contact) {
    setEditing(c);
    setForm({
      first_name: c.first_name, last_name: c.last_name, email: c.email ?? "",
      phone: c.phone ?? "", job_title: c.job_title ?? "", status: c.status,
      company_id: c.company_id ? String(c.company_id) : "", notes: c.notes ?? "",
    });
    setFormOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        company_id: form.company_id ? Number(form.company_id) : null,
      };
      if (editing) {
        await api.patch(`/api/contacts/${editing.id}`, payload);
      } else {
        await api.post("/api/contacts", payload);
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: Contact) {
    if (!window.confirm(`Delete ${c.first_name} ${c.last_name}? This cannot be undone.`)) return;
    try {
      await api.del(`/api/contacts/${c.id}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  }

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle={`${contacts.length} people in your address book`}
        action={<Button onClick={openCreate}>+ Add contact</Button>}
      />

      {error && !formOpen ? <div className="mb-4"><Notice>{error}</Notice></div> : null}

      <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
        <Input
          placeholder="Search contacts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
          <option value="all">All statuses</option>
          <option value="lead">Lead</option>
          <option value="prospect">Prospect</option>
          <option value="customer">Customer</option>
          <option value="churned">Churned</option>
        </Select>
      </Card>

      {formOpen ? (
        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-base font-semibold text-ink-900">
            {editing ? `Edit ${editing.first_name} ${editing.last_name}` : "Add a contact"}
          </h2>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="First name">
              <Input required value={form.first_name} onChange={set("first_name")} />
            </Field>
            <Field label="Last name">
              <Input required value={form.last_name} onChange={set("last_name")} />
            </Field>
            <Field label="Job title">
              <Input value={form.job_title} onChange={set("job_title")} placeholder="VP Sales" />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={set("email")} placeholder="name@company.com" />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={set("phone")} placeholder="+1 555 000 0000" />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={set("status")}>
                <option value="lead">Lead</option>
                <option value="prospect">Prospect</option>
                <option value="customer">Customer</option>
                <option value="churned">Churned</option>
              </Select>
            </Field>
            <Field label="Company">
              <Select value={form.company_id} onChange={set("company_id")}>
                <option value="">— None —</option>
                {companies.map((co) => (
                  <option key={co.id} value={co.id}>{co.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea rows={2} value={form.notes} onChange={set("notes")} placeholder="Anything worth remembering…" />
            </Field>
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save changes" : "Create contact"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {loading ? (
        <Card className="p-10 text-center text-sm text-ink-500">Loading contacts…</Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query || statusFilter !== "all" ? "No contacts match" : "No contacts yet"}
          hint={query || statusFilter !== "all" ? "Try a different search or filter." : "Add your first contact to get started."}
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Title</th>
                <th className="hidden px-5 py-3 font-semibold md:table-cell">Email</th>
                <th className="hidden px-5 py-3 font-semibold lg:table-cell">Company</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-brand-50/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${c.first_name} ${c.last_name}`} className="h-8 w-8 text-[11px]" />
                      <div>
                        <p className="font-medium text-ink-900">{c.first_name} {c.last_name}</p>
                        <p className="text-xs text-ink-500 md:hidden">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-600">{c.job_title ?? "—"}</td>
                  <td className="hidden px-5 py-3 text-ink-600 md:table-cell">{c.email ?? "—"}</td>
                  <td className="hidden px-5 py-3 text-ink-600 lg:table-cell">{c.company_name ?? "—"}</td>
                  <td className="px-5 py-3"><Badge tone={statusTone(c.status)}>{c.status}</Badge></td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" className="px-2.5 py-1.5 text-xs" onClick={() => openEdit(c)}>Edit</Button>
                      <Button variant="ghost" className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50" onClick={() => remove(c)}>Delete</Button>
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
