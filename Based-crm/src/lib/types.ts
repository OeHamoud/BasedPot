export type User = {
  id: number;
  name: string;
  email: string;
  created_at: string;
};

export type Company = {
  id: number;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  created_at: string;
  contact_count?: number;
};

export type Contact = {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  status: string;
  company_id: number | null;
  notes: string | null;
  created_at: string;
  company_name?: string | null;
};

export type Deal = {
  id: number;
  title: string;
  value: string | number;
  stage: string;
  company_id: number | null;
  contact_id: number | null;
  expected_close: string | null;
  notes: string | null;
  created_at: string;
  company_name?: string | null;
  contact_name?: string | null;
};

export type Activity = {
  id: number;
  kind: string;
  subject: string;
  body: string | null;
  contact_id: number | null;
  deal_id: number | null;
  author_id: number | null;
  created_at: string;
  author_name?: string | null;
  contact_name?: string | null;
  deal_title?: string | null;
};

export const CONTACT_STATUSES = ["lead", "prospect", "customer", "churned"] as const;
export const DEAL_STAGES = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;
export const ACTIVITY_KINDS = ["note", "call", "email", "meeting"] as const;
