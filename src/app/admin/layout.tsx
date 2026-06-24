import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Admin" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  await requireAdmin(supabase);
  return children;
}
