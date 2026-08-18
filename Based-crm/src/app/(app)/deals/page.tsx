import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DealsClient } from "@/components/deals-client";

export const metadata = { title: "Deals — Based CRM" };

export default async function DealsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <DealsClient />;
}
