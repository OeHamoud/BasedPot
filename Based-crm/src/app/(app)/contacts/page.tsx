import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ContactsClient } from "@/components/contacts-client";

export const metadata = { title: "Contacts — Based CRM" };

export default async function ContactsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <ContactsClient />;
}
