import { forwardRef } from "react";

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border border-ink-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-ink-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const styles = {
    primary:
      "bg-brand-600 text-white hover:bg-brand-700 shadow-sm focus-visible:outline-brand-700",
    secondary:
      "bg-white text-ink-700 border border-ink-300 hover:bg-ink-50 focus-visible:outline-ink-400",
    ghost: "text-ink-600 hover:bg-ink-100 focus-visible:outline-ink-400",
    danger: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-700",
  }[variant];
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
      {...props}
    />
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-2 focus:outline-brand-500/40 ${className}`}
        {...props}
      />
    );
  }
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = "", children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={`w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-2 focus:outline-brand-500/40 ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);

export function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-2 focus:outline-brand-500/40 ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "brand" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "bg-ink-100 text-ink-700",
    brand: "bg-brand-100 text-brand-800",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-rose-100 text-rose-800",
    info: "bg-sky-100 text-sky-800",
  }[tone];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${tones}`}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string) {
  switch (status) {
    case "won":
    case "customer":
      return "success";
    case "negotiation":
    case "proposal":
      return "warning";
    case "lead":
      return "info";
    case "qualified":
      return "brand";
    case "lost":
    case "churned":
      return "danger";
    case "prospect":
      return "neutral";
    default:
      return "neutral";
  }
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-300 bg-ink-50/50 px-6 py-12 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-lg">
        ✦
      </div>
      <p className="text-sm font-semibold text-ink-700">{title}</p>
      {hint ? <p className="mt-1 text-sm text-ink-500">{hint}</p> : null}
    </div>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
      {children}
    </div>
  );
}

export function fmtMoney(value: string | number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ name, className = "h-9 w-9 text-xs" }: { name: string; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-semibold text-white ${className}`}
    >
      {initials(name)}
    </span>
  );
}
