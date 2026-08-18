import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CompaniesClient } from "@/components/companies-client";

export const metadata = { title: "Companies — Based CRM" };

export default async function CompaniesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <CompaniesClient />;
}
